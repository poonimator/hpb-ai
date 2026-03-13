# Focus Group Mode — Implementation Plan

## Overview
Add a "Focus Group" mode to archetype simulations where 2-4 archetypes participate in a shared conversation. The researcher sends messages and all (or tagged) archetypes respond. Archetypes may briefly react to each other, but the conversation is researcher-driven.

## Constraints
- Max 4 archetypes per focus group
- No mixer/persona settings in focus group mode (archetypes are self-contained)
- No moderator guide in focus group mode
- Existing 1:1 simulation is completely untouched
- Sequential responses (each archetype sees prior responses)
- `@` tagging to address specific archetypes
- Inter-archetype reactions allowed but strictly capped (no runaway conversations)

---

## Layer 1: Database ✅ DONE

### Simulation model — added:
- `isFocusGroup Boolean @default(false)`
- `simulationArchetypes SimulationArchetype[]` (reverse relation)

### New join table — created:
```prisma
model SimulationArchetype {
  id             String     @id @default(cuid())
  simulationId   String
  simulation     Simulation @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  archetypeId    String
  archetype      Archetype  @relation("FocusGroupArchetypes", fields: [archetypeId], references: [id])
  order          Int        @default(0)
  @@unique([simulationId, archetypeId])
}
```

### SimulationMessage model — added:
- `archetypeId String?` (which archetype authored this persona message)

### Archetype model — added:
- `focusGroupSessions SimulationArchetype[] @relation("FocusGroupArchetypes")` (reverse relation)

### Validation schema — updated:
- `StartSimulationSchema` now includes `isFocusGroup` and `archetypeIds` fields

---

## Layer 2: APIs ✅ DONE

### POST /api/simulations ✅
- Accepts `isFocusGroup: boolean` and `archetypeIds: string[]`
- Focus group: validates 2-4 archetypes exist, creates SimulationArchetype rows
- Skips persona/guide/mixer for focus groups
- Returns simulationArchetypes in response

### GET /api/simulations/[id] ✅
- Includes `simulationArchetypes` with full archetype details for resume

### POST /api/gemini/simulate ✅
- Complete rewrite supporting both modes
- Focus group path: loads all SimulationArchetypes, filters by targetArchetypeIds
- Sequential processing (each archetype sees prior responses)
- [NO_RESPONSE] filtering
- Returns `{ focusGroup: true, messages: [...] }`
- 1:1 path unchanged, extracted shared `assembleArchetypeContent()` helper

---

## Layer 3: Prompt ✅ DONE

### New file: `src/lib/ai/prompts/focus_group_simulation.ts`
- `buildFocusGroupPrompt()` function
- No mixer settings (archetypes are self-contained)
- Short responses by default (1-3 sentences)
- Group awareness (knows other participants by name)
- Selective silence ([NO_RESPONSE] when irrelevant)
- Strict inter-archetype guardrails (1 sentence, no debating)
- Labelled conversation history with speaker names

---

## Layer 4: Frontend Setup ✅ DONE

- New state: `isFocusGroup`, `selectedArchetypeIds[]`, `focusGroupArchetypes`, `showAtMention`
- Focus Group toggle switch in Settings panel (visible when archetypes exist)
- Multi-select archetype list with color-coded checkboxes
- Personas hidden when focus group mode is on
- Mixer and guide sections hidden when focus group mode is on
- Min 2, max 4 archetypes with counter
- "Start Focus Group (N)" button with Users icon
- Color palette: violet, amber, sky, rose (4 colors for 4 archetypes)

## Layer 5: Frontend Chat ✅ DONE

- Multi-avatar header with colored badges and participant count
- Per-archetype colored message bubbles (bg + border + text)
- Archetype name label on each persona message
- @ autocomplete dropdown (triggered by typing '@')
- Tag-to-insert: `@ArchetypeName ` inserted at cursor
- Focus group typing indicator with stacked colored avatars + "Group is responding..."
- 300ms stagger between archetype messages for readability
- Resume support: restores focus group state + annotates existing messages with archetype names

## Layer 6: Sub-project cards

- TODO: Show "Focus Group" as simulation type on session history cards
- TODO: List archetype names underneath in history view
