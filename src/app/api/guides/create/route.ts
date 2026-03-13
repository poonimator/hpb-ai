import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

// POST /api/guides/create - Create a new blank guide for a sub-project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subProjectId, name } = body;

        if (!subProjectId) {
            return errorResponse("subProjectId is required", 400);
        }

        // Verify sub-project exists
        const subProject = await prisma.subProject.findUnique({
            where: { id: subProjectId }
        });

        if (!subProject) {
            return errorResponse("Sub-project not found", 404);
        }

        // Get the next version number for this sub-project
        const latestGuide = await prisma.guideVersion.findFirst({
            where: { subProjectId },
            orderBy: { versionNumber: "desc" }
        });

        const nextVersionNumber = (latestGuide?.versionNumber || 0) + 1;
        const guideName = name?.trim() || `Moderator Guide ${nextVersionNumber}`;

        // Create new guide
        const newGuide = await prisma.guideVersion.create({
            data: {
                subProjectId,
                name: guideName,
                versionNumber: nextVersionNumber
            }
        });

        return successResponse({ guide: newGuide });

    } catch (error) {
        console.error("[Create Guide] Error:", error);
        return errorResponse("Failed to create guide", 500);
    }
}
// Created by Swapnil Bapat © 2026
