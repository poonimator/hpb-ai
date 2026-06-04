import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";
import { runFullPersonaPipeline } from "@/lib/personas/pipeline";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

// Pipeline = N transcript classifications (parallel) + A archetype syntheses
// (parallel) + A avatar generations (parallel). Up to ~30 OpenAI calls on a
// 20-transcript / 5-archetype project. Allow up to 5 minutes.
export const maxDuration = 300;

// POST /api/persona-sessions/[sessionId]/generate
//   Synchronous: runs the whole pipeline and returns when COMPLETE/ERROR.
//   The client should call GET /api/persona-sessions/[id] afterwards to
//   render results, or poll while the request is in-flight.
export async function POST(_req: NextRequest, { params }: RouteParams) {
    const { sessionId } = await params;
    try {
        const session = await prisma.personaSession.findUnique({ where: { id: sessionId } });
        if (!session) return errorResponse("Persona session not found", 404);

        await runFullPersonaPipeline(sessionId);

        await logAudit({
            action: "GENERATE_PERSONAS",
            entityType: "PersonaSession",
            entityId: sessionId,
        });

        const final = await prisma.personaSession.findUnique({
            where: { id: sessionId },
            include: { syntheticPersonas: true },
        });
        return successResponse({
            status: final?.status,
            personaCount: final?.syntheticPersonas.length ?? 0,
        });
    } catch (error) {
        console.error("[API] POST /api/persona-sessions/[id]/generate error:", error);
        return errorResponse(
            error instanceof Error ? error.message : "Pipeline failed",
            500
        );
    }
}
// Created by Swapnil Bapat © 2026
