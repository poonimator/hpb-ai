# PR 9 — Design review fixes

**Branch:** `ui-upgrade-elevenlabs-style`
**Scope:** implement the 9 items the user selected from the platform-wide design review + Edit Workspace dialog migration. Do NOT address any item outside this plan.
**Constraint:** "Be very careful not to break anything." Every task must preserve existing behavior, fetch payloads, handler signatures, and content. The overhaul is visual-discipline + small state additions — not a functional rewrite.
**Execution model:** subagent-driven-development (SKILL). One implementer per task, sequential (no parallel implementation — file conflicts). Controller verifies build + diff after each task. Final cross-task code review at end.

---

## Items in scope

From the platform design review report, user selected:

| # | Item | Report severity |
|---|---|---|
| 2 | Simulation resume state for `!endedAt` on `/simulations/[id]` | critical |
| 4 | Migrate quote-card + map-session 14-color Tailwind-50 palette to tokens | high |
| 5 | Migrate HMW/Insights/Ideation/session-review persona hex palettes to tokens | high/critical |
| 6 | Add `primary` (amber) Button variant | high |
| 7 | Add `destructive-outline` Button variant | high |
| 8 | Replace `alert()` with `toast.error()` across HMW/Insights | high |
| 9 | Fix workspace-hub loading flash (`min-h-screen` collides with shell) | critical |
| 10 | KB upload progress indicator | medium |
| 13 | Clean up duplicate research-statement dialogs on workspace hub | high |
| + | Migrate Edit Workspace page → dialog (like Edit Project) | user-added |

Items explicitly NOT in scope: workspace-hub 7-tab restructure, Waldenburg font, icon-chip section headers on Settings, ARIA landmarks, keyboard delete affordance, mobile responsive. These stay untouched.

---

## Execution order + file ownership

Serialized by file dependency. Each task lists exact files touched so review can verify no scope creep.

### T1 — Foundations: Button variants + cat tokens

**Files:**
- `src/components/ui/button.tsx`
- `src/app/globals.css`

**Changes:**
1. Add new variant `primary` to `button.tsx`:
   - Classes: `bg-[color:var(--primary)] text-[color:var(--primary-fg)] shadow-card hover:brightness-110`
   - This retires the inline-override pattern used in `dashboard/page.tsx:157-162`, `AlertDialogAction` buttons, etc.
2. Add new variant `destructive-outline` to `button.tsx`:
   - Classes: `bg-transparent text-[color:var(--danger)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--danger)_25%,transparent)] hover:bg-[color:var(--danger-soft)] hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--danger)_40%,transparent)]`
   - Preserves calm outline look; no filled red buttons.
3. Add `--cat-1` through `--cat-5` tokens + matching `--cat-N-soft` variants in `:root` block of `globals.css`. Palette chosen to read as calm neutrals with warm tint — NOT bright Tailwind-50 pastels. Suggested values (locked before implementation):
   - `--cat-1: oklch(0.55 0.09 45);` (warm terracotta) `--cat-1-soft: oklch(0.55 0.09 45 / 0.1);`
   - `--cat-2: oklch(0.55 0.07 180);` (muted teal) `--cat-2-soft: oklch(0.55 0.07 180 / 0.1);`
   - `--cat-3: oklch(0.55 0.08 250);` (muted indigo) `--cat-3-soft: oklch(0.55 0.08 250 / 0.1);`
   - `--cat-4: oklch(0.55 0.07 310);` (muted plum) `--cat-4-soft: oklch(0.55 0.07 310 / 0.1);`
   - `--cat-5: oklch(0.55 0.07 130);` (muted moss) `--cat-5-soft: oklch(0.55 0.07 130 / 0.1);`
4. Expose to `@theme` block so Tailwind class names like `text-[color:var(--cat-1)]` work.

**Acceptance:**
- Build + typecheck clean.
- `grep -nE "primary|destructive-outline" src/components/ui/button.tsx` shows both variants registered.
- `grep -nE "cat-[1-5]" src/app/globals.css` shows 10 lines (5 base + 5 soft).
- Zero consumer files touched — this is foundation only.

**Risk:** Low. Pure additive change.

---

### T2 — KB upload progress indicator

**Files:**
- `src/app/kb/page.tsx`
- `src/app/projects/[projectId]/kb/page.tsx`

**Changes:**
1. In the upload dialog, replace the disabled-button-with-spinner pattern with a visible progress state while the `POST /api/kb/upload` (or project-scoped equivalent) is in flight.
2. Approach: add a `uploading` boolean already exists — enhance the dialog body to show an inline progress strip (animated gradient or indeterminate bar using `--primary-soft`) + "Uploading…" eyebrow text while `uploading === true`. Hide the form inputs while uploading to prevent re-submit confusion.
3. Preserve all existing handlers (`handleUpload`), all fetch payloads, all reset logic, all toast behavior.

