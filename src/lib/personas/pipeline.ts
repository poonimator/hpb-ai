import "server-only";

import prisma from "@/lib/db/prisma";
import { getOpenAIClient, SYSTEM_GUARDRAILS, DEFAULT_MODEL } from "@/lib/ai/openai";
import {
    buildClassificationPrompt,
    type ArchetypeSummary,
} from "@/lib/ai/prompts/persona_classification";
import {
    buildSynthesisPrompt,
    type ContributingTranscript,
} from "@/lib/ai/prompts/persona_synthesis";
import {
    buildBlueprintPrompt,
    type BlueprintTranscriptInput,
} from "@/lib/ai/prompts/persona_blueprint";
import {
    coercePersonaContent,
    type PersonaContent,
} from "@/lib/personas/types";
import { allocatePersonaNames } from "@/lib/personas/names";

/**
 * Build the "definingTraits" bullets shown to the classifier for each
 * archetype, sourced from fullContentJson when available, else falling
 * back to top-level fields like behaviours/motivations/barriers.
 */
function extractDefiningTraits(fullContent: unknown, description: string): string[] {
    const out: string[] = [];
    const push = (label: string, items?: unknown) => {
        if (Array.isArray(items)) {
            const sample = items.slice(0, 3).filter(x => typeof x === "string");
            sample.forEach(s => out.push(`${label}: ${s}`));
        }
    };
    if (fullContent && typeof fullContent === "object") {
        const f = fullContent as Record<string, unknown>;
        push("Behaviour", f.behaviours);
        push("Barrier", f.barriers);
        push("Motivation", f.motivations);
        push("Spiral", typeof f.spiral === "object" && f.spiral
            ? [(f.spiral as Record<string, unknown>).pattern].filter(Boolean) as unknown[]
            : []);
    }
    if (out.length === 0 && description) {
        out.push(description.slice(0, 240));
    }
    return out.slice(0, 8);
}

interface ClassifyArgs {
    sessionId: string;
}

/**
 * Phase A — Blueprint decision.
 *
 * Hands the AI all the transcripts (and any selected archetypes as
 * lenses), then asks it to decide how many distinct personas the data
 * can genuinely support (2–5). Each blueprint references its
 * contributing transcripts and optionally a primary archetype anchor.
 * Transcripts that don't cluster cleanly are bucketed as unclassified.
 *
 * The output is persisted to PersonaSession.blueprintJson so Phase B
 * can resume independently.
 *
 * Idempotent: existing classifications + cached blueprint are reset on
 * each run.
 */
