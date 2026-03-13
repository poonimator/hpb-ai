import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { errorResponse, successResponse } from "@/lib/validations";

/**
 * POST /api/feedback
 * Logs user feedback on AI-generated content for compliance and quality monitoring
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            type,           // "thumbs_up" | "thumbs_down" | "report_issue"
            entityType,     // "simulation_message" | "coach_review" | "coach_nudge" | "question_validation"
            entityId,       // ID of the specific entity being rated
            simulationId,   // Optional: parent simulation ID for context
            messageContent, // Optional: the content being rated (for audit)
            issueCategory,  // Optional: for reports - "inaccurate" | "harmful" | "biased" | "inappropriate" | "other"
            issueDetails,   // Optional: free-text explanation for reports
        } = body;

        // Validate required fields
        if (!type || !entityType || !entityId) {
            return errorResponse("Missing required fields: type, entityType, entityId", 400);
        }

        // Validate type
        const validTypes = ["thumbs_up", "thumbs_down", "report_issue"];
        if (!validTypes.includes(type)) {
            return errorResponse("Invalid feedback type. Must be: thumbs_up, thumbs_down, or report_issue", 400);
        }

        // Validate entityType
        const validEntityTypes = ["simulation_message", "coach_review", "coach_nudge", "question_validation"];
        if (!validEntityTypes.includes(entityType)) {
            return errorResponse("Invalid entity type", 400);
        }

        // For report_issue, validate category
        if (type === "report_issue") {
            const validCategories = ["inaccurate", "harmful", "biased", "inappropriate", "other"];
            if (issueCategory && !validCategories.includes(issueCategory)) {
                return errorResponse("Invalid issue category", 400);
            }
        }

        // Log the feedback to audit log
        await logAudit({
            action: type === "thumbs_up" ? "AI_FEEDBACK_POSITIVE"
                : type === "thumbs_down" ? "AI_FEEDBACK_NEGATIVE"
                    : "AI_FEEDBACK_REPORT",
            entityType: entityType,
            entityId: entityId,
            meta: {
                feedbackType: type,
                simulationId: simulationId || null,
                messageContentPreview: messageContent ? messageContent.substring(0, 200) : null,
                issueCategory: issueCategory || null,
                issueDetails: issueDetails || null,
                timestamp: new Date().toISOString(),
            }
        });

        // If it's a reported issue, we might want additional logging
        if (type === "report_issue") {
            console.warn("[AI Feedback] Issue reported:", {
                entityType,
                entityId,
                issueCategory,
                issueDetails: issueDetails?.substring(0, 500),
                timestamp: new Date().toISOString()
            });
        }

        return successResponse({
            message: "Feedback recorded successfully",
            type,
            entityId
        });

    } catch (error) {
        console.error("[API] POST /api/feedback error:", error);
        return errorResponse("Failed to record feedback", 500);
    }
}

/**
 * GET /api/feedback
 * Retrieves feedback statistics (for future admin dashboard)
 */
export async function GET(request: NextRequest) {
    try {
        // Get feedback counts from audit log
        const feedbackLogs = await prisma.auditLog.findMany({
            where: {
                action: {
                    in: ["AI_FEEDBACK_POSITIVE", "AI_FEEDBACK_NEGATIVE", "AI_FEEDBACK_REPORT"]
                }
            },
            orderBy: { createdAt: "desc" },
            take: 100 // Last 100 for now
        });

        // Aggregate statistics
        const stats = {
            total: feedbackLogs.length,
            positive: feedbackLogs.filter(l => l.action === "AI_FEEDBACK_POSITIVE").length,
            negative: feedbackLogs.filter(l => l.action === "AI_FEEDBACK_NEGATIVE").length,
            reports: feedbackLogs.filter(l => l.action === "AI_FEEDBACK_REPORT").length,
            recentReports: feedbackLogs
                .filter(l => l.action === "AI_FEEDBACK_REPORT")
                .slice(0, 10)
                .map(l => ({
                    id: l.id,
                    entityType: l.entityType,
                    entityId: l.entityId,
                    meta: l.metaJson ? JSON.parse(l.metaJson) : null,
                    createdAt: l.createdAt
                }))
        };

        return successResponse(stats);

    } catch (error) {
        console.error("[API] GET /api/feedback error:", error);
        return errorResponse("Failed to retrieve feedback", 500);
    }
}
// Created by Swapnil Bapat © 2026
