import "server-only";

import OpenAI from "openai";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";

// Load system guardrails
const guardrailsPath = path.join(process.cwd(), "src/lib/ai/prompts/system_guardrails.md");
export let SYSTEM_GUARDRAILS = "";
try {
    SYSTEM_GUARDRAILS = fs.readFileSync(guardrailsPath, "utf-8");
} catch {
    console.warn("[OpenAI] Could not load system_guardrails.md, using fallback");
    SYSTEM_GUARDRAILS = `You are an AI for HPB Singapore's interview training tool. 
All output is synthetic rehearsal. Never provide medical advice. Singapore context only.
Outputs are training only and cannot inform synthesis.`;
}

// Constants
export const DEFAULT_MODEL = "gpt-5.2";
export const DISCLAIMER = "Synthetic rehearsal output is training only and cannot inform synthesis.";

/**
 * Get the OpenAI client (server-side only)
 */
export function getOpenAIClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error(
            "[OpenAI] OPENAI_API_KEY environment variable is not set. " +
            "Please add it to your .env.local file."
        );
    }

    return new OpenAI({ apiKey });
}

/**
 * Check if OpenAI is configured
 */
export function isOpenAIConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
}

/**
 * Generate a hash for audit logging
 */
export function hashContent(content: string): string {
    return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

/**
 * Generate persona response using OpenAI
 */
export interface GeneratePersonaReplyParams {
    prompt: string;
    modelName?: string;
    imageBase64?: string; // Base64 encoded image for multimodal input
}

export interface GeneratePersonaReplyResult {
    content: string;
    disclaimer: string;
    modelName: string;
    latencyMs: number;
    promptHash: string;
    responseHash: string;
    success: boolean;
    error?: string;
}

export async function generatePersonaReply(
    params: GeneratePersonaReplyParams
): Promise<GeneratePersonaReplyResult> {
    const { prompt, modelName = DEFAULT_MODEL, imageBase64 } = params;
    const startTime = Date.now();
    const promptHash = hashContent(prompt);

    try {
        if (!isOpenAIConfigured()) {
            // Return mock response if not configured
            return {
                content: getMockPersonaResponse(),
                disclaimer: DISCLAIMER,
                modelName: "mock",
                latencyMs: Date.now() - startTime,
                promptHash,
                responseHash: hashContent("mock"),
                success: true,
            };
        }

        const client = getOpenAIClient();

        // Build user content - text only or multimodal (text + image)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let userContent: any = prompt;
        if (imageBase64) {
            userContent = [
                { type: "text", text: prompt },
                {
                    type: "image_url",
                    image_url: {
                        url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/png;base64,${imageBase64}`,
                        detail: "high"
                    }
                }
            ];
        }

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: SYSTEM_GUARDRAILS },
                { role: "user", content: userContent }
            ],
        });

        const content = response.choices[0]?.message?.content || "";
        const latencyMs = Date.now() - startTime;

        return {
            content: content.trim(),
            disclaimer: DISCLAIMER,
            modelName,
            latencyMs,
            promptHash,
            responseHash: hashContent(content),
            success: true,
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        console.error("[OpenAI] generatePersonaReply error:", error);

        return {
            content: getFallbackResponse(),
            disclaimer: DISCLAIMER,
            modelName,
            latencyMs,
            promptHash,
            responseHash: hashContent("error"),
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Generate coach review using OpenAI
 */
export interface GenerateCoachReviewParams {
    prompt: string;
    modelName?: string;
}

export interface GenerateCoachReviewResult {
    content: string;
    disclaimer: string;
    modelName: string;
    latencyMs: number;
    promptHash: string;
    responseHash: string;
    success: boolean;
    error?: string;
}

export async function generateCoachReview(
    params: GenerateCoachReviewParams
): Promise<GenerateCoachReviewResult> {
    const { prompt, modelName = DEFAULT_MODEL } = params;
    const startTime = Date.now();
    const promptHash = hashContent(prompt);

    try {
        if (!isOpenAIConfigured()) {
            // Return mock response if not configured
            return {
                content: getMockCoachReview(),
                disclaimer: DISCLAIMER,
                modelName: "mock",
                latencyMs: Date.now() - startTime,
                promptHash,
                responseHash: hashContent("mock"),
                success: true,
            };
        }

        const client = getOpenAIClient();

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: SYSTEM_GUARDRAILS },
                { role: "user", content: prompt }
            ],
        });

        const content = response.choices[0]?.message?.content || "";
        const latencyMs = Date.now() - startTime;

        return {
            content: content.trim(),
            disclaimer: DISCLAIMER,
            modelName,
            latencyMs,
            promptHash,
            responseHash: hashContent(content),
            success: true,
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        console.error("[OpenAI] generateCoachReview error:", error);

        return {
            content: getMockCoachReview(),
            disclaimer: DISCLAIMER,
            modelName,
            latencyMs,
            promptHash,
            responseHash: hashContent("error"),
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Fallback response for errors
 */
function getFallbackResponse(): string {
    return "Hmm, I'm not quite sure how to answer that. Can you try rephrasing your question?";
}

/**
 * Mock persona response (when API key not configured)
 */
function getMockPersonaResponse(): string {
    const responses = [
        "Hmm, that's an interesting question leh. Let me think about it...\n\nActually, I would say it depends on the situation lor. Like sometimes I feel one way, but other times different.",
        "Wah, never really think about it before sia. But now that you ask... I guess for me it's like that because of how I was brought up?",
        "Eh actually hor, I think many of my friends also feel the same way. It's quite common among people my age one.",
        "To be honest ah, I'm not so sure about this topic. Can you explain more about what you mean?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Mock coach review (when API key not configured)
 */
function getMockCoachReview(): string {
    return JSON.stringify({
        overallScore: 7,
        summary:
            "Good interview technique overall with room for improvement in probing depth.",
        highlights: [
            {
                turn: 1,
                observation: "Good open-ended opening question that allowed participant to share freely",
                quote: "Tell me about...",
            },
        ],
        leadingMoments: [
            {
                turn: 3,
                issue: "Question contained an assumption about the participant's feelings",
                quote: "You must feel frustrated when...",
                suggestion: "Try: 'How do you feel when...'",
            },
        ],
        missedProbes: [
            {
                turn: 2,
                opportunity: "Participant mentioned something interesting that wasn't followed up",
                suggestion: "You could ask: 'You mentioned X earlier - can you tell me more about that?'",
            },
        ],
        betterQuestions: [
            {
                original: "Don't you think that's a problem?",
                improved: "How do you see this situation?",
                rationale: "Removes the leading nature and judgment from the question",
            },
        ],
    });
}

/**
 * Generate a reproducibility seed
 */
export function generateSeed(): string {
    return `seed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate coach chat response using OpenAI
 * Uses gpt-5-mini for faster responses in interactive coaching
 */
export interface GenerateCoachChatParams {
    systemPrompt: string;
    userMessage: string;
    modelName?: string;
}

export interface GenerateCoachChatResult {
    content: string;
    disclaimer: string;
    modelName: string;
    latencyMs: number;
    success: boolean;
    error?: string;
}

export async function generateCoachChat(
    params: GenerateCoachChatParams
): Promise<GenerateCoachChatResult> {
    const { systemPrompt, userMessage, modelName = DEFAULT_MODEL } = params;
    const startTime = Date.now();

    try {
        if (!isOpenAIConfigured()) {
            // Return mock response if not configured
            return {
                content: getMockCoachChatResponse(),
                disclaimer: DISCLAIMER,
                modelName: "mock",
                latencyMs: Date.now() - startTime,
                success: true,
            };
        }

        const client = getOpenAIClient();

        console.log("[OpenAI] generateCoachChat - calling model:", modelName, "prompt length:", systemPrompt.length);

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: SYSTEM_GUARDRAILS + "\n\n" + systemPrompt },
                { role: "user", content: userMessage }
            ],
            max_completion_tokens: 600,
            temperature: 0.3, // Lower temperature for more consistent JSON output
        });

        const content = response.choices[0]?.message?.content || "";
        const latencyMs = Date.now() - startTime;

        console.log("[OpenAI] generateCoachChat - response length:", content.length, "latency:", latencyMs);

        if (!content || content.length === 0) {
            console.error("[OpenAI] generateCoachChat - received empty response from API");
            return {
                content: "",
                disclaimer: DISCLAIMER,
                modelName,
                latencyMs,
                success: false,
                error: "Empty response from AI",
            };
        }

        return {
            content: content.trim(),
            disclaimer: DISCLAIMER,
            modelName,
            latencyMs,
            success: true,
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        console.error("[OpenAI] generateCoachChat error:", error);

        return {
            content: "",
            disclaimer: DISCLAIMER,
            modelName,
            latencyMs,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Mock coach chat response
 */
function getMockCoachChatResponse(): string {
    const responses = [
        "That's a great reflection! What do you think drew you to phrase it that way initially?",
        "I understand your curiosity. Consider this - how might the participant have felt when they heard that question?",
        "Interesting question! Rather than me giving you the answer, what alternatives have you thought about?",
        "You're on the right track. What do you think would have happened if you had paused and let them continue?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Question Validation Types
 */
export interface QuestionValidationIssue {
    type: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    explanation: string;
    suggestedRewrite: string;
}

export interface QuestionValidationResult {
    questionIndex: number;
    questionLabel: string;
    originalText: string;
    issues: QuestionValidationIssue[];
    overallQuality: "GOOD" | "NEEDS_IMPROVEMENT" | "PROBLEMATIC";
}

export interface ValidationSummary {
    totalQuestions: number;
    goodCount: number;
    needsImprovementCount: number;
    problematicCount: number;
}

export interface ValidateQuestionsResponse {
    results: QuestionValidationResult[];
    summary: ValidationSummary;
}

export interface GenerateQuestionValidationParams {
    prompt: string;
    modelName?: string;
}

export interface GenerateQuestionValidationResult {
    data: ValidateQuestionsResponse;
    modelName: string;
    latencyMs: number;
    promptHash: string;
    responseHash: string;
    success: boolean;
    error?: string;
}

/**
 * Generate question validation using OpenAI
 */
export async function generateQuestionValidation(
    params: GenerateQuestionValidationParams
): Promise<GenerateQuestionValidationResult> {
    const { prompt, modelName = DEFAULT_MODEL } = params;
    const startTime = Date.now();
    const promptHash = hashContent(prompt);

    // JSON schema for structured output - OpenAI strict mode requires additionalProperties: false on all objects
    const responseSchema = {
        type: "object" as const,
        additionalProperties: false,
        properties: {
            results: {
                type: "array" as const,
                items: {
                    type: "object" as const,
                    additionalProperties: false,
                    properties: {
                        questionIndex: {
                            type: "integer" as const,
                            description: "Index of the question in the input array"
                        },
                        questionLabel: {
                            type: "string" as const,
                            description: "The label of the question (e.g., '1', '1A', '2')"
                        },
                        originalText: {
                            type: "string" as const,
                            description: "The original question text"
                        },
                        issues: {
                            type: "array" as const,
                            items: {
                                type: "object" as const,
                                additionalProperties: false,
                                properties: {
                                    type: {
                                        type: "string" as const,
                                        description: "Type of issue: LEADING, DOUBLE_BARRELLED, UNCLEAR, JUDGEMENTAL, CLOSED_ENDED, TOO_LONG"
                                    },
                                    severity: {
                                        type: "string" as const,
                                        description: "Severity: HIGH, MEDIUM, LOW"
                                    },
                                    explanation: {
                                        type: "string" as const,
                                        description: "Brief explanation of the issue"
                                    },
                                    suggestedRewrite: {
                                        type: "string" as const,
                                        description: "Coaching reflection - guiding prompts or considerations to help the researcher think about how to improve, NOT a direct rewrite"
                                    }
                                },
                                required: ["type", "severity", "explanation", "suggestedRewrite"]
                            }
                        },
                        overallQuality: {
                            type: "string" as const,
                            description: "GOOD, NEEDS_IMPROVEMENT, or PROBLEMATIC"
                        }
                    },
                    required: ["questionIndex", "questionLabel", "originalText", "issues", "overallQuality"]
                }
            },
            summary: {
                type: "object" as const,
                additionalProperties: false,
                properties: {
                    totalQuestions: { type: "integer" as const },
                    goodCount: { type: "integer" as const },
                    needsImprovementCount: { type: "integer" as const },
                    problematicCount: { type: "integer" as const }
                },
                required: ["totalQuestions", "goodCount", "needsImprovementCount", "problematicCount"]
            }
        },
        required: ["results", "summary"]
    };

    try {
        if (!isOpenAIConfigured()) {
            throw new Error("OpenAI API key not configured");
        }

        const client = getOpenAIClient();

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: SYSTEM_GUARDRAILS },
                { role: "user", content: prompt }
            ],
            response_format: {
                type: "json_schema",
                json_schema: {
                    name: "question_validation",
                    strict: true,
                    schema: responseSchema
                }
            },
            temperature: 0.2,
        });

        const content = response.choices[0]?.message?.content || "";
        const latencyMs = Date.now() - startTime;

        let parsed: ValidateQuestionsResponse;
        try {
            parsed = JSON.parse(content);
        } catch (e) {
            console.error("Failed to parse validation JSON:", content);
            throw new Error("Failed to parse AI response");
        }

        return {
            data: parsed,
            modelName,
            latencyMs,
            promptHash,
            responseHash: hashContent(content),
            success: true,
        };
    } catch (error) {
        const latencyMs = Date.now() - startTime;
        console.error("[OpenAI] generateQuestionValidation error:", error);

        return {
            data: { results: [], summary: { totalQuestions: 0, goodCount: 0, needsImprovementCount: 0, problematicCount: 0 } },
            modelName,
            latencyMs,
            promptHash,
            responseHash: hashContent("error"),
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Analyze question quality using OpenAI
 * This function checks individual questions for quality issues like leading questions, bias, etc.
 */
export interface AnalyzeQuestionQualityParams {
    questionText: string;
    intent?: string;
}

export interface QuestionWarning {
    type: string;
    severity: "HIGH" | "MEDIUM" | "LOW";
    message: string;
    suggestion?: string;
}

export interface AnalyzeQuestionQualityResult {
    isValid: boolean;
    warnings: QuestionWarning[];
    suggestedRewrite?: string;
}

export async function analyzeQuestionQuality(
    params: AnalyzeQuestionQualityParams
): Promise<AnalyzeQuestionQualityResult> {
    const { questionText, intent } = params;

    try {
        if (!isOpenAIConfigured()) {
            // Return mock analysis if not configured
            return getMockQuestionAnalysis(questionText);
        }

        const client = getOpenAIClient();

        const analysisPrompt = `Analyze this interview question for quality issues.

Question: "${questionText}"
${intent ? `Intended purpose: ${intent}` : ""}

Check for these issues:
1. LEADING - Does the question suggest a particular answer?
2. DOUBLE_BARRELLED - Does the question ask about multiple things?
3. CLOSED_ENDED - Can this only be answered with yes/no?
4. JUDGEMENTAL - Does the question contain judgment or bias?
5. UNCLEAR - Is the question confusing or ambiguous?
6. TOO_LONG - Is the question overly complex?

Return a JSON object with:
{
  "isValid": boolean (true if no major issues),
  "warnings": [
    {
      "type": "ISSUE_TYPE",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "suggestedRewrite": "Improved version of the question (if needed)"
}

Return ONLY the JSON object.`;

        const response = await client.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                { role: "system", content: "You are an expert in qualitative research interview methodology. Analyze questions for common interview pitfalls." },
                { role: "user", content: analysisPrompt }
            ],
            temperature: 0.2,
        });

        const content = response.choices[0]?.message?.content || "";

        // Clean up the response (remove markdown code blocks if present)
        let jsonStr = content.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith("```")) {
            jsonStr = jsonStr.slice(0, -3);
        }

        const parsed = JSON.parse(jsonStr.trim());
        return parsed;
    } catch (error) {
        console.error("[OpenAI] analyzeQuestionQuality error:", error);
        // Return safe default on error
        return {
            isValid: true,
            warnings: [],
        };
    }
}

/**
 * Mock question analysis for when API is not configured
 */
function getMockQuestionAnalysis(questionText: string): AnalyzeQuestionQualityResult {
    const warnings: QuestionWarning[] = [];

    // Simple heuristic checks
    if (questionText.toLowerCase().includes("don't you think")) {
        warnings.push({
            type: "LEADING",
            severity: "HIGH",
            message: "This question suggests a particular answer",
            suggestion: "Rephrase to be more neutral"
        });
    }

    if (questionText.includes(" and ") && questionText.includes("?")) {
        warnings.push({
            type: "DOUBLE_BARRELLED",
            severity: "MEDIUM",
            message: "This question may be asking about multiple things",
            suggestion: "Consider splitting into separate questions"
        });
    }

    if (questionText.toLowerCase().startsWith("do you") ||
        questionText.toLowerCase().startsWith("is it") ||
        questionText.toLowerCase().startsWith("are you")) {
        warnings.push({
            type: "CLOSED_ENDED",
            severity: "LOW",
            message: "This question can be answered with yes/no",
            suggestion: "Consider rephrasing to encourage elaboration"
        });
    }

    return {
        isValid: warnings.filter(w => w.severity === "HIGH").length === 0,
        warnings,
    };
}

/**
 * Mapping: Suggest Themes
 */
export interface SuggestThemesParams {
    transcripts: { name: string; content: string }[];
    modelName?: string;
}

export interface SuggestThemesResult {
    themes: string[];
    success: boolean;
    error?: string;
}

export async function suggestThemes(params: SuggestThemesParams): Promise<SuggestThemesResult> {
    const { transcripts, modelName = DEFAULT_MODEL } = params;

    try {
        if (!isOpenAIConfigured()) {
            return {
                themes: ["Mock Theme 1", "Mock Theme 2", "Mock Theme 3", "Mock Theme 4"],
                success: true
            };
        }

        const client = getOpenAIClient();

        // Prepare context (truncate if too long, simple approach for now)
        const context = transcripts.map(t => `TRANSCRIPT: ${t.name}\n${t.content.slice(0, 5000)}...`).join("\n\n");

        const prompt = `Analyze the following interview transcripts and identify 8-12 key emerging qualitative themes suitable for an affinity map.
        
        CRITICAL INSTRUCTION: Themes MUST be concise, punchy, and short (2-5 words max). Do NOT use full sentences or long descriptions.
        
        Use the following standard themes as a reference. If the content fits these themes, use them exactly. If new themes emerge, name them in the same concise style:
        1. Pressures/Stressors
        2. Motivations to Take Action
        3. Barriers to Action
        4. Mental Model
        5. Life Prioritisation
        6. Support Ecosystem
        7. Digital Ecosystem
        8. Routines and Behaviours
        9. Protective Factors

        TRANSCRIPTS TO ANALYZE:
        ${context}
        
        Return ONLY a JSON object with:
        {
          "themes": ["Theme 1", "Theme 2", ...]
        }
        `;

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: "You are an expert qualitative researcher skilled in synthesizing insights into concise, high-level themes. You hate wordy titles." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);

        return {
            themes: parsed.themes || [],
            success: true
        };
    } catch (error) {
        console.error("[OpenAI] suggestThemes error:", error);
        return { themes: [], success: false, error: String(error) };
    }
}

/**
 * Mapping: Process Clusters
 */
export interface ProcessMappingParams {
    transcripts: { id: string; name: string; content: string }[];
    themes: string[];
    modelName?: string;
}

export interface ClusteredQuote {
    quote: string;
    theme: string;
    transcriptId: string;
    context?: string;
}

export interface ProcessMappingResult {
    clusters: ClusteredQuote[];
    success: boolean;
    error?: string;
}

export async function processMapping(params: ProcessMappingParams): Promise<ProcessMappingResult> {
    const { transcripts, themes, modelName = DEFAULT_MODEL } = params;

    try {
        if (!isOpenAIConfigured()) {
            return {
                clusters: [
                    { quote: JSON.stringify(["Mock quote 1", "Mock quote 1 expansion"]), theme: themes[0], transcriptId: transcripts[0]?.id || "unknown" },
                    { quote: JSON.stringify(["Mock quote 2"]), theme: themes[1], transcriptId: transcripts[0]?.id || "unknown" }
                ],
                success: true
            };
        }

        const client = getOpenAIClient();

        // Process each transcript against themes
        const allClusters: ClusteredQuote[] = [];

        for (const t of transcripts) {
            const prompt = `Extract insightful observations from the following transcript that map to the provided themes.
            
            THEMES:
            ${JSON.stringify(themes)}

            TRANSCRIPT: ${t.name}
            ${t.content.slice(0, 10000)}

            CRITICAL INSTRUCTION:
            - Detection for context is KEY.
            - If the participant makes multiple related points or verbatims (quotes) about the same specific topic/context in a sequence, GROUP THEM into a single insight.
            - Do NOT split related sentences into separate insights. Combine them so we can see the full train of thought.
            - Each insight must have at least one quote.

            Return a JSON object with:
            {
              "insights": [
                { 
                  "quotes": ["Verbatim 1", "Verbatim 2 (if related)"], 
                  "theme": "Theme Name", 
                  "context": "Brief context explanation" 
                }
              ]
            }

            Only extract meaningful implementation-relevant insights.
            `;

            const response = await client.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: "You are an expert qualitative researcher coding interview transcripts. You excel at grouping related verbatims." },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
            });

            const content = response.choices[0]?.message?.content || "{}";
            const parsed = JSON.parse(content);

            if (parsed.insights && Array.isArray(parsed.insights)) {
                allClusters.push(...parsed.insights.map((q: any) => ({
                    // Store quotes array as stringified JSON to fit into the 'quote' string field in DB
                    quote: JSON.stringify(Array.isArray(q.quotes) ? q.quotes : [q.quotes]),
                    theme: q.theme,
                    transcriptId: t.id,
                    context: q.context
                })));
            } else if (parsed.quotes && Array.isArray(parsed.quotes)) {
                // Fallback for backward compatibility or hallucination
                allClusters.push(...parsed.quotes.map((q: any) => ({
                    quote: JSON.stringify([q.text || q.quote]),
                    theme: q.theme,
                    transcriptId: t.id,
                    context: q.context
                })));
            }
        }

        return {
            clusters: allClusters,
            success: true
        };
    } catch (error) {
        console.error("[OpenAI] processMapping error:", error);
        return { clusters: [], success: false, error: String(error) };
    }
}

