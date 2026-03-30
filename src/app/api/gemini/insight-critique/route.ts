import { NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured, DEFAULT_MODEL, DISCLAIMER } from '@/lib/ai/openai';
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";

export async function POST(req: Request) {
    try {
        const { insightStatement, projectId, subProjectId, researchStatement } = await req.json();

        if (!insightStatement || typeof insightStatement !== "string" || !insightStatement.trim()) {
            return NextResponse.json({ success: false, error: "Insight statement is required" }, { status: 400 });
        }

        if (!projectId) {
            return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 });
        }

        if (!subProjectId) {
            return NextResponse.json({ success: false, error: "Sub-project ID is required" }, { status: 400 });
        }

        // Fetch research context from project KB
        const projectOtherDocs = await prisma.projectKbDocument.findMany({
            where: { projectId, docType: "OTHER", status: "APPROVED" },
            select: { title: true, extractedText: true, chunks: { orderBy: { chunkIndex: "asc" }, select: { content: true } } },
        });

        const projectResearchDocs = await prisma.projectKbDocument.findMany({
            where: { projectId, docType: "RESEARCH", status: "APPROVED" },
            select: { title: true, extractedText: true, chunks: { orderBy: { chunkIndex: "asc" }, select: { content: true } } },
        });

        const allDocs = [...projectOtherDocs, ...projectResearchDocs];

        let kbContext = "";
        if (allDocs.length > 0) {
            kbContext = allDocs.map(doc => {
                const text = doc.extractedText || doc.chunks.map(c => c.content).join("\n\n");
                if (!text) return "";
                return `--- DOCUMENT: ${doc.title} ---\n${text}\n--- END ---\n`;
            }).filter(Boolean).join("\n");
        }

        // Build prompt
        const prompt = buildInsightCritiquePrompt(insightStatement.trim(), kbContext, researchStatement);

        // Response schema
        const responseSchema = {
            type: "object" as const,
            additionalProperties: false,
            properties: {
                overallVerdict: {
                    type: "string" as const,
                    description: "PASS, NEEDS_WORK, or FAIL"
                },
                overallSummary: {
                    type: "string" as const,
                    description: "A direct 1-2 sentence assessment of the insight statement's quality"
                },
                criteria: {
                    type: "array" as const,
                    items: {
                        type: "object" as const,
                        additionalProperties: false,
                        properties: {
                            name: { type: "string" as const, description: "Criterion name: 'Well-Informed', 'More Than an Observation', 'So What?', 'Sticky', 'Actionable'" },
                            verdict: { type: "string" as const, description: "PASS, PARTIAL, or FAIL" },
                            explanation: { type: "string" as const, description: "Brief, sharp critique. No sugarcoating." },
                            suggestedImprovement: { type: "string" as const, description: "Concrete improvement suggestion, or empty string if it passes" }
                        },
                        required: ["name", "verdict", "explanation", "suggestedImprovement"]
                    }
                },
                statementBreakdown: {
                    type: "array" as const,
                    description: "Break the insight statement into 3-5 meaningful phrases with annotations",
                    items: {
                        type: "object" as const,
                        additionalProperties: false,
                        properties: {
                            text: { type: "string" as const, description: "Exact substring from the insight statement" },
                            note: { type: "string" as const, description: "1-2 sentence annotation on why this part works or doesn't" },
                            sentiment: { type: "string" as const, description: "strength, issue, or neutral" }
                        },
                        required: ["text", "note", "sentiment"]
                    }
                },
                researchAlignment: {
                    type: "object" as const,
                    additionalProperties: false,
                    properties: {
                        isAligned: { type: "boolean" as const },
                        soWhat: { type: "string" as const, description: "One punchy sentence answering 'so what?' — the key implication" },
                        explanation: { type: "string" as const, description: "Assessment of research alignment" },
                        relevantFindings: { type: "array" as const, items: { type: "string" as const } },
                        evidence: {
                            type: "array" as const,
                            items: {
                                type: "object" as const,
                                additionalProperties: false,
                                properties: {
                                    source: { type: "string" as const, description: "Exact document title from the KB" },
                                    quote: { type: "string" as const, description: "Near-verbatim quote, 1-2 sentences max" },
                                    connection: { type: "string" as const, description: "How this evidence relates to the insight" }
                                },
                                required: ["source", "quote", "connection"]
                            }
                        }
                    },
                    required: ["isAligned", "soWhat", "explanation", "relevantFindings", "evidence"]
                }
            },
            required: ["overallVerdict", "overallSummary", "criteria", "statementBreakdown", "researchAlignment"]
        };

        // Mock response if OpenAI not configured
        if (!isOpenAIConfigured()) {
            const mockData = getMockInsightCritique();
            let savedId: string | null = null;
            try {
                const saved = await prisma.insightCritique.create({
                    data: { subProjectId, insightStatement: insightStatement.trim(), overallVerdict: mockData.overallVerdict, critiqueJson: JSON.stringify(mockData) },
                });
                savedId = saved.id;
            } catch (dbErr) {
                console.error("[Insight Critique] Mock DB save error:", dbErr);
            }
            return NextResponse.json({ success: true, data: mockData, savedId, disclaimer: DISCLAIMER, modelName: "mock" });
        }

        const client = getOpenAIClient();
        const startTime = Date.now();

        const response = await client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: "system", content: "You are an expert design researcher and insight analyst. You assess insight statements with surgical precision. You are direct, honest, and constructive." },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: { name: "insight_critique", strict: true, schema: responseSchema }
            },
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || "";
        const latencyMs = Date.now() - startTime;

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("[Insight Critique] Failed to parse AI response:", content);
            return NextResponse.json({ success: false, error: "Failed to parse AI response" }, { status: 500 });
        }

        // Persist to database
        let savedId: string | null = null;
        try {
            const saved = await prisma.insightCritique.create({
                data: { subProjectId, insightStatement: insightStatement.trim(), overallVerdict: parsed.overallVerdict, critiqueJson: JSON.stringify(parsed) },
            });
            savedId = saved.id;
        } catch (dbErr) {
            console.error("[Insight Critique] DB save error:", dbErr);
        }

        // Audit log
        try {
            await logAudit({
                action: "INSIGHT_CRITIQUE",
                entityType: "SubProject",
                entityId: subProjectId,
                meta: { modelName: DEFAULT_MODEL, latencyMs, insightStatementLength: insightStatement.length, kbDocsUsed: allDocs.length, overallVerdict: parsed.overallVerdict },
            });
        } catch (auditErr) {
            console.error("[Insight Critique] Audit log error:", auditErr);
        }

        return NextResponse.json({ success: true, data: parsed, savedId, disclaimer: DISCLAIMER, modelName: DEFAULT_MODEL, latencyMs });

    } catch (error: any) {
        console.error("[Insight Critique] Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to critique insight" }, { status: 500 });
    }
}

