# UI Refresh — PR 3 (Project Core) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 4 project-core routes (`/projects/new`, `/projects/new/guide`, `/projects/[projectId]`, `/projects/[projectId]/kb`) to the new design system. Replace 22 `alert()` + 2 `confirm()` calls with `toast` / `<AlertDialog>`. Swap hand-rolled buttons/checkboxes/spinners/empty-states for primitives. Kill every hard-coded `text-blue-*` / `text-violet-*` / `text-red-*` / `bg-amber-*` / `border-*-600`. Tokenise severity colors. Migrate the guide editor's custom sticky header to `<PageBar>`.

**Architecture:** Targeted-edit approach per page. Pages retain all data-fetching, form state, and business logic. We swap chrome to the PR-1 primitive family and the amber/canvas tokens. The guide editor (1593 lines) is split across two tasks — Part A does the safe/parallel migrations (toasts, colors, spinner, severity, page title), Part B does the structural PageBar migration that touches the sticky-header layout. Each task commits independently.

**Tech Stack:** Next.js 16.1.1 App Router, React 19, Tailwind v4, shadcn/ui (amber tokens from PR 1), Sonner toasts, Lucide icons.

**Spec reference:** [docs/superpowers/specs/2026-04-22-ui-elevenlabs-refresh-design.md](../specs/2026-04-22-ui-elevenlabs-refresh-design.md)

**Important notes for the engineer:**
1. **UI migration, not behaviour change.** All fetch calls, state hooks, form handlers, routing logic — preserved exactly. Acceptance test: every flow still works end-to-end.
2. **PR 1 + PR 2 are merged.** All primitives and tokens are available. `toast` is wired up. `PageBar` / `BackLink` / `EmptyState` / `CenteredSpinner` all shipped.
3. **Commit after every task.** Each task has its own commit message.
4. **Verify per task:** `npm run build`, `npm run lint` scoped to modified files, hazard grep.
5. **Zero tolerance in touched files:** no `alert(`, no `confirm(`, no `bg-white`, no hex literals, no raw `text-red-N` / `text-blue-N` / `text-violet-N` / `text-amber-[6-9]00` classes. Tokenise everything.
6. **Eyebrow discipline.** Only add `eyebrow` to `<PageHeader>` when it gives genuinely different context than the title. "Project" + "My Projects" = redundant; skip. "Setup" + "Moderator Guide" = good.
7. **Branch:** Continue on `ui-upgrade-elevenlabs-style`.

**Severity & status token map** (use throughout):

| Purpose | Text | Bg | Border |
|---|---|---|---|
| Danger / severity-high / destructive | `text-[color:var(--danger)]` | `bg-[color:var(--danger-soft)]` | `border-[color:var(--danger)]/25` |
| Warning / severity-medium / amber-warning | `text-[color:var(--warning)]` | `bg-[color:var(--warning-soft)]` | `border-[color:var(--warning)]/25` |
| Info / severity-low / blue | `text-[color:var(--info)]` | `bg-[color:var(--info-soft)]` | `border-[color:var(--info)]/25` |
| Knowledge / research / purple | `text-[color:var(--knowledge)]` | `bg-[color:var(--knowledge-soft)]` | `border-[color:var(--knowledge)]/25` |
| Success / validation | `text-[color:var(--success)]` | `bg-[color:var(--success-soft)]` | `border-[color:var(--success)]/25` |
| Primary / amber accent | `text-[color:var(--primary)]` | `bg-[color:var(--primary-soft)]` | `border-[color:var(--primary)]/25` |
| Neutral / muted tile | `text-muted-foreground` | `bg-[color:var(--surface-muted)]` | `border-[color:var(--border-subtle)]` |

Direct color-class substitutions in the guide editor:
- `text-blue-500`/`text-blue-400`/`text-blue-600` → `text-[color:var(--info)]`
- `bg-blue-50`/`bg-blue-100` → `bg-[color:var(--info-soft)]`
- `border-blue-*` → `border-[color:var(--info)]/25`
- `text-violet-400`/`text-violet-500`/`text-violet-600` → `text-[color:var(--knowledge)]`
- `bg-violet-50` → `bg-[color:var(--knowledge-soft)]`
- `border-violet-*` → `border-[color:var(--knowledge)]/25`
- `text-red-500`/`text-red-600`/`text-red-700` → `text-[color:var(--danger)]`
- `bg-red-50` → `bg-[color:var(--danger-soft)]`
- `border-red-*` → `border-[color:var(--danger)]/25`
- `text-amber-600`/`text-amber-700`/`text-amber-900` → `text-[color:var(--warning)]` (when used as status color) OR `text-[color:var(--primary)]` (when used as brand accent — check context)
- `bg-amber-50` → `bg-[color:var(--warning-soft)]`
- `border-amber-*` → `border-[color:var(--warning)]/25`

When in doubt about amber: if it's a warning/compliance callout, use `--warning`. If it's a brand-accent element (e.g. a "new!" badge, a highlight), use `--primary`.

---

## Task 1: Migrate `/projects/new`

**Files:**
- Modify: `src/app/projects/new/page.tsx` (~169 lines)