export async function runClassificationPhase({ sessionId }: ClassifyArgs): Promise<void> {
    const session = await prisma.personaSession.findUnique({
        where: { id: sessionId },
        include: {
            subProject: { include: { project: true } },
            archetypeSession: {
                include: { archetypes: { orderBy: { order: "asc" } } },
            },
        },
    });

    if (!session) throw new Error(`PersonaSession ${sessionId} not found`);

    const subProject = session.subProject;
    const project = subProject.project;

    // Resolve the source MappingSessions → MappingTranscripts. In archetype
    // mode we fall back to the archetype session's source mappings if the
    // persona session itself didn't lock any in.
    const mappingIds: string[] = session.sourceMappingIdsJson
        ? JSON.parse(session.sourceMappingIdsJson)
        : (session.archetypeSession?.sourceMappingIdsJson
            ? JSON.parse(session.archetypeSession.sourceMappingIdsJson)
            : []);

    if (mappingIds.length === 0) {
        throw new Error("No source mapping sessions selected for this persona run.");
    }

    const transcripts = await prisma.mappingTranscript.findMany({
        where: { mappingSessionId: { in: mappingIds } },
        orderBy: { createdAt: "asc" },
    });

    if (transcripts.length === 0) {
        throw new Error("Selected mapping sessions contain no transcripts.");
    }

    // Persist the locked-in transcript ID list for staleness comparison later.
    await prisma.personaSession.update({
        where: { id: sessionId },
        data: {
            sourceMappingIdsJson: JSON.stringify(mappingIds),
            sourceTranscriptIdsJson: JSON.stringify(transcripts.map(t => t.id)),
            status: "PROCESSING_CLASSIFY",
            blueprintJson: null,
        },
    });

    // Reset previous classifications for idempotency.
    await prisma.transcriptClassification.deleteMany({
        where: { personaSessionId: sessionId },
    });

    // Resolve candidate archetypes (subset of the linked session, if any).
    const allArchetypes = session.archetypeSession?.archetypes || [];
    const selectedIds: string[] | null = session.selectedArchetypeIdsJson
        ? JSON.parse(session.selectedArchetypeIdsJson)
        : null;
    const archetypes = selectedIds && selectedIds.length > 0
        ? allArchetypes.filter(a => selectedIds.includes(a.id))
        : allArchetypes;

    const archetypeSummaries: ArchetypeSummary[] = archetypes.map(a => ({
        id: a.id,
        name: a.name,
        kicker: a.kicker,
        description: a.description,
        definingTraits: extractDefiningTraits(
            a.fullContentJson ? safeParse(a.fullContentJson) : null,
            a.description,
        ),
    }));

    const blueprintTranscripts: BlueprintTranscriptInput[] = transcripts.map(t => ({
        id: t.id,
        displayName: t.displayName,
        text: t.extractedText || "",
    }));

    const client = getOpenAIClient();

    // Single blueprint call — decides count, archetype anchors, and
    // transcript membership in one pass.
    const prompt = buildBlueprintPrompt({
        projectName: project.name,
        researchStatement: subProject.researchStatement,
        profileTarget: session.profileTarget || subProject.lifeStage,
        archetypes: archetypeSummaries,
        transcripts: blueprintTranscripts,
    });

    const resp = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
            { role: "system", content: SYSTEM_GUARDRAILS },
            { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
    });

    const rawContent = resp.choices[0]?.message?.content;
    if (!rawContent) {
        throw new Error("Blueprint phase returned empty AI response.");
    }

    const blueprint = extractBlueprint(safeParse(rawContent), transcripts.map(t => t.id), new Set(archetypes.map(a => a.id)));
    if (blueprint.personas.length === 0) {
        throw new Error("Blueprint phase did not produce any personas. Try regenerating.");
    }

    // Persist the blueprint and a TranscriptClassification per transcript
    // for the override sidebar. Each persona-bound transcript gets the
    // persona's archetype anchor (null for cluster-style); unclassified
    // transcripts get archetypeId=null + a marker rationale so the UI can
    // distinguish "in a cluster persona" from "in no persona at all".
    const classificationOps: ReturnType<typeof prisma.transcriptClassification.create>[] = [];
    for (let i = 0; i < blueprint.personas.length; i++) {
        const p = blueprint.personas[i];
        for (const tid of p.transcriptIds) {
            classificationOps.push(prisma.transcriptClassification.create({
                data: {
                    personaSessionId: sessionId,
                    transcriptId: tid,
                    archetypeId: p.primaryArchetypeId,
                    confidence: 1,
                    rationale: p.rationale,
                    supportingQuotesJson: null,
                    userOverridden: false,
                },
            }));
        }
    }
    for (const tid of blueprint.unclassifiedTranscriptIds) {
        classificationOps.push(prisma.transcriptClassification.create({
            data: {
                personaSessionId: sessionId,
                transcriptId: tid,
                archetypeId: null,
                confidence: 0,
                rationale: "Did not cluster cleanly into any synthesised persona.",
                supportingQuotesJson: null,
                userOverridden: false,
            },
        }));
    }

    await prisma.personaSession.update({
        where: { id: sessionId },
        data: { blueprintJson: JSON.stringify(blueprint) },
    });

    await prisma.$transaction(classificationOps);
}

interface BlueprintPersona {
    name: string;
    kicker: string | null;
    rationale: string;
    primaryArchetypeId: string | null;
    transcriptIds: string[];
}

interface ParsedBlueprint {
    personas: BlueprintPersona[];
    unclassifiedTranscriptIds: string[];
}