function buildInsightCritiquePrompt(insightStatement: string, kbContext: string, researchStatement?: string): string {
    const researchSection = kbContext.trim()
        ? `\n## COMPLETED RESEARCH CONTEXT\n${kbContext.substring(0, 80000)}\n`
        : `\n## COMPLETED RESEARCH CONTEXT\nNo research documents available. Assess purely on framework quality.\n`;

    const projectContext = researchStatement ? `\n## PROJECT RESEARCH STATEMENT\n${researchStatement}\n` : "";

    return `
Critique the following Insight Statement against the 5 criteria below. Be brutally honest. No sugarcoating.

## THE INSIGHT STATEMENT TO CRITIQUE
"${insightStatement}"

${projectContext}
${researchSection}

## THE 5 CRITERIA (evaluate each one)

### 1. Well-Informed
Is it grounded in multiple data sources: secondary research, lived experience, and subject matter expertise?
- FAIL: Based on assumption or single anecdote
- PARTIAL: References some data but not triangulated across sources
- PASS: Clearly synthesizes multiple evidence streams

### 2. More Than an Observation
Does it explain the HOW or WHY behind a phenomenon, or reframe something already known in a compelling way?
- FAIL: Just states a fact or observation ("young people feel stressed")
- PARTIAL: Hints at a mechanism but doesn't fully articulate it
- PASS: Reveals a non-obvious mechanism, tension, or reframe

### 3. So What?
Does it articulate WHY it matters, name a tension or required shift, and connect to the project's impact objectives?
- FAIL: No clear implication or connection to action
- PARTIAL: States importance but doesn't name the tension or shift needed
- PASS: Makes the stakes clear and names what needs to change

### 4. Sticky
Is it memorable, repeatable, and could it be linked to a metaphor or mental model?
- FAIL: Forgettable, jargon-heavy, or too abstract to repeat
- PARTIAL: Clear but not distinctive enough to stick in someone's mind
- PASS: You'd remember it after hearing it once; could become a team shorthand

### 5. Actionable
Does it inspire novel solutions and open up generative design opportunities?
- FAIL: Doesn't suggest any direction for intervention
- PARTIAL: Points toward a space but too vague to generate specific ideas
- PASS: You can immediately imagine 3+ different interventions it could inspire

## STATEMENT BREAKDOWN
Break the insight statement into 3-5 meaningful phrases. For each, explain WHY it works or what's wrong. Use EXACT substrings.

## RESEARCH ALIGNMENT
- Include a "soWhat" sentence answering "so what?" — the key implication.
- Cite 2-3 specific pieces from the research documents with exact document titles and near-verbatim quotes.

## CRITICAL INSTRUCTIONS
- Be direct. No fluff.
- Use EXACT substrings from the insight statement for the breakdown.
- Cross-reference against the research context.
`;
}

function getMockInsightCritique() {
    return {
        overallVerdict: "NEEDS_WORK",
        overallSummary: "The insight has a kernel of truth but reads more like an observation than a true insight. It needs to explain WHY and articulate what needs to change.",
        criteria: [
            { name: "Well-Informed", verdict: "PARTIAL", explanation: "References a real phenomenon but doesn't show triangulation across data sources.", suggestedImprovement: "Ground it in specific research findings, lived experience quotes, and expert perspectives." },
            { name: "More Than an Observation", verdict: "FAIL", explanation: "This states what happens but not why. It's an observation, not an insight.", suggestedImprovement: "Explain the mechanism — what drives this behavior and why existing approaches fail." },
            { name: "So What?", verdict: "PARTIAL", explanation: "Implies something matters but doesn't name the tension or required shift.", suggestedImprovement: "Explicitly state what needs to change and why the current state is unsustainable." },
            { name: "Sticky", verdict: "PASS", explanation: "The framing is memorable and could become team shorthand.", suggestedImprovement: "" },
            { name: "Actionable", verdict: "PARTIAL", explanation: "Points toward a space but too vague to generate specific design ideas.", suggestedImprovement: "Sharpen so that someone reading it could immediately sketch 3 different interventions." }
        ],
        statementBreakdown: [],
        researchAlignment: { isAligned: false, soWhat: "Without research grounding, this insight is speculation.", explanation: "Mock response — no research documents available.", relevantFindings: [], evidence: [] }
    };
}
