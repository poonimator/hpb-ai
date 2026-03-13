import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import {
    EndSimulationSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// POST /api/simulations/end - End a simulation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = EndSimulationSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const { simulationId } = validation.data;

        // Verify simulation exists
        const simulation = await prisma.simulation.findUnique({
            where: { id: simulationId },
            include: {
                _count: { select: { messages: true } },
            },
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        if (simulation.endedAt) {
            return errorResponse("Simulation has already ended", 400);
        }

        // End the simulation
        const endedSimulation = await prisma.simulation.update({
            where: { id: simulationId },
            data: {
                endedAt: new Date(),
            },
            include: {
                project: { select: { id: true, name: true } },
                persona: { select: { id: true, name: true } },
                _count: { select: { messages: true } },
            },
        });

        await logAudit({
            action: "END",
            entityType: "Simulation",
            entityId: simulationId,
            meta: {
                messageCount: simulation._count.messages,
                duration: endedSimulation.endedAt
                    ? endedSimulation.endedAt.getTime() - simulation.startedAt.getTime()
                    : null,
            },
        });

        return successResponse(endedSimulation);
    } catch (error) {
        console.error("[API] POST /api/simulations/end error:", error);
        return errorResponse("Failed to end simulation", 500);
    }
}
// Created by Swapnil Bapat © 2026
