import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { isRemoteUrl } from "@/lib/storage";
import fs from "fs";
import path from "path";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!id) {
            return new NextResponse("Document ID is required", { status: 400 });
        }

        const doc = await prisma.kbDocument.findUnique({
            where: { id },
        });

        if (!doc || !doc.storagePath) {
            return new NextResponse("Document not found", { status: 404 });
        }

        // Remote blob URL — redirect
        if (isRemoteUrl(doc.storagePath)) {
            return NextResponse.redirect(doc.storagePath);
        }

        // Local file — read and serve
        if (!fs.existsSync(doc.storagePath)) {
            return new NextResponse("File not found on disk", { status: 404 });
        }

        const fileBuffer = fs.readFileSync(doc.storagePath);
        return new NextResponse(fileBuffer, {
            headers: {
                "Content-Type": doc.mimeType || "application/octet-stream",
                "Content-Disposition": `inline; filename="${doc.originalFileName || path.basename(doc.storagePath)}"`,
            },
        });

    } catch (error) {
        console.error("[API] GET /api/kb/documents/[id]/view error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
// Created by Swapnil Bapat © 2026
