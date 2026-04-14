# Ideation Feature (Crazy 8s AI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Ideation" tab that generates 8 design concepts using the Crazy 8s framework from mapping data, profiles, and project context, with AI-generated visuals via gpt-image-1.5.

**Architecture:** New `IdeationSession` Prisma model stores concept results as JSON. A two-step AI pipeline (text generation via gpt-5.2, then 8 parallel image calls via gpt-image-1.5) produces structured concept data. The UI follows existing tab/card patterns with a setup page, results grid, and detail overlay.

**Tech Stack:** Next.js 16 App Router, Prisma (PostgreSQL), OpenAI SDK (gpt-5.2 + gpt-image-1.5), Tailwind CSS, shadcn/ui, lucide-react.

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/ai/prompts/ideation_generation.ts` | Crazy 8s prompt builder + types |
| `src/app/api/sub-projects/[subProjectId]/ideations/route.ts` | GET (list) + POST (create) ideation sessions |
| `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/route.ts` | DELETE ideation session |
| `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/generate/route.ts` | AI pipeline: text + image generation |
| `src/app/projects/[projectId]/sub/[subProjectId]/ideation/new/page.tsx` | Setup page: select mapping, profiles, focus areas |
| `src/app/projects/[projectId]/sub/[subProjectId]/ideation/[sessionId]/page.tsx` | Results page: 8-card grid + detail overlay |

### Modified Files
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `IdeationSession` model, add relation on `SubProject` |
| `src/app/api/sub-projects/[subProjectId]/route.ts` | Include `ideationSessions` in GET response |
| `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx` | Add ideation tab button, card grid section, types, handlers |
| `src/lib/ai/openai.ts` | Add `generateIdeation()` and `generateConceptImage()` functions |

---

## Task 1: Database Schema — Add IdeationSession Model

**Files:**
- Modify: `prisma/schema.prisma:52-68` (SubProject model) and append new model at end

- [ ] **Step 1: Add IdeationSession model to schema**

In `prisma/schema.prisma`, add the relation to SubProject (after line 67, before the closing `}`):

```prisma
  ideationSessions  IdeationSession[]
```

Then append the new model at the end of the file (before the final comment):

```prisma
// ============================================
// Ideation Sessions (Crazy 8s AI Concepts)
// ============================================

model IdeationSession {
  id                   String     @id @default(cuid())
  subProjectId         String
  subProject           SubProject @relation(fields: [subProjectId], references: [id], onDelete: Cascade)
  name                 String
  status               String     @default("SETUP") // "SETUP" | "PROCESSING" | "COMPLETE" | "ERROR"
  sourceMappingId      String     // ID of the MappingSession used
  sourceProfileIdsJson String?    // JSON array of archetype IDs + KB persona doc IDs
  focusAreasJson       String?    // JSON array of selected creative matrix enabler keys
  resultJson           String?    // JSON array of 8 concept objects
  modelName            String?
  imageModelName       String?    // "gpt-image-1.5"
  latencyMs            Int?
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  @@index([subProjectId, createdAt])
}
```

- [ ] **Step 2: Run Prisma migration**

Run:
```bash
npx prisma migrate dev --name add-ideation-session
```

Expected: Migration created successfully, Prisma Client generated.

- [ ] **Step 3: Verify Prisma Client generation**

Run:
```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add IdeationSession model to database schema"
```

---

## Task 2: AI Prompt Builder — Crazy 8s Ideation Prompt

**Files:**
- Create: `src/lib/ai/prompts/ideation_generation.ts`

- [ ] **Step 1: Create the ideation prompt builder**

Create `src/lib/ai/prompts/ideation_generation.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/prompts/ideation_generation.ts
git commit -m "feat: add Crazy 8s ideation prompt builder with creative matrix enablers"
```

---

## Task 3: AI Functions — generateIdeation() and generateConceptImage()

**Files:**
- Modify: `src/lib/ai/openai.ts` (append at end, before final comment)

- [ ] **Step 1: Add generateIdeation function**

Append to `src/lib/ai/openai.ts` (before the final `// Created by` comment):

```typescript
/**
 * Generate 8 Crazy 8s ideation concepts from mapping data + profiles
 */
export async function generateIdeation(prompt: string): Promise<{
    concepts: Array<Record<string, unknown>>;
    modelName: string;
    latencyMs: number;
}> {
    const client = getOpenAIClient();
    const startTime = Date.now();

    const response = await client.chat.completions.create({
        model: DEFAULT_MODEL,
        messages: [
            { role: "system", content: SYSTEM_GUARDRAILS },
            { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7, // Higher creativity for ideation
    });

    const content = response.choices[0]?.message?.content;
    const latencyMs = Date.now() - startTime;

    if (!content) {
        throw new Error("No response from AI for ideation generation");
    }

    const parsed = JSON.parse(content);
    if (!parsed.concepts || !Array.isArray(parsed.concepts) || parsed.concepts.length !== 8) {
        throw new Error(`Expected 8 concepts, got ${parsed.concepts?.length || 0}`);
    }

    return {
        concepts: parsed.concepts,
        modelName: DEFAULT_MODEL,
        latencyMs,
    };
}

/**
 * Generate a concept illustration using gpt-image-1.5
 */
export async function generateConceptImage(
    conceptName: string,
    description: string,
    imageTextLabels: string[] = [],
): Promise<string | null> {
    try {
        const client = getOpenAIClient();

        const textInstruction = imageTextLabels.length > 0
            ? `Include only these exact words in the image: ${imageTextLabels.map(l => `"${l}"`).join(", ")}.`
            : "Do not include any text, words, letters, or numbers in the image.";

        const prompt = `Create a clean, professional concept illustration for: ${conceptName}.

