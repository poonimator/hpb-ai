import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;

        const session = await prisma.mappingSession.findUnique({
            where: { id: sessionId },
            include: {
                transcripts: true,
                clusters: {
                    include: {
                        transcript: true // Include transcript info for traceability
                    }
                }
            }
        });

        if (!session) {
            return errorResponse("Session not found", 404);
        }

        return successResponse(session);
    } catch (error) {
        console.error("[API] GET /api/mapping/[sessionId] error:", error);
        return errorResponse("Failed to fetch session", 500);
    }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;

        const session = await prisma.mappingSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return errorResponse("Session not found", 404);
        }

        // Delete session (Prisma cascade handles transcripts/clusters)
        await prisma.mappingSession.delete({
            where: { id: sessionId },
        });

        // Audit Log
        await logAudit({
            action: "DELETE",
            entityType: "MappingSession",
            entityId: sessionId,
            meta: { name: session.name },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/mapping/[sessionId] error:", error);
        return errorResponse("Failed to delete session", 500);
    }
}
// Created by Swapnil Bapat © 2026
