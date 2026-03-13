import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

// GET /api/personas - List all personas with optional filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ageRange = searchParams.get("ageRange");
        const lifeStage = searchParams.get("lifeStage");

        const where: Record<string, unknown> = {};
        if (ageRange) where.ageRange = ageRange;
        if (lifeStage) where.lifeStage = lifeStage;

        const personas = await prisma.persona.findMany({
            where,
            orderBy: { name: "asc" },
        });

        return successResponse(personas);
    } catch (error) {
        console.error("[API] GET /api/personas error:", error);
        return errorResponse("Failed to fetch personas", 500);
    }
}
// Created by Swapnil Bapat © 2026
