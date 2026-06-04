import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import {
    generatePersonaReply,
    generateSeed
} from "@/lib/ai/openai";
import {
    buildPersonaSimulationPrompt,
    parseMixerSettings
} from "@/lib/ai/prompts/dojo_persona_simulation";
import { buildFocusGroupPrompt } from "@/lib/ai/prompts/focus_group_simulation";
import { retrieveKBContext } from "@/lib/kb/retrieve";

// Helper: Assemble archetype data into text content for prompting
function assembleArchetypeContent(arch: {
    name: string;
    kicker: string | null;
    description: string;
    demographicJson: string | null;
    fullContentJson: string | null;
    [key: string]: unknown;
}): string {
    const parts: string[] = [];
    parts.push(`Name: ${arch.name}`);
    if (arch.kicker) parts.push(`Core Truth: ${arch.kicker}`);
    parts.push(`Description: ${arch.description}`);

    const parse = (json: string | null) => { try { return json ? JSON.parse(json) : null; } catch { return null; } };
    const demographic = parse(arch.demographicJson as string | null);
    if (demographic) {
        if (demographic.ageRange) parts.push(`Age Range: ${demographic.ageRange}`);
        if (demographic.occupation) parts.push(`Occupation: ${demographic.occupation}`);
        if (demographic.livingSetup) parts.push(`Living Setup: ${demographic.livingSetup}`);
    }

    const full = parse(arch.fullContentJson as string | null);
    if (full) {
        if (full.livedExperience) parts.push(`\nLived Experience:\n${full.livedExperience}`);
        if (full.influences?.length) parts.push(`\nInfluences:\n${full.influences.map((s: string) => `- ${s}`).join('\n')}`);
        if (full.behaviours?.length) parts.push(`\nBehaviours:\n${full.behaviours.map((s: string) => `- ${s}`).join('\n')}`);
        if (full.barriers?.length) parts.push(`\nBarriers:\n${full.barriers.map((s: string) => `- ${s}`).join('\n')}`);
        if (full.motivations?.length) parts.push(`\nMotivations:\n${full.motivations.map((s: string) => `- ${s}`).join('\n')}`);
        if (full.goals?.length) parts.push(`\nGoals:\n${full.goals.map((s: string) => `- ${s}`).join('\n')}`);
        if (full.habits?.length) parts.push(`\nHabits:\n${full.habits.map((s: string) => `- ${s}`).join('\n')}`);
        if (full.spiral) {
            parts.push(`\nThe Spiral:`);
            if (full.spiral.pattern) parts.push(`Pattern: ${full.spiral.pattern}`);
            if (full.spiral.avoidance) parts.push(`Avoidance: ${full.spiral.avoidance}`);
        }
    }
    return parts.join('\n');
}

/**
 * Assemble a SyntheticPersona's content (richer than an Archetype, since
 * it carries demographic facts grounded in real transcripts) into the
 * flat text block the persona-simulation prompts consume.
 */
