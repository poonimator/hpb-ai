# Ideation Feature — Crazy 8s AI Design Spec

**Date:** 2026-04-14
**Branch:** `ideation-agent`
**Status:** Approved

---

## Overview

Add an "Ideation" tab to the workspace hub (between Profiles and How Might We) that uses the Crazy 8s design thinking framework to generate 8 distinct concepts from mapping data, selected profiles, and project context. Each concept includes AI-generated visuals via `gpt-image-1.5`.

---

## 1. Data Model

### New: `IdeationSession`

```prisma
model IdeationSession {
  id                  String     @id @default(cuid())
  subProjectId        String
  subProject          SubProject @relation(fields: [subProjectId], references: [id], onDelete: Cascade)
  name                String
  status              String     @default("SETUP") // "SETUP" | "PROCESSING" | "COMPLETE" | "ERROR"
  sourceMappingId     String
  sourceProfileIdsJson String?   // JSON array of archetype IDs + KB persona doc IDs
  focusAreasJson      String?    // JSON array of selected creative matrix enabler keys
  resultJson          String?    // JSON array of 8 concept objects (see schema below)
  modelName           String?
  imageModelName      String?    // "gpt-image-1.5"
  latencyMs           Int?
  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  @@index([subProjectId, createdAt])
}
```

### Modified: `SubProject`

Add relation:
```prisma
ideationSessions IdeationSession[]
```

### Concept Object Schema (stored in `resultJson`)

```json
[
  {
    "name": "Concept Name",
    "tagline": "Brief one-liner for card preview",
    "whoIsItFor": { "text": "...", "source": "...", "reason": "..." },
    "whatProblem": { "text": "...", "source": "...", "reason": "..." },
    "bigIdea": { "text": "...", "source": "...", "reason": "..." },
    "howItWorks": {
      "description": "Vivid 50-100 word visual description",
      "imageBase64": "base64-encoded PNG",
      "imageTextLabels": ["optional", "exact", "words"]
    },
    "whyMightItFail": { "text": "...", "source": "...", "reason": "..." },
    "whatToPrototype": { "text": "...", "source": "...", "reason": "..." },
    "howToMeasure": { "text": "...", "source": "...", "reason": "..." }
  }
]
```

Fields with `source` and `reason` cite back to a specific mapping theme, profile trait, or insight finding with a 1-sentence justification.

---

## 2. API Routes

### `GET /api/sub-projects/[subProjectId]/ideations`
- Returns all ideation sessions for the workspace
- Includes `_count` metadata

### `POST /api/sub-projects/[subProjectId]/ideations`
- Body: `{ mappingId, profileIds[], focusAreas[] }`
- Creates session with status `SETUP`
- Returns session ID

### `DELETE /api/sub-projects/[subProjectId]/ideations/[ideationId]`
- Deletes session and all associated data

### `POST /api/sub-projects/[subProjectId]/ideations/[ideationId]/generate`
- Triggers the AI pipeline (see Section 5)
- Updates session status: SETUP → PROCESSING → COMPLETE/ERROR
- Returns full resultJson on success

### Modified: `GET /api/sub-projects/[subProjectId]`
- Include `ideationSessions` in response with `_count`

---

## 3. UI: Tab Integration

**File:** `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`

### Tab Button
- Position: between "Profiles" and "How Might We"
- Label: "Ideation"
- Icon: `Zap` (lucide-react)
- Color: `var(--color-interact)` / `var(--color-interact-subtle)`
- Tab state value: `"ideation"`
- Badge: count of `ideationSessions`

### Card Grid
- "New Ideation" dashed card → links to `/ideation/new`
  - Icon: Zap
  - Text: "New Ideation" / "Generate concepts using the Crazy 8s framework"
- Existing session cards:
  - Zap icon with interact color
  - Session name
  - Date + "8 concepts" metadata
  - Delete button on hover

### Type Updates
- Add `"ideation"` to `activeContentTab` union type
- Add `IdeationSessionInfo` interface
- Add `ideationSessions` to `SubProject` interface

---

## 4. UI: Setup Page

**File:** `src/app/projects/[projectId]/sub/[subProjectId]/ideation/new/page.tsx`

Single-page form with sections:

### 4a. Select Mapping (required)
- Dropdown of completed mapping sessions (status=COMPLETE)
- Shows: mapping name + date + file count
- Single select

### 4b. Select Profiles (optional, multi-select)
Two groups displayed as checklist:
- **"Generated Profiles"** — archetypes from workspace's archetype sessions
- **"Knowledge Base Personas"** — persona docs from global KB (`KbDocument` docType=PERSONA) + project KB (`ProjectKbDocument` docType=PERSONA)
- Warning shown if no profiles selected: "No profiles selected — concepts will be based on mapping data only"

### 4c. Focus Areas (optional, multi-select checkboxes)
The 16 creative matrix enablers:
1. Technology & Digital Media
2. Events & Programmes
3. Internal Policies & Procedures
4. Public Policies & Laws
5. Games & Competitions
6. Mobile & Wearable Tech
7. Social Media
8. Surprise & Provocation
9. Health & Wellness
10. Accessories
11. Physical Variation
12. People & Partnerships
13. Hotspots & Hangouts
14. Engage Senses
15. Shows & Videos
16. Celebrities & Superstars

