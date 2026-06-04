import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

// GET /api/persona-sessions/[sessionId]
//   Returns the session with archetypes, personas, classifications, and a
//   staleness summary (so the UI can show the "Regenerate to incorporate
//   N new transcripts" banner without a second round-trip).
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const session = await prisma.personaSession.findUnique({
            where: { id: sessionId },
            include: {
                archetypeSession: {
                    include: { archetypes: { orderBy: { order: "asc" } } },
                },
                syntheticPersonas: { orderBy: { order: "asc" } },
                classifications: {
                    include: {
                        transcript: { select: { id: true, displayName: true, mappingSessionId: true } },
                    },
                },
                subProject: { select: { id: true, name: true, projectId: true } },
            },
        });
        if (!session) return errorResponse("Persona session not found", 404);

        // Staleness: any MappingTranscript in the source mapping sessions that
        // wasn't in the locked-in list at run time → new transcript.
        const lockedTranscriptIds: string[] = session.sourceTranscriptIdsJson
            ? JSON.parse(session.sourceTranscriptIdsJson)
            : [];
        const sourceMappingIds: string[] = session.sourceMappingIdsJson
            ? JSON.parse(session.sourceMappingIdsJson)
            : [];

        let newTranscriptIds: string[] = [];
        if (sourceMappingIds.length > 0 && lockedTranscriptIds.length > 0) {
            const currentTranscripts = await prisma.mappingTranscript.findMany({
                where: { mappingSessionId: { in: sourceMappingIds } },
                select: { id: true },
            });
            const lockedSet = new Set(lockedTranscriptIds);
            newTranscriptIds = currentTranscripts.map(t => t.id).filter(id => !lockedSet.has(id));
        }

        // Archetypeless sessions have no archetype-side staleness signal.
        const archetypeUpdatedAfterRun = session.archetypeSession
            ? session.archetypeSession.archetypes.some(a =>
                new Date(a.updatedAt).getTime() > new Date(session.updatedAt).getTime()
            )
            : false;

        return successResponse({
            ...session,
            staleness: {
                isStale: newTranscriptIds.length > 0 || archetypeUpdatedAfterRun,
                newTranscriptIds,
                archetypeUpdatedAfterRun,
            },
        });
    } catch (error) {
        console.error("[API] GET /api/persona-sessions/[id] error:", error);
        return errorResponse("Failed to load persona session", 500);
    }
}

// DELETE /api/persona-sessions/[sessionId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const exists = await prisma.personaSession.findUnique({ where: { id: sessionId } });
        if (!exists) return errorResponse("Persona session not found", 404);
        await prisma.personaSession.delete({ where: { id: sessionId } });
        await logAudit({ action: "DELETE", entityType: "PersonaSession", entityId: sessionId });
        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/persona-sessions/[id] error:", error);
        return errorResponse("Failed to delete persona session", 500);
    }
}
// Created by Swapnil Bapat © 2026
