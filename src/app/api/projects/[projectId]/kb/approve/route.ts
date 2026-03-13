import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ projectId: string }>;
}

// POST /api/projects/[projectId]/kb/approve - Approve a project KB document
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { projectId } = await params;
        const body = await request.json();
        const { documentId } = body;

        if (!documentId) {
            return errorResponse("Missing documentId", 400);
        }

        // Verify document exists and belongs to this project
        const document = await prisma.projectKbDocument.findFirst({
            where: {
                id: documentId,
                projectId: projectId,
            },
        });

        if (!document) {
            return errorResponse("Document not found in this project", 404);
        }

        const updated = await prisma.projectKbDocument.update({
            where: { id: documentId },
            data: { status: "APPROVED" },
        });

        await logAudit({
            action: "KB_APPROVE",
            entityType: "ProjectKbDocument",
            entityId: documentId,
            meta: { projectId, title: document.title },
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[API] POST /api/projects/[projectId]/kb/approve error:", error);
        return errorResponse("Failed to approve document", 500);
    }
}
// Created by Swapnil Bapat © 2026