function assembleSyntheticPersonaContent(persona: {
    name: string;
    kicker: string | null;
    contentJson: string;
}): string {
    const parts: string[] = [];
    parts.push(`Name: ${persona.name}`);
    if (persona.kicker) parts.push(`Core Truth: ${persona.kicker}`);

    let content: Record<string, unknown> | null = null;
    try { content = JSON.parse(persona.contentJson); } catch { content = null; }
    if (!content) return parts.join('\n');

    const valueOf = (f: unknown): string | null => {
        if (!f || typeof f !== "object") return null;
        const fld = f as Record<string, unknown>;
        const v = fld.value;
        if (v == null) return null;
        if (Array.isArray(v)) return v.length > 0 ? v.join("; ") : null;
        return String(v);
    };

    const summary = (content.summary || {}) as Record<string, unknown>;
    const headline = valueOf(summary.headline);
    if (headline) parts.push(`Headline: ${headline}`);

    const bio = (content.bio || {}) as Record<string, unknown>;
    const bioBits: string[] = [];
    const bioFields: [string, string][] = [
        ["age", "Age"], ["gender", "Gender"], ["ethnicity", "Ethnicity"],
        ["religion", "Religion"], ["homeLanguage", "Home language"],
        ["preferredLanguage", "Preferred language"], ["literacy", "Literacy"],
    ];
    for (const [k, label] of bioFields) {
        const v = valueOf(bio[k]);
        if (v) bioBits.push(`${label}: ${v}`);
    }
    if (bioBits.length) parts.push(`\nBio:\n${bioBits.map(b => `- ${b}`).join('\n')}`);

    const ctx = (content.contextAndEnvironment || {}) as Record<string, unknown>;
    const ctxBits: string[] = [];
    const ctxFields: [string, string][] = [
        ["neighbourhood", "Neighbourhood"], ["housing", "Housing"], ["income", "Income"],
        ["commute", "Commute"], ["foodAccess", "Food access"],
    ];
    for (const [k, label] of ctxFields) {
        const v = valueOf(ctx[k]);
        if (v) ctxBits.push(`${label}: ${v}`);
    }
    if (ctxBits.length) parts.push(`\nContext & environment:\n${ctxBits.map(b => `- ${b}`).join('\n')}`);

    const core = (content.coreBehaviourPattern || {}) as Record<string, unknown>;
    const weekday = valueOf(core.weekdayPattern);
    const weekend = valueOf(core.weekendPattern);
    if (weekday || weekend) {
        parts.push(`\nCore behaviour pattern:`);
        if (weekday) parts.push(`Weekday: ${weekday}`);
        if (weekend) parts.push(`Weekend: ${weekend}`);
    }

    const goals = (content.goalsAndConcerns || {}) as Record<string, unknown>;
    const goalBits: string[] = [];
    for (const [k, label] of [
        ["goal", "Goal"], ["fear", "Fear"], ["mentalState", "Mental state"],
        ["perceivedRisk", "Perceived risk"], ["primarySource", "Primary source"],
    ] as [string, string][]) {
        const v = valueOf(goals[k]);
        if (v) goalBits.push(`${label}: ${v}`);
    }
    if (goalBits.length) parts.push(`\nGoals & concerns:\n${goalBits.map(b => `- ${b}`).join('\n')}`);

    const lifestyle = (content.dailyLifestyle || {}) as Record<string, unknown>;
    const dims = Array.isArray(lifestyle.dimensions) ? lifestyle.dimensions as Array<Record<string, unknown>> : [];
    const dimBits = dims
        .map(d => {
            const name = typeof d.name === "string" ? d.name : null;
            const desc = valueOf(d.description);
            return name && desc ? `${name}: ${desc}` : null;
        })
        .filter((s): s is string => !!s);
    if (dimBits.length) parts.push(`\nDaily lifestyle:\n${dimBits.map(b => `- ${b}`).join('\n')}`);

    const programmes = (content.programmesAndTouchpoints || {}) as Record<string, unknown>;
    const progBits: string[] = [];
    for (const [k, label] of [
        ["appUsage", "App usage"], ["eventHistory", "Event history"],
        ["preferredFormat", "Preferred format"], ["depthAndTone", "Depth & tone"],
        ["channels", "Channels"],
    ] as [string, string][]) {
        const v = valueOf(programmes[k]);
        if (v) progBits.push(`${label}: ${v}`);
    }
    if (progBits.length) parts.push(`\nProgrammes & touchpoints:\n${progBits.map(b => `- ${b}`).join('\n')}`);

    const pain = (content.painPointsAndLanguage || {}) as Record<string, unknown>;
    const painPointsArr = (pain.painPoints && typeof pain.painPoints === "object" && Array.isArray((pain.painPoints as Record<string, unknown>).value))
        ? (pain.painPoints as Record<string, unknown>).value as string[]
        : [];
    if (painPointsArr.length) parts.push(`\nPain points:\n${painPointsArr.map(p => `- ${p}`).join('\n')}`);
    const objection = valueOf(pain.objection);
    if (objection) parts.push(`\nObjection: ${objection}`);
    const voice = valueOf(pain.voiceQuote);
    if (voice) parts.push(`Voice quote: "${voice}"`);

    return parts.join('\n');
}

interface FocusGroupParticipant {
    id: string;          // archetype.id OR syntheticPersona.id
    kind: "archetype" | "persona";
    name: string;
    kicker: string | null;
    content: string;     // assembled text for the prompt
}

