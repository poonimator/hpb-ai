import { NextRequest } from "next/server";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";
import { regenerateSinglePersona } from "@/lib/personas/pipeline";

interface RouteParams {
    params: Promise<{ personaId: string }>;
}

// Single-persona regenerate runs Phase B (synthesis) for one archetype.
// Cheaper than the full pipeline. Up to ~60s for the model call.
export const maxDuration = 120;

// POST /api/personas/[personaId]/regenerate
export async function POST(_req: NextRequest, { params }: RouteParams) {
    try {
        const { personaId } = await params;
        await regenerateSinglePersona(personaId);
        await logAudit({
            action: "REGENERATE",
            entityType: "SyntheticPersona",
            entityId: personaId,
        });
        return successResponse({ regenerated: true });
    } catch (error) {
        console.error("[API] POST /api/personas/[id]/regenerate error:", error);
        return errorResponse(
            error instanceof Error ? error.message : "Regenerate failed",
            500
        );
    }
}
// Created by Swapnil Bapat © 2026