**What this does:** Swap 3 `alert()` calls → `toast.error`. Replace hand-rolled back link → `<BackLink>`. Normalise page title to `text-display-2`. Standardise outer wrapper padding.

- [ ] **Step 1: Read current file**

```bash
cat src/app/projects/new/page.tsx
```
Note where the `alert()` calls are (form validation + submit failures), the back link markup, and the `<h1>` heading.

- [ ] **Step 2: Add imports**

Add to the top imports:
```tsx
import { toast } from "sonner"
import { BackLink } from "@/components/layout/back-link"
```

- [ ] **Step 3: Replace back link**

Find the hand-rolled back link around lines 62–68 (typically an `<a>` or `<Link>` with `inline-flex` + `ChevronLeft` + "Back to Projects"). Replace with:

```tsx
<BackLink href="/dashboard" label="Back to Projects" />
```

- [ ] **Step 4: Swap alerts to toasts**

Replace every `alert(...)` with `toast.error(...)`. Three sites typically:
- Line ~25: `alert("Please enter a project name")` → `toast.error("Please enter a project name")`
- Line ~47: `alert(data.error || "Failed to create project")` → `toast.error(data.error || "Failed to create project")`
- Line ~50: `alert("Failed to create project")` → `toast.error("Failed to create project")`

- [ ] **Step 5: Normalise heading + wrapper**

Find the page-title `<h1>` (around line 77, currently `text-3xl font-semibold tracking-tight`). Replace className with `text-display-2`.

Find the outer wrapper `<div className="py-8 flex flex-col items-center">` (around line 58) and change to `<div className="pt-6 pb-20 flex flex-col items-center">`.

Keep the inner container and form markup as-is.

- [ ] **Step 6: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-red-[0-9]|text-blue-[0-9]|text-violet-[0-9])" src/app/projects/new/page.tsx
```
Expected: no output.

- [ ] **Step 7: Build + lint**

```bash
npm run build && npx eslint src/app/projects/new/page.tsx
```
Must exit 0 and return no new errors.

- [ ] **Step 8: Commit**

```bash
git add src/app/projects/new/page.tsx
git commit -m "style(projects/new): adopt BackLink + toast + text-display-2

- Replace hand-rolled back link with BackLink primitive
- Replace 3 alert() calls with toast.error (sonner)
- text-display-2 for page title
- Standardise wrapper to pt-6 pb-20"
```

---

## Task 2: Migrate `/projects/[projectId]` (project detail)

**Files:**
- Modify: `src/app/projects/[projectId]/page.tsx` (~416 lines)

**What this does:** Swap 1 `confirm()` → `<AlertDialog>` (delete-workspace). Swap 3 `alert()` → `toast.error`. Adopt `<Button variant="knowledge">` for KB affordance. Add `aria-label` to icon-only pencil button. Strip leftover `bg-white/95 backdrop-blur-sm ring-1 ring-black/5` overrides on DialogContents. Normalise page title + wrapper.

- [ ] **Step 1: Read current file**

```bash
cat src/app/projects/[projectId]/page.tsx
```
Note the delete flow (line ~123 `confirm()`), 3 `alert()` sites (~138, ~152, ~174), pencil edit button (~231-238), KB button (~259), any DialogContent overrides (~354, ~399).

- [ ] **Step 2: Add imports**

Ensure these are present at the top:
```tsx
import { toast } from "sonner"
import { useState } from "react"  // if not already
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

- [ ] **Step 3: Replace `confirm()` with `<AlertDialog>`**

Find the delete handler around line 123. It's typically structured:
```tsx
async function deleteSubProject(subProjectId: string) {
  if (!confirm("Are you sure you want to delete this workspace?...")) return
  // ... fetch DELETE ...
  // on error: alert("Failed to delete workspace")
}
```

Refactor to remove the `confirm()` gate. Add state near other useState calls:
```tsx
const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
const [deleting, setDeleting] = useState(false)
```

Change the trash button's onClick from calling `deleteSubProject(subProject.id)` to `setDeleteTarget({ id: subProject.id, name: subProject.name })`.

Rename the existing `deleteSubProject` to `confirmDelete(id)` — remove the `confirm()` line; keep everything else.

At the bottom of the render JSX (just before the closing wrapper, and after any existing Dialog components), add:

