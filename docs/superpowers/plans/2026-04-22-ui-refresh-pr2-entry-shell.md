# UI Refresh — PR 2 (Entry + Shell) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the 7 entry-surface routes (`/`, `/login`, `/dashboard`, `/kb`, `/settings`, `/privacy`, `/terms`) to the new design system from PR 1 — adopting `PageHeader`, `BackLink`, `EmptyState`, `ErrorState`, `CenteredSpinner`, Sonner toasts, and `AlertDialog` for destructive confirms. Also archive two dead routes (`/projects/[projectId]/dojo`, `/projects/[projectId]/guide`). Zero `alert()`/`confirm()` or hex-color literals remaining in these 7 routes.

**Architecture:** Targeted-edit approach. Pages retain their existing data-fetching and business logic; we swap the UI chrome to new primitives, replace ad-hoc markup with shared components, and kill inconsistencies. For small pages (login, legal, settings) full file replacements make sense; for larger pages (dashboard, kb) we use surgical Edit operations at specific line ranges. Each page segment gets its own `loading.tsx` where async data is fetched; `error.tsx` added for dashboard + kb where the failure UX needs context.

**Tech Stack:** Next.js 16.1.1 App Router, React 19, Tailwind v4, shadcn/ui (amber-tokened from PR 1), Sonner (toast), Lucide icons, React Hook Form.

**Spec reference:** [docs/superpowers/specs/2026-04-22-ui-elevenlabs-refresh-design.md](../specs/2026-04-22-ui-elevenlabs-refresh-design.md)

**Important notes for the engineer:**
1. **This is a UI migration, not behaviour change.** All data-fetching, API calls, form validation, and routing logic must be preserved. The test is: "does the feature still work?" — not "does it look the same?"
2. **PR 1 is merged.** All of the new primitives (`PageHeader`, `PageBar`, `BackLink`, `EmptyState`, `ErrorState`, `CenteredSpinner`, `PageSkeleton`, `Eyebrow`, `Mono`, `Kbd`) and the restyled shadcn primitives are available. Sonner `Toaster` is already mounted in `layout.tsx`.
3. **Commit after every task.** Frequent commits = cheap rollback.
4. **Verify after every task:** `npm run build` + `npm run lint` (scoped to modified files) + browser walk of the touched route.
5. **Zero tolerance on remaining hazards** in the touched files: no `alert(`, no `confirm(`, no `bg-white`, no hex literals like `#111` or `#ddd`, no `text-red-500`/`text-amber-600`/etc bare Tailwind colour classes. Grep after each task.
6. **Branch:** Continue on `ui-upgrade-elevenlabs-style`.

---

## Task 1: Archive dead routes (`/dojo` and `/guide`)