**Acceptance:**
- Upload still works end-to-end.
- Dialog shows a progress state distinct from the idle disabled button.
- No new network calls, no changed payload shape.

**Risk:** Low. UI-only addition, no state machine change.

---

### T3 — Session review resume state + persona palette migration

**Files:**
- `src/app/simulations/[id]/page.tsx`

**Changes:**
1. **Resume state:** currently the page renders transcript review assuming `simulation.endedAt` exists. If `!endedAt`, render a "resume or end" card at the top of the main column — eyebrow `ONGOING SESSION`, display-3 "This simulation is still running.", two CTAs: `Resume simulation` (links to `/projects/.../simulate?session=<id>`) and `End session` (calls existing `/api/simulations/end` endpoint). Below that, still render partial transcript (read-only) so user can see what happened so far.
   - Do NOT change any existing fetch calls.
   - Do NOT remove the transcript-review UI — it must still render when `endedAt` is present.
2. **Persona palette:** migrate `ARCHETYPE_COLORS` at `src/app/simulations/[id]/page.tsx:170-186` from the 6 bright hex palette to the `--cat-1…5` tokens introduced in T1. This is up to 5 personas; cycle through tokens for any 6th.
3. **Other shade leaks in this file:** audit and migrate any `bg-amber-*`, `bg-purple-*` highlight styles for moderator/respondent transcript to `--cat-*` or `--warning-soft`/`--primary-soft` equivalents. Scope: `simulations/[id]/page.tsx` ONLY.
4. Replace any inline amber-primary button overrides in this file with `variant="primary"` from T1. Replace `outline-destructive` compound (if any) with `variant="destructive-outline"` from T1.

**Acceptance:**
- `grep -nE "amber-|purple-|rose-|emerald-|violet-|sky-|cyan-|indigo-|text-\[#" src/app/simulations/\[id\]/page.tsx` returns zero matches.
- Build clean.
- Manual test: navigating to `/simulations/<ended-id>` still shows transcript review. Navigating to `/simulations/<ongoing-id>` shows new resume card.
- ARCHETYPE_COLORS array is either removed or now references cat tokens only.

**Risk:** Medium. Large file (~1500 LOC). Many state hooks. Implementer must preserve every fetch, every handler, every timer.

---

### T4 — Palette migration sweep + alert()→toast

**Files:**
- `src/components/tools/quote-card.tsx`
- `src/app/projects/[projectId]/sub/[subProjectId]/map/[sessionId]/page.tsx`
- `src/app/projects/[projectId]/sub/[subProjectId]/hmw/page.tsx`
- `src/app/projects/[projectId]/sub/[subProjectId]/insights/page.tsx`
- `src/app/projects/[projectId]/sub/[subProjectId]/ideation/[sessionId]/page.tsx`

**Changes:**
1. **`quote-card.tsx:20-35`:** replace the 14-color Tailwind-50 palette map with a cat-token based one. Collapse to 5 distinct swatches (cycle through `--cat-1…5`) — 14 unique colors is cognitive overkill anyway.
2. **`map/[sessionId]/page.tsx:77-92`:** identical palette map — apply the same treatment. If the two files share a palette shape, consider extracting to a shared constant, but do NOT change the public API of `quote-card`.
3. **`hmw/page.tsx:157-161, 399, 513, 915-919, 937, 941`:** replace the 5 lens hex values with `--cat-1…5` tokens. Replace inline `text-[#059669]`, `text-[#be185d]`, etc. spans in prose with token-based equivalents.
4. **`insights/page.tsx:145-149, 674-678, 694`:** same as HMW — same lens palette.
5. **`ideation/[sessionId]/page.tsx:49-53, 182`:** theme palette map → cat tokens (cycle through if > 5 themes).
6. **`alert()` → `toast.error()`** on `hmw/page.tsx:731, 734, 767, 771` (grep for any others). Import `toast` from `sonner` if not already.

