import { NextResponse } from 'next/server';
import { getOpenAIClient, isOpenAIConfigured, DEFAULT_MODEL, DISCLAIMER } from '@/lib/ai/openai';
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";

/**
 * POST /api/gemini/hmw-critique
 * 
 * Critiques a "How Might We" statement using the NN/g 5-lens framework,
 * grounded in the project's "OTHER" knowledge base documents for research context.
 */
export async function POST(req: Request) {
    try {
        const { hmwStatement, projectId, subProjectId, researchStatement } = await req.json();

        if (!hmwStatement || typeof hmwStatement !== "string" || !hmwStatement.trim()) {
            return NextResponse.json({ success: false, error: "HMW statement is required" }, { status: 400 });
        }

        if (!projectId) {
            return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 });
        }

        if (!subProjectId) {
            return NextResponse.json({ success: false, error: "Sub-project ID is required" }, { status: 400 });
        }

        // 1. Fetch "OTHER" documents from the project's knowledge base
        const projectOtherDocs = await prisma.projectKbDocument.findMany({
            where: {
                projectId: projectId,
                docType: "OTHER",
                status: "APPROVED",
            },
            select: {
                title: true,
                extractedText: true,
                chunks: {
                    orderBy: { chunkIndex: "asc" },
                    select: { content: true },
                },
            },
        });

        // Also fetch RESEARCH docs for additional context
        const projectResearchDocs = await prisma.projectKbDocument.findMany({
            where: {
                projectId: projectId,
                docType: "RESEARCH",
                status: "APPROVED",
            },
            select: {
                title: true,
                extractedText: true,
                chunks: {
                    orderBy: { chunkIndex: "asc" },
                    select: { content: true },
                },
            },
        });

        const allDocs = [...projectOtherDocs, ...projectResearchDocs];

        // Build context from documents
        let kbContext = "";
        if (allDocs.length > 0) {
            kbContext = allDocs
                .map(doc => {
                    const text = doc.extractedText || doc.chunks.map(c => c.content).join("\n\n");
                    if (!text) return "";
                    return `--- DOCUMENT: ${doc.title} ---\n${text}\n--- END ---\n`;
                })
                .filter(Boolean)
                .join("\n");
        }

        // 2. Build the critique prompt
        const prompt = buildHMWCritiquePrompt(hmwStatement, kbContext, researchStatement);

        // 3. Call OpenAI
        if (!isOpenAIConfigured()) {
            const mockData = getMockHMWCritique(hmwStatement);
            let savedId: string | null = null;
            try {
                const saved = await prisma.hmwCritique.create({
                    data: {
                        subProjectId,
                        hmwStatement: hmwStatement.trim(),
                        overallVerdict: mockData.overallVerdict,
                        critiqueJson: JSON.stringify(mockData),
                    },
                });
                savedId = saved.id;
            } catch (dbErr) {
                console.error("[HMW Critique] Mock DB save error:", dbErr);
            }
            return NextResponse.json({
                success: true,
                data: mockData,
                savedId,
                disclaimer: DISCLAIMER,
                modelName: "mock",
            });
        }

        const client = getOpenAIClient();
        const startTime = Date.now();

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
                    description: "A direct, no-fluff 1-2 sentence summary of the overall quality of the HMW statement"
                },
                lenses: {
                    type: "array" as const,
                    items: {
                        type: "object" as const,
                        additionalProperties: false,
                        properties: {
                            lensName: {
                                type: "string" as const,
                                description: "Name of the lens: 'Grounded in a Real Problem', 'Solution-Agnostic', 'Appropriately Broad', 'Focused on Desired Outcome', 'Positively Framed'"
                            },
                            verdict: {
                                type: "string" as const,
                                description: "PASS, PARTIAL, or FAIL"
                            },
                            explanation: {
                                type: "string" as const,
                                description: "Plain-language critique, brutally honest, no sugarcoating. Keep it short and sharp."
                            },
                            highlightedParts: {
                                type: "array" as const,
                                description: "Exact substrings from the HMW statement that are problematic or relevant to this lens critique. Use the EXACT text from the statement.",
                                items: {
                                    type: "object" as const,
                                    additionalProperties: false,
                                    properties: {
                                        text: {
                                            type: "string" as const,
                                            description: "The exact substring from the HMW statement being critiqued"
                                        },
                                        issue: {
                                            type: "string" as const,
                                            description: "Brief explanation of why this part is problematic or noteworthy"
                                        }
                                    },
                                    required: ["text", "issue"]
                                }
                            },
                            suggestedImprovement: {
                                type: "string" as const,
                                description: "A concrete suggested improvement for this specific lens, or empty string if it passes"
                            }
                        },
                        required: ["lensName", "verdict", "explanation", "highlightedParts", "suggestedImprovement"]
                    }
                },
                researchAlignment: {
                    type: "object" as const,
                    additionalProperties: false,
                    properties: {
                        isAligned: {
                            type: "boolean" as const,
                            description: "Whether the HMW is grounded in actual research from the knowledge base"
                        },
                        explanation: {
                            type: "string" as const,
                            description: "Assessment of how well this HMW aligns with the completed research. Be brutally honest."
                        },
                        relevantFindings: {
                            type: "array" as const,
                            description: "Key research findings from the knowledge base that are relevant or contradictory",
                            items: {
                                type: "string" as const
                            }
                        }
                    },
                    required: ["isAligned", "explanation", "relevantFindings"]
                }
            },
            required: ["overallVerdict", "overallSummary", "lenses", "researchAlignment"]
        };

        const response = await client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert design thinking facilitator and ruthless critic. You assess 'How Might We' statements with surgical precision. You never sugarcoat. You are direct, honest, and constructive. When you highlight parts of the HMW statement, you use EXACT substrings from the original text."
                },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "hmw_critique",
                    strict: true,
                    schema: responseSchema
                }
            },
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || "";
        const latencyMs = Date.now() - startTime;

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("[HMW Critique] Failed to parse AI response:", content);
            return NextResponse.json({ success: false, error: "Failed to parse AI response" }, { status: 500 });
        }

        // Persist to database
        let savedId: string | null = null;
        try {
            const saved = await prisma.hmwCritique.create({
                data: {
                    subProjectId,
                    hmwStatement: hmwStatement.trim(),
                    overallVerdict: parsed.overallVerdict,
                    critiqueJson: JSON.stringify(parsed),
                },
            });
            savedId = saved.id;
        } catch (dbErr) {
            console.error("[HMW Critique] DB save error:", dbErr);
        }

        // Log audit
        try {
            await logAudit({
                action: "HMW_CRITIQUE",
                entityType: "SubProject",
                entityId: subProjectId || projectId,
                meta: {
                    modelName: DEFAULT_MODEL,
                    latencyMs,
                    hmwStatementLength: hmwStatement.length,
                    kbDocsUsed: allDocs.length,
                    overallVerdict: parsed.overallVerdict,
                },
            });
        } catch (auditErr) {
            console.error("[HMW Critique] Audit log error:", auditErr);
        }

        return NextResponse.json({
            success: true,
            data: parsed,
            savedId,
            disclaimer: DISCLAIMER,
            modelName: DEFAULT_MODEL,
            latencyMs,
        });

    } catch (error: any) {
        console.error("[HMW Critique] Error:", error);
        return NextResponse.json({ success: false, error: error.message || "Failed to critique HMW" }, { status: 500 });
    }
}

