import "server-only";

/**
 * Persona Synthesis Prompt Builder
 *
 * For ONE archetype, takes the verbatim interview transcripts classified
 * into it (Phase A of the pipeline) and produces a single rich
 * "synthetic persona" — aggregated median demographics, lifestyle
 * patterns, goals, programmes/touchpoints, pain points, etc.
 *
 * CRITICAL: every field carries a provenance tag distinguishing what the
 * transcripts actually said from what the model inferred or assumed.
 *
 *   stated       — directly said by the interviewees
 *   inferred     — light extrapolation grounded in stated facts
 *   assumed      — model used common-sense / project context to fill a gap
 *   not_in_data  — no signal at all; leave value empty
 *
 * The section labels are universal — the AI fills them with whatever the
 * project's data actually contains. e.g. "Daily lifestyle dimensions" for
 * HPB will likely surface Eat/Sleep/Unplug/Bond; for a food-habits project
 * it will surface Cooking/Shopping/Cleanup/Family-time.
 */

export type Provenance = "stated" | "inferred" | "assumed" | "not_in_data" | "user_set";

export interface ContributingTranscript {
    id: string;
    displayName: string;
    text: string;
}

export interface ArchetypeForSynthesis {
    id: string;
    name: string;
    kicker?: string | null;
    description: string;
    fullContent?: unknown; // raw archetype fullContentJson if available
}

export interface SynthesisPromptContext {
    projectName: string;
    projectDescription?: string;
    researchStatement: string;
    profileTarget?: string;
    ageRange?: string;
    lifeStage?: string;

    archetype: ArchetypeForSynthesis;
    contributingTranscripts: ContributingTranscript[];

    /** Pre-allocated human name the AI MUST use as summary.name. Prevents
     *  parallel synthesis calls from colliding on the same name. */
    assignedName?: string;
    /** Pre-allocated gender (must align with the assigned name). */
    assignedGender?: "male" | "female";
}

/**
 * The model returns JSON shaped exactly like PersonaContent (see
 * src/lib/personas/types.ts). Each leaf field is:
 *
 *   { value: T | null, provenance: Provenance, evidenceQuotes?: {text, transcriptId, transcriptName}[], confidence?: number }
 *
 * The synthesis prompt enforces this shape via examples + a strict schema
 * sketch at the end so the JSON parser can rely on it.
 */
