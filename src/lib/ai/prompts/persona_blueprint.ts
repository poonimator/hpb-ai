import "server-only";

import type { ArchetypeSummary } from "./persona_classification";

/**
 * Persona Blueprint Prompt — unified Phase A of the persona pipeline.
 *
 * Replaces the old fixed-count classification + clustering split. The AI
 * now sees ALL archetypes (as optional behavioural references) and ALL
 * transcripts together, then decides how many distinct personas the data
 * can actually support (2–5). Each blueprint references the contributing
 * transcripts and optionally an archetype anchor.
 *
 * The key behavioural change: the AI is told NOT to create a persona just
 * because an archetype exists. It only creates a persona when there is
 * enough genuine transcript data to make it rich. Otherwise it merges
 * archetypes, drops thin ones, or marks transcripts unclassified.
 */

export interface BlueprintTranscriptInput {
    id: string;
    displayName: string;
    text: string;
}

export interface BlueprintPromptContext {
    projectName: string;
    researchStatement: string;
    profileTarget?: string;
    /** Optional archetype references. When provided, the AI uses them as
     *  behavioural lenses; it does NOT have to produce one persona per
     *  archetype. When empty, the AI clusters purely from transcripts. */
    archetypes: ArchetypeSummary[];
    transcripts: BlueprintTranscriptInput[];
}

/**
 * Output JSON shape:
 *
 *   {
 *     "personas": [
 *       {
 *         "name": "<short behavioural name, will be replaced by allocator>",
 *         "kicker": "<one-line voice-of-interviewee>",
 *         "rationale": "<one sentence: what binds these interviewees + why this is a distinct persona>",
 *         "primaryArchetypeId": "<archetype id from the input list, or null>",
 *         "transcriptIds": ["<id>", ...]
 *       }
 *     ],
 *     "unclassifiedTranscriptIds": ["<id>", ...]   // transcripts that don't cluster cleanly
 *   }
 */
export function buildBlueprintPrompt(ctx: BlueprintPromptContext): string {
    const { projectName, researchStatement, profileTarget, archetypes, transcripts } = ctx;

    const archetypeBlock = archetypes.length > 0
        ? `# AVAILABLE ARCHETYPE REFERENCES (use as lenses, NOT as a 1:1 mapping)
${archetypes.map((a, i) => `### Archetype ${i + 1} — ${a.name}
ID: ${a.id}
${a.kicker ? `Kicker: "${a.kicker}"\n` : ""}Description: ${a.description}
Defining traits: ${a.definingTraits.join(" | ")}`).join("\n\n")}

Note: these archetypes are behavioural lenses you MAY anchor personas to. You do NOT have to create one persona per archetype. Multiple archetypes can collapse into a single persona, an archetype with thin data support can be dropped, and you can create personas that don't reference any archetype if the data warrants it.`
        : `# NO ARCHETYPE REFERENCES PROVIDED
You will cluster the transcripts on your own and produce 2–5 emergent personas.`;

    const transcriptBlocks = transcripts.map((t, i) => `### Transcript ${i + 1} — ${t.displayName} (id: ${t.id})

<transcript>
${t.text.slice(0, 6000)}${t.text.length > 6000 ? "\n\n...[TRUNCATED]" : ""}
</transcript>`).join("\n\n");

    return `# ROLE
You are a senior design researcher. Given ${transcripts.length} interview transcripts${archetypes.length > 0 ? ` and ${archetypes.length} candidate behavioural archetypes` : ""}, decide how many distinct personas the data can genuinely support — and synthesise them.

# PROJECT CONTEXT
Project: ${projectName}
Research statement: ${researchStatement}
${profileTarget ? `Audience being profiled: ${profileTarget}\n` : ""}
${archetypeBlock}

# THE CRITICAL RULE — RICHNESS OVER COUNT
The single most common failure mode here is creating personas with too little supporting data, which forces the next step (synthesis) to fill the persona card mostly with assumed content. Avoid that. Specifically:

- **Aim for 2 to 5 personas total.** Pick the count based on how the data actually clusters, NOT the number of archetypes given.
- **Only create a persona when there is enough transcript material to make it rich.** A persona supported by a single transcript is fine ONLY if that transcript is detailed and clearly distinct. A persona supported by two thin transcripts is worse than no persona at all — merge it into a neighbour or drop it.
- **It's better to ship 2 rich personas than 5 thin ones.** Collapse archetypes that converge on the same kind of person. Drop archetypes whose transcripts don't show up. Promote a strong emergent cluster even if it doesn't map to any provided archetype.
- **Every transcript that fits a persona must be cited in that persona's transcriptIds.** Transcripts that truly don't fit any cluster cleanly go into unclassifiedTranscriptIds — do NOT force them into a persona.
- **Each persona must have at least 1 contributing transcript.** Personas with 0 transcripts are forbidden.

# OUTPUT
Return ONLY a JSON object with this shape:

{
  "personas": [
    {
      "name": "<short behavioural name, e.g. 'The Momentum Teen' — will be overridden by name allocator later, so this is just for your reasoning>",
      "kicker": "<one-line in an interviewee's voice that captures this persona>",
      "rationale": "<one sentence: what binds these interviewees together + why this is a distinct persona>",
      "primaryArchetypeId": "<archetype id from the input list, OR null if none fits>",
      "transcriptIds": ["<id1>", "<id2>", ...]
    }
  ],
  "unclassifiedTranscriptIds": ["<id1>", ...]
}

Constraints:
- 2 ≤ personas.length ≤ 5
- Use only transcript IDs from the input. Do not invent IDs.
- Use only archetype IDs from the input for primaryArchetypeId (or null).
- Every transcript ID appears in EXACTLY ONE of: a personas[].transcriptIds, or unclassifiedTranscriptIds. Never in both, never in zero.

# TRANSCRIPTS

${transcriptBlocks}

# RESPOND
First character must be \`{\` and last must be \`}\`. No prose, no markdown fences.`;
}
// Created by Swapnil Bapat © 2026
