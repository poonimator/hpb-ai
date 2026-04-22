# UI Refresh — PR 3.5 (Moderator Guide WorkspaceFrame Rebuild) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the Moderator Guide editor (`/projects/new/guide`) to adopt the exploration-file workspace pattern — 280px left rail with session meta + jump-to navigation + readiness indicator, 1fr main column. Visually aligns the guide editor with the tool screens that will land in PR 5 (Simulate, HMW, Ideation, Mapping, Insights, Archetypes), so the whole tool flow reads as one system.

**Architecture:** Wrap the existing main content in `<WorkspaceFrame variant="review">` with a left rail built inline from the rail primitives shipped in PR 1 (`RailHeader`, `RailSection`, `MetaRow`, `JumpItem`). The rail reads from the page's existing state — `project`, `guideSets`, `hasUnsavedChanges`, `saving` — no new data fetch. Jump-to navigation anchors scroll to question-set containers using `scrollIntoView`. The main column retains every existing question-edit, quality-check, and import/export interaction. No data or API changes.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind v4, shadcn/ui. Primitives used: `WorkspaceFrame` (`@/components/layout/workspace-frame`), `RailHeader` / `RailSection` / `MetaRow` / `JumpItem` (`@/components/layout/*`), `Eyebrow` / `Mono` (`@/components/ui/*`), `Badge`.

**Reference designs:**
- `claude design explorations/platform-screens.jsx` — `HMWAnalyser` (lines ~514–720) and `ArchetypeProfile` (lines ~296–415) — 3-column workspace layouts, rail hierarchy, jump-to pattern.
- `claude design explorations/session-review-v2.jsx:306–527` — 280/1fr review layout most structurally similar to what the guide editor needs (single-focus long-form content with rail anchors).
- `claude design explorations/interview simulation.jsx:234–310` — `ModeratorGuide` component, shows the compact in-session version of question-set navigation with checklist + progress. Useful for readiness-indicator pattern.

**Important notes for the engineer:**
1. **This is a layout restructure, not a feature change.** All existing question-editing, quality-check, import/export, save, complete-setup flows must work exactly as before. The rail is additive navigation, not a new feature.
2. **Preserve every state hook, effect, fetch, and handler.** The file is 1565 lines post-PR 3; nearly all of that logic stays. Only the outermost wrapper and the jump-to plumbing change.
3. **PageBar stays.** PR 3 Task 5 deployed `<PageBar>` as the sticky sub-header with back + action buttons. PR 3.5 keeps that exactly — WorkspaceFrame sits below PageBar in the JSX tree.
4. **Zero tolerance in touched code:** no `alert(`, no hex literals, no raw `text-{red,blue,violet,amber}-N` classes, no `bg-white`. PR 3 cleared these; don't reintroduce.
5. **No scope creep.** If you find opportunities to extract `QuestionSetCard` / `QualityFeedbackCard` / `ResearchInsightCard` into their own files, note them — don't do it. That's its own PR.
6. **Branch:** `ui-upgrade-elevenlabs-style`. Last PR 3 commit: `3c3fdaf`.

**File state going in:**
- Target file: `src/app/projects/new/guide/page.tsx` (1565 lines).
- Relevant type: `interface GuideSet { id: string; title: string; intent: string; questions: Question[]; isExpanded: boolean; isChecking: boolean }`.
- Relevant state (at top of `GuideSetupPageContent`):
  - `project: Project | null`
  - `guideSets: GuideSet[]`
  - `guideName: string`
  - `hasUnsavedChanges: boolean`
  - `hasSavedGuide: boolean`
  - `saving: boolean`, `finishing: boolean`, `importing: boolean`
- Existing outer structure (after PR 3):
  ```tsx
  <>
    <PageBar back={...} action={<div>...action buttons...</div>} />
    <div className="pt-6 pb-20">
      <h1 className="text-display-2 mb-6">Moderator Guide Setup</h1>
      {/* ... imports, imports dialog, question sets ... */}
    </div>
  </>
  ```

---

## Task 1: Build `GuideLeftRail` inline component

**Files:**
- Modify: `src/app/projects/new/guide/page.tsx`

**What this does:** Adds the three rail sections (Guide meta, Question sets, Readiness) as an inline functional component inside `GuideSetupPageContent`. The component reads from the enclosing closure — no prop drilling. Also exports a `handleJumpToSet(id)` helper for Task 2's scroll wiring.

