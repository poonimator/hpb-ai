import "server-only";

/**
 * Crazy 8s Ideation Prompt Builder
 * Generates 8 design concepts from mapping data, profiles, and project context
 */

export interface IdeationGenerationContext {
    // Project context
    projectName: string;
    projectDescription: string;
    subProjectName: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;

    // Mapping data: clusters grouped by theme
    clustersByTheme: Record<string, Array<{
        transcript: string;
        quote: string;
        context?: string;
    }>>;

    // Mapping insights (if generated)
    insights?: {
        found_out?: Array<{ text: string; citation?: string; citation_reason?: string; transcript_tags?: string[] }>;
        look_further?: Array<{ text: string; citation?: string; citation_reason?: string; transcript_tags?: string[] }>;
        new_areas?: Array<{ text: string; citation?: string; citation_reason?: string; transcript_tags?: string[] }>;
    };

    // Selected profiles (archetypes + KB personas)
    profiles: Array<{
        type: "archetype" | "kb_persona";
        name: string;
        description: string;
        demographicJson?: string | null;
        goalsJson?: string | null;
        motivationsJson?: string | null;
        groundTruthJson?: string | null;
        spiralJson?: string | null;
        extractedText?: string | null;
    }>;

    // Selected focus areas (creative matrix enabler keys)
    focusAreas: string[];
}

export interface IdeationConcept {
    name: string;
    tagline: string;
    whoIsItFor: { text: string; source: string; reason: string };
    whatProblem: { text: string; source: string; reason: string };
    bigIdea: { text: string; source: string; reason: string };
    howItWorks: {
        description: string;
        imageBase64?: string | null;
        imageTextLabels: string[];
    };
    whyMightItFail: { text: string; source: string; reason: string };
    whatToPrototype: { text: string; source: string; reason: string };
    howToMeasure: { text: string; source: string; reason: string };
}

const CREATIVE_MATRIX_ENABLERS: Record<string, { label: string; subCategories: string[] }> = {
    "technology_digital_media": {
        label: "Technology & Digital Media",
        subCategories: ["Mobile Devices & Wearable Tech", "Social Media", "Gaming & Simulations", "Embedded Sensors / Internet of Things"],
    },
    "events_programmes": {
        label: "Events & Programmes",
        subCategories: ["Meet-up Events", "Conferences & Symposiums", "Workshops & Courses of Study", "Peer-to-Peer Forums"],
    },
    "internal_policies_procedures": {
        label: "Internal Policies & Procedures",
        subCategories: ["Diagnostics & Assessments", "Incentives & Rewards", "Training & Education Programmes", "Company Guidelines"],
    },
    "public_policies_laws": {
        label: "Public Policies & Laws",
        subCategories: ["Policy Positions & Platforms", "Prospective Legislation", "Unwritten Customs & Traditions", "Institutional & Individual Roles"],
    },
    "games_competitions": {
        label: "Games & Competitions",
        subCategories: ["Motivations", "Rewards Badges Points and Prizes", "Teamwork", "Scoring and Leaderboards"],
    },
    "mobile_wearable_tech": {
        label: "Mobile & Wearable Tech",
        subCategories: ["Phones", "Tablets and e-Readers", "Watches and Activity Trackers", "Embedded Sensors"],
    },
    "social_media": {
        label: "Social Media",
        subCategories: ["Video and Pictures", "Posts and Messages", "Likes and Swipes", "Friends and Networks"],
    },
    "surprise_provocation": {
        label: "Surprise & Provocation",
        subCategories: ["Transforming Spaces", "Unexpected Experiences", "Pop-up Entertainment", "Guest Appearances"],
    },
    "health_wellness": {
        label: "Health & Wellness",
        subCategories: ["Nutrition Intake", "Physical Activity", "Sleep Quality", "The 'Quantified Self' Movement"],
    },
    "accessories": {
        label: "Accessories",
        subCategories: ["Thematic Accessories", "Cases and Covers", "Connectors and Mounts", "Fashion"],
    },
    "physical_variation": {
        label: "Physical Variation",
        subCategories: ["Different Sizes", "Forms and Shapes", "Unusual Materials", "Textures and Finishes"],
    },
    "people_partnerships": {
        label: "People & Partnerships",
        subCategories: ["Companies and Their Leaders", "Strategic Partnerships", "Spokespeople", "Evangelists"],
    },
    "hotspots_hangouts": {
        label: "Hotspots & Hangouts",
        subCategories: ["Location of Daily Activity", "High Traffic Areas", "Common Gathering Places", "Online Sites"],
    },
    "engage_senses": {
        label: "Engage Senses",
        subCategories: ["Sight", "Sound", "Touch", "Smell", "Taste"],
    },
    "shows_videos": {
        label: "Shows & Videos",
        subCategories: ["Live Performances", "TV and Radio", "Public Service Ads", "Viral Internet Videos"],
    },
    "celebrities_superstars": {
        label: "Celebrities & Superstars",
        subCategories: ["Famous Entertainers", "Celebrated Athletes", "Historical Figures", "Hometown Heroes"],
    },
};

