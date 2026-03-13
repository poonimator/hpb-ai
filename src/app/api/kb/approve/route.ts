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
            data: { status: "APPROVED" },
        });

        await logAudit({
            action: "KB_APPROVE",
            entityType: "KBDocument",
            entityId: doc.id,
            meta: { title: doc.title, previousStatus: "DRAFT" },
        });

        return successResponse(doc);
    } catch (error) {
        console.error("[API] POST /api/kb/approve error:", error);
        return errorResponse("Failed to approve document", 500);
    }
}
// Created by Swapnil Bapat © 2026