- [ ] **Step 1: Add imports**

At the top of the file, ensure these imports are present (add any that are missing — some may already be there from PR 3):

```tsx
import { WorkspaceFrame } from "@/components/layout/workspace-frame"
import { RailHeader } from "@/components/layout/rail-header"
import { RailSection } from "@/components/layout/rail-section"
import { MetaRow } from "@/components/layout/meta-row"
import { JumpItem } from "@/components/layout/jump-item"
import { Badge } from "@/components/ui/badge"
import { Mono } from "@/components/ui/mono"
```

Remove any imports that become unused as a result of the refactor (TypeScript + lint will catch these in the verification step).

- [ ] **Step 2: Add the `handleJumpToSet` helper inside `GuideSetupPageContent`**

Near the other handlers (somewhere in the top ~400 lines of the component body, after the state hooks), add:

```tsx
const handleJumpToSet = useCallback((setId: string) => {
  const el = document.getElementById(`guideset-${setId}`)
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" })
  }
}, [])
```

(`useCallback` is already imported at line 3.)

Also add an `activeSetId` tracker for the JumpItem's `active` state. The simplest implementation uses an `IntersectionObserver`:

```tsx
const [activeSetId, setActiveSetId] = useState<string | null>(null)

useEffect(() => {
  if (guideSets.length === 0) return

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((e) => e.isIntersecting)
      if (visible.length > 0) {
        const top = visible.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        )[0]
        const id = top.target.getAttribute("data-guideset-id")
        if (id) setActiveSetId(id)
      }
    },
    { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.25] }
  )

  guideSets.forEach((set) => {
    const el = document.getElementById(`guideset-${set.id}`)
    if (el) observer.observe(el)
  })

  return () => observer.disconnect()
}, [guideSets])
```

Place this effect near the other `useEffect` blocks. `rootMargin` offsets account for the `top-16` TopNavbar + ~56px PageBar height; tune if the active indicator feels jumpy during scroll.

- [ ] **Step 3: Add the `GuideLeftRail` inline render function**

Just above the `return (` statement of `GuideSetupPageContent`, define:

```tsx
const totalQuestions = guideSets.reduce((sum, s) => sum + s.questions.length, 0)
const setsWithQuestions = guideSets.filter((s) => s.questions.length > 0).length
const setsWithTitles = guideSets.filter((s) => s.title.trim().length > 0).length

const statusLabel = hasUnsavedChanges
  ? "Unsaved"
  : hasSavedGuide
  ? "Saved"
  : "Draft"
const statusBadgeVariant: "default" | "warning" | "success" =
  hasUnsavedChanges ? "warning" : hasSavedGuide ? "success" : "default"

const leftRail = (
  <>
    <RailHeader>
      <div className="flex items-center gap-2">
        <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
        {saving && <span className="text-caption text-muted-foreground">Saving…</span>}
      </div>
      <h2 className="text-display-5 text-foreground leading-tight">
        {guideName || "Moderator Guide"}
      </h2>
      {project?.name && (
        <p className="text-body-sm text-muted-foreground">
          For <span className="text-foreground">{project.name}</span>
        </p>
      )}
    </RailHeader>

    <RailSection title="Guide Info">
      <MetaRow k="Question sets" v={<Mono>{guideSets.length}</Mono>} />
      <MetaRow k="Total questions" v={<Mono>{totalQuestions}</Mono>} />
      <MetaRow k="With titles" v={<Mono>{setsWithTitles}/{guideSets.length}</Mono>} />
      <MetaRow k="Has questions" v={<Mono>{setsWithQuestions}/{guideSets.length}</Mono>} />
    </RailSection>

    <RailSection title="Question sets">
      {guideSets.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">No question sets yet.</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {guideSets.map((set, idx) => (
            <JumpItem
              key={set.id}
              label={set.title.trim() || `Untitled set ${idx + 1}`}
              count={set.questions.length}
              active={activeSetId === set.id}
              onClick={() => handleJumpToSet(set.id)}
            />
          ))}
        </div>
      )}
    </RailSection>

    <RailSection title="Readiness" last>
      <div className="flex flex-col gap-2">
        <ReadinessRow
          done={setsWithTitles === guideSets.length && guideSets.length > 0}
          label="Every set has a title"
        />
        <ReadinessRow
          done={setsWithQuestions === guideSets.length && guideSets.length > 0}
          label="Every set has a question"
        />
        <ReadinessRow done={hasSavedGuide} label="Guide saved" />
      </div>
    </RailSection>
  </>
)
```

