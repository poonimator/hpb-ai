import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// POST /api/sub-projects/[subProjectId]/archetypes - Create archetype session
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name) {
            return errorResponse("Session name is required", 400);
        }

        // Verify sub-project exists
        const subProject = await prisma.subProject.findUnique({
            where: { id: subProjectId },
        });

        if (!subProject) {
            return errorResponse("Workspace not found", 404);
        }

        // Create Archetype Session
        const session = await prisma.archetypeSession.create({
            data: {
                subProjectId,
                name,
                status: "SETUP",
            },
        });

        // Audit Log
        await logAudit({
            action: "CREATE",
            entityType: "ArchetypeSession",
            entityId: session.id,
            meta: { name: session.name, subProjectId },
        });

        return successResponse(session, 201);
    } catch (error) {
        console.error("[API] POST /api/sub-projects/[id]/archetypes error:", error);
        return errorResponse("Failed to create archetype session", 500);
    }
}
// Created by Swapnil Bapat © 2026
