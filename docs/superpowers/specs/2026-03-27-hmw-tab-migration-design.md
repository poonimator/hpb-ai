# HMW Tab Migration Design

Move the "How Might We" feature from a standalone button into the workspace tab system, and migrate critique storage from localStorage to the database.

## 1. Database Model

New `HmwCritique` model in `prisma/schema.prisma`:

```prisma
model HmwCritique {
  id              String     @id @default(cuid())
  subProjectId    String
  subProject      SubProject @relation(fields: [subProjectId], references: [id], onDelete: Cascade)
  hmwStatement    String     // Also present inside critiqueJson; top-level for query convenience
  overallVerdict  String     // "PASS" | "NEEDS_WORK" | "FAIL" (overall only; lens-level uses "PARTIAL" not "NEEDS_WORK")
  critiqueJson    String     // Full HMWCritiqueResult JSON (lenses, research alignment, highlights)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([subProjectId, createdAt])
}
```

Add `hmwCritiques HmwCritique[]` relation to the `SubProject` model.

## 2. API Layer

### New: `GET /api/sub-projects/[subProjectId]/hmw-critiques`

Returns all HMW critiques for a subProject ordered by `createdAt` desc. Selects `id`, `hmwStatement`, `overallVerdict`, `createdAt` for the list view.

### New: `DELETE /api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]`

Deletes a single critique by ID. Follows the nested resource pattern used by other delete endpoints (e.g., `DELETE /api/archetypes/single/[archetypeId]`).

### Modified: `GET /api/sub-projects/[subProjectId]` (existing workspace data endpoint)

Add `hmwCritiques` to the Prisma `include` block (selecting `id`, `hmwStatement`, `overallVerdict`, `createdAt`). Add `hmwCritiques: true` to the `_count.select` block. This ensures HMW data loads with the single workspace fetch, consistent with how guides, simulations, mapping, and archetypes load.

### Modified: `POST /api/gemini/hmw-critique`

- After AI critique completes, persist the result to `HmwCritique` table.
- Return the saved record's `id` as a sibling field in the response: `{ success, data, savedId, disclaimer, modelName, latencyMs }`.

## 3. Tab System Changes

### Workspace page (`sub/[subProjectId]/page.tsx`)

- Add `"hmw"` to the tab type union: `"guides" | "simulations" | "mapping" | "archetypes" | "hmw"`.
- Extend the `SubProject` TypeScript interface to include `hmwCritiques: Array<{ id: string; hmwStatement: string; overallVerdict: string; createdAt: string }>` and add `hmwCritiques: number` to the `_count` type.
- New tab button labeled **HOW MIGHT WE** with `Lightbulb` icon, positioned after PROFILES.
- Shows count badge matching other tabs.
- Remove the standalone HMW button from the top-right header.

### Tab content — card grid

- **"Create New" card** (first position): links to `/projects/${projectId}/sub/${subProjectId}/hmw`. Styled like "Generate Profiles" card.
- **Critique cards**: Each shows verdict badge (green PASS / amber NEEDS_WORK / red FAIL), truncated HMW statement (~2 lines), timestamp, delete button on hover.
- Clicking a card navigates to `/projects/${projectId}/sub/${subProjectId}/hmw?scrollTo=${critiqueId}`.
- Delete calls `DELETE /api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]` then refreshes local state.

### HMW page (`hmw/page.tsx`)

- Remove all localStorage read/write (`loadHistory`, `saveHistory`, `STORAGE_KEY_PREFIX`, related useEffects).
- Fetch critique history from `GET /api/sub-projects/[subProjectId]/hmw-critiques` on mount.
- On mount, check for `?scrollTo=` query param and scroll to that critique element.
- Add `id` attributes to each critique card for scroll targeting.
- After new critique submission, the API now persists to DB and returns `savedId`; refresh list from API.
- `handleDelete` becomes async: calls `DELETE /api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]`, then refreshes list.
- One-time cleanup: call `localStorage.removeItem` for the old storage key on mount to clean up stale data.

## 4. Data Migration

No migration of existing localStorage data. Users start fresh with DB-backed critiques. The HMW page performs a one-time `localStorage.removeItem` to clean up stale keys.

## 5. Files to Modify

1. `prisma/schema.prisma` — Add HmwCritique model + SubProject relation
2. `src/app/api/sub-projects/[subProjectId]/hmw-critiques/route.ts` — New GET endpoint
3. `src/app/api/sub-projects/[subProjectId]/hmw-critiques/[critiqueId]/route.ts` — New DELETE endpoint
4. `src/app/api/sub-projects/[subProjectId]/route.ts` — Add hmwCritiques to include + _count
5. `src/app/api/gemini/hmw-critique/route.ts` — Persist to DB after critique, return savedId
6. `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx` — Add HMW tab, extend SubProject interface, remove standalone button, render critique cards
7. `src/app/projects/[projectId]/sub/[subProjectId]/hmw/page.tsx` — Replace localStorage with API, add scroll-to support, async delete, localStorage cleanup
