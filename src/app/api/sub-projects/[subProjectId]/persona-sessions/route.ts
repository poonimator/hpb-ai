import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// Long synthesis pipeline lives behind /persona-sessions/[id]/generate.
export const maxDuration = 300;

// GET /api/sub-projects/[subProjectId]/persona-sessions
//   List all PersonaSessions belonging to a sub-project (newest first).
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;
        const sessions = await prisma.personaSession.findMany({
            where: { subProjectId },
            include: {
                archetypeSession: { select: { id: true, name: true } },
                syntheticPersonas: {
                    select: { id: true, name: true, kicker: true, avatarUrl: true, order: true, archetypeId: true },
                    orderBy: { order: "asc" },
                },
                _count: { select: { classifications: true } },
            },
            orderBy: { createdAt: "desc" },
        });
        return successResponse(sessions);
    } catch (error) {
        console.error("[API] GET /api/sub-projects/[id]/persona-sessions error:", error);
        return errorResponse("Failed to list persona sessions", 500);
    }
}

// POST /api/sub-projects/[subProjectId]/persona-sessions
//   body: {
//     mappingSessionIds: string[]            // required — which mappings feed transcripts
//     profileTarget: string                  // required — "Who are you profiling?" (e.g. "parents")
//     archetypeSessionId?: string | null     // optional — spine for classification
//     selectedArchetypeIds?: string[]        // optional — restrict to a subset of the session
//     name?: string
//   }
//   Creates the session in SETUP state. Does NOT kick the pipeline — the
//   caller follows up with POST /api/persona-sessions/[id]/generate.
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;
        const body = await request.json();
        const {
            archetypeSessionId,
            selectedArchetypeIds,
            mappingSessionIds,
            profileTarget,
            name,
        } = body as {
            archetypeSessionId?: string | null;
            selectedArchetypeIds?: string[];
            mappingSessionIds?: string[];
            profileTarget?: string;
            name?: string;
        };

        if (!Array.isArray(mappingSessionIds) || mappingSessionIds.length === 0) {
            return errorResponse("At least one mapping session must be selected.", 400);
        }
        if (!profileTarget || typeof profileTarget !== "string" || profileTarget.trim() === "") {
            return errorResponse("Profile target is required — tell us who you're profiling.", 400);
        }

        // Verify all mapping sessions belong to this sub-project.
        const mappings = await prisma.mappingSession.findMany({
            where: { id: { in: mappingSessionIds }, subProjectId },
            select: { id: true },
        });
        if (mappings.length !== mappingSessionIds.length) {
            return errorResponse("One or more mapping sessions are not in this workspace.", 400);
        }

        // If an archetype session is provided, verify it belongs here and has archetypes.
        let lockedSelectedArchetypeIds: string[] | null = null;
        if (archetypeSessionId) {
            const archSession = await prisma.archetypeSession.findFirst({
                where: { id: archetypeSessionId, subProjectId },
                include: { archetypes: { select: { id: true } } },
            });
            if (!archSession) {
                return errorResponse("Archetype session not found in this workspace.", 404);
            }
            if (archSession.archetypes.length === 0) {
                return errorResponse("Archetype session has no archetypes.", 400);
            }
            // Validate any subset selection.
            if (Array.isArray(selectedArchetypeIds) && selectedArchetypeIds.length > 0) {
                const validIds = new Set(archSession.archetypes.map(a => a.id));
                const filtered = selectedArchetypeIds.filter(id => validIds.has(id));
                if (filtered.length === 0) {
                    return errorResponse("Selected archetypes do not belong to the chosen archetype session.", 400);
                }
                lockedSelectedArchetypeIds = filtered;
            }
        }

        const session = await prisma.personaSession.create({
            data: {
                subProjectId,
                archetypeSessionId: archetypeSessionId || null,
                selectedArchetypeIdsJson: lockedSelectedArchetypeIds
                    ? JSON.stringify(lockedSelectedArchetypeIds)
                    : null,
                profileTarget: profileTarget.trim(),
                name: name?.trim() || `Personas — ${new Date().toLocaleDateString()}`,
                status: "SETUP",
                sourceMappingIdsJson: JSON.stringify(mappingSessionIds),
            },
        });

        await logAudit({
            action: "CREATE",
            entityType: "PersonaSession",
            entityId: session.id,
            meta: {
                mode: archetypeSessionId ? "archetype-spine" : "archetypeless",
                archetypeSessionId: archetypeSessionId || null,
                selectedArchetypeCount: lockedSelectedArchetypeIds?.length || 0,
                mappingSessionCount: mappingSessionIds.length,
                profileTarget: profileTarget.trim(),
            },
        });

        return successResponse(session, 201);
    } catch (error) {
        console.error("[API] POST /api/sub-projects/[id]/persona-sessions error:", error);
        return errorResponse("Failed to create persona session", 500);
    }
}
// Created by Swapnil Bapat © 2026
