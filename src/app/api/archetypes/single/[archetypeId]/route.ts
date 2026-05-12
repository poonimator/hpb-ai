import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ archetypeId: string }>;
}

// GET /api/archetypes/single/[archetypeId] - Get single archetype with full data
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { archetypeId } = await params;

        const archetype = await prisma.archetype.findUnique({
            where: { id: archetypeId },
            include: {
                archetypeSession: {
                    include: {
                        subProject: {
                            include: {
                                project: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!archetype) {
            return errorResponse("Archetype not found", 404);
        }

        return successResponse(archetype);
    } catch (error) {
        console.error("[API] GET /api/archetypes/single/[id] error:", error);
        return errorResponse("Failed to fetch archetype", 500);
    }
}

// DELETE /api/archetypes/single/[archetypeId] - Delete single archetype
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { archetypeId } = await params;

        const archetype = await prisma.archetype.findUnique({
            where: { id: archetypeId },
        });

        if (!archetype) {
            return errorResponse("Archetype not found", 404);
        }

        // The schema's Simulation.archetype and SimulationArchetype.archetype
        // relations have no onDelete clause, so Postgres treats them as
        // Restrict and blocks the delete if any simulation has ever used
        // this archetype. Clear those FK references first so the delete
        // can succeed. Wrapped in a transaction for atomicity.
        await prisma.$transaction([
            // 1:1 simulations that picked this archetype as their persona —
            // detach so the simulation history is preserved.
            prisma.simulation.updateMany({
                where: { archetypeId },
                data: { archetypeId: null },
            }),
            // Focus-group memberships — remove the join rows entirely; the
            // simulation itself remains via its other archetypes.
            prisma.simulationArchetype.deleteMany({
                where: { archetypeId },
            }),
            prisma.archetype.delete({
                where: { id: archetypeId },
            }),
        ]);

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE /api/archetypes/single/[id] error:", error);
        return errorResponse("Failed to delete archetype", 500);
    }
}
// Created by Swapnil Bapat © 2026
