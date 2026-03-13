import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

// Heuristic configuration
const MATCH_THRESHOLD = 0.35; // Lower threshold to catch "somewhat close" variants
const EXACT_MATCH_THRESHOLD = 0.9;

interface GuideQuestion {
    id: string;
    text: string;
    intent: string | null;
    order: number;
    setTitle: string;
    setIntent: string;
}

// Tokenize helper: splits text into lowercase words, removing common stop words roughly
function tokenize(text: string): Set<string> {
    const stopWords = new Set(["a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or", "is", "are", "was", "were", "be", "do", "does", "did", "can", "could", "should", "would", "may", "might", "have", "has", "had", "it", "its", "that", "this", "these", "those", "you", "your", "i", "me", "my", "we", "us", "our", "he", "him", "his", "she", "her", "they", "them", "their", "what", "which", "who", "whom", "whose", "why", "where", "when", "how"]);

    return new Set(
        text.toLowerCase()
            .replace(/[^\w\s]/g, "") // Remove punctuation
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.has(w)) // Filter stop words and tiny words
    );
}

// Jaccard similarity coefficient (Intersection over Union)
function calculateJaccard(str1: string, str2: string): number {
    const s1 = tokenize(str1);
    const s2 = tokenize(str2);

    if (s1.size === 0 || s2.size === 0) return 0;

    let intersection = 0;
    s1.forEach(token => {
        if (s2.has(token)) intersection++;
    });

    const union = s1.size + s2.size - intersection;
    return intersection / union;
}

// POST /api/gemini/map-question - Map user utterance to guide question locally
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { projectId, simulationId, userUtterance } = body;

        if (!projectId || !userUtterance) {
            return errorResponse("projectId and userUtterance are required", 400);
        }

        // Fetch latest guide questions for the project
        const latestVersion = await prisma.guideVersion.findFirst({
            where: { projectId },
            orderBy: { versionNumber: 'desc' },
            include: {
                guideSets: {
                    include: {
                        questions: {
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });

        if (!latestVersion || latestVersion.guideSets.length === 0) {
            return successResponse({
                questionId: null,
                confidence: 0,
                reason: "No guide questions found for this project"
            });
        }

        // Flatten questions
        const questions: GuideQuestion[] = latestVersion.guideSets.flatMap(set =>
            set.questions.map(q => ({
                id: q.id,
                text: q.text,
                intent: q.intent,
                order: q.order,
                setTitle: set.title,
                setIntent: set.intent
            }))
        );

        if (questions.length === 0) {
            return successResponse({
                questionId: null,
                confidence: 0,
                reason: "No questions in guide"
            });
        }

        // Find best match using Jaccard Similarity
        let bestMatchId: string | null = null;
        let bestScore = 0;
        let bestMatchReason = "No sufficient match found";

        // Pre-tokenize user utterance for efficiency logic handled in helper, 
        // but typically we recalculate per pair.

        for (const q of questions) {
            // Check for exact substring match first (e.g. autofill)
            if (q.text.toLowerCase().trim() === userUtterance.toLowerCase().trim()) {
                bestScore = 1.0;
                bestMatchId = q.id;
                bestMatchReason = "Exact match";
                break;
            }

            const score = calculateJaccard(userUtterance, q.text);
            if (score > bestScore) {
                bestScore = score;
                bestMatchId = q.id;
            }
        }

        // Threshold check
        if (bestScore >= MATCH_THRESHOLD) {
            bestMatchReason = `Matched with local confidence ${bestScore.toFixed(2)}`;
        } else {
            bestMatchId = null;
            bestMatchReason = `Best match score ${bestScore.toFixed(2)} below threshold ${MATCH_THRESHOLD}`;
        }

        const latencyMs = Date.now() - startTime;

        // Log audit only for matches or high-value attempts? 
        // Or just keep it silent for speed. User requested "build this ourselves".
        // Let's log it to be safe for debugging.
        await logAudit({
            action: "QUESTION_MAPPED_AUTO",
            entityType: "Simulation",
            entityId: simulationId || projectId,
            meta: {
                projectId,
                utteranceLength: userUtterance.length,
                matchedQuestionId: bestMatchId,
                confidence: bestScore,
                algo: "Jaccard",
                latencyMs
            }
        });

        return successResponse({
            questionId: bestMatchId,
            confidence: bestScore,
            reason: bestMatchReason,
            modelName: "local-jaccard",
            latencyMs
        });

    } catch (error) {
        console.error("[API] POST /api/gemini/map-question error:", error);
        return errorResponse("Failed to map question locally", 500);
    }
}
// Created by Swapnil Bapat © 2026
