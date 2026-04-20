import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string; ideationId: string }>;
}

// GET /api/sub-projects/[subProjectId]/ideations/[ideationId]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId, ideationId } = await params;

        const session = await prisma.ideationSession.findFirst({
            where: { id: ideationId, subProjectId },
        });

        if (!session) {
            return errorResponse("Ideation session not found", 404);
        }

        return successResponse(session);
    } catch (error) {
        console.error("[API] GET ideation session error:", error);
        return errorResponse("Failed to fetch ideation session", 500);
    }
}

// DELETE /api/sub-projects/[subProjectId]/ideations/[ideationId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId, ideationId } = await params;

        const existing = await prisma.ideationSession.findFirst({
            where: { id: ideationId, subProjectId },
        });

        if (!existing) {
            return errorResponse("Ideation session not found", 404);
        }

        await prisma.ideationSession.delete({
            where: { id: ideationId },
        });

        await logAudit({
            action: "DELETE",
            entityType: "IdeationSession",
            entityId: ideationId,
            meta: { subProjectId },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE ideation error:", error);
        return errorResponse("Failed to delete ideation session", 500);
    }
}
