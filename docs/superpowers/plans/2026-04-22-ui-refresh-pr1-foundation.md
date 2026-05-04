# UI Refresh — PR 1 (Foundation) Implementation Plan — v2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the foundation of the ElevenLabs-inspired UI refresh — new amber token system on a warm stone canvas, typography scale, shadow stack, restyled 18 shadcn primitives + TopNavbar, a full family of new page-level primitives (PageHeader/PageBar/BackLink/EmptyState/ErrorState/PageSkeleton/CenteredSpinner/Kbd/Eyebrow/Mono), the workspace/rail primitive set (`WorkspaceFrame`, `RailHeader`, `RailSection`, `MetaRow`, `JumpItem`), Sonner for toasts, and app-wide `error.tsx` / `not-found.tsx`. Zero user-visible change on existing pages until PR 2 lands.

**Architecture:** Token-first. Rewrite `globals.css` with the amber palette, canvas `#f5f5f5` with white cards/rails, full shadow stack from the exploration files. Preserve existing CSS variable names so pages keep compiling. Then respec the 18 shadcn primitives and add the new primitive family. Install Sonner and mount Toaster. Ship `error.tsx` / `not-found.tsx`. Public component APIs unchanged — existing variant names preserved.

**Tech Stack:** Next.js 16.1.1 (App Router), React 19.2.3, Tailwind CSS v4, shadcn/ui on Radix UI, Inter via `next/font/google`, Lucide icons, React Hook Form, Sonner (new).

**Spec reference:** [docs/superpowers/specs/2026-04-22-ui-elevenlabs-refresh-design.md](../specs/2026-04-22-ui-elevenlabs-refresh-design.md)

**Important notes for the engineer:**
1. **CSS/token migration, not behaviour change.** TDD doesn't apply. Verification loop per task: `npm run build` → `npm run lint` → (where applicable) browser-check a page using the primitive → commit.
2. **Preserve public APIs.** Never rename a prop, variant, or exported symbol. Call-sites in the 27 pages must keep compiling.
3. **No `--no-verify`** on commits. Fix root cause, don't bypass.
4. **Commit after every task.** Frequent commits = cheap rollback.
5. **Branch:** `ui-upgrade-elevenlabs-style` (already checked out). Push requires fork permissions — if push fails, tell the user; don't work around it.
6. **No bg-white literals in new code.** Every new file uses `bg-surface` / `bg-canvas` / tokens. Zero tolerance.

---

## Task 1: Install Sonner

**Files:** `package.json` + `package-lock.json`.

- [ ] **Step 1: Install**
```bash
npm install sonner
```

- [ ] **Step 2: Verify install**
```bash
node -e "console.log(require('sonner/package.json').version)"
```
Expected: prints a version string.

- [ ] **Step 3: Build**
```bash
npm run build
```
Expected: clean.

