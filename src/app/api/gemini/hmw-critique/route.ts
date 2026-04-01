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

        // 2. Fetch past critiques for this sub-project to track improvement
        const pastCritiques = await prisma.hmwCritique.findMany({
            where: { subProjectId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { hmwStatement: true, overallVerdict: true, critiqueJson: true, createdAt: true },
        });

        let pastContext = "";
        if (pastCritiques.length > 0) {
            pastContext = pastCritiques.map((c, i) => {
                let summary = "";
                let suggestions: string[] = [];
                try {
                    const parsed = JSON.parse(c.critiqueJson);
                    summary = parsed.overallSummary || "";
                    // Extract suggestions from statement breakdown
                    if (parsed.statementBreakdown) {
                        for (const ann of parsed.statementBreakdown) {
                            const lc = ann.lensCritique;
                            if (lc && typeof lc === "object" && lc.suggestion) {
                                suggestions.push(`"${ann.text}" → Try: "${lc.suggestion}"`);
                            }
                        }
                    }
                    // Also extract from lenses
                    if (parsed.lenses) {
                        for (const lens of parsed.lenses) {
                            if (lens.suggestedImprovement) {
                                suggestions.push(`${lens.lensName}: ${lens.suggestedImprovement}`);
                            }
                        }
                    }
                } catch { /* ignore */ }
                let entry = `${i + 1}. "${c.hmwStatement}" → ${c.overallVerdict}`;
                if (summary) entry += `\n   Summary: ${summary}`;
                if (suggestions.length > 0) entry += `\n   Suggestions given: ${suggestions.join("; ")}`;
                return entry;
            }).join("\n\n");
        }

        // 3. Build the critique prompt
        const prompt = buildHMWCritiquePrompt(hmwStatement, kbContext, researchStatement, pastContext);

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
                    description: "Break the HMW statement into 3-5 meaningful phrases and annotate each with a rationale, a lens-based critique, and a research pointer.",
                    items: {
                        type: "object" as const,
                        additionalProperties: false,
                        properties: {
                            text: {
                                type: "string" as const,
                                description: "The exact substring from the HMW statement (use EXACT text, not paraphrased)"
                            },
                            rationale: {
                                type: "string" as const,
                                description: "A positive explanation of what this phrase DOES and why it matters. Write in third person about the phrase itself — e.g. 'It grounds the scope to a specific life stage without being too narrow'. Even for problematic parts, acknowledge what the phrase achieves."
                            },
                            lensCritique: {
                                type: "object" as const,
                                additionalProperties: false,
                                description: "Assessment of this phrase against the single most relevant lens",
                                properties: {
                                    lens: { type: "string" as const, description: "Short lens name, e.g. 'Grounded in a Real Problem', 'Solution-Agnostic', 'Appropriately Broad', 'Focused on Desired Outcome', 'Positively Framed'" },
                                    verdict: { type: "string" as const, description: "PASS, PARTIAL, or FAIL" },
                                    explanation: { type: "string" as const, description: "One sentence with two halves: first half states a specific fact from the research documents (quote a finding, name a statistic, or describe a concrete behaviour), second half says what that means for this phrase. Never use words like 'specific', 'concrete', 'various' as substitutes for actually naming things." },
                                    suggestion: { type: "string" as const, description: "If verdict is PARTIAL or FAIL, provide a short replacement phrase the user could swap in. Write just the phrase itself. CRITICAL: before writing this, verify it would pass ALL 5 lenses — not just this one. Do not suggest something that is too narrow, too broad, solution-embedded, or negatively framed. The user will use your suggestion verbatim, so it must work. Empty string if verdict is PASS." }
                                },
                                required: ["lens", "verdict", "explanation", "suggestion"]
                            },
                            researchPointer: {
                                type: "object" as const,
                                additionalProperties: false,
                                description: "Research connection for this phrase",
                                properties: {
                                    explanation: { type: "string" as const, description: "One plain-language sentence connecting this phrase to a research finding, or noting a gap." },
                                    source: { type: "string" as const, description: "Exact document title from the KB that this finding comes from, or 'General Assessment' if no specific document applies." }
                                },
                                required: ["explanation", "source"]
                            },
                            sentiment: {
                                type: "string" as const,
                                description: "strength (this part works well), issue (this part is problematic), or neutral (acceptable but unremarkable)"
                            }
                        },
                        required: ["text", "rationale", "lensCritique", "researchPointer", "sentiment"]
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
                    content: "You are an expert design thinking facilitator and constructive coach. You assess 'How Might We' statements with precision. You are direct, honest, and helpful — you acknowledge what works and focus improvements on what matters most. When you highlight parts of the HMW statement, you use EXACT substrings from the original text."
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

function buildHMWCritiquePrompt(hmwStatement: string, kbContext: string, researchStatement?: string, pastContext?: string): string {
    const researchSection = kbContext.trim()
        ? `
## COMPLETED RESEARCH CONTEXT
The following documents represent research that has already been completed for this project. Use this to assess whether the HMW is actually grounded in real findings.

${kbContext.substring(0, 80000)}
`
        : `
## COMPLETED RESEARCH CONTEXT
No research documents are available in the knowledge base. Assess the HMW purely on framework quality.
`;

    const projectContextSection = researchStatement
        ? `\n## PROJECT RESEARCH STATEMENT\n${researchStatement}\n`
        : "";

    const pastSection = pastContext
        ? `
## PAST HMW CRITIQUES (for context)
The user has submitted and revised HMW statements before. Here are their recent attempts and the suggestions YOU gave them:
${pastContext}

CRITICAL CONSISTENCY RULES:
1. If the user adopted or closely followed a suggestion you gave in a previous critique, that part MUST receive PASS. You suggested it — you cannot then reject it.
2. If the user's new HMW is clearly improved from the previous version, the overall verdict MUST improve too. More passes, not fewer.
3. Do NOT raise new objections on parts that were fine before. Only critique parts that are genuinely new or unchanged problems.
4. Do NOT contradict your own previous advice. If you said "narrow to X" and they narrowed to X, that phrase passes.
5. Your suggestions must be things you would actually score as PASS. Before writing a suggestion, mentally verify you would not then critique it for a different reason.
`
        : "";

    return `
Assess the following "How Might We" (HMW) statement using the 5-lens framework from Nielsen Norman Group. Be honest and constructive. Acknowledge what works, flag what doesn't, and suggest concrete improvements.

## THE HMW STATEMENT TO ASSESS
"How might we ${hmwStatement}"

${projectContextSection}
${pastSection}
${researchSection}

## THE 5 LENSES (evaluate each one)

### 1. Grounded in a Real Problem or Insight
The HMW must stem from actual research or discovery findings — not be a generic improvement question.

### 2. Solution-Agnostic
The HMW must not suggest or embed a specific solution. It should leave the solution space wide open.

### 3. Appropriately Broad (but not too broad)
The HMW should be wide enough to generate many creative ideas, but still tethered to the problem.

### 4. Focused on the Desired Outcome
The HMW should target the root problem and the user's desired outcome — not a symptom or a business metric.

### 5. Positively Framed
The HMW should use positive action verbs (increase, create, enhance, promote) rather than negative ones (reduce, remove, prevent, stop).

## STATEMENT BREAKDOWN
Break the HMW into 3-5 meaningful phrases. For each phrase, provide:

### "rationale" — why this phrase exists (1-2 sentences)
- Describe what the phrase DOES and why it matters. Write in third person about the phrase itself.
- GOOD: "It grounds the scope to a specific life stage without being too narrow."

### "lensCritique" — structured 5-lens check (object with lens, verdict, explanation)
- Pick the single most relevant lens for this phrase.
- Give a verdict: PASS if it satisfies the lens, PARTIAL if close but could improve, FAIL only if it clearly violates the lens.
- Write one plain-language sentence explaining why. Be SPECIFIC — never say "your research points to X" without naming what X actually is. Name the concrete finding, tension, or barrier from the research documents. Do not use generic placeholders — cite the actual data you found in the documents provided.
- Default to PASS when the phrase reasonably satisfies the lens. Only use PARTIAL when there's a specific, concrete improvement to make. Only use FAIL for clear, unambiguous violations (e.g., embedding a specific solution, using negative framing).

### "researchPointer" — structured research connection (object with explanation and source)
- Connect this phrase to a specific research finding, or note if the research doesn't support it.
- Include the document title as the source. If no specific document applies, use "General Assessment".
- GOOD: { explanation: "Your research shows sleep sacrifice is the main coping trade-off — this captures that tension.", source: "Report on Understanding Opportunities..." }
- GOOD: { explanation: "No specific research finding supports this framing.", source: "General Assessment" }

### General rules:
- Use "strength" for well-crafted parts, "issue" for problematic parts, "neutral" for acceptable but unremarkable parts.
- Use EXACT substrings from the HMW statement — do not paraphrase.

## RESEARCH ALIGNMENT
You have been given ALL documents from the project knowledge base — both Research and Other documents. Use ALL of them.
- Write the "explanation" in 1-2 sentences of plain, simple language.
- The "soWhat" must tell the user exactly what to do or what risk they face.
- For "evidence", pick 2-3 specific quotes. Prefer documents tagged [OTHER] — only fall back to [RESEARCH] if no [OTHER] documents are available. Each quote from a different document. Keep each quote to 1 sentence.
- Use clear, everyday language. Imagine you're explaining to a smart teammate.

## TONE AND SCORING GUIDELINES
- Be direct and honest, but constructive — not harsh. You are coaching, not grading.
- Acknowledge genuine strengths first. If a phrase works well, say so clearly.
- A well-crafted HMW should be able to achieve mostly PASS verdicts. PASS is the default for phrases that reasonably satisfy a lens.
- Use PARTIAL only when there is a specific, concrete improvement that would make the phrase stronger. PARTIAL means "good direction, one tweak needed."
- Reserve FAIL strictly for clear, unambiguous violations — e.g., embedding a specific solution ("tell users..."), using purely negative framing ("reduce..."), or being completely ungrounded. Most real HMW statements should not receive FAIL on most lenses.
- For overallVerdict: use PASS if 4+ lenses pass, NEEDS_WORK if 2-3 have issues, FAIL only if the HMW fundamentally misses the mark.
- Write in plain, simple language throughout.
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
