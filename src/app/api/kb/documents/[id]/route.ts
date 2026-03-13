import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import { deleteFile } from "@/lib/storage";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        if (!id) {
            return errorResponse("Document ID is required", 400);
        }

        // 1. Fetch doc to get storage path
        const doc = await prisma.kbDocument.findUnique({
            where: { id },
        });

        if (!doc) {
            return errorResponse("Document not found", 404);
        }

        // 2. Delete from DB (Cascade deletes chunks)
        await prisma.kbDocument.delete({
            where: { id },
        });

        // 3. Delete from Vercel Blob
        if (doc.storagePath) {
            await deleteFile(doc.storagePath);
        }

        // 4. Log Audit
        await logAudit({
            action: "DELETE",
            entityType: "KbDocument",
            entityId: id,
            meta: { title: doc.title, docType: doc.docType },
        });

        return successResponse({ success: true });
    } catch (error) {
        console.error("[API] DELETE /api/kb/documents/[id] error:", error);
        return errorResponse("Failed to delete document", 500);
    }
}
// Created by Swapnil Bapat © 2026