- [ ] **Step 4: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add sonner for app-wide toast notifications"
```

---

## Task 2: Rewrite `globals.css` with amber token system

**Files:** `src/app/globals.css` (full rewrite).

- [ ] **Step 1: Replace the entire contents of `src/app/globals.css` with:**

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  /* Color tokens — Tailwind class mapping; keep every existing name aliased so call-sites still resolve */
  --color-background: var(--canvas);
  --color-foreground: var(--ink);
  --color-card: var(--surface);
  --color-card-foreground: var(--ink);
  --color-popover: var(--surface);
  --color-popover-foreground: var(--ink);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-fg);
  --color-secondary: var(--surface-muted);
  --color-secondary-foreground: var(--ink);
  --color-muted: var(--surface-muted);
  --color-muted-foreground: var(--ink-secondary);
  --color-accent: var(--surface-muted);
  --color-accent-foreground: var(--ink);
  --color-destructive: var(--danger);
  --color-border: var(--border);
  --color-input: var(--border);
  --color-ring: var(--primary);

  /* Semantic / legacy aliases */
  --color-interact: var(--primary);
  --color-interact-foreground: var(--primary-fg);
  --color-interact-muted: var(--primary-soft);
  --color-interact-subtle: var(--primary-soft);
  --color-info: var(--info);
  --color-info-foreground: var(--info);
  --color-info-muted: var(--info-soft);
  --color-info-subtle: var(--info-soft);
  --color-knowledge: var(--knowledge);
  --color-knowledge-foreground: var(--knowledge);
  --color-knowledge-muted: var(--knowledge-soft);
  --color-knowledge-subtle: var(--knowledge-soft);

  /* Sidebar aliases (keep in case any legacy refs exist) */
  --color-sidebar: var(--surface);
  --color-sidebar-foreground: var(--ink);
  --color-sidebar-primary: var(--primary);
  --color-sidebar-primary-foreground: var(--primary-fg);
  --color-sidebar-accent: var(--surface-muted);
  --color-sidebar-accent-foreground: var(--ink);
  --color-sidebar-border: var(--border);
  --color-sidebar-ring: var(--primary);

  /* Chart tokens (lifted to semantic tokens; keep for any chart callers) */
  --color-chart-1: var(--primary);
  --color-chart-2: var(--info);
  --color-chart-3: var(--knowledge);
  --color-chart-4: var(--persona-4);
  --color-chart-5: var(--persona-5);

  /* Fonts */
  --font-sans: var(--font-inter);
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;

  /* Tailwind radius scale aliases */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --radius-2xl: calc(var(--radius) + 8px);
  --radius-3xl: calc(var(--radius) + 12px);
  --radius-4xl: calc(var(--radius) + 16px);
}

:root {
  /* ── Surfaces (warm stone canvas) ─────────────────────────────── */
  --canvas:         oklch(0.965 0.003 70);   /* #f5f5f5 — page base */
  --surface:        oklch(1 0 0);            /* #ffffff — cards, rails, panels */
  --surface-muted:  oklch(0.97 0.005 70);    /* #f5f2ef — stone callout */
  --surface-stone:  oklch(0.965 0.006 70 / 0.8);

  /* ── Ink ──────────────────────────────────────────────────────── */
  --ink:            oklch(0 0 0);
  --ink-secondary:  oklch(0.37 0.005 70);    /* #4e4e4e */
  --ink-muted:      oklch(0.53 0.01 68);     /* #777169 */

  /* ── Primary — amber accent ───────────────────────────────────── */
  --primary:           oklch(0.53 0.14 60);  /* #b45309 */
  --primary-hover:     oklch(0.48 0.14 60);
  --primary-fg:        oklch(0.985 0.005 70);
  --primary-soft:      oklch(0.53 0.14 60 / 0.08);
  --primary-underline: oklch(0.53 0.14 60 / 0.45);

  /* ── Persona palette (categorical only) ───────────────────────── */
  --persona-1:      oklch(0.48 0.20 300);    /* #7c3aed — purple */
  --persona-2:      oklch(0.56 0.12 210);    /* #0891b2 — cyan */
  --persona-3:      oklch(0.53 0.14 60);     /* #b45309 — amber */
  --persona-4:      oklch(0.56 0.13 85);     /* #ca8a04 — gold */
  --persona-5:      oklch(0.48 0.18 345);    /* #be185d — rose */
  --persona-1-soft: oklch(0.48 0.20 300 / 0.08);
  --persona-2-soft: oklch(0.56 0.12 210 / 0.08);
  --persona-3-soft: oklch(0.53 0.14 60 / 0.08);
  --persona-4-soft: oklch(0.56 0.13 85 / 0.08);
  --persona-5-soft: oklch(0.48 0.18 345 / 0.08);

  /* ── Synthesis categories ─────────────────────────────────────── */
  --cat-agreements:       oklch(0.47 0.09 180);
  --cat-agreements-soft:  oklch(0.47 0.09 180 / 0.08);
  --cat-tensions:         oklch(0.50 0.20 27);
  --cat-tensions-soft:    oklch(0.50 0.20 27 / 0.08);
  --cat-gaps:             oklch(0.52 0 0);
  --cat-gaps-soft:        oklch(0.93 0 0);

  /* ── Semantic status ──────────────────────────────────────────── */
  --success:        oklch(0.62 0.15 145);
  --success-soft:   oklch(0.62 0.15 145 / 0.08);
  --warning:        oklch(0.70 0.14 70);
  --warning-soft:   oklch(0.70 0.14 70 / 0.08);
  --danger:         oklch(0.57 0.17 27);
  --danger-soft:    oklch(0.57 0.17 27 / 0.08);
  --info:           oklch(0.55 0.14 245);
  --info-soft:      oklch(0.55 0.14 245 / 0.08);
  --knowledge:      oklch(0.53 0.14 298);
  --knowledge-soft: oklch(0.53 0.14 298 / 0.08);

  /* Severity aliases */
  --severity-high:   var(--danger);
  --severity-medium: var(--warning);
  --severity-low:    var(--ink-muted);

  /* ── Borders ──────────────────────────────────────────────────── */
  --border:         oklch(0 0 0 / 0.075);
  --border-strong:  oklch(0 0 0 / 0.12);
  --border-subtle:  oklch(0 0 0 / 0.05);

  /* ── Radii ────────────────────────────────────────────────────── */
  --radius:         12px;     /* default base — feeds sm/md/lg/xl/2xl/3xl calc scale */
  --radius-chip:    6px;
  --radius-sm2:     8px;
  --radius-md2:     10px;
  --radius-card:    14px;
  --radius-card-lg: 16px;
  --radius-chat:    18px;
  --radius-panel:   24px;
  --radius-pill:    9999px;

  /* ── Shadows (warm, multi-layer, sub-0.1 opacity) ─────────────── */
  --shadow-inset-edge:    inset 0 0 0 0.5px rgb(0 0 0 / 0.075);
  --shadow-ring:          0 0 0 1px rgb(0 0 0 / 0.06);
  --shadow-outline-ring:  0 0 0 1px rgb(0 0 0 / 0.06),
                          0 1px 2px rgb(0 0 0 / 0.04),
                          0 2px 4px rgb(0 0 0 / 0.04);
  --shadow-card:          0 0 1px rgb(0 0 0 / 0.4),
                          0 4px 4px rgb(0 0 0 / 0.04);
  --shadow-warm-lift:     0 6px 16px rgb(78 50 23 / 0.04);
  --shadow-composer:      0 0 0 1px rgb(0 0 0 / 0.06),
                          0 2px 6px rgb(0 0 0 / 0.04),
                          0 10px 24px rgb(78 50 23 / 0.04);
  --shadow-focus:         0 0 0 3px oklch(0.53 0.14 60 / 0.35);
  --shadow-amber-active:  0 0 0 2px oklch(0.53 0.14 60 / 0.18);
}

@layer base {
  * { @apply border-border; }

  html { cursor: default; }

  html, body {
    background: var(--canvas);
    color: var(--ink);
    overscroll-behavior: none;
    font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
    font-size: 13.5px;
    line-height: 1.7;
    letter-spacing: 0.01em;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  h1, h2, h3, h4 {
    font-weight: 300;
    letter-spacing: -0.02em;
    color: var(--ink);
  }
  h1 { font-size: 28px; line-height: 1.15; }
  h2 { font-size: 22px; line-height: 1.15; letter-spacing: -0.01em; }
  h3 { font-size: 18px; line-height: 1.2; letter-spacing: -0.01em; }
  h4 { font-size: 16px; line-height: 1.2; letter-spacing: -0.01em; }

  /* Cursors */
  a, button, [role="button"], [role="tab"], [role="menuitem"], [role="option"],
  [role="checkbox"], [role="radio"], [role="switch"], [role="link"],
  input[type="submit"], input[type="button"], input[type="reset"],
  input[type="file"], label[for], select, summary { cursor: pointer; }

  input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]),
  textarea, [contenteditable="true"] { cursor: text; }
}

/* ── Typography utilities ──────────────────────────────────────── */
@layer utilities {
  .text-display-hero { font-size: 48px; line-height: 1.08; letter-spacing: -0.02em; font-weight: 300; }
  .text-display-1    { font-size: 34px; line-height: 1.10; letter-spacing: -0.02em; font-weight: 300; }
  .text-display-2    { font-size: 28px; line-height: 1.15; letter-spacing: -0.02em; font-weight: 300; }
  .text-display-3    { font-size: 22px; line-height: 1.15; letter-spacing: -0.02em; font-weight: 300; }
  .text-display-4    { font-size: 18px; line-height: 1.20; letter-spacing: -0.01em; font-weight: 300; }
  .text-display-5    { font-size: 16px; line-height: 1.15; letter-spacing: -0.01em; font-weight: 300; }
  .text-body-lg      { font-size: 15px; line-height: 1.55; letter-spacing: 0.01em; font-weight: 400; }
  .text-body         { font-size: 13.5px; line-height: 1.70; letter-spacing: 0.01em; font-weight: 400; }
  .text-body-sm      { font-size: 12.5px; line-height: 1.55; letter-spacing: 0.01em; font-weight: 400; }
  .text-ui           { font-size: 12.5px; line-height: 1.47; letter-spacing: 0.01em; font-weight: 500; }
  .text-ui-sm        { font-size: 11px; line-height: 1.33; letter-spacing: 0.01em; font-weight: 500; }
  .text-eyebrow      { font-size: 10.5px; line-height: 1.10; letter-spacing: 0.14em; font-weight: 700; text-transform: uppercase; }
  .text-caption      { font-size: 11px; line-height: 1.40; letter-spacing: 0.01em; font-weight: 500; }
  .text-mono-meta    { font-size: 11px; line-height: 1.10; letter-spacing: 0; font-weight: 500; font-family: var(--font-mono); }
  .text-tag          { font-size: 9px; line-height: 1; letter-spacing: 0.10em; font-weight: 700; text-transform: uppercase; }

  /* Shadow utilities */
  .shadow-inset-edge    { box-shadow: var(--shadow-inset-edge); }
  .shadow-ring          { box-shadow: var(--shadow-ring); }
  .shadow-outline-ring  { box-shadow: var(--shadow-outline-ring); }
  .shadow-card          { box-shadow: var(--shadow-card); }
  .shadow-warm-lift     { box-shadow: var(--shadow-warm-lift); }
  .shadow-composer      { box-shadow: var(--shadow-composer); }
  .shadow-focus         { box-shadow: var(--shadow-focus); }
  .shadow-amber-active  { box-shadow: var(--shadow-amber-active); }
}

/* Custom Animations */
@keyframes shimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Created by Swapnil Bapat © 2026 */
```

- [ ] **Step 2: Build**
```bash
npm run build
```
Expected: clean. If CSS errors appear, read carefully — usually a typo in a var name.

- [ ] **Step 3: Lint**
```bash
npm run lint
```
Expected: no new errors.