```tsx
<AlertDialog
  open={!!deleteTarget}
  onOpenChange={(open) => !open && setDeleteTarget(null)}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
        All guides and simulations within it will be permanently deleted. This cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={deleting}
        onClick={async () => {
          if (!deleteTarget) return
          setDeleting(true)
          try {
            await confirmDelete(deleteTarget.id)
            setDeleteTarget(null)
          } finally {
            setDeleting(false)
          }
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        {deleting ? "Deleting..." : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

Make sure `confirmDelete` awaits the fetch and — on failure — calls `toast.error("Failed to delete workspace")` instead of `alert()`. The existing alert on failure (line 138) is replaced by this toast.

- [ ] **Step 4: Swap remaining `alert()` calls**

- Line ~138 (delete fail — already handled in Step 3 via `confirmDelete`). Verify the old `alert("Failed to delete workspace")` is gone.
- Line ~152: `alert("Name is required")` → `toast.error("Name is required")`
- Line ~174: `alert("Failed to save changes")` → `toast.error("Failed to save changes")`

- [ ] **Step 5: Normalise page title**

Find the `<h1>` around line 228, typically `text-3xl font-semibold tracking-tight`. Replace with `text-display-2`.

- [ ] **Step 6: Add aria-label to pencil edit button**

Find the icon-only edit Button around line 231-238 (`<Button size="icon" ... ><Pencil/></Button>`). Add `aria-label="Edit project"` to the Button props.

- [ ] **Step 7: Adopt `<Button variant="knowledge">` for KB button**

Find the "Knowledge Base" button around line 259. It currently looks like:

```tsx
<Button asChild variant="outline" className="border-[var(--color-knowledge)]/20 text-[var(--color-knowledge)] hover:bg-[var(--color-knowledge-muted)]">
  <Link href={`/projects/${projectId}/kb`}>
    <BookOpenText className="h-4 w-4 mr-1.5" />
    Knowledge Base
  </Link>
</Button>
```

Simplify to:
```tsx
<Button asChild variant="knowledge">
  <Link href={`/projects/${projectId}/kb`}>
    <BookOpenText className="h-4 w-4 mr-1.5" />
    Knowledge Base
  </Link>
</Button>
```

- [ ] **Step 8: Strip DialogContent overrides**

Search the file for `DialogContent` elements. The audit flagged ~line 354 and ~line 1206 / ~line 1296 (the line numbers may not align with 416-line count — verify by grepping). For each, remove any of:
- `className="... rounded-md ..."` — the primitive provides panel radius
- `className="... p-8 ..."` — the primitive provides padding
- `className="... ring-1 ring-black/5 ..."` — use the primitive's shadow-outline-ring
- `className="... bg-white/95 backdrop-blur-sm ..."` — use the primitive's background

Keep any `className` that sets a specific width (e.g. `max-w-lg`) or positional tweaks. Just strip the decorative overrides.

- [ ] **Step 9: Normalise outer wrapper**

Find the root `<div>` of the component. If it's `<div className="relative">` with an inner `<div className="py-8">`, consolidate to `<div className="pt-6 pb-20 relative">`. Keep the `relative` if any child uses absolute positioning against it.

- [ ] **Step 10: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-red-[0-9]|text-blue-[0-9]|text-violet-[0-9])" src/app/projects/[projectId]/page.tsx
```
Expected: no output.

- [ ] **Step 11: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/page.tsx"
```
Must exit 0.

- [ ] **Step 12: Commit**

```bash
git add "src/app/projects/[projectId]/page.tsx"
git commit -m "style(projects/[projectId]): migrate chrome + AlertDialog for delete

- Replace confirm() with <AlertDialog> for workspace delete
- Replace 2 alert() calls with toast.error (sonner)
- Adopt Button variant='knowledge' for KB affordance
- Add aria-label to icon-only pencil edit button
- Strip DialogContent decorative overrides (rounded-md/p-8/ring/bg-white)
- text-display-2 for page title
- Standardise wrapper to pt-6 pb-20"
```

---

## Task 3: Migrate `/projects/[projectId]/kb`

**Files:**
- Modify: `src/app/projects/[projectId]/kb/page.tsx` (~628 lines)

**What this does:** Swap 4 `alert()` + 1 `confirm()` → `toast` + `<AlertDialog>`. Replace hand-rolled upload `<button>` → `<Button variant="outline">`. Replace raw `<input type="checkbox">` → `<Checkbox>`. Tokenise compliance card's hard-coded amber to `--warning-*`. Replace dashed-border empty state → `<EmptyState>`. Fix TabsList wrapper that fights the new underline. Use `<BackLink>` for consistency. Add `aria-label` to icon-only buttons.

- [ ] **Step 1: Read current file**

```bash
cat "src/app/projects/[projectId]/kb/page.tsx"
```

- [ ] **Step 2: Add imports**

```tsx
import { toast } from "sonner"
import { BackLink } from "@/components/layout/back-link"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/ui/empty-state"
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

- [ ] **Step 3: Replace back link**

Find the hand-rolled back link around lines 272-281 (typically `<Link href="..." className="inline-flex ...">← Back to Project</Link>`). Replace with:

```tsx
<BackLink href={`/projects/${projectId}`} label="Back to Project" />
```

- [ ] **Step 4: Replace page title**

Find the `<h1 className="text-3xl ...">` around line ~290. Replace the className with `text-display-2`.

- [ ] **Step 5: Swap 4 `alert()` calls to `toast`**

- Line ~203: `alert(err instanceof Error ? err.message : "Upload failed")` → `toast.error(err instanceof Error ? err.message : "Upload failed")`
- Line ~220: `alert("Failed to approve document")` → `toast.error("Failed to approve document")`
- Line ~235: `alert("Failed to reject document")` → `toast.error("Failed to reject document")`
- Line ~252: `alert("Failed to delete document")` → `toast.error("Failed to delete document")`

