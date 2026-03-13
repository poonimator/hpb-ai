import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import {
    generateCoachReview
} from "@/lib/ai/openai";
import {
    buildUnifiedCoachReviewPrompt,
    parseCoachReviewResponse
} from "@/lib/ai/prompts/coach_review";
import { retrieveKBContext } from "@/lib/kb/retrieve";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { simulationId } = body;

        if (!simulationId) {
            return errorResponse("simulationId is required", 400);
        }

        // 1. Load Simulation Context (with both SubProject and Project relations)
        const simulation = await prisma.simulation.findUnique({
            where: { id: simulationId },
            include: {
                subProject: {
                    include: {
                        project: true,
                    },
                },
                project: true, // Legacy fallback
                guideVersion: {
                    include: {
                        guideSets: {
                            include: {
                                questions: {
                                    orderBy: { order: 'asc' }
                                }
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { timestamp: "asc" }
                }
            }
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        // Determine the research context - prefer SubProject, fallback to legacy Project
        let projectName = "Unknown Project";
        let researchStatement = "";
        let projectId: string | null = null;

        if (simulation.subProject) {
            // New flow: Use SubProject data
            projectName = simulation.subProject.project?.name || simulation.subProject.name;
            researchStatement = simulation.subProject.researchStatement;
            projectId = simulation.subProject.projectId;
        } else if (simulation.project) {
            // Legacy flow: Use Project data
            projectName = simulation.project.name;
            researchStatement = simulation.project.researchStatement || "";
            projectId = simulation.project.id;
        } else {
            return errorResponse("Simulation has no associated project or sub-project", 400);
        }

        if (simulation.messages.length < 2) {
            return errorResponse("Not enough messages to generate a review.", 400);
        }

        // 2. Resolve Guide - prefer the guide stored on simulation, fallback to latest for subProject/project
        let guideVersion = simulation.guideVersion;

        if (!guideVersion && simulation.subProjectId) {
            guideVersion = await prisma.guideVersion.findFirst({
                where: { subProjectId: simulation.subProjectId },
                orderBy: { versionNumber: 'desc' },
                include: {
                    guideSets: {
                        include: {
                            questions: {
                                orderBy: { order: 'asc' }
                            }
                        }
                    }
                }
            });
        }

        if (!guideVersion && projectId) {
            guideVersion = await prisma.guideVersion.findFirst({
                where: { projectId, subProjectId: null },
                orderBy: { versionNumber: 'desc' },
                include: {
                    guideSets: {
                        include: {
                            questions: {
                                orderBy: { order: 'asc' }
                            }
                        }
                    }
                }
            });
        }

        const guideIntent = guideVersion?.guideSets
            .map((g: any) => g.intent)
            .join("; ") || "";

        const guideQuestions = guideVersion?.guideSets.flatMap((gs: any) =>
            gs.questions.map((q: any) => ({
                text: q.text,
                intent: q.intent || undefined
            }))
        ) || [];

        // Retrieve coaching frameworks from KB if available
        const frameworkDocs = await retrieveKBContext({
            query: "interview coaching rubric bias leading questions",
            docTypes: ["FRAMEWORK"],
            limitChunks: 2
        });

        const coachingFramework = frameworkDocs.map(c => c.text).join("\n\n");

        // 3. Build Prompts
        const ctx: any = {
            projectName,
            researchStatement,
            guideIntent,
            guideQuestions,
            transcript: simulation.messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString()
            })),
            coachingFramework
        };

        // 3. Build Unified Prompt (single prompt for whole conversation analysis)
        const unifiedPrompt = buildUnifiedCoachReviewPrompt(ctx);

        // 4. Call OpenAI (single call instead of two parallel calls)
        // This allows the AI to see the whole conversation context and detect:
        // - Off-topic questions
        // - Questions that don't align with research goals
        // - Missed opportunities that were actually addressed later
        const modelName = "gpt-5.2";

        console.log("[API] review - calling OpenAI with unified prompt");
        const result = await generateCoachReview({ prompt: unifiedPrompt, modelName });

        if (!result.success) {
            await logAudit({
                action: "GEMINI_REVIEW_FAIL",
                entityType: "Simulation",
                entityId: simulationId,
                meta: { error: result.error }
            });
            return errorResponse("Failed to generate review critique.", 500);
        }

        // 5. Parse Result
        const reviewJson = parseCoachReviewResponse(result.content);

        if (!reviewJson) {
            console.error("[API] review - failed to parse:", result.content.slice(0, 500));
            return errorResponse("Failed to parse AI critique.", 500);
        }

        const finalReview = {
            overallScore: reviewJson.overallScore,
            summary: reviewJson.summary,
            highlights: reviewJson.highlights || [],
            leadingMoments: reviewJson.leadingMoments || [],
            betterQuestions: reviewJson.betterQuestions || [],
            missedProbes: reviewJson.missedProbes || []
        };

        // 6. Save Review (Upsert)
        const review = await prisma.coachReview.upsert({
            where: { simulationId },
            create: {
                simulationId,
                findingsJson: JSON.stringify(finalReview),
                modelName: modelName + " (Unified)",
                latencyMs: result.latencyMs || 0
            },
            update: {
                findingsJson: JSON.stringify(finalReview),
                modelName: modelName + " (Unified)",
                latencyMs: result.latencyMs || 0,
                createdAt: new Date() // Refresh timestamp
            }
        });

        // 7. Log Audit
        await logAudit({
            action: "GEMINI_REVIEW",
            entityType: "CoachReview",
            entityId: review.id,
            meta: {
                simulationId,
                score: finalReview.overallScore,
                latency: result.latencyMs || 0
            }
        });

        return successResponse({
            review: finalReview,
            disclaimer: result.disclaimer
        });

    } catch (error) {
        console.error("[API] POST /api/gemini/review error:", error);
        return errorResponse("Internal review error", 500);
    }
}
// Created by Swapnil Bapat © 2026