- [ ] **Step 4: Add the `ReadinessRow` helper**

At the bottom of the file (before the `// Created by ...` footer comment) or above `GuideSetupPageContent`, add:

```tsx
function ReadinessRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-body-sm">
      <span
        aria-hidden
        className={
          done
            ? "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-fg)]"
            : "inline-flex h-3.5 w-3.5 rounded-full shadow-inset-edge bg-[color:var(--surface-muted)]"
        }
      >
        {done && (
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.5 4.2L3.2 5.8L6.5 2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </div>
  )
}
```

- [ ] **Step 5: Build + lint (no layout change yet — still on old structure)**

```bash
npm run build && npx eslint src/app/projects/new/guide/page.tsx
```

The file won't render differently yet (leftRail is defined but not used). Build + lint must still pass. If TypeScript complains about unused variables, that's expected — Task 2 uses them.

- [ ] **Step 6: Commit**

```bash
git add src/app/projects/new/guide/page.tsx
git commit -m "feat(guide): build GuideLeftRail inline (meta + jump-to + readiness)

Adds the inline rail subtree for the upcoming WorkspaceFrame layout,
plus handleJumpToSet + activeSetId (IntersectionObserver) plumbing
and a ReadinessRow helper. The rail consumes existing state — no new
data fetches, no new APIs.

Does not yet render — Task 2 wires it through WorkspaceFrame."
```

---

## Task 2: Wrap main content in `WorkspaceFrame`

**Files:**
- Modify: `src/app/projects/new/guide/page.tsx`

**What this does:** Replace the existing `<div className="pt-6 pb-20">` main-content wrapper with `<WorkspaceFrame variant="review" leftRail={leftRail}>`. The page title moves inside the main column. Question-set cards get `id={\`guideset-${set.id}\`}` anchors so the rail's JumpItems can scroll to them.

- [ ] **Step 1: Find the existing outer wrapper**

In the current JSX, find the `<div className="pt-6 pb-20">` that wraps the entire main content below `<PageBar />`. It encloses the h1, the import dialog trigger, and the stack of question sets.

- [ ] **Step 2: Replace the wrapper with `<WorkspaceFrame>`**

Change:

```tsx
<div className="pt-6 pb-20">
  <h1 className="text-display-2 mb-6">Moderator Guide Setup</h1>
  {/* import controls, question set stack, etc. */}
</div>
```

To:

```tsx
<WorkspaceFrame variant="review" leftRail={leftRail}>
  <div className="max-w-3xl">
    <div className="flex flex-col gap-1 mb-8">
      <Eyebrow>Setup</Eyebrow>
      <h1 className="text-display-1 text-foreground">Moderator Guide</h1>
      <p className="text-body-lg text-muted-foreground">
        Design the question sets the AI moderator will use. Each set should have an intent and a few questions; quality feedback appears inline as you type.
      </p>
    </div>
    {/* import controls, question set stack, etc. — KEEP EVERY EXISTING CHILD EXACTLY */}
  </div>
</WorkspaceFrame>
```

Notes:
- `Eyebrow` is already imported from PR 3.
- The `text-display-1` (34px) replaces the previous `text-display-2` (28px) to match the exploration files' hero scale for workspace/review screens (`session-review-v2.jsx:413` uses 34px).
- `max-w-3xl` constrains the reading column to ~768px, matching the exploration's 760–820px prose widths.
- **Do not** delete any child JSX below the new hero block. Everything that used to render inside the `<div className="pt-6 pb-20">` now renders inside the new `<div className="max-w-3xl">` (below the hero) instead, preserving the order and content exactly.

- [ ] **Step 3: Anchor each question-set card**

Find the question-set render loop. In the existing code it's a map over `guideSets` — each iteration renders a card-like container (likely a `<div>` with styling for the quality feedback and editing UI).

For each rendered question-set container, add two attributes to the outermost element of the iteration:

```tsx
id={`guideset-${set.id}`}
data-guideset-id={set.id}
```

So the iteration outer element becomes e.g.:

```tsx
<div
  key={set.id}
  id={`guideset-${set.id}`}
  data-guideset-id={set.id}
  className="/* existing classes */ scroll-mt-[calc(var(--top-offset,64px)+72px)]"
>
  {/* existing card content */}
</div>
```

