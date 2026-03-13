import "server-only";

/**
 * Coach Review Prompt Builder
 * Unified prompt that analyzes both interviewer technique AND missed opportunities together
 */

export interface CoachReviewContext {
  // Project context
  projectName: string;
  researchStatement: string;
  guideIntent: string;

  // Full transcript
  transcript: Array<{ role: string; content: string; timestamp: string }>;

  // Optional coaching framework from KB
  coachingFramework?: string;

  // Guide Questions (The script/plan)
  guideQuestions?: Array<{ text: string; intent?: string }>;
}

/**
 * Build a single unified prompt that evaluates the entire conversation
 * - Interviewer technique (questions asked)
 * - Participant responses (missed opportunities)
 * - Conversation flow and relevance
 */
export function buildUnifiedCoachReviewPrompt(ctx: CoachReviewContext): string {
  const { projectName, researchStatement, guideIntent, transcript, guideQuestions, coachingFramework } = ctx;

  // Format transcript with clear turn numbering
  const transcriptText = transcript
    .map((m, i) => {
      const speaker = m.role === "user" ? "INTERVIEWER" : "PARTICIPANT";
      return `[Turn ${i + 1}] ${speaker}: ${m.content}`;
    })
    .join("\n\n");

  // Format guide questions if available
  const guideQuestionsSection = guideQuestions && guideQuestions.length > 0
    ? `## MODERATOR GUIDE (Expected Questions)
${guideQuestions.map((q, i) => `${i + 1}. "${q.text}"${q.intent ? ` — Goal: ${q.intent}` : ""}`).join("\n")}`
    : "";

  const frameworkSection = coachingFramework
    ? `## COACHING FRAMEWORK
${coachingFramework}`
    : "";

  return `# INTERVIEW SESSION COACH REVIEW

You are a Senior Interview Coach reviewing a transcript from a user research simulation. Your job is to provide actionable, balanced feedback strictly on the INTERVIEWER'S technique.

## YOUR GOALS
1. **Evaluate Interviewer Technique**: Rate the quality of questions asked
2. **Assess Conversation Relevance**: Check if the questions align with the research goals
3. **Be Selective**: Focus only on CRITICAL issues and genuine highlights.

## SESSION CONTEXT
- **Project**: ${projectName}
- **Research Goal**: ${researchStatement}
- **What we're trying to learn**: ${guideIntent || "General exploration"}

${guideQuestionsSection}

${frameworkSection}

## THE CONVERSATION
${transcriptText}

---

## EVALUATION CRITERIA

### For INTERVIEWER Questions (identify by turn number):
- ✅ **Good Technique**: Open-ended, neutral, invites elaboration
- ❌ **Leading Questions**: Puts words in participant's mouth
- ❌ **Closed Questions**: Yes/No that kills conversation
- ❌ **Stacked/Complex**: Multiple questions at once
- ❌ **Off-Topic**: Not aligned with research goals or guide
- ❌ **Assumptions**: Contains interviewer's assumptions or biases

**DO NOT evaluate the Participant's responses or look for missed opportunities.**
Focus ONLY on how the interviewer asked questions and managed the flow.

---

## YOUR FEEDBACK (Return valid JSON)

\`\`\`json
{
  "overallScore": <number 1-10>,
  "summary": "<2-3 sentence overall assessment of the INTERVIEWER'S performance. Be honest but constructive.>",
  
  "highlights": [
    {
      "turn": <interviewer turn number>,
      "observation": "<Why this was good technique>",
      "quote": "<Exact text from interviewer, NO markdown>"
    }
  ],
  
  "leadingMoments": [
    {
      "turn": <interviewer turn number>,
      "issue": "<What was wrong: Leading? Closed? Off-topic? Assumption?>",
      "quote": "<Exact text from interviewer, NO markdown>",
      "suggestion": "<Better way to phrase this>"
    }
  ],
  
  "betterQuestions": []
}
\`\`\`

## IMPORTANT GUIDELINES
1. **Turn numbers must match the transcript** - INTERVIEWER turns are odd (1, 3, 5...), PARTICIPANT turns are even (2, 4, 6...)
2. **Quotes must be exact substrings** from the transcript. No paraphrasing. No markdown formatting.
3. **Be balanced** - Include both positive highlights AND areas for improvement
4. **Consider the flow** - Did later questions address earlier clues?
5. **IGNORE Missed Opportunities** in participant answers. We are only grading the interviewer's questioning skills.

Return ONLY the JSON object, no additional text.`;
}

// Keep the legacy functions for backwards compatibility but mark as deprecated
/** @deprecated Use buildUnifiedCoachReviewPrompt instead */
export function buildPersonaCritiquePrompt(ctx: CoachReviewContext): string {
  // Redirect to unified prompt for consistency
  return buildUnifiedCoachReviewPrompt(ctx);
}

/** @deprecated Use buildUnifiedCoachReviewPrompt instead */
export function buildInterviewerCritiquePrompt(ctx: CoachReviewContext): string {
  // Redirect to unified prompt for consistency
  return buildUnifiedCoachReviewPrompt(ctx);
}

/**
 * Parse coach review response from AI
 */
export interface CoachReviewResult {
  overallScore: number;
  summary: string;
  highlights: Array<{ turn: number; observation: string; quote: string }>;
  leadingMoments: Array<{ turn: number; issue: string; quote: string; suggestion: string }>;
  missedProbes: Array<{ turn: number; opportunity: string; suggestion: string; quote?: string }>;
  betterQuestions: Array<{ original: string; improved: string; rationale: string }>;
}

export function parseCoachReviewResponse(response: string): CoachReviewResult | null {
  try {
    // Try to extract JSON from the response
    let jsonStr = response.trim();

    // Remove markdown code blocks if present
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      overallScore: parsed.overallScore ?? 5,
      summary: parsed.summary ?? "Review completed.",
      highlights: parsed.highlights ?? [],
      leadingMoments: parsed.leadingMoments ?? [],
      missedProbes: parsed.missedProbes ?? [],
      betterQuestions: parsed.betterQuestions ?? [],
    };
  } catch (error) {
    console.error("[CoachReview] Failed to parse response:", error);
    return null;
  }
}
// Created by Swapnil Bapat © 2026