**Files:**
- Move: `src/app/projects/[projectId]/dojo/page.tsx` → `archive/projects-[projectId]-dojo-page.tsx`
- Move: `src/app/projects/[projectId]/guide/page.tsx` → `archive/projects-[projectId]-guide-page.tsx`
- Delete empty dirs: `src/app/projects/[projectId]/dojo/` and `src/app/projects/[projectId]/guide/`
- Create: `archive/README.md` (if doesn't exist) with a short note about what's archived and why

**What this does:** Removes two dead routes from the app tree. `/dojo` (1200+ lines) duplicates `/sub/.../simulate`. `/guide` (25 lines) is a redirect stub to `/projects/new/guide?projectId=...`. Neither has incoming `<Link>` or `router.push` references from other files (confirmed by grep — the `href={\`/projects/new/guide?projectId=${projectId}\`}` occurrences go to the NEW guide route, not the archived redirect stub).

- [ ] **Step 1: Verify no external references will break**

Run:
```bash
grep -rn "projects/\[projectId\]/dojo\|projects/.*\/dojo\"" src/ --include="*.tsx" --include="*.ts" | grep -v "src/app/projects/\[projectId\]/dojo/"
grep -rn "projects/.*\/guide\"" src/ --include="*.tsx" --include="*.ts" | grep -v "src/app/projects/\[projectId\]/guide/\|projects/new/guide"
```
Expected: no results from either grep. If anything appears, STOP and report before proceeding.

- [ ] **Step 2: Create `archive/README.md`**

If `archive/README.md` doesn't exist, create it:

```md
# Archive

Code that is no longer wired into the app but preserved for reference or potential resurrection. Archived files are not built, linted, or tested.

## Contents

- `projects-[projectId]-dojo-page.tsx` — original `/projects/:projectId/dojo` route. Live-interview UX duplicated by the newer `/projects/:projectId/sub/:subProjectId/simulate` flow. Archived 2026-04-22 during the UI refresh (PR 2).
- `projects-[projectId]-guide-page.tsx` — 25-line redirect shim from `/projects/:projectId/guide` to `/projects/new/guide?projectId=…`. Archived 2026-04-22. The canonical route is `/projects/new/guide`.
```

If it already exists, append the two list items above under a `## Contents` heading.

- [ ] **Step 3: Move the files and delete the now-empty route directories**

```bash
mkdir -p archive
git mv src/app/projects/\[projectId\]/dojo/page.tsx archive/projects-\[projectId\]-dojo-page.tsx
git mv src/app/projects/\[projectId\]/guide/page.tsx archive/projects-\[projectId\]-guide-page.tsx
rmdir src/app/projects/\[projectId\]/dojo
rmdir src/app/projects/\[projectId\]/guide
```

- [ ] **Step 4: Exclude `archive/` from tsconfig and lint**

Read `tsconfig.json`. If `archive/**` is not already excluded, add it to `exclude`. The project's `tsconfig.json` is at the repo root.

```bash
cat tsconfig.json
```

If `exclude` array doesn't contain `"archive/**"`, edit `tsconfig.json` to add it. Typical edit — change:
```json
{
  "compilerOptions": { ... },
  "include": [...],
  "exclude": ["node_modules"]
}
```
to:
```json
{
  "compilerOptions": { ... },
  "include": [...],
  "exclude": ["node_modules", "archive/**"]
}
```

Similarly check `eslint.config.mjs` (the project uses ESLint flat config). If `ignores` doesn't include `archive/**`, add it.

- [ ] **Step 5: Build + lint**

```bash
npm run build
```
Expected: builds all routes; the 2 archived routes no longer appear in the route list.

```bash
npm run lint
```
Expected: no new errors. Archive directory is ignored.

- [ ] **Step 6: Commit**

```bash
git add archive/ src/app/projects/\[projectId\]/ tsconfig.json eslint.config.mjs
git commit -m "chore: archive /dojo and /guide dead routes

- /projects/[projectId]/dojo: 1200-line live-interview duplicate of
  /sub/[subProjectId]/simulate. Moved to archive/.
- /projects/[projectId]/guide: 25-line redirect shim to
  /projects/new/guide. Moved to archive/ (the canonical route is
  /projects/new/guide, unchanged).
- Excluded archive/** from tsconfig and eslint so it stays out of
  build + lint.
- archive/README.md documents what was removed and why."
```

---

## Task 2: Add global `app/loading.tsx` fallback

**Files:**
- Create: `src/app/loading.tsx`

**What this does:** Provides a minimal fallback during route transitions before a more specific route-level `loading.tsx` takes over. Uses `CenteredSpinner` (from PR 1) with no label for understated behaviour.

- [ ] **Step 1: Create `src/app/loading.tsx`**

```tsx
import { CenteredSpinner } from "@/components/ui/centered-spinner"

export default function RootLoading() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
      <CenteredSpinner />
    </div>
  )
}
```

- [ ] **Step 2: Build + lint**

```bash
npm run build && npm run lint
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/loading.tsx
git commit -m "feat(app): add global loading.tsx fallback using CenteredSpinner"
```

---

## Task 3: Root `/` redirect page — verify no change needed

**Files:**
- `src/app/page.tsx` (6 lines)

**What this does:** Confirms the root redirect is a pure server-side redirect with no UI and needs no change.

- [ ] **Step 1: Read `src/app/page.tsx`**

```bash
cat src/app/page.tsx
```
Expected: 6-line file with `redirect("/dashboard")` or similar. No UI markup, no classes, no imports that need updating.

- [ ] **Step 2: Verify**

If the file is a pure redirect (no JSX), nothing to commit. Move on.

If the file has visible UI (unexpected), STOP and report — it wasn't accounted for in the scoping pass.

---

## Task 4: Rewrite `/login`

**Files:**
- Modify: `src/app/login/page.tsx`

**What this does:** Replaces the hand-rolled `<input>` + `<button>` with `Input` / `Button` primitives, wires errors through Sonner toast instead of inline state, kills every hex literal (`#111`, `#666`, `#999`, `#aaa`, `#ddd`), and centers the form in a `Card` for proper layout.

- [ ] **Step 1: Read current `src/app/login/page.tsx` to preserve data logic**

```bash
cat src/app/login/page.tsx
```
The file is ~91 lines. Note the submit handler, the auth fetch, the state variables (`password`, `error`, `loading`).

- [ ] **Step 2: Replace the entire contents with:**

```tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const returnTo = search.get("returnTo") || "/dashboard";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(returnTo);
        router.refresh();
      } else {
        toast.error("Incorrect password");
        setPassword("");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center w-full max-w-sm">
        <img
          src="/hpb-logo.png"
          alt="HPB Logo"
          className="h-12 w-auto object-contain mb-6"
        />
        <div className="w-full rounded-[var(--radius-card-lg)] bg-card shadow-outline-ring p-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-display-4 text-foreground">Sign in</h1>
              <p className="text-body-sm text-muted-foreground">
                Enter the access password to continue.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                disabled={loading}
                autoFocus
                aria-label="Password"
              />
              <Button
                type="submit"
                disabled={loading || !password}
                className="w-full"
              >
                {loading ? "Signing in..." : "Continue"}
              </Button>
            </form>

            <p className="text-caption text-muted-foreground text-center">
              Internal HPB tool. Contact your admin if you need access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Preserve behaviour:** The POST to `/api/auth/login` with `{ password }` JSON body matches the existing API. The `returnTo` query param handling matches. On 401/failure → `toast.error` + clear password. On success → `router.push(returnTo); router.refresh()`. Autofocus preserved. Disabled state on empty password preserved.

- [ ] **Step 3: Grep for hazards**

```bash
grep -nE "(alert\(|confirm\(|bg-white|#[0-9a-f]{3,6}|text-red-[0-9]|text-blue-[0-9])" src/app/login/page.tsx
```
Expected: no output.

- [ ] **Step 4: Build + lint + browser sanity**

```bash
npm run build && npm run lint
```

Start dev: `npm run dev`. Open `http://localhost:3000/login`. Expected: centered card on warm off-white canvas, pill input + pill button, clean type. Try:
- Submitting empty → Button disabled (good).
- Submitting wrong password → toast appears bottom-right, password cleared.
- Submitting valid password → redirected to `/dashboard`.

Stop dev.

- [ ] **Step 5: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "style(login): rewrite with Input/Button primitives + toast errors

- Replace hand-rolled <input>/<button> with shadcn primitives
- Replace inline error state with toast.error (sonner)
- Kill hex literals (#111/#666/#999/#aaa/#ddd)
- Center form in Card with shadow-outline-ring
- text-display-4 for heading, text-body-sm for description
- Preserve auth POST + returnTo handling"
```

---

## Task 5: Rewrite `/privacy`

**Files:**
- Modify: `src/app/privacy/page.tsx`

**What this does:** Replaces the hand-rolled back-link + hero header with `BackLink` + `PageHeader`, tightens the prose column to `max-w-[720px]`, replaces ad-hoc `text-xl`/`text-lg` heading classes with the new `text-display-*` scale, and removes the redundant footer "Back to Dashboard" button (BackLink already provides navigation).

- [ ] **Step 1: Read current `src/app/privacy/page.tsx`**

```bash
cat src/app/privacy/page.tsx
```

- [ ] **Step 2: Replace the entire contents with:**

```tsx
import { BackLink } from "@/components/layout/back-link"
import { PageHeader } from "@/components/layout/page-header"

export default function PrivacyPage() {
  return (
    <div className="max-w-[720px] mx-auto pt-6 pb-20">
      <BackLink href="/dashboard" label="Back to Dashboard" />

      <PageHeader
        eyebrow="Legal"
        title="Privacy Statement"
        description="Last updated: April 2026"
      />

      <article className="flex flex-col gap-8 text-body text-foreground">
        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Overview</h2>
          <p className="text-body-lg text-muted-foreground">
            HPB AI is an internal research tool operated by Health Promotion Board (HPB) in partnership with Aleph Pte Ltd. This statement describes how the tool handles information you enter or generate while using it.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Data you enter</h2>
          <p>
            Project metadata, knowledge-base documents, interview transcripts, and AI-assisted synthesis outputs you create or upload are stored in HPB&apos;s secure cloud database. They are only accessible to authenticated HPB users with credentials.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">AI processing</h2>
          <p>
            Some features send prompts and uploaded content to third-party large language model providers for processing. These providers are contractually obligated not to retain or train on your data. No personally identifying information should be entered unless explicitly sanctioned by your research protocol.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Who can see your work</h2>
          <p>
            Projects are private to the authenticated user and designated collaborators. Knowledge-base entries marked as global are visible to all HPB AI users. Administrators can view aggregate usage metrics but not the contents of private projects unless explicitly shared.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Retention &amp; deletion</h2>
          <p>
            Content you create persists until you delete it. Deleted projects and documents are removed from active storage immediately and purged from backups within 30 days.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Security</h2>
          <p>
            Access to the tool requires authentication. Traffic is encrypted in transit. Database contents are encrypted at rest. Administrators audit access logs for anomalies.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Contact</h2>
          <p>
            Questions about this statement can be directed to your HPB AI administrator or Aleph Pte Ltd.
          </p>
        </section>
      </article>
    </div>
  )
}
```

**Note on content:** the target content above mirrors the spirit and section count of the existing page. If the existing page has section titles or paragraphs that differ materially (e.g. a specific list of third-party providers, a named contact email), preserve those specifics when rewriting. In other words: don't invent new policy content. If the existing page has content the above template doesn't cover, keep it — just restyle the heading classes to `text-display-3` and paragraph classes to default `text-body`/`text-body-lg`.

- [ ] **Step 3: Reconcile the above template against the existing page**

Open both side-by-side in your mind. For every `<section>` / heading block in the existing page:
- If it exists in the template above with equivalent title → replace the existing markup with the template version and port the specific prose (sentences, lists, email addresses) from the existing page into the new `<p>` tags, keeping the typography tokens.
- If the existing page has a section the template doesn't → add a new `<section className="flex flex-col gap-3">` with `<h2 className="text-display-3">...</h2>` and the existing paragraphs converted to use `text-body` / `text-body-lg`.
- If the template has a section the existing page doesn't → drop it.

- [ ] **Step 4: Grep for hazards**

```bash
grep -nE "(alert\(|confirm\(|bg-white|#[0-9a-f]{3,6}|text-xl|text-lg|font-bold)" src/app/privacy/page.tsx
```
Expected: no output (no leftover `text-xl`/`text-lg`/`font-bold` — all converted to `text-display-*`).

- [ ] **Step 5: Build + lint + browser**

```bash
npm run build && npm run lint
npm run dev
```
Open `/privacy`. Confirm: BackLink at top-left, `PageHeader` with eyebrow+title+description, prose max-w ~720px, `text-body-lg` lead paragraph, `text-display-3` section heads. Stop dev.

- [ ] **Step 6: Commit**

```bash
git add src/app/privacy/page.tsx
git commit -m "style(privacy): adopt BackLink + PageHeader + text-display-* scale

- Replace hand-rolled back arrow link with BackLink primitive
- Replace hero header with PageHeader (eyebrow: 'Legal')
- Constrain prose to max-w-[720px]
- Normalise section headings to text-display-3, body to text-body
- Remove redundant footer 'Back to Dashboard' Button
- Preserve existing policy content verbatim"
```

---

## Task 6: Rewrite `/terms`

**Files:**
- Modify: `src/app/terms/page.tsx`

**What this does:** Mirror of Task 5 for the Terms of Use page.

- [ ] **Step 1: Read current `src/app/terms/page.tsx`**

```bash
cat src/app/terms/page.tsx
```

- [ ] **Step 2: Replace the entire contents with the following template, then reconcile with existing content (same methodology as Task 5 Step 3):**

```tsx
import { BackLink } from "@/components/layout/back-link"
import { PageHeader } from "@/components/layout/page-header"

export default function TermsPage() {
  return (
    <div className="max-w-[720px] mx-auto pt-6 pb-20">
      <BackLink href="/dashboard" label="Back to Dashboard" />

      <PageHeader
        eyebrow="Legal"
        title="Terms of Use"
        description="Last updated: April 2026"
      />

      <article className="flex flex-col gap-8 text-body text-foreground">
        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Acceptance</h2>
          <p className="text-body-lg text-muted-foreground">
            By using HPB AI you agree to these terms. If you do not agree, do not use the tool.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Permitted use</h2>
          <p>
            HPB AI is provided for authorised HPB research purposes only. You may not use it for any purpose prohibited by HPB policy, Singapore law, or the written guidance of your project administrator.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Content responsibility</h2>
          <p>
            You are responsible for the content you upload, generate, or share through the tool. Do not upload material you do not have the right to share.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">AI outputs</h2>
          <p>
            AI-generated insights, archetypes, simulations, and synthesis outputs are research aids, not clinical recommendations. Review and validate outputs before relying on them for decision-making.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Intellectual property</h2>
          <p>
            Content you create remains yours. The tool, its code, and aggregate model outputs remain the property of HPB and Aleph Pte Ltd.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Changes</h2>
          <p>
            These terms may change as the tool evolves. Material changes will be surfaced in-app.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-display-3">Contact</h2>
          <p>
            Questions can be directed to your HPB AI administrator or Aleph Pte Ltd.
          </p>
        </section>
      </article>
    </div>
  )
}
```

Port the existing terms content into this structure per Task 5 Step 3's methodology.

- [ ] **Step 3: Grep**

```bash
grep -nE "(alert\(|confirm\(|bg-white|#[0-9a-f]{3,6}|text-xl|text-lg|font-bold)" src/app/terms/page.tsx
```
Expected: no output.

- [ ] **Step 4: Build + lint + browser**

```bash
npm run build && npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/app/terms/page.tsx
git commit -m "style(terms): adopt BackLink + PageHeader + text-display-* scale

Same treatment as /privacy: kill text-xl/text-lg/font-bold in favour
of text-display-3, body to text-body, max-w-[720px], preserve content."
```

---

## Task 7: Rewrite `/settings`

**Files:**
- Modify: `src/app/settings/page.tsx`

**What this does:** Adds `PageHeader`, replaces 3 `alert()` calls with `toast.success`/`toast.error`, tokenises the remaining inline `style={{ backgroundColor }}` hack to a class.

- [ ] **Step 1: Read current `src/app/settings/page.tsx`**

```bash
cat src/app/settings/page.tsx
```
Note: the file has 3 `alert()` calls (lines ~20, 22, 25) for DB seed feedback and uses inline `style={{}}` on an icon tile (~line 66).

- [ ] **Step 2: Make the following targeted edits**

**Edit A — add imports at the top.** Find the import block at the top of the file. After the existing imports, ensure these are present (adding any that are missing):

```tsx
import { PageHeader } from "@/components/layout/page-header"
import { toast } from "sonner"
```

**Edit B — replace `alert()` calls with `toast`:**

At the three alert sites (currently around lines 20, 22, 25):
- `alert(\`Database seeded successfully! Created ${data.data.personaCount} personas.\`)` → `toast.success(\`Database seeded successfully! Created ${data.data.personaCount} personas.\`)`
- `alert(data.error || "Failed to seed database")` → `toast.error(data.error || "Failed to seed database")`
- `alert("Failed to seed database")` → `toast.error("Failed to seed database")`

**Edit C — replace hand-rolled hero header with PageHeader.**

Find the existing header block (typically `<div className="mb-8">` containing a `<h1>` with "Settings" and a description). Replace the ENTIRE header block with:

```tsx
<PageHeader
  eyebrow="Admin"
  title="Settings"
  description="Configure your HPB MHE AI instance"
/>
```

Remove the old icon tile div that was part of the header — PageHeader doesn't show a decorative icon.

**Edit D — tokenise inline `style={{}}` (around line 66).**

Find the inline style:
```tsx
style={{ backgroundColor: 'var(--color-interact-muted)', color: 'var(--color-interact)' }}
```
Replace with className:
```tsx
className="... bg-[color:var(--color-interact-muted)] text-[color:var(--color-interact)]"
```
(Merge with any existing className.) Remove the `style={{}}` prop entirely.

**Edit E — replace page wrapper to use canvas background and standard spacing.**

If the existing page has an outer wrapper like `<div className="min-h-screen bg-gray-50 ...">` or similar, replace it with:
```tsx
<div className="max-w-4xl mx-auto pt-6 pb-20">
```

**Edit F — purge stale copy.** If there's literal "Using Mock" badge text referencing `gpt-5.2`, or a hardcoded "Development" badge, delete those elements. They were flagged as stale in the audit.

- [ ] **Step 3: Grep**

```bash
grep -nE "(alert\(|confirm\(|bg-white|#[0-9a-f]{3,6}|text-amber-900|text-violet-[0-9]|text-blue-[0-9]|text-red-[0-9])" src/app/settings/page.tsx
```
Expected: at most `bg-amber-50`/`border-amber-200` may appear for the amber-tinted alerts (those are intentional). Zero `alert(`.

- [ ] **Step 4: Build + lint + browser**

```bash
npm run build && npm run lint
```

Open `/settings`. Verify: PageHeader at top, cards render cleanly, clicking a seed action triggers a toast notification. Stop dev.

- [ ] **Step 5: Commit**

```bash
git add src/app/settings/page.tsx
git commit -m "style(settings): adopt PageHeader + toast for DB seed feedback

- Replace hand-rolled hero header with PageHeader (eyebrow: 'Admin')
- Replace 3 alert() calls with toast.success / toast.error (sonner)
- Tokenise inline style={{ backgroundColor }} to className with CSS vars
- Remove stale 'Using Mock' and 'Development' copy"
```

---

## Task 8: Rewrite `/dashboard` + add `loading.tsx` + `error.tsx`

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/loading.tsx`
- Create: `src/app/dashboard/error.tsx`

**What this does:** Dashboard is the main entry surface after auth. Swap hand-rolled empty state → `EmptyState`. Swap 2 `alert()` calls → `toast.error`. Adopt `PageHeader` with a `featured`-variant "New Project" CTA (warm-stone pill). Kill the dead `md:hidden` mobile FAB (blocked by layout's mobile disclaimer). Add per-route loading + error siblings for data-fetch UX.

- [ ] **Step 1: Read current `src/app/dashboard/page.tsx`**

```bash
cat src/app/dashboard/page.tsx
```
The file fetches `/api/projects`, renders a grid, has delete AlertDialog, has a mobile FAB that's unreachable.

- [ ] **Step 2: Create `src/app/dashboard/loading.tsx`**

```tsx
import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function DashboardLoading() {
  return <PageSkeleton cards={6} />
}
```

- [ ] **Step 3: Create `src/app/dashboard/error.tsx`**

```tsx
"use client"

import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<AlertTriangle />}
        title="Failed to load projects"
        description="Unable to fetch your projects. Check your connection and try again."
        action={<Button onClick={reset}>Retry</Button>}
      />
    </div>
  )
}
```

- [ ] **Step 4: Make the following targeted edits to `page.tsx`**

**Edit A — add imports.** Ensure these are present at the top:

```tsx
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { FolderKanban, Plus } from "lucide-react"
```
(If `FolderKanban` / `Plus` are already imported from `lucide-react`, don't duplicate.)

**Edit B — replace the `alert()` calls (currently ~lines 88 and 92) with `toast.error`.**

```tsx
// Before:
alert("Failed to delete project: " + (data.error || "Unknown error"))
// After:
toast.error("Failed to delete project: " + (data.error || "Unknown error"))
```

```tsx
// Before:
alert("Failed to delete project")
// After:
toast.error("Failed to delete project")
```

**Edit C — replace the hand-rolled hero header (typically ~lines 101–113) with PageHeader + featured CTA.**

Find the existing header that has `<h1 className="text-3xl font-semibold ...">My Projects</h1>` and its surrounding flex. Replace the entire header block (wrapper div included) with:

```tsx
<PageHeader
  eyebrow="Workspace"
  title="My Projects"
  description="Manage your HPB research projects."
  action={
    <Button asChild variant="featured" size="lg">
      <Link href="/projects/new">
        <Plus className="h-4 w-4" />
        New Project
      </Link>
    </Button>
  }
