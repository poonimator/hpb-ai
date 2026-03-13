import { NextResponse } from 'next/server';
import { getOpenAIClient, DEFAULT_MODEL } from '@/lib/ai/openai';
import prisma from "@/lib/db/prisma";

export async function POST(req: Request) {
    try {
        const { questions, projectId, context } = await req.json();

        if (!questions || !Array.isArray(questions)) {
            return NextResponse.json({ success: false, error: "Invalid questions format" }, { status: 400 });
        }

        // 1. Gather Knowledge Base Content from Database
        // We only want documents with docType = "RESEARCH"

        // Fetch Global Research Docs (use extractedText from DB, not filesystem)
        const globalDocs = await prisma.kbDocument.findMany({
            where: {
                docType: "RESEARCH"
            },
            select: {
                title: true,
                extractedText: true,
                chunks: {
                    orderBy: { chunkIndex: "asc" },
                    select: { content: true },
                },
            }
        });

        // Fetch Project Research Docs (if projectId is provided)
        let projectDocs: { title: string; extractedText: string | null; chunks: { content: string }[] }[] = [];
        if (projectId) {
            projectDocs = await prisma.projectKbDocument.findMany({
                where: {
                    projectId: projectId,
                    docType: "RESEARCH"
                },
                select: {
                    title: true,
                    extractedText: true,
                    chunks: {
                        orderBy: { chunkIndex: "asc" },
                        select: { content: true },
                    },
                }
            });
        }

        const allDocs = [...globalDocs, ...projectDocs];

        if (allDocs.length === 0) {
            // No research data available, return early
            return NextResponse.json({ success: true, results: [] });
        }

        // 2. Build content from extractedText or chunks (no filesystem access needed)
        const kbContent = allDocs
            .map(doc => {
                const text = doc.extractedText || doc.chunks.map(c => c.content).join("\n\n");
                if (!text) return "";
                return `--- DOCUMENT START: ${doc.title} ---\n${text}\n--- DOCUMENT END ---\n`;
            })
            .filter(Boolean)
            .join("\n");

        if (!kbContent.trim()) {
            return NextResponse.json({ success: true, results: [] });
        }

        // 3. Prepare Prompt
        const prompt = `
        You are a Research Consistency Analyzer.
        Your goal is to check if the following "Questions We Want To Ask" in a user interview have already been answered or covered by the existing "Research Documents".
        
        Context:
        Project: ${context.projectName || "Unknown"}
        Intent: ${context.setIntent || "Unknown"}
        
        Research Documents:
        ${kbContent.substring(0, 100000)} // Cap context to avoid token limits

        Questions to Analyze:
        ${JSON.stringify(questions, null, 2)}

        Instructions:
        For EACH question, determine if the topic/intent is ALREADY addressed in the *Research Documents*.
        - Only flag as "hasResearch": true if there is CLEAR information that answers the question or renders it redundant because we already know the answer from previous research.
        - Be conservative. If unsure, do not flag.
        - If found, extract a short relevant excerpt (max 20 words) and specific Document Name.
        - Also provide a brief descriptive summary (10-15 words) that explains HOW this research relates to the question.
        - Provide a contextual introText (1 sentence) that explains the connection between the research and the question naturally.
        - Provide an actionSuggestion (1 sentence) that PROBES the user to think critically. Do NOT provide sample questions or direct rewrites. Instead, use coaching-style prompts that encourage reflection, like "What aspect of this hasn't been explored yet?" or "How might you dig deeper beyond what's already known?"
        
        Output JSON format:
        {
            "results": [
                {
                    "questionLabel": "1",
                    "hasResearch": true/false,
                    "documentName": "Name of doc or null",
                    "excerpt": "Short text from doc or null",
                    "summary": "Descriptive sentence explaining relevance",
                    "introText": "A contextual intro like 'Your earlier research on [topic] has already explored this area...' or null",
                    "actionSuggestion": "A probing question or coaching prompt like 'What new angle could you explore that builds on this finding?' - never provide sample questions or rewrites"
                },
                ...
            ]
        }
        Return ONLY valid JSON.
        `;

        // 4. Call OpenAI
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: "system", content: "You are a helpful research assistant." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0]?.message?.content || "";
        const jsonResponse = JSON.parse(content);

        return NextResponse.json({ success: true, data: jsonResponse });

    } catch (error: any) {
        console.error("Research Check Error:", error);
        // Continue without failing if AI fails
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
// Created by Swapnil Bapat © 2026
