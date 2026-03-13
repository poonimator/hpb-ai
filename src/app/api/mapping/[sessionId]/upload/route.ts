import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import { uploadFile } from "@/lib/storage";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { sessionId } = await params;
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return errorResponse("No file uploaded", 400);
        }

        const session = await prisma.mappingSession.findUnique({
            where: { id: sessionId },
        });

        if (!session) {
            return errorResponse("Session not found", 404);
        }

        // Upload to Vercel Blob
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const buffer = Buffer.from(await file.arrayBuffer());
        const blobUrl = await uploadFile(buffer, `mapping/${sessionId}/${safeName}`, file.type);

        // Basic Text Extraction
        let extractedText: string | null = null;

        // Text-based files
        if (
            file.type === "text/plain" ||
            file.type === "text/markdown" ||
            file.name.endsWith(".md") ||
            file.name.endsWith(".txt")
        ) {
            extractedText = buffer.toString("utf-8");
        }

        // TODO: Add support for PDF/DOCX extraction using external libraries
        // For now, if we can't extract, we save null. 
        // NOTE: AI will only see content if extractedText is present.

        // Create Transcript Record
        const transcript = await prisma.mappingTranscript.create({
            data: {
                mappingSessionId: sessionId,
                fileName: file.name,
                displayName: file.name.split('.')[0], // Use filename as person identifier
                mimeType: file.type,
                storagePath: blobUrl,
                extractedText: extractedText,
                fileSize: file.size,
            },
        });

        await logAudit({
            action: "UPLOAD_TRANSCRIPT",
            entityType: "MappingTranscript",
            entityId: transcript.id,
            meta: { sessionId, fileName: file.name, size: file.size },
        });

        return successResponse(transcript, 201);
    } catch (error) {
        console.error("[API] POST /api/mapping/[sessionId]/upload error:", error);
        return errorResponse("Failed to upload transcript", 500);
    }
}
// Created by Swapnil Bapat © 2026