/>
```

If `Link` is not imported, add `import Link from "next/link"` to the imports.

**Edit D — remove the dead mobile FAB.**

Find the `<div className="... md:hidden">` block (or similar pattern) that renders a floating action button only on mobile, typically at ~lines 108-112. Delete it entirely — the app is desktop-only; the mobile disclaimer overlay blocks all of this.

**Edit E — replace the empty-state card (currently ~lines 125-140) with `<EmptyState>`.**

Find the "No projects yet" block. Replace the entire empty-state markup (the `<Card>` or `<div>` wrapping the icon + title + description + button) with:

```tsx
<EmptyState
  icon={<FolderKanban />}
  title="No projects yet"
  description="Create your first project to start organizing research, running simulations, and synthesizing insights."
  action={
    <Button asChild variant="featured">
      <Link href="/projects/new">
        <Plus className="h-4 w-4" />
        New Project
      </Link>
    </Button>
  }
/>
```

**Edit F — normalise the in-page loading state.** If there's a hand-rolled `<Loader2>` spinner block that renders while projects are being fetched client-side (in addition to the new `loading.tsx`), consider replacing with `<CenteredSpinner />` for consistency. Import from `@/components/ui/centered-spinner` if needed.

**Edit G — check card hover states.** Search for any raw `hover:bg-[var(--color-interact-subtle)]` or similar on project cards. These are acceptable because `--color-interact-subtle` is aliased to `--primary-soft` in the new tokens. No change needed.

**Edit H — icon-only Button accessibility.** Search for `<Button size="icon"` instances (typically the trash-icon delete button). Each MUST have an `aria-label`. Add `aria-label="Delete project"` (or similar descriptive label) to any icon-only button that lacks one.

- [ ] **Step 5: Grep**

```bash
grep -nE "(alert\(|confirm\(|bg-white|#[0-9a-f]{3,6}|text-red-[0-9]|text-blue-[0-9])" src/app/dashboard/page.tsx
```
Expected: no output.

- [ ] **Step 6: Build + lint + browser walk**

```bash
npm run build && npm run lint
npm run dev
```
Open `/dashboard`. Verify:
- `PageHeader` at top with eyebrow, amber-stone "New Project" pill CTA.
- Loading state (if DB is slow) shows `<PageSkeleton />`.
- Empty state (seed with 0 projects if possible) shows `<EmptyState>` with icon tile + centred text + featured pill.
- Clicking delete on a project → AlertDialog confirm works → on failure, toast appears bottom-right.
- No mobile FAB visible.

Stop dev.

- [ ] **Step 7: Commit**

```bash
git add src/app/dashboard/page.tsx src/app/dashboard/loading.tsx src/app/dashboard/error.tsx
git commit -m "style(dashboard): adopt PageHeader/EmptyState/toast, add loading+error siblings

