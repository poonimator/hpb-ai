import { NextRequest } from "next/server";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";
import { generateQuestionValidation } from "@/lib/ai/openai";
import { buildValidationPrompt } from "@/lib/ai/prompts/question_validation";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { questions, context } = body;

        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return errorResponse("questions array is required", 400);
        }

        const prompt = buildValidationPrompt(questions, context || {});

        const result = await generateQuestionValidation({
            prompt,
            modelName: "gpt-5.2"
        });

        if (!result.success) {
            return errorResponse(result.error || "Validation failed", 500);
        }

        // Log audit
        await logAudit({
            action: "GEMINI_VALIDATE_QUESTIONS",
            entityType: "GuideSet",
            entityId: context?.setId || "bulk",
            meta: {
                questionCount: questions.length,
                modelName: result.modelName,
                latencyMs: result.latencyMs,
                summary: result.data.summary
            }
        });

        return successResponse({
            ...result.data,
            modelName: result.modelName,
            latencyMs: result.latencyMs
        });

    } catch (error) {
        console.error("[API] POST /api/gemini/validate-questions error:", error);
        return errorResponse("Failed to validate questions", 500);
    }
}
// Created by Swapnil Bapat © 2026