- [ ] **Step 6: Replace `confirm()` with `<AlertDialog>`**

Find the `confirm()` around line 240. Typical structure:

```tsx
async function handleDelete(docId: string) {
  if (!confirm("Are you sure you want to delete this document?")) return
  // fetch + toast.error on failure
}
```

Remove the `confirm()` gate. Add state at the top of the component:

```tsx
const [deleteDocId, setDeleteDocId] = useState<string | null>(null)
const [deleting, setDeleting] = useState(false)
```

Change the trash button's `onClick` from calling `handleDelete(doc.id)` directly to `setDeleteDocId(doc.id)`.

Rename `handleDelete` to `confirmDeleteDoc(id)` — with the `confirm()` gate removed.

At the bottom of the JSX (before the closing wrapper), add:

```tsx
<AlertDialog
  open={!!deleteDocId}
  onOpenChange={(open) => !open && setDeleteDocId(null)}
>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this document?</AlertDialogTitle>
      <AlertDialogDescription>
        This removes the document from this project&apos;s Knowledge Base. This cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
      <AlertDialogAction
        disabled={deleting}
        onClick={async () => {
          if (!deleteDocId) return
          setDeleting(true)
          try {
            await confirmDeleteDoc(deleteDocId)
            setDeleteDocId(null)
          } finally {
            setDeleting(false)
          }
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        {deleting ? "Deleting..." : "Delete"}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 7: Replace hand-rolled upload button**

Find the raw upload button around lines 301-304, typically inside a `<DialogTrigger asChild>` wrapper:

```tsx
<DialogTrigger asChild>
  <button className="px-4 py-2 rounded-md bg-background border border-input ...">
    <Upload className="h-3.5 w-3.5" />
    Upload Document
  </button>
</DialogTrigger>
```

Replace the inner `<button>` with:

```tsx
<DialogTrigger asChild>
  <Button variant="outline" size="default">
    <Upload className="h-3.5 w-3.5" />
    Upload Document
  </Button>
</DialogTrigger>
```

- [ ] **Step 8: Replace raw checkbox with `<Checkbox>`**

Find the raw checkbox around lines 406-412:

```tsx
<input
  type="checkbox"
  id="classificationConfirm"
  checked={classificationConfirmed}
  onChange={(e) => setClassificationConfirmed(e.target.checked)}
  className="w-4 h-4 rounded border-amber-300 ..."
/>
```

Replace with:

```tsx
<Checkbox
  id="classificationConfirm"
  checked={classificationConfirmed}
  onCheckedChange={(checked) => setClassificationConfirmed(checked === true)}
  aria-label="Confirm classification disclaimer"
/>
```

Note the signature change: `onChange` (event-based) → `onCheckedChange` (value-based). Adapt the handler to read the boolean directly.

- [ ] **Step 9: Tokenise compliance card colors**

Find the compliance card around line 402. It typically has:

```tsx
<div className="p-4 bg-amber-50 border border-amber-100 rounded-md relative overflow-hidden">
  <div className="text-sm text-amber-900/80 ...">
    ...
  </div>
</div>
```

Replace the Tailwind amber classes with warning tokens:

```tsx
<div className="p-4 bg-[color:var(--warning-soft)] border border-[color:var(--warning)]/25 rounded-[var(--radius-card)] relative overflow-hidden">
  <div className="text-body-sm text-[color:var(--warning)] ...">
    ...
  </div>
</div>
```

Walk each class in the card and convert. Any remaining `text-amber-N` / `bg-amber-N` / `border-amber-N` gets tokenised.

- [ ] **Step 10: Fix TabsList wrapper**

Find the TabsList around line 456. The audit flagged it having `className="bg-transparent p-0 gap-2 h-auto flex-wrap justify-start"` which fights the new underline style. Replace with a plain `<TabsList>` (no className override unless a specific layout reason is preserved).

If individual `<TabsTrigger>` elements have their own wrapper classes that assume the old segmented style, remove those too. The restyled primitive handles the underline via `::after` — extra classes are noise.

- [ ] **Step 11: Replace empty state**

Find the empty-state block around lines 480-503. Typical structure is a dashed-border `<div>` with an icon + title + description + button. Replace with:

```tsx
<EmptyState
  icon={<BookOpenText />}
  title="No content here"
  description={`This section is empty. Upload a ${activeTabLabel.toLowerCase()} to get started.`}
  action={
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        setUploadDocType(activeTab)
        setUploadDialogOpen(true)
      }}
    >
      <Upload className="h-3.5 w-3.5" />
      Upload document
    </Button>
  }
/>
```

Adapt the description and icon to match the existing copy/intent. Use `BookOpenText`, `FileText`, or whichever icon the existing empty state used.

- [ ] **Step 12: Verify document card uses `<Card>`**

Find the document row around lines 515-519. If it's a raw `<div>` styled like a card, wrap the row contents in `<Card>`:

```tsx
<Card className="group hover:bg-[color:var(--surface-muted)]/50 transition-colors">
  <CardContent className="p-4 flex items-center gap-4">
    {/* existing row content */}
  </CardContent>
