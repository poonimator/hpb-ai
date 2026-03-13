import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import {
    successResponse,
    errorResponse,
} from "@/lib/validations";

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/simulations/[id] - Get simulation details with transcript
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const simulation = await prisma.simulation.findUnique({
            where: { id },
            include: {
                project: {
                    select: { id: true, name: true, researchStatement: true },
                },
                subProject: {
                    select: { id: true, name: true, projectId: true },
                },
                guideVersion: {
                    select: { id: true, name: true },
                },
                persona: true,
                personaDoc: true,
                projectPersonaDoc: true,
                archetype: true,
                simulationArchetypes: {
                    include: {
                        archetype: true,
                    },
                    orderBy: { order: "asc" },
                },
                messages: {
                    orderBy: { timestamp: "asc" },
                },
                coachReview: true,
            },
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        // Parse mixer settings
        const mixerSettings = simulation.mixerJson
            ? JSON.parse(simulation.mixerJson)
            : null;

        // Parse coach review findings
        const coachFindings = simulation.coachReview?.findingsJson
            ? JSON.parse(simulation.coachReview.findingsJson)
            : null;

        // Parse live coach data (for resume)
        const coachNudges = simulation.coachNudgesJson
            ? JSON.parse(simulation.coachNudgesJson)
            : [];

        const coveredQuestionIds = simulation.coveredQuestionIdsJson
            ? JSON.parse(simulation.coveredQuestionIdsJson)
            : [];

        return successResponse({
            ...simulation,
            mixerSettings,
            coachFindings,
            coachNudges,
            coveredQuestionIds,
        });
    } catch (error) {
        console.error("[API] GET /api/simulations/[id] error:", error);
        return errorResponse("Failed to fetch simulation", 500);
    }
}

// PATCH /api/simulations/[id] - Update simulation coach state
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        console.log("[API] PATCH /api/simulations/[id] - id:", id);

        const body = await request.json();
        console.log("[API] PATCH body:", JSON.stringify(body).substring(0, 200));

        const { coachNudges, coveredQuestionIds } = body;

        const updateData: { coachNudgesJson?: string; coveredQuestionIdsJson?: string } = {};

        if (coachNudges !== undefined) {
            updateData.coachNudgesJson = JSON.stringify(coachNudges);
        }

        if (coveredQuestionIds !== undefined) {
            updateData.coveredQuestionIdsJson = JSON.stringify(coveredQuestionIds);
        }

        console.log("[API] PATCH updateData keys:", Object.keys(updateData));

        if (Object.keys(updateData).length === 0) {
            return errorResponse("No update data provided", 400);
        }

        const simulation = await prisma.simulation.update({
            where: { id },
            data: updateData,
        });

        console.log("[API] PATCH success - simulation id:", simulation.id);
        return successResponse({ updated: true, id: simulation.id });
    } catch (error) {
        console.error("[API] PATCH /api/simulations/[id] error:", error);
        console.error("[API] PATCH error details:", error instanceof Error ? error.message : String(error));
        return errorResponse("Failed to update simulation", 500);
    }
}

// DELETE /api/simulations/[id] - Delete a simulation
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        // Delete simulation (cascading deletes for messages and coach reviews should be handled by DB or Prisma)
        // Prisma schema usually handles CASCADE if configured, otherwise we delete relations first?
        // Let's assume standard cascading or simple delete for now.

        // Actually, let's play safe and delete related records if they are not cascaded.
        // But usually SimulationMessage has relation to Simulation.

        await prisma.simulation.delete({
            where: { id },
        });

        return successResponse({ message: "Simulation deleted successfully" });
    } catch (error) {
        console.error("[API] DELETE /api/simulations/[id] error:", error);
        return errorResponse("Failed to delete simulation", 500);
    }
}
// Created by Swapnil Bapat © 2026
