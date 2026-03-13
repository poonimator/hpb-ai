import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import {
    CreateSubProjectSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// GET /api/sub-projects - List all sub-projects (optionally filtered by projectId)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");

        const whereClause = projectId ? { projectId } : {};

        const subProjects = await prisma.subProject.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        guideVersions: true,
                        simulations: true,
                    },
                },
                guideVersions: {
                    orderBy: { versionNumber: "desc" },
                    take: 1,
                    select: {
                        id: true,
                        name: true,
                        versionNumber: true,
                    },
                },
            },
        });

        return successResponse(subProjects);
    } catch (error) {
        console.error("[API] GET /api/sub-projects error:", error);
        return errorResponse("Failed to fetch sub-projects", 500);
    }
}

// POST /api/sub-projects - Create a new sub-project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = CreateSubProjectSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const { projectId, name, researchStatement, ageRange, lifeStage } = validation.data;

        // Verify the parent project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return errorResponse("Project not found", 404);
        }

        const subProject = await prisma.subProject.create({
            data: {
                projectId,
                name,
                researchStatement,
                ageRange,
                lifeStage,
            },
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
            action: "CREATE",
            entityType: "SubProject",
            entityId: subProject.id,
            meta: { projectId, name, ageRange, lifeStage },
        });

        return successResponse(subProject, 201);
    } catch (error) {
        console.error("[API] POST /api/sub-projects error:", error);
        return errorResponse("Failed to create sub-project", 500);
    }
}
// Created by Swapnil Bapat © 2026