</Card>
```

If the existing row uses `<Card>` with a custom className (acceptable), just ensure no `bg-white` literal and no hand-rolled radius.

- [ ] **Step 13: Add `aria-label` to icon-only buttons**

Grep for `size="icon"` in the file. For each icon-only Button (trash, view, approve, reject icons), ensure `aria-label="Delete document"` / `"View document"` / etc. is present. Add if missing.

- [ ] **Step 14: Normalise outer wrapper**

Find the root `<div>`. Consolidate any `py-8` and nested padding into `<div className="pt-6 pb-20">`.

- [ ] **Step 15: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-red-[0-9]|text-blue-[0-9]|text-violet-[0-9]|text-amber-[6-9]00|bg-amber-[0-9]00|border-amber-[0-9]00)" "src/app/projects/[projectId]/kb/page.tsx"
```
Expected: no output.

- [ ] **Step 16: Build + lint**

```bash
npm run build && npx eslint "src/app/projects/[projectId]/kb/page.tsx"
```
Must exit 0.

- [ ] **Step 17: Commit**

```bash
git add "src/app/projects/[projectId]/kb/page.tsx"
git commit -m "style(projects/[projectId]/kb): adopt primitives + AlertDialog + token palette

- Replace 4 alert() calls with toast.error (sonner)
- Replace confirm() with <AlertDialog> for document delete
- Replace hand-rolled upload <button> with <Button variant='outline'>
- Replace raw <input type='checkbox'> with <Checkbox>
- Tokenise compliance card colors (amber -> --warning-*)
- Replace dashed-border empty state with <EmptyState>
- Fix TabsList wrapper fighting new underline style
- Use <BackLink> for back navigation
- Add aria-labels to icon-only action buttons
- text-display-2 for page title
- Standardise wrapper to pt-6 pb-20"
```

---

## Task 4: Migrate `/projects/new/guide` — Part A (non-structural)

**Files:**
- Modify: `src/app/projects/new/guide/page.tsx` (~1593 lines)

**What this does:** The guide editor's safe migrations — 14 `alert()` → `toast`, hand-rolled spinner → `CenteredSpinner`, `getSeverityColor` refactor to tokens, page title to `text-display-2`, color-class sweep across the feedback/research cards. **Does NOT touch the sticky header layout** — that's Part B (Task 5).

- [ ] **Step 1: Read the file (pace yourself — 1593 lines)**

```bash
cat src/app/projects/new/guide/page.tsx | head -50
wc -l src/app/projects/new/guide/page.tsx
```
Understand the overall structure: imports → state → handlers → JSX. Note the rough regions:
- Imports + types: ~1–50
- Fetch / setup handlers: ~50–300
- Question management handlers: ~300–600
- Save / validation handlers: ~600–750
- JSX: ~900–1580
- Suspense fallback: ~1573–1582

- [ ] **Step 2: Add imports**

Ensure these are in the import block:

```tsx
import { toast } from "sonner"
import { CenteredSpinner } from "@/components/ui/centered-spinner"
```

- [ ] **Step 3: Swap all 14 `alert()` calls to `toast.error`**

Find every `alert(` in the file. There should be 14 sites. For each, swap `alert(X)` → `toast.error(X)`. The expected sites and messages:

| Line (approx) | Current message | Replacement |
|---|---|---|
| ~190 | `alert("Project not found")` | `toast.error("Project not found")` |
| ~244 | `alert("Guide not found")` | `toast.error("Guide not found")` |
| ~261 | `alert("Failed to load data")` | `toast.error("Failed to load data")` |
| ~286 | `alert("You need at least one question set")` | `toast.error("You need at least one question set")` |
| ~437 | `alert("Add at least one question...")` | `toast.error("Add at least one question before checking")` |
| ~600 | `alert("Failed to check questions: " + ...)` | `toast.error("Failed to check questions: " + ...)` |
| ~607 | `alert("Failed to check questions")` | `toast.error("Failed to check questions")` |
| ~653 | `alert("Please provide a title...")` | `toast.error("Please provide a title for all question sets")` |
| ~657 | `alert("Please provide an intent...")` | `toast.error("Please provide an intent for all question sets")` |
| ~662 | `alert(\`Please add at least one question...\`)` | `toast.error(\`Please add at least one question...\`)` |
| ~706 | `alert("Failed to save: " + ...)` | `toast.error("Failed to save: " + ...)` |
| ~711 | `alert("Failed to save guide")` | `toast.error("Failed to save guide")` |
| ~741 | `alert("Failed to complete setup: " + ...)` | `toast.error("Failed to complete setup: " + ...)` |
| ~745 | `alert("Failed to complete setup")` | `toast.error("Failed to complete setup")` |

After the swap, grep to confirm all are migrated:
```bash
grep -n "\\balert(" src/app/projects/new/guide/page.tsx
```
Expected: no output.

- [ ] **Step 4: Refactor `getSeverityColor`**

Find the function around lines 920-927. It currently returns strings like `"text-red-600 bg-red-50"`. Replace the entire function with:

