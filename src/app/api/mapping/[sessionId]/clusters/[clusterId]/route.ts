import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { errorResponse, successResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ sessionId: string; clusterId: string }>;
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { clusterId } = await params;

        await prisma.mappingCluster.delete({
            where: { id: clusterId }
        });

        return successResponse({ success: true });
    } catch (error) {
        console.error("[API] DELETE cluster error:", error);
        return errorResponse("Internal Delete Error", 500);
    }
}
// Created by Swapnil Bapat © 2026
