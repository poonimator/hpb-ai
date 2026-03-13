import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

// GET /api/projects/[projectId] - Get project details with sub-projects and KB
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                // Sub-projects with their details
                subProjects: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        guideVersions: {
                            orderBy: { createdAt: "desc" },
                            take: 1,
                            select: {
                                id: true,
                                name: true,
                                versionNumber: true,
                            },
                        },
                        _count: {
                            select: {
                                guideVersions: true,
                                simulations: true,
                            },
                        },
                    },
                },
                // Project-specific KB documents
                kbDocuments: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        docType: true,
                        status: true,
                        createdAt: true,
                    },
                },
                // Project counts
                _count: {
                    select: {
                        subProjects: true,
                        kbDocuments: true,
                        simulations: true, // Legacy
                    },
                },
                // Legacy: Keep for backward compatibility during transition
                guideVersions: {
                    orderBy: { versionNumber: "desc" },
                    take: 1,
                    include: {
                        guideSets: {
                            include: {
                                questions: {
                                    where: { parentId: null },
                                    orderBy: { order: "asc" },
                                    include: {
                                        subQuestions: {
                                            orderBy: { order: "asc" },
                                        },
                                    },
                                },
                            },
                            orderBy: { createdAt: "asc" },
                        },
                    },
                },
            },
        });

        if (!project) {
            return errorResponse("Project not found", 404);
        }

        return successResponse(project);
    } catch (error) {
        console.error("[API] GET /api/projects/[projectId] error:", error);
        return errorResponse("Failed to fetch project", 500);
    }
}

// PATCH /api/projects/[projectId] - Update project
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;
        const body = await request.json();

        // Verify project exists
        const existing = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!existing) {
            return errorResponse("Project not found", 404);
        }

        // Build update data (support both new and legacy fields)
        const updateData: {
            name?: string;
            description?: string;
            // Legacy fields (for backward compatibility)
            researchStatement?: string;
            ageRange?: string;
            lifeStage?: string;
            setupComplete?: boolean;
        } = {};

        if (typeof body.name === "string") updateData.name = body.name;
        if (typeof body.description === "string") updateData.description = body.description;
        // Legacy fields
        if (typeof body.researchStatement === "string") updateData.researchStatement = body.researchStatement;
        if (typeof body.ageRange === "string") updateData.ageRange = body.ageRange;
        if (typeof body.lifeStage === "string") updateData.lifeStage = body.lifeStage;
        if (typeof body.setupComplete === "boolean") updateData.setupComplete = body.setupComplete;

        const updated = await prisma.project.update({
            where: { id: projectId },
            data: updateData,
        });

        await logAudit({
            action: "UPDATE",
            entityType: "Project",
            entityId: projectId,
            meta: { updatedFields: Object.keys(updateData) },
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[API] PATCH /api/projects/[projectId] error:", error);
        return errorResponse("Failed to update project", 500);
    }
}

// PUT /api/projects/[projectId] - Update project (alias for PATCH)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    return PATCH(request, { params });
}

// DELETE /api/projects/[projectId] - Delete project (cascades to sub-projects, guides, simulations)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params;

        const existing = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                _count: {
                    select: {
                        subProjects: true,
                        kbDocuments: true,
                    },
                },
            },
        });

        if (!existing) {
            return errorResponse("Project not found", 404);
        }

        await prisma.project.delete({
            where: { id: projectId },
        });

        await logAudit({
            action: "DELETE",
            entityType: "Project",
            entityId: projectId,
            meta: {
                name: existing.name,
                subProjectsDeleted: existing._count.subProjects,
                kbDocsDeleted: existing._count.kbDocuments,
            },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/projects/[projectId] error:", error);
        return errorResponse("Failed to delete project", 500);
    }
}

// Created by Swapnil Bapat © 2026
