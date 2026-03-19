import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { generateArchetypeSummary, generateCrossProfileSummary } from "@/lib/ai/openai";
import { successResponse, errorResponse } from "@/lib/validations";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { simulationId, force } = body;

        if (!simulationId) {
            return errorResponse("Simulation ID is required", 400);
        }

        const simulation = await prisma.simulation.findUnique({
            where: { id: simulationId },
            include: {
                messages: {
                    orderBy: { timestamp: "asc" }
                },
                simulationArchetypes: {
                    include: { archetype: true }
                }
            }
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        if (!simulation.isFocusGroup || simulation.simulationArchetypes.length === 0) {
            return errorResponse("Not a focus group simulation", 400);
        }

        // Build transcript
        const transcript = simulation.messages.map(msg => {
            let sender = "User (Researcher)";
            if (msg.role === "persona") {
                const arch = simulation.simulationArchetypes.find(a => a.archetypeId === msg.archetypeId);
                sender = arch ? arch.archetype.name : "Participant";
            }
            return `${sender}: ${msg.content}`;
        }).join("\n\n");

        // Generate summary for each archetype that doesn't have one (in parallel)
        const archetypePromises = simulation.simulationArchetypes.map(async (simArch) => {
            if (!simArch.summary || force) {
                const res = await generateArchetypeSummary({
                    archetypeName: simArch.archetype.name,
                    conversationTranscript: transcript,
                    modelName: simulation.modelName || undefined,
                });

                if (res.success && res.summary) {
                    await prisma.simulationArchetype.update({
                        where: { id: simArch.id },
                        data: { summary: res.summary }
                    });
                    return { archetypeId: simArch.archetypeId, summary: res.summary };
                }
            }
            return { archetypeId: simArch.archetypeId, summary: simArch.summary };
        });

        // Set up the cross-profile promise (also running in parallel)
        let crossProfileSummary = simulation.crossProfileSummary;
        let crossProfilePromise = Promise.resolve(crossProfileSummary);

        if (!crossProfileSummary || force) {
            const archetypeNames = simulation.simulationArchetypes.map(a => a.archetype.name);
            crossProfilePromise = generateCrossProfileSummary({
                archetypeNames,
                conversationTranscript: transcript,
                modelName: simulation.modelName || undefined,
            }).then(async (res) => {
                if (res.success && res.summary) {
                    await prisma.simulation.update({
                        where: { id: simulationId },
                        data: { crossProfileSummary: res.summary }
                    });
                    return res.summary;
                }
                return crossProfileSummary;
            });
        }

        // Await all generations concurrently
        const [updatedArchetypes, finalCrossProfileSummary] = await Promise.all([
            Promise.all(archetypePromises),
            crossProfilePromise
        ]);

        return successResponse({
            summaries: updatedArchetypes,
            crossProfileSummary: finalCrossProfileSummary
        });
    } catch (error) {
        console.error("[API] POST /api/gemini/archetype-summary error:", error);
        return errorResponse("Failed to generate archetype summaries", 500);
    }
}
// Created by Swapnil Bapat © 2026