function buildHMWCritiquePrompt(hmwStatement: string, kbContext: string, researchStatement?: string): string {
    const researchSection = kbContext.trim()
        ? `
## COMPLETED RESEARCH CONTEXT
The following documents represent research that has already been completed for this project. Use this to assess whether the HMW is actually grounded in real findings, and whether it even makes sense given what the research has uncovered.

${kbContext.substring(0, 80000)}
`
        : `
## COMPLETED RESEARCH CONTEXT
No research documents are available in the knowledge base. Assess the HMW purely on framework quality but note that without research grounding, it is impossible to verify whether this HMW stems from real findings.
`;

    const projectContext = researchStatement
        ? `\n## PROJECT RESEARCH STATEMENT\n${researchStatement}\n`
        : "";

    return `
Critique the following "How Might We" (HMW) statement using the 5-lens framework from Nielsen Norman Group. Be brutally honest. Do not sugarcoat. Do not pad with praise unless genuinely warranted.

## THE HMW STATEMENT TO CRITIQUE
"How might we ${hmwStatement}"

${projectContext}
${researchSection}

## THE 5 LENSES (evaluate each one)

### 1. Grounded in a Real Problem or Insight
The HMW must stem from actual research or discovery findings — not be a generic improvement question.
- ❌ wrong: "How might we improve the user experience?" (not grounded)
- ✅ right: "How might we increase awareness of the full product offerings?" (tied to a specific finding)

### 2. Solution-Agnostic
The HMW must not suggest or embed a specific solution. It should leave the solution space wide open.
- ❌ wrong: "How might we *tell* users which form to complete?" (implies a communication solution)
- ✅ right: "How might we make users feel confident they are filing taxes correctly?" (open to many solutions)

### 3. Appropriately Broad (but not too broad)
The HMW should be wide enough to generate many creative ideas, but still tethered to the problem.
- ❌ wrong: Too narrow: "How might we add a spell-checker to the submission form?"
- ❌ wrong: Too broad: "How might we redesign the submission-drafting process?"
- ✅ right: "How might we support users to efficiently draft submissions they're happy with?"

### 4. Focused on the Desired Outcome
The HMW should target the root problem and the user's desired outcome — not a symptom or a business metric.
- ❌ wrong: "How might we stop users from calling us?" (addresses a symptom, not the root cause)
- ✅ right: "How might we make users feel confident they have all the information they need?" (targets root outcome)

### 5. Positively Framed
The HMW should use positive action verbs (increase, create, enhance, promote) rather than negative ones (reduce, remove, prevent, stop).
- ❌ wrong: "How might we make the return process *less difficult*?"
- ✅ right: "How might we make the return process *quick and intuitive*?"

## CRITICAL INSTRUCTIONS
- For each lens, identify EXACT substrings from the HMW statement that are problematic. Use the EXACT text — do not paraphrase.
- Cross-reference the HMW against the research context. Does this HMW actually relate to real findings? Or is it made up / too generic?
- If the HMW doesn't make sense given the research, say so bluntly.
- Be direct. No fluff. No "Great start!" unless it genuinely is one.
`;
}

