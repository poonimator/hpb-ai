import "server-only";

/**
 * Archetype Generation Prompt Builder
 * Generates behavioral archetypes from affinity mapping data & insights
 */

export interface ArchetypeGenerationContext {
    // Project context
    projectName: string;
    projectDescription: string;
    subProjectName: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;
    profileTarget: string; // The specific group we are generating profiles for (e.g., "parents", "students")

    // Mapping data: clusters grouped by theme with transcript tags
    clustersByTheme: Record<string, Array<{
        transcript: string; // Display name of the transcript/person
        quote: string;      // The verbatim quote(s)
        context?: string;   // Brief context
    }>>;

    // Mapping insights (if generated)
    insights?: {
        found_out?: Array<{ text: string; transcript_tags?: string[] }>;
        look_further?: Array<{ text: string; transcript_tags?: string[] }>;
        new_areas?: Array<{ text: string; transcript_tags?: string[] }>;
    };

    // Global frameworks for behavioral lens
    frameworkContext: string;
}

export interface GeneratedArchetype {
    name: string;
    kicker: string;
    description: string;
    demographic: {
        ageRange: string;
        occupation: string;
        livingSetup: string;
    };
    influences: string[];
    livedExperience: string;
    behaviours: string[];
    barriers: string[];
    motivations: string[];
    goals: string[];
    habits: string[];
    spiral: {
        pattern: string;
        avoidance: string;
    };
}