The `scroll-mt-*` class ensures the card isn't hidden behind the TopNavbar + PageBar when scrolled to. Use an explicit value — something like `scroll-mt-[120px]` — if arbitrary property syntax isn't comfortable for the engineer:

```tsx
className="/* existing classes */ scroll-mt-[120px]"
```

- [ ] **Step 4: Build + lint**

```bash
npm run build && npx eslint src/app/projects/new/guide/page.tsx
```

Must pass. If TypeScript warns about `activeSetId` being unused, it should no longer — Task 1's JumpItem uses it.

- [ ] **Step 5: Browser check**

```bash
npm run dev
```

Open `/projects/new/guide?projectId=<real-project-id>`. Verify:
- TopNavbar + PageBar render as before.
- Below PageBar: a 280px white left rail + 1fr main column on warm canvas.
- Rail shows Guide Info section with counts, Question sets section with JumpItems, Readiness section with pip indicators.
- Clicking a JumpItem scrolls to the matching question-set card (smooth scroll).
- Scrolling the page changes which JumpItem is highlighted (IntersectionObserver firing).
- All existing edit interactions still work: add question set, add question, edit title/intent, check questions, delete, import, save, complete setup.
- No horizontal scrollbar.

Stop dev.

- [ ] **Step 6: Commit**

```bash
git add src/app/projects/new/guide/page.tsx
git commit -m "feat(guide): adopt WorkspaceFrame layout with 280px left rail

- Wrap main content in <WorkspaceFrame variant='review' leftRail={...}>
- Hero block uses Eyebrow + text-display-1 (matches exploration files'
  session-review-v2 hero at 34px light)
- Constrain reading column to max-w-3xl (~768px)
- Anchor each question-set card with id + data-guideset-id +
  scroll-mt-[120px] for rail jump-to navigation
- Preserves every existing handler, fetch, and edit flow"
```

---

## Task 3: Polish spacing + verification

**Files:**
- Modify: `src/app/projects/new/guide/page.tsx` (final touches only)

**What this does:** Tighten the spacing inside the main column to match the exploration grammar, run full hazard grep, confirm clean build/lint, browser-walk the end-to-end editing flow.

- [ ] **Step 1: Tighten inter-set spacing**

In the guide-set iteration, if the existing gap between cards is `mb-8` or similar, tune to `mb-6` (24px) for a tighter vertical rhythm per the exploration files' 24–28px inter-section spacing.

Wrap the stack of question sets in a flex column:

```tsx
<div className="flex flex-col gap-6">
  {guideSets.map((set, idx) => (
    <div
      key={set.id}
      id={`guideset-${set.id}`}
      data-guideset-id={set.id}
      className="scroll-mt-[120px] /* ...existing card classes... */"
    >
      {/* existing card content */}
    </div>
  ))}
</div>
```

If the existing render already uses a flex/gap pattern, just adjust the `gap-*` value; don't introduce a duplicate wrapper.

- [ ] **Step 2: Add "Add question set" CTA alignment**

If the "Add question set" button sits outside the card list, align its margin-top to `mt-6` for consistency with the card gap.

- [ ] **Step 3: Hazard grep**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|text-(red|blue|violet|amber)-[0-9]+|bg-(red|blue|violet|amber)-[0-9]+|border-(red|blue|violet|amber)-[0-9]+|w-screen|-ml-\\[50vw\\])" src/app/projects/new/guide/page.tsx
```

Expected: zero matches. If any appear, PR 3's cleanup regressed — fix before committing.

- [ ] **Step 4: Full build + lint scoped**

```bash
npm run build
npx eslint src/app/projects/new/guide/page.tsx
```

Build must be clean. Lint errors must be <= pre-PR-3.5 count (the `@typescript-eslint/no-explicit-any` errors pre-date this work; don't chase them). If lint reports NEW errors from this PR's edits, fix them.

- [ ] **Step 5: Browser walk — end-to-end**

```bash
npm run dev
```

Go through this flow:

1. Load `/projects/new/guide?projectId=<real-project>`.
2. Left rail visible: Guide Info, Question sets, Readiness.
3. Scroll the main column — active JumpItem updates as each question-set card crosses the top band.
4. Click a JumpItem → smooth scroll to that card.
5. Edit a question set title → Readiness "Every set has a title" pip transitions to green when all sets have titles.
6. Add a question → Readiness "Every set has a question" updates; Guide Info "Total questions" count updates.
7. Run "Check Questions" → the feedback renders inline in the main column (NOT in the rail).
8. Save → status badge in rail transitions from "Unsaved" to "Saved"; toast fires on failure.
9. Complete setup → existing completion flow unchanged.
10. Resize the browser width — below ~1024px the app's mobile-disclaimer overlay kicks in; above 1024px, rail + main render side-by-side without overflow.

Stop dev.

- [ ] **Step 6: Commit**

```bash
git add src/app/projects/new/guide/page.tsx
git commit -m "style(guide): tighten inter-set spacing + verify workspace layout