// Check if a response is a "no response" signal from the AI
function isNoResponse(content: string): boolean {
    const trimmed = content.trim().toLowerCase();
    return (
        trimmed === "[no_response]" ||
        trimmed === "[no response]" ||
        trimmed === "no_response" ||
        trimmed === "[n/a]" ||
        trimmed === ""
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { simulationId, content, imageBase64, targetArchetypeIds } = body;

        if (!simulationId) {
            return errorResponse("simulationId is required", 400);
        }

        // 1. Load Simulation Context
        const simulation = await prisma.simulation.findUnique({
            where: { id: simulationId },
            include: {
                subProject: {
                    include: {
                        project: true,
                    },
                },
                project: true,
                personaDoc: true,
                projectPersonaDoc: true,
                archetype: true,
                persona: true,
                syntheticPersona: true,
                simulationArchetypes: {
                    include: {
                        archetype: true,
                        syntheticPersona: true,
                    },
                    orderBy: { order: "asc" },
                },
                messages: {
                    orderBy: { timestamp: "asc" },
                    take: 30 // More messages for focus group context
                }
            }
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        // Determine the research context
        let projectName = "Unknown Project";
        let researchStatement = "";
        let ageRange = "";
        let lifeStage = "";
        let projectId: string | null = null;

        if (simulation.subProject) {
            projectName = simulation.subProject.project?.name || simulation.subProject.name;
            researchStatement = simulation.subProject.researchStatement;
            ageRange = simulation.subProject.ageRange;
            lifeStage = simulation.subProject.lifeStage;
            projectId = simulation.subProject.projectId;
        } else if (simulation.project) {
            projectName = simulation.project.name;
            researchStatement = simulation.project.researchStatement || "";
            ageRange = simulation.project.ageRange || "";
            lifeStage = simulation.project.lifeStage || "";
            projectId = simulation.project.id;
        } else {
            return errorResponse("Simulation has no associated project or sub-project", 400);
        }

        // Determine the last user message to respond to
        let userMessageContent = content;
        if (!userMessageContent) {
            const lastMessage = simulation.messages[simulation.messages.length - 1];
            if (lastMessage && lastMessage.role === "user") {
                userMessageContent = lastMessage.content;
            }
        }
        if (!userMessageContent) {
            return errorResponse("No user message content provided to reply to.", 400);
        }

        // ============================================================
        // FOCUS GROUP MODE
        // ============================================================
        if (simulation.isFocusGroup) {
            // Build a unified participant list — each row in
            // simulationArchetypes references either an Archetype or a
            // SyntheticPersona. We treat them identically downstream.
            const allParticipants: FocusGroupParticipant[] = simulation.simulationArchetypes
                .map(sa => {
                    if (sa.archetype) {
                        return {
                            id: sa.archetype.id,
                            kind: "archetype" as const,
                            name: sa.archetype.name,
                            kicker: sa.archetype.kicker,
                            content: assembleArchetypeContent(sa.archetype),
                        };
                    }
                    if (sa.syntheticPersona) {
                        return {
                            id: sa.syntheticPersona.id,
                            kind: "persona" as const,
                            name: sa.syntheticPersona.name,
                            kicker: sa.syntheticPersona.kicker,
                            content: assembleSyntheticPersonaContent(sa.syntheticPersona),
                        };
                    }
                    return null;
                })
                .filter((p): p is FocusGroupParticipant => p !== null);

            if (allParticipants.length === 0) {
                return errorResponse("Focus group has no participants linked.", 400);
            }

            // Determine which participants should respond (the @-mention tagging
            // sends an array of IDs that match either an archetype or a persona).
            let respondingParticipants = allParticipants;
            if (targetArchetypeIds && Array.isArray(targetArchetypeIds) && targetArchetypeIds.length > 0) {
                respondingParticipants = allParticipants.filter(p => targetArchetypeIds.includes(p.id));
                if (respondingParticipants.length === 0) {
                    return errorResponse("None of the tagged participants are in this focus group.", 400);
                }
            }

            // Retrieve grounding context once (shared across all participants)
            const retrievalQuery = `${userMessageContent} ${lifeStage} ${researchStatement}`;
            const retrievedChunks = await retrieveKBContext({
                query: retrievalQuery,
                docTypes: ["RESEARCH", "POLICY", "FRAMEWORK"],
                limitChunks: 3
            });
            const groundingContext = retrievedChunks.map(c =>
                `[Source: ${c.documentTitle}]\n${c.text}`
            );

            // Build a name lookup for conversation-history labelling. Includes
            // both archetypes and personas so historical messages with either
            // FK resolve cleanly.
            const nameById: Record<string, string> = {};
            for (const p of allParticipants) nameById[p.id] = p.name;

            const newMessages: Array<{
                id: string;
                role: string;
                content: string;
                participantId: string;
                participantKind: "archetype" | "persona";
                participantName: string;
                archetypeId: string | null;
                syntheticPersonaId: string | null;
                timestamp: string;
                latencyMs: number;
            }> = [];

            // Build fresh conversation history including any new messages from this round.
            const buildConversationHistory = () => {
                const existingHistory = simulation.messages.map(m => {
                    const speakerKey = m.archetypeId || m.syntheticPersonaId;
                    return {
                        role: m.role,
                        content: m.content,
                        speakerName: m.role === "persona" && speakerKey ? (nameById[speakerKey] || "Participant") : undefined,
                    };
                });
                const roundHistory = newMessages.map(m => ({
                    role: "persona" as const,
                    content: m.content,
                    speakerName: m.participantName,
                }));
                return [...existingHistory, ...roundHistory];
            };

            for (const participant of respondingParticipants) {
                const otherNames = allParticipants
                    .filter(p => p.id !== participant.id)
                    .map(p => p.name);

                // Responses produced by OTHER participants earlier in THIS same
                // turn — surfaced explicitly to force divergence in opener,
                // structure, angle, vocabulary, and length.
                const priorResponsesThisTurn = newMessages.map((m) => ({
                    speakerName: m.participantName,
                    content: m.content,
                }));

                const prompt = buildFocusGroupPrompt({
                    projectName,
                    researchStatement,
                    archetypeName: participant.name,
                    archetypeContent: participant.content,
                    otherArchetypeNames: otherNames,
                    conversationHistory: buildConversationHistory(),
                    userMessage: userMessageContent,
                    groundingContext,
                    priorResponsesThisTurn,
                });

                const result = await generatePersonaReply({
                    prompt,
                    modelName: "gpt-5.2",
                    imageBase64: imageBase64 || undefined,
                });

                if (!result.success) {
                    console.error(`[FocusGroup] AI failed for ${participant.kind} ${participant.name}:`, result.error);
                    continue;
                }
                if (isNoResponse(result.content)) {
                    console.log(`[FocusGroup] ${participant.name} chose not to respond`);
                    continue;
                }

                const savedMessage = await prisma.simulationMessage.create({
                    data: {
                        simulationId,
                        role: "persona",
                        content: result.content,
                        archetypeId: participant.kind === "archetype" ? participant.id : null,
                        syntheticPersonaId: participant.kind === "persona" ? participant.id : null,
                        latencyMs: result.latencyMs,
                    }
                });

                newMessages.push({
                    id: savedMessage.id,
                    role: "persona",
                    content: result.content,
                    participantId: participant.id,
                    participantKind: participant.kind,
                    participantName: participant.name,
                    archetypeId: participant.kind === "archetype" ? participant.id : null,
                    syntheticPersonaId: participant.kind === "persona" ? participant.id : null,
                    timestamp: savedMessage.timestamp.toISOString(),
                    latencyMs: result.latencyMs || 0,
                });

                await logAudit({
                    action: "GEMINI_SIMULATE",
                    entityType: "Simulation",
                    entityId: simulationId,
                    meta: {
                        focusGroup: true,
                        participantKind: participant.kind,
                        participantId: participant.id,
                        participantName: participant.name,
                        model: result.modelName,
                        latency: result.latencyMs,
                        promptHash: result.promptHash,
                        responseHash: result.responseHash,
                    }
                });
            }

            return successResponse({
                focusGroup: true,
                messages: newMessages,
                disclaimer: "AI-generated responses for research purposes only.",
            });
        }

        // ============================================================
        // STANDARD 1:1 SIMULATION MODE (unchanged)
        // ============================================================

        // 2. Resolve Persona Content (priorities: archetype > projectPersonaDoc > personaDoc > persona)
        let personaTitle = "Unknown Participant";
        let personaContent = "";

        if (simulation.syntheticPersona) {
            personaTitle = simulation.syntheticPersona.name;
            personaContent = assembleSyntheticPersonaContent(simulation.syntheticPersona);
        } else if (simulation.archetype) {
            personaTitle = simulation.archetype.name;
            personaContent = assembleArchetypeContent(simulation.archetype);
        } else if (simulation.projectPersonaDoc && simulation.projectPersonaDoc.extractedText) {
            personaTitle = simulation.projectPersonaDoc.title;
            personaContent = simulation.projectPersonaDoc.extractedText;
        } else if (simulation.personaDoc && simulation.personaDoc.extractedText) {
            personaTitle = simulation.personaDoc.title;
            personaContent = simulation.personaDoc.extractedText;
        } else if (simulation.persona) {
            personaTitle = simulation.persona.name;
            personaContent = `
        Name: ${simulation.persona.name}
        Age: ${simulation.persona.ageRange}
        Life Stage: ${simulation.persona.lifeStage}
        Background: ${simulation.persona.description}
      `;
        } else {
            return errorResponse("No persona context found for this simulation.", 400);
        }

        // 3. Resolve Guide Intent
        let latestVersion;
        if (simulation.subProjectId) {
            latestVersion = await prisma.guideVersion.findFirst({
                where: { subProjectId: simulation.subProjectId },
                orderBy: { versionNumber: 'desc' },
                include: { guideSets: true }
            });
        }
        if (!latestVersion && projectId) {
            latestVersion = await prisma.guideVersion.findFirst({
                where: { projectId, subProjectId: null },
                orderBy: { versionNumber: 'desc' },
                include: { guideSets: true }
            });
        }
        const guideIntent = latestVersion?.guideSets
            .map((g: { intent: string }) => g.intent)
            .join("; ") || "";

        // 4. Retrieve Grounding Context (KB)
        const retrievalQuery = `${userMessageContent} ${lifeStage} ${researchStatement}`;
        const retrievedChunks = await retrieveKBContext({
            query: retrievalQuery,
            docTypes: ["RESEARCH", "POLICY", "FRAMEWORK"],
            limitChunks: 3
        });
        const groundingContext = retrievedChunks.map(c =>
            `[Source: ${c.documentTitle}]\n${c.text}`
        );

        // 5. Build Prompt
        const mixer = parseMixerSettings(simulation.mixerJson);
        const seed = simulation.seed || generateSeed();
        if (!simulation.seed) {
            await prisma.simulation.update({
                where: { id: simulationId },
                data: { seed }
            });
        }

        const prompt = buildPersonaSimulationPrompt({
            projectName,
            researchStatement,
            ageRange,
            lifeStage,
            guideIntent,
            personaTitle,
            personaContent,
            mixer,
            conversationHistory: simulation.messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            userMessage: userMessageContent,
            groundingContext,
            seed
        });

        // 6. Call OpenAI
        const result = await generatePersonaReply({
            prompt,
            modelName: "gpt-5.2",
            imageBase64: imageBase64 || undefined,
        });

        if (!result.success) {
            await logAudit({
                action: "GEMINI_SIMULATE_FAIL",
                entityType: "Simulation",
                entityId: simulationId,
                meta: { error: result.error, promptHash: result.promptHash }
            });
            return errorResponse("AI generation failed. Please try again.", 500);
        }

        // 7. Save Response
        const newMessage = await prisma.simulationMessage.create({
            data: {
                simulationId,
                role: "persona",
                content: result.content,
                latencyMs: result.latencyMs
            }
        });

        // 8. Log Success Audit
        await logAudit({
            action: "GEMINI_SIMULATE",
            entityType: "Simulation",
            entityId: simulationId,
            meta: {
                model: result.modelName,
                latency: result.latencyMs,
                promptHash: result.promptHash,
                responseHash: result.responseHash,
                groundingDocs: retrievedChunks.map(c => c.documentId)
            }
        });

        return successResponse({
            message: newMessage,
            disclaimer: result.disclaimer
        });

    } catch (error) {
        console.error("[API] POST /api/gemini/simulate error:", error);
        return errorResponse("Internal simulation error", 500);
    }
}

// Created by Swapnil Bapat © 2026
