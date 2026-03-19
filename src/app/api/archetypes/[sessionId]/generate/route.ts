import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";
import { getOpenAIClient, SYSTEM_GUARDRAILS, DEFAULT_MODEL } from "@/lib/ai/openai";
import { buildArchetypeGenerationPrompt, ArchetypeGenerationContext } from "@/lib/ai/prompts/archetype_generation";
import { retrieveGlobalFrameworks } from "@/lib/kb/retrieve";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

// POST /api/archetypes/[sessionId]/generate - Generate archetypes from selected mappings
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const body = await request.json();
        const { mappingSessionIds, profileTarget } = body;

        if (!mappingSessionIds || !Array.isArray(mappingSessionIds) || mappingSessionIds.length === 0) {
            return errorResponse("At least one mapping session must be selected", 400);
        }

        if (!profileTarget || typeof profileTarget !== 'string' || profileTarget.trim() === '') {
            return errorResponse("Profile target is required", 400);
        }

        // 1. Verify archetype session exists
        const archetypeSession = await prisma.archetypeSession.findUnique({
            where: { id: sessionId },
            include: {
                subProject: {
                    include: {
                        project: true,
                    },
                },
            },
        });

        if (!archetypeSession) {
            return errorResponse("Archetype session not found", 404);
        }

        // 2. Fetch selected mapping sessions with clusters and insights
        const mappingSessions = await prisma.mappingSession.findMany({
            where: {
                id: { in: mappingSessionIds },
                subProjectId: archetypeSession.subProjectId,
            },
            include: {
                clusters: {
                    include: {
                        transcript: true,
                    },
                },
            },
        });

        if (mappingSessions.length === 0) {
            return errorResponse("No valid mapping sessions found", 404);
        }

        // 3. Update session status to PROCESSING
        await prisma.archetypeSession.update({
            where: { id: sessionId },
            data: {
                status: "PROCESSING",
                sourceMappingIdsJson: JSON.stringify(mappingSessionIds),
            },
        });

        // 4. Aggregate clusters by theme across all selected mapping sessions
        const clustersByTheme: Record<string, Array<{ transcript: string; quote: string; context?: string }>> = {};
        for (const session of mappingSessions) {
            for (const cluster of session.clusters) {
                if (!clustersByTheme[cluster.themeName]) {
                    clustersByTheme[cluster.themeName] = [];
                }
                clustersByTheme[cluster.themeName].push({
                    transcript: cluster.transcript.displayName,
                    quote: cluster.quote,
                    context: cluster.context || undefined,
                });
            }
        }

        // 5. Aggregate insights from mapping sessions (if available)
        let allInsights: ArchetypeGenerationContext["insights"] = undefined;
        for (const session of mappingSessions) {
            if (session.insightsJson) {
                try {
                    const parsed = JSON.parse(session.insightsJson);
                    if (!allInsights) {
                        allInsights = { found_out: [], look_further: [], new_areas: [] };
                    }
                    if (parsed.found_out) allInsights.found_out!.push(...parsed.found_out);
                    if (parsed.look_further) allInsights.look_further!.push(...parsed.look_further);
                    if (parsed.new_areas) allInsights.new_areas!.push(...parsed.new_areas);
                } catch {
                    console.warn(`Failed to parse insights for mapping session ${session.id}`);
                }
            }
        }

        // 6. Fetch Global Frameworks for behavioral lens
        const globalFrameworks = await retrieveGlobalFrameworks();
        const frameworkContext = globalFrameworks.length > 0
            ? globalFrameworks.map(doc => `### ${doc.title}\n${doc.content.slice(0, 2000)}${doc.content.length > 2000 ? '...' : ''}`).join("\n\n")
            : "";

        // 7. Build the prompt
        const subProject = archetypeSession.subProject;
        const project = subProject.project;

        const promptCtx: ArchetypeGenerationContext = {
            projectName: project.name,
            projectDescription: project.description || "",
            subProjectName: subProject.name,
            researchStatement: subProject.researchStatement,
            ageRange: subProject.ageRange,
            lifeStage: subProject.lifeStage,
            profileTarget,
            clustersByTheme,
            insights: allInsights,
            frameworkContext,
        };

        const prompt = buildArchetypeGenerationPrompt(promptCtx);

        // 8. Call OpenAI
        console.log("[Archetypes] Generating archetypes with OpenAI, prompt length:", prompt.length);
        const startTime = Date.now();

        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: "system", content: SYSTEM_GUARDRAILS },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.5, // Balanced: needs creativity for archetype synthesis but grounded in data
        });

        const content = response.choices[0]?.message?.content;
        const latencyMs = Date.now() - startTime;

        if (!content) {
            await prisma.archetypeSession.update({
                where: { id: sessionId },
                data: { status: "ERROR" },
            });
            return errorResponse("No response from AI", 500);
        }

        console.log("[Archetypes] AI response received, latency:", latencyMs, "ms");

        // 9. Parse the response
        let parsed: { archetypes: any[] };
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("[Archetypes] Failed to parse AI response:", content.slice(0, 500));
            await prisma.archetypeSession.update({
                where: { id: sessionId },
                data: { status: "ERROR" },
            });
            return errorResponse("Failed to parse AI response", 500);
        }

        if (!parsed.archetypes || !Array.isArray(parsed.archetypes) || parsed.archetypes.length === 0) {
            await prisma.archetypeSession.update({
                where: { id: sessionId },
                data: { status: "ERROR" },
            });
            return errorResponse("AI did not return valid archetypes", 500);
        }

        // 10. Save archetypes to database
        const createdArchetypes: { id: string; name: string }[] = [];
        await prisma.$transaction(async (tx) => {
            // Delete existing archetypes if any (retry support)
            await tx.archetype.deleteMany({
                where: { archetypeSessionId: sessionId },
            });

            // Create new archetypes
            for (let i = 0; i < parsed.archetypes.length; i++) {
                const a = parsed.archetypes[i];
                // Robust extraction: sometimes AI returns `identity` as a nested object, or puts fields flat on the root archetype object
                const archetypeName = a.name || a.identity?.name || a.title || `Unnamed Archetype ${i + 1}`;
                const kicker = a.kicker || a.identity?.kicker || null;
                const description = a.description || a.identity?.description || "";
                const demographic = a.demographic || a.identity?.demographic || null;
                const demographicJson = demographic ? JSON.stringify(demographic) : null;

                // Behaviours, influences etc might occasionally be nested inside identity if AI messed up the structure
                const goals = a.goals || a.identity?.goals;
                const motivations = a.motivations || a.identity?.motivations;
                const spiral = a.spiral || a.identity?.spiral;

                const created = await tx.archetype.create({
                    data: {
                        archetypeSessionId: sessionId,
                        name: archetypeName,
                        kicker: kicker,
                        description: description,
                        demographicJson: demographicJson,
                        goalsJson: goals ? JSON.stringify(goals) : null,
                        motivationsJson: motivations ? JSON.stringify(motivations) : null,
                        spiralJson: spiral ? JSON.stringify(spiral) : null,
                        // Legacy fields — set to null for new format
                        groundTruthJson: null,
                        internalConflictJson: null,
                        breakingPointsJson: null,
                        evidenceJson: null,
                        // Full content JSON stores everything
                        fullContentJson: JSON.stringify(a),
                        order: i,
                    },
                });
                createdArchetypes.push({ id: created.id, name: created.name });
            }

            // Update session to COMPLETE
            await tx.archetypeSession.update({
                where: { id: sessionId },
                data: {
                    status: "COMPLETE",
                    modelName: DEFAULT_MODEL,
                    latencyMs,
                },
            });
        });

        // 11. Audit log
        await logAudit({
            action: "GENERATE_ARCHETYPES",
            entityType: "ArchetypeSession",
            entityId: sessionId,
            meta: {
                archetypeCount: parsed.archetypes.length,
                mappingSessionCount: mappingSessionIds.length,
                model: DEFAULT_MODEL,
                latencyMs,
            },
        });

        return successResponse({
            success: true,
            count: parsed.archetypes.length,
            archetypes: createdArchetypes,
        });

    } catch (error) {
        console.error("[API] POST /api/archetypes/[sessionId]/generate error:", error);

        // Try to set status to ERROR
        try {
            const { sessionId } = await params;
            await prisma.archetypeSession.update({
                where: { id: sessionId },
                data: { status: "ERROR" },
            });
        } catch { }

        return errorResponse("Internal server error", 500);
    }
}
// Created by Swapnil Bapat © 2026
