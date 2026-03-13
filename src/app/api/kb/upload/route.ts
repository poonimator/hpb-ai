import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";
import { uploadFile } from "@/lib/storage";
import { randomUUID } from "crypto";

// Helper to chunk text
function chunkText(text: string, chunkSize = 1000, overlap = 100): string[] {
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        chunks.push(text.slice(i, i + chunkSize));
        i += chunkSize - overlap;
    }
    return chunks;
}

// Helper to parse persona with OpenAI (in background)
async function parsePersonaInBackground(documentId: string, baseUrl: string) {
    try {
        await fetch(`${baseUrl}/api/gemini/parse-persona`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                documentId,
                isProjectKb: false
            }),
        });
    } catch (err) {
        console.error("[KB Upload] Failed to trigger persona parsing:", err);
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string | null;
        const docType = formData.get("docType") as string | null;

        // Get origin for background task
        const origin = request.nextUrl.origin;

        if (!file || !title || !docType) {
            return errorResponse("Missing required fields: file, title, docType", 400);
        }

        // Validate file type
        const validTypes = ["text/plain", "application/pdf"];
        if (!validTypes.includes(file.type)) {
            return errorResponse("Invalid file type. Only TXT and PDF are allowed.", 400);
        }

        // Validate doc type
        const validDocTypes = ["PERSONA", "FRAMEWORK", "RESEARCH", "POLICY", "OTHER"];
        if (!validDocTypes.includes(docType)) {
            return errorResponse("Invalid document classification.", 400);
        }

        // Upload to Vercel Blob
        const buffer = Buffer.from(await file.arrayBuffer());
        const docId = randomUUID();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const blobUrl = await uploadFile(buffer, `kb/${docId}/${safeName}`, file.type);

        // Extract text (if TXT)
        let extractedText: string | null = null;
        if (file.type === "text/plain") {
            extractedText = buffer.toString("utf-8");
        }
        // PDF extraction is TODO - left as null

        // Create DB Record
        const kbDoc = await prisma.kbDocument.create({
            data: {
                id: docId, // Use the pre-generated ID
                title,
                docType,
                mimeType: file.type,
                originalFileName: file.name,
                storagePath: blobUrl,
                extractedText: extractedText,
                status: "DRAFT", // Must be approved by admin
            },
        });

        // If text was extracted, create chunks
        if (extractedText) {
            const chunks = chunkText(extractedText);
            if (chunks.length > 0) {
                await prisma.kbChunk.createMany({
                    data: chunks.map((content, index) => ({
                        documentId: kbDoc.id,
                        chunkIndex: index,
                        content: content,
                    })),
                });
            }
        }

        // Log Audit
        await logAudit({
            action: "KB_UPLOAD",
            entityType: "KBDocument",
            entityId: kbDoc.id,
            meta: { fileName: file.name, docType, size: file.size },
        });

        // If this is a PERSONA document, parse it with OpenAI in the background
        if (docType === "PERSONA" && extractedText) {
            // Fire and forget - don't await
            parsePersonaInBackground(kbDoc.id, origin);
        }

        return successResponse({
            id: kbDoc.id,
            status: "DRAFT",
            message: "File uploaded successfully. Pending approval."
        }, 201);

    } catch (error) {
        console.error("[API] POST /api/kb/upload error:", error);
        return errorResponse("Failed to upload file", 500);
    }
}

// Created by Swapnil Bapat © 2026
