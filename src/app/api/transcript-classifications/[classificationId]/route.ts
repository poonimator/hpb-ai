import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ classificationId: string }>;
}

// PATCH /api/transcript-classifications/[classificationId]
//   body: { archetypeId: string | null }
//   Used by the Unclassified-sidebar dropdown to move a transcript between
//   archetypes (or back to Unclassified). Marks userOverridden = true so
//   re-running Phase A won't blow this away in a future round.
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { classificationId } = await params;
        const body = await request.json();
        const { archetypeId } = body as { archetypeId?: string | null };

        const classification = await prisma.transcriptClassification.findUnique({
            where: { id: classificationId },
            include: { personaSession: true },
        });
        if (!classification) return errorResponse("Classification not found", 404);

        // Verify archetype belongs to the same archetype session as this persona session.
        if (archetypeId) {
            const archetype = await prisma.archetype.findUnique({ where: { id: archetypeId } });
            if (!archetype || archetype.archetypeSessionId !== classification.personaSession.archetypeSessionId) {
                return errorResponse("Archetype does not belong to this session", 400);
            }
        }

        const updated = await prisma.transcriptClassification.update({
            where: { id: classificationId },
            data: {
                archetypeId: archetypeId || null,
                userOverridden: true,
                // When the user moves a transcript manually, we lower confidence to 1
                // (i.e. user-decided) and clear the AI rationale so it doesn't appear
                // misleading on the card. UI prefers the userOverridden flag anyway.
                confidence: 1,
                rationale: "Manually assigned by user",
            },
        });

        await logAudit({
            action: "UPDATE",
            entityType: "TranscriptClassification",
            entityId: classificationId,
            meta: { archetypeId: archetypeId || null },
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[API] PATCH /api/transcript-classifications/[id] error:", error);
        return errorResponse("Failed to update classification", 500);
    }
}
// Created by Swapnil Bapat © 2026
