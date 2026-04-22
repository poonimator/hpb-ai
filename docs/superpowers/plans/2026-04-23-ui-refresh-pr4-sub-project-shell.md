# UI Refresh — PR 4 (Sub-Project Shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 3 sub-project shell routes (`/sub/new`, `/sub/[subProjectId]`, `/sub/[subProjectId]/edit`) to the new design system. The biggest surface is the sub-project home (~1330 lines) — it becomes the second workspace to adopt `<WorkspaceFrame>` after the Moderator Guide, replaces hand-rolled ring-based tabs with `<Tabs>` (underline style), and migrates 7 `confirm()` dialogs to `<AlertDialog>`. Form routes standardise to `max-w-[640px]`, adopt `PageBar`, and eliminate `alert()` calls.

**Architecture:** Same token-first + exploration-fidelity approach as PR 3.5. Carry forward every visual decision locked in during PR 3.5: exact `#f5f5f5` canvas, rail `px-6` padding, edge-to-edge PageBar/WorkspaceFrame, `text-display-1` hero pattern, soft-tinted inactive indicators with solid-filled active, ring-based selected state (not borders), content adaptation (not verbatim copy) from exploration labels. Sub-project home adopts the `variant="platform"` WorkspaceFrame with 280px left rail holding sub-project meta + tool counts, main column holding the `<Tabs>` + content grids. The internal tool-specific card rendering (guide cards, simulation cards, archetype cards, etc.) stays structurally unchanged in PR 4 — those screens get rebuilt in PR 5.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui (amber-tokened), Sonner (toasts). All primitives already shipped in PR 1–3.5.

**Spec reference:** [docs/superpowers/specs/2026-04-22-ui-elevenlabs-refresh-design.md](../specs/2026-04-22-ui-elevenlabs-refresh-design.md)

---

## Design decisions carried forward from PR 3.5 (non-negotiable)

1. **Canvas:** `--canvas: #f5f5f5` exactly (already set globally).
2. **Rails:** `RailHeader` = `px-6 pt-6 pb-5`; `RailSection` = `px-6 py-5` (already set).
3. **WorkspaceFrame** edge-to-edge via `w-screen ml-[calc(50%-50vw)]` (already set); rails use double-wrapper sticky so bg extends full row height (already set).
4. **PageBar** edge-to-edge, `py-[14px] px-8`, `text-[12.5px]` crumbs, last crumb `font-semibold`, `h-7 px-2.5` BackLink (already set).
5. **Hero** H1 = `text-display-1` (34px light, `letter-spacing -0.02em`). Description = `text-body` (13.5px), NOT `text-body-lg`. NO eyebrow if it duplicates the title or page context.
6. **Indicator chips** (feedback, research, tool accents): inactive = `bg-{color}-soft text-{color}` soft-tinted with subtle `shadow-inset-edge`; active = `bg-{color} text-white ring-2 ring-{color}/35 ring-offset-1 ring-offset-card shadow-[0_2px_8px_color-mix(...)]` solid fill.
7. **Tabs** use the underline style primitive (no hand-rolled `ring-1 ring-black/5` segmented wrappers).
8. **Active state** uses `ring-2 ring-offset-1`, never bordered wrappers around whole sections.
9. **Pulse animations** (when needed): `animate-[ping_1s_ease-out_1]` — single iteration.
10. **Content adaptation** — every label sourced from exploration files MUST be adapted to this page's domain. A label that makes sense for "opportunities" in an interview transcript does NOT make sense for tool counts on a sub-project home. Name things by what they ARE in our app.
11. **Save/Saved state** for any form with unsaved-change state: button shows `Save` (enabled) → `Saving…` (with spinner) → `Saved` (success-soft token, disabled) — the pattern from the Moderator Guide.
12. **Zero tolerance** in touched files: no `alert(`, no `confirm(`, no hex literals, no `bg-white` literals, no raw `text-red-*`/`text-blue-*`/`text-violet-*`/`text-amber-[0-9]+` (tokenise to `--danger`/`--info`/`--knowledge`/`--primary` or `--warning`).

---

## File map

- Modify: `src/app/projects/[projectId]/sub/new/page.tsx` (~296 lines)
- Modify: `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx` (~1330 lines — the big one)
- Modify: `src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx` (~339 lines)
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/loading.tsx`
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/error.tsx`
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/not-found.tsx`

No new shared primitives. All atoms used already exist.

---

## Task 1: Migrate `/projects/[projectId]/sub/new`

**Files:** `src/app/projects/[projectId]/sub/new/page.tsx`

**What this does:** Normalise form width to `max-w-[640px]`, adopt `<PageBar>`, replace `alert()` calls with `toast.error`, standardise typography.

- [ ] **Step 1: Read the current file**

```bash
cat "src/app/projects/[projectId]/sub/new/page.tsx"
```

Note the state hooks, submit handler, and any `alert()` / hand-rolled back link / hero block.

- [ ] **Step 2: Add imports**

Near the top of the file:

```tsx
import { toast } from "sonner"
import { PageBar } from "@/components/layout/page-bar"
```

Remove any now-unused imports after the rest of the task.

- [ ] **Step 3: Replace any `alert()` calls with `toast.error`**

Grep the file:
```bash
grep -n "alert(" "src/app/projects/[projectId]/sub/new/page.tsx"
```

For each site, e.g.:
- `alert("Please fill in all required fields")` → `toast.error("Please fill in all required fields")`
- `alert(err instanceof Error ? err.message : "Failed to create sub-project")` → `toast.error(err instanceof Error ? err.message : "Failed to create workspace")`

Note: use **"workspace"** terminology in user-facing copy. The DB model is `SubProject` but users see "workspace".

- [ ] **Step 4: Add `<PageBar>` at the top**

Replace any free-floating back link (typically `<Link href="...">← Back</Link>`) with:

```tsx
<PageBar
  back={{ href: `/projects/${projectId}`, label: "Back" }}
  crumbs={
    project?.name
      ? [
          { label: project.name, href: `/projects/${projectId}` },
          { label: "New workspace" },
        ]
      : undefined
  }
