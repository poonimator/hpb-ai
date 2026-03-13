import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { analyzeQuestionQuality } from "@/lib/ai/openai";
import {
    CheckQuestionsSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// POST /api/questions/check - Check quality of questions
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = CheckQuestionsSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const { questions, projectId } = validation.data;

        // Analyze each question
        const results = await Promise.all(
            questions.map(async (q) => {
                const analysis = await analyzeQuestionQuality({
                    questionText: q.text,
                    intent: q.intent,
                });

                // If question has an ID, update its flags in the database
                if (q.id) {
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
                            operation: "quality_check",
                            warningCount: analysis.warnings.length,
                        },
                    });
                }

                return {
                    questionId: q.id,
                    text: q.text,
                    ...analysis,
                };
            })
        );

        // Summary
        const totalWarnings = results.reduce((acc, r) => acc + r.warnings.length, 0);
        const questionsWithIssues = results.filter((r) => r.warnings.length > 0).length;

        return successResponse({
            results,
            summary: {
                totalQuestions: questions.length,
                questionsWithIssues,
                totalWarnings,
            },
        });
    } catch (error) {
        console.error("[API] POST /api/questions/check error:", error);
        return errorResponse("Failed to check questions", 500);
    }
}
// Created by Swapnil Bapat © 2026
