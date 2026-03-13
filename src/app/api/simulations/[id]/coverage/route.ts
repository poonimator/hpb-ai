import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

// GET /api/simulations/[id]/coverage - Get coverage data for a simulation
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: simulationId } = await params;

        const coverage = await prisma.simulationQuestionCoverage.findMany({
            where: { simulationId },
            include: {
                question: {
                    include: {
                        guideSet: true
                    }
                }
            },
            orderBy: [
                { question: { guideSet: { createdAt: 'asc' } } },
                { question: { order: 'asc' } }
            ]
        });

        // Summary stats
        const summary = {
            total: coverage.length,
            notStarted: coverage.filter(c => c.status === 'NOT_STARTED').length,
            inProgress: coverage.filter(c => c.status === 'IN_PROGRESS').length,
            covered: coverage.filter(c => c.status === 'COVERED').length,
            skipped: coverage.filter(c => c.status === 'SKIPPED').length,
            outOfOrder: coverage.filter(c => c.isOutOfOrder).length
        };

        return successResponse({ coverage, summary });
    } catch (error) {
        console.error("[API] GET /api/simulations/[id]/coverage error:", error);
        return errorResponse("Failed to fetch coverage", 500);
    }
}

// POST /api/simulations/[id]/coverage - Initialize coverage for a simulation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: simulationId } = await params;

        // Get simulation with project
        const simulation = await prisma.simulation.findUnique({
            where: { id: simulationId },
            include: { project: true }
        });

        if (!simulation) {
            return errorResponse("Simulation not found", 404);
        }

        // Check if coverage already exists
        const existingCount = await prisma.simulationQuestionCoverage.count({
            where: { simulationId }
        });

        if (existingCount > 0) {
            return successResponse({ message: "Coverage already initialized", count: existingCount });
        }

        // Get latest guide version questions
        if (!simulation.projectId) {
            return successResponse({ message: "Simulation has no project", count: 0 });
        }

        const latestVersion = await prisma.guideVersion.findFirst({
            where: { projectId: simulation.projectId },
            orderBy: { versionNumber: 'desc' },
            include: {
                guideSets: {
                    include: {
                        questions: true
                    }
                }
            }
        });

        if (!latestVersion) {
            return successResponse({ message: "No guide found for project", count: 0 });
        }

        // Create coverage rows for all questions
        const questions = latestVersion.guideSets.flatMap(set => set.questions);

        if (questions.length === 0) {
            return successResponse({ message: "No questions in guide", count: 0 });
        }

        await prisma.simulationQuestionCoverage.createMany({
            data: questions.map(q => ({
                simulationId,
                questionId: q.id,
                status: 'NOT_STARTED'
            }))
        });

        return successResponse({ message: "Coverage initialized", count: questions.length });
    } catch (error) {
        console.error("[API] POST /api/simulations/[id]/coverage error:", error);
        return errorResponse("Failed to initialize coverage", 500);
    }
}

// PATCH /api/simulations/[id]/coverage - Update coverage (question matched or manual)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: simulationId } = await params;
        const body = await request.json();
        const { questionId, messageId, isManual } = body;

        if (!questionId) {
            return errorResponse("questionId is required", 400);
        }

        // Find the coverage record
        const coverage = await prisma.simulationQuestionCoverage.findFirst({
            where: { simulationId, questionId }
        });

        if (!coverage) {
            return errorResponse("Coverage record not found", 404);
        }

        // Get current in-progress count to determine order
        const inProgressCount = await prisma.simulationQuestionCoverage.count({
            where: {
                simulationId,
                orderFirstMatched: { not: null }
            }
        });

        // Mark previous IN_PROGRESS as COVERED
        await prisma.simulationQuestionCoverage.updateMany({
            where: { simulationId, status: 'IN_PROGRESS' },
            data: { status: 'COVERED' }
        });

        // Update this question's coverage
        const now = new Date();
        const updateData: {
            status: string;
            lastMatchedAt: Date;
            matchedCount: number;
            firstMatchedAt?: Date;
            orderFirstMatched?: number;
            lastUserMessageId?: string;
        } = {
            status: 'IN_PROGRESS',
            lastMatchedAt: now,
            matchedCount: coverage.matchedCount + 1
        };

        if (!coverage.firstMatchedAt) {
            updateData.firstMatchedAt = now;
            updateData.orderFirstMatched = inProgressCount + 1;
        }

        if (messageId) {
            updateData.lastUserMessageId = messageId;
        }

        const updated = await prisma.simulationQuestionCoverage.update({
            where: { id: coverage.id },
            data: updateData,
            include: {
                question: {
                    include: { guideSet: true }
                }
            }
        });

        // Log audit
        await logAudit({
            action: isManual ? "QUESTION_MAPPED_MANUAL" : "QUESTION_MAPPED_AUTO",
            entityType: "SimulationQuestionCoverage",
            entityId: coverage.id,
            meta: { simulationId, questionId, messageId }
        });

        return successResponse(updated);
    } catch (error) {
        console.error("[API] PATCH /api/simulations/[id]/coverage error:", error);
        return errorResponse("Failed to update coverage", 500);
    }
}

// PUT /api/simulations/[id]/coverage - Finalize coverage (end of interview)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: simulationId } = await params;

        // Mark IN_PROGRESS as COVERED
        await prisma.simulationQuestionCoverage.updateMany({
            where: { simulationId, status: 'IN_PROGRESS' },
            data: { status: 'COVERED' }
        });

        // Mark NOT_STARTED as SKIPPED
        await prisma.simulationQuestionCoverage.updateMany({
            where: { simulationId, status: 'NOT_STARTED' },
            data: { status: 'SKIPPED' }
        });

        // Get all coverage with question order info
        const allCoverage = await prisma.simulationQuestionCoverage.findMany({
            where: { simulationId },
            include: {
                question: true
            }
        });

        // Compute out-of-order
        // Sort by expected order (question.order)
        const sortedByExpected = [...allCoverage]
            .filter(c => c.orderFirstMatched !== null)
            .sort((a, b) => a.question.order - b.question.order);

        // Check if actual order matches expected order
        let lastActualOrder = 0;
        const outOfOrderIds: string[] = [];

        for (const cov of sortedByExpected) {
            if (cov.orderFirstMatched !== null) {
                if (cov.orderFirstMatched < lastActualOrder) {
                    // This question was asked before a question with lower expected order
                    outOfOrderIds.push(cov.id);
                }
                lastActualOrder = Math.max(lastActualOrder, cov.orderFirstMatched);
            }
        }

        // Mark out-of-order
        if (outOfOrderIds.length > 0) {
            await prisma.simulationQuestionCoverage.updateMany({
                where: { id: { in: outOfOrderIds } },
                data: { isOutOfOrder: true }
            });
        }

        // Log audit
        await logAudit({
            action: "COVERAGE_FINALIZED",
            entityType: "Simulation",
            entityId: simulationId,
            meta: {
                covered: allCoverage.filter(c => c.status === 'COVERED').length,
                skipped: allCoverage.filter(c => c.status === 'SKIPPED').length,
                outOfOrder: outOfOrderIds.length
            }
        });

        return successResponse({
            message: "Coverage finalized",
            outOfOrderCount: outOfOrderIds.length
        });
    } catch (error) {
        console.error("[API] PUT /api/simulations/[id]/coverage error:", error);
        return errorResponse("Failed to finalize coverage", 500);
    }
}
// Created by Swapnil Bapat © 2026
