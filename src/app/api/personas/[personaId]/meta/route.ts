import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ personaId: string }> }
) {
    try {
        const { personaId } = await params;
        const body = await request.json();
        const { meta, isProjectKb } = body;

        if (!meta) {
            return errorResponse("Missing metadata", 400);
        }

        let updatedDoc;

        if (isProjectKb) {
            updatedDoc = await prisma.projectKbDocument.update({
                where: { id: personaId },
                data: { parsedMetaJson: JSON.stringify(meta) }
            });
        } else {
            // Fallback for generic KB documents
            updatedDoc = await prisma.kbDocument.update({
                where: { id: personaId },
                data: { parsedMetaJson: JSON.stringify(meta) }
            });
        }

        return successResponse({ document: updatedDoc });

    } catch (error) {
        console.error("[Update Persona Meta] Error:", error);
        return errorResponse("Failed to update persona metadata", 500);
    }
}
// Created by Swapnil Bapat © 2026
