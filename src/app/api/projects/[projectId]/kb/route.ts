import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ projectId: string }>;
}

// GET /api/projects/[projectId]/kb - List project-specific KB documents
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { projectId } = await params;
        const { searchParams } = new URL(request.url);
        const docType = searchParams.get("docType");

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) {
            return errorResponse("Project not found", 404);
        }

        const whereClause: { projectId: string; docType?: string } = { projectId };
        if (docType) {
            whereClause.docType = docType;
        }

        const documents = await prisma.projectKbDocument.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: {
                        chunks: true,
                    },
                },
            },
        });

        return successResponse(documents);
    } catch (error) {
        console.error("[API] GET /api/projects/[projectId]/kb error:", error);
        return errorResponse("Failed to fetch project KB documents", 500);
    }
}
// Created by Swapnil Bapat © 2026
