import "server-only";

/**
 * Live Coach Prompt Builder
 * Generates real-time coaching guidance during interview simulations
 */

export interface LiveCoachContext {
    // Research context
    researchStatement: string;
    ageRange: string;
    lifeStage: string;

    // Guide questions (all questions from the moderator guide)
    guideQuestions: Array<{
        id: string;
        setTitle: string;
        text: string;
        subQuestions?: string[];
    }>;

    // Conversation so far
    conversationHistory: Array<{ role: string; content: string }>;

    // The latest persona response to analyze
    latestPersonaResponse: string;

    // The latest interviewer question
    latestInterviewerQuestion: string;

    // Questions already marked as covered (IDs)
    coveredQuestionIds: string[];

    // Global KB Frameworks - used to guide the AI's mindset and approach
    frameworkDocuments?: Array<{
        title: string;
        content: string;
    }>;

    // Project Research Documents - used to detect hypothesis validation redundancy
    researchDocuments?: Array<{
        title: string;
        content: string;
    }>;
}

// Individual opportunity identified from persona's response
export interface OpportunityInsight {
    // The exact quote from the persona that triggered this insight
    quote: string;

    // What context/background this reveals (what's now surfaced/known)
    surfacedContext: string;

    // What assumption or belief this could help validate
    testableAssumption: string | null;

    // What new direction or area this opens up for exploration
    explorationDirection: string | null;
}

export interface LiveCoachResult {
    // Array of opportunities identified (max 2, can be empty if none found)
    opportunities: OpportunityInsight[];

    // Legacy fields for backwards compatibility
    coachingNudge: string | null;
    highlightQuote: string | null;

    // Suggested question from guide (if applicable)
    suggestedGuideQuestion: {
        questionId: string;
        questionText: string;
        reason: string;
    } | null;

    // Questions that appear to be answered in this response
    newlyCoveredQuestionIds: string[];

    // Did the coach spot opportunities worth exploring?
    missedOpportunity: boolean;
}

export function buildLiveCoachPrompt(ctx: LiveCoachContext): string {
    // Format guide questions for the prompt
    const formattedGuideQuestions = ctx.guideQuestions
        .filter(q => !ctx.coveredQuestionIds.includes(q.id))
        .map((q, i) => {
            let text = `[ID:${q.id}] (${q.setTitle}) ${q.text}`;
            return text;
        })
        .join("\n");

    // Format conversation history (last 4 turns for context)
    const recentHistory = ctx.conversationHistory.slice(-4);
    const formattedHistory = recentHistory
        .map(m => `${m.role === "user" ? "INTERVIEWER" : "PARTICIPANT"}: ${m.content}`)
        .join("\n\n");

    // Format framework documents for AI mindset grounding
    const formattedFrameworks = ctx.frameworkDocuments && ctx.frameworkDocuments.length > 0
        ? ctx.frameworkDocuments.map(doc =>
            `### ${doc.title}\n${doc.content.slice(0, 2000)}${doc.content.length > 2000 ? '...' : ''}`
        ).join("\n\n")
        : null;

    // Format research documents for hypothesis validation checking
    const formattedResearch = ctx.researchDocuments && ctx.researchDocuments.length > 0
        ? ctx.researchDocuments.map(doc =>
            `### ${doc.title}\n${doc.content.slice(0, 1500)}${doc.content.length > 1500 ? '...' : ''}`
        ).join("\n\n")
        : null;

    // Build the framework mindset section
    const frameworkSection = formattedFrameworks ? `
## HPB RESEARCH FRAMEWORKS (Your Mindset & Approach)
Adopt the following frameworks and methodologies when analyzing the conversation. These guide how you think about behavior change, research insights, and opportunity identification:

${formattedFrameworks}

---
` : '';

    // Build the research context section for hypothesis validation
    const researchSection = formattedResearch ? `
## EXISTING RESEARCH FINDINGS (For Hypothesis Validation)
The following research has already been conducted on this topic. When suggesting "Worth validating" assumptions, check if they have already been validated or explored in this research. If so, note this to avoid redundant validation:

${formattedResearch}

---
` : '';

    return `# SENIOR DESIGN RESEARCHER - LIVE COACHING
${frameworkSection}
You are a Senior Design Researcher watching a live interview. Your job is to spot meaningful "threads" in the participant's response that could lead to valuable insights.

## RESEARCH CONTEXT
- Research Goal: ${ctx.researchStatement}
- Participant: ${ctx.ageRange}, ${ctx.lifeStage}
${researchSection}
## REMAINING GUIDE QUESTIONS
${formattedGuideQuestions || "None remaining"}

## CONVERSATION SO FAR
${formattedHistory}

## LATEST EXCHANGE TO ANALYZE
INTERVIEWER: "${ctx.latestInterviewerQuestion}"

PARTICIPANT: "${ctx.latestPersonaResponse}"

---

## YOUR TASK: IDENTIFY RESEARCH OPPORTUNITIES

Scan the PARTICIPANT'S response for threads worth pulling. Look for:
1. **Emotion signals**: words like "hate", "love", "stressed", "frustrating", expressing feeling
2. **Hedging language**: "sometimes", "I guess", "maybe", "depends" - often hiding deeper truths
3. **Specific behaviors**: routines, habits, workarounds they've developed
4. **Tensions or contradictions**: what they say vs what they do, or conflicting priorities
5. **Specific examples or stories**: concrete instances worth unpacking

## OPPORTUNITY STRUCTURE

For each opportunity you identify, structure it to help the researcher:

1. **quote**: The EXACT phrase from participant (under 15 words) that caught your attention
2. **surfacedContext**: What background or context did this reveal? What do we now know about their situation, experience, or perspective? (1-2 sentences)
3. **testableAssumption**: Does this hint at an assumption or belief worth validating? What hypothesis about their behavior or needs could we explore? (1 sentence, or null if not applicable)
   - **IMPORTANT**: If EXISTING RESEARCH FINDINGS are provided above, check if this assumption has already been validated or explored. If so, prefix with "[ALREADY VALIDATED]" or "[PARTIALLY VALIDATED]" and briefly note where it was found. If it's a genuinely new hypothesis, prefix with "[NEW HYPOTHESIS]".
4. **explorationDirection**: What new territory does this open up? What follow-up question or area could uncover deeper insights? (1 sentence, or null if obvious)

## CRITICAL RULES

- **Quality over quantity**: Only identify opportunities that are genuinely meaningful. If there's only 1 (or even 0), that's fine.
- **Maximum 2 opportunities**: Even in rich responses, focus on the 2 most promising threads.
- **Skip obvious responses**: If the participant just answered directly with no interesting subtext, return empty opportunities array.
- **Exact quotes only**: The quote must be copy-pasted verbatim from their response.

## REQUIRED OUTPUT

Return JSON with these fields:

1. **opportunities**: Array of 0-2 opportunity objects (each with: quote, surfacedContext, testableAssumption, explorationDirection)

2. **suggestedGuideQuestion**: If any remaining guide question relates thematically to what was discussed, suggest it. Otherwise null.

3. **newlyCoveredQuestionIds**: List IDs of guide questions the participant SUBSTANTIALLY answered.

## JSON OUTPUT (no other text):
{
  "opportunities": [
    {
      "quote": "exact words from participant",
      "surfacedContext": "This reveals that they...",
      "testableAssumption": "They might believe that...",
      "explorationDirection": "Worth asking about..."
    }
  ],
  "suggestedGuideQuestion": {"questionId": "ID", "questionText": "the question", "reason": "why it fits"},
  "newlyCoveredQuestionIds": []
}

Example with 0 opportunities (mundane response):
{
  "opportunities": [],
  "suggestedGuideQuestion": null,
  "newlyCoveredQuestionIds": ["q123"]
}

REMEMBER: Quote must be EXACT text. Focus on threads that could genuinely advance the research.`;
}



