import "server-only";

import prisma from "./prisma";

export interface AuditLogEntry {
    userId?: string;
    action: "CREATE" | "UPDATE" | "DELETE" | "READ" | "START" | "END" | "GEMINI_SIMULATE" | "GEMINI_SIMULATE_FAIL" | "GEMINI_REVIEW" | "GEMINI_REVIEW_FAIL" | "KB_UPLOAD" | "KB_APPROVE" | "KB_REJECT" | "GEMINI_VALIDATE_QUESTIONS" | "GEMINI_MAP_QUESTION" | "QUESTION_MAPPED_AUTO" | "QUESTION_MAPPED_MANUAL" | "COVERAGE_FINALIZED" | "COACH_CHAT" | "COACH_CHAT_FAIL" | "LIVE_COACH" | "LIVE_COACH_FAIL" | "AI_FEEDBACK_POSITIVE" | "AI_FEEDBACK_NEGATIVE" | "AI_FEEDBACK_REPORT" | "UPLOAD_TRANSCRIPT" | "GENERATE_THEMES" | "GENERATE_CLUSTERS" | "MAPPING_COMPLETE" | "GENERATE_ARCHETYPES" | "HMW_CRITIQUE";
    entityType: string;
    entityId: string;
    meta?: Record<string, unknown>;
}

/**
 * Logs an audit entry for compliance and debugging.
 * All create/update/delete operations should be logged.
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: entry.userId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId,
                metaJson: entry.meta ? JSON.stringify(entry.meta) : null,
            },
        });
    } catch (error) {
        // Log error but don't throw - audit logging should not break main flows
        console.error("[AuditLog] Failed to log entry:", error, entry);
    }
}

/**
 * Bulk log multiple audit entries
 */
export async function logAuditBatch(entries: AuditLogEntry[]): Promise<void> {
    try {
        await prisma.auditLog.createMany({
            data: entries.map((entry) => ({
                userId: entry.userId,
                action: entry.action,
                entityType: entry.entityType,
                entityId: entry.entityId,
                metaJson: entry.meta ? JSON.stringify(entry.meta) : null,
            })),
        });
    } catch (error) {
        console.error("[AuditLog] Failed to log batch:", error);
    }
}
// Created by Swapnil Bapat © 2026
