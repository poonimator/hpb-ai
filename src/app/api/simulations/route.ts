import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import {
    StartSimulationSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// GET /api/simulations - List all simulations
// Supports filtering by projectId, subProjectId, or mode
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        const subProjectId = searchParams.get("subProjectId");
        const mode = searchParams.get("mode"); // "dojo" or "prism"

        const where: Record<string, unknown> = {};

        if (subProjectId) {
            where.subProjectId = subProjectId;
        } else if (projectId) {
            // Legacy: filter by projectId (includes both direct and via subProject)
            where.OR = [
                { projectId },
                { subProject: { projectId } },
            ];
        }

        if (mode) where.mode = mode;

        const simulations = await prisma.simulation.findMany({
            where,
            include: {
                // New: SubProject relation
                subProject: {
                    select: {
                        id: true,
                        name: true,
                        project: {
                            select: { id: true, name: true },
                        },
                    },
                },
                // Legacy: Project relation
                project: {
                    select: { id: true, name: true },
                },
                persona: {
                    select: { id: true, name: true, lifeStage: true },
                },
                personaDoc: {
                    select: { id: true, title: true },
                },
                projectPersonaDoc: {
                    select: { id: true, title: true },
                },
                archetype: {
                    select: { id: true, name: true },
                },
                _count: {
                    select: { messages: true },
                },
                coachReview: {
                    select: { id: true },
                },
            },
            orderBy: { startedAt: "desc" },
        });

        return successResponse(simulations);
    } catch (error) {
        console.error("[API] GET /api/simulations error:", error);
        return errorResponse("Failed to fetch simulations", 500);
    }
}

// POST /api/simulations - Start a new simulation
// Supports both subProjectId (new) and projectId (legacy)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = StartSimulationSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const {
            projectId,
            subProjectId,
            guideVersionId,
            personaId,
            personaDocId,
            projectPersonaDocId,
            archetypeId,
            isFocusGroup,
            archetypeIds,
            mode,
            mixerSettings
        } = validation.data;

        // Determine target context
        let targetSubProjectId: string | null = subProjectId || null;
        let targetProjectId: string | null = projectId || null;

        if (subProjectId) {
            // New flow: Verify sub-project exists
            const subProject = await prisma.subProject.findUnique({
                where: { id: subProjectId },
            });

            if (!subProject) {
                return errorResponse("Sub-project not found", 404);
            }

            targetProjectId = subProject.projectId;
        } else if (projectId) {
            // Legacy flow: Verify project exists
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });

            if (!project) {
                return errorResponse("Project not found", 404);
            }
        } else {
            return errorResponse("Either projectId or subProjectId is required", 400);
        }

        // Focus Group validation
        if (isFocusGroup) {
            if (!archetypeIds || archetypeIds.length < 2) {
                return errorResponse("Focus group requires at least 2 archetypes", 400);
            }
            if (archetypeIds.length > 5) {
                return errorResponse("Focus group supports a maximum of 5 archetypes", 400);
            }
            // Verify all archetypes exist
            const foundArchetypes = await prisma.archetype.findMany({
                where: { id: { in: archetypeIds } },
                select: { id: true },
            });
            if (foundArchetypes.length !== archetypeIds.length) {
                return errorResponse("One or more archetypes not found", 404);
            }
        }

        // Verify persona exists (whichever type is provided) — 1:1 mode only
        if (!isFocusGroup) {
            if (personaId) {
                const persona = await prisma.persona.findUnique({ where: { id: personaId } });
                if (!persona) {
                    return errorResponse("Persona not found", 404);
                }
            }

            if (personaDocId) {
                const personaDoc = await prisma.kbDocument.findUnique({ where: { id: personaDocId } });
                if (!personaDoc) {
                    return errorResponse("Persona document not found in global KB", 404);
                }
            }

            if (projectPersonaDocId) {
                const projectPersonaDoc = await prisma.projectKbDocument.findFirst({
                    where: {
                        id: projectPersonaDocId,
                        projectId: targetProjectId!,
                    },
                });
                if (!projectPersonaDoc) {
                    return errorResponse("Persona document not found in project KB", 404);
                }
            }

            // Verify archetype exists if provided
            if (archetypeId) {
                const archetype = await prisma.archetype.findUnique({ where: { id: archetypeId } });
                if (!archetype) {
                    return errorResponse("Archetype not found", 404);
                }
            }
        }

        const simulation = await prisma.simulation.create({
            data: {
                subProjectId: targetSubProjectId,
                projectId: subProjectId ? null : targetProjectId,
                guideVersionId: isFocusGroup ? null : guideVersionId,
                personaId: isFocusGroup ? null : personaId,
                personaDocId: isFocusGroup ? null : personaDocId,
                projectPersonaDocId: isFocusGroup ? null : projectPersonaDocId,
                archetypeId: isFocusGroup ? null : archetypeId,
                isFocusGroup: isFocusGroup || false,
                mode,
                mixerJson: isFocusGroup ? null : (mixerSettings ? JSON.stringify(mixerSettings) : null),
            },
            include: {
                subProject: {
                    select: {
                        id: true,
                        name: true,
                        project: { select: { id: true, name: true } },
                    },
                },
                project: { select: { id: true, name: true } },
                persona: true,
                personaDoc: { select: { id: true, title: true, parsedMetaJson: true } },
                projectPersonaDoc: { select: { id: true, title: true, parsedMetaJson: true } },
                archetype: { select: { id: true, name: true, kicker: true, description: true } },
                simulationArchetypes: {
                    include: {
                        archetype: { select: { id: true, name: true, kicker: true, description: true } },
                    },
                    orderBy: { order: "asc" },
                },
            },
        });

        // Create focus group archetype links
        if (isFocusGroup && archetypeIds) {
            await prisma.simulationArchetype.createMany({
                data: archetypeIds.map((aid, idx) => ({
                    simulationId: simulation.id,
                    archetypeId: aid,
                    order: idx,
                })),
            });
        }

        await logAudit({
            action: "START",
            entityType: "Simulation",
            entityId: simulation.id,
            meta: {
                subProjectId: targetSubProjectId,
                projectId: targetProjectId,
                personaId,
                personaDocId,
                projectPersonaDocId,
                archetypeId,
                isFocusGroup,
                archetypeIds,
                mode,
            },
        });

        return successResponse(simulation, 201);
    } catch (error) {
        console.error("[API] POST /api/simulations error:", error);
        return errorResponse("Failed to start simulation", 500);
    }
}

// Created by Swapnil Bapat © 2026
