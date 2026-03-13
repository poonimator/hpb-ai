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
                simulationArchetypes: {
                    include: {
                        archetype: true,
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
            const allArchetypes = simulation.simulationArchetypes.map(sa => sa.archetype);

            if (allArchetypes.length === 0) {
                return errorResponse("Focus group has no archetypes linked.", 400);
            }

            // Determine which archetypes should respond
            let respondingArchetypes = allArchetypes;
            if (targetArchetypeIds && Array.isArray(targetArchetypeIds) && targetArchetypeIds.length > 0) {
                respondingArchetypes = allArchetypes.filter(a => targetArchetypeIds.includes(a.id));
                if (respondingArchetypes.length === 0) {
                    return errorResponse("None of the tagged archetypes are in this focus group.", 400);
                }
            }

            // Retrieve grounding context once (shared across all archetypes)
            const retrievalQuery = `${userMessageContent} ${lifeStage} ${researchStatement}`;
            const retrievedChunks = await retrieveKBContext({
                query: retrievalQuery,
                docTypes: ["RESEARCH", "POLICY", "FRAMEWORK"],
                limitChunks: 3
            });
            const groundingContext = retrievedChunks.map(c =>
                `[Source: ${c.documentTitle}]\n${c.text}`
            );

            // Build archetype name lookup for conversation history labelling
            const archetypeNameMap: Record<string, string> = {};
            for (const a of allArchetypes) {
                archetypeNameMap[a.id] = a.name;
            }

            // Process each archetype sequentially (so they see each other's responses)
            const newMessages: Array<{ id: string; role: string; content: string; archetypeId: string; archetypeName: string; timestamp: string; latencyMs: number }> = [];

            // Build fresh conversation history including any new messages from this round
            const buildConversationHistory = () => {
                const existingHistory = simulation.messages.map(m => ({
                    role: m.role,
                    content: m.content,
                    speakerName: m.role === "persona" && m.archetypeId ? (archetypeNameMap[m.archetypeId] || "Participant") : undefined,
                }));
                // Add messages generated in this round so subsequent archetypes see them
                const roundHistory = newMessages.map(m => ({
                    role: "persona" as const,
                    content: m.content,
                    speakerName: m.archetypeName,
                }));
                return [...existingHistory, ...roundHistory];
            };

            for (const arch of respondingArchetypes) {
                const archetypeContent = assembleArchetypeContent(arch);
                const otherNames = allArchetypes
                    .filter(a => a.id !== arch.id)
                    .map(a => a.name);

                const prompt = buildFocusGroupPrompt({
                    projectName,
                    researchStatement,
                    archetypeName: arch.name,
                    archetypeContent,
                    otherArchetypeNames: otherNames,
                    conversationHistory: buildConversationHistory(),
                    userMessage: userMessageContent,
                    groundingContext,
                });

                const result = await generatePersonaReply({
                    prompt,
                    modelName: "gpt-5.2",
                    imageBase64: imageBase64 || undefined,
                });

                if (!result.success) {
                    console.error(`[FocusGroup] AI failed for archetype ${arch.name}:`, result.error);
                    continue; // Skip this archetype, don't crash the whole request
                }

                // Filter out [NO_RESPONSE] messages
                if (isNoResponse(result.content)) {
                    console.log(`[FocusGroup] ${arch.name} chose not to respond`);
                    continue;
                }

                // Save the message
                const savedMessage = await prisma.simulationMessage.create({
                    data: {
                        simulationId,
                        role: "persona",
                        content: result.content,
                        archetypeId: arch.id,
                        latencyMs: result.latencyMs,
                    }
                });

                newMessages.push({
                    id: savedMessage.id,
                    role: "persona",
                    content: result.content,
                    archetypeId: arch.id,
                    archetypeName: arch.name,
                    timestamp: savedMessage.timestamp.toISOString(),
                    latencyMs: result.latencyMs || 0,
                });

                await logAudit({
                    action: "GEMINI_SIMULATE",
                    entityType: "Simulation",
                    entityId: simulationId,
                    meta: {
                        focusGroup: true,
                        archetypeId: arch.id,
                        archetypeName: arch.name,
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

        if (simulation.archetype) {
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
