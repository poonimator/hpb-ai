import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";
import { coercePersonaContent, type PersonaContent } from "@/lib/personas/types";

interface RouteParams {
    params: Promise<{ personaId: string }>;
}

// GET /api/personas/[personaId]
//   Returns the full persona with parsed content + parent archetype +
//   contributing transcripts so the detail view can render in one query.
export async function GET(_req: NextRequest, { params }: RouteParams) {
    try {
        const { personaId } = await params;
        const persona = await prisma.syntheticPersona.findUnique({
            where: { id: personaId },
            include: {
                archetype: true,
                personaSession: {
                    include: {
                        subProject: { include: { project: true } },
                        archetypeSession: { select: { id: true, name: true } },
                    },
                },
            },
        });
        if (!persona) return errorResponse("Persona not found", 404);

        const transcriptIds: string[] = persona.sourceTranscriptIdsJson
            ? JSON.parse(persona.sourceTranscriptIdsJson)
            : [];
        const transcripts = transcriptIds.length > 0
            ? await prisma.mappingTranscript.findMany({
                where: { id: { in: transcriptIds } },
                select: { id: true, displayName: true, fileName: true },
            })
            : [];

        return successResponse({
            ...persona,
            content: coercePersonaContent(safeParse(persona.contentJson), persona.name),
            contributingTranscripts: transcripts,
        });
    } catch (error) {
        console.error("[API] GET /api/personas/[id] error:", error);
        return errorResponse("Failed to load persona", 500);
    }
}

// PATCH /api/personas/[personaId]
//   Partial update. Supports:
//     - name / kicker / avatarUrl
//     - contentPatch: { path: ["bio", "age"], value, provenance? }
//       (any leaf PersonaField — provenance auto-flips to "user_set" unless caller specifies)
//     - verbatimAdd / verbatimUpdate / verbatimRemove
//     - dimensionAdd / dimensionUpdate / dimensionRemove
//   All edits flip relevant provenance tags to "user_set" so the UI can
//   render the "Edited" pill.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { personaId } = await params;
        const body = await request.json();

        const persona = await prisma.syntheticPersona.findUnique({ where: { id: personaId } });
        if (!persona) return errorResponse("Persona not found", 404);

        const updates: { name?: string; kicker?: string | null; avatarUrl?: string | null; contentJson?: string } = {};

        if (typeof body.name === "string") updates.name = body.name.trim() || persona.name;
        if (body.kicker !== undefined) updates.kicker = body.kicker === null ? null : String(body.kicker).trim();
        if (body.avatarUrl !== undefined) updates.avatarUrl = body.avatarUrl;

        // Apply structured edits onto the parsed content blob.
        const current: PersonaContent = coercePersonaContent(safeParse(persona.contentJson), persona.name);
        let contentTouched = false;

        if (Array.isArray(body.contentPatches)) {
            for (const patch of body.contentPatches) {
                if (!patch || !Array.isArray(patch.path)) continue;
                applyFieldPatch(current, patch.path as string[], patch.value, patch.provenance);
                contentTouched = true;
            }
        } else if (body.contentPatch && Array.isArray(body.contentPatch.path)) {
            applyFieldPatch(current, body.contentPatch.path as string[], body.contentPatch.value, body.contentPatch.provenance);
            contentTouched = true;
        }

        // Verbatim quote edits (add/update/remove).
        if (Array.isArray(body.verbatims)) {
            current.verbatims = body.verbatims
                .filter((v: unknown) => v && typeof v === "object")
                .map((v: { text?: string; transcriptId?: string; transcriptName?: string }) => ({
                    text: String(v.text || ""),
                    transcriptId: String(v.transcriptId || ""),
                    transcriptName: v.transcriptName ? String(v.transcriptName) : undefined,
                }))
                .filter((v: { text: string }) => v.text.length > 0);
            contentTouched = true;
        }

        // Dimension edits — full array replace, same idea as verbatims.
        if (Array.isArray(body.dimensions)) {
            current.dailyLifestyle.dimensions = body.dimensions
                .filter((d: unknown) => d && typeof d === "object")
                .map((d: { name?: string; description?: { value?: string; provenance?: string } }) => ({
                    name: String(d.name || "Dimension"),
                    description: {
                        value: d.description?.value ?? null,
                        provenance: (d.description?.provenance as PersonaContent["bio"]["age"]["provenance"]) || "user_set",
                        evidenceQuotes: [],
                    },
                }));
            contentTouched = true;
        }

        // Name change: also propagate to content.summary.name (and persist).
        if (updates.name) {
            current.summary.name = { value: updates.name, provenance: "user_set", evidenceQuotes: [] };
            contentTouched = true;
        }
        if (updates.kicker !== undefined) {
            current.summary.kicker = { value: updates.kicker, provenance: "user_set", evidenceQuotes: [] };
            contentTouched = true;
        }

        if (contentTouched) updates.contentJson = JSON.stringify(current);

        const saved = await prisma.syntheticPersona.update({
            where: { id: personaId },
            data: updates,
        });

        await logAudit({
            action: "UPDATE",
            entityType: "SyntheticPersona",
            entityId: personaId,
            meta: { fields: Object.keys(updates) },
        });

        return successResponse(saved);
    } catch (error) {
        console.error("[API] PATCH /api/personas/[id] error:", error);
        return errorResponse("Failed to update persona", 500);
    }
}

// DELETE /api/personas/[personaId]
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
    try {
        const { personaId } = await params;
        const exists = await prisma.syntheticPersona.findUnique({ where: { id: personaId } });
        if (!exists) return errorResponse("Persona not found", 404);
        await prisma.syntheticPersona.delete({ where: { id: personaId } });
        await logAudit({ action: "DELETE", entityType: "SyntheticPersona", entityId: personaId });
        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/personas/[id] error:", error);
        return errorResponse("Failed to delete persona", 500);
    }
}

// Walks the path and updates the target PersonaField in place.
// `provenance` defaults to "user_set" when not provided by the caller.
function applyFieldPatch(content: PersonaContent, path: string[], value: unknown, provenance?: string): void {
    if (path.length === 0) return;
    let cursor: unknown = content;
    for (let i = 0; i < path.length - 1; i++) {
        if (cursor && typeof cursor === "object") {
            cursor = (cursor as Record<string, unknown>)[path[i]];
        } else {
            return;
        }
    }
    if (!cursor || typeof cursor !== "object") return;
    const parent = cursor as Record<string, unknown>;
    const leafKey = path[path.length - 1];
    const existing = parent[leafKey];
    if (existing && typeof existing === "object" && "provenance" in existing) {
        const existingField = existing as { value: unknown; provenance: string; evidenceQuotes?: unknown };
        parent[leafKey] = {
            value,
            provenance: (provenance as typeof existingField.provenance) || "user_set",
            evidenceQuotes: existingField.evidenceQuotes || [],
        };
    } else {
        parent[leafKey] = { value, provenance: provenance || "user_set", evidenceQuotes: [] };
    }
}

function safeParse(s: string | null | undefined): unknown {
    if (!s) return null;
    try { return JSON.parse(s); } catch { return null; }
}
// Created by Swapnil Bapat © 2026
