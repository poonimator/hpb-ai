import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

// GET /api/archetypes/[sessionId] - Get archetype session with all archetypes
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;

        const session = await prisma.archetypeSession.findUnique({
            where: { id: sessionId },
            include: {
                archetypes: {
                    orderBy: { order: "asc" },
                },
                subProject: {
                    include: {
                        project: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
        });

        if (!session) {
            return errorResponse("Archetype session not found", 404);
        }

        return successResponse(session);
    } catch (error) {
        console.error("[API] GET /api/archetypes/[id] error:", error);
        return errorResponse("Failed to fetch archetype session", 500);
    }
}

// DELETE /api/archetypes/[sessionId] - Delete archetype session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;

        const existing = await prisma.archetypeSession.findUnique({
            where: { id: sessionId },
        });

        if (!existing) {
            return errorResponse("Archetype session not found", 404);
        }

        await prisma.archetypeSession.delete({
            where: { id: sessionId },
        });

        await logAudit({
            action: "DELETE",
            entityType: "ArchetypeSession",
            entityId: sessionId,
            meta: { name: existing.name },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/archetypes/[id] error:", error);
        return errorResponse("Failed to delete archetype session", 500);
    }
}
// Created by Swapnil Bapat © 2026