function extractBlueprint(parsed: unknown, allTranscriptIds: string[], archetypeIdSet: Set<string>): ParsedBlueprint {
    if (!parsed || typeof parsed !== "object") return { personas: [], unclassifiedTranscriptIds: allTranscriptIds };
    const root = parsed as Record<string, unknown>;
    const validTranscriptIds = new Set(allTranscriptIds);

    // Hard invariant: every transcript ID appears in EXACTLY ONE persona
    // OR in the unclassified bucket — never duplicated, never split across
    // personas. The DB has a unique constraint on (personaSessionId,
    // transcriptId) so the writer would otherwise crash mid-transaction.
    const claimed = new Set<string>();

    const personasRaw = Array.isArray(root.personas) ? root.personas : [];
    const personas: BlueprintPersona[] = personasRaw
        .filter(p => p && typeof p === "object")
        .map((p) => {
            const obj = p as Record<string, unknown>;
            const transcriptIds = Array.isArray(obj.transcriptIds)
                ? (obj.transcriptIds as unknown[])
                    .filter((id): id is string => typeof id === "string" && validTranscriptIds.has(id))
                    // First-come-first-served: drop IDs already claimed by a
                    // prior persona or duplicated inside this same persona.
                    .filter((id) => {
                        if (claimed.has(id)) return false;
                        claimed.add(id);
                        return true;
                    })
                : [];
            const archetypeId = typeof obj.primaryArchetypeId === "string" && archetypeIdSet.has(obj.primaryArchetypeId)
                ? obj.primaryArchetypeId
                : null;
            return {
                name: typeof obj.name === "string" && obj.name.trim() ? obj.name.trim() : "Unnamed persona",
                kicker: typeof obj.kicker === "string" ? obj.kicker.trim() : null,
                rationale: typeof obj.rationale === "string" ? obj.rationale.trim() : "",
                primaryArchetypeId: archetypeId,
                transcriptIds,
            };
        })
        .filter(p => p.transcriptIds.length > 0);

    const unclassifiedRaw = Array.isArray(root.unclassifiedTranscriptIds) ? root.unclassifiedTranscriptIds : [];
    const seenUnclassified = new Set<string>();
    const unclassifiedTranscriptIds: string[] = [];
    for (const raw of unclassifiedRaw as unknown[]) {
        if (typeof raw !== "string") continue;
        if (!validTranscriptIds.has(raw)) continue;
        if (claimed.has(raw)) continue;
        if (seenUnclassified.has(raw)) continue;
        seenUnclassified.add(raw);
        unclassifiedTranscriptIds.push(raw);
    }

    // Belt-and-braces: any transcript not claimed and not in the AI's
    // unclassified list defaults to unclassified.
    for (const id of allTranscriptIds) {
        if (!claimed.has(id) && !seenUnclassified.has(id)) {
            seenUnclassified.add(id);
            unclassifiedTranscriptIds.push(id);
        }
    }

    return { personas, unclassifiedTranscriptIds };
}

interface SynthesizeArgs {
    sessionId: string;
}

/**
 * Phase B — synthesise SyntheticPersona rows from the blueprint cached
 * by Phase A. One per blueprint persona — the count is decided by the AI
 * during Phase A based on data richness, not by the number of archetypes.
 *
 * Idempotent: re-creates personas for the session.
 */
