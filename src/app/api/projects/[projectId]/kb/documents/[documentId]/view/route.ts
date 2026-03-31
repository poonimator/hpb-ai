import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isRemoteUrl } from "@/lib/storage";
import fs from "fs";
import path from "path";

interface RouteParams {
    params: Promise<{ projectId: string; documentId: string }>;
}

/**
 * Resolve a storagePath to an actual file system path.
 * Handles both absolute paths (legacy) and relative paths.
 */
function resolveFilePath(storagePath: string): string {
    if (path.isAbsolute(storagePath)) {
        return storagePath;
    }
    return path.join(process.cwd(), storagePath);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { projectId, documentId } = await params;

        if (!documentId) {
            return new NextResponse("Document ID is required", { status: 400 });
        }

        const doc = await prisma.projectKbDocument.findFirst({
            where: {
                id: documentId,
                projectId: projectId
            },
        });

        if (!doc || !doc.storagePath) {
            return new NextResponse("Document not found", { status: 404 });
        }

        // Remote blob URL — redirect
        if (isRemoteUrl(doc.storagePath)) {
            return NextResponse.redirect(doc.storagePath);
        }

        // Local file — try to read and serve
        const resolvedPath = resolveFilePath(doc.storagePath);
        if (fs.existsSync(resolvedPath)) {
            const fileBuffer = fs.readFileSync(resolvedPath);
            return new NextResponse(fileBuffer, {
                headers: {
                    "Content-Type": doc.mimeType || "application/octet-stream",
                    "Content-Disposition": `inline; filename="${doc.originalFileName || path.basename(resolvedPath)}"`,
                },
            });
        }

        // File not on disk — fall back to extracted text stored in DB
        if (doc.extractedText) {
            return new NextResponse(doc.extractedText, {
                headers: {
                    "Content-Type": "text/plain; charset=utf-8",
                    "Content-Disposition": `inline; filename="${doc.originalFileName?.replace(/\.[^/.]+$/, '') || 'document'}.txt"`,
                },
            });
        }

        return new NextResponse("File not found on disk and no extracted text available", { status: 404 });

    } catch (error) {
        console.error("[API] GET /api/projects/[projectId]/kb/documents/[documentId]/view error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
// Created by Swapnil Bapat © 2026
