import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import {
    CreateProjectSchema,
    CreateSimpleProjectSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// GET /api/projects - List all projects with their sub-projects
export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                subProjects: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        _count: {
                            select: {
                                guideVersions: true,
                                simulations: true,
                            },
                        },
                    },
                },
                kbDocuments: {
                    where: { status: "APPROVED" },
                    select: {
                        id: true,
                        title: true,
                        docType: true,
                    },
                },
                _count: {
                    select: {
                        subProjects: true,
                        kbDocuments: true,
                        // Legacy counts for backward compatibility
                        simulations: true,
                    },
                },
                // Legacy: Keep for backward compatibility
                guideVersions: {
                    orderBy: { versionNumber: "desc" },
                    take: 1,
                },
            },
        });

        return successResponse(projects);
    } catch (error) {
        console.error("[API] GET /api/projects error:", error);
        return errorResponse("Failed to fetch projects", 500);
    }
}

// POST /api/projects - Create a new project
// Supports both legacy (with researchStatement) and new simplified (name + description) schemas
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Try new simplified schema first
        const simpleValidation = CreateSimpleProjectSchema.safeParse(body);
        if (simpleValidation.success) {
            const { name, description } = simpleValidation.data;

            const project = await prisma.project.create({
                data: {
                    name,
                    description: description || "",
                },
            });

            // Audit log
            await logAudit({
                action: "CREATE",
                entityType: "Project",
                entityId: project.id,
                meta: { name, type: "simple" },
            });

            return successResponse(project, 201);
        }

        // Fall back to legacy schema (for backward compatibility)
        const legacyValidation = CreateProjectSchema.safeParse(body);
        if (legacyValidation.success) {
            const { name, researchStatement, ageRange, lifeStage } = legacyValidation.data;

            const project = await prisma.project.create({
                data: {
                    name,
                    description: researchStatement, // Use researchStatement as description
                    researchStatement,
                    ageRange,
                    lifeStage,
                },
            });

            // Audit log
            await logAudit({
                action: "CREATE",
                entityType: "Project",
                entityId: project.id,
                meta: { name, ageRange, lifeStage, type: "legacy" },
            });

            return successResponse(project, 201);
        }

        // If neither schema validates, return validation error
        return validationErrorResponse(simpleValidation.error);
    } catch (error) {
        console.error("[API] POST /api/projects error:", error);
        return errorResponse("Failed to create project", 500);
    }
}
// Created by Swapnil Bapat © 2026