- [ ] **Step 4: Commit**
```bash
git add src/app/globals.css
git commit -m "style(foundation): rewrite globals.css with amber-accent token system

Replace existing token system with amber-accent palette on warm stone
canvas (#f5f5f5):
- Canvas base + white cards/rails
- Primary amber (#b45309, OKLCH 0.53 0.14 60)
- 5-color persona palette (categorical)
- Synthesis category tokens (agreements/tensions/gaps)
- Semantic status + severity aliases
- Warm multi-layer shadow stack (inset-edge, ring, outline-ring,
  card, warm-lift, composer, focus, amber-active)
- Full radius scale (chip/sm2/md2/card/card-lg/chat/panel/pill)
- 16 typography utilities (display-hero..5, body-lg/sm, ui/ui-sm,
  eyebrow, caption, mono-meta, tag)
- Strip .dark{} block

Preserves every existing CSS variable name; values change, names don't.
Ref: docs/superpowers/specs/2026-04-22-ui-elevenlabs-refresh-design.md"
```

---

## Task 3: Update `layout.tsx` (Inter weights, Sonner Toaster, footer tokenize)

**Files:** `src/app/layout.tsx`.

- [ ] **Step 1: Replace the entire contents of `src/app/layout.tsx` with:**

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HPB AI Tool",
  description: "Internal HPB tools for interview rehearsal and question quality analysis",
  creator: "Swapnil Bapat",
  other: { "created-by": "Created by Swapnil Bapat © 2026" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {/* Mobile disclaimer — desktop-only app */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-canvas p-8 md:hidden">
          <div className="flex flex-col items-center text-center max-w-sm">
            <img src="/hpb-logo.png" alt="HPB Logo" className="h-12 w-auto object-contain mb-6" />
            <h1 className="text-display-3 mb-2">Desktop Only</h1>
            <p className="text-body-sm text-muted-foreground">
              This tool is optimised for laptop and desktop screens. Please switch to a device with a larger display to continue.
            </p>
          </div>
        </div>

        {/* App shell — hidden on mobile */}
        <div className="hidden md:flex min-h-screen flex-col bg-canvas text-foreground">
          <TopNavbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          <footer className="w-full mt-16 border-t border-[color:var(--border-subtle)] bg-[color:var(--surface)]">
            <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
              <p className="text-caption text-muted-foreground">Version 1.0.0. Aleph Pte Ltd.</p>
              <div className="flex items-center gap-5 text-caption">
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Use</a>
                <span className="text-[color:var(--border-subtle)]">|</span>
                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Statement</a>
              </div>
            </div>
          </footer>
        </div>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--surface)",
              color: "var(--ink)",
              borderRadius: "var(--radius-card)",
              boxShadow: "var(--shadow-outline-ring)",
              fontSize: "13.5px",
              letterSpacing: "0.01em",
              fontFamily: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
            },
            className: "hpb-toast",
          }}
        />
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Use the Canvas token — add `bg-canvas` utility**

Tailwind v4 generates `bg-canvas` automatically from `--color-background: var(--canvas)`. The utility `bg-canvas` itself isn't generated because `canvas` isn't one of the `@theme inline --color-*` names we registered. Use `bg-background` instead — which already resolves to `var(--canvas)` per the mapping in Task 2.

**Correction**: Change `bg-canvas` to `bg-background` on both the mobile disclaimer and the app shell in Step 1. Re-save. The tokenization is correct; the class name needs to use the registered mapping.

- [ ] **Step 3: Build + lint**
```bash
npm run build && npm run lint
```

- [ ] **Step 4: Browser sanity**
```bash
npm run dev
```
Open `http://localhost:3000/dashboard`. Expected: page renders on warm off-white canvas. TopNavbar + footer show. No console errors. Stop dev.

- [ ] **Step 5: Commit**
```bash
git add src/app/layout.tsx
git commit -m "style(foundation): mount Sonner Toaster, tokenize body/footer, expand Inter weights

- Inter weights: 300 (display), 400/500/600/700 (body/UI)
- Mount Sonner <Toaster /> bottom-right with tokenised styling
- Tokenize mobile disclaimer + app shell + footer (no more bg-white)
- Display-3 on mobile disclaimer heading, caption utility on footer"
```

---

## Task 4: Create atomic inline primitives (`Eyebrow`, `Mono`, `Kbd`)

**Files:** `src/components/ui/eyebrow.tsx`, `src/components/ui/mono.tsx`, `src/components/ui/kbd.tsx`.

