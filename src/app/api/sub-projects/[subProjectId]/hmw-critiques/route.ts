import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// GET /api/sub-projects/[subProjectId]/hmw-critiques
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;

        const critiques = await prisma.hmwCritique.findMany({
            where: { subProjectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                hmwStatement: true,
                overallVerdict: true,
                critiqueJson: true,
                createdAt: true,
            },
        });

        return successResponse(critiques);
    } catch (error) {
        console.error("[API] GET hmw-critiques error:", error);
        return errorResponse("Failed to fetch HMW critiques", 500);
    }
}
