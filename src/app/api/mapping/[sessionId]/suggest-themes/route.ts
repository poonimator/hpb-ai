import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import { suggestThemes } from "@/lib/ai/openai";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;

        // Verify session and get transcripts
        const session = await prisma.mappingSession.findUnique({
            where: { id: sessionId },
            include: {
                transcripts: true
            }
        });

        if (!session) {
            return errorResponse("Session not found", 404);
        }

        if (session.transcripts.length === 0) {
            return errorResponse("No transcripts found. Upload files first.", 400);
        }

        // Filter valid transcripts (extractedText must be present)
        const validTranscripts = session.transcripts
            .filter(t => t.extractedText)
            .map(t => ({
                name: t.fileName,
                content: t.extractedText || ""
            }));

        if (validTranscripts.length === 0) {
            return errorResponse("No text content found in uploaded files. Please upload TXT or MD files.", 400);
        }

        // Call AI
        const result = await suggestThemes({
            transcripts: validTranscripts
        });

        if (!result.success) {
            return errorResponse(result.error || "Failed to generate themes", 500);
        }

        // Audit Log
        await logAudit({
            action: "GENERATE_THEMES",
            entityType: "MappingSession",
            entityId: sessionId,
            meta: { themeCount: result.themes.length },
        });

        return successResponse(result.themes);
    } catch (error) {
        console.error("[API] POST /api/mapping/[sessionId]/suggest-themes error:", error);
        return errorResponse("Internal server error", 500);
    }
}
// Created by Swapnil Bapat © 2026