export function getCreativeMatrixEnablers(): Record<string, { label: string; subCategories: string[] }> {
    return CREATIVE_MATRIX_ENABLERS;
}

export function buildIdeationPrompt(ctx: IdeationGenerationContext): string {
    const {
        projectName,
        projectDescription,
        subProjectName,
        researchStatement,
        ageRange,
        lifeStage,
        clustersByTheme,
        insights,
        profiles,
        focusAreas,
    } = ctx;

    // Format profiles section
    const profilesSection = profiles.length > 0 ? `
## SELECTED PROFILES / PERSONAS
These are the target users. Design concepts that serve their specific needs, behaviors, and constraints.

${profiles.map((p, i) => {
    let profileText = `### Profile ${i + 1}: ${p.name} (${p.type === "archetype" ? "Generated Archetype" : "Knowledge Base Persona"})
- **Description**: ${p.description}`;

    if (p.demographicJson) {
        try {
            const demo = JSON.parse(p.demographicJson);
            profileText += `\n- **Demographics**: Age ${demo.ageRange || "N/A"}, ${demo.occupation || "N/A"}, ${demo.livingSetup || "N/A"}`;
        } catch { /* skip */ }
    }
    if (p.goalsJson) {
        try {
            const goals = JSON.parse(p.goalsJson);
            if (Array.isArray(goals)) profileText += `\n- **Goals**: ${goals.join("; ")}`;
        } catch { /* skip */ }
    }
    if (p.motivationsJson) {
        try {
            const motivations = JSON.parse(p.motivationsJson);
            if (Array.isArray(motivations)) profileText += `\n- **Motivations**: ${motivations.join("; ")}`;
        } catch { /* skip */ }
    }
    if (p.groundTruthJson) {
        try {
            const gt = JSON.parse(p.groundTruthJson);
            profileText += `\n- **Ground Truth**: ${JSON.stringify(gt)}`;
        } catch { /* skip */ }
    }
    if (p.spiralJson) {
        try {
            const spiral = JSON.parse(p.spiralJson);
            profileText += `\n- **Behavioral Spiral**: Pattern: ${spiral.pattern || "N/A"}, Avoidance: ${spiral.avoidance || "N/A"}`;
        } catch { /* skip */ }
    }
    if (p.extractedText) {
        profileText += `\n- **Full Profile Text**: ${p.extractedText.slice(0, 1500)}${p.extractedText.length > 1500 ? "..." : ""}`;
    }
    return profileText;
}).join("\n\n")}
` : "";

    // Format insights section
    const insightsSection = insights ? `
## MAPPING INSIGHTS (Synthesized from Interview Data)

### Confirmed Patterns ("Found Out"):
${insights.found_out?.map(i => `- ${i.text}${i.citation ? ` [Citation: ${i.citation}${i.citation_reason ? ` — ${i.citation_reason}` : ""}]` : ""}${i.transcript_tags?.length ? ` [Sources: ${i.transcript_tags.join(", ")}]` : ""}`).join("\n") || "None"}

### Tensions & Gaps ("Look Further"):
${insights.look_further?.map(i => `- ${i.text}${i.citation ? ` [Citation: ${i.citation}${i.citation_reason ? ` — ${i.citation_reason}` : ""}]` : ""}${i.transcript_tags?.length ? ` [Sources: ${i.transcript_tags.join(", ")}]` : ""}`).join("\n") || "None"}

### Novel Findings ("New Areas"):
${insights.new_areas?.map(i => `- ${i.text}${i.citation ? ` [Citation: ${i.citation}${i.citation_reason ? ` — ${i.citation_reason}` : ""}]` : ""}${i.transcript_tags?.length ? ` [Sources: ${i.transcript_tags.join(", ")}]` : ""}`).join("\n") || "None"}
` : "";

    // Format creative matrix enablers
    const selectedEnablers = focusAreas.length > 0
        ? focusAreas.filter(k => CREATIVE_MATRIX_ENABLERS[k])
        : Object.keys(CREATIVE_MATRIX_ENABLERS);

    const enablersSection = `
## CREATIVE MATRIX ENABLERS
${focusAreas.length > 0
    ? "The user has selected these specific creative lenses. Prioritize concepts that leverage these categories, but you are not limited to them if other categories clearly fit."
    : "Consider ALL of the following creative lenses when generating concepts. Pick only the ones that are genuinely relevant to the project context and target audience — do NOT force-fit irrelevant categories."
}

${selectedEnablers.map(key => {
    const enabler = CREATIVE_MATRIX_ENABLERS[key];
    return `### ${enabler.label}
Think about: ${enabler.subCategories.join(", ")}`;
}).join("\n\n")}
`;

    return `# CRAZY 8s IDEATION — DESIGN CONCEPT GENERATOR

You are a Senior Design Strategist running a Crazy 8s ideation session for HPB (Health Promotion Board) Singapore. Your task is to generate **exactly 8 distinct, creative design concepts** based on real research data. These concepts will be used to explore solution directions — they should be bold, varied, and grounded in evidence.

## CRITICAL RULES
1. **Exactly 8 concepts.** No more, no less.
2. **Diversity of concept types.** Your 8 concepts must span a genuine MIX of categories: digital tools, physical products, events/programmes, policy changes, gamification, environmental design, partnerships, etc. Do NOT default to "8 apps." Only propose digital solutions where the data genuinely supports them. A concept can be a hybrid (e.g., physical + digital).
3. **Each concept must be grounded in evidence.** Every field (except "name" and "howItWorks") must cite its source from the mapping data, insights, or profiles with a 1-sentence reason.
4. **Concepts must have depth.** They should not be generic. Each concept should address a specific tension, need, or opportunity revealed in the data.
5. **Singapore context.** All concepts must be culturally appropriate and feasible within Singapore.
6. **Visual descriptions matter.** The "howItWorks.description" field will be used to generate an image. Write it as a vivid, visual scene (50-100 words) describing the concept in action.
7. **Text in images.** If the concept benefits from text labels in its illustration (e.g., an app screen mockup), list the EXACT words in "imageTextLabels". If no text is needed, set it to an empty array. Prefer no text — only include it when essential.
8. **Plain, simple language — no jargon, no ambiguity.** Every field must be written so a reader with no design, research, or academic background can understand it on first read. Follow these writing rules strictly:
   - Use short, everyday words. Avoid jargon like "operationalise", "tangible prompt", "low-pressure", "leap", "safe routing", "friction point", "canteen tables", "CCA" (spell out acronyms on first use), "stakeholder", "intervention", "scaffolding", "affordance", "pain point", etc. If you catch yourself writing a clever phrase or a design-thinking buzzword, rewrite it in plain words.
   - Prefer concrete nouns and verbs. Say what the thing IS and what people DO with it, not what it "enables" or "operationalises".
   - Write in active voice. Say "Peers reply using the card" not "A response is facilitated by the card".
   - Keep sentences short (under 20 words). Break up long sentences.
   - No vague language ("seamlessly", "effortlessly", "elegantly", "empowers", "unlocks", "reimagines"). Describe the actual behaviour.
   - The "reason" field under each source citation must explain the link in one clear sentence that a layperson would understand — not restate the source in fancier words.
   - When referring to the target audience, name them plainly (e.g., "teenagers in secondary school", "parents of teens", "students living at home") — do NOT refer to them by profile labels like "The Risk-Checker" in the body text of whoIsItFor / whatProblem / bigIdea. Profile labels are fine only in the "source" field, not in the user-facing "text" field.

## PROJECT CONTEXT
- **Project**: ${projectName}
- **Description**: ${projectDescription}
- **Workspace**: ${subProjectName}
- **Research Statement**: ${researchStatement}
- **Target Age Range**: ${ageRange}
- **Life Stage**: ${lifeStage}

${profilesSection}

## RAW MAPPING DATA (Verbatim Quotes by Theme)
Each quote is tagged with the transcript/person it came from.

${JSON.stringify(clustersByTheme, null, 2)}

${insightsSection}

${enablersSection}

## OUTPUT STRUCTURE

For EACH of the 8 concepts, return EXACTLY these fields:

### 1. name
A catchy, memorable concept name (2-5 words). Should evoke the concept's essence.

### 2. tagline
A single sentence (max 15 words) that captures what this concept does for the user.

### 3. whoIsItFor
- **text**: 1-2 sentences describing the specific target user segment
- **source**: Name of the mapping theme, profile, or insight this is based on
- **reason**: 1 sentence explaining why this source led to this target

### 4. whatProblem
- **text**: 1-2 sentences describing the specific problem this solves
- **source**: Name of the mapping theme, profile, or insight
- **reason**: 1 sentence linking the problem to the evidence

### 5. bigIdea
- **text**: 2-3 sentences describing the core concept — what makes it unique and compelling
- **source**: Name of the mapping theme, profile, or insight that inspired this
- **reason**: 1 sentence explaining the creative leap from data to idea

### 6. howItWorks
- **description**: 50-100 words. A vivid, visual description of the concept in action. Describe a specific scene or moment — what the user sees, touches, or experiences. This will be used to generate an image, so be concrete and visual.
- **imageTextLabels**: Array of exact text strings that should appear in the image, or empty array [] if no text needed.

### 7. whyMightItFail
- **text**: 1-2 sentences on the biggest risk or assumption
- **source**: Name of the mapping theme, profile, or insight that suggests this risk
- **reason**: 1 sentence explaining why this evidence points to failure risk

### 8. whatToPrototype
- **text**: 1-2 sentences describing the minimum viable prototype to test
- **source**: Name of the mapping theme, profile, or insight guiding what to test
- **reason**: 1 sentence explaining what this test would validate

### 9. howToMeasure
- **text**: 1-2 sentences describing 1-2 success metrics
- **source**: Name of the mapping theme, profile, or insight informing the metric
- **reason**: 1 sentence explaining why this metric matters for this audience

## OUTPUT FORMAT
Return ONLY valid JSON:
{
  "concepts": [
    {
      "name": "...",
      "tagline": "...",
      "whoIsItFor": { "text": "...", "source": "...", "reason": "..." },
      "whatProblem": { "text": "...", "source": "...", "reason": "..." },
      "bigIdea": { "text": "...", "source": "...", "reason": "..." },
      "howItWorks": { "description": "...", "imageTextLabels": [] },
      "whyMightItFail": { "text": "...", "source": "...", "reason": "..." },
      "whatToPrototype": { "text": "...", "source": "...", "reason": "..." },
      "howToMeasure": { "text": "...", "source": "...", "reason": "..." }
    }
  ]
}

REMEMBER: These concepts will be presented to stakeholders. They should feel genuinely creative and varied — not 8 versions of the same app. Mix digital with physical, policy with product, individual with community. Ground every claim in the actual data.`;
}