${description}

Style: Modern design thinking concept sketch, clean lines, muted professional color palette, slightly abstract and conceptual. The illustration should clearly communicate the concept at a glance.
${textInstruction}`;

        const response = await client.images.generate({
            model: "gpt-image-1.5",
            prompt,
            n: 1,
            size: "1024x1024",
            quality: "medium",
        });

        // gpt-image-1.5 returns b64_json by default
        const imageData = response.data[0];
        if (imageData.b64_json) {
            return imageData.b64_json;
        }
        if (imageData.url) {
            // Fetch and convert to base64 if URL returned
            const imgRes = await fetch(imageData.url);
            const buffer = await imgRes.arrayBuffer();
            return Buffer.from(buffer).toString("base64");
        }
        return null;
    } catch (error) {
        console.error(`[OpenAI] Failed to generate image for concept "${conceptName}":`, error);
        return null;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/openai.ts
git commit -m "feat: add generateIdeation and generateConceptImage AI functions"
```

---

## Task 4: API Routes — CRUD for Ideation Sessions

**Files:**
- Create: `src/app/api/sub-projects/[subProjectId]/ideations/route.ts`
- Create: `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/route.ts`
- Modify: `src/app/api/sub-projects/[subProjectId]/route.ts:96-104`

- [ ] **Step 1: Create the GET + POST route**

Create `src/app/api/sub-projects/[subProjectId]/ideations/route.ts`:

```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string }>;
}

// GET /api/sub-projects/[subProjectId]/ideations
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;

        const sessions = await prisma.ideationSession.findMany({
            where: { subProjectId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                status: true,
                sourceMappingId: true,
                focusAreasJson: true,
                createdAt: true,
            },
        });

        return successResponse(sessions);
    } catch (error) {
        console.error("[API] GET ideations error:", error);
        return errorResponse("Failed to fetch ideation sessions", 500);
    }
}

// POST /api/sub-projects/[subProjectId]/ideations
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId } = await params;
        const body = await request.json();
        const { mappingId, profileIds, focusAreas, name } = body;

        if (!mappingId || typeof mappingId !== "string") {
            return errorResponse("A mapping session must be selected", 400);
        }

        // Verify the mapping session exists and belongs to this sub-project
        const mapping = await prisma.mappingSession.findFirst({
            where: { id: mappingId, subProjectId, status: "COMPLETE" },
        });

        if (!mapping) {
            return errorResponse("Mapping session not found or not complete", 404);
        }

        const session = await prisma.ideationSession.create({
            data: {
                subProjectId,
                name: name || `Ideation — ${mapping.name}`,
                status: "SETUP",
                sourceMappingId: mappingId,
                sourceProfileIdsJson: profileIds ? JSON.stringify(profileIds) : null,
                focusAreasJson: focusAreas && focusAreas.length > 0 ? JSON.stringify(focusAreas) : null,
            },
        });

        await logAudit({
            action: "CREATE",
            entityType: "IdeationSession",
            entityId: session.id,
            meta: { subProjectId, mappingId },
        });

        return successResponse(session, 201);
    } catch (error) {
        console.error("[API] POST ideations error:", error);
        return errorResponse("Failed to create ideation session", 500);
    }
}
```

- [ ] **Step 2: Create the DELETE route**

Create `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/route.ts`:

```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";

interface RouteParams {
    params: Promise<{ subProjectId: string; ideationId: string }>;
}

// DELETE /api/sub-projects/[subProjectId]/ideations/[ideationId]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId, ideationId } = await params;

        const existing = await prisma.ideationSession.findFirst({
            where: { id: ideationId, subProjectId },
        });

        if (!existing) {
            return errorResponse("Ideation session not found", 404);
        }

        await prisma.ideationSession.delete({
            where: { id: ideationId },
        });

        await logAudit({
            action: "DELETE",
            entityType: "IdeationSession",
            entityId: ideationId,
            meta: { subProjectId },
        });

        return successResponse({ deleted: true });
    } catch (error) {
        console.error("[API] DELETE ideation error:", error);
        return errorResponse("Failed to delete ideation session", 500);
    }
}
```

- [ ] **Step 3: Update sub-project GET to include ideation sessions**

In `src/app/api/sub-projects/[subProjectId]/route.ts`, add `ideationSessions` to the Prisma include block (after the `insightCritiques` block around line 167) and add `ideationSessions: true` to the `_count` select (around line 103):

Add to the `_count.select` block (after `insightCritiques: true`):
```typescript
                        ideationSessions: true,
```

Add after the `insightCritiques` include block (after line 167, before the closing `},` of the include):
```typescript
                ideationSessions: {
                    orderBy: { createdAt: "desc" as const },
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        sourceMappingId: true,
                        createdAt: true,
                    },
                },
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/sub-projects/\[subProjectId\]/ideations/ src/app/api/sub-projects/\[subProjectId\]/route.ts
git commit -m "feat: add ideation session CRUD API routes"
```

---

## Task 5: API Route — AI Generation Pipeline

**Files:**
- Create: `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/generate/route.ts`

- [ ] **Step 1: Create the generate route**

Create `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/generate/route.ts`:

