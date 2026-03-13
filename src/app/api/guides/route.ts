import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit, logAuditBatch } from "@/lib/db/audit";
import {
    CreateGuideSetSchema,
    successResponse,
    errorResponse,
    validationErrorResponse,
} from "@/lib/validations";

// POST /api/guides - Create or replace guide sets with questions
// Supports both subProjectId (new) and projectId (legacy)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = CreateGuideSetSchema.safeParse(body);

        if (!validation.success) {
            return validationErrorResponse(validation.error);
        }

        const { projectId, subProjectId, guideVersionId: providedGuideVersionId, guideName, guideSets } = validation.data;

        // Determine if we're using the new SubProject flow or legacy Project flow
        let targetSubProjectId: string | null = subProjectId || null;
        let targetProjectId: string | null = projectId || null;

        if (subProjectId) {
            // New flow: Verify sub-project exists
            const subProject = await prisma.subProject.findUnique({
                where: { id: subProjectId },
            });

            if (!subProject) {
                return errorResponse("Sub-project not found", 404);
            }

            targetProjectId = subProject.projectId;
        } else if (projectId) {
            // Legacy flow: Verify project exists
            const project = await prisma.project.findUnique({
                where: { id: projectId },
            });

            if (!project) {
                return errorResponse("Project not found", 404);
            }
        } else {
            return errorResponse("Either projectId or subProjectId is required", 400);
        }

        // Handle Versioning
        // If guideVersionId is provided, use that specific guide
        // Otherwise, find or create the latest version
        let guideVersion;

        if (providedGuideVersionId) {
            // Use the specific guide version provided
            guideVersion = await prisma.guideVersion.findUnique({
                where: { id: providedGuideVersionId }
            });

            if (!guideVersion) {
                return errorResponse("Guide version not found", 404);
            }

            // Update guide name if provided
            if (guideName && guideVersion.name !== guideName) {
                await prisma.guideVersion.update({
                    where: { id: guideVersion.id },
                    data: { name: guideName }
                });
            }
        } else {
            // Legacy behavior: find or create latest version
            guideVersion = await prisma.guideVersion.findFirst({
                where: subProjectId
                    ? { subProjectId }
                    : { projectId: targetProjectId!, subProjectId: null },
                orderBy: { versionNumber: "desc" },
            });

            if (!guideVersion) {
                guideVersion = await prisma.guideVersion.create({
                    data: {
                        subProjectId: targetSubProjectId,
                        projectId: subProjectId ? null : targetProjectId,
                        name: guideName || "Moderator Guide",
                        versionNumber: 1,
                    },
                });
            } else if (guideName && guideVersion.name !== guideName) {
                await prisma.guideVersion.update({
                    where: { id: guideVersion.id },
                    data: { name: guideName },
                });
            }
        }

        const guideVersionId = guideVersion.id;

        // Get existing guide sets (for this version) to log their deletion
        const existingSets = await prisma.guideSet.findMany({
            where: { guideVersionId },
            include: { questions: true },
        });

        // Delete existing guide sets for this version
        if (existingSets.length > 0) {
            await prisma.guideSet.deleteMany({
                where: { guideVersionId },
            });

            // Log deletions
            const deleteAuditEntries = [
                ...existingSets.map((set) => ({
                    action: "DELETE" as const,
                    entityType: "GuideSet",
                    entityId: set.id,
                    meta: { subProjectId, projectId: targetProjectId, guideVersionId, reason: "replaced by new guide sets" },
                })),
                ...existingSets.flatMap((set) =>
                    set.questions.map((q) => ({
                        action: "DELETE" as const,
                        entityType: "Question",
                        entityId: q.id,
                        meta: { guideSetId: set.id, reason: "parent guideSet replaced" },
                    }))
                ),
            ];

            await logAuditBatch(deleteAuditEntries);
        }

        // Create new guide sets with questions (including sub-questions)
        const createdSets = await Promise.all(
            guideSets.map(async (set, setIndex) => {
                // First create the guide set
                const guideSet = await prisma.guideSet.create({
                    data: {
                        guideVersionId,
                        title: set.title || `Question Set ${setIndex + 1}`,
                        intent: set.intent,
                    },
                });

                // Then create main questions with their sub-questions
                const createdQuestions = [];
                for (let qIndex = 0; qIndex < set.questions.length; qIndex++) {
                    const q = set.questions[qIndex];

                    // Create main question
                    const mainQuestion = await prisma.question.create({
                        data: {
                            guideSetId: guideSet.id,
                            text: q.text,
                            intent: q.intent || null,
                            order: qIndex,
                            parentId: null, // Main question has no parent
                            flagsJson: JSON.stringify({ issues: q.issues || [], overallQuality: q.overallQuality, researchInsight: q.researchInsight }),
                        },
                    });
                    createdQuestions.push(mainQuestion);

                    // Create sub-questions if any
                    if (q.subQuestions && q.subQuestions.length > 0) {
                        for (let sIndex = 0; sIndex < q.subQuestions.length; sIndex++) {
                            const subQ = q.subQuestions[sIndex];
                            const subQuestion = await prisma.question.create({
                                data: {
                                    guideSetId: guideSet.id,
                                    text: subQ.text,
                                    intent: subQ.intent || null,
                                    order: sIndex, // Order within sub-questions (0=A, 1=B, etc.)
                                    parentId: mainQuestion.id,
                                    flagsJson: JSON.stringify({ issues: subQ.issues || [], overallQuality: subQ.overallQuality, researchInsight: subQ.researchInsight }),
                                },
                            });
                            createdQuestions.push(subQuestion);
                        }
                    }
                }

                // Fetch the complete guide set with nested questions
                const completeGuideSet = await prisma.guideSet.findUnique({
                    where: { id: guideSet.id },
                    include: {
                        questions: {
                            where: { parentId: null }, // Only main questions
                            orderBy: { order: "asc" },
                            include: {
                                subQuestions: {
                                    orderBy: { order: "asc" },
                                },
                            },
                        },
                    },
                });

                return completeGuideSet;
            })
        );

        // Audit logs (filter out nulls)
        const validSets = createdSets.filter((set): set is NonNullable<typeof set> => set !== null);
        const createAuditEntries = [
            ...validSets.map((set) => ({
                action: "CREATE" as const,
                entityType: "GuideSet",
                entityId: set.id,
                meta: { subProjectId, projectId: targetProjectId, guideVersionId, questionCount: set.questions.length },
            })),
            ...validSets.flatMap((set) =>
                set.questions.flatMap((q) => [
                    {
                        action: "CREATE" as const,
                        entityType: "Question",
                        entityId: q.id,
                        meta: { guideSetId: set.id, isMainQuestion: true },
                    },
                    ...q.subQuestions.map((subQ) => ({
                        action: "CREATE" as const,
                        entityType: "Question",
                        entityId: subQ.id,
                        meta: { guideSetId: set.id, parentId: q.id, isSubQuestion: true },
                    })),
                ])
            ),
        ];

        await logAuditBatch(createAuditEntries);

        return successResponse(validSets, 201);
    } catch (error) {
        console.error("[API] POST /api/guides error:", error);
        return errorResponse("Failed to create guide sets", 500);
    }
}