- PageHeader with featured-variant 'New Project' pill CTA
- EmptyState for zero-project case
- Replace 2 alert() calls with toast.error
- Remove dead md:hidden mobile FAB
- Add aria-label to icon-only delete button
- Add dashboard/loading.tsx (PageSkeleton) and dashboard/error.tsx
  (ErrorState with retry) for per-route async UX"
```

---

## Task 9: Rewrite `/kb` + add `loading.tsx` + `error.tsx`

**Files:**
- Modify: `src/app/kb/page.tsx`
- Create: `src/app/kb/loading.tsx`
- Create: `src/app/kb/error.tsx`

**What this does:** KB is the biggest entry-surface page (693 lines). Don't rewrite end-to-end; apply surgical edits. Adopt `PageHeader`. Replace 5 `alert()` calls + 1 `confirm()` with `toast` + `AlertDialog`. Fix the TabsList class override that assumed the old segmented style. Replace hand-rolled upload button with `Button variant="outline"`. Replace hand-rolled `<input type="checkbox">` with `<Checkbox>`. Tokenise raw `border-amber-300`. Remove dead `hidden sm:*` responsive classes.

- [ ] **Step 1: Read current `src/app/kb/page.tsx`** (pace yourself — 693 lines)

```bash
cat src/app/kb/page.tsx
```
Note the structure: imports → upload dialog component → tabs for doc types → document cards → footer. The scoping audit flagged these line ranges; confirm they match before editing.

- [ ] **Step 2: Create `src/app/kb/loading.tsx`**

```tsx
import { PageSkeleton } from "@/components/ui/page-skeleton"

