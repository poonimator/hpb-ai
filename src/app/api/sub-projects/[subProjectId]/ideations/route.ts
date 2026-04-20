import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// GET /api/sub-projects/[subProjectId]/ideations
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;

        const sessions = await prisma.ideationSession.findMany({
            where: { subProjectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                status: true,
                sourceMappingId: true,
                focusAreasJson: true,
                createdAt: true,
            },
        });

        return successResponse(sessions);
    } catch (error) {
        console.error("[API] GET ideations error:", error);
        return errorResponse("Failed to fetch ideation sessions", 500);
    }
}

// POST /api/sub-projects/[subProjectId]/ideations
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;
        const body = await request.json();
        const { mappingId, profileIds, focusAreas, name } = body;

        if (!mappingId || typeof mappingId !== "string") {
            return errorResponse("A mapping session must be selected", 400);
        }

        // Verify the mapping session exists and belongs to this sub-project
        const mapping = await prisma.mappingSession.findFirst({
            where: { id: mappingId, subProjectId, status: "COMPLETE" },
        });

        if (!mapping) {
            return errorResponse("Mapping session not found or not complete", 404);
        }

        const session = await prisma.ideationSession.create({
            data: {
                subProjectId,
                name: name || `Ideation — ${mapping.name}`,
                status: "SETUP",
                sourceMappingId: mappingId,
                sourceProfileIdsJson: profileIds ? JSON.stringify(profileIds) : null,
                focusAreasJson: focusAreas && focusAreas.length > 0 ? JSON.stringify(focusAreas) : null,
            },
        });

        await logAudit({
            action: "CREATE",
            entityType: "IdeationSession",
            entityId: session.id,
            meta: { subProjectId, mappingId },
        });

        return successResponse(session, 201);
    } catch (error) {
        console.error("[API] POST ideations error:", error);
        return errorResponse("Failed to create ideation session", 500);
    }
}