export function parseLiveCoachResponse(response: string): LiveCoachResult {
    const emptyResult: LiveCoachResult = {
        opportunities: [],
        coachingNudge: null,
        highlightQuote: null,
        suggestedGuideQuestion: null,
        newlyCoveredQuestionIds: [],
        missedOpportunity: false
    };

    try {
        // Log raw response for debugging
        console.log("[LiveCoach] Raw AI response:", response?.substring(0, 200));

        // Handle empty response
        if (!response || response.trim() === "") {
            console.warn("[LiveCoach] Empty response from AI");
            return emptyResult;
        }

        // Clean up the response - remove markdown code blocks if present
        let cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        // Try to find JSON object in the response (in case there's extra text)
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            cleaned = jsonMatch[0];
        }

        // Handle empty after cleaning
        if (!cleaned || cleaned === "") {
            console.warn("[LiveCoach] Response empty after cleaning");
            return emptyResult;
        }

        const parsed = JSON.parse(cleaned);

        // Parse opportunities array (new format)
        const opportunities: OpportunityInsight[] = [];
        if (Array.isArray(parsed.opportunities)) {
            for (const opp of parsed.opportunities.slice(0, 2)) { // Max 2 opportunities
                if (opp && opp.quote) {
                    opportunities.push({
                        quote: String(opp.quote),
                        surfacedContext: String(opp.surfacedContext || ""),
                        testableAssumption: opp.testableAssumption ? String(opp.testableAssumption) : null,
                        explorationDirection: opp.explorationDirection ? String(opp.explorationDirection) : null
                    });
                }
            }
        }

        // Generate legacy fields from first opportunity (for backwards compatibility)
        const firstOpp = opportunities[0];
        const legacyNudge = firstOpp
            ? `${firstOpp.surfacedContext}${firstOpp.explorationDirection ? ' ' + firstOpp.explorationDirection : ''}`
            : null;
        const legacyQuote = firstOpp?.quote || null;

        return {
            opportunities,
            coachingNudge: legacyNudge,
            highlightQuote: legacyQuote,
            suggestedGuideQuestion: parsed.suggestedGuideQuestion || null,
            newlyCoveredQuestionIds: Array.isArray(parsed.newlyCoveredQuestionIds)
                ? parsed.newlyCoveredQuestionIds
                : [],
            missedOpportunity: opportunities.length > 0
        };
    } catch (e) {
        console.error("[LiveCoach] Failed to parse response:", e);
        console.error("[LiveCoach] Full response was:", response);
        return emptyResult;
    }
}

// Created by Swapnil Bapat © 2026