export async function runSynthesisPhase({ sessionId }: SynthesizeArgs): Promise<void> {
    const session = await prisma.personaSession.findUnique({
        where: { id: sessionId },
        include: {
            subProject: { include: { project: true } },
            archetypeSession: {
                include: { archetypes: { orderBy: { order: "asc" } } },
            },
        },
    });

    if (!session) throw new Error(`PersonaSession ${sessionId} not found`);
    if (!session.blueprintJson) {
        throw new Error("No blueprint found on this persona session — run Phase A first.");
    }

    const subProject = session.subProject;
    const project = subProject.project;

    await prisma.personaSession.update({
        where: { id: sessionId },
        data: { status: "PROCESSING_SYNTHESIZE" },
    });

    // Pull all transcripts that fed this run (locked at Phase A).
    const sourceTranscriptIds: string[] = session.sourceTranscriptIdsJson
        ? JSON.parse(session.sourceTranscriptIdsJson)
        : [];
    const allTranscripts = await prisma.mappingTranscript.findMany({
        where: { id: { in: sourceTranscriptIds } },
    });
    const tById = new Map(allTranscripts.map(t => [t.id, t]));

    const client = getOpenAIClient();

    // Look up archetype anchor details (name/description/fullContent) for
    // blueprints that reference a specific archetype.
    const allArchetypes = session.archetypeSession?.archetypes || [];
    const archetypeById = new Map(allArchetypes.map(a => [a.id, a]));

    const blueprint = safeParse(session.blueprintJson) as ParsedBlueprint | null;
    if (!blueprint || !Array.isArray(blueprint.personas) || blueprint.personas.length === 0) {
        throw new Error("Cached blueprint is empty or malformed — regenerate the session.");
    }

    interface SynthesisJob {
        anchor: {
            name: string;
            kicker: string | null;
            description: string;
            fullContent?: unknown;
        };
        archetypeId: string | null;
        transcriptIds: string[];
    }

    const jobs: SynthesisJob[] = blueprint.personas.map(p => {
        const arch = p.primaryArchetypeId ? archetypeById.get(p.primaryArchetypeId) : null;
        return {
            anchor: arch ? {
                name: arch.name,
                kicker: arch.kicker,
                description: arch.description,
                fullContent: arch.fullContentJson ? safeParse(arch.fullContentJson) : undefined,
            } : {
                name: p.name,
                kicker: p.kicker,
                description: p.rationale || "Emergent persona discovered from interview data.",
                fullContent: undefined,
            },
            archetypeId: p.primaryArchetypeId,
            transcriptIds: p.transcriptIds,
        };
    });

    // Reset existing personas for this session.
    await prisma.syntheticPersona.deleteMany({
        where: { personaSessionId: sessionId },
    });

    const startTime = Date.now();

    // Pre-allocate unique, gender-balanced human names for each job — the
    // synthesis prompt accepts a fixed `assignedName` so parallel calls
    // don't collide on the same name (e.g. three Marcus Lims).
    const nameAllocations = allocatePersonaNames(jobs.length);

    const personaResults = await Promise.all(jobs.map(async (job, idx) => {
        const contributingTranscripts: ContributingTranscript[] = job.transcriptIds
            .map(id => tById.get(id))
            .filter((t): t is NonNullable<typeof t> => !!t)
            .map(t => ({
                id: t.id,
                displayName: t.displayName,
                text: t.extractedText || "",
            }));

        const assigned = nameAllocations[idx];

        let content: PersonaContent;
        try {
            const prompt = buildSynthesisPrompt({
                projectName: project.name,
                projectDescription: project.description || undefined,
                researchStatement: subProject.researchStatement,
                profileTarget: session.profileTarget || subProject.lifeStage,
                ageRange: subProject.ageRange,
                lifeStage: subProject.lifeStage,
                archetype: {
                    id: job.archetypeId || `cluster_${idx}`,
                    name: job.anchor.name,
                    kicker: job.anchor.kicker,
                    description: job.anchor.description,
                    fullContent: job.anchor.fullContent,
                },
                contributingTranscripts,
                assignedName: assigned?.name,
                assignedGender: assigned?.gender,
            });

            const resp = await client.chat.completions.create({
                model: DEFAULT_MODEL,
                messages: [
                    { role: "system", content: SYSTEM_GUARDRAILS },
                    { role: "user", content: prompt },
                ],
                response_format: { type: "json_object" },
                temperature: 0.4,
            });

            const rawContent = resp.choices[0]?.message?.content;
            const parsed = rawContent ? safeParse(rawContent) : null;
            content = coercePersonaContent(parsed, assigned?.name || job.anchor.name);
        } catch (err) {
            console.error(`[Persona synthesize] job ${idx} (${job.anchor.name}) failed:`, err);
            content = coercePersonaContent(null, assigned?.name || job.anchor.name);
        }

        // Hard-enforce the assigned name even if the AI returns something else.
        if (assigned) {
            content.summary.name = {
                value: assigned.name,
                provenance: "inferred",
                evidenceQuotes: [],
            };
            if (!content.bio.gender.value) {
                content.bio.gender = {
                    value: assigned.gender,
                    provenance: "inferred",
                    evidenceQuotes: [],
                };
            }
        }

        return { job, idx, content, assignedName: assigned?.name };
    }));

    const latencyMs = Date.now() - startTime;

    // Persist all personas in one transaction. We deliberately do NOT fall
    // back to the archetype name for `name` — the persona should carry a
    // human name. If the AI failed to produce one, label it explicitly so
    // the user notices and renames it.
    await prisma.$transaction(
        personaResults.map(r => prisma.syntheticPersona.create({
            data: {
                personaSessionId: sessionId,
                archetypeId: r.job.archetypeId,
                name: r.content.summary.name.value || r.assignedName || `Persona ${r.idx + 1}`,
                kicker: r.content.summary.kicker.value || r.job.anchor.kicker,
                avatarUrl: null,
                contentJson: JSON.stringify(r.content),
                sourceTranscriptIdsJson: JSON.stringify(r.job.transcriptIds),
                order: r.idx,
            },
        }))
    );

    await prisma.personaSession.update({
        where: { id: sessionId },
        data: {
            modelName: DEFAULT_MODEL,
            latencyMs,
        },
    });
}