```typescript
import { NextRequest } from "next/server";
import prisma from "@/lib/db/prisma";
import { logAudit } from "@/lib/db/audit";
import { successResponse, errorResponse } from "@/lib/validations";
import { generateIdeation, generateConceptImage } from "@/lib/ai/openai";
import { buildIdeationPrompt, IdeationGenerationContext } from "@/lib/ai/prompts/ideation_generation";

interface RouteParams {
    params: Promise<{ subProjectId: string; ideationId: string }>;
}

// POST /api/sub-projects/[subProjectId]/ideations/[ideationId]/generate
export async function POST(request: NextRequest, { params }: RouteParams) {
    const { subProjectId, ideationId } = await params;

    try {
        // 1. Fetch ideation session with sub-project and project context
        const session = await prisma.ideationSession.findFirst({
            where: { id: ideationId, subProjectId },
            include: {
                subProject: {
                    include: {
                        project: true,
                    },
                },
            },
        });

        if (!session) {
            return errorResponse("Ideation session not found", 404);
        }

        if (session.status === "COMPLETE") {
            return errorResponse("Ideation session already complete", 400);
        }

        // 2. Update status to PROCESSING
        await prisma.ideationSession.update({
            where: { id: ideationId },
            data: { status: "PROCESSING" },
        });

        // 3. Fetch mapping session with clusters
        const mappingSession = await prisma.mappingSession.findUnique({
            where: { id: session.sourceMappingId },
            include: {
                clusters: {
                    include: { transcript: true },
                },
            },
        });

        if (!mappingSession) {
            await prisma.ideationSession.update({
                where: { id: ideationId },
                data: { status: "ERROR" },
            });
            return errorResponse("Source mapping session not found", 404);
        }

        // 4. Aggregate clusters by theme
        const clustersByTheme: Record<string, Array<{ transcript: string; quote: string; context?: string }>> = {};
        for (const cluster of mappingSession.clusters) {
            if (!clustersByTheme[cluster.themeName]) {
                clustersByTheme[cluster.themeName] = [];
            }
            clustersByTheme[cluster.themeName].push({
                transcript: cluster.transcript.displayName,
                quote: cluster.quote,
                context: cluster.context || undefined,
            });
        }

        // 5. Parse insights if available
        let insights: IdeationGenerationContext["insights"] = undefined;
        if (mappingSession.insightsJson) {
            try {
                insights = JSON.parse(mappingSession.insightsJson);
            } catch {
                console.warn(`[Ideation] Failed to parse insights for mapping ${mappingSession.id}`);
            }
        }

        // 6. Fetch selected profiles
        const profileIds: string[] = session.sourceProfileIdsJson
            ? JSON.parse(session.sourceProfileIdsJson)
            : [];

        const profiles: IdeationGenerationContext["profiles"] = [];

        if (profileIds.length > 0) {
            // Fetch archetypes
            const archetypes = await prisma.archetype.findMany({
                where: { id: { in: profileIds } },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    demographicJson: true,
                    goalsJson: true,
                    motivationsJson: true,
                    groundTruthJson: true,
                    spiralJson: true,
                },
            });

            for (const a of archetypes) {
                profiles.push({
                    type: "archetype",
                    name: a.name,
                    description: a.description,
                    demographicJson: a.demographicJson,
                    goalsJson: a.goalsJson,
                    motivationsJson: a.motivationsJson,
                    groundTruthJson: a.groundTruthJson,
                    spiralJson: a.spiralJson,
                });
            }

            // Fetch KB persona docs (IDs not found as archetypes are KB personas)
            const foundArchetypeIds = new Set(archetypes.map(a => a.id));
            const kbPersonaIds = profileIds.filter(id => !foundArchetypeIds.has(id));

            if (kbPersonaIds.length > 0) {
                // Try global KB
                const globalDocs = await prisma.kbDocument.findMany({
                    where: { id: { in: kbPersonaIds }, docType: "PERSONA" },
                    select: { id: true, title: true, extractedText: true, parsedMetaJson: true },
                });

                for (const doc of globalDocs) {
                    profiles.push({
                        type: "kb_persona",
                        name: doc.title,
                        description: doc.parsedMetaJson
                            ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.description || ""; } catch { return ""; } })()
                            : "",
                        extractedText: doc.extractedText,
                    });
                }

                // Try project KB for remaining
                const foundGlobalIds = new Set(globalDocs.map(d => d.id));
                const projectKbIds = kbPersonaIds.filter(id => !foundGlobalIds.has(id));

                if (projectKbIds.length > 0) {
                    const projectDocs = await prisma.projectKbDocument.findMany({
                        where: { id: { in: projectKbIds }, docType: "PERSONA" },
                        select: { id: true, title: true, extractedText: true, parsedMetaJson: true },
                    });

                    for (const doc of projectDocs) {
                        profiles.push({
                            type: "kb_persona",
                            name: doc.title,
                            description: doc.parsedMetaJson
                                ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.description || ""; } catch { return ""; } })()
                                : "",
                            extractedText: doc.extractedText,
                        });
                    }
                }
            }
        }

        // 7. Parse focus areas
        const focusAreas: string[] = session.focusAreasJson
            ? JSON.parse(session.focusAreasJson)
            : [];

        // 8. Build prompt and call AI for text generation
        const subProject = session.subProject;
        const project = subProject.project;

        const promptCtx: IdeationGenerationContext = {
            projectName: project.name,
            projectDescription: project.description || "",
            subProjectName: subProject.name,
            researchStatement: subProject.researchStatement,
            ageRange: subProject.ageRange,
            lifeStage: subProject.lifeStage,
            clustersByTheme,
            insights,
            profiles,
            focusAreas,
        };

        const prompt = buildIdeationPrompt(promptCtx);
        console.log("[Ideation] Generating concepts, prompt length:", prompt.length);

        const { concepts, modelName, latencyMs: textLatencyMs } = await generateIdeation(prompt);
        console.log("[Ideation] Text generation complete, latency:", textLatencyMs, "ms");

        // 9. Generate images in parallel for all 8 concepts
        console.log("[Ideation] Generating 8 concept images in parallel...");
        const imageStartTime = Date.now();

        const imagePromises = concepts.map((concept) =>
            generateConceptImage(
                concept.name as string,
                (concept.howItWorks as { description: string }).description,
                (concept.howItWorks as { imageTextLabels?: string[] }).imageTextLabels || [],
            )
        );

        const images = await Promise.all(imagePromises);
        const imageLatencyMs = Date.now() - imageStartTime;
        console.log("[Ideation] Image generation complete, latency:", imageLatencyMs, "ms");

        // 10. Merge images into concepts
        for (let i = 0; i < concepts.length; i++) {
            const howItWorks = concepts[i].howItWorks as Record<string, unknown>;
            howItWorks.imageBase64 = images[i];
        }

        const totalLatencyMs = textLatencyMs + imageLatencyMs;

        // 11. Save to database
        await prisma.ideationSession.update({
            where: { id: ideationId },
            data: {
                status: "COMPLETE",
                resultJson: JSON.stringify(concepts),
                modelName,
                imageModelName: "gpt-image-1.5",
                latencyMs: totalLatencyMs,
            },
        });

        // 12. Audit log
        await logAudit({
            action: "GENERATE_IDEATION",
            entityType: "IdeationSession",
            entityId: ideationId,
            meta: {
                subProjectId,
                mappingId: session.sourceMappingId,
                profileCount: profiles.length,
                focusAreaCount: focusAreas.length,
                model: modelName,
                imageModel: "gpt-image-1.5",
                latencyMs: totalLatencyMs,
            },
        });

        return successResponse({
            success: true,
            conceptCount: concepts.length,
            latencyMs: totalLatencyMs,
        });
    } catch (error) {
        console.error("[API] POST ideation generate error:", error);

        // Try to set status to ERROR
        try {
            await prisma.ideationSession.update({
                where: { id: ideationId },
                data: { status: "ERROR" },
            });
        } catch { /* ignore */ }

        return errorResponse("Failed to generate ideation concepts", 500);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/sub-projects/\[subProjectId\]/ideations/\[ideationId\]/generate/
git commit -m "feat: add ideation AI generation pipeline (text + parallel image gen)"
```

