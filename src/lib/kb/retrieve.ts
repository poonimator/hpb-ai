// import { PrismaClient } from "@prisma/client";
import prisma from "@/lib/db/prisma";

/**
 * Valid knowledge base document types
 */
export type KBDocType = "PERSONA" | "FRAMEWORK" | "RESEARCH" | "POLICY" | "OTHER";

export interface RetrieveContextParams {
    query: string;
    docTypes?: KBDocType[];
    limitChunks?: number;
}

export interface RetrievedChunk {
    text: string;
    documentId: string;
    documentTitle: string;
    score: number; // Placeholder for future vector scoring
}

/**
 * Retrieve relevant KB chunks based on query
 * Currently uses simple keyword matching (case-insensitive inclusion)
 * In production, this should be replaced with vector search (embeddings)
 */
export async function retrieveKBContext(
    params: RetrieveContextParams
): Promise<RetrievedChunk[]> {
    const { query, docTypes, limitChunks = 5 } = params;

    // Clean query for better matching
    const terms = query
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter((t) => t.length > 3) // Only meaningful words
        .slice(0, 10); // Limit to top terms

    if (terms.length === 0) return [];

    try {
        // 1. Find APPROVED documents of correct type
        const whereClause: any = {
            status: "APPROVED",
        };

        if (docTypes && docTypes.length > 0) {
            whereClause.docType = { in: docTypes };
        }

        // 2. Search chunks containing terms
        // Note: Prisma/SQLite doesn't support full-text search efficiently out of the box
        // so we'll do a primitive scan + filter. For local dev with small data, this is acceptable.
        // For production, use Postgres + pgvector or a dedicated search service.

        // We want chunks that match AT LEAST one term
        const chunks = await prisma.kbChunk.findMany({
            where: {
                document: whereClause,
                OR: terms.map((term) => ({
                    content: { contains: term, mode: "insensitive" as const },
                })),
            },
            include: {
                document: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            take: 50, // Fetch more candidates, then rank in memory
        });

        // 3. Simple scoring in memory: count term overlap
        const scored = chunks.map((chunk) => {
            const contentLower = chunk.content.toLowerCase();
            let score = 0;
            terms.forEach((term) => {
                if (contentLower.includes(term)) score += 1;
            });
            return {
                text: chunk.content,
                documentId: chunk.document.id,
                documentTitle: chunk.document.title,
                score,
            };
        });

        // 4. Sort by score desc
        scored.sort((a, b) => b.score - a.score);

        // 5. Return top N unique documents (prefer variety unless high relevance)
        return scored.slice(0, limitChunks);
    } catch (error) {
        console.error("[KB] retrieveKBContext error:", error);
        return [];
    }
}

/**
 * Document content with metadata for AI context
 */
export interface DocumentContent {
    id: string;
    title: string;
    docType: string;
    content: string; // Full extracted text or concatenated chunks
}

/**
 * Retrieve all FRAMEWORK documents from the Global Knowledge Base.
 * These are used to ground the AI coach's mindset and approach.
 */
export async function retrieveGlobalFrameworks(): Promise<DocumentContent[]> {
    try {
        const documents = await prisma.kbDocument.findMany({
            where: {
                status: "APPROVED",
                docType: "FRAMEWORK",
            },
            select: {
                id: true,
                title: true,
                docType: true,
                extractedText: true,
                chunks: {
                    orderBy: { chunkIndex: "asc" },
                    select: { content: true },
                },
            },
        });

        return documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            docType: doc.docType,
            // Use extractedText if available, otherwise concatenate chunks
            content: doc.extractedText || doc.chunks.map((c) => c.content).join("\n\n"),
        }));
    } catch (error) {
        console.error("[KB] retrieveGlobalFrameworks error:", error);
        return [];
    }
}

/**
 * Retrieve all RESEARCH documents from a Project's Knowledge Base.
 * These are used to check for hypothesis validation redundancy.
 */
export async function retrieveProjectResearchDocs(projectId: string): Promise<DocumentContent[]> {
    try {
        const documents = await prisma.projectKbDocument.findMany({
            where: {
                projectId,
                status: "APPROVED",
                docType: "RESEARCH",
            },
            select: {
                id: true,
                title: true,
                docType: true,
                extractedText: true,
                chunks: {
                    orderBy: { chunkIndex: "asc" },
                    select: { content: true },
                },
            },
        });

        return documents.map((doc) => ({
            id: doc.id,
            title: doc.title,
            docType: doc.docType,
            // Use extractedText if available, otherwise concatenate chunks
            content: doc.extractedText || doc.chunks.map((c) => c.content).join("\n\n"),
        }));
    } catch (error) {
        console.error("[KB] retrieveProjectResearchDocs error:", error);
        return [];
    }
}
// Created by Swapnil Bapat © 2026
