import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import { processMapping } from "@/lib/ai/openai";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const body = await request.json();
        const { themes } = body;

        if (!themes || !Array.isArray(themes) || themes.length === 0) {
            return errorResponse("Themes list is required", 400);
        }

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

        // Prepare transcripts
        const validTranscripts = session.transcripts
            .filter(t => t.extractedText)
            .map(t => ({
                id: t.id,
                name: t.fileName,
                content: t.extractedText || ""
            }));

        if (validTranscripts.length === 0) {
            return errorResponse("No readable transcripts found.", 400);
        }

        // Update session status to PROCESSING (though we finish in this request, might be slow)
        await prisma.mappingSession.update({
            where: { id: sessionId },
            data: {
                status: "PROCESSING",
                themesJson: JSON.stringify(themes.map(t => ({ name: t })))
            }
        });

        // Call AI for Clustering
        const result = await processMapping({
            transcripts: validTranscripts,
            themes
        });

        if (!result.success) {
            // Revert status
            await prisma.mappingSession.update({
                where: { id: sessionId },
                data: { status: "ERROR" }
            });
            return errorResponse(result.error || "Failed to process mapping", 500);
        }

        // Save Clusters to DB
        // Use transaction to ensure consistency
        await prisma.$transaction(async (tx) => {
            // Delete existing clusters if any (retry logic support)
            await tx.mappingCluster.deleteMany({
                where: { mappingSessionId: sessionId }
            });

            // Create new clusters
            if (result.clusters.length > 0) {
                await tx.mappingCluster.createMany({
                    data: result.clusters.map(c => ({
                        mappingSessionId: sessionId,
                        transcriptId: c.transcriptId,
                        themeName: c.theme,
                        quote: c.quote,
                        context: c.context
                    }))
                });
            }

            // Update Session to COMPLETE
            await tx.mappingSession.update({
                where: { id: sessionId },
                data: {
                    status: "COMPLETE",
                    clusteringResultJson: JSON.stringify(result.clusters)
                }
            });
        });

        // Audit Log
        await logAudit({
            action: "GENERATE_CLUSTERS",
            entityType: "MappingSession",
            entityId: sessionId,
            meta: { clusterCount: result.clusters.length },
        });

        return successResponse({ success: true, count: result.clusters.length });
    } catch (error) {
        console.error("[API] POST /api/mapping/[sessionId]/process error:", error);
        // Try to set status to ERROR
        try {
            await prisma.mappingSession.update({
                where: { id: (await params).sessionId },
                data: { status: "ERROR" }
            });
        } catch { }

        return errorResponse("Internal server error", 500);
    }
}
// Created by Swapnil Bapat © 2026