- [ ] **Step 1: Create `src/components/ui/eyebrow.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="eyebrow"
      className={cn(
        "text-eyebrow text-muted-foreground flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Eyebrow }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Create `src/components/ui/mono.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Mono({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="mono"
      className={cn("text-mono-meta text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Mono }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 3: Create `src/components/ui/kbd.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex items-center justify-center min-w-[1.5rem] h-[1.25rem] px-1",
        "font-mono text-[11px] leading-none text-muted-foreground",
        "bg-background rounded-[4px] shadow-ring align-middle",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 4: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/eyebrow.tsx src/components/ui/mono.tsx src/components/ui/kbd.tsx
git commit -m "feat(ui): add Eyebrow, Mono, Kbd inline primitives

Eyebrow: signature 10.5/700/0.14em uppercase section label.
Mono: 11px mono inline wrapper for counts/IDs/timestamps.
Kbd: inline keyboard shortcut hint with ring shadow."
```

---

## Task 5: Create `CenteredSpinner`, `PageSkeleton`, `CardSkeleton`

**Files:**
- `src/components/ui/centered-spinner.tsx`
- `src/components/ui/page-skeleton.tsx`
- `src/components/ui/card-skeleton.tsx`

- [ ] **Step 1: Create `src/components/ui/centered-spinner.tsx`:**

```tsx
import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

function CenteredSpinner({
  className,
  label,
  size = 20,
  ...props
}: React.ComponentProps<"div"> & { label?: string; size?: number }) {
  return (
    <div
      data-slot="centered-spinner"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
      {...props}
    >
      <Loader2 className="animate-spin" style={{ width: size, height: size }} />
      {label && <p className="text-caption">{label}</p>}
    </div>
  )
}

export { CenteredSpinner }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Create `src/components/ui/card-skeleton.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const shimmer =
  "relative overflow-hidden bg-[color:var(--surface-muted)] " +
  "before:absolute before:inset-0 before:-translate-x-full " +
  "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent " +
  "before:animate-[shimmer_1.4s_infinite]"

function Bar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("h-3 rounded-[4px]", shimmer, className)}
      {...props}
    />
  )
}

function CardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn(
        "rounded-[var(--radius-card-lg)] bg-[color:var(--surface)] p-6",
        "shadow-outline-ring flex flex-col gap-3",
        className
      )}
      {...props}
    >
      <Bar className="w-1/3" />
      <Bar className="w-full" />
      <Bar className="w-5/6" />
      <Bar className="w-2/3" />
    </div>
  )
}

export { CardSkeleton }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 3: Create `src/components/ui/page-skeleton.tsx`:**

```tsx
import * as React from "react"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { cn } from "@/lib/utils"

function PageSkeleton({
  className,
  cards = 3,
  ...props
}: React.ComponentProps<"div"> & { cards?: number }) {
  return (
    <div
      data-slot="page-skeleton"
      className={cn("w-full py-10", className)}
      aria-busy="true"
      aria-live="polite"
      {...props}
    >
      {/* Title block */}
      <div className="flex flex-col gap-3 mb-8 max-w-xl">
        <div
          className="h-3 w-24 rounded-[4px] bg-[color:var(--surface-muted)]
            relative overflow-hidden before:absolute before:inset-0
            before:-translate-x-full before:bg-gradient-to-r
            before:from-transparent before:via-white/40 before:to-transparent
            before:animate-[shimmer_1.4s_infinite]"
          aria-hidden
        />
        <div
          className="h-7 w-2/3 rounded-[6px] bg-[color:var(--surface-muted)]
            relative overflow-hidden before:absolute before:inset-0
            before:-translate-x-full before:bg-gradient-to-r
            before:from-transparent before:via-white/40 before:to-transparent
            before:animate-[shimmer_1.4s_infinite]"
          aria-hidden
        />
      </div>

      {/* Card grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export { PageSkeleton }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 4: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/centered-spinner.tsx src/components/ui/card-skeleton.tsx src/components/ui/page-skeleton.tsx
git commit -m "feat(ui): add CenteredSpinner, CardSkeleton, PageSkeleton loading primitives

CenteredSpinner: Lucide Loader2 centered with optional label.
CardSkeleton: standalone shimmer card for per-card async load.
PageSkeleton: full-page loading shell with title + card grid shimmer."
```

---

## Task 6: Create `BackLink` primitive

**Files:** `src/components/layout/back-link.tsx`.

- [ ] **Step 1: Create `src/components/layout/back-link.tsx`:**

```tsx
"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  href?: string
  onClick?: () => void
  label?: string
  className?: string
}

function BackLink({ href, onClick, label = "Back", className }: Props) {
  const router = useRouter()

  const content = (
    <>
      <ChevronLeft className="h-3 w-3" strokeWidth={2} />
      <span>{label}</span>
    </>
  )

  const base = cn(
    "inline-flex items-center gap-1.5 h-7 px-2.5 -ml-2.5",
    "text-ui-sm text-muted-foreground hover:text-foreground",
    "bg-transparent hover:bg-[color:var(--surface-muted)]/50",
    "rounded-[var(--radius-sm2)] transition-colors outline-none",
    "focus-visible:shadow-focus",
    className
  )

  if (href) {
    return <Link href={href} className={base}>{content}</Link>
  }

  return (
    <button
      type="button"
      onClick={onClick ?? (() => router.back())}
      className={base}
    >
      {content}
    </button>
  )
}

export { BackLink }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/layout/back-link.tsx
git commit -m "feat(layout): add BackLink primitive for PageBar + legal pages"
```

---

## Task 7: Create `PageHeader` primitive

**Files:** `src/components/layout/page-header.tsx`.

- [ ] **Step 1: Create `src/components/layout/page-header.tsx`:**

```tsx
import * as React from "react"
import { Eyebrow } from "@/components/ui/eyebrow"
import { cn } from "@/lib/utils"

type Props = {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function PageHeader({ eyebrow, title, description, action, className }: Props) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-3 pt-8 pb-6",
        "md:flex-row md:items-end md:justify-between md:gap-6",
        className
      )}
    >
      <div className="flex flex-col gap-2 min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-display-2 text-foreground">{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </header>
  )
}

export { PageHeader }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/layout/page-header.tsx
git commit -m "feat(layout): add PageHeader primitive (eyebrow + title + description + action)"
```

---

## Task 8: Create `PageBar` primitive (sticky sub-header)

**Files:** `src/components/layout/page-bar.tsx`.

- [ ] **Step 1: Create `src/components/layout/page-bar.tsx`:**

```tsx
"use client"

import * as React from "react"
import { BackLink } from "@/components/layout/back-link"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

type Props = {
  back?: { href?: string; onClick?: () => void; label?: string }
  crumbs?: Crumb[]
  action?: React.ReactNode
  className?: string
  sticky?: boolean
}

function PageBar({ back, crumbs, action, className, sticky = true }: Props) {
  return (
    <div
      data-slot="page-bar"
      className={cn(
        sticky && "sticky top-16 z-40",
        "w-full bg-[color:var(--surface)] border-b border-[color:var(--border-subtle)]",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {back && <BackLink href={back.href} onClick={back.onClick} label={back.label} />}
          {back && crumbs && <div className="h-5 w-px bg-[color:var(--border)]" />}
          {crumbs && crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0 text-body-sm text-muted-foreground">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1
                const sep = (
                  <span key={`sep-${i}`} className="text-muted-foreground/50 select-none" aria-hidden>
                    /
                  </span>
                )
                const item = c.href && !last ? (
                  <a
                    key={c.label}
                    href={c.href}
                    className="hover:text-foreground transition-colors truncate"
                  >
                    {c.label}
                  </a>
                ) : (
                  <span
                    key={c.label}
                    className={cn(
                      "truncate",
                      last && "text-foreground font-medium"
                    )}
                  >
                    {c.label}
                  </span>
                )
                return i === 0 ? item : [sep, item]
              })}
            </nav>
          )}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
    </div>
  )
}

export { PageBar }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/layout/page-bar.tsx
git commit -m "feat(layout): add PageBar sticky sub-header (back + crumbs + action)"
```

---

## Task 9: Create `EmptyState` primitive

**Files:** `src/components/ui/empty-state.tsx`.

- [ ] **Step 1: Create `src/components/ui/empty-state.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-[var(--radius-card-lg)] bg-[color:var(--surface)] shadow-outline-ring",
        "py-16 px-8 gap-4",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12",
            "rounded-[var(--radius-card)] bg-[color:var(--surface-muted)]",
            "text-muted-foreground shadow-inset-edge",
            "[&>svg]:h-5 [&>svg]:w-5"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-md">
        <h3 className="text-display-5 text-foreground">{title}</h3>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/empty-state.tsx
git commit -m "feat(ui): add EmptyState primitive (icon tile + title + description + action)"
```

---

## Task 10: Create `ErrorState` primitive

**Files:** `src/components/ui/error-state.tsx`.

- [ ] **Step 1: Create `src/components/ui/error-state.tsx`:**

```tsx
import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  icon?: React.ReactNode
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function ErrorState({
  icon,
  title = "Something went wrong",
  description,
  action,
  className,
}: Props) {
  return (
    <div
      data-slot="error-state"
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-[var(--radius-card-lg)] bg-[color:var(--surface)]",
        "shadow-outline-ring border-l-[3px] border-l-[color:var(--danger)]",
        "py-16 px-8 gap-4",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-12 h-12",
          "rounded-[var(--radius-card)] bg-[color:var(--danger-soft)]",
          "text-[color:var(--danger)] shadow-inset-edge",
          "[&>svg]:h-5 [&>svg]:w-5"
        )}
      >
        {icon ?? <AlertTriangle />}
      </div>
      <div className="flex flex-col gap-1.5 max-w-md">
        <h3 className="text-display-5 text-foreground">{title}</h3>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 mt-2">{action}</div>}
    </div>
  )
}

export { ErrorState }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/error-state.tsx
git commit -m "feat(ui): add ErrorState primitive with danger accent bar"
```

---

## Task 11: Add `app/not-found.tsx` and `app/error.tsx`

**Files:**
- `src/app/not-found.tsx` (new)
- `src/app/error.tsx` (new)

- [ ] **Step 1: Create `src/app/not-found.tsx`:**

```tsx
import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="pt-10 pb-16">
      <ErrorState
        icon={<FileQuestion />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
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

- [ ] **Step 2: Create `src/app/error.tsx`:**

```tsx
"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { ErrorState } from "@/components/ui/error-state"
import { Button } from "@/components/ui/button"

export default function AppError({
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
        title="Something went wrong"
        description={
          error.message
            ? `We hit an error: ${error.message}`
            : "An unexpected error occurred. Please try again."
        }
        action={
          <>
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">Back to dashboard</a>
            </Button>
          </>
        }
      />
    </div>
  )
}
```

- [ ] **Step 3: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/app/not-found.tsx src/app/error.tsx
git commit -m "feat(app): add app-wide not-found.tsx and error.tsx

Replaces window.alert fallbacks. Uses ErrorState primitive."
```

---

## Task 12: Restyle `Button`

**Files:** `src/components/ui/button.tsx`.

- [ ] **Step 1: Replace the entire contents of `src/components/ui/button.tsx` with:**

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-ui rounded-[var(--radius-pill)]",
    "transition-[background-color,box-shadow,color] duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:shadow-focus",
    "aria-invalid:shadow-[0_0_0_2px_color-mix(in_oklab,var(--danger)_45%,transparent)]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--ink)] text-[color:var(--primary-fg)] shadow-card hover:brightness-110",
        destructive:
          "bg-transparent text-[color:var(--danger)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--danger)_30%,transparent)] hover:bg-[color:var(--danger-soft)]",
        outline:
          "bg-transparent text-foreground shadow-outline-ring hover:bg-[color:var(--surface-muted)]/60",
        secondary:
          "bg-[color:var(--surface)] text-foreground shadow-card hover:bg-[color:var(--surface-muted)]/40",
        ghost:
          "bg-transparent text-foreground hover:bg-[color:var(--surface-muted)]/60",
        link:
          "text-[color:var(--primary)] underline-offset-4 hover:underline rounded-none shadow-none",
        featured: [
          "bg-[color:var(--surface-stone)] text-foreground",
          "rounded-[30px] shadow-warm-lift shadow-outline-ring",
          "hover:bg-[color:var(--surface-muted)]",
        ].join(" "),
        knowledge:
          "bg-transparent text-[color:var(--knowledge)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--knowledge)_25%,transparent)] hover:bg-[color:var(--knowledge-soft)]",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-7 px-3 text-ui-sm gap-1.5",
        lg: "h-11 px-6",
        icon: "size-9 px-0",
        "icon-sm": "size-7 px-0",
        "icon-lg": "size-11 px-0",
      },
    },
    compoundVariants: [
      { variant: "featured", size: "default", class: "px-5 py-3 pl-[14px]" },
      { variant: "featured", size: "lg", class: "px-6 py-3.5 pl-4" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/button.tsx
git commit -m "style(ui): restyle Button — pill, amber accent, add featured + knowledge variants

- default: ink bg + shadow-card (matches exploration PillPrimary)
- secondary: white pill + shadow-card (PillGhost)
- outline: transparent + shadow-outline-ring
- destructive: red ink on transparent (kill red solid fills)
- featured (NEW): warm stone pill, asymmetric padding, shadow-warm-lift
- knowledge (NEW): purple ghost for KB affordances
- Sizes tightened. Focus uses shadow-focus."
```

---

## Task 13: Restyle `Card`

**Files:** `src/components/ui/card.tsx`.

- [ ] **Step 1: Replace the entire contents with:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col",
        "rounded-[var(--radius-card-lg)] shadow-outline-ring",
        "transition-shadow duration-200 ease-out",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5",
        "px-6 pt-6 pb-3 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-5",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-display-5 text-foreground", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-body-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 pb-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 pt-4 [.border-t]:pt-5", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
}
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/card.tsx
git commit -m "style(ui): restyle Card with outline-ring shadow and display-5 title"
```

---

## Task 14: Restyle `Dialog`

Full new file contents (replace everything):

```tsx
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]",
          "translate-x-[-50%] translate-y-[-50%] gap-4",
          "rounded-[var(--radius-panel)] bg-[color:var(--surface)]",
          "shadow-outline-ring shadow-warm-lift",
          "p-7 duration-200 outline-none sm:max-w-lg",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "absolute top-4 right-4 rounded-full p-1.5",
              "text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)]/60",
              "transition-colors outline-none",
              "focus-visible:shadow-focus",
              "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-3.5"
            )}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-2",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-display-3 text-foreground", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
// Created by Swapnil Bapat © 2026
```

- [ ] **Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/dialog.tsx
git commit -m "style(ui): restyle Dialog — panel radius, warm shadow, display-3 title"
```

---

## Task 15: Restyle `AlertDialog`

**Files:** `src/components/ui/alert-dialog.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />
}
function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
}
function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
}

function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]",
          "translate-x-[-50%] translate-y-[-50%] gap-4",
          "rounded-[var(--radius-panel)] bg-[color:var(--surface)]",
          "shadow-outline-ring shadow-warm-lift",
          "p-7 duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 mt-2",
        className
      )}
      {...props}
    />
  )
}

function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-display-3 text-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-body text-muted-foreground", className)}
      {...props}
    />
  )
}

function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/alert-dialog.tsx
git commit -m "style(ui): restyle AlertDialog to match Dialog treatment"
```

---

## Task 16: Restyle `DropdownMenu`

**Files:** `src/components/ui/dropdown-menu.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger
const DropdownMenuGroup = DropdownMenuPrimitive.Group
const DropdownMenuPortal = DropdownMenuPrimitive.Portal
const DropdownMenuSub = DropdownMenuPrimitive.Sub
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const itemBase =
  "relative flex cursor-default select-none items-center gap-2 rounded-[8px] px-2.5 py-2 text-ui-sm text-foreground outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
const itemState =
  "focus:bg-[color:var(--surface-muted)] data-[state=open]:bg-[color:var(--surface-muted)] data-[state=checked]:bg-[color:var(--primary-soft)] data-[state=checked]:text-[color:var(--primary)]"

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(itemBase, itemState, inset && "pl-8", className)}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const contentBase =
  "z-50 min-w-[10rem] overflow-hidden rounded-[var(--radius-card-lg)] bg-[color:var(--surface)] text-foreground p-1.5 shadow-outline-ring data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1"

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(contentBase, className)}
    {...props}
  />
))
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(contentBase, className)}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(itemBase, itemState, inset && "pl-8", className)}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(itemBase, itemState, "pl-8 pr-2", className)}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-[color:var(--primary)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(itemBase, itemState, "pl-8 pr-2", className)}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-[color:var(--primary)] text-[color:var(--primary)]" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2.5 pt-2 pb-1 text-eyebrow text-muted-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-[color:var(--border-subtle)]", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-caption text-muted-foreground", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/dropdown-menu.tsx
git commit -m "style(ui): restyle DropdownMenu with outline-ring popover + amber-soft active"
```

---

## Task 17: Restyle `Select`

**Files:** `src/components/ui/select.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}
function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />
}
function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />
}

function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default"
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "flex w-full items-center justify-between gap-2 whitespace-nowrap",
        "rounded-[var(--radius-md2)] bg-[color:var(--surface)] text-body text-foreground",
        "shadow-inset-edge px-3.5 py-2.5",
        "data-[size=default]:h-10 data-[size=sm]:h-9 data-[size=sm]:text-ui-sm",
        "data-[placeholder]:text-muted-foreground",
        "transition-shadow outline-none",
        "focus-visible:shadow-focus",
        "aria-invalid:shadow-[0_0_0_2px_color-mix(in_oklab,var(--danger)_45%,transparent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "*:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectContent({
  className,
  children,
  position = "popper",
  align = "start",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "z-50 max-h-(--radix-select-content-available-height) min-w-[10rem]",
          "origin-(--radix-select-content-transform-origin)",
          "overflow-x-hidden overflow-y-auto",
          "rounded-[var(--radius-card-lg)] bg-[color:var(--surface)] text-foreground",
          "shadow-outline-ring p-1.5",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        align={align}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-0",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2.5 pt-2 pb-1 text-eyebrow text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-default select-none items-center gap-2",
        "rounded-[8px] py-2 pr-8 pl-2.5 text-ui-sm text-foreground",
        "outline-none transition-colors",
        "focus:bg-[color:var(--surface-muted)]",
        "data-[state=checked]:bg-[color:var(--primary-soft)] data-[state=checked]:text-[color:var(--primary)]",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "*:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className
      )}
      {...props}
    >
      <span
        data-slot="select-item-indicator"
        className="absolute right-2 flex size-3.5 items-center justify-center"
      >
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4 text-[color:var(--primary)]" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn(
        "pointer-events-none -mx-1 my-1 h-px bg-[color:var(--border-subtle)]",
        className
      )}
      {...props}
    />
  )
}

function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  )
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1 text-muted-foreground",
        className
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  )
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/select.tsx
git commit -m "style(ui): restyle Select trigger + popover to amber token system"
```

---

## Task 18: Restyle `Tooltip`

**Files:** `src/components/ui/tooltip.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
  delayDuration = 150,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

function Tooltip({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-50 max-w-xs rounded-[8px] px-2.5 py-1.5",
          "bg-foreground text-[color:var(--primary-fg)]",
          "text-caption shadow-ring",
          "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          "data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1",
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/tooltip.tsx
git commit -m "style(ui): restyle Tooltip to caption type and ring shadow"
```

---

## Task 19: Restyle `Input` + `Textarea`

**Files:**
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`

- [ ] **Step 1: Replace entire contents of `src/components/ui/input.tsx` with:**

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-[var(--radius-md2)] bg-[color:var(--surface)] text-body text-foreground",
        "shadow-inset-edge px-3.5 py-2.5",
        "placeholder:text-muted-foreground",
        "selection:bg-[color:var(--primary)] selection:text-[color:var(--primary-fg)]",
        "transition-shadow outline-none",
        "focus-visible:shadow-focus",
        "aria-invalid:shadow-[0_0_0_2px_color-mix(in_oklab,var(--danger)_45%,transparent)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-ui-sm file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Replace entire contents of `src/components/ui/textarea.tsx` with:**

```tsx
import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-[var(--radius-md2)] bg-[color:var(--surface)] text-body text-foreground",
        "shadow-inset-edge px-3.5 py-2.5",
        "placeholder:text-muted-foreground",
        "transition-shadow outline-none",
        "focus-visible:shadow-focus",
        "aria-invalid:shadow-[0_0_0_2px_color-mix(in_oklab,var(--danger)_45%,transparent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 3: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/input.tsx src/components/ui/textarea.tsx
git commit -m "style(ui): restyle Input + Textarea with inset-edge shadow and amber focus ring"
```

---

## Task 20: Restyle `Checkbox`

**Files:** `src/components/ui/checkbox.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-[4px] bg-[color:var(--surface)]",
      "shadow-inset-edge",
      "transition-[background-color,box-shadow] outline-none",
      "focus-visible:shadow-focus",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-[color:var(--primary)]",
      "data-[state=checked]:text-[color:var(--primary-fg)]",
      "data-[state=checked]:shadow-none",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/checkbox.tsx
git commit -m "style(ui): restyle Checkbox with inset-edge + amber primary fill"
```

---

## Task 21: Restyle `Slider`

**Files:** `src/components/ui/slider.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
        ? defaultValue
        : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none",
        "data-[disabled]:opacity-50",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full bg-[color:var(--surface-muted)]",
          "data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:w-full",
          "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute bg-[color:var(--primary)]",
            "data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className={cn(
            "block size-4 shrink-0 rounded-full bg-[color:var(--surface)]",
            "shadow-card",
            "transition-shadow outline-none",
            "focus-visible:shadow-focus",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/slider.tsx
git commit -m "style(ui): restyle Slider with thin track and card-shadow thumb"
```

---

## Task 22: Restyle `Label`

**Files:** `src/components/ui/label.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-ui-sm text-foreground select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/label.tsx
git commit -m "style(ui): restyle Label to text-ui-sm token"
```

---

## Task 23: Restyle `Badge`

**Files:** `src/components/ui/badge.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1 w-fit whitespace-nowrap shrink-0 overflow-hidden",
    "rounded-[var(--radius-pill)] px-2.5 py-0.5 text-ui-sm",
    "shadow-inset-edge",
    "transition-[background-color,box-shadow,color]",
    "[&>svg]:size-3 [&>svg]:pointer-events-none",
    "outline-none focus-visible:shadow-focus",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--surface-muted)] text-foreground",
        primary:
          "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
        secondary:
          "bg-[color:var(--surface-muted)] text-foreground",
        info:
          "bg-[color:var(--info-soft)] text-[color:var(--info)]",
        success:
          "bg-[color:var(--success-soft)] text-[color:var(--success)]",
        warning:
          "bg-[color:var(--warning-soft)] text-[color:var(--warning)]",
        destructive:
          "bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
        knowledge:
          "bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)]",
        outline:
          "bg-transparent text-foreground shadow-ring",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/badge.tsx
git commit -m "style(ui): restyle Badge with full semantic variant set and inset-edge"
```

---

## Task 24: Restyle `Alert`

**Files:** `src/components/ui/alert.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  [
    "relative w-full rounded-[var(--radius-card-lg)] px-5 py-4 text-body-sm",
    "grid has-[>svg]:grid-cols-[20px_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-1 items-start",
    "[&>svg]:size-[18px] [&>svg]:translate-y-0.5",
    "shadow-outline-ring",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--surface)] text-foreground [&>svg]:text-muted-foreground",
        info:
          "bg-[color:var(--info-soft)] text-foreground [&>svg]:text-[color:var(--info)] border-l-[3px] border-l-[color:var(--info)] pl-4",
        warning:
          "bg-[color:var(--warning-soft)] text-foreground [&>svg]:text-[color:var(--warning)] border-l-[3px] border-l-[color:var(--warning)] pl-4",
        destructive:
          "bg-[color:var(--danger-soft)] text-[color:var(--danger)] [&>svg]:text-[color:var(--danger)] border-l-[3px] border-l-[color:var(--danger)] pl-4 *:data-[slot=alert-description]:text-[color:var(--danger)]/85",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-2 min-h-4 text-display-5",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-body-sm text-muted-foreground [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/alert.tsx
git commit -m "style(ui): restyle Alert with accent-bar variants (info/warning/destructive)"
```

---

## Task 25: Restyle `Tabs` (structural — underline style)

**Files:** `src/components/ui/tabs.tsx`.

**What this does:** Replaces the existing segmented-pill style with an underline style. TabsList has no background, just a bottom border. Active TabsTrigger gets a 2px primary underline via `::after`. This is a structural visual change but additive at the API level — call-sites do not need edits.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex items-end gap-1 w-full",
        "border-b border-[color:var(--border-subtle)]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
        "text-ui text-muted-foreground",
        "px-3 py-2.5",
        "transition-colors outline-none",
        "hover:text-foreground hover:bg-[color:var(--surface-muted)]/40 rounded-t-[6px]",
        "focus-visible:shadow-focus",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:text-foreground",
        "data-[state=active]:after:content-['']",
        "data-[state=active]:after:absolute data-[state=active]:after:left-3 data-[state=active]:after:right-3 data-[state=active]:after:-bottom-px",
        "data-[state=active]:after:h-[2px] data-[state=active]:after:bg-[color:var(--primary)] data-[state=active]:after:rounded-full",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Audit Tabs call-sites for layout dependencies**

The old segmented TabsList had a specific height (36px) and inner `bg-muted` + `p-[3px]`. The new underline TabsList is border-based. Grep for every `<Tabs` call-site:

```bash
grep -rn "from ['\"]@/components/ui/tabs['\"]" src/app src/components | cut -d: -f1 | sort -u
```

Open each listed file. Look for wrappers around `<Tabs>` or `<TabsList>` that assume a specific pixel height or fixed width. If found, note the file + line range — do NOT fix here. Fixes belong in the phase PR that owns that page. Pass the list to Task 32's "page-level issues logged for phase PRs" summary.

- [ ] **Step 3: Build + lint**
```bash
npm run build && npm run lint
```

- [ ] **Step 4: Commit**
```bash
git add src/components/ui/tabs.tsx
git commit -m "style(ui): switch Tabs to underline style

Structural visual change: TabsList is a flex with border-b; active
TabsTrigger gets a 2px primary underline via ::after. API unchanged;
call-sites do not require edits. Any layout-dependent call-site is
logged for its owning phase PR."
```

---

## Task 26: Restyle `Separator`

**Files:** `src/components/ui/separator.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-[color:var(--border-subtle)]",
        "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/separator.tsx
git commit -m "style(ui): restyle Separator to border-subtle token"
```

---

## Task 27: Restyle `ScrollArea`

**Files:** `src/components/ui/scroll-area.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-shadow outline-none focus-visible:shadow-focus"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none select-none p-px transition-colors",
        orientation === "vertical" && "h-full w-1.5",
        orientation === "horizontal" && "h-1.5 flex-col",
        className
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-[color:var(--ink-muted)]/30 hover:bg-[color:var(--ink-muted)]/50 transition-colors"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  )
}

export { ScrollArea, ScrollBar }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/scroll-area.tsx
git commit -m "style(ui): restyle ScrollArea scrollbar to 6px ink-muted thumb"
```

---

## Task 28: Restyle `Form`

**Files:** `src/components/ui/form.tsx`.

- [ ] **Step 1: Replace entire contents with:**

```tsx
"use client"

import * as React from "react"
import type * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState } = useFormContext()
  const formState = useFormState({ name: fieldContext.name })
  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-1.5", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField()

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-[color:var(--danger)]", className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-caption text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message ?? "") : props.children

  if (!body) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-caption text-[color:var(--danger)]", className)}
      {...props}
    >
      {body}
    </p>
  )
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
}
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/ui/form.tsx
git commit -m "style(ui): restyle Form — caption typography for description + error message"
```

---

## Task 29: Restyle `TopNavbar`

**Files:** `src/components/layout/top-navbar.tsx`.

- [ ] **Step 1: Replace the entire contents with:**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderKanban, BookOpenText, Plus } from "lucide-react";

const navItems = [
  { title: "Projects", href: "/dashboard", icon: FolderKanban },
  { title: "Knowledge Base", href: "/kb", icon: BookOpenText },
];

export function TopNavbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[color:var(--border-subtle)] bg-[color:var(--surface)]/90 backdrop-blur-md"
      aria-label="Primary"
    >
      <div className="flex h-16 items-center px-6 gap-5 max-w-7xl mx-auto">
        <Link
          href="/dashboard"
          className="flex items-center min-w-fit outline-none rounded-[var(--radius-sm2)] focus-visible:shadow-focus"
          aria-label="HPB AI home"
        >
          <img src="/hpb-logo.png" alt="HPB" className="h-10 w-auto object-contain" />
        </Link>

        <div className="h-7 w-px bg-[color:var(--border)]" />

        <nav className="flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm2)]",
                  "text-ui transition-colors outline-none",
                  "focus-visible:shadow-focus",
                  isActive
                    ? "bg-[color:var(--canvas)] text-foreground shadow-inset-edge"
                    : "text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)]/60"
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="default">
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + browser check**
```bash
npm run build && npm run lint
npm run dev
# Open http://localhost:3000/dashboard — verify active nav = canvas inset-edge pill, New Project = ink pill button.
# Stop dev.
```

- [ ] **Step 3: Commit**
```bash
git add src/components/layout/top-navbar.tsx
git commit -m "style(layout): restyle TopNavbar — canvas active pill, Button-primitive CTA, focus rings"
```

---

## Task 30: Create `WorkspaceFrame` primitive

**Files:** `src/components/layout/workspace-frame.tsx`.

- [ ] **Step 1: Create `src/components/layout/workspace-frame.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "live" | "platform" | "review"

const columns: Record<Variant, string> = {
  live: "grid-cols-[260px_1fr_400px]",
  platform: "grid-cols-[280px_1fr_320px]",
  review: "grid-cols-[280px_1fr]",
}

type Props = {
  variant: Variant
  leftRail?: React.ReactNode
  rightRail?: React.ReactNode
  children: React.ReactNode
  className?: string
}

function WorkspaceFrame({
  variant,
  leftRail,
  rightRail,
  children,
  className,
}: Props) {
  const hasRight = variant !== "review" && rightRail
  const gridCols = hasRight ? columns[variant] : "grid-cols-[280px_1fr]"

  return (
    <div
      data-slot="workspace-frame"
      className={cn(
        "grid flex-1 min-h-0 w-full",
        gridCols,
        "bg-[color:var(--canvas)]",
        className
      )}
    >
      {leftRail && (
        <aside
          data-slot="workspace-rail-left"
          className="bg-[color:var(--surface)] border-r border-[color:var(--border-subtle)] flex flex-col"
        >
          {leftRail}
        </aside>
      )}
      <main
        data-slot="workspace-main"
        className="overflow-hidden px-10 pt-8 pb-18"
      >
        {children}
      </main>
      {hasRight && (
        <aside
          data-slot="workspace-rail-right"
          className="bg-[color:var(--surface)] border-l border-[color:var(--border-subtle)] flex flex-col"
        >
          {rightRail}
        </aside>
      )}
    </div>
  )
}

export { WorkspaceFrame }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/layout/workspace-frame.tsx
git commit -m "feat(layout): add WorkspaceFrame primitive (live/platform/review column variants)"
```

---

## Task 31: Create rail primitives (`RailHeader`, `RailSection`, `MetaRow`, `JumpItem`)

**Files:**
- `src/components/layout/rail-header.tsx`
- `src/components/layout/rail-section.tsx`
- `src/components/layout/meta-row.tsx`
- `src/components/layout/jump-item.tsx`

- [ ] **Step 1: Create `src/components/layout/rail-header.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

function RailHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rail-header"
      className={cn(
        "flex flex-col gap-3 px-[22px] pt-[22px] pb-[18px]",
        "border-b border-[color:var(--border-subtle)]",
        className
      )}
      {...props}
    />
  )
}

export { RailHeader }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 2: Create `src/components/layout/rail-section.tsx`:**

```tsx
import * as React from "react"
import { Eyebrow } from "@/components/ui/eyebrow"
import { cn } from "@/lib/utils"

type Props = {
  title?: React.ReactNode
  last?: boolean
  className?: string
  children: React.ReactNode
}

function RailSection({ title, last, className, children }: Props) {
  return (
    <div
      data-slot="rail-section"
      className={cn(
        "px-5 py-[18px]",
        !last && "border-b border-[color:var(--border-subtle)]",
        className
      )}
    >
      {title && <div className="mb-2.5"><Eyebrow>{title}</Eyebrow></div>}
      {children}
    </div>
  )
}

export { RailSection }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 3: Create `src/components/layout/meta-row.tsx`:**

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  k: React.ReactNode
  v: React.ReactNode
  className?: string
}

function MetaRow({ k, v, className }: Props) {
  return (
    <div
      data-slot="meta-row"
      className={cn(
        "flex items-center justify-between gap-3 py-1.5 text-body-sm",
        className
      )}
    >
      <span className="text-muted-foreground">{k}</span>
      <span className="text-ui-sm text-foreground">{v}</span>
    </div>
  )
}

export { MetaRow }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 4: Create `src/components/layout/jump-item.tsx`:**

```tsx
"use client"

import * as React from "react"
import { Mono } from "@/components/ui/mono"
import { cn } from "@/lib/utils"

type Props = {
  label: React.ReactNode
  count?: number | string
  active?: boolean
  onClick?: () => void
  className?: string
}

function JumpItem({ label, count, active, onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? "true" : undefined}
      data-slot="jump-item"
      className={cn(
        "flex items-center justify-between w-full text-left",
        "px-2.5 py-2 -ml-2.5 rounded-[var(--radius-sm2)]",
        "text-body-sm transition-colors outline-none",
        "focus-visible:shadow-focus",
        active
          ? "bg-[color:var(--canvas)] text-foreground font-medium shadow-inset-edge"
          : "bg-transparent text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <span>{label}</span>
      {count != null && <Mono>{count}</Mono>}
    </button>
  )
}

export { JumpItem }
// Created by Swapnil Bapat © 2026
```

- [ ] **Step 5: Build + lint + commit**
```bash
npm run build && npm run lint
git add src/components/layout/rail-header.tsx src/components/layout/rail-section.tsx src/components/layout/meta-row.tsx src/components/layout/jump-item.tsx
git commit -m "feat(layout): add RailHeader, RailSection, MetaRow, JumpItem rail primitives

Building blocks for WorkspaceFrame rails. RailSection uses
Eyebrow typography; JumpItem uses Mono for count suffix."
```

---

## Task 32: Final verification

- [ ] **Step 1: Clean build**
```bash
npm run build
```
Expected: exits 0, no TS or CSS errors.

- [ ] **Step 2: Lint**
```bash
npm run lint
```
Expected: no new errors vs. `main`.

- [ ] **Step 3: Grep for remaining hazards inside files we modified**
```bash
# From repo root:
grep -n "bg-white" src/app/layout.tsx src/components/ui/*.tsx src/components/layout/*.tsx || echo "OK no bg-white"
grep -nE "#([0-9a-f]{3}|[0-9a-f]{6})" src/app/layout.tsx src/components/ui/*.tsx src/components/layout/*.tsx || echo "OK no hex literals"
grep -nE "(shadow-xs|shadow-sm|shadow-md|shadow-lg)" src/components/ui/*.tsx src/components/layout/*.tsx || echo "OK no Tailwind shadow defaults"
grep -nE "dark:" src/components/ui/*.tsx src/components/layout/*.tsx || echo "OK no dark: classes"
grep -nE "rounded-(md|lg|xl|2xl|3xl)" src/components/ui/*.tsx src/components/layout/*.tsx || echo "OK no generic radius"
```
Expected: each grep says "OK" or returns only intentional matches (e.g. `rounded-md` on DropdownMenu content is acceptable if intentional — inspect each hit).

- [ ] **Step 4: Browser walkthrough**
```bash
npm run dev
```
Open each route and confirm (a) it loads, (b) no console errors, (c) primitives render with amber accent + warm canvas. Do NOT fix page-level typography/layout — that is PR 2–5 work. Gate is "nothing broken," not "nothing ugly."

Routes:
1. `/login` — form renders (still on old classes; OK).
2. `/dashboard` — cards render; "New Project" pill is ink bg.
3. `/kb` — cards render.
4. `/settings` — form renders.
5. `/privacy` + `/terms` — prose renders.
6. `/projects/new` + `/projects/new/guide` — forms render.
7. `/projects/[projectId]` — tabs render in underline style (structural change).
8. `/projects/[projectId]/kb` — cards render.
9. `/projects/[projectId]/sub/new` — form renders.
10. Any `/sub/[subProjectId]` route — loads; tabs underline style.

Record any pages that crash or where a primitive visibly fails to render (dialog doesn't open, dropdown doesn't open, button is missing). **Fix in this PR before marking task complete.** All other visual awkwardness is expected and deferred.

Stop dev.

- [ ] **Step 5: Summarise**

Post a one-paragraph summary to the user listing:
- Number of tasks completed / total (32).
- Which greps returned intentional matches that were reviewed.
- Any crashes encountered and how they were resolved.
- Any page-level issues logged for phase PRs.
- Confirmation: `npm run build` + `npm run lint` are clean.

---

## Self-Review (author)

**Spec coverage (§ of spec → task):**
- §4 tokens + §5 typography + §6 shadows + §4.9 strip dark → Task 2.
- Sonner install → Task 1.
- Layout.tsx (Toaster, Inter weights, canvas bg, footer) → Task 3.
- §7.2 generic primitives (Eyebrow/Mono/Kbd/Spinner/Skeletons/BackLink/PageHeader/PageBar/EmptyState/ErrorState) → Tasks 4–10.
- §8 state system app-wide (not-found + error) → Task 11.
- §7.1 shadcn primitive restyles (Button/Card/Dialog/AlertDialog/DropdownMenu/Select/Tooltip/Input/Textarea/Checkbox/Slider/Label/Badge/Alert/Tabs/Separator/ScrollArea/Form) → Tasks 12–28.
- TopNavbar restyle + Button-primitive CTA → Task 29.
- §7.3 workspace primitives (WorkspaceFrame/RailHeader/RailSection/MetaRow/JumpItem) → Tasks 30–31.
- QA gate → Task 32.

**Placeholder scan:** Tasks 15–28 use a compact format because each primitive is a straightforward token swap. The format is "take v1 of this plan as the per-primitive code base, apply 5 specific swaps." That's not a placeholder — it's a precise delta, and the swaps are exact. If the engineer prefers full replacement code per primitive, it can be generated from spec §7.1 + the token definitions in Task 2 mechanically.

**Type / name consistency:** every CSS variable referenced (`--primary`, `--primary-hover`, `--primary-fg`, `--primary-soft`, `--primary-underline`, `--canvas`, `--surface`, `--surface-muted`, `--surface-stone`, `--ink`, `--ink-secondary`, `--ink-muted`, `--border`, `--border-subtle`, `--border-strong`, `--radius`, `--radius-pill`, `--radius-chip`, `--radius-sm2`, `--radius-md2`, `--radius-card`, `--radius-card-lg`, `--radius-chat`, `--radius-panel`, `--shadow-*`, persona tokens, category tokens, semantic tokens) is defined in Task 2. Variant names and component exports match the current files. No downstream page call-site needs editing in this PR.

**Scope check:** One PR's worth of work. Foundation only. Page-level adoption deferred to PR 2–5.
