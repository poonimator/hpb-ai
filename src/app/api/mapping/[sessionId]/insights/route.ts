import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getOpenAIClient, SYSTEM_GUARDRAILS } from "@/lib/ai/openai";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ sessionId: string }> } // Correct type for Next.js 15+
) {
    const { sessionId } = await context.params;

    try {
        // 1. Fetch Session & Project Data
        const session = await prisma.mappingSession.findUnique({
            where: { id: sessionId },
            include: {
                clusters: {
                    include: {
                        transcript: true
                    }
                },
                subProject: {
                    include: {
                        project: {
                            include: {
                                kbDocuments: {
                                    where: { docType: "RESEARCH", status: "APPROVED" }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        const project = session.subProject.project;
        const projectResearch = project.kbDocuments;

        // 2. Fetch Global Frameworks
        const globalFrameworks = await prisma.kbDocument.findMany({
            where: { docType: "FRAMEWORK", status: "APPROVED" }
        });

        // 3. Prepare Data for AI
        // Group clusters by theme for better context, including transcript tags
        const clustersByTheme: Record<string, { transcript: string, quote: string }[]> = {};
        session.clusters.forEach(c => {
            if (!clustersByTheme[c.themeName]) clustersByTheme[c.themeName] = [];
            clustersByTheme[c.themeName].push({
                transcript: c.transcript.displayName,
                quote: c.quote
            });
        });

        const researchContext = projectResearch
            .map(d => `[Document: ${d.title}]\n${d.extractedText?.slice(0, 3000) || "No text"}`)
            .join("\n\n");

        const frameworkContext = globalFrameworks
            .map(d => `[Framework: ${d.title}]\n${d.extractedText?.slice(0, 3000) || "No text"}`)
            .join("\n\n");

        // 4. Construct Prompt
        const prompt = `
            You are an expert researcher at HPB (Health Promotion Board), thinking effectively about behavioral insights and public health.
            
            PROJECT CONTEXT:
            Project Name: ${project.name}
            Project Description: ${project.description}
            Sub-Project: ${session.subProject.name}
            Research Statement: ${session.subProject.researchStatement}
            
            GLOBAL FRAMEWORKS (Your Mindset/Lens):
            ${frameworkContext || "No specific frameworks linked. Use standard HPB behavioral frameworks."}
            
            EXISTING RESEARCH (Cross-Validation Source):
            ${researchContext || "No existing research documents available."}
            
            NEW MAPPING DATA (From Interviews):
            ${JSON.stringify(clustersByTheme, null, 2)}
            
            TASK:
            1. COMPREHENSIVE SCAN: You must meticulously review EVERY single quote and cluster provided in the "NEW MAPPING DATA". Do not skip any data points, no matter how small.
            2. SYNTHESIZE: Group these quotes into cohesive behavioral themes. Look for patterns in "Say" vs "Do", motivations, and barriers.
            3. CROSS-REFERENCE: Compare these synthesized themes against the "GLOBAL FRAMEWORKS" (does this align with known behavioral models?) and "EXISTING RESEARCH" (is this repetitive or new?).
            4. CATEGORIZE: Distribute these themes into 3 distinct buckets.
            5. MAXIMIZE OUTPUT: Do not hold back. Aim to generate as many valid, distinct insights as possible (e.g., at least 5-8 per column if supported by the data). Do not merge distinct concepts into one. Avoid broad summaries; we prefer granular, specific insights derived from individual quotes.

            Column 1: "found_out" (The Strong Patterns & Solidified Insights)
            - Findings that are clear, repetitive across multiple participants (high confidence), and/or strongly supported by Global Frameworks.
            - This is what we have confirmed and validated.

            Column 2: "look_further" (The Tensions, Gaps & Ambiguities)
            - Contradictions between participants (e.g., one says X, another says Y).
            - "Say-Do" gaps (targets say one thing but behavior suggests another).
            - Areas where the mapping data matches "EXISTING RESEARCH" but needs more validation or adds confusion or complexity rather than clarity.

            Column 3: "new_areas" (The "White Space" & Novel Opportunities)
            - Completely novel findings present in the data but ABSENT from "EXISTING RESEARCH".
            - Unexpected behaviors or motivations that suggest a totally new angle for the project not previously considered.
            
            For each card/insight:
            - "text": A brief, condensed, and highly valuable insight (max 20 words) that are unique (not repetitive).
            - "citation": The Title of a document from "EXISTING RESEARCH" if relevant. If it is purely new Primary Research driven by the data, set this to NULL/Empty string.
            - "citation_match": "VALIDATION", "CONTRADICTION", "RELATED", or "NONE".
            - "citation_reason": A brief, valuable sentence (max 15 words) explaining WHY the existing research validates, contradicts, or relates to this finding. If citation is null, this should be null.
            - "transcript_tags": An array of strings listing the unique transcript IDs/Names (e.g. ["Y08", "Y04"]) that contributed to this insight. Deriving this from the "NEW MAPPING DATA" provided.
            
            OUTPUT JSON:
            {
                "found_out": [{ "text": "...", "citation": "...", "citation_match": "...", "citation_reason": "...", "transcript_tags": ["..."] }],
                "look_further": [{ "text": "...", "citation": "...", "citation_match": "...", "citation_reason": "...", "transcript_tags": ["..."] }],
                "new_areas": [{ "text": "...", "citation": "...", "citation_match": "...", "citation_reason": "...", "transcript_tags": ["..."] }]
            }
        `;

        // 5. Check for Existing Insights (unless regenerating)
        const url = new URL(req.url);
        const regenerate = url.searchParams.get("regenerate") === "true";

        if (session.insightsJson && !regenerate) {
            try {
                const storedInsights = JSON.parse(session.insightsJson);
                return NextResponse.json({ data: storedInsights });
            } catch (e) {
                console.warn("Failed to parse stored insights, regenerating...");
            }
        }

        // 6. Call OpenAI
        console.log("Generating insights with OpenAI (gpt-5.2)...");
        const client = getOpenAIClient();
        const response = await client.chat.completions.create({
            model: "gpt-5.2", // Strong model for reasoning
            messages: [
                { role: "system", content: SYSTEM_GUARDRAILS },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No response from AI");

        const parsedCallback = JSON.parse(content);

        // 7. Save to Database
        await prisma.mappingSession.update({
            where: { id: sessionId },
            data: {
                insightsJson: JSON.stringify(parsedCallback)
            }
        });

        return NextResponse.json({
            data: parsedCallback
        });

    } catch (error) {
        console.error("Insights Generation Error:", error);
        return NextResponse.json(
            { error: "Failed to generate insights" },
            { status: 500 }
        );
    }
}
// Created by Swapnil Bapat © 2026
