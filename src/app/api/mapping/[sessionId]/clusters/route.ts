import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { errorResponse, successResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const body = await request.json();
        const { quote, themeName, transcriptId, order } = body;

        if (!quote || !themeName || !transcriptId) {
            return errorResponse("Missing required fields", 400);
        }

        // Create new cluster
        const cluster = await prisma.mappingCluster.create({
            data: {
                mappingSessionId: sessionId,
                transcriptId,
                themeName,
                quote, // Should be stringified JSON array if multiple, or simple string?
                // User manual entry: usually simple string. 
                // I'll ensure frontend wraps it in JSON array string for consistency if needed.
                order: order || 0,
                isManual: true,
                context: "Added manually by user"
            }
        });

        return successResponse({ success: true, cluster });
    } catch (error) {
        console.error("[API] POST cluster error:", error);
        return errorResponse("Internal Create Error", 500);
    }
}
// Created by Swapnil Bapat © 2026
