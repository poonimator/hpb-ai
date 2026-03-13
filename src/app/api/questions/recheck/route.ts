import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { analyzeQuestionQuality } from "@/lib/ai/openai";
import {
    RecheckQuestionsSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// POST /api/questions/recheck - Recheck specific questions by ID
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = RecheckQuestionsSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const { questionIds } = validation.data;

        // Fetch questions from database
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
        });

        if (questions.length === 0) {
            return errorResponse("No questions found with the provided IDs", 404);
        }

        // Analyze each question
        const results = await Promise.all(
            questions.map(async (q) => {
                const analysis = await analyzeQuestionQuality({
                    questionText: q.text,
                    intent: q.intent ?? undefined,
                });

                // Update the question's flags
                await prisma.question.update({
                    where: { id: q.id },
                    data: {
                        flagsJson: JSON.stringify(analysis.warnings),
                    },
                });

                await logAudit({
                    action: "UPDATE",
                    entityType: "Question",
                    entityId: q.id,
                    meta: {
                        operation: "recheck",
                        warningCount: analysis.warnings.length,
                    },
                });

                return {
                    questionId: q.id,
                    text: q.text,
                    ...analysis,
                };
            })
        );

        return successResponse({
            results,
            recheckedCount: results.length,
        });
    } catch (error) {
        console.error("[API] POST /api/questions/recheck error:", error);
        return errorResponse("Failed to recheck questions", 500);
    }
}
// Created by Swapnil Bapat © 2026