function getMockHMWCritique(hmwStatement: string) {
    return {
        overallVerdict: "NEEDS_WORK",
        overallSummary: "The HMW is directionally sound but too broad and embeds implicit solutions. It needs to be tighter and more grounded in specific research findings.",
        lenses: [
            {
                lensName: "Grounded in a Real Problem",
                verdict: "PARTIAL",
                explanation: "The statement touches on a real area but lacks specificity. Without clear grounding in specific research findings, it reads as a generic aspiration rather than a targeted problem statement.",
                highlightedParts: [],
                suggestedImprovement: "Anchor the HMW to a specific research finding or user insight."
            },
            {
                lensName: "Solution-Agnostic",
                verdict: "PASS",
                explanation: "The statement doesn't embed a specific solution. The solution space remains open.",
                highlightedParts: [],
                suggestedImprovement: ""
            },
            {
                lensName: "Appropriately Broad",
                verdict: "FAIL",
                explanation: "This is too broad. It tries to address multiple issues at once, making it hard to generate focused ideas.",
                highlightedParts: [],
                suggestedImprovement: "Break this into multiple, focused HMW statements."
            },
            {
                lensName: "Focused on Desired Outcome",
                verdict: "PARTIAL",
                explanation: "The desired outcome is implied but not stated clearly. Focus on what the user should feel or achieve.",
                highlightedParts: [],
                suggestedImprovement: "Reframe to emphasize the user's desired end state."
            },
            {
                lensName: "Positively Framed",
                verdict: "PASS",
                explanation: "The framing is positive. Good use of constructive language.",
                highlightedParts: [],
                suggestedImprovement: ""
            }
        ],
        researchAlignment: {
            isAligned: false,
            explanation: "No research documents were available to verify alignment. This is a mock response.",
            relevantFindings: []
        }
    };
}
// Created by Swapnil Bapat © 2026