/**
 * Phase C — generate an avatar portrait per persona. Best-effort:
 * failures leave avatarUrl null and the persona still renders.
 *
 * Returns the count of avatars successfully generated.
 */
export async function runAvatarPhase({ sessionId }: { sessionId: string }): Promise<number> {
    const session = await prisma.personaSession.findUnique({
        where: { id: sessionId },
        include: {
            syntheticPersonas: { include: { archetype: true } },
            subProject: true,
        },
    });
    if (!session) return 0;

    await prisma.personaSession.update({
        where: { id: sessionId },
        data: { status: "PROCESSING_AVATARS" },
    });

    const client = getOpenAIClient();
    let successCount = 0;

    await Promise.all(session.syntheticPersonas.map(async (p) => {
        try {
            const content = safeParse(p.contentJson) as PersonaContent | null;
            const ageVal = content?.bio?.age?.value;
            const genderVal = content?.bio?.gender?.value;
            const ethnicityVal = content?.bio?.ethnicity?.value;
            const headlineVal = content?.summary?.headline?.value;

            const descBits: string[] = [];
            if (ageVal != null) descBits.push(`age ${ageVal}`);
            if (genderVal) descBits.push(String(genderVal));
            if (ethnicityVal) descBits.push(String(ethnicityVal));
            const physicalDesc = descBits.length > 0 ? descBits.join(", ") : "a Singaporean adult";

            const prompt = `Editorial-style portrait photograph of ${physicalDesc}, representing a research persona called "${p.name}". ${headlineVal ? `Context: ${headlineVal.slice(0, 240)}.` : ""} Soft natural lighting, neutral background, shoulders-up framing, candid expression. No text or graphic overlays. Photorealistic, documentary photography style.`;

            const resp = await client.images.generate({
                model: "gpt-image-1.5",
                prompt,
                n: 1,
                size: "1024x1024",
                quality: "medium",
            });

            const data = resp.data?.[0];
            let dataUrl: string | null = null;
            if (data?.b64_json) {
                dataUrl = `data:image/png;base64,${data.b64_json}`;
            } else if (data?.url) {
                const imgRes = await fetch(data.url);
                const buf = await imgRes.arrayBuffer();
                dataUrl = `data:image/png;base64,${Buffer.from(buf).toString("base64")}`;
            }

            if (dataUrl) {
                await prisma.syntheticPersona.update({
                    where: { id: p.id },
                    data: { avatarUrl: dataUrl },
                });
                successCount += 1;
            }
        } catch (err) {
            console.error(`[Persona avatar] persona ${p.id} failed:`, err);
        }
    }));

    return successCount;
}

/**
 * Orchestrate the full pipeline (A → B → C). Idempotent at each phase
 * (each phase resets its own outputs first), so re-running the full
 * pipeline overwrites everything cleanly.
 *
 * On success: session.status = COMPLETE.
 * On failure: session.status = ERROR with errorMessage set.
 */