export default function KBLoading() {
  return <PageSkeleton cards={6} />
}
```

- [ ] **Step 3: Create `src/app/kb/error.tsx`**

```tsx
"use client"

import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function KBError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<AlertTriangle />}
        title="Failed to load knowledge base"
        description="Unable to fetch documents. Please refresh and try again."
        action={<Button onClick={reset}>Retry</Button>}
      />
    </div>
  )
}
```

- [ ] **Step 4: Add imports to `page.tsx`**

Ensure these are imported at the top of `src/app/kb/page.tsx`:

```tsx
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import { Checkbox } from "@/components/ui/checkbox"
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

- [ ] **Step 5: Replace the hand-rolled hero header with PageHeader**

Find the existing header block (has an icon div + `<h1>` + description). Replace the ENTIRE header block with:

```tsx
<PageHeader
  eyebrow="Knowledge Base"
  title="Global Knowledge Base"
  description="Shared frameworks, policies, and research accessible across all projects."
/>
```

Remove the decorative icon tile div that preceded the heading.

- [ ] **Step 6: Replace the 5 `alert()` calls with `toast.error`**

The audit flagged alerts at roughly lines 162, 166, 184, 206, 226. Do each:

```tsx
// at upload error (~162)
alert(err.error || "Upload failed")
// →
toast.error(err.error || "Upload failed")

// at upload fallback (~166)
alert("Upload failed")
// →
toast.error("Upload failed")

// at approve error (~184)
alert("Failed to approve")
// →
toast.error("Failed to approve")

// at reject error (~206)
alert("Failed to reject")
// →
toast.error("Failed to reject")

// at delete error (~226)
alert("Failed to delete")
// →
toast.error("Failed to delete")
```

