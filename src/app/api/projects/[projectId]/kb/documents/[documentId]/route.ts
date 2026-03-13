import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import { deleteFile } from "@/lib/storage";

interface RouteParams {
    params: Promise<{ projectId: string; documentId: string }>;
}

// GET /api/projects/[projectId]/kb/documents/[documentId] - Get document details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { projectId, documentId } = await params;

        const document = await prisma.projectKbDocument.findFirst({
            where: {
                id: documentId,
                projectId: projectId,
            },
            include: {
                chunks: {
                    orderBy: { chunkIndex: "asc" },
                },
                _count: {
                    select: {
                        chunks: true,
                        simulations: true,
                    },
                },
            },
        });

        if (!document) {
            return errorResponse("Document not found in this project", 404);
        }

        return successResponse(document);
    } catch (error) {
        console.error("[API] GET /api/projects/[projectId]/kb/documents/[id] error:", error);
        return errorResponse("Failed to fetch document", 500);
    }
}

// DELETE /api/projects/[projectId]/kb/documents/[documentId] - Delete document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { projectId, documentId } = await params;

        const document = await prisma.projectKbDocument.findFirst({
            where: {
                id: documentId,
                projectId: projectId,
            },
        });

        if (!document) {
            return errorResponse("Document not found in this project", 404);
        }

        // Delete from database (cascades to chunks)
        await prisma.projectKbDocument.delete({
            where: { id: documentId },
        });

        // Delete from Vercel Blob
        if (document.storagePath) {
            await deleteFile(document.storagePath);
        }

        await logAudit({
            action: "DELETE",
            entityType: "ProjectKbDocument",
            entityId: documentId,
            meta: { projectId, title: document.title },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/projects/[projectId]/kb/documents/[id] error:", error);
        return errorResponse("Failed to delete document", 500);
    }
}
// Created by Swapnil Bapat © 2026