export async function runFullPersonaPipeline(sessionId: string): Promise<void> {
    try {
        await runClassificationPhase({ sessionId });
        await runSynthesisPhase({ sessionId });
        await runAvatarPhase({ sessionId });
        await prisma.personaSession.update({
            where: { id: sessionId },
            data: { status: "COMPLETE", errorMessage: null },
        });
    } catch (err) {
        console.error(`[Persona pipeline] session ${sessionId} failed:`, err);
        await prisma.personaSession.update({
            where: { id: sessionId },
            data: {
                status: "ERROR",
                errorMessage: err instanceof Error ? err.message : String(err),
            },
        });
        throw err;
    }
}

/** Re-run only Phase B (+ optionally C) for ONE persona. Used by the
 *  per-persona "Regenerate" button — cheaper than full pipeline. */
export async function regenerateSinglePersona(personaId: string): Promise<void> {
    const persona = await prisma.syntheticPersona.findUnique({
        where: { id: personaId },
        include: {
            personaSession: {
                include: {
                    subProject: { include: { project: true } },
                    classifications: true,
                },
            },
            archetype: true,
        },
    });
    if (!persona) throw new Error(`SyntheticPersona ${personaId} not found`);

    const project = persona.personaSession.subProject.project;
    const subProject = persona.personaSession.subProject;
    const archetype = persona.archetype;

    // Pull the transcripts that contributed to this persona. For archetype-
    // mode we use the live classifications (so user overrides take effect).
    // For archetypeless personas we trust the snapshot stored on the row.
    let transcriptIds: string[];
    if (archetype) {
        transcriptIds = persona.personaSession.classifications
            .filter(c => c.archetypeId === archetype.id)
            .map(c => c.transcriptId);
    } else {
        transcriptIds = persona.sourceTranscriptIdsJson
            ? JSON.parse(persona.sourceTranscriptIdsJson)
            : [];
    }

    const transcripts = await prisma.mappingTranscript.findMany({
        where: { id: { in: transcriptIds } },
    });

    const contributingTranscripts: ContributingTranscript[] = transcripts.map(t => ({
        id: t.id,
        displayName: t.displayName,
        text: t.extractedText || "",
    }));

    // Resolve the anchor — real archetype if attached, else use the persona's
    // own current name/kicker/contentJson summary as a synthetic anchor.
    const anchorName = archetype?.name || persona.name;
    const anchorKicker = archetype?.kicker ?? persona.kicker ?? null;
    const anchorDescription = archetype?.description
        || (safeParse(persona.contentJson) as PersonaContent | null)?.summary?.headline?.value
        || "Emergent persona cluster from interview data.";
    const anchorFullContent = archetype?.fullContentJson ? safeParse(archetype.fullContentJson) : undefined;

    const prompt = buildSynthesisPrompt({
        projectName: project.name,
        projectDescription: project.description || undefined,
        researchStatement: subProject.researchStatement,
        profileTarget: persona.personaSession.profileTarget || subProject.lifeStage,
        ageRange: subProject.ageRange,
        lifeStage: subProject.lifeStage,
        archetype: {
            id: archetype?.id || `cluster_${persona.id}`,
            name: anchorName,
            kicker: anchorKicker,
            description: anchorDescription,
            fullContent: anchorFullContent,
        },
        contributingTranscripts,
    });

    const client = getOpenAIClient();
    const resp = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
            { role: "system", content: SYSTEM_GUARDRAILS },
            { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
    });

    const raw = resp.choices[0]?.message?.content;
    const parsed = raw ? safeParse(raw) : null;
    const content = coercePersonaContent(parsed, anchorName);

    await prisma.syntheticPersona.update({
        where: { id: personaId },
        data: {
            // Keep the existing human name if the AI fails to regenerate one.
            name: content.summary.name.value || persona.name,
            kicker: content.summary.kicker.value || anchorKicker,
            contentJson: JSON.stringify(content),
            sourceTranscriptIdsJson: JSON.stringify(transcriptIds),
        },
    });
}

function safeParse(s: string | null | undefined): unknown {
    if (!s) return null;
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
}
// Created by Swapnil Bapat © 2026