- [ ] **Step 7: Replace `confirm()` with `<AlertDialog>`**

The audit flagged a `confirm("Are you sure...")` at roughly line 215, typically the document-delete flow.

At the top of the component function, add state:

```tsx
const [deleteDocId, setDeleteDocId] = React.useState<string | null>(null)
```

(If the file doesn't import `React` or `useState`, adjust accordingly.)

Find the existing delete handler (something like `const handleDelete = async (id) => { if (confirm(...)) { ... fetch DELETE ... } }`). Split it:
1. Change the trash-icon Button's `onClick` from calling the delete handler directly to `onClick={() => setDeleteDocId(doc.id)}`.
2. Rename the original fetching logic to a function `confirmDelete` that takes the id and performs the fetch + `toast.error` on failure + refresh on success. Remove the `confirm()` gate from it.
3. At the bottom of the render (just before the closing wrapper), add:

```tsx
<AlertDialog open={!!deleteDocId} onOpenChange={(open) => !open && setDeleteDocId(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this document?</AlertDialogTitle>
      <AlertDialogDescription>
        This removes the document from the global Knowledge Base. Projects that reference it will lose access. This cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={async () => {
          if (deleteDocId) await confirmDelete(deleteDocId)
          setDeleteDocId(null)
        }}
        className="bg-[color:var(--danger)] text-white hover:brightness-110"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

- [ ] **Step 8: Fix TabsList override (audit flagged line 271)**

Find the TabsList element:

```tsx
<TabsList className="bg-muted p-1 gap-0 h-auto">
```

Replace the className (keep everything else):

```tsx
<TabsList>
```

(The new underline-style TabsList from PR 1 needs no overrides. `h-auto`/`bg-muted`/`p-1`/`gap-0` were all workarounds for the old segmented-pill style.)

- [ ] **Step 9: Replace hand-rolled upload trigger Button (audit flagged ~line 294)**

Find the raw `<button className="inline-flex items-center gap-2 px-3 py-1.5 ...">` used as the upload-dialog trigger. Replace with:

```tsx
<Button variant="outline" size="sm" onClick={() => setUploadDialogOpen(true)}>
  <Upload className="h-4 w-4" />
  Upload document
</Button>
```

(If the trigger is a DialogTrigger wrapping the raw button, keep the DialogTrigger; just swap the inner `<button>` for `<Button variant="outline" size="sm" asChild>...`... actually no — `Button` is an element already, so wrap the existing usage accordingly. Check what pattern the dialog uses and adapt.)

Ensure `Upload` (or whatever icon) is imported from lucide-react.

- [ ] **Step 10: Replace hand-rolled checkbox (audit flagged ~line 377)**

Find `<input type="checkbox" className="w-4 h-4 rounded border-amber-300">` or similar. Replace with:

```tsx
<Checkbox
  checked={/* existing state */}
  onCheckedChange={/* existing handler */}
  aria-label="/* describe what this checkbox toggles */"
/>
```

Preserve the checked state and handler; just swap the element.

- [ ] **Step 11: Tokenise `border-amber-300` → `border-amber-200`** (audit flag, optional consistency polish — if there's a specific reason for 300 in the original, leave it; otherwise unify to 200).

- [ ] **Step 12: Replace empty-state markup with `<EmptyState>`**

Find the "No documents yet" or equivalent empty-state block (audit flagged ~line 424). Replace with:

```tsx
<EmptyState
  icon={<BookOpenText />}
  title="No documents yet"
  description="Upload a PDF, Word doc, or text file to share it across all projects."
  action={
    <Button variant="outline" onClick={() => setUploadDialogOpen(true)}>
      <Upload className="h-4 w-4" />
      Upload document
    </Button>
  }
/>
```

Adjust icon and copy to match the existing page's intent (e.g. if the empty state is per-tab and says "No personas yet", keep that message).

- [ ] **Step 13: Remove dead `hidden sm:*` classes**

Grep the file:
```bash
grep -n "hidden sm:" src/app/kb/page.tsx
```
For each occurrence, delete the `hidden sm:*` class (the app is desktop-only; `sm:` never fires). If the class is part of a mobile-only display element, delete the entire element.

- [ ] **Step 14: Normalise card radii and typography drift**

Grep for hazards:
```bash
grep -nE "(text-\[1[0-3]px\]|rounded-(md|lg|xl|2xl|3xl)|font-bold|text-amber-900|text-violet-[0-9]|text-blue-[0-9]|bg-white)" src/app/kb/page.tsx
```

For each hit:
- Raw font sizes `text-[10px]`/`text-[11px]`/`text-[13px]` → use `text-ui-sm` (13px), `text-caption` (11px), or `text-mono-meta` (11px monospace for counts).
- `font-bold` on page titles → already handled by PageHeader; remove leftover `font-bold`.
- Hard-coded `rounded-md/lg/xl/2xl/3xl` → map to the radius scale: small chips → `rounded-[var(--radius-sm2)]`, cards → `rounded-[var(--radius-card-lg)]`, dialogs → `rounded-[var(--radius-panel)]`, pills → `rounded-[var(--radius-pill)]`. If uncertain, keep `rounded-lg` (resolves to `--radius` = 12px via `@theme` alias) or `rounded-xl`.
- `text-amber-900`/`text-violet-*`/`text-blue-*` → tokenise to `text-[color:var(--primary)]`, `text-[color:var(--knowledge)]`, `text-[color:var(--info)]` respectively.
- `bg-white` → `bg-card`.

Walk each occurrence and fix. Don't fix occurrences inside already-tokenised multi-layer tints like `bg-amber-50 border-amber-200 text-amber-900` — those are intentional semantic alerts and will get reviewed in the compliance-module extraction (future PR).

- [ ] **Step 15: Hand-rolled Dialog title override**

Audit flagged `<DialogTitle className="text-xl font-bold">` at line 313. Remove the `className` overrides — the restyled `DialogTitle` primitive from PR 1 already provides `text-display-3` typography.

- [ ] **Step 16: Grep for all hazards**

```bash
grep -nE "(alert\(|confirm\(|bg-white|#[0-9a-f]{3,6}|text-red-[0-9]+(?!0)|text-blue-[0-9]|text-violet-[0-9]|text-amber-9|font-bold)" src/app/kb/page.tsx
```
Expected: no output. (Amber-50/200 for tinted alerts are acceptable, but amber-900 is not.)

- [ ] **Step 17: Build + lint + browser walk**

```bash
npm run build && npm run lint
npm run dev
```

Open `/kb`. Click through:
- Header reads cleanly (PageHeader with eyebrow).
- Underline tabs render correctly (no leftover segmented bg).
- Upload dialog opens (upload button is outline-variant pill).
- Submitting invalid upload → toast.error appears.
- Delete a document → AlertDialog opens, Cancel/Delete work, on success page refreshes.
- Empty tab (if any) shows `<EmptyState>`.

Stop dev.

- [ ] **Step 18: Commit**

```bash
git add src/app/kb/page.tsx src/app/kb/loading.tsx src/app/kb/error.tsx
git commit -m "style(kb): adopt PageHeader/EmptyState/toast/AlertDialog, restyle chrome

- PageHeader for hero (eyebrow: 'Knowledge Base')
- Replace 5 alert() calls with toast.error (sonner)
- Replace confirm() with <AlertDialog> for document delete
- Fix TabsList override (remove segmented-pill workarounds)
- Replace hand-rolled upload <button> with <Button variant='outline'>
- Replace hand-rolled <input type='checkbox'> with <Checkbox>
- Replace empty-state markup with <EmptyState>
- Remove dead hidden sm:* responsive classes
- Tokenise raw text-[Npx]/rounded-*/text-red-*/bg-white
- Remove DialogTitle className overrides (primitive provides display-3)
- Add kb/loading.tsx (PageSkeleton) and kb/error.tsx (ErrorState w/ retry)"
```

---

## Task 10: Final verification

**Files:** none modified.

- [ ] **Step 1: Clean build**

```bash
npm run build
```
Expected: 0 errors. All 25 routes (27 original minus 2 archived) compile.

- [ ] **Step 2: Lint scoped to PR-2 modified files**

```bash
npx eslint \
  src/app/loading.tsx \
  src/app/page.tsx \
  src/app/login/page.tsx \
  src/app/dashboard/page.tsx src/app/dashboard/loading.tsx src/app/dashboard/error.tsx \
  src/app/kb/page.tsx src/app/kb/loading.tsx src/app/kb/error.tsx \
  src/app/settings/page.tsx \
  src/app/privacy/page.tsx \
  src/app/terms/page.tsx
```
Expected: 0 errors. Pre-existing `<img>` warnings are acceptable.

- [ ] **Step 3: Hazard grep across PR 2 scope**

```bash
# Any alert/confirm remaining in PR 2 files?
grep -rn "\balert(\|\bconfirm(" src/app/login src/app/dashboard src/app/kb src/app/settings src/app/privacy src/app/terms src/app/page.tsx src/app/loading.tsx || echo "OK: no alert/confirm"

# Any bg-white literal?
grep -rn "bg-white" src/app/login src/app/dashboard src/app/kb src/app/settings src/app/privacy src/app/terms || echo "OK: no bg-white"

# Any hex literal?
grep -rnE "#[0-9a-f]{3,6}\b" src/app/login src/app/dashboard src/app/kb src/app/settings src/app/privacy src/app/terms | grep -v "^.*:\s*//\|^.*:\s*/\*" || echo "OK: no hex literals"

# Any raw-Tailwind status colors that should have been tokenised?
grep -rnE "text-(red|blue|violet|amber)-[0-9]+" src/app/login src/app/dashboard src/app/kb src/app/settings src/app/privacy src/app/terms || echo "OK: no untokenised status colors"
```

Each grep should print `OK:` or return no results. If any hits appear, decide: is the hit inside an intentional semantic tint (e.g. `bg-amber-50` inside a compliance-warning component)? If yes, leave it but note it. If not, fix it.

- [ ] **Step 4: Dead-route grep (confirm archive succeeded)**

```bash
ls src/app/projects/\[projectId\]/dojo 2>/dev/null || echo "OK: /dojo removed"
ls src/app/projects/\[projectId\]/guide 2>/dev/null || echo "OK: /guide removed"
ls archive/ | grep -E "dojo|guide" && echo "OK: archived files present"
```

- [ ] **Step 5: Browser walk of all 7 migrated routes**

`npm run dev`. Open each and confirm:

1. `http://localhost:3000/` → redirects to `/dashboard`.
2. `/login` → card-centred form, pill Input + pill Button, error path triggers toast.
3. `/dashboard` → PageHeader with amber-stone pill CTA, project grid with new Card shadow, empty state (if applicable) renders correctly, delete flow works.
4. `/kb` → PageHeader, underline Tabs, upload flow works, delete flow uses AlertDialog.
5. `/settings` → PageHeader, cards render, DB-seed triggers toast.
6. `/privacy` → BackLink + PageHeader + max-w-720 prose.
7. `/terms` → same as /privacy.

Also verify:
- `/projects/[some-id]/dojo` → now 404s (hits `not-found.tsx` from PR 1).
- `/projects/[some-id]/guide` → now 404s.
- Toaster: any toast fires bottom-right with tokenised styling.

Stop dev.

- [ ] **Step 6: Summarise**

Post a one-paragraph summary to the user:
- Routes migrated: 7.
- Routes archived: 2.
- New files: `app/loading.tsx`, `app/dashboard/loading.tsx`, `app/dashboard/error.tsx`, `app/kb/loading.tsx`, `app/kb/error.tsx`, `archive/README.md`, 2 archived page files.
- Sonner migrations: 11 `alert()` calls → `toast.error`/`toast.success`; 1 `confirm()` call → `<AlertDialog>`.
- Any remaining Tabs call-site findings from PR 1's audit that are now fixed or still outstanding.
- `npm run build` and `npm run lint` clean.

---

## Self-Review (author)

**Spec coverage (§ of spec → task):**
- §8 PR 2 routes → Tasks 3–9 (root, login, privacy, terms, settings, dashboard, kb).
- §8 archive dead routes → Task 1.
- §8.1 loading states → Task 2 (global) + Task 8 (dashboard) + Task 9 (kb).
- §8.3 error states → Task 8 (dashboard/error.tsx) + Task 9 (kb/error.tsx). Root `app/error.tsx` shipped in PR 1.
- §8.4 kill alert/confirm → Tasks 4, 7, 8, 9 collectively migrate 11 alerts + 1 confirm.
- §8.5 focus/hover/disabled → consumed via restyled primitives from PR 1 (no task needed here).
- Tabs call-site layout fixes (from PR 1 audit) → Task 9 Step 8 (kb) and Task 1 of PR 3 will cover `/projects/[projectId]/kb`.
- Hex/raw-color purge → covered per-task with explicit grep gates at the end.

**Placeholder scan:**
- Tasks 5 and 6 (privacy, terms) use a template-plus-reconciliation approach rather than exact full-replacement code, because the existing content contains specific policy text I don't have inline. The methodology is precise: "for every existing section, port the prose into the new typography template." This isn't a "TBD" placeholder — it's an instruction set that an engineer can execute deterministically.
- Task 9 Step 14 has conditional guidance ("if uncertain, keep rounded-lg") — reasonable for a surgical pass over a 693-line file.
- No "TBD", "implement later", or missing acceptance criteria found.

**Type / name consistency:**
- `PageHeader`, `BackLink`, `EmptyState`, `ErrorState`, `PageSkeleton`, `CenteredSpinner`, `Checkbox`, `Button`, `Input`, `AlertDialog*` — all imported from the paths shipped in PR 1.
- `toast` imported from `sonner` (installed in PR 1 Task 1).
- CSS variables referenced (`--primary-soft`, `--color-interact-subtle`, `--color-knowledge-muted`, `--danger`, `--radius-*`) all defined in PR 1's `globals.css`.
- No types or props invented.

**Scope check:** This is one PR's worth of work (entry + shell migration). Does not overlap with PR 3 (project core) which handles `/projects/new`, `/projects/new/guide`, `/projects/[projectId]`, `/projects/[projectId]/kb`.