---

## Task 6: UI — Add Ideation Tab + Card Grid to Workspace Hub

**Files:**
- Modify: `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`

This is the largest UI change. We need to:
1. Add `Zap` import
2. Add `IdeationSessionInfo` interface
3. Add `ideationSessions` to `SubProject` interface
4. Add `"ideation"` to the tab type union
5. Add the tab button between Profiles and HMW
6. Add the card grid content section
7. Add delete handler

- [ ] **Step 1: Add Zap to lucide-react imports**

In `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx` at line 43, add `Zap` to the import:

Replace:
```typescript
    Lightbulb
} from "lucide-react";
```
With:
```typescript
    Lightbulb,
    Zap
} from "lucide-react";
```

- [ ] **Step 2: Add IdeationSessionInfo interface**

After the `InsightCritiqueInfo` interface (after line 118), add:

```typescript
interface IdeationSessionInfo {
    id: string;
    name: string;
    status: string;
    sourceMappingId: string;
    createdAt: string;
}
```

- [ ] **Step 3: Add ideationSessions to SubProject interface**

In the `SubProject` interface, after `insightCritiques: InsightCritiqueInfo[];` (around line 136), add:

```typescript
    ideationSessions: IdeationSessionInfo[];
```

Also in the `_count` object, after `insightCritiques: number;` (around line 143), add:

```typescript
        ideationSessions: number;
```

- [ ] **Step 4: Update tab type union**

At line 180, replace:
```typescript
    const initialTab = (searchParams.get("tab") as "guides" | "simulations" | "mapping" | "archetypes" | "hmw" | "insights") || "guides";
```
With:
```typescript
    const initialTab = (searchParams.get("tab") as "guides" | "simulations" | "mapping" | "archetypes" | "ideation" | "hmw" | "insights") || "guides";
```

At line 181, replace:
```typescript
    const [activeContentTab, setActiveContentTab] = useState<"guides" | "simulations" | "mapping" | "archetypes" | "hmw" | "insights">(initialTab);
```
With:
```typescript
    const [activeContentTab, setActiveContentTab] = useState<"guides" | "simulations" | "mapping" | "archetypes" | "ideation" | "hmw" | "insights">(initialTab);
```

At line 183, replace:
```typescript
    const switchTab = useCallback((tab: "guides" | "simulations" | "mapping" | "archetypes" | "hmw" | "insights") => {
```
With:
```typescript
    const switchTab = useCallback((tab: "guides" | "simulations" | "mapping" | "archetypes" | "ideation" | "hmw" | "insights") => {
```

- [ ] **Step 5: Add the Ideation tab button**

After the Profiles tab button closing `</button>` (line 590) and before the HMW tab button `<button` (line 592), insert:

