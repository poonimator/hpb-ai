import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string; critiqueId: string }>;
}

// DELETE /api/sub-projects/[subProjectId]/insight-critiques/[critiqueId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId, critiqueId } = await params;

        const existing = await prisma.insightCritique.findFirst({
            where: { id: critiqueId, subProjectId },
        });

        if (!existing) {
            return errorResponse("Insight critique not found", 404);
        }

        await prisma.insightCritique.delete({
            where: { id: critiqueId },
        });

        await logAudit({
            action: "DELETE",
            entityType: "InsightCritique",
            entityId: critiqueId,
            meta: { subProjectId },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE insight-critique error:", error);
        return errorResponse("Failed to delete insight critique", 500);
    }
}