```tsx
const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'HIGH':
      return 'text-[color:var(--danger)] bg-[color:var(--danger-soft)] border-[color:var(--danger)]/25'
    case 'MEDIUM':
      return 'text-[color:var(--warning)] bg-[color:var(--warning-soft)] border-[color:var(--warning)]/25'
    case 'LOW':
      return 'text-[color:var(--info)] bg-[color:var(--info-soft)] border-[color:var(--info)]/25'
    default:
      return 'text-muted-foreground bg-[color:var(--surface-muted)] border-[color:var(--border-subtle)]'
  }
}
```

- [ ] **Step 5: Replace page title class**

Find the `<h1 className="text-base font-bold">` (or similar) around line 955. Replace with `<h1 className="text-display-2">`.

- [ ] **Step 6: Replace hand-rolled spinner**

Find the hand-rolled spinner div around line 1577, typically:
```tsx
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
```

Replace with:
```tsx
<CenteredSpinner label="Loading guide editor..." />
```

If the spinner is inside a centering wrapper, the `CenteredSpinner` handles centering itself — simplify the wrapper if it becomes redundant.

- [ ] **Step 7: Color-class sweep across feedback cards**

Using the token map from this plan's header section, walk through the file and replace every raw Tailwind color class. The file has many — the audit flagged lines 1041, 1269, 1292, 1345, 1354, 1359, 1399, 1435, 1488, 1497, 1502, 1521 as particularly dense.

**Strategy:** Use sed-style find-replace with the mappings in the header, BUT be careful — read each site before replacing to pick the right token (amber-brand vs amber-warning; violet-knowledge vs violet-severity). General rules:

- `text-blue-400`, `text-blue-500`, `text-blue-600` → `text-[color:var(--info)]`
- `bg-blue-50` → `bg-[color:var(--info-soft)]`
- `border-blue-` (200/300/400/500) → `border-[color:var(--info)]/25`
- `text-violet-400`, `text-violet-500`, `text-violet-600` → `text-[color:var(--knowledge)]`
- `bg-violet-50` → `bg-[color:var(--knowledge-soft)]`
- `border-violet-*` → `border-[color:var(--knowledge)]/25`
- `text-red-500`, `text-red-600`, `text-red-700` → `text-[color:var(--danger)]`
- `bg-red-50` → `bg-[color:var(--danger-soft)]`
- `border-red-*` → `border-[color:var(--danger)]/25`
- `text-amber-600`, `text-amber-700` → likely warning; `text-amber-900` on light backgrounds → `text-[color:var(--warning)]`
- `bg-amber-50` → `bg-[color:var(--warning-soft)]`
- `border-amber-*` → `border-[color:var(--warning)]/25`

After each region, run:
```bash
grep -nE "text-(blue|violet|red|amber)-[0-9]|bg-(blue|violet|red|amber)-[0-9]|border-(blue|violet|red|amber)-[0-9]" src/app/projects/new/guide/page.tsx | head -20
```
to see what's left. Iterate until nothing comes back.

- [ ] **Step 8: Normalise any page-wrapper padding**

If the file has a `<div className="pb-12">` or `py-8` wrapper around the main content, change to `pb-20` for consistency. Leave the existing sticky header as-is in this task — Part B handles it.

- [ ] **Step 9: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-(red|blue|violet|amber)-[0-9]+|bg-(red|blue|violet|amber)-[0-9]+|border-(red|blue|violet|amber)-[0-9]+)" src/app/projects/new/guide/page.tsx
```
Expected: no output. (If any `bg-amber-50` survives inside a carefully-chosen intentional compliance block, document it — but generally the target is zero.)

- [ ] **Step 10: Build + lint**

```bash
npm run build && npx eslint src/app/projects/new/guide/page.tsx
```
Must exit 0.

- [ ] **Step 11: Browser check**

```bash
npm run dev
```
Open `/projects/new/guide?projectId=<any-id>`. Verify:
- The guide editor loads (Suspense fallback shows `CenteredSpinner`).
- Severity badges on feedback cards render with amber-warning or red-danger tints, not raw Tailwind.
- Hitting a validation error (empty title, etc.) shows a toast (bottom-right).
- Saving succeeds (or errors) via toast, not `alert()`.

Stop dev.

- [ ] **Step 12: Commit**

```bash
git add src/app/projects/new/guide/page.tsx
git commit -m "style(projects/new/guide): migrate alerts/spinner/severity/colors (Part A)

- Replace 14 alert() calls with toast.error (sonner)
- Replace hand-rolled spinner with <CenteredSpinner>
- Refactor getSeverityColor to use --danger / --warning / --info tokens
- text-display-2 for page title
- Sweep hard-coded blue/violet/red/amber color classes across
  feedback cards and research insights into CSS var tokens