export function buildSynthesisPrompt(ctx: SynthesisPromptContext): string {
    const {
        projectName,
        projectDescription,
        researchStatement,
        profileTarget,
        ageRange,
        lifeStage,
        archetype,
        contributingTranscripts,
        assignedName,
        assignedGender,
    } = ctx;

    const transcriptBlocks = contributingTranscripts.length > 0
        ? contributingTranscripts.map((t, i) => `### Transcript ${i + 1} — ${t.displayName} (id: ${t.id})

<transcript>
${t.text.slice(0, 8000)}${t.text.length > 8000 ? "\n\n...[TRUNCATED]" : ""}
</transcript>`).join("\n\n")
        : "(No transcripts were classified into this archetype — return mostly not_in_data fields and rely on the archetype description itself for inferred values.)";

    const archetypeBlock = `## ARCHETYPE ANCHOR
Name: ${archetype.name}
${archetype.kicker ? `Kicker: "${archetype.kicker}"\n` : ""}Description: ${archetype.description}
${archetype.fullContent ? `\nArchetype details (JSON):\n${JSON.stringify(archetype.fullContent).slice(0, 4000)}` : ""}`;

    return `# ROLE
You are a senior research analyst building a single synthetic persona representing the archetype "${archetype.name}" based on real interview transcripts.

You will return ONE JSON object with the persona's full structured content. EVERY LEAF FIELD MUST CARRY A PROVENANCE TAG so a human reader can tell what came from the transcripts vs what you inferred or assumed.

# PROJECT CONTEXT
Project: ${projectName}
${projectDescription ? `Project description: ${projectDescription}\n` : ""}Research statement: ${researchStatement}
${profileTarget ? `Profile target: ${profileTarget}\n` : ""}${ageRange ? `Age range of target: ${ageRange}\n` : ""}${lifeStage ? `Life stage(s) of target: ${lifeStage}\n` : ""}
${archetypeBlock}

# CONTRIBUTING TRANSCRIPTS
These are the interview transcripts that an upstream classifier assigned to this archetype. Aggregate across them when computing the persona's demographic values (e.g. take median for age, mode for categorical), and pull verbatim evidence quotes where useful.

${transcriptBlocks}

# THE PROVENANCE SYSTEM (READ CAREFULLY)
Every leaf field in your output must be:

{
  "value": <the value, or null if not in data>,
  "provenance": "stated" | "inferred" | "assumed" | "not_in_data",
  "evidenceQuotes": [   // optional, 0–3 entries
    { "text": "<verbatim ≤30 word excerpt>", "transcriptId": "<the id of the source transcript>", "transcriptName": "<displayName>" }
  ],
  "confidence": <optional number 0–1>
}

Provenance rules:
- "stated"      → the value is directly said by one or more interviewees. Include 1–2 evidenceQuotes.
- "inferred"    → no interviewee said this exactly, but you can infer it from things they did say (e.g. age 28 stated + working full-time stated → occupation category inferred). Include the supporting evidence quotes.
- "assumed"     → no signal in the transcripts at all, but you've filled it with a plausible default given the project context and archetype description. NO evidenceQuotes (use []).
- "not_in_data" → no signal AND you choose not to assume. Set "value": null and "evidenceQuotes": [].

Bias toward "not_in_data" rather than "assumed" when the gap is wide. Honesty over completeness.

# THE OUTPUT SHAPE
Return a single JSON object exactly matching this skeleton (the leaf comments describe the meaning, do not include them in your output):

{
  "summary": {
    "name": <Field>,                // a plausible HUMAN name — see naming rules below
    "kicker": <Field>,              // 1-line core truth in their voice
    "headline": <Field>             // 1-2 sentences describing who this person is
  },
  "bio": {
    "age": <Field<number>>,         // numeric, median across contributing transcripts when stated; null when not_in_data
    "gender": <Field>,
    "ethnicity": <Field>,
    "religion": <Field>,
    "homeLanguage": <Field>,
    "preferredLanguage": <Field>,
    "literacy": <Field>
  },
  "contextAndEnvironment": {
    "neighbourhood": <Field>,
    "housing": <Field>,
    "income": <Field>,              // string range or label, not raw numeric
    "commute": <Field>,
    "foodAccess": <Field>,
    "other": [                       // 0-4 additional project-relevant context items
      { "key": "<short label>", "field": <Field> }
    ]
  },
  "coreBehaviourPattern": {
    "weekdayPattern": <Field>,      // 1-3 sentence description of a typical weekday
    "weekendPattern": <Field>       // 1-3 sentence description of a typical weekend
  },
  "goalsAndConcerns": {
    "goal": <Field>,                // the primary outcome they're chasing
    "fear": <Field>,                // the primary thing they're worried about
    "mentalState": <Field>,         // current emotional/cognitive state
    "perceivedRisk": <Field>,       // how they perceive risk of inaction (low/med/high + 1 line)
    "primarySource": <Field>        // where they get information / influence
  },
  "dailyLifestyle": {
    "dimensions": [                  // pick the 3-5 dimensions that fit THIS project's data
      { "name": "<dimension name, e.g. 'Sleep' or 'Cooking'>", "description": <Field> }
    ]
  },
  "programmesAndTouchpoints": {
    "appUsage": <Field>,            // any apps / digital tools they use
    "eventHistory": <Field>,        // events / programmes they have / have not engaged
    "preferredFormat": <Field>,     // how they like content packaged
    "depthAndTone": <Field>,        // depth + tone preferences for messaging
    "channels": <Field>             // where to reach them
  },
  "painPointsAndLanguage": {
    "painPoints": <Field<string[]>>,  // 2-5 phrases capturing recurring frustrations (value is an array)
    "objection": <Field>,             // a quote-style line capturing their core objection
    "voiceQuote": <Field>             // an emblematic verbatim quote
  },
  "verbatims": [                       // 3-6 representative verbatim quotes from the transcripts
    { "text": "<verbatim quote>", "transcriptId": "<id>", "transcriptName": "<displayName>" }
  ]
}

# NAMING THE PERSONA
The persona's \`summary.name\` MUST be a plausible HUMAN name — NOT the archetype name and NOT a behavioural label.

${assignedName
    ? `**FIXED ASSIGNMENT — DO NOT DEVIATE.**
The orchestrator has pre-allocated this persona's name to ensure uniqueness AND a deliberate Singaporean race mix across siblings in this run (Chinese / Malay / Indian / occasionally Eurasian).
- summary.name.value MUST equal exactly: "${assignedName}"
- summary.name.provenance MUST be: "inferred"
- summary.name.evidenceQuotes MUST be: []
${assignedGender ? `- bio.gender.value MUST equal "${assignedGender}" (matches the assigned name) and bio.gender.provenance MUST be "inferred".` : ""}
- bio.ethnicity and (where relevant) bio.religion should be set consistent with the assigned name. E.g. a Malay name implies Malay ethnicity and most likely Muslim religion; an Indian Tamil name implies Indian ethnicity (Hindu most common, but other faiths possible). Provenance for these inferred-from-name fields is "inferred".

Do not invent an alternate name. Do not append a title. Use the exact string above.`
    : `Rules:
- Pick a name that fits the most common ethnicity/culture visible in the contributing transcripts. If transcripts include Chinese, Malay, Indian or Eurasian Singaporean names, mirror that mix. If you can't tell, default to a common Singaporean name.
- Use a fresh fictional name — do NOT reuse the literal display name of any single contributing interviewee. The persona is a composite, not one specific person.
- Single first name is fine ("Wei Lin", "Hafiz", "Priya"). First + last is also fine ("Sarah Tan", "Marcus Lim"). Keep it under 25 characters.
- Set the provenance for the \`name\` field to "inferred" — a synthesised human name based on the population's typical naming patterns. Do not invent an evidence quote for the name.`
}
- The archetype's behavioural name (e.g. "The Momentum Teen") is preserved separately as the persona's anchor. The \`summary.name\` field is the persona's human identity, not the archetype label.

# WRITING RULES
- Aggregate, don't single-source: when 3 interviewees said overlapping things, capture the shared truth in your value and quote the most representative one.
- Use the interviewees' OWN words and register when possible. Do not corporate-ify their language.
- Section labels are universal. The dailyLifestyle.dimensions are project-adaptive — pick the dimensions that match THIS project's data, not a fixed list.
- If a section has zero signal in the transcripts AND you have no defensible basis to assume, mark all its fields not_in_data with null values.
- Verbatims should be short (≤ 30 words each), distinctive, and span more than one interviewee where possible.
- Do not invent transcript IDs. Reference only the IDs given in the CONTRIBUTING TRANSCRIPTS section above.
- Numeric "age" should be a median when multiple interviewees stated an age; if only some stated an age, set provenance to "stated" if ≥ 50% stated it, else "inferred". If none stated, "not_in_data" with null.

# RESPONSE FORMAT
Return ONLY the JSON object. No prose, no markdown fences, no commentary. The first character of your response must be \`{\` and the last must be \`}\`.`;
}
// Created by Swapnil Bapat © 2026
