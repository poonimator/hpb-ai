import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { errorResponse, successResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ sessionId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const body = await request.json();
        const { updates } = body; // Array of { id, themeName, order }

        if (!updates || !Array.isArray(updates)) {
            return errorResponse("Invalid updates format", 400);
        }

        // Use transaction for batch update
        await prisma.$transaction(
            updates.map((u: any) =>
                prisma.mappingCluster.update({
                    where: { id: u.id },
                    data: {
                        themeName: u.themeName,
                        order: u.order
                    }
                })
            )
        );

        return successResponse({ success: true });
    } catch (error) {
        console.error("[API] Batch Update error:", error);
        return errorResponse("Internal Update Error", 500);
    }
}
// Created by Swapnil Bapat © 2026
