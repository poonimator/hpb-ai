import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// GET /api/sub-projects/[subProjectId]/insight-critiques
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;

        const critiques = await prisma.insightCritique.findMany({
            where: { subProjectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                insightStatement: true,
                overallVerdict: true,
                critiqueJson: true,
                createdAt: true,
            },
        });

        return successResponse(critiques);
    } catch (error) {
        console.error("[API] GET insight-critiques error:", error);
        return errorResponse("Failed to fetch insight critiques", 500);
    }
}
