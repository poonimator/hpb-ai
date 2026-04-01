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

        // Build context from documents, tagging each with its type
        const buildDocContext = (docs: typeof projectOtherDocs, docType: string) =>
            docs.map(doc => {
                const text = doc.extractedText || doc.chunks.map(c => c.content).join("\n\n");
                if (!text) return "";
                return `--- DOCUMENT [${docType}]: ${doc.title} ---\n${text}\n--- END ---\n`;
            }).filter(Boolean);

        let kbContext = "";
        const otherContext = buildDocContext(projectOtherDocs, "OTHER");
        const researchContext = buildDocContext(projectResearchDocs, "RESEARCH");
        const allContextParts = [...otherContext, ...researchContext];
        if (allContextParts.length > 0) {
            kbContext = allContextParts.join("\n");
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
                            description: "Whether the HMW is grounded in actual findings from the knowledge base documents"
                        },
                        explanation: {
                            type: "string" as const,
                            description: "A concise 1-2 sentence plain-language assessment of research alignment. No jargon. State clearly what the research says and whether the HMW reflects it. E.g., 'Your research shows sleep sacrifice is the main coping mechanism, but this HMW doesn't mention it — so ideas won't target the real behaviour.'"
                        },
                        soWhat: {
                            type: "string" as const,
                            description: "One plain-language sentence telling the user exactly what to do next or what risk they face. Must answer 'so what does this mean for me?' — not just restate the problem. E.g., 'Rewrite the HMW to target the specific coping trade-off (sleep vs activities) so your ideas address the real tension.' Use simple, direct language — no academic tone."
                        },
                        relevantFindings: {
                            type: "array" as const,
                            description: "2-3 key findings from the knowledge base, written as short plain-language bullet points",
                            items: {
                                type: "string" as const
                            }
                        },
                        evidence: {
                            type: "array" as const,
                            description: "2-3 specific evidence pieces from the knowledge base documents (both Research and Other docs). Keep quotes short. The 'connection' must clearly state what this means for the HMW — not just describe the finding.",
                            items: {
                                type: "object" as const,
                                additionalProperties: false,
                                properties: {
                                    source: {
                                        type: "string" as const,
                                        description: "Exact document title from the knowledge base"
                                    },
                                    quote: {
                                        type: "string" as const,
                                        description: "A short near-verbatim quote (1 sentence max). Pick the most impactful line, not a long passage."
                                    },
                                    connection: {
                                        type: "string" as const,
                                        description: "One sentence in plain language explaining what this means for the HMW. Must be actionable — e.g., 'This means your HMW should name sleep sacrifice as the specific pressure, not just say cope with pressure.'"
                                    }
                                },
                                required: ["source", "quote", "connection"]
                            }
                        }
                    },
                    required: ["isAligned", "explanation", "soWhat", "relevantFindings", "evidence"]
                },
                statementBreakdown: {
                    type: "array" as const,
                    description: "Break the HMW statement into 3-5 meaningful phrases and annotate each. Each annotation has TWO parts: a short actionable critique ('note') and a positive rationale ('rationale') explaining why this phrase exists and what design value it contributes.",
                    items: {
                        type: "object" as const,
                        additionalProperties: false,
                        properties: {
                            text: {
                                type: "string" as const,
                                description: "The exact substring from the HMW statement (use EXACT text, not paraphrased)"
                            },
                            note: {
                                type: "string" as const,
                                description: "A short, punchy, actionable critique (1 sentence max). For issues: state the specific problem and what to do about it — no vague observations. For strengths: state why it works in one sharp line. Must never make the reader go 'so what?'."
                            },
                            rationale: {
                                type: "string" as const,
                                description: "A positive explanation of what this phrase DOES and why it matters. Write in third person about the phrase itself — e.g. 'It grounds the scope to a specific life stage without being too narrow' or 'It shifts support from fixing to steadying.' NEVER start with 'You're trying to' or 'The author is trying to' — instead describe the effect of the phrasing itself. Even for problematic parts, acknowledge what the phrase achieves."
                            },
                            sentiment: {
                                type: "string" as const,
                                description: "strength (this part works well), issue (this part is problematic), or neutral (acceptable but unremarkable)"
                            }
                        },
                        required: ["text", "note", "rationale", "sentiment"]
                    }
                }
            },
            required: ["overallVerdict", "overallSummary", "lenses", "researchAlignment", "statementBreakdown"]
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
                    kbDocsUsed: allContextParts.length,
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

## STATEMENT BREAKDOWN
Break the HMW into 3-5 meaningful phrases and annotate each one with TWO separate fields:

### "note" — the actionable critique (1 sentence max)
- For issues: name the specific problem and suggest what to change. Never leave the reader thinking "so what?".
- For strengths: say exactly why it works in one sharp line.
- For neutral parts: note what's acceptable but what could be sharper.
- BAD note: "This is filler. It doesn't point to a moment, context, or friction, so it won't drive sharp concepts or prioritisation." (too long, not actionable)
- GOOD note: "Too vague — specify a moment or context (e.g. 'during exam weeks') to drive sharper ideation."

### "rationale" — why this phrase exists (1-2 sentences)
- Describe what the phrase DOES and why it matters. Write about the phrase itself in third person.
- NEVER use "You're trying to…" or "The author is trying to…" — instead state the effect directly.
- BAD rationale: "You're trying to narrow the target user to a specific age group." 
- GOOD rationale: "It grounds the scope to a specific life stage without being too narrow."
- More examples:
  - "It doesn't demand a deep talk: 'get your bearings' can be small, private, and quick, which makes it doable in the moment."
  - "It meets the common failure point we saw: when they can't tell what is next, stress can turn inward fast and become self-blame."
  - "It fits how reaching out actually happens: it allows a small start with no pressure to share more."
  - "It supports prevention: small resets and small steps during the day reduce the build-up that later drives heavy switching off."

### General rules:
- Use "strength" for parts that are well-crafted, "issue" for problematic parts, "neutral" for acceptable but unremarkable parts.
- Use EXACT substrings from the HMW statement — do not paraphrase.

## RESEARCH ALIGNMENT
You have been given ALL documents from the project knowledge base — both Research documents and Other documents. Use ALL of them.
- Write the "explanation" in 1-2 sentences of plain, simple language. State clearly what the research says and whether the HMW reflects it. No jargon. No academic tone.
- The "soWhat" must tell the user exactly what to do about it or what risk they face. It should answer "so what does this mean for my HMW?" — not just restate the problem.
  - BAD soWhat: "This HMW ignores the core finding that youth avoid help because of self-blame, not lack of access."
  - GOOD soWhat: "Rewrite the outcome to target self-blame (not access) — otherwise your ideas will solve the wrong barrier."
- For "evidence", pick 2-3 specific quotes. Prefer documents tagged [OTHER] — only fall back to [RESEARCH] documents if no [OTHER] documents are available. Each quote must come from a different document. Keep each quote to 1 sentence. The "connection" must say what this means for the HMW specifically — make it actionable. Never return empty quotes or "N/A" sources — if you can find relevant evidence in any document, cite it.
- Use clear, everyday language throughout. Imagine you're explaining to a smart teammate, not writing an academic paper.

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
            soWhat: "Without research grounding, this HMW is an educated guess at best.",
            relevantFindings: [],
            evidence: []
        },
        statementBreakdown: []
    };
}
// Created by Swapnil Bapat © 2026