```tsx
                        <button
                            onClick={() => switchTab("ideation")}
                            className={`
                                relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-2 ml-1
                                ${activeContentTab === "ideation"
                                    ? "bg-white shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            style={activeContentTab === "ideation" ? { color: 'var(--color-interact)' } : undefined}
                        >
                            <Zap className={`h-3.5 w-3.5 ${activeContentTab === "ideation" ? "" : "text-muted-foreground"}`} style={activeContentTab === "ideation" ? { color: 'var(--color-interact)' } : undefined} />
                            Ideation
                            {(subProject.ideationSessions?.length || 0) > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "ideation" ? "" : "bg-muted text-muted-foreground"}`} style={activeContentTab === "ideation" ? { backgroundColor: 'var(--color-interact-subtle)', color: 'var(--color-interact)' } : undefined}>
                                    {subProject.ideationSessions.length}
                                </span>
                            )}
                        </button>
```

- [ ] **Step 6: Add the Ideation card grid content section**

After the Archetypes content section closing `})()}` (line 973) and before the `{/* How Might We */}` comment (line 975), insert:

```tsx
                    {/* Ideation */}
                    {activeContentTab === "ideation" && (
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Ideation Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/ideation/new`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Zap className="h-5 w-5" style={{ color: 'var(--color-interact)' }} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">New Ideation</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Generate concepts using the Crazy 8s framework
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Ideation Session Cards */}
                            {subProject.ideationSessions?.map((session) => (
                                <Link
                                    key={session.id}
                                    href={`/projects/${projectId}/sub/${subProjectId}/ideation/${session.id}`}
                                    className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                >
                                    {/* Delete on hover */}
                                    <button
                                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!confirm("Delete this ideation session?")) return;
                                            try {
                                                const res = await fetch(`/api/sub-projects/${subProjectId}/ideations/${session.id}`, { method: "DELETE" });
                                                if (res.ok) await fetchSubProject();
                                                else alert("Failed to delete");
                                            } catch { alert("Failed to delete"); }
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Icon */}
                                    <div
                                        className="h-9 w-9 rounded-lg flex items-center justify-center mb-auto"
                                        style={{ backgroundColor: 'var(--color-interact-subtle)', color: 'var(--color-interact)' }}
                                    >
                                        <Zap className="h-4.5 w-4.5" />
                                    </div>

                                    {/* Content at bottom */}
                                    <div className="mt-3">
                                        <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                                            {session.name}
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                            {new Date(session.createdAt).toLocaleDateString()} &middot; 8 concepts
                                            {session.status !== "COMPLETE" && (
                                                <span className="inline-flex items-center gap-1 ml-1">
                                                    &middot; <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> {session.status}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/projects/\[projectId\]/sub/\[subProjectId\]/page.tsx
git commit -m "feat: add Ideation tab and card grid to workspace hub"
```

---

## Task 7: UI — Ideation Setup Page (New Ideation)

**Files:**
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/ideation/new/page.tsx`

- [ ] **Step 1: Create the setup page**

Create `src/app/projects/[projectId]/sub/[subProjectId]/ideation/new/page.tsx`:

```tsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Loader2,
    Zap,
    Network,
    Users,
    Check,
    AlertCircle,
    Sparkles,
} from "lucide-react";

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

interface MappingSessionOption {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { transcripts: number; clusters: number };
}

interface ProfileOption {
    id: string;
    name: string;
    description: string;
    type: "archetype" | "kb_global" | "kb_project";
    kicker?: string | null;
}

const CREATIVE_MATRIX_ENABLERS = [
    { key: "technology_digital_media", label: "Technology & Digital Media" },
    { key: "events_programmes", label: "Events & Programmes" },
    { key: "internal_policies_procedures", label: "Internal Policies & Procedures" },
    { key: "public_policies_laws", label: "Public Policies & Laws" },
    { key: "games_competitions", label: "Games & Competitions" },
    { key: "mobile_wearable_tech", label: "Mobile & Wearable Tech" },
    { key: "social_media", label: "Social Media" },
    { key: "surprise_provocation", label: "Surprise & Provocation" },
    { key: "health_wellness", label: "Health & Wellness" },
    { key: "accessories", label: "Accessories" },
    { key: "physical_variation", label: "Physical Variation" },
    { key: "people_partnerships", label: "People & Partnerships" },
    { key: "hotspots_hangouts", label: "Hotspots & Hangouts" },
    { key: "engage_senses", label: "Engage Senses" },
    { key: "shows_videos", label: "Shows & Videos" },
    { key: "celebrities_superstars", label: "Celebrities & Superstars" },
];

export default function NewIdeationPage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Pre-fill from query params (for regeneration)
    const prefillMappingId = searchParams.get("mappingId") || "";
    const prefillProfileIds = searchParams.get("profileIds")?.split(",").filter(Boolean) || [];
    const prefillFocusAreas = searchParams.get("focusAreas")?.split(",").filter(Boolean) || [];

    const [mappingSessions, setMappingSessions] = useState<MappingSessionOption[]>([]);
    const [profiles, setProfiles] = useState<ProfileOption[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form state
    const [selectedMappingId, setSelectedMappingId] = useState(prefillMappingId);
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(prefillProfileIds);
    const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(prefillFocusAreas);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationPhase, setGenerationPhase] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const PHASES = [
        "Reading mapping data & profiles...",
        "Analysing research patterns...",
        "Applying creative matrix lenses...",
        "Generating 8 concepts...",
        "Generating concept images...",
    ];

    useEffect(() => {
        fetchData();
    }, [subProjectId]);

    // Phase animation
    useEffect(() => {
        if (!isGenerating) return;
        const interval = setInterval(() => {
            setGenerationPhase(prev => (prev + 1) % PHASES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    async function fetchData() {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const sp = data.data;

            // Completed mapping sessions
            const completedMappings = (sp.mappingSessions || []).filter(
                (m: MappingSessionOption) => m.status === "COMPLETE"
            );
            setMappingSessions(completedMappings);

            // Profiles: archetypes from archetype sessions
            const archetypeProfiles: ProfileOption[] = [];
            for (const session of sp.archetypeSessions || []) {
                for (const arch of session.archetypes || []) {
                    archetypeProfiles.push({
                        id: arch.id,
                        name: arch.name,
                        description: arch.kicker || arch.description || "",
                        type: "archetype",
                        kicker: arch.kicker,
                    });
                }
            }

            // Fetch KB personas (global + project)
            const kbProfiles: ProfileOption[] = [];
            try {
                const kbRes = await fetch(`/api/sub-projects/${subProjectId}/ideations?fetchProfiles=true`);
                // We'll handle this via a separate lightweight endpoint or inline
                // For now, fetch from the knowledge base API
            } catch { /* handled below */ }

            // Fetch global KB personas
            try {
                const globalRes = await fetch("/api/archetypes/kb-personas");
                if (globalRes.ok) {
                    const globalData = await globalRes.json();
                    for (const doc of globalData.data || []) {
                        kbProfiles.push({
                            id: doc.id,
                            name: doc.title,
                            description: doc.parsedMetaJson ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.name || ""; } catch { return ""; } })() : "",
                            type: "kb_global",
                        });
                    }
                }
            } catch { /* skip */ }

            // Fetch project KB personas
            try {
                const projRes = await fetch(`/api/archetypes/kb-personas?projectId=${sp.project.id}`);
                if (projRes.ok) {
                    const projData = await projRes.json();
                    for (const doc of projData.data || []) {
                        kbProfiles.push({
                            id: doc.id,
                            name: doc.title,
                            description: doc.parsedMetaJson ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.name || ""; } catch { return ""; } })() : "",
                            type: "kb_project",
                        });
                    }
                }
            } catch { /* skip */ }

            setProfiles([...archetypeProfiles, ...kbProfiles]);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoadingData(false);
        }
    }

    function toggleProfile(id: string) {
        setSelectedProfileIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    }

    function toggleFocusArea(key: string) {
        setSelectedFocusAreas(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }

    async function handleGenerate() {
        if (!selectedMappingId) return;
        setIsGenerating(true);
        setError(null);
        setGenerationPhase(0);

        try {
            // 1. Create session
            const createRes = await fetch(`/api/sub-projects/${subProjectId}/ideations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mappingId: selectedMappingId,
                    profileIds: selectedProfileIds,
                    focusAreas: selectedFocusAreas,
                }),
            });

            if (!createRes.ok) {
                const err = await createRes.json();
                throw new Error(err.error || "Failed to create session");
            }

            const { data: session } = await createRes.json();

            // 2. Trigger generation
            const genRes = await fetch(
                `/api/sub-projects/${subProjectId}/ideations/${session.id}/generate`,
                { method: "POST" }
            );

            if (!genRes.ok) {
                const err = await genRes.json();
                throw new Error(err.error || "Generation failed");
            }

            // 3. Redirect to results
            router.push(`/projects/${projectId}/sub/${subProjectId}/ideation/${session.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsGenerating(false);
        }
    }

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Generation loading screen
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
                <div className="relative">
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-interact-subtle)' }}>
                        <Zap className="h-10 w-10 animate-pulse" style={{ color: 'var(--color-interact)' }} />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-foreground">Generating Ideation</h2>
                    <p className="text-sm text-muted-foreground animate-pulse">
                        {PHASES[generationPhase]}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
                    This may take up to 2 minutes as we generate 8 concepts with illustrations.
                </p>
            </div>
        );
    }

    const hasCompletedMappings = mappingSessions.length > 0;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to workspace
                </Link>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-interact-subtle)' }}>
                        <Zap className="h-5 w-5" style={{ color: 'var(--color-interact)' }} />
                    </div>
                    New Ideation — Crazy 8s
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Generate 8 creative design concepts grounded in your research data.
                </p>
            </div>

            {!hasCompletedMappings ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Network className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Completed Mappings</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Complete a mapping session first to use Ideation. The AI needs clustered interview data to generate meaningful concepts.
                        </p>
                        <Link href={`/projects/${projectId}/sub/${subProjectId}/map/new`}>
                            <Button className="mt-4" variant="outline">
                                <Network className="h-4 w-4 mr-2" /> Create a Mapping
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* 1. Select Mapping */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Select Mapping <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid gap-2">
                            {mappingSessions.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMappingId(m.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                        selectedMappingId === m.id
                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20"
                                            : "border-border bg-card hover:bg-muted/50"
                                    }`}
                                >
                                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-knowledge-subtle)', color: 'var(--color-knowledge)' }}>
                                        {selectedMappingId === m.id ? <Check className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {new Date(m.createdAt).toLocaleDateString()} &middot; {m._count.transcripts} files &middot; {m._count.clusters} clusters
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Select Profiles */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Select Profiles <span className="text-muted-foreground font-normal normal-case">(optional, multi-select)</span>
                        </Label>

                        {profiles.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-border bg-muted/30">
                                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                    No profiles available. Concepts will be based on mapping data and project context only.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Generated Profiles */}
                                {profiles.filter(p => p.type === "archetype").length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Generated Profiles</p>
                                        <div className="grid gap-2">
                                            {profiles.filter(p => p.type === "archetype").map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => toggleProfile(p.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                                        selectedProfileIds.includes(p.id)
                                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20"
                                                            : "border-border bg-card hover:bg-muted/50"
                                                    }`}
                                                >
                                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        selectedProfileIds.includes(p.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                                                    }`}>
                                                        {selectedProfileIds.includes(p.id) && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                                                        {p.kicker && <p className="text-[11px] text-muted-foreground truncate">{p.kicker}</p>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* KB Personas */}
                                {profiles.filter(p => p.type !== "archetype").length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Knowledge Base Personas</p>
                                        <div className="grid gap-2">
                                            {profiles.filter(p => p.type !== "archetype").map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => toggleProfile(p.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                                        selectedProfileIds.includes(p.id)
                                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20"
                                                            : "border-border bg-card hover:bg-muted/50"
                                                    }`}
                                                >
                                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        selectedProfileIds.includes(p.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                                                    }`}>
                                                        {selectedProfileIds.includes(p.id) && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                                                        <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedProfileIds.length === 0 && (
                                    <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" />
                                        No profiles selected — concepts will be based on mapping data only
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* 3. Focus Areas */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Creative Focus Areas <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground -mt-1">
                            Select creative lenses to guide concept generation. If none selected, the AI will consider all and pick the most relevant.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {CREATIVE_MATRIX_ENABLERS.map((enabler) => (
                                <button
                                    key={enabler.key}
                                    onClick={() => toggleFocusArea(enabler.key)}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left text-xs ${
                                        selectedFocusAreas.includes(enabler.key)
                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20 font-semibold text-foreground"
                                            : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                                    }`}
                                >
                                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        selectedFocusAreas.includes(enabler.key) ? "border-primary bg-primary" : "border-muted-foreground/30"
                                    }`}>
                                        {selectedFocusAreas.includes(enabler.key) && <Check className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                    {enabler.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!selectedMappingId || isGenerating}
                        className="w-full h-12 text-base font-bold rounded-xl"
                        style={{ backgroundColor: 'var(--color-interact)' }}
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Ideate — Generate 8 Concepts
                    </Button>
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/projects/\[projectId\]/sub/\[subProjectId\]/ideation/new/
git commit -m "feat: add ideation setup page with mapping, profile, and focus area selection"
```

---

## Task 8: UI — Ideation Results Page (8-Card Grid + Detail Overlay)

**Files:**
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/ideation/[sessionId]/page.tsx`

- [ ] **Step 1: Create the results page**

Create `src/app/projects/[projectId]/sub/[subProjectId]/ideation/[sessionId]/page.tsx`:

```tsx
"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Loader2,
    Zap,
    X,
    RefreshCw,
    Users,
    AlertTriangle,
    Target,
    Lightbulb,
    FlaskConical,
    BarChart3,
    ImageOff,
} from "lucide-react";

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string; sessionId: string }>;
}

interface IdeationConcept {
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

interface IdeationSession {
    id: string;
    name: string;
    status: string;
    sourceMappingId: string;
    sourceProfileIdsJson: string | null;
    focusAreasJson: string | null;
    resultJson: string | null;
    createdAt: string;
}

export default function IdeationResultsPage({ params }: PageProps) {
    const { projectId, subProjectId, sessionId } = use(params);
    const [session, setSession] = useState<IdeationSession | null>(null);
    const [concepts, setConcepts] = useState<IdeationConcept[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConcept, setSelectedConcept] = useState<IdeationConcept | null>(null);

    useEffect(() => {
        fetchSession();
    }, [sessionId]);

    async function fetchSession() {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/ideations`);
            if (!res.ok) throw new Error("Failed to fetch");
            const { data } = await res.json();
            const found = data.find((s: IdeationSession) => s.id === sessionId);
            if (!found) throw new Error("Session not found");

            // Need full session data with resultJson — fetch individually
            const fullRes = await fetch(`/api/sub-projects/${subProjectId}/ideations/${sessionId}`);
            if (fullRes.ok) {
                const fullData = await fullRes.json();
                setSession(fullData.data);
                if (fullData.data.resultJson) {
                    setConcepts(JSON.parse(fullData.data.resultJson));
                }
            } else {
                // Fallback: session exists but no detail endpoint yet — use list data
                setSession(found);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }

    function handleRegenerate() {
        const profileIds = session?.sourceProfileIdsJson ? JSON.parse(session.sourceProfileIdsJson).join(",") : "";
        const focusAreas = session?.focusAreasJson ? JSON.parse(session.focusAreasJson).join(",") : "";
        const params = new URLSearchParams();
        if (session?.sourceMappingId) params.set("mappingId", session.sourceMappingId);
        if (profileIds) params.set("profileIds", profileIds);
        if (focusAreas) params.set("focusAreas", focusAreas);
        window.location.href = `/projects/${projectId}/sub/${subProjectId}/ideation/new?${params.toString()}`;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-destructive">{error || "Session not found"}</p>
                <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}>
                    <Button variant="outline">Back to workspace</Button>
                </Link>
            </div>
        );
    }

    if (session.status !== "COMPLETE" || concepts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Zap className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                    {session.status === "PROCESSING" ? "Generation in progress..." :
                     session.status === "ERROR" ? "Generation failed. Please try again." :
                     "No concepts generated yet."}
                </p>
                <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}>
                    <Button variant="outline">Back to workspace</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-interact-subtle)' }}>
                        <Zap className="h-4 w-4" style={{ color: 'var(--color-interact)' }} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-foreground">{session.name}</h1>
                        <p className="text-[11px] text-muted-foreground">
                            {new Date(session.createdAt).toLocaleDateString()} &middot; 8 concepts
                        </p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-2">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate
                </Button>
            </div>

            {/* Regeneration Note */}
            <div className="px-6 py-2 bg-muted/30 border-b border-border flex-shrink-0">
                <p className="text-[11px] text-muted-foreground text-center">
                    Regeneration will create a separate ideation batch. Your current batch will remain accessible.
                </p>
            </div>

            {/* 8-Card Grid — 4x2, fits screen */}
            <div className="flex-1 p-6 overflow-hidden">
                <div className="grid grid-cols-4 grid-rows-2 gap-4 h-full">
                    {concepts.map((concept, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedConcept(concept)}
                            className="group rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 p-4 flex flex-col cursor-pointer overflow-hidden text-left"
                        >
                            {/* Concept Name */}
                            <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-2 flex-shrink-0">
                                {concept.name}
                            </h3>

                            {/* Generated Image */}
                            <div className="flex-1 min-h-0 rounded-lg overflow-hidden bg-muted/50 mb-2">
                                {concept.howItWorks.imageBase64 ? (
                                    <img
                                        src={`data:image/png;base64,${concept.howItWorks.imageBase64}`}
                                        alt={concept.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>

                            {/* Tagline */}
                            <p className="text-[11px] text-muted-foreground line-clamp-2 flex-shrink-0">
                                {concept.tagline}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail Overlay */}
            {selectedConcept && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        {/* Overlay Header */}
                        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-8 py-5 flex items-center justify-between rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold text-foreground">{selectedConcept.name}</h2>
                            <button
                                onClick={() => setSelectedConcept(null)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="px-8 py-6 space-y-8">
                            {/* Row 2: Who / What / Big Idea */}
                            <div className="grid grid-cols-3 gap-6">
                                <DetailCard
                                    icon={<Users className="h-4 w-4" />}
                                    title="Who is it for?"
                                    text={selectedConcept.whoIsItFor.text}
                                    source={selectedConcept.whoIsItFor.source}
                                    reason={selectedConcept.whoIsItFor.reason}
                                />
                                <DetailCard
                                    icon={<Target className="h-4 w-4" />}
                                    title="What problem does it solve?"
                                    text={selectedConcept.whatProblem.text}
                                    source={selectedConcept.whatProblem.source}
                                    reason={selectedConcept.whatProblem.reason}
                                />
                                <DetailCard
                                    icon={<Lightbulb className="h-4 w-4" />}
                                    title="What is the big idea?"
                                    text={selectedConcept.bigIdea.text}
                                    source={selectedConcept.bigIdea.source}
                                    reason={selectedConcept.bigIdea.reason}
                                />
                            </div>

                            {/* Row 3: How does it work? */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Zap className="h-4 w-4" style={{ color: 'var(--color-interact)' }} />
                                    How does it work?
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="rounded-xl overflow-hidden bg-muted/50 border border-border aspect-square">
                                        {selectedConcept.howItWorks.imageBase64 ? (
                                            <img
                                                src={`data:image/png;base64,${selectedConcept.howItWorks.imageBase64}`}
                                                alt={selectedConcept.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageOff className="h-12 w-12 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-sm text-foreground leading-relaxed">
                                            {selectedConcept.howItWorks.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Fail / Prototype / Measure */}
                            <div className="grid grid-cols-3 gap-6">
                                <DetailCard
                                    icon={<AlertTriangle className="h-4 w-4" />}
                                    title="Why might it fail?"
                                    text={selectedConcept.whyMightItFail.text}
                                    source={selectedConcept.whyMightItFail.source}
                                    reason={selectedConcept.whyMightItFail.reason}
                                />
                                <DetailCard
                                    icon={<FlaskConical className="h-4 w-4" />}
                                    title="What should we prototype & test?"
                                    text={selectedConcept.whatToPrototype.text}
                                    source={selectedConcept.whatToPrototype.source}
                                    reason={selectedConcept.whatToPrototype.reason}
                                />
                                <DetailCard
                                    icon={<BarChart3 className="h-4 w-4" />}
                                    title="How might we measure success?"
                                    text={selectedConcept.howToMeasure.text}
                                    source={selectedConcept.howToMeasure.source}
                                    reason={selectedConcept.howToMeasure.reason}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailCard({ icon, title, text, source, reason }: {
    icon: React.ReactNode;
    title: string;
    text: string;
    source: string;
    reason: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                {icon}
                {title}
            </h4>
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
            <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                    <span className="font-semibold">Source:</span> {source}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                    <span className="font-semibold">Why:</span> {reason}
                </p>
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/projects/\[projectId\]/sub/\[subProjectId\]/ideation/\[sessionId\]/
git commit -m "feat: add ideation results page with 8-card grid and detail overlay"
```

---

## Task 9: API — Add GET Single Ideation Session Endpoint

The results page needs to fetch a single session with its full `resultJson`. Add a GET handler to the existing delete route file.

**Files:**
- Modify: `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/route.ts`

- [ ] **Step 1: Add GET handler**

In `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/route.ts`, add before the DELETE function:

```typescript
// GET /api/sub-projects/[subProjectId]/ideations/[ideationId]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { subProjectId, ideationId } = await params;

        const session = await prisma.ideationSession.findFirst({
            where: { id: ideationId, subProjectId },
        });

        if (!session) {
            return errorResponse("Ideation session not found", 404);
        }

        return successResponse(session);
    } catch (error) {
        console.error("[API] GET ideation session error:", error);
        return errorResponse("Failed to fetch ideation session", 500);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/sub-projects/\[subProjectId\]/ideations/\[ideationId\]/route.ts
git commit -m "feat: add GET endpoint for single ideation session with full resultJson"
```

---

## Task 10: Verify Build & Manual Test

- [ ] **Step 1: Run Prisma generate to ensure client is up to date**

Run:
```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 2: Run the Next.js build to check for type errors**

Run:
```bash
npx next build
```

Expected: Build succeeds with no type errors. If there are errors, fix them before proceeding.

- [ ] **Step 3: Fix any build errors found**

Address any TypeScript errors, missing imports, or type mismatches discovered during the build. Common issues to watch for:
- The `successResponse` helper may need a second status code argument for 201 responses — check `src/lib/validations.ts` for its signature
- The `imageBase64` field on the OpenAI response — verify the `gpt-image-1.5` model returns `b64_json` by default or if `response_format: "b64_json"` needs to be passed
- Any Prisma type mismatches after migration

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build errors in ideation feature"
```

---

## Task 11: Final Integration Commit

- [ ] **Step 1: Verify everything works together**

Run:
```bash
npx next build
```

Expected: Clean build, no errors.

- [ ] **Step 2: Create a summary commit if any loose changes remain**

```bash
git status
# If any unstaged changes:
git add -A
git commit -m "feat: complete ideation feature — Crazy 8s AI with gpt-image-1.5"
```