- Stack question sets in flex column with gap-6 (24px)
- Align 'Add question set' CTA mt-6
- Hazard grep, build, lint, browser walk all clean"
```

---

## Task 4: Final verification

**Files:** none modified.

- [ ] **Step 1: Commit log review**

```bash
git log --oneline 3c3fdaf..HEAD
```

Expected: 3 commits (one per task), in order:
1. `feat(guide): build GuideLeftRail inline ...`
2. `feat(guide): adopt WorkspaceFrame layout ...`
3. `style(guide): tighten inter-set spacing ...`

- [ ] **Step 2: Diff stat**

```bash
git diff --stat 3c3fdaf..HEAD
```

Only `src/app/projects/new/guide/page.tsx` should appear. No other files. Insertion count should be modest (~80–120 lines for rail + wrapper + readiness helper). Deletion count should be small (replacing the old wrapper div).

- [ ] **Step 3: Clean build**

```bash
npm run build
```

Must pass with zero errors.

- [ ] **Step 4: Grep sanity — no reintroduced debt**

```bash
grep -nE "(\\balert\\(|\\bconfirm\\(|bg-white|#[0-9a-f]{3,6}|w-screen|-ml-\\[50vw\\]|text-(red|blue|violet)-[0-9]+)" src/app/projects/new/guide/page.tsx || echo OK
```

- [ ] **Step 5: Summary to user**

Report:
- 3 commits landed; diff is scoped to a single file.
- `WorkspaceFrame` deployed; left rail shows Guide Info, Question sets with JumpItems, Readiness pips.
- Jump-to scroll + IntersectionObserver active-state tracking.
- Every existing edit flow preserved.
- Build + lint clean; no hazards reintroduced.
- Flag for PR 5 follow-up: the guide editor now sets the visual template the tool screens will match. When PR 5 lands Simulate / HMW / etc., they'll share this grammar.

---

## Self-Review (author)

**Spec coverage:**
- PR 3.5's stated goal (WorkspaceFrame rebuild of guide editor to match exploration layouts) → Task 2 wraps content + Task 1 builds rail.
- Preservation of all existing guide-editing logic → every task explicitly preserves handlers/state; no business logic touched.
- Visual alignment with the tool-family screens that land in PR 5 → achieved via `WorkspaceFrame variant="review"` (same 280/1fr structure as `session-review-v2.jsx`).

**Placeholder scan:**
- Task 1 Step 3 refers to "the existing card-like container" in the question-set render loop without showing the engineer that container's exact line number. Mitigation: the file is a single component; grep for `guideSets.map(` finds the site in one hop. This is a variable reference, not a missing piece.
- Task 2 Step 3 uses `scroll-mt-[120px]` as an explicit fallback for the `calc(...)` variant. Both are valid; the engineer picks one. That's a choice, not a placeholder.
- Task 3 Step 1 says "if the existing render already uses a flex/gap pattern, just adjust the gap-* value". This is adaptive guidance — the engineer reads the code and picks the minimal change. Acceptable.
- No "TBD" / "implement later" / vague acceptance criteria found.

**Type/name consistency:**
- `WorkspaceFrame`, `RailHeader`, `RailSection`, `MetaRow`, `JumpItem`, `Eyebrow`, `Mono`, `Badge` — all from paths shipped in PR 1.
- State references (`guideSets`, `project`, `hasUnsavedChanges`, `hasSavedGuide`, `saving`, `guideName`) verified against the file header I read. `GuideSet` type fields (`id`, `title`, `questions`) verified against line 78.
- `handleJumpToSet(setId)` signature consistent across Task 1 (definition) and Task 2 (invocation via JumpItem onClick).
- `activeSetId` defined in Task 1, consumed in Task 2 JumpItem `active` prop.

**Scope check:** Single PR focused on one file. No overlap with PR 4 (sub-project shell) or PR 5 (tools). Matches the "PR 3.5 is its own PR" scope we agreed on after PR 3.