// GET /api/guides?projectId=xxx OR ?subProjectId=xxx - Get guide sets
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get("projectId");
        const subProjectId = searchParams.get("subProjectId");

        if (!projectId && !subProjectId) {
            return errorResponse("Either projectId or subProjectId query parameter is required", 400);
        }

        // Get latest version
        const latestVersion = await prisma.guideVersion.findFirst({
            where: subProjectId
                ? { subProjectId }
                : { projectId: projectId!, subProjectId: null },
            orderBy: { versionNumber: "desc" },
        });

        if (!latestVersion) {
            // No guides yet
            return successResponse([]);
        }

        const guideSets = await prisma.guideSet.findMany({
            where: { guideVersionId: latestVersion.id },
            include: {
                questions: {
                    where: { parentId: null }, // Only main questions
                    orderBy: { order: "asc" },
                    include: {
                        subQuestions: {
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
            orderBy: { createdAt: "asc" },
        });

        // Parse flagsJson for each question
        const parsedGuideSets = guideSets.map(set => ({
            ...set,
            questions: set.questions.map(q => {
                let issues = [];
                let overallQuality = undefined;
                let researchInsight = undefined;
                if (q.flagsJson) {
                    try {
                        const parsed = JSON.parse(q.flagsJson);
                        issues = parsed.issues || [];
                        overallQuality = parsed.overallQuality;
                        researchInsight = parsed.researchInsight;
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }

                return {
                    ...q,
                    issues,
                    overallQuality,
                    researchInsight,
                    subQuestions: q.subQuestions.map(sq => {
                        let sqIssues = [];
                        let sqQuality = undefined;
                        let sqResearchInsight = undefined;
                        if (sq.flagsJson) {
                            try {
                                const parsed = JSON.parse(sq.flagsJson);
                                sqIssues = parsed.issues || [];
                                sqQuality = parsed.overallQuality;
                                sqResearchInsight = parsed.researchInsight;
                            } catch (e) { }
                        }
                        return {
                            ...sq,
                            issues: sqIssues,
                            overallQuality: sqQuality,
                            researchInsight: sqResearchInsight
                        };
                    })
                };
            })
        }));

        return successResponse(parsedGuideSets);
    } catch (error) {
        console.error("[API] GET /api/guides error:", error);
        return errorResponse("Failed to fetch guide sets", 500);
    }
}

// Created by Swapnil Bapat © 2026