**Acceptance:**
- `grep -nE "text-\[#|bg-\[#|border-\[#" src/components/tools/quote-card.tsx src/app/projects/\[projectId\]/sub/\[subProjectId\]/{map/\[sessionId\],hmw,insights,ideation/\[sessionId\]}/page.tsx` returns zero matches (except the existing `#fafafa` in lens-card.tsx — that's explicitly out of scope).
- `grep -n "alert(" src/app/projects/\[projectId\]/sub/\[subProjectId\]/{hmw,insights}/page.tsx` returns zero matches.
- Build clean.
- Every category color branch still renders — just with new colors.

**Risk:** Medium. Many files, many sites. Mechanical but easy to miss one.

---

### T5 — Workspace hub overhaul

**Files:**
- `src/app/projects/[projectId]/sub/[subProjectId]/page.tsx` (MODIFY)
- `src/app/projects/[projectId]/sub/[subProjectId]/edit/page.tsx` (DELETE)

**Changes:**
1. **Loading flash fix:** the current loading state uses `min-h-screen` which collides with the app shell's `h-screen overflow-hidden`. Replace with a loader rendered INSIDE the `WorkspaceFrame` structure (or a minimal `flex items-center justify-center py-20` centered in the main column). Do NOT change any data-fetching logic.
2. **Duplicate dialog cleanup:** the file has both a "Workspace meta" dialog (~`:1270-1298`) and a `researchOpen` dialog (~`:1464-1474`) displaying the same research statement. Identify which is dead code and remove it. Keep whichever is currently wired to a visible trigger; rip the other out.
3. **Edit Workspace → dialog:** port all state + form logic from `edit/page.tsx` into an `Edit workspace` dialog in the hub page. Mirror the pattern in `src/app/projects/[projectId]/page.tsx:360-403` (Edit Project dialog). Trigger: the existing "Edit" button in the rail footer (currently navigates to the edit page) now opens the dialog instead. On save: PUT to `/api/sub-projects/[subProjectId]` with the existing payload shape, then `fetchProject()` to refresh. Preserve all fields from the edit page form.
4. **Delete `edit/page.tsx`:** once the dialog is wired and the link is updated, remove the edit page entirely. If there are deep links to `/edit`, add a redirect via `useEffect` → `router.replace` to the workspace hub, OR leave the page file as a simple server-side `redirect()` shim. Prefer deletion + redirect shim.
5. **Button variants:** migrate inline `bg-[color:var(--primary)]` and `bg-[color:var(--danger)]` overrides in this file to `variant="primary"` / `variant="destructive-outline"` from T1.

**Acceptance:**
- Build clean.
- Navigating to `/projects/<id>/sub/<id>` shows workspace hub without the whole-page loading blink.
- Clicking "Edit workspace" opens a dialog in place, NOT a new page.
- Editing + saving updates the workspace and the hub reflects the change without a full page reload.
- Navigating to legacy `/projects/<id>/sub/<id>/edit` either redirects back OR shows a helpful state — does not 404.
- No duplicate research-statement dialogs remain.

**Risk:** HIGH. Biggest file on this list (~1500 LOC), user-facing nav change (page → dialog), and requires porting form state. Implementer must be careful.

---

### T6 — Final Button variant sweep

**Files:** any remaining file in `src/app/**/*.tsx` or `src/components/**/*.tsx` that still uses inline `bg-[color:var(--primary)] text-[color:var(--primary-fg)] shadow-card hover:brightness-110` or the explicit danger equivalent for buttons. After T2–T5, the remaining candidates are likely:
- `src/app/dashboard/page.tsx:157-162` — "New project" CTA
- `src/app/projects/[projectId]/page.tsx` — any edit/save buttons
- `src/app/projects/new/page.tsx` — "Create project" submit
- `src/app/kb/page.tsx` + project variant — Upload dialog confirm (these use default variant now per earlier convention — verify)
- `AlertDialogAction` destructive buttons across the app

**Changes:**
1. Grep the codebase: `grep -rn "bg-\[color:var(--primary)\]" src/` and `grep -rn "bg-\[color:var(--danger)\]" src/`.
2. For each hit that's a Button composition, replace inline classes with `variant="primary"` (for amber) or `variant="destructive-outline"` (for danger), remove the now-redundant className.
3. For `AlertDialogAction` components, the built-in `bg-[color:var(--danger)]` inline is acceptable since `AlertDialogAction` extends a different base — verify first before changing.
4. Do NOT change decorative amber usage (icon chips like `bg-[color:var(--primary-soft)] text-[color:var(--primary)]`). Only Button elements.

**Acceptance:**
- `grep -rnE "<Button[^>]*bg-\[color:var\(--primary\)\]" src/` returns zero matches.
- Every replaced button still renders identically.
- Build clean.

**Risk:** Medium. Mechanical but wide file surface.

---

## Review gates

After each task:
1. Controller runs `npm run build` — must pass.
2. Controller inspects `git diff` — confirms only files listed for that task were modified.
3. Controller greps for the acceptance criteria strings listed per task.
4. For T3 + T5 (highest risk), controller dispatches a spec reviewer subagent.

After all 6 tasks:
1. Controller dispatches a final code-quality reviewer subagent to audit the full PR diff against spec.
2. Build + lint delta vs main reported.
3. User reviews and ships.

---

## Rollback plan

Each task gets its own commit. If a task breaks something subtly that doesn't show up until manual test, revert that commit in isolation. Granularity matters — do NOT squash until the PR is green.

---

## Out of scope for PR 9

Documented here to prevent scope creep:
- Workspace-hub 7-tab restructure → deferred to future PR (user considering Double Diamond integration)
- Waldenburg font → design-doc decision, not a code change
- Settings page icon-chip repetition → deferred
- ARIA landmarks on `WorkspaceFrame` rails → deferred (accessibility PR)
- Keyboard-reachable delete buttons → deferred
- Mobile responsive → intentional product constraint
- Guide creation page full redesign → already acknowledged out of scope
