import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import { generateCoachChat } from "@/lib/ai/openai";
import { buildLiveCoachPrompt, parseLiveCoachResponse, LiveCoachContext } from "@/lib/ai/prompts/live_coach";
import { retrieveGlobalFrameworks, retrieveProjectResearchDocs } from "@/lib/kb/retrieve";

/**
 * POST /api/gemini/live-coach
 * 
 * Generates real-time coaching feedback during a live simulation.
 * Called after each persona response to provide guidance to the interviewer.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            simulationId,
            latestInterviewerQuestion,
            latestPersonaResponse,
            coveredQuestionIds = []
        } = body;

        if (!simulationId) {
            return errorResponse("simulationId is required", 400);
        }

        if (!latestInterviewerQuestion || !latestPersonaResponse) {
            return errorResponse("latestInterviewerQuestion and latestPersonaResponse are required", 400);
        }

        // 1. Load Simulation Context with guide and messages
        const simulation = await prisma.simulation.findUnique({
            where: { id: simulationId },
            include: {
                subProject: {
                    include: {
                        project: true,
                    },
                },
                project: true,
                guideVersion: {
                    include: {
                        guideSets: {
                            include: {
                                questions: {
                                    include: {
                                        subQuestions: true
                                    }
                                }
                            }
                        }
                    }
                },
                messages: {
                    orderBy: { timestamp: "asc" },
                    take: 20
                }
            }
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        // 2. Extract research context
        let researchStatement = "";
        let ageRange = "";
        let lifeStage = "";

        if (simulation.subProject) {
            researchStatement = simulation.subProject.researchStatement;
            ageRange = simulation.subProject.ageRange;
            lifeStage = simulation.subProject.lifeStage;
        } else if (simulation.project) {
            researchStatement = simulation.project.researchStatement || "";
            ageRange = simulation.project.ageRange || "";
            lifeStage = simulation.project.lifeStage || "";
        }

        // 3. Extract guide questions
        const guideQuestions: LiveCoachContext["guideQuestions"] = [];

        if (simulation.guideVersion?.guideSets) {
            for (const set of simulation.guideVersion.guideSets) {
                for (const question of set.questions || []) {
                    guideQuestions.push({
                        id: question.id,
                        setTitle: set.title,
                        text: question.text,
                        subQuestions: question.subQuestions?.map(sq => sq.text) || []
                    });
                }
            }
        }

        // 4. Format conversation history
        const conversationHistory = simulation.messages.map(m => ({
            role: m.role,
            content: m.content
        }));

        // 5. Fetch Knowledge Base documents for AI grounding
        // Get the project ID from either subProject or project
        const projectId = simulation.subProject?.projectId || simulation.projectId;

        // Fetch Global Frameworks (for AI mindset)
        const globalFrameworks = await retrieveGlobalFrameworks();
        const frameworkDocuments = globalFrameworks.map(doc => ({
            title: doc.title,
            content: doc.content
        }));

        // Fetch Project Research Documents (for hypothesis validation checking)
        let researchDocuments: Array<{ title: string; content: string }> = [];
        if (projectId) {
            const projectResearch = await retrieveProjectResearchDocs(projectId);
            researchDocuments = projectResearch.map(doc => ({
                title: doc.title,
                content: doc.content
            }));
        }

        console.log("[LiveCoach API] KB context: frameworks=", frameworkDocuments.length, "research=", researchDocuments.length);

        // 6. Build the prompt with KB context
        const ctx: LiveCoachContext = {
            researchStatement,
            ageRange,
            lifeStage,
            guideQuestions,
            conversationHistory,
            latestPersonaResponse,
            latestInterviewerQuestion,
            coveredQuestionIds,
            frameworkDocuments,
            researchDocuments
        };

        const prompt = buildLiveCoachPrompt(ctx);

        // 7. Call AI - use default model (gpt-5-mini was returning empty responses)
        console.log("[LiveCoach API] Calling AI with prompt length:", prompt.length);

        const result = await generateCoachChat({
            systemPrompt: prompt,
            userMessage: "Analyze this exchange and provide coaching feedback in JSON format.",
            modelName: "gpt-5.2" // Use main model - mini was returning empty
        });

        console.log("[LiveCoach API] AI response - success:", result.success, "error:", result.error);

        if (!result.success) {
            await logAudit({
                action: "LIVE_COACH_FAIL",
                entityType: "Simulation",
                entityId: simulationId,
                meta: { error: result.error }
            });

            // Return empty result instead of error (graceful degradation)
            return successResponse({
                opportunities: [],
                coachingNudge: null,
                highlightQuote: null,
                suggestedGuideQuestion: null,
                newlyCoveredQuestionIds: [],
                missedOpportunity: false
            });
        }

        // 8. Parse the response
        console.log("[LiveCoach API] AI call success, content length:", result.content?.length, "model:", result.modelName);
        const coachResult = parseLiveCoachResponse(result.content);

        // 9. Log success
        await logAudit({
            action: "LIVE_COACH",
            entityType: "Simulation",
            entityId: simulationId,
            meta: {
                model: result.modelName,
                latency: result.latencyMs,
                opportunitiesCount: coachResult.opportunities.length,
                hasSuggestion: !!coachResult.suggestedGuideQuestion,
                coveredCount: coachResult.newlyCoveredQuestionIds.length
            }
        });

        return successResponse(coachResult);

    } catch (error) {
        console.error("[API] POST /api/gemini/live-coach error:", error);
        return errorResponse("Internal live coach error", 500);
    }
}
// Created by Swapnil Bapat © 2026
