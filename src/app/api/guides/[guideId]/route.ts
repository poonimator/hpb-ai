import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { successResponse, errorResponse } from "@/lib/validations";

// GET /api/guides/[guideId] - Get a specific guide
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ guideId: string }> }
) {
    try {
        const { guideId } = await params;

        const guide = await prisma.guideVersion.findUnique({
            where: { id: guideId },
            include: {
                guideSets: {
                    include: {
                        questions: {
                            where: { parentId: null },
                            orderBy: { order: "asc" },
                            include: {
                                subQuestions: {
                                    orderBy: { order: "asc" }
                                }
                            }
                        }
                    }
                },
                subProject: {
                    select: {
                        id: true,
                        name: true,
                        projectId: true,
                        project: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        if (!guide) {
            return errorResponse("Guide not found", 404);
        }

        // Parse flagsJson
        const parsedGuide = {
            ...guide,
            guideSets: guide.guideSets.map(set => ({
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
                        } catch (e) { }
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
            }))
        };

        return successResponse({ guide: parsedGuide });

    } catch (error) {
        console.error("[Get Guide] Error:", error);
        return errorResponse("Failed to fetch guide", 500);
    }
}

// PUT /api/guides/[guideId] - Update guide (mainly for renaming)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ guideId: string }> }
) {
    try {
        const { guideId } = await params;
        const body = await request.json();
        const { name } = body;

        if (!name?.trim()) {
            return errorResponse("Name is required", 400);
        }

        const guide = await prisma.guideVersion.update({
            where: { id: guideId },
            data: { name: name.trim() }
        });

        return successResponse({ guide });

    } catch (error) {
        console.error("[Update Guide] Error:", error);
        return errorResponse("Failed to update guide", 500);
    }
}

// DELETE /api/guides/[guideId] - Delete a guide
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ guideId: string }> }
) {
    try {
        const { guideId } = await params;

        await prisma.guideVersion.delete({
            where: { id: guideId }
        });

        return successResponse({ message: "Guide deleted" });

    } catch (error) {
        console.error("[Delete Guide] Error:", error);
        return errorResponse("Failed to delete guide", 500);
    }
}
// Created by Swapnil Bapat © 2026
