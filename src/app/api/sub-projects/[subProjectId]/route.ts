import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import {
    UpdateSubProjectSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// GET /api/sub-projects/[subProjectId] - Get sub-project details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;

        const subProject = await prisma.subProject.findUnique({
            where: { id: subProjectId },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                    },
                },
                guideVersions: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        guideSets: {
                            include: {
                                questions: {
                                    orderBy: { order: "asc" },
                                    include: {
                                        subQuestions: {
                                            orderBy: { order: "asc" },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                simulations: {
                    orderBy: { startedAt: "desc" },
                    take: 10,
                    select: {
                        id: true,
                        startedAt: true,
                        endedAt: true,
                        isFocusGroup: true,
                        personaDoc: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        projectPersonaDoc: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                        archetype: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                        simulationArchetypes: {
                            select: {
                                archetype: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                            orderBy: { order: "asc" },
                        },
                        _count: {
                            select: {
                                messages: true,
                            },
                        },
                        coachReview: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        guideVersions: true,
                        simulations: true,
                        mappingSessions: true,
                        archetypeSessions: true,
                        hmwCritiques: true,
                        insightCritiques: true,
                    },
                },
                mappingSessions: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        createdAt: true,
                        _count: {
                            select: {
                                transcripts: true,
                                clusters: true,
                            },
                        },
                    },
                },
                archetypeSessions: {
                    where: { status: "COMPLETE" },
                    orderBy: { createdAt: "desc" as const },
                    select: {
                        id: true,
                        status: true,
                        archetypes: {
                            orderBy: { order: "asc" as const },
                            select: {
                                id: true,
                                name: true,
                                kicker: true,
                                description: true,
                                demographicJson: true,
                                fullContentJson: true,
                                goalsJson: true,
                                motivationsJson: true,
                                groundTruthJson: true,
                                internalConflictJson: true,
                                breakingPointsJson: true,
                                spiralJson: true,
                                evidenceJson: true,
                                order: true,
                                createdAt: true,
                                archetypeSessionId: true,
                            },
                        },
                    },
                },
                hmwCritiques: {
                    orderBy: { createdAt: "desc" as const },
                    select: {
                        id: true,
                        hmwStatement: true,
                        overallVerdict: true,
                        createdAt: true,
                    },
                },
                insightCritiques: {
                    orderBy: { createdAt: "desc" as const },
                    select: {
                        id: true,
                        insightStatement: true,
                        overallVerdict: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!subProject) {
            return errorResponse("Sub-project not found", 404);
        }

        return successResponse(subProject);
    } catch (error) {
        console.error("[API] GET /api/sub-projects/[id] error:", error);
        return errorResponse("Failed to fetch sub-project", 500);
    }
}

// PATCH /api/sub-projects/[subProjectId] - Update sub-project
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;
        const body = await request.json();
        const validation = UpdateSubProjectSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        // Check if sub-project exists
        const existing = await prisma.subProject.findUnique({
            where: { id: subProjectId },
        });

        if (!existing) {
            return errorResponse("Sub-project not found", 404);
        }

        const subProject = await prisma.subProject.update({
            where: { id: subProjectId },
            data: validation.data,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        // Audit log
        await logAudit({
            action: "UPDATE",
            entityType: "SubProject",
            entityId: subProject.id,
            meta: { ...validation.data },
        });

        return successResponse(subProject);
    } catch (error) {
        console.error("[API] PATCH /api/sub-projects/[id] error:", error);
        return errorResponse("Failed to update sub-project", 500);
    }
}

// PUT /api/sub-projects/[subProjectId] - Update sub-project (alias for PATCH)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    return PATCH(request, { params });
}

// DELETE /api/sub-projects/[subProjectId] - Delete sub-project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;

        // Check if sub-project exists
        const existing = await prisma.subProject.findUnique({
            where: { id: subProjectId },
            include: {
                _count: {
                    select: {
                        simulations: true,
                        guideVersions: true,
                    },
                },
            },
        });

        if (!existing) {
            return errorResponse("Sub-project not found", 404);
        }

        // Delete the sub-project (cascades to guides and simulations)
        await prisma.subProject.delete({
            where: { id: subProjectId },
        });

        // Audit log
        await logAudit({
            action: "DELETE",
            entityType: "SubProject",
            entityId: subProjectId,
            meta: {
                name: existing.name,
                simulationsDeleted: existing._count.simulations,
                guidesDeleted: existing._count.guideVersions,
            },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/sub-projects/[id] error:", error);
        return errorResponse("Failed to delete sub-project", 500);
    }
}
// Created by Swapnil Bapat © 2026
