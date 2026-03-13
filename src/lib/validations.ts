import { z } from "zod";

// Project schemas (Legacy - for migration compatibility)
export const CreateProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    researchStatement: z.string().min(10, "Research statement must be at least 10 characters"),
    ageRange: z.string().min(1, "Age range is required"),
    lifeStage: z.string().min(1, "Life stage is required"),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

// NEW: Simplified Project schema (just name and description)
export const CreateSimpleProjectSchema = z.object({
    name: z.string().min(1, "Project name is required"),
    description: z.string().optional().default(""),
});

export type CreateSimpleProjectInput = z.infer<typeof CreateSimpleProjectSchema>;

// NEW: Sub-Project schema (contains research details moved from Project)
export const CreateSubProjectSchema = z.object({
    projectId: z.string().cuid(),
    name: z.string().min(1, "Sub-project name is required"),
    researchStatement: z.string().min(10, "Research statement must be at least 10 characters"),
    ageRange: z.string().min(1, "Age range is required"),
    lifeStage: z.string().min(1, "Life stage is required"),
});

export type CreateSubProjectInput = z.infer<typeof CreateSubProjectSchema>;

// NEW: Update Project schema
export const UpdateProjectSchema = z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

// NEW: Update Sub-Project schema
export const UpdateSubProjectSchema = z.object({
    name: z.string().min(1).optional(),
    researchStatement: z.string().min(10).optional(),
    ageRange: z.string().min(1).optional(),
    lifeStage: z.string().min(1).optional(),
});

export type UpdateSubProjectInput = z.infer<typeof UpdateSubProjectSchema>;

// Research insight schema for already-researched findings
const ResearchInsightSchema = z.object({
    documentName: z.string(),
    excerpt: z.string(),
    summary: z.string().optional(),
    introText: z.string().optional(),
    actionSuggestion: z.string().optional(),
}).optional();

// Question schema with optional sub-questions
const QuestionInputSchema = z.object({
    text: z.string().min(1, "Question text is required"),
    intent: z.string().optional(),
    issues: z.array(z.any()).optional(),
    overallQuality: z.string().optional(),
    researchInsight: ResearchInsightSchema,
    subQuestions: z.array(z.object({
        text: z.string().min(1, "Sub-question text is required"),
        intent: z.string().optional(),
        issues: z.array(z.any()).optional(),
        overallQuality: z.string().optional(),
        researchInsight: ResearchInsightSchema,
    })).optional(),
});

// Guide schemas - supports both legacy projectId and new subProjectId
export const CreateGuideSetSchema = z.object({
    projectId: z.string().cuid().optional(), // Legacy - for backward compatibility
    subProjectId: z.string().cuid().optional(), // New - preferred
    guideVersionId: z.string().cuid().optional(), // Specific guide to update
    guideName: z.string().optional(), // Display name for the guide version
    guideSets: z.array(z.object({
        title: z.string().min(1, "Set title is required"),
        intent: z.string().min(1, "Intent is required"),
        questions: z.array(QuestionInputSchema).min(1, "At least one question is required"),
    })).min(1, "At least one guide set is required"),
}).refine(data => data.projectId || data.subProjectId, {
    message: "Either projectId or subProjectId is required",
});

export type CreateGuideSetInput = z.infer<typeof CreateGuideSetSchema>;

// Question checking schemas
export const CheckQuestionsSchema = z.object({
    projectId: z.string().cuid().optional(),
    questions: z.array(z.object({
        id: z.string().optional(),
        text: z.string().min(1),
        intent: z.string().optional(),
    })),
});

export type CheckQuestionsInput = z.infer<typeof CheckQuestionsSchema>;

export const RecheckQuestionsSchema = z.object({
    questionIds: z.array(z.string().cuid()).min(1),
});

export type RecheckQuestionsInput = z.infer<typeof RecheckQuestionsSchema>;

// Simulation schemas - supports both subProjectId (new) and projectId (legacy)
export const StartSimulationSchema = z.object({
    projectId: z.string().cuid().optional(), // Legacy - for backward compatibility
    subProjectId: z.string().cuid().optional(), // New - preferred
    guideVersionId: z.string().cuid().optional(), // Selected moderator guide
    personaId: z.string().cuid().optional(), // Legacy persona reference
    personaDocId: z.string().cuid().optional(), // Global KB persona reference  
    projectPersonaDocId: z.string().cuid().optional(), // Project KB persona reference (NEW)
    archetypeId: z.string().cuid().optional(), // Archetype-based persona reference (1:1 mode)
    isFocusGroup: z.boolean().optional().default(false), // Focus group mode
    archetypeIds: z.array(z.string().cuid()).min(2).max(5).optional(), // Focus group archetypes (2-5)
    mode: z.enum(["dojo", "prism"]).default("dojo"),
    mixerSettings: z.object({
        emotionalTone: z.number().min(0).max(100).default(50),
        responseLength: z.enum(["short", "medium", "long"]).default("medium"),
        thinkingStyle: z.enum(["concrete", "abstract"]).default("concrete"),
        moodSwings: z.number().min(0).max(100).default(30),
        singlishLevel: z.number().min(0).max(100).default(50),
    }).optional(),
}).refine(data => data.projectId || data.subProjectId, {
    message: "Either projectId or subProjectId is required",
});

export type StartSimulationInput = z.infer<typeof StartSimulationSchema>;

export const SendMessageSchema = z.object({
    simulationId: z.string().cuid(),
    content: z.string().min(1, "Message cannot be empty"),
    role: z.enum(["user", "persona"]).default("user"),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const EndSimulationSchema = z.object({
    simulationId: z.string().cuid(),
});

export type EndSimulationInput = z.infer<typeof EndSimulationSchema>;

// Response helpers
export function successResponse<T>(data: T, status = 200) {
    return Response.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400) {
    return Response.json({ success: false, error: message }, { status });
}

export function validationErrorResponse(errors: z.ZodError) {
    const issues = (errors as any).errors || (errors as any).issues || [];
    return Response.json(
        {
            success: false,
            error: "Validation failed",
            details: issues.map((e: any) => ({
                field: e.path ? e.path.join(".") : "unknown",
                message: e.message || String(e),
            })),
        },
        { status: 400 }
    );
}
// Created by Swapnil Bapat © 2026