If none selected, AI considers all but picks only relevant ones.

### 4d. "Ideate" Button
- Creates session via POST, triggers generate, shows loading state
- Loading: spinner + "Generating 8 concepts..." → "Generating concept images..."
- On success: redirect to results page

### Edge Cases
- No completed mappings → empty state: "Complete a mapping session first to use Ideation"

---

## 5. UI: Results Page

**File:** `src/app/projects/[projectId]/sub/[subProjectId]/ideation/[sessionId]/page.tsx`

### 5a. 8-Idea Grid (main view)
- Layout: 4 columns × 2 rows, all visible without scrolling
- Each card shows:
  - **Concept name** (top, bold)
  - **Generated image** (middle, scaled to fit)
  - **Tagline** (bottom, muted text)
- Cards are clickable

### 5b. Concept Detail Overlay (on card click)
Full-screen overlay/modal with:
- **Row 1:** Name of concept (large heading)
- **Row 2:** Three columns:
  - "Who is it for?" — text + source citation + reason
  - "What problem does it solve?" — text + source citation + reason
  - "What is the big idea?" — text + source citation + reason
- **Row 3:** "How does it work?"
  - Generated image displayed prominently
  - Description text below
- **Row 4:** Three columns:
  - "Why might it fail?" — text + source citation + reason
  - "What should we prototype & test?" — text + source citation + reason
  - "How might we measure success?" — text + source citation + reason
- Close button (X) to dismiss

### 5c. Regenerate Button
- Positioned at bottom of results page
- Note text: "Regeneration will create a separate ideation batch. Your current batch will remain accessible."
- On click: redirects to `/ideation/new` pre-filled with same mapping, profiles, and focus areas
- New generation saves as a separate `IdeationSession` / separate card

---

## 6. AI Pipeline

### Step 1: Text Generation (single call)

**Model:** `gpt-5.2`
**Response format:** `{ type: "json_object" }`

**Prompt structure:**
1. System message: guardrails + role ("Design thinking ideation expert using Crazy 8s framework")
2. Context block:
   - Project: name, description, research statement, age range, life stage
   - Mapping: all clusters grouped by theme (quote + context + transcript source)
   - Insights (if available): found_out, look_further, new_areas with citations
   - Profiles: name, description, demographics, goals, motivations, ground truth, spiral
   - KB personas: extracted text / parsed metadata
3. Creative matrix enablers: selected focus areas with sub-categories (or all 16 if none selected, with instruction to pick relevant ones)
4. Output instructions:
   - Exactly 8 distinct concepts
   - Mix of categories (digital, physical, hybrid, policy, event, etc.) — only where genuinely appropriate
   - Each field (except name and howItWorks) must cite source + 1-sentence reason
   - `howItWorks.description`: vivid, visual, 50-100 words (serves as image prompt)
   - `howItWorks.imageTextLabels`: array of exact text strings if text is needed in image, else empty
   - Return JSON matching the concept object schema

### Step 2: Image Generation (8 parallel calls)

**Model:** `gpt-image-1.5`
**Size:** 1024×1024
**Output:** base64

**Prompt per concept:**
```
Create a clean, professional concept illustration for: [concept name].
[howItWorks.description].
Style: Modern design thinking concept sketch, clean lines, muted professional color palette.
[If imageTextLabels empty: "No text or words in the image."]
[If imageTextLabels present: "Include only these exact words: [labels]"]
```

### Step 3: Merge & Save
- Inject `imageBase64` into each concept's `howItWorks` field
- Save full array as `resultJson`
- Update status to `COMPLETE`

---

## 7. Loading & Error States

### During Generation
- Full-page loading with animated spinner
- Text updates: "Generating 8 concepts..." → "Generating concept images..."
- Synchronous fetch (Approach A)

### Error Handling
- Text generation fails → status `ERROR`, show error + "Try Again" button
- Some images fail → save with `null` for failed images, show placeholder icon on cards, offer "Retry image" option
- API timeout: 180s

### Edge Cases
- No completed mappings → setup page shows empty state message
- No profiles selected → warning but allow proceeding (AI uses mapping + project context only)
- Mapping has no insights → fine, use cluster data only

---

## 8. Files to Create

| File | Purpose |
|------|---------|
| `src/app/projects/[projectId]/sub/[subProjectId]/ideation/new/page.tsx` | Setup page |
| `src/app/projects/[projectId]/sub/[subProjectId]/ideation/[sessionId]/page.tsx` | Results page |
| `src/app/api/sub-projects/[subProjectId]/ideations/route.ts` | GET + POST |
| `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/route.ts` | DELETE |
| `src/app/api/sub-projects/[subProjectId]/ideations/[ideationId]/generate/route.ts` | AI pipeline |

## 9. Files to Modify

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `IdeationSession` model, add relation on `SubProject` |
| `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx` | Add ideation tab, card grid, interfaces, handlers |
| `src/app/api/sub-projects/[subProjectId]/route.ts` | Include `ideationSessions` in GET response |
| `src/lib/ai/openai.ts` | Add `generateIdeation()` and `generateConceptImage()` functions |
