import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";

import {
    SendMessageSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// POST /api/simulations/message - Send a message in a simulation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = SendMessageSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const { simulationId, content, role } = validation.data;
        const imageBase64 = body.imageBase64 || null;

        // Verify simulation exists and is not ended
        const simulation = await prisma.simulation.findUnique({
            where: { id: simulationId },
            include: {
                persona: true,
                messages: {
                    orderBy: { timestamp: "asc" },
                    select: { role: true, content: true },
                },
            },
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        if (simulation.endedAt) {
            return errorResponse("Simulation has already ended", 400);
        }

        // Create user message
        const userMessage = await prisma.simulationMessage.create({
            data: {
                simulationId,
                role,
                content,
                imageBase64,
            },
        });

        await logAudit({
            action: "CREATE",
            entityType: "SimulationMessage",
            entityId: userMessage.id,
            meta: { simulationId, role, contentLength: content.length },
        });

        // Note: We do NOT generate persona response here anymore. 
        // The client calls /api/gemini/simulate independently.

        return successResponse({
            userMessage,
        });


    } catch (error) {
        console.error("[API] POST /api/simulations/message error:", error);
        return errorResponse("Failed to send message", 500);
    }
}
// Created by Swapnil Bapat © 2026
