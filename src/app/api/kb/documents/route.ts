import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const docType = searchParams.get("docType"); // Optional filter

        const whereClause: any = {};
        if (docType) {
            whereClause.docType = docType;
        }

        // Include parsedMetaJson for PERSONA docs (contains AI-parsed name, age, etc.)
        const includePersonaMeta = docType === "PERSONA";

        const docs = await prisma.kbDocument.findMany({
            where: whereClause,
            select: {
                id: true,
                title: true,
                docType: true,
                status: true,
                mimeType: true,
                createdAt: true,
                parsedMetaJson: includePersonaMeta, // Include AI-parsed metadata for personas
                _count: {
                    select: { chunks: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return successResponse(docs);
    } catch (error) {
        console.error("[API] GET /api/kb/documents error:", error);
        return errorResponse("Failed to fetch documents", 500);
    }
}

// Created by Swapnil Bapat © 2026