Does not yet migrate the sticky header — that's Part B."
```

---

## Task 5: Migrate `/projects/new/guide` — Part B (PageBar)

**Files:**
- Modify: `src/app/projects/new/guide/page.tsx`

**What this does:** Replace the edge-to-edge `px-8 py-3` sticky header with `<PageBar>`. This is a structural change that affects sticky positioning and main content padding. Done separately so it can be rolled back independently if it causes layout issues.

- [ ] **Step 1: Read the current header block**

The sticky header lives around lines 940–1025. It typically looks like a `<div>` with `sticky top-16 z-40 bg-background border-b ... left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen` — an edge-to-edge bar — containing a flex row of the back button + title + action buttons.

Open `src/app/projects/new/guide/page.tsx` at those lines and understand:
- Which action buttons render in the header (typically Export, Import, Preview, Check Questions, Save, Complete Setup)
- What state / handlers each triggers
- Whether there's a "status" indicator (e.g. unsaved-changes dot)

- [ ] **Step 2: Add imports**

```tsx
import { PageBar } from "@/components/layout/page-bar"
```

- [ ] **Step 3: Replace the sticky header block**

Replace the entire sticky header block with `<PageBar>`:

```tsx
<PageBar
  back={{
    href: subProjectId
      ? `/projects/${projectId}/sub/${subProjectId}?tab=guides`
      : `/projects/${projectId}`,
    label: "Back",
  }}
  action={
    <div className="flex items-center gap-2">
      {/* Preserve the existing action buttons exactly, using Button primitives.
          If any action button is currently a raw <button>, swap to <Button variant="..." size="sm">.
          Keep their onClick handlers and state dependencies unchanged. */}
    </div>
  }
/>
```

**Actions to preserve** (from the existing header; adapt names/sizes/variants to match what's there):
- Export (Download icon) → `<Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Export</Button>`
- Import (Upload icon) → same pattern
- Preview (Eye icon) → same pattern
- Check Questions (Sparkles icon) → `<Button variant="outline" size="sm">` (or `variant="secondary"` if highlighted)
- Save — primary action → `<Button size="sm">` (default amber)
- Complete Setup — primary-featured action → `<Button variant="featured" size="sm">`

If any action button has a `disabled` state, keep it. If there's an unsaved-changes indicator (small dot near Save), include it as a child of the `action` div.

**Do not render the page `<h1>` inside PageBar** — it stays in the main content below.

- [ ] **Step 4: Rework main content wrapper below PageBar**

The old edge-to-edge header was `sticky top-16 z-40` with `bg-background`. Below it, content typically had `<div className="px-8 py-3 ...">` or similar.

With `<PageBar>` now handling the sticky sub-header, the main content can be plain:

```tsx
<div className="pt-6 pb-20">
  <h1 className="text-display-2">Moderator Guide</h1>
  {/* ... rest of the content ... */}
</div>
```

If the old layout used `px-8` to match the header, remove it — the root layout's `max-w-7xl px-4 sm:px-6 lg:px-8` already provides horizontal padding.

- [ ] **Step 5: Verify sticky positioning**

The `<PageBar>` primitive already has `sticky top-16 z-40` baked in. The main content now flows normally beneath it. There's no need to add manual `top` offsets to the H1 or any other element.

Scroll behaviour: the TopNavbar is `h-16 sticky top-0`, then PageBar sits at `top-16 sticky`, then content scrolls.

- [ ] **Step 6: Build + lint**

```bash
npm run build && npx eslint src/app/projects/new/guide/page.tsx
```
Must exit 0.

- [ ] **Step 7: Browser check (critical for this task)**

```bash
npm run dev
```

Open `/projects/new/guide?projectId=<any-id>`. Verify:
- The PageBar renders as a sticky sub-header with Back + action buttons.
- Scrolling the page keeps PageBar pinned below the TopNavbar.
- Save button shows active state correctly; Save on click triggers toast on error / navigates on success.
- Action buttons align on the right side of the bar, not overflowing.
- No horizontal scrollbar (the old `w-screen` is gone).
- Entering an empty-title state triggers toast, not alert.

Stop dev.

- [ ] **Step 8: Final hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-(red|blue|violet|amber)-[0-9]+|bg-(red|blue|violet|amber)-[0-9]+|border-(red|blue|violet|amber)-[0-9]+|w-screen|-ml-\\[50vw\\])" src/app/projects/new/guide/page.tsx
```
Expected: no output. (The `w-screen` / `-ml-[50vw]` greps catch any lingering edge-to-edge trickery from the old header.)

- [ ] **Step 9: Commit**

```bash
git add src/app/projects/new/guide/page.tsx
git commit -m "style(projects/new/guide): migrate sticky header to PageBar (Part B)

- Replace px-8 py-3 edge-to-edge sticky header with <PageBar>
- Action slot hosts Export/Import/Preview/Check/Save/Complete buttons
  using Button primitives (featured for 'Complete setup')
- Remove w-screen / -ml-[50vw] edge-to-edge hacks
- Main content wrapper becomes pt-6 pb-20; PageBar handles sticky"
```

---

## Task 6: Final verification

**Files:** none modified.

- [ ] **Step 1: Clean build**

```bash
npm run build
```
Expected: 0 errors. All 25 routes compile.

- [ ] **Step 2: Lint scoped to PR-3 modified files**

