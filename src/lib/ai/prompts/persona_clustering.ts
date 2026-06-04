import "server-only";

/**
 * Archetypeless clustering prompt — Phase A when the user runs a persona
 * generation WITHOUT seeding it with archetypes.
 *
 * Given N interview transcripts and a profile target (the audience), the
 * model partitions transcripts into 3–5 distinct clusters. Each cluster
 * becomes one synthetic persona in Phase B.
 *
 * The number of clusters is decided by the model based on real diversity
 * in the data — fewer if interviewees genuinely cluster together, more if
 * they don't. Lower-bound 2, upper-bound 6.
 */

export interface ClusteringTranscriptInput {
    id: string;
    displayName: string;
    text: string;
}

export interface ClusteringPromptContext {
    projectName: string;
    researchStatement: string;
    profileTarget?: string;
    transcripts: ClusteringTranscriptInput[];
}

/**
 * Output JSON shape returned by the model:
 *
 *   {
 *     "clusters": [
 *       {
 *         "name": "<short evocative name>",
 *         "kicker": "<one-line voice-of-interviewee>",
 *         "rationale": "<one sentence on why these interviewees cluster>",
 *         "transcriptIds": ["<id>", ...]
 *       },
 *       ...
 *     ]
 *   }
 */
export function buildClusteringPrompt(ctx: ClusteringPromptContext): string {
    const { projectName, researchStatement, profileTarget, transcripts } = ctx;

    const transcriptBlocks = transcripts.map((t, i) => `### Transcript ${i + 1} — ${t.displayName} (id: ${t.id})

<transcript>
${t.text.slice(0, 6000)}${t.text.length > 6000 ? "\n\n...[TRUNCATED]" : ""}
</transcript>`).join("\n\n");

    return `# ROLE
You are a senior research strategist. You are looking at ${transcripts.length} interview transcripts and your job is to discover behavioural clusters within them — the distinct ways the audience shows up in this data.

# PROJECT CONTEXT
Project: ${projectName}
Research statement: ${researchStatement}
${profileTarget ? `Audience being profiled: ${profileTarget}\n` : ""}
# WHAT TO DO
1. Read all ${transcripts.length} transcripts carefully.
2. Identify clusters of interviewees who share substantive behavioural similarities — same recurring motivations, similar barriers, similar daily patterns, similar relationship with the topic. NOT just demographic similarities.
3. Produce between 2 and 6 clusters total. Use FEWER clusters when interviewees genuinely converge; more when they fragment. Do not force-pad with thin clusters.
4. For each cluster, name it behaviourally (the way an HCD researcher names archetypes — e.g. "The Self-Filtered Sharer", "The Momentum Teen") — short, evocative, not academic.
5. Every transcript must be assigned to exactly ONE cluster.
6. Cluster sizes can be uneven — that's expected.

# OUTPUT
Return ONLY a JSON object with this shape:

{
  "clusters": [
    {
      "name": "<short behavioural name>",
      "kicker": "<one-line in the interviewee's voice that captures the cluster>",
      "rationale": "<one sentence: what binds these interviewees together>",
      "transcriptIds": ["<id1>", "<id2>", ...]
    }
  ]
}

Use only the transcript IDs given below. Do not invent IDs. Every ID must appear in exactly one cluster's transcriptIds array.

# TRANSCRIPTS

${transcriptBlocks}

# RESPOND
First character must be \`{\` and last must be \`}\`. No prose, no markdown fences.`;
}
// Created by Swapnil Bapat © 2026
