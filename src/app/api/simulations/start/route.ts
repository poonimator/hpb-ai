import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import {
    StartSimulationSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// POST /api/simulations/start - Start a new simulation
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = StartSimulationSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const { projectId, personaId, personaDocId, mode, mixerSettings } = validation.data;

        if (!personaId && !personaDocId) {
            return errorResponse("Must provide either personaId or personaDocId", 400);
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            return errorResponse("Project not found", 404);
        }

        // Verify persona exists (Legacy or KB)
        let personaExists = false;
        if (personaDocId) {
            const kbDoc = await prisma.kbDocument.findUnique({
                where: { id: personaDocId }
            });
            // Ideally check if status is APPROVED?
            if (kbDoc) personaExists = true;
        } else if (personaId) {
            const legacyPersona = await prisma.persona.findUnique({
                where: { id: personaId }
            });
            if (legacyPersona) personaExists = true;
        }

        if (!personaExists) {
            return errorResponse("Persona not found", 404);
        }

        const simulation = await prisma.simulation.create({
            data: {
                projectId,
                personaId,      // Optional
                personaDocId,   // Optional
                mode,
                mixerJson: mixerSettings ? JSON.stringify(mixerSettings) : null,
            },
            include: {
                project: { select: { id: true, name: true } },
                persona: true,
                personaDoc: true,
            },
        });

        // Initialize question coverage for this simulation
        const latestVersion = await prisma.guideVersion.findFirst({
            where: { projectId },
            orderBy: { versionNumber: 'desc' },
            include: {
                guideSets: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (latestVersion) {
            const questions = latestVersion.guideSets.flatMap(set => set.questions);
            if (questions.length > 0) {
                await prisma.simulationQuestionCoverage.createMany({
                    data: questions.map(q => ({
                        simulationId: simulation.id,
                        questionId: q.id,
                        status: 'NOT_STARTED'
                    }))
                });
            }
        }

        await logAudit({
            action: "START",
            entityType: "Simulation",
            entityId: simulation.id,
            meta: { projectId, personaId, personaDocId, mode },
        });

        return successResponse(simulation, 201);
    } catch (error) {
        console.error("[API] POST /api/simulations/start error:", error);
        return errorResponse(`Failed to start simulation: ${error instanceof Error ? error.message : String(error)}`, 500);
    }
}
// Created by Swapnil Bapat © 2026