/>
```

If `project` isn't yet in state, either fetch it (mirror the pattern in `/sub/[subProjectId]/edit`) or use simpler crumbs:

```tsx
crumbs={[{ label: "New workspace" }]}
```

Pick the simpler crumb array if wiring a project fetch in this file would be net-new work.

- [ ] **Step 5: Normalise outer wrapper + form width**

Replace the outer wrapper:

```tsx
<div className="py-8">
  <div className="w-full max-w-4xl mx-auto">
```

With:

```tsx
<div className="pt-6 pb-20">
  <div className="max-w-[640px] mx-auto">
```

Remove any nested `max-w-3xl`. The new constraint is a single `max-w-[640px]` — the spec's standard form width.

- [ ] **Step 6: Normalise hero block**

Find the page hero (typically a block with an icon tile + `<h1 className="text-3xl ...">` + description `<p>`). Replace with:

```tsx
<div className="flex flex-col gap-2 mb-8">
  <h1 className="text-display-1 text-foreground">Create new workspace</h1>
  <p className="text-body text-muted-foreground">
    A workspace is where you organise one research stream — its moderator guide, simulations, and synthesis live here.
  </p>
</div>
```

Drop any decorative icon tile that preceded the heading. Drop any `"Setup"` or `"New"` eyebrow — they'd duplicate the title.

- [ ] **Step 7: Card structure**

Wrap the form fields in `<Card>` with consistent `p-8`:

```tsx
<Card>
  <CardContent className="p-8">
    {/* form fields */}
  </CardContent>
</Card>
```

Move any existing hero content OUT of the Card so the card is purely form fields + actions footer.

- [ ] **Step 8: Verify existing checkbox / toggle affordances**

If life-stage or similar multi-selects use hand-rolled `<div className="...">` toggles, replace each with the primitive:

```tsx
<label className="flex items-center gap-2 text-body-sm">
  <Checkbox
    checked={selectedStages.includes(stage)}
    onCheckedChange={(checked) => {
      setSelectedStages(prev =>
        checked === true ? [...prev, stage] : prev.filter(s => s !== stage)
      )
    }}
  />
  {stage.label}
</label>
```

Import `Checkbox` from `@/components/ui/checkbox` if it isn't already. If the page already uses `<Checkbox>`, skip this step.

- [ ] **Step 9: Actions footer styling**

The form should have a footer row at the bottom of the card with `border-t` above it. Ensure the primary submit button uses the default `<Button>` (no size override unless needed), and the cancel/secondary uses `<Button variant="outline">`. Button text should read e.g. `"Create workspace"` (not "Create Sub-Project").

- [ ] **Step 10: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-(red|blue|violet|amber)-[0-9]+)" "src/app/projects/[projectId]/sub/new/page.tsx"
```

Expected: zero output.

- [ ] **Step 11: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/sub/new/page.tsx"
```

Must exit 0 (pre-existing warnings elsewhere ignored).

- [ ] **Step 12: Commit**

```bash
git add "src/app/projects/[projectId]/sub/new/page.tsx"
git commit -m "style(sub/new): adopt PageBar, max-w-[640px] form, toast errors, workspace copy

- Wrap hero + form in pt-6 pb-20, constrain inner to max-w-[640px]
- text-display-1 hero + text-body description (no eyebrow)
- Card with p-8 padding; footer action row with border-t
- Replace alert() with toast.error, 'workspace' terminology
- PageBar at top with back + crumbs"
```

---

## Task 2: Migrate `/projects/[projectId]/sub/[subProjectId]/edit`

**Files:** `src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx`

**What this does:** Same treatment as `/sub/new` — normalise form width, adopt PageBar, migrate alerts, fix hero, fix heading copy ("Edit workspace").

- [ ] **Step 1: Read current file**

```bash
cat "src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx"
```

- [ ] **Step 2: Add imports**

```tsx
import { toast } from "sonner"
import { PageBar } from "@/components/layout/page-bar"
```

- [ ] **Step 3: Replace `alert()` calls with `toast.error`**

Grep for alerts:
```bash
grep -n "alert(" "src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx"
```

Typical sites: field-validation alert on submit (e.g. "Name is required"), and submit-failure alert. Swap each:
- `alert("Name is required")` → `toast.error("Name is required")`
- `alert("Failed to update workspace")` (or whatever the exact message is) → `toast.error(...)`

- [ ] **Step 4: Add `<PageBar>`**

```tsx
<PageBar
  back={{ href: `/projects/${projectId}/sub/${subProjectId}`, label: "Back" }}
  crumbs={
    subProject?.name && project?.name
      ? [
          { label: project.name, href: `/projects/${projectId}` },
          { label: subProject.name, href: `/projects/${projectId}/sub/${subProjectId}` },
          { label: "Edit" },
        ]
      : undefined
  }