/**
 * Generate Archetype Summary (Focus Group)
 */
export interface GenerateArchetypeSummaryParams {
    archetypeName: string;
    conversationTranscript: string;
    modelName?: string;
}

export interface GenerateArchetypeSummaryResult {
    summary: string;
    success: boolean;
    error?: string;
}

export async function generateArchetypeSummary(params: GenerateArchetypeSummaryParams): Promise<GenerateArchetypeSummaryResult> {
    const { archetypeName, conversationTranscript, modelName = DEFAULT_MODEL } = params;

    try {
        if (!isOpenAIConfigured()) {
            return {
                summary: JSON.stringify({
                    stance: "Cautiously open but skeptical",
                    keyPoints: ["Expressed concern about trust", "Wanted practical next steps", "Pushed back on generic advice"],
                    quote: "This is a mock quote from the focus group."
                }),
                success: true
            };
        }

        const client = getOpenAIClient();
        const prompt = `You are an expert qualitative researcher summarizing a focus group transcript.

Analyze the transcript and summarize what "${archetypeName}" contributed. Return ONLY valid JSON:

{
  "stance": "A short phrase (3-6 words) capturing their overall position or attitude during the discussion (e.g., 'Cautiously open but skeptical', 'Pragmatic and solution-focused', 'Emotionally guarded')",
  "keyPoints": ["3 concise bullet points (max 12 words each) capturing their main contributions, reactions, or viewpoints"],
  "quote": "One representative near-verbatim quote or paraphrase (max 20 words) that best captures their voice in the discussion"
}

Focus ONLY on "${archetypeName}". Be specific and concise.

TRANSCRIPT:
${conversationTranscript}`;

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: "You are a qualitative researcher. Return only valid JSON, no markdown." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || "";

        return {
            summary: content.trim(),
            success: true
        };
    } catch (error) {
        console.error("[OpenAI] generateArchetypeSummary error:", error);
        return { summary: "", success: false, error: String(error) };
    }
}

