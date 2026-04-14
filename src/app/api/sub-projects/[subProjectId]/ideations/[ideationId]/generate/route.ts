import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";
import { generateIdeation, generateConceptImage } from "@/lib/ai/openai";
import { buildIdeationPrompt, IdeationGenerationContext } from "@/lib/ai/prompts/ideation_generation";

interface RouteParams {
    params: Promise<{ subProjectId: string; ideationId: string }>;
}

// POST /api/sub-projects/[subProjectId]/ideations/[ideationId]/generate
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { subProjectId, ideationId } = await params;

    try {
        // 1. Fetch ideation session with sub-project and project context
        const session = await prisma.ideationSession.findFirst({
            where: { id: ideationId, subProjectId },
            include: {
                subProject: {
                    include: {
                        project: true,
                    },
                },
            },
        });

        if (!session) {
            return errorResponse("Ideation session not found", 404);
        }

        if (session.status === "COMPLETE") {
            return errorResponse("Ideation session already complete", 400);
        }

        // 2. Update status to PROCESSING
        await prisma.ideationSession.update({
            where: { id: ideationId },
            data: { status: "PROCESSING" },
        });

        // 3. Fetch mapping session with clusters
        const mappingSession = await prisma.mappingSession.findUnique({
            where: { id: session.sourceMappingId },
            include: {
                clusters: {
                    include: { transcript: true },
                },
            },
        });

        if (!mappingSession) {
            await prisma.ideationSession.update({
                where: { id: ideationId },
                data: { status: "ERROR" },
            });
            return errorResponse("Source mapping session not found", 404);
        }

        // 4. Aggregate clusters by theme
        const clustersByTheme: Record<string, Array<{ transcript: string; quote: string; context?: string }>> = {};
        for (const cluster of mappingSession.clusters) {
            if (!clustersByTheme[cluster.themeName]) {
                clustersByTheme[cluster.themeName] = [];
            }
            clustersByTheme[cluster.themeName].push({
                transcript: cluster.transcript.displayName,
                quote: cluster.quote,
                context: cluster.context || undefined,
            });
        }

        // 5. Parse insights if available
        let insights: IdeationGenerationContext["insights"] = undefined;
        if (mappingSession.insightsJson) {
            try {
                insights = JSON.parse(mappingSession.insightsJson);
            } catch {
                console.warn(`[Ideation] Failed to parse insights for mapping ${mappingSession.id}`);
            }
        }

        // 6. Fetch selected profiles
        const profileIds: string[] = session.sourceProfileIdsJson
            ? JSON.parse(session.sourceProfileIdsJson)
            : [];

        const profiles: IdeationGenerationContext["profiles"] = [];

        if (profileIds.length > 0) {
            // Fetch archetypes
            const archetypes = await prisma.archetype.findMany({
                where: { id: { in: profileIds } },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    demographicJson: true,
                    goalsJson: true,
                    motivationsJson: true,
                    groundTruthJson: true,
                    spiralJson: true,
                },
            });

            for (const a of archetypes) {
                profiles.push({
                    type: "archetype",
                    name: a.name,
                    description: a.description,
                    demographicJson: a.demographicJson,
                    goalsJson: a.goalsJson,
                    motivationsJson: a.motivationsJson,
                    groundTruthJson: a.groundTruthJson,
                    spiralJson: a.spiralJson,
                });
            }

            // Fetch KB persona docs (IDs not found as archetypes are KB personas)
            const foundArchetypeIds = new Set(archetypes.map(a => a.id));
            const kbPersonaIds = profileIds.filter(id => !foundArchetypeIds.has(id));

            if (kbPersonaIds.length > 0) {
                // Try global KB
                const globalDocs = await prisma.kbDocument.findMany({
                    where: { id: { in: kbPersonaIds }, docType: "PERSONA" },
                    select: { id: true, title: true, extractedText: true, parsedMetaJson: true },
                });

                for (const doc of globalDocs) {
                    profiles.push({
                        type: "kb_persona",
                        name: doc.title,
                        description: doc.parsedMetaJson
                            ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.description || ""; } catch { return ""; } })()
                            : "",
                        extractedText: doc.extractedText,
                    });
                }

                // Try project KB for remaining
                const foundGlobalIds = new Set(globalDocs.map(d => d.id));
                const projectKbIds = kbPersonaIds.filter(id => !foundGlobalIds.has(id));

                if (projectKbIds.length > 0) {
                    const projectDocs = await prisma.projectKbDocument.findMany({
                        where: { id: { in: projectKbIds }, docType: "PERSONA" },
                        select: { id: true, title: true, extractedText: true, parsedMetaJson: true },
                    });

                    for (const doc of projectDocs) {
                        profiles.push({
                            type: "kb_persona",
                            name: doc.title,
                            description: doc.parsedMetaJson
                                ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.description || ""; } catch { return ""; } })()
                                : "",
                            extractedText: doc.extractedText,
                        });
                    }
                }
            }
        }

        // 7. Parse focus areas
        const focusAreas: string[] = session.focusAreasJson
            ? JSON.parse(session.focusAreasJson)
            : [];

        // 8. Build prompt and call AI for text generation
        const subProject = session.subProject;
        const project = subProject.project;

        const promptCtx: IdeationGenerationContext = {
            projectName: project.name,
            projectDescription: project.description || "",
            subProjectName: subProject.name,
            researchStatement: subProject.researchStatement,
            ageRange: subProject.ageRange,
            lifeStage: subProject.lifeStage,
            clustersByTheme,
            insights,
            profiles,
            focusAreas,
        };

        const prompt = buildIdeationPrompt(promptCtx);
        console.log("[Ideation] Generating concepts, prompt length:", prompt.length);

        const { concepts, modelName, latencyMs: textLatencyMs } = await generateIdeation(prompt);
        console.log("[Ideation] Text generation complete, latency:", textLatencyMs, "ms");

        // 9. Generate images in parallel for all 8 concepts
        console.log("[Ideation] Generating 8 concept images in parallel...");
        const imageStartTime = Date.now();

        const imagePromises = concepts.map((concept) =>
            generateConceptImage(
                concept.name as string,
                (concept.howItWorks as { description: string }).description,
                (concept.howItWorks as { imageTextLabels?: string[] }).imageTextLabels || [],
            )
        );

        const images = await Promise.all(imagePromises);
        const imageLatencyMs = Date.now() - imageStartTime;
        console.log("[Ideation] Image generation complete, latency:", imageLatencyMs, "ms");

        // 10. Merge images into concepts
        for (let i = 0; i < concepts.length; i++) {
            const howItWorks = concepts[i].howItWorks as Record<string, unknown>;
            howItWorks.imageBase64 = images[i];
        }

        const totalLatencyMs = textLatencyMs + imageLatencyMs;

        // 11. Save to database
        await prisma.ideationSession.update({
            where: { id: ideationId },
            data: {
                status: "COMPLETE",
                resultJson: JSON.stringify(concepts),
                modelName,
                imageModelName: "gpt-image-1.5",
                latencyMs: totalLatencyMs,
            },
        });

        // 12. Audit log
        await logAudit({
            action: "GENERATE_IDEATION",
            entityType: "IdeationSession",
            entityId: ideationId,
            meta: {
                subProjectId,
                mappingId: session.sourceMappingId,
                profileCount: profiles.length,
                focusAreaCount: focusAreas.length,
                model: modelName,
                imageModel: "gpt-image-1.5",
                latencyMs: totalLatencyMs,
            },
        });

        return successResponse({
            success: true,
            conceptCount: concepts.length,
            latencyMs: totalLatencyMs,
        });
    } catch (error) {
        console.error("[API] POST ideation generate error:", error);

        // Try to set status to ERROR
        try {
            await prisma.ideationSession.update({
                where: { id: ideationId },
                data: { status: "ERROR" },
            });
        } catch { /* ignore */ }

        return errorResponse("Failed to generate ideation concepts", 500);
    }
}