/>
```

If `project` or `subProject` state isn't populated until after a fetch, guard the crumbs with the `?` check above (so they only render when ready) and show no crumbs while loading — that's fine; `PageBar` supports an undefined `crumbs`.

Remove any free-floating back link the page had before.

- [ ] **Step 5: Normalise wrapper**

```tsx
<div className="pt-6 pb-20">
  <div className="max-w-[640px] mx-auto">
```

Remove the `max-w-4xl` (and any nested max-w-3xl).

- [ ] **Step 6: Hero**

```tsx
<div className="flex flex-col gap-2 mb-8">
  <h1 className="text-display-1 text-foreground">Edit workspace</h1>
  <p className="text-body text-muted-foreground">
    Update the name, research framing, audience, or stage for {subProject?.name ?? "this workspace"}.
  </p>
</div>
```

- [ ] **Step 7: Card + actions**

Wrap form in `<Card><CardContent className="p-8">…</CardContent></Card>`. Footer actions with border-t. Primary button: `Save changes`. Cancel button: `variant="outline"` linking back to the sub-project home.

- [ ] **Step 8: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-(red|blue|violet|amber)-[0-9]+)" "src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx"
```
Expected: zero.

- [ ] **Step 9: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx"
```

- [ ] **Step 10: Commit**

```bash
git add "src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx"
git commit -m "style(sub/edit): adopt PageBar, max-w-[640px] form, toast errors, workspace copy