/**
 * Generate Cross-Profile Comparison (Focus Group)
 */
export interface GenerateCrossProfileSummaryParams {
    archetypeNames: string[];
    conversationTranscript: string;
    modelName?: string;
}

export interface GenerateCrossProfileSummaryResult {
    summary: string;
    success: boolean;
    error?: string;
}

export async function generateCrossProfileSummary(params: GenerateCrossProfileSummaryParams): Promise<GenerateCrossProfileSummaryResult> {
    const { archetypeNames, conversationTranscript, modelName = DEFAULT_MODEL } = params;

    try {
        if (!isOpenAIConfigured()) {
            return {
                summary: JSON.stringify({
                    agreements: [
                        { point: "All profiles valued practical support over abstract advice", profiles: archetypeNames.slice(0, 2) },
                    ],
                    tensions: [
                        { point: "Disagreed on whether adults can be trusted with personal information", between: [archetypeNames[0], archetypeNames[1] || archetypeNames[0]] },
                    ],
                    gaps: [
                        "No profile raised the role of school counsellors",
                    ],
                    recommendedSteps: [
                        { action: "Test trust-building mechanisms before scaling", why: "Trust was the key divide — without it, no intervention lands" },
                        { action: "Segment by coping style, not demographics", why: "Profiles with similar ages had opposite coping strategies" },
                    ]
                }),
                success: true
            };
        }

        const client = getOpenAIClient();
        const prompt = `You are an expert qualitative researcher analyzing a focus group transcript involving these profiles: ${archetypeNames.join(", ")}.

Analyze the transcript and return ONLY valid JSON with this structure:

{
  "agreements": [
    { "point": "One sentence describing what they agreed on (max 15 words)", "profiles": ["names of profiles who agreed"] }
  ],
  "tensions": [
    { "point": "One sentence describing the disagreement (max 15 words)", "between": ["profile A", "profile B"] }
  ],
  "gaps": [
    "One sentence describing a perspective or topic nobody raised (max 15 words)"
  ],
  "recommendedSteps": [
    { "action": "A specific, actionable next step for the research/design team (max 15 words)", "why": "Brief rationale tied to what emerged in the discussion (max 20 words)" }
  ]
}

Rules:
- 2-3 items per section. Be specific, not generic.
- agreements/tensions should name the actual profiles involved.
- gaps should highlight what was MISSING from the conversation.
- recommendedSteps should be concrete actions the team can take based on what emerged.
- No markdown. Only valid JSON.

TRANSCRIPT:
${conversationTranscript}`;

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "system", content: "You are a qualitative researcher analyzing group dynamics. Return only valid JSON, no markdown." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || "";

        return {
            summary: content.trim(),
            success: true
        };
    } catch (error) {
        console.error("[OpenAI] generateCrossProfileSummary error:", error);
        return { summary: "", success: false, error: String(error) };
    }
}
// Created by Swapnil Bapat © 2026