export function buildArchetypeGenerationPrompt(ctx: ArchetypeGenerationContext): string {
    const {
        projectName,
        projectDescription,
        subProjectName,
        researchStatement,
        ageRange,
        lifeStage,
        profileTarget,
        clustersByTheme,
        insights,
        frameworkContext,
    } = ctx;

    // Format insights if available
    const insightsSection = insights ? `
## MAPPING INSIGHTS (Already Synthesized)
These insights have already been generated from the mapping data. Use them to inform archetype creation.

### Confirmed Patterns ("Found Out"):
${insights.found_out?.map(i => `- ${i.text} ${i.transcript_tags?.length ? `[Sources: ${i.transcript_tags.join(", ")}]` : ""}`).join("\n") || "None"}

### Tensions & Gaps ("Look Further"):
${insights.look_further?.map(i => `- ${i.text} ${i.transcript_tags?.length ? `[Sources: ${i.transcript_tags.join(", ")}]` : ""}`).join("\n") || "None"}

### Novel Findings ("New Areas"):
${insights.new_areas?.map(i => `- ${i.text} ${i.transcript_tags?.length ? `[Sources: ${i.transcript_tags.join(", ")}]` : ""}`).join("\n") || "None"}
` : "";

    // Format framework context
    const frameworkSection = frameworkContext ? `
## HPB BEHAVIORAL FRAMEWORKS (Your Thinking Lens)
Adopt these frameworks when thinking about behavior change, motivations, and barriers:

${frameworkContext}
` : "";

    return `# ARCHETYPE GENERATOR — BEHAVIORAL REALITY, NOT MARKETING PERSONAS

You are a Senior Design Researcher at HPB (Health Promotion Board) Singapore. Your task is to generate distinct behavioral archetypes from real interview data. These are NOT marketing personas. They are raw, honest portraits of how real people actually behave — including their failures, excuses, and constraints.

## CRITICAL RULES
1. **No aspirational language.** Describe what people ACTUALLY do, not what they wish they did.
2. **Every trait must trace back to evidence.** If you cannot point to quotes from the data, do not invent traits.
3. **Find the uncomfortable truths.** Say-Do gaps, rationalizations, dealbreakers — these matter more than demographics.
4. **Plain-language behavioral names.** Name archetypes by their defining behavior pattern using simple, everyday words anyone would understand (e.g., "The Guilt Tripper", "The Last-Minute Rusher", "The People Pleaser"). Avoid academic, clinical, or overly sophisticated vocabulary. Never name by demographics.
5. **Distinct archetypes.** Each archetype must represent a genuinely different behavioral pattern. Do not create variations of the same person.
6. **Singapore context.** All archetypes must reflect Singapore cultural norms, social dynamics, and local context.

## PROJECT OVERALL CONTEXT
- **Project**: ${projectName}
- **Description**: ${projectDescription}
- **Sub-Project**: ${subProjectName}
- **Overall Project Research Goal**: ${researchStatement}

---
CRITICAL DIRECTIVE: TARGET AUDIENCE FOR THESE ARCHETYPES
You are generating archetypes SPECIFICALLY for this target audience group: **${profileTarget}**

You MUST ensure that the archetypes you generate exclusively represent **${profileTarget}**. Do NOT generate archetypes for the overall project subjects if they differ from this target group (e.g. if the project is about youth but the target group is 'parents', you MUST generate archetypes of parents).
---

${frameworkSection}

## RAW MAPPING DATA (Verbatim Quotes by Theme)
Each quote is tagged with the transcript/person it came from.

${JSON.stringify(clustersByTheme, null, 2)}

${insightsSection}

## YOUR TASK
Analyze ALL the data above and generate **3 to 5 distinct behavioral archetypes** of **${profileTarget}**. Each archetype should represent a cluster of **${profileTarget}** who behave similarly across the mapped themes.

**IMPORTANT MODE NOTE**: Include this exact note with every archetype: "Archetype mode — a person may shift between different modes depending on situation and support."

## OUTPUT STRUCTURE (Per Archetype)

For EACH archetype, return EXACTLY these fields:

### 1. Identity
- **name**: A sharp behavioral title using plain, simple words (3-4 words max, e.g., "The Self-Blamer", "The Switch-Off Seeker", "The Risk-Checker"). Use language that your audience would understand — no academic or clinical terms.
- **kicker**: One punchy sentence that captures their core operating principle. This reads like a thesis statement about how they cope (e.g., "When there's no clear next step, stress turns inward." or "When it feels too much, they bring the feeling down first."). It should feel like a window into their logic.
- **description**: 3-4 sentences. A brutally honest but empathetic summary. Describe what they actually DO when facing the issue, what drives the behavior, and why it is hard for them to change. No aspirational language. Write it as if explaining this person to a researcher who needs to design an intervention for them.
- **demographic**: { "ageRange": "the specific age range for THIS archetype based on the data (e.g., '35-45' for parents, '14-16' for younger teens, '20-28' for young adults — derive from the interview evidence, not from the project target audience settings)", "occupation": "typical role/situation", "livingSetup": "living context" }

### 2. Influences
- **influences**: 3-4 bullet points. External forces that shape their mindset and behavior. Be SPECIFIC and contextual — not generic forces, but the ones that specifically matter for THIS archetype. Include the mechanism in parentheses where helpful (e.g., "Peer comparison (in school, friendships, online, community)" or "Easy access to low-effort relief (phone, feeds, games)"). Think: what in their environment makes this pattern likely?

### 3. Their Lived Experience
- **livedExperience**: A substantial paragraph (4-5 sentences). Write this as a deeply empathetic description of their INTERNAL experience — their inner monologue, what they feel, how they interpret what is happening to them. Start by reframing their behavior (what they are actually trying to do, not what it looks like from outside), then explain WHY the behavior makes sense to them, then name the real problem underneath. This should read like someone who truly understands this person, not someone judging them. Example quality: "They are not trying to avoid life. They are trying to get the feeling down fast so they can function. The phone, sleep, or switching off wins because it is instant, private, and needs no words."

### 4. Behaviours
- **behaviours**: 3-4 bullet points. OBSERVABLE actions — what someone would actually SEE them doing. Each bullet should describe a specific, concrete action pattern, not a feeling or attitude. Write as "does X" patterns (e.g., "Searches for rules or clear steps; ends up feeling worse when none appear" or "Shares a small piece first, then watches the reaction").

### 5. Barriers
- **barriers**: 3-4 bullet points. What specifically prevents them from getting help, changing behavior, or accepting support. Each barrier should explain WHY it blocks them, not just name it. Be specific to this archetype's logic (e.g., "Self-blame makes support feel undeserved or embarrassing" or "If the response feels scripted, it reads as you don't care").

### 6. Motivations
- **motivations**: 3 bullet points. What actually DRIVES them underneath — often social, emotional, or ego-driven reasons, not health goals. These should feel honest and human (e.g., "Keep face and look like they are managing" or "Be understood without exposure"). These are the real reasons, not the ones they would put on a form.

### 7. Goals
- **goals**: 3 bullet points. What they want RIGHT NOW — not long-term aspirations, but immediate, practical things they are actually trying to achieve in this moment (e.g., "Stop the spiral before it gets worse" or "Get through the next hour/day" or "Keep it contained and manageable").

### 8. Habits
- **habits**: 3 bullet points. Automatic, unconscious default behaviors — things they do WITHOUT thinking. These are the ingrained patterns that run on autopilot (e.g., "Reaches for the quickest off switch under pressure" or "Quietly pushes through until it becomes too much").

### 9. The Spiral
- **spiral**: {
    "pattern": "A single chain showing their downward spiral using arrows (e.g., Uncertainty -> I should know this -> Self-Blame or Overwhelm -> Quick switch-off -> Time slips -> Stress returns louder). This should be 3-5 steps showing the cascade from trigger to outcome.",
    "avoidance": "A paragraph (3-4 sentences) explaining HOW to break the spiral — written as what adults, supporters, or systems should do to interrupt the pattern. This should be actionable and specific to this archetype. It should explain the AIM of the intervention, not just what to do (e.g., The aim is to separate the feeling from their worth, so the gap does not get filled with self-blame.)."
  }

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "archetypes": [
    {
      "identity": {
        "name": "...",
        "kicker": "...",
        "description": "...",
        "demographic": { "ageRange": "...", "occupation": "...", "livingSetup": "..." }
      },
      "influences": ["..."],
      "livedExperience": "...",
      "behaviours": ["..."],
      "barriers": ["..."],
      "motivations": ["..."],
      "goals": ["..."],
      "habits": ["..."],
      "spiral": { "pattern": "...", "avoidance": "..." }
    }
  ]
}

REMEMBER: These archetypes will be used to stress-test health intervention concepts. If they are generic, soft, or aspirational, they are USELESS. Make them sharp, honest, and grounded in the actual data.`;
}
// Created by Swapnil Bapat © 2026