Mirror of sub/new: PageBar with project > workspace > Edit crumbs,
pt-6 pb-20 wrapper, max-w-[640px] form column, Card p-8 container,
text-display-1 'Edit workspace' heading, footer actions with border-t."
```

---

## Task 3: Sub-project home — `<PageBar>` + `<WorkspaceFrame>` + left rail

**Files:** `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`

**What this does:** Restructure the outermost shell of the sub-project home. Wraps the existing content in `<WorkspaceFrame variant="platform">` with a 280px left rail (sub-project meta + tool counts) + 400px no right rail (skip right rail — nothing to show yet). Adds `<PageBar>` with back + crumbs. Drops any hand-rolled header block. Main column starts with the hero (`text-display-1` workspace name + research-statement description).

- [ ] **Step 1: Read current file**

```bash
cat "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx" | head -60
grep -n "useState\|useEffect\|const \[" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx" | head -25
```

Note state hooks (there will be many — `subProject`, `guideVersions`, `simulations`, `mappingSessions`, `archetypeSessions`, `ideationSessions`, `hmwCritiques`, `insightCritiques`, tab state, etc.).

- [ ] **Step 2: Add imports**

```tsx
import { PageBar } from "@/components/layout/page-bar"
import { WorkspaceFrame } from "@/components/layout/workspace-frame"
import { RailHeader } from "@/components/layout/rail-header"
import { RailSection } from "@/components/layout/rail-section"
import { MetaRow } from "@/components/layout/meta-row"
import { Mono } from "@/components/ui/mono"
```

`toast` should already be imported from Task 3.5 fallout; add if missing.

- [ ] **Step 3: Build `leftRail` as an inline render block**

Just before the component's `return (`, define the rail:

```tsx
const guideCount = guideVersions?.length ?? 0
const simulationCount = simulations?.length ?? 0
const mappingCount = mappingSessions?.length ?? 0
const archetypeCount = archetypeSessions?.length ?? 0
const ideationCount = ideationSessions?.length ?? 0
const hmwCount = hmwCritiques?.length ?? 0
const insightCount = insightCritiques?.length ?? 0

const ageRange = subProject?.ageMin != null && subProject?.ageMax != null
  ? `${subProject.ageMin}–${subProject.ageMax}`
  : "—"
const stageLabels = (subProject?.lifeStages ?? []).join(", ") || "—"

const leftRail = (
  <>
    <RailHeader>
      <h2 className="text-display-5 text-foreground leading-tight">
        {subProject?.name ?? "Workspace"}
      </h2>
      {project?.name && (
        <p className="text-body-sm text-muted-foreground">
          In <span className="text-foreground">{project.name}</span>
        </p>
      )}
    </RailHeader>

    <RailSection title="Audience">
      <MetaRow k="Age range" v={<Mono>{ageRange}</Mono>} />
      <MetaRow k="Life stages" v={<span className="text-ui-sm text-foreground">{stageLabels}</span>} />
    </RailSection>

    <RailSection title="Activity" last>
      <MetaRow k="Moderator guides" v={<Mono>{guideCount}</Mono>} />
      <MetaRow k="Simulations" v={<Mono>{simulationCount}</Mono>} />
      <MetaRow k="Mapping sessions" v={<Mono>{mappingCount}</Mono>} />
      <MetaRow k="Archetypes" v={<Mono>{archetypeCount}</Mono>} />
      <MetaRow k="Ideation sessions" v={<Mono>{ideationCount}</Mono>} />
      <MetaRow k="HMW critiques" v={<Mono>{hmwCount}</Mono>} />
      <MetaRow k="Insight critiques" v={<Mono>{insightCount}</Mono>} />
    </RailSection>

    <div className="flex-1" />
  </>
)
```

The trailing `<div className="flex-1" />` pushes the rail bg to the bottom of the WorkspaceFrame row (per exploration pattern, matches what the guide rail does).

Adapt the state-variable names to match what's actually in the file — the scoping pass suggested these names but verify by grepping.

- [ ] **Step 4: Replace the existing outer shell with WorkspaceFrame**

Find the existing outer wrapper (likely `<div className="py-8">` or similar containing the whole page). Restructure the `return` statement to look like:

```tsx
return (
  <div className="flex flex-col">
    <PageBar
      back={{ href: `/projects/${projectId}`, label: "Back" }}
      crumbs={
        project?.name && subProject?.name
          ? [
              { label: project.name, href: `/projects/${projectId}` },
              { label: subProject.name },
            ]
          : undefined
      }
      action={
        subProject && (
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${projectId}/sub/${subProjectId}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        )
      }
    />

    <WorkspaceFrame variant="platform" leftRail={leftRail}>
      {/* Main column content */}
      <div className="flex flex-col gap-1 mb-8 max-w-[820px]">
        <h1 className="text-display-1 text-foreground">
          {subProject?.name ?? "Workspace"}
        </h1>
        {subProject?.researchStatement && (
          <p className="text-body text-muted-foreground">
            {subProject.researchStatement}
          </p>
        )}
      </div>

      {/* KEEP everything that was previously below the hero — tabs, content grids, dialogs, etc. */}
      {/* Only the OUTER wrapping changes in this task. Tab migration is Task 4. */}
    </WorkspaceFrame>
  </div>
)
```

Move every child that was previously in the old wrapper into the `<WorkspaceFrame>` children, UNDER the new hero block.

**Do not delete any existing JSX inside the old wrapper.** Just re-parent it. The tabs, confirmation modals, hover actions, etc. all stay.

Import `Pencil` from `lucide-react` and `Link` from `next/link` if not already present.

- [ ] **Step 5: Remove the old free-floating back link + old hero**

The old page probably had its own back link block (`<Link href="..." className="inline-flex ...">← Back</Link>`) and an old hero (`<h1 className="text-3xl ...">{subProject.name}</h1>` + research statement + edit button). Those are replaced by `PageBar` and the new hero block respectively. Delete them.

Also delete any old "group hover edit button" that was on the previous H1.

- [ ] **Step 6: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

Must exit 0. If TS complains about state variables used in `leftRail` before they're defined, move the rail block AFTER the state hooks section.

- [ ] **Step 7: Browser sanity check**

```bash
npm run dev
```

Open `/projects/<any-project>/sub/<any-sub>`. Expected:
- PageBar visible with back + crumbs + Edit button.
- Below: 280px white left rail showing workspace meta + activity counts, and the main column with `text-display-1` workspace name + research statement.
- The existing tab strip + content (unstyled/not yet migrated) renders below the hero.
- No horizontal overflow.

Stop dev.

- [ ] **Step 8: Commit**

```bash
git add "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
git commit -m "style(sub/[id]): deploy PageBar + WorkspaceFrame with workspace meta rail

- PageBar with back + crumbs (project > workspace), Edit in action slot
- WorkspaceFrame variant='platform' (280/1fr/400) with left rail:
  * RailHeader: workspace name + parent project
  * Audience section: age range (mono) + life stages
  * Activity section: counts for guides, simulations, mapping,
    archetypes, ideation, HMW critiques, insight critiques
- Main hero: text-display-1 workspace name + text-body research
  statement (no eyebrow, no icon tile)
- Removes old hand-rolled back link and inline-edit H1
- Tabs + tool grids unchanged (covered in Task 4)"
```

---

## Task 4: Sub-project home — migrate hand-rolled tabs to `<Tabs>` primitive

**Files:** `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`

**What this does:** Replaces the hand-rolled tab strip (currently a `<div className="inline-flex ... ring-1 ring-black/5 ... bg-muted/50 rounded-full ...">` with per-tab `<button>` elements and inline `style={{ color: ... }}` active logic) with the restyled `<Tabs>` primitive from PR 1 (underline style). Content per tab stays inside `<TabsContent>`. Colour logic moves from inline `style` to Tailwind conditional classes.

- [ ] **Step 1: Read the current tab strip**

```bash
grep -nE "activeContentTab|TabsList|ring-1 ring-black" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx" | head -20
```

Note the current tab state variable (likely `activeContentTab` with values like `"guides"`, `"simulations"`, `"mapping"`, `"archetypes"`, `"ideation"`, `"hmw"`, `"insights"`).

- [ ] **Step 2: Add imports**

Ensure these are imported:

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
```

- [ ] **Step 3: Replace the tab strip + tab panel wrappers**

Find the existing hand-rolled tab strip (typically between the hero and the content grids, around line ~517–657 in the current file). Replace the entire block — strip + all seven content panels — with:

```tsx
<Tabs value={activeContentTab} onValueChange={(v) => setActiveContentTab(v)}>
  <TabsList>
    <TabsTrigger value="guides">
      Moderator guides
      {guideCount > 0 && <Mono className="ml-1.5">{guideCount}</Mono>}
    </TabsTrigger>
    <TabsTrigger value="simulations">
      Simulations
      {simulationCount > 0 && <Mono className="ml-1.5">{simulationCount}</Mono>}
    </TabsTrigger>
    <TabsTrigger value="mapping">
      Mapping
      {mappingCount > 0 && <Mono className="ml-1.5">{mappingCount}</Mono>}
    </TabsTrigger>
    <TabsTrigger value="archetypes">
      Archetypes
      {archetypeCount > 0 && <Mono className="ml-1.5">{archetypeCount}</Mono>}
    </TabsTrigger>
    <TabsTrigger value="ideation">
      Ideation
      {ideationCount > 0 && <Mono className="ml-1.5">{ideationCount}</Mono>}
    </TabsTrigger>
    <TabsTrigger value="hmw">
      HMW
      {hmwCount > 0 && <Mono className="ml-1.5">{hmwCount}</Mono>}
    </TabsTrigger>
    <TabsTrigger value="insights">
      Insights
      {insightCount > 0 && <Mono className="ml-1.5">{insightCount}</Mono>}
    </TabsTrigger>
  </TabsList>

  <TabsContent value="guides">
    {/* PASTE EXISTING guides grid JSX here — preserve verbatim */}
  </TabsContent>
  <TabsContent value="simulations">
    {/* PASTE EXISTING simulations grid JSX here */}
  </TabsContent>
  <TabsContent value="mapping">
    {/* PASTE EXISTING mapping grid JSX here */}
  </TabsContent>
  <TabsContent value="archetypes">
    {/* PASTE EXISTING archetypes grid JSX here */}
  </TabsContent>
  <TabsContent value="ideation">
    {/* PASTE EXISTING ideation grid JSX here */}
  </TabsContent>
  <TabsContent value="hmw">
    {/* PASTE EXISTING HMW grid JSX here */}
  </TabsContent>
  <TabsContent value="insights">
    {/* PASTE EXISTING insights grid JSX here */}
  </TabsContent>
</Tabs>
```

The existing per-tab grid content (the cards, "+ New" buttons, hover actions, empty states) is preserved verbatim inside `<TabsContent>`. Only the OUTER wrapping changes.

Adapt the tab value strings (`"guides"`, `"simulations"`, etc.) to whatever the current `activeContentTab` state uses — verify by reading the old code.

- [ ] **Step 4: Drop the hand-rolled tab color CSS**

The old tab strip likely had inline `style={activeContentTab === "simulations" ? { color: 'var(--color-info)' } : undefined}` conditions. Those go away entirely — the new `<TabsTrigger>` inherits the underline-active style from the primitive. No per-tab colour in the strip.

If you want to preserve per-tool accent colours on the COUNT badges (so guide counts feel amber, KB counts feel purple, etc.), leave that for a polish task — it's out of scope here. Simple `<Mono>` for counts is fine.

- [ ] **Step 5: Drop now-unused inline-tab classes**

Remove any `ring-1 ring-black/5`, `bg-white/60 backdrop-blur-md`, `shadow-inner`, `bg-muted/50 rounded-full`, etc. classes that were part of the hand-rolled strip. None of those belong in the new version.

- [ ] **Step 6: Hazard grep scoped to this file**

```bash
grep -nE "ring-1 ring-black|backdrop-blur-md|bg-muted/50 rounded-full|rounded-full border border-border/60 shadow-inner" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

Expected: zero (the old tab strip artefacts are gone).

- [ ] **Step 7: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

- [ ] **Step 8: Browser check**

```bash
npm run dev
```

Open the sub-project home. Verify:
- Tab strip now uses underline style (no pill background).
- Clicking each tab shows the correct content.
- Counts (via `<Mono>`) appear after each tab label.

Stop dev.

- [ ] **Step 9: Commit**

```bash
git add "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
git commit -m "style(sub/[id]): migrate hand-rolled tab strip to Tabs primitive (underline)

- Replace ring-1 ring-black/5 + bg-muted/50 rounded-full tab shell
  with <Tabs><TabsList><TabsTrigger> from PR 1 (underline active)
- Seven tabs — Moderator guides, Simulations, Mapping, Archetypes,
  Ideation, HMW, Insights — each with optional <Mono> count
- Remove inline style={} active-colour logic; primitive handles it
- All per-tab grid content preserved verbatim inside <TabsContent>"
```

---

## Task 5: Sub-project home — migrate 7 `confirm()` dialogs to `<AlertDialog>`

**Files:** `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`

**What this does:** Replaces `confirm(...)` browser dialogs across the seven delete flows with a shared `<AlertDialog>` pattern. Reuses the exact pattern from PR 2 (dashboard delete) and PR 3.5 fallout. Each delete gets its own dedicated state (`deleteGuideId`, `deleteSimId`, etc.) so multiple `<AlertDialog>` components can coexist without interfering.

- [ ] **Step 1: Add imports**

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
```

Also ensure `toast` from `sonner` is imported (for failure toasts during delete).

- [ ] **Step 2: Grep the 7 confirm sites**

```bash
grep -n "confirm(" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

Expected: 7 sites. Likely targets:
- guide delete
- simulation delete
- mapping session delete
- archetype session delete
- ideation session delete
- HMW critique delete
- insight critique delete

- [ ] **Step 3: Add delete state variables near the other `useState` hooks**

For EACH delete flow, add a single state variable that holds the id (or null) of the item to delete. This doubles as a "dialog is open" flag:

```tsx
const [deleteGuideId, setDeleteGuideId] = useState<string | null>(null)
const [deleteSimId, setDeleteSimId] = useState<string | null>(null)
const [deleteMappingId, setDeleteMappingId] = useState<string | null>(null)
const [deleteArchetypeId, setDeleteArchetypeId] = useState<string | null>(null)
const [deleteIdeationId, setDeleteIdeationId] = useState<string | null>(null)
const [deleteHmwId, setDeleteHmwId] = useState<string | null>(null)
const [deleteInsightId, setDeleteInsightId] = useState<string | null>(null)
```

Optional: a shared `const [deleting, setDeleting] = useState(false)` — but this makes it possible for deletes to collide. Prefer per-flow `deleting` flags if the existing code has them, otherwise one shared `deleting` is acceptable.

- [ ] **Step 4: Refactor each delete handler**

For each of the 7 delete flows, refactor like so.

**Before:**
```tsx
async function handleDeleteGuide(guideId: string) {
  if (!confirm("Are you sure you want to delete this guide?")) return
  try {
    const res = await fetch(`/api/guides/${guideId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("failed")
    refreshData()
  } catch {
    alert("Failed to delete guide")
  }
}
```

**After:**
```tsx
async function confirmDeleteGuide(guideId: string) {
  try {
    const res = await fetch(`/api/guides/${guideId}`, { method: "DELETE" })
    if (!res.ok) throw new Error("failed")
    refreshData()
  } catch {
    toast.error("Failed to delete guide")
  }
}
```

Replace every `alert()` inside these handlers with `toast.error()` during this refactor.

Update the delete button's `onClick` to open the dialog instead of calling the handler directly:

```tsx
// Old:
<button onClick={() => handleDeleteGuide(guide.id)}>
// New:
<button onClick={() => setDeleteGuideId(guide.id)}>
```

- [ ] **Step 5: Mount `<AlertDialog>` for each delete flow**

Add all 7 `<AlertDialog>` components at the BOTTOM of the component's JSX, just before the closing wrapper:

```tsx
<AlertDialog open={!!deleteGuideId} onOpenChange={(open) => !open && setDeleteGuideId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this moderator guide?</AlertDialogTitle>
      <AlertDialogDescription>
        The guide and all question sets inside it will be permanently removed. Simulations previously run against this guide are unaffected but will no longer be linked to it.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteGuideId) await confirmDeleteGuide(deleteGuideId)
          setDeleteGuideId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog open={!!deleteSimId} onOpenChange={(open) => !open && setDeleteSimId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this simulation?</AlertDialogTitle>
      <AlertDialogDescription>
        The transcript, opportunities, and analysis for this simulation will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteSimId) await confirmDeleteSim(deleteSimId)
          setDeleteSimId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog open={!!deleteMappingId} onOpenChange={(open) => !open && setDeleteMappingId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this mapping session?</AlertDialogTitle>
      <AlertDialogDescription>
        All tagged quotes, themes, and cluster layouts in this mapping session will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteMappingId) await confirmDeleteMapping(deleteMappingId)
          setDeleteMappingId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog open={!!deleteArchetypeId} onOpenChange={(open) => !open && setDeleteArchetypeId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this archetype session?</AlertDialogTitle>
      <AlertDialogDescription>
        The generated personas and supporting evidence for this session will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteArchetypeId) await confirmDeleteArchetype(deleteArchetypeId)
          setDeleteArchetypeId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog open={!!deleteIdeationId} onOpenChange={(open) => !open && setDeleteIdeationId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this ideation session?</AlertDialogTitle>
      <AlertDialogDescription>
        All concepts and their supporting quotes will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteIdeationId) await confirmDeleteIdeation(deleteIdeationId)
          setDeleteIdeationId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog open={!!deleteHmwId} onOpenChange={(open) => !open && setDeleteHmwId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this HMW critique?</AlertDialogTitle>
      <AlertDialogDescription>
        The framing, lenses, and rewrite suggestions for this critique will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteHmwId) await confirmDeleteHmw(deleteHmwId)
          setDeleteHmwId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

<AlertDialog open={!!deleteInsightId} onOpenChange={(open) => !open && setDeleteInsightId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this insight critique?</AlertDialogTitle>
      <AlertDialogDescription>
        The insight statement, supporting evidence, and critique will be permanently removed.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteInsightId) await confirmDeleteInsight(deleteInsightId)
          setDeleteInsightId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

If the existing delete handler names are different (e.g. `handleDeleteGuide` vs `confirmDeleteGuide`), preserve the existing function name — the rename in Step 4 is optional. Just remove the `confirm()` gate and wire the button to the new state setter.

- [ ] **Step 6: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\()" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

Expected: zero. All 7 confirms and any related alerts are migrated.

- [ ] **Step 7: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

- [ ] **Step 8: Browser check — exercise each delete flow**

```bash
npm run dev
```

Open the sub-project home with at least one guide, simulation, mapping session, archetype session, ideation session, HMW critique, and insight critique (seed via UI if needed). For each, trigger delete → AlertDialog shows with the right title + description → Cancel keeps the item → Delete removes it → toast appears on failure.

Stop dev.

- [ ] **Step 9: Commit**

```bash
git add "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
git commit -m "style(sub/[id]): migrate 7 confirm() deletes to AlertDialog

Seven destructive flows (guide, simulation, mapping session,
archetype session, ideation session, HMW critique, insight critique)
now use <AlertDialog> with domain-adapted copy:
- 'Delete this moderator guide?' (not 'Delete guide?')
- 'Delete this mapping session?'
- etc.
Each flow has its own delete{Thing}Id state so dialogs don't collide.
All former alert() failure paths migrated to toast.error."
```

---

## Task 6: Sub-project home — tokenise inline colours + copy polish

**Files:** `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx`

**What this does:** Cleanup pass over remaining inline `style={{ color: 'var(--color-info)' }}` and `text-red-500` / `text-amber-*` / `text-blue-*` / `text-violet-*` / `bg-white` leftovers from the tabs, hover states, and badges. Also normalises any "Sub-Project" → "Workspace" user-facing copy.

- [ ] **Step 1: Hazard grep**

```bash
grep -nE "style=\\{\\{[^}]*color:|bg-white|#[0-9a-f]{3,6}|text-(red|blue|violet|amber)-[0-9]+|bg-(red|blue|violet|amber)-[0-9]+|border-(red|blue|violet|amber)-[0-9]+|hover:text-red-" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

Capture the output. For each hit, apply the token map from PR 3:
- `text-red-*` / `hover:text-red-*` → `text-[color:var(--danger)]` / `hover:text-[color:var(--danger)]`
- `bg-red-50` / `bg-red-*` → `bg-[color:var(--danger-soft)]`
- `text-blue-*` → `text-[color:var(--info)]`
- `text-violet-*` → `text-[color:var(--knowledge)]`
- `text-amber-[6-9]00` → `text-[color:var(--warning)]` (status) or `text-[color:var(--primary)]` (brand) — judge per context
- `bg-amber-50` → `bg-[color:var(--warning-soft)]` (status) or `bg-[color:var(--primary-soft)]` (brand)
- `bg-white` → `bg-[color:var(--surface)]` or drop if a parent already provides it

For inline `style={{ color: 'var(--color-X)' }}`, replace with `className="... text-[color:var(--color-X)]"`.

- [ ] **Step 2: User-facing copy check**

```bash
grep -n "Sub-Project\|sub-project" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

For any USER-FACING string (inside JSX, dialog text, button labels, empty-state text), change "Sub-Project" → "Workspace" and "sub-project" → "workspace". DO NOT rename internal variable names, API paths, or type names — only the strings the user reads.

- [ ] **Step 3: Re-run hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-(red|blue|violet|amber)-[0-9]+|bg-(red|blue|violet|amber)-[0-9]+|border-(red|blue|violet|amber)-[0-9]+|style=\\{\\{[^}]*color:)" "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

Expected: zero output.

- [ ] **Step 4: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
```

- [ ] **Step 5: Commit**

```bash
git add "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
git commit -m "style(sub/[id]): tokenise inline colours, unify 'Workspace' copy

- Remove inline style={{color:'var(--color-info)'}} etc. in favour of
  className `text-[color:var(--TOKEN)]` utilities
- Replace remaining text-red-*/text-blue-*/text-violet-*/bg-amber-*/
  hover:text-red-* with --danger/--info/--knowledge/--warning tokens
- User-facing 'Sub-Project' → 'Workspace' (variable names, API paths,
  and types unchanged)"
```

---

## Task 7: Sub-project home — add `loading.tsx` + `error.tsx` + `not-found.tsx`

**Files:**
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/loading.tsx`
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/error.tsx`
- Create: `src/app/projects/[projectId]/sub/[subProjectId]/not-found.tsx`

**What this does:** Proper async UX for the biggest sub-project surface. The guide editor has these already; this parallels them.

- [ ] **Step 1: Create `loading.tsx`**

```tsx
import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function SubProjectLoading() {
  return <PageSkeleton cards={8} />
}
```

- [ ] **Step 2: Create `error.tsx`**

```tsx
"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function SubProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<AlertTriangle />}
        title="Couldn't load this workspace"
        description="We hit an error while fetching the workspace contents. Try again, or head back to the project view."
        action={
          <>
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </>
        }
      />
    </div>
  )
}
```

- [ ] **Step 3: Create `not-found.tsx`**

```tsx
import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function SubProjectNotFound() {
  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<FileQuestion />}
        title="Workspace not found"
        description="This workspace doesn't exist or you no longer have access. It may have been deleted from its parent project."
        action={
          <Button asChild>
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
```

- [ ] **Step 4: Build + lint**

```bash
npm run build && npx eslint \
  "src/app/projects/[projectId]/sub/[subProjectId]/loading.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/error.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/not-found.tsx"
```

- [ ] **Step 5: Commit**

```bash
git add \
  "src/app/projects/[projectId]/sub/[subProjectId]/loading.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/error.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/not-found.tsx"
git commit -m "feat(sub/[id]): add loading/error/not-found route siblings

PageSkeleton for loading, ErrorState with retry for error,
ErrorState with back-to-dashboard for 404. Copy uses 'workspace'
terminology."
```

---

## Task 8: Final verification

**Files:** none modified.

- [ ] **Step 1: Clean build**

```bash
npm run build
```
Expected: exits 0. All routes compile.

- [ ] **Step 2: Lint scoped to PR 4 modified files**

```bash
npx eslint \
  "src/app/projects/[projectId]/sub/new/page.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/loading.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/error.tsx" \
  "src/app/projects/[projectId]/sub/[subProjectId]/not-found.tsx"
```

Expected: zero new errors. Pre-existing `any` type errors in the sub-project home file are acceptable — they pre-date this work.

- [ ] **Step 3: Hazard grep across PR 4 scope**

```bash
FILES=(
  "src/app/projects/[projectId]/sub/new/page.tsx"
  "src/app/projects/[projectId]/sub/[subProjectId]/page.tsx"
  "src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx"
)

echo "-- alert/confirm --"
for f in "${FILES[@]}"; do
  grep -nE "\\balert\\(|\\bconfirm\\(" "$f" && echo "  HIT in $f"
done
echo ""
echo "-- bg-white / hex / raw-colors / edge hacks (scoped) --"
for f in "${FILES[@]}"; do
  grep -nE "bg-white|#[0-9a-f]{3,6}\\b|text-(red|blue|violet|amber)-[0-9]+|bg-(red|blue|violet|amber)-[0-9]+|border-(red|blue|violet|amber)-[0-9]+|ring-1 ring-black/5|rounded-full border border-border/60 shadow-inner" "$f" && echo "  HIT in $f"
done
```

All greps should return no hits.

- [ ] **Step 4: Browser walk**

```bash
npm run dev
```

Open each:
1. `/projects/<id>/sub/new` — PageBar, max-w-[640px] form, no hex literals, toast on submit error.
2. `/projects/<id>/sub/<sub-id>` — PageBar + 280px left rail + main with hero + underline Tabs + per-tab content. Exercise:
   - Click each tab: content switches correctly.
   - Delete one item from EACH tab (guide, sim, mapping, archetype, ideation, HMW, insight) → AlertDialog opens → Delete confirms.
   - Edit link in PageBar takes you to `/sub/<sub-id>/edit`.
3. `/projects/<id>/sub/<sub-id>/edit` — PageBar with crumbs, max-w-[640px] form, `<h1 className="text-display-1">Edit workspace</h1>`, Save button works.

Stop dev.

- [ ] **Step 5: Summary**

Post a one-paragraph summary:
- 3 routes migrated, 7 alerts + 7 confirms replaced (14 total), 3 new sibling files.
- Left rail with workspace meta + 7 tool activity counts.
- Tabs now use underline primitive.
- No new lint errors.

---

## Self-Review (author)

**Spec coverage (§ of spec → task):**
- §8 PR 4 routes (`/sub/new`, `/sub/[subProjectId]`, `/sub/[subProjectId]/edit`) → Tasks 1, 3–7, 2.
- `<WorkspaceFrame variant="platform">` deployment at sub-project home → Task 3.
- Tool launcher (tabs-as-launcher pattern; each tab labels its tool with `<Mono>` count) → Task 4.
- Hand-rolled tab-like buttons → `<Tabs>` → Task 4.
- 7 `confirm()` → `<AlertDialog>` → Task 5.
- `<Form>` with `max-w-[640px]` form width → Tasks 1, 2.
- Alert migration → Tasks 1, 2, 5.
- Design decisions carried forward from PR 3.5 (canvas, rail padding, PageBar tightness, hero pattern, soft-tinted chips, content adaptation) → noted in the plan header; referenced in each task.

**Placeholder scan:**
- Task 3 Step 3 references "state-variable names … verify by grepping" — this is a variable map, not a placeholder. The rail template shows what to bind; the engineer adapts to the actual names in the file.
- Task 4 has placeholder comments like `{/* PASTE EXISTING guides grid JSX here — preserve verbatim */}` — this is an instruction to move-not-rewrite, not a placeholder. The scope is explicit.
- Task 5 Step 4's "If the existing delete handler names are different…" flags a known ambiguity — engineer preserves or renames per what's actually in the file. Acceptable.
- No "TBD"/"implement later"/missing code blocks.

**Type/name consistency:**
- `PageBar`, `WorkspaceFrame`, `RailHeader`, `RailSection`, `MetaRow`, `Mono`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `AlertDialog*`, `Button`, `Link`, `Pencil` — all imported from known paths shipped in PR 1–3.5.
- `toast` from `sonner`.
- CSS tokens referenced (`--danger`, `--danger-soft`, `--info`, `--knowledge`, `--primary`, `--warning`, `--surface`, `--surface-muted`) all defined in PR 1.
- Delete state variables (`deleteGuideId`, `deleteSimId`, `deleteMappingId`, `deleteArchetypeId`, `deleteIdeationId`, `deleteHmwId`, `deleteInsightId`) and handlers (`confirmDelete{Thing}` or preserved existing names) are consistent across Task 5.

**Scope check:** PR 4 focuses on the sub-project shell. Does not overlap with PR 5 (tool screens: simulate, insights, hmw, map, ideation, archetypes). The content INSIDE each tab is preserved verbatim in Task 4 — those tool interior rebuilds happen in PR 5.