```bash
npx eslint \
  src/app/projects/new/page.tsx \
  src/app/projects/new/guide/page.tsx \
  "src/app/projects/[projectId]/page.tsx" \
  "src/app/projects/[projectId]/kb/page.tsx"
```
Expected: 0 errors (pre-existing `<img>` warnings elsewhere are acceptable).

- [ ] **Step 3: Hazard grep across PR 3 scope**

```bash
echo "-- alert/confirm --"
grep -rn "\\balert(\\|\\bconfirm(" src/app/projects/new src/app/projects/\[projectId\] 2>/dev/null | grep -v ".test." || echo "OK: no alert/confirm"

echo ""
echo "-- bg-white --"
grep -rn "bg-white" src/app/projects/new src/app/projects/\[projectId\] 2>/dev/null || echo "OK: no bg-white"

echo ""
echo "-- hex literals --"
grep -rnE "#[0-9a-f]{3,6}\\b" src/app/projects/new src/app/projects/\[projectId\] 2>/dev/null | grep -vE "^.*:\\s*//" || echo "OK: no hex literals"

echo ""
echo "-- raw status colors --"
grep -rnE "text-(red|blue|violet)-[0-9]+" src/app/projects/new src/app/projects/\[projectId\] 2>/dev/null || echo "OK: no raw status colors"

echo ""
echo "-- raw amber status colors (600-900 only, lower may be intentional tints if still present) --"
grep -rnE "text-amber-[6-9]00|bg-amber-[1-9][0-9]0|border-amber-[1-9][0-9]0" src/app/projects/new src/app/projects/\[projectId\] 2>/dev/null || echo "OK: no raw amber status colors"
```

Each grep should return `OK:` or no results. If a stray match appears:
- If it's inside an intentional tint block (rare in PR 3) — document it.
- Otherwise: fix it before declaring PR 3 done.

- [ ] **Step 4: Browser walk of all 4 migrated routes**

```bash
npm run dev
```

Walk each route end-to-end:

1. `/projects/new` — fill in name, submit. Fill in empty → toast error. Submit → redirect to guide.
2. `/projects/new/guide?projectId=<real-project>` — PageBar pinned, all action buttons work, Check Questions + Save + Complete Setup triggers toast on error, not alert. Severity badges use token colours.
3. `/projects/[projectId]` — PageHeader, edit pencil (aria-label), Knowledge Base button (amber-knowledge variant), delete workspace triggers AlertDialog not confirm.
4. `/projects/[projectId]/kb` — upload triggers proper Dialog + toast, delete triggers AlertDialog, checkbox renders as Checkbox primitive, compliance card uses warning tokens, empty state uses `<EmptyState>`.

Stop dev.

- [ ] **Step 5: Summary**

Post a summary:
- Routes migrated: 4.
- Alert/confirm migrations: 22 alerts → toasts; 2 confirms → AlertDialogs.
- Primitive swaps: hand-rolled upload button, raw checkbox, hand-rolled spinner, dashed-border empty state, custom KB button → token/variant-driven primitives.
- `PageBar` deployed to guide editor.
- Severity tokens wired up.
- `npm run build` + `npm run lint` clean.

---

## Self-Review (author)

**Spec coverage:**
- §8 PR 3 routes (4) → Tasks 1, 2, 3, 4+5 (guide split for safety).
- Hand-rolled Button / Checkbox / EmptyState / spinner replacements → Tasks 3, 4.
- 22 `alert()` + 2 `confirm()` migrations → Tasks 1 (3), 2 (4 incl. confirm), 3 (5 incl. confirm), 4 (14).
- Severity/info/knowledge/warning token usage → Task 4 (severity function) + Task 3 (compliance card).
- `PageBar` deployment on guide editor → Task 5.
- `<Button variant="knowledge">` for KB button on project detail → Task 2 Step 7.
- `aria-label` on icon-only buttons → Tasks 2 Step 6, 3 Step 13.
- Page titles normalised to `text-display-2` → every task.
- Outer wrappers normalised to `pt-6 pb-20` → every task.

**Placeholder scan:**
- Task 5 Step 3 says "preserve the existing action buttons exactly" without enumerating them by name. Mitigation: the step provides a concrete list of six typical actions (Export/Import/Preview/Check/Save/Complete) as a template. Engineer reads the file to confirm which ones are actually there. Not a placeholder — it's a variable mapping.
- Task 4 Step 7 has a color-class sweep that's pattern-based rather than line-by-line. The mapping table in the plan header is exhaustive for the color classes used in the file. Plus there's a final grep gate. Adequate.
- No "TBD" / "implement later" / missing acceptance criteria.

**Type/name consistency:**
- `PageBar`, `BackLink`, `PageHeader`, `EmptyState`, `ErrorState`, `Checkbox`, `AlertDialog*` all imported from their PR-1 paths.
- `toast` from `sonner`.
- Severity tokens `--danger`, `--warning`, `--info`, `--knowledge` all defined in PR 1 globals.css.
- Amber `--primary` + warning `--warning` — distinct tokens; plan calls out when to use which.

**Scope check:** One PR's worth of work (project core). Does not overlap with PR 4 (sub-project shell + WorkspaceFrame deployment).
