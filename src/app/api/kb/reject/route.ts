import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { documentId } = body;

        if (!documentId) {
            return errorResponse("documentId is required", 400);
        }

        const doc = await prisma.kbDocument.update({
            where: { id: documentId },
            data: { status: "REJECTED" },
        });

        await logAudit({
            action: "UPDATE",
            entityType: "KbDocument",
            entityId: doc.id,
            meta: { title: doc.title, newStatus: "REJECTED" },
        });

        return successResponse(doc);
    } catch (error) {
        console.error("[API] POST /api/kb/reject error:", error);
        return errorResponse("Failed to reject document", 500);
    }
}
// Created by Swapnil Bapat © 2026
