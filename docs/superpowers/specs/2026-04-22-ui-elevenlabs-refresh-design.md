# UI Refresh — ElevenLabs-Inspired Refinement (Light, Warm, Green-Accented)

**Status:** Design approved — ready for implementation plan
**Date:** 2026-04-22
**Branch:** `ui-upgrade-elevenlabs-style`
**Reference:** `DESIGN-elevenlabs.md` (root of repo)

---

## 1. Goal & Non-Goals

### Goal
Refresh the UI of the HPB-AI research platform to a clean, refined, "premium product" visual language — closely following `DESIGN-elevenlabs.md` — while preserving the existing green brand accent. Every UI element (pages, sub-pages, overlays, popups, bars, breadcrumbs, navs, buttons) is considered. Zero functional regression.

### Success criteria
- A global design lead can review and judge the result as deliberate, systemic, and bespoke.
- Every route in the app is restyled. Nothing is missed.
- Existing functionality, routes, forms, API calls, data flow are untouched.
- The restyle ships as a foundation PR + a series of phase PRs, each independently merge-safe.

### Non-goals
- No new features, routes, or business logic.
- No API, Prisma schema, or data-fetching changes.
- No migration away from shadcn / Radix / Tailwind v4.
- No new dependencies beyond what already exists (except one tiny inline `Kbd` primitive).
- No toast / popover / sheet / command-palette systems added — flagged as optional follow-up.
- No mobile redesign beyond existing breakpoints; the current "mobile disclaimer" overlay pattern stays.
- No dark mode. Dark tokens are stripped. (Can be reintroduced later as its own project.)

---

## 2. Strategic Decisions (Locked)

| # | Decision | Choice |
|---|----------|--------|
| Q1 | Color direction | **B — Warm + Green Accent.** ElevenLabs base (whites, warm stone, black) with the green as a recognised accent on CTAs, active states, focus rings, status pills, and brand mark. |
| Q2 | Display typography | **A — Inter ExtraLight (weight 200/300).** No new fonts. Captures the "whisper-thin" display quality using lighter weights of the currently loaded Inter. |
| Q3 | Rollout | **Hybrid.** PR 1 foundation (tokens, typography, primitives, TopNavbar). Then phased page PRs (PR 2–5) by surface area. |
| Q4 | Dark mode | **B — Strip dark tokens.** Light-only commitment. Simplifies CSS; can be reintroduced as a later project. |

---

## 3. Architecture & Approach

The codebase is already **Tailwind v4 + CSS-variable-driven + shadcn primitives**. The cleanest migration path is **token-first**:

1. Rewrite `src/app/globals.css` with the new token system (colors, shadows, radii, type tokens).
2. Update class defaults in the 18 shadcn UI primitives (`src/components/ui/*`) and the `TopNavbar`.
3. Page-level utility strings (`text-2xl font-semibold`, etc.) are touched **only when the new token defaults cause a page to read wrong** — not globally rewritten. This keeps per-page diffs small and review-friendly.
4. Public component APIs (props, variant names) do not change. Existing call-sites across the 27 routes keep working.

---

## 4. Design Token System

All in `src/app/globals.css`, Tailwind v4 `@theme` block, OKLCH color space.

### 4.1 Surfaces (near-white, warm undertones)
```css
--background:      oklch(1 0 0);              /* pure white */
--surface:         oklch(0.985 0.003 75);     /* warm near-white #f6f5f3 */
--surface-muted:   oklch(0.97 0.005 70);      /* #f5f2ef — warm stone */
--surface-subtle:  oklch(0.985 0 0);          /* #f6f6f6 */
```

### 4.2 Ink (warm, not cool)
```css
--foreground:        oklch(0.145 0 0);         /* near-black #0c0c0c */
--muted-foreground:  oklch(0.47 0.01 70);      /* warm dark-gray #6f6a62 */
--subtle-foreground: oklch(0.56 0.012 68);     /* warm gray #777169 */
```

### 4.3 Primary — the green accent
Shifted warmer to complement warm stone.
```css
--primary:            oklch(0.48 0.13 148);             /* refined forest green ~#2f8a57 */
--primary-hover:      oklch(0.43 0.13 148);
--primary-foreground: oklch(0.99 0.005 145);            /* near-white */
--primary-subtle:     oklch(0.48 0.13 148 / 0.09);      /* 9% overlay for badges, active states */
--ring:               oklch(0.48 0.13 148 / 0.45);      /* focus ring base */
```

### 4.4 Borders (whisper-level)
```css
--border:          oklch(0.145 0 0 / 0.075);
--border-strong:   oklch(0.145 0 0 / 0.12);
--border-subtle:   oklch(0.145 0 0 / 0.05);
```

### 4.5 Semantic (retained, warmed slightly)
```css
--info:       oklch(0.55 0.14 245);
--knowledge:  oklch(0.53 0.14 298);
--danger:     oklch(0.57 0.17 27);    /* warm red for destructive affordances */
```

### 4.6 Radii
Keep existing `--radius` calc system, add explicit tokens.
```css
--radius:          0.625rem;   /* 10px — feeds sm/md/lg/xl via calc */
--radius-pill:     9999px;
--radius-card:     1rem;       /* 16px */
--radius-card-lg:  1.25rem;    /* 20px */
--radius-panel:    1.5rem;     /* 24px */
```

### 4.7 Dark tokens
All `.dark { ... }` declarations in `globals.css` removed.

---

## 5. Typography

### 5.1 Font loading
`src/app/layout.tsx` — keep Inter as only font. Expand weights loaded:
```ts
Inter({ subsets: ['latin'], weight: ['200','300','400','500','600','700'], variable: '--font-inter' })
```
No new font files, no new network requests.

### 5.2 Type scale
Defined as utility classes in `globals.css` `@theme`.

| Role | Size | Weight | Line | Tracking | Used on |
|------|------|--------|------|----------|---------|
| `display-hero` | 48px | 200 | 1.08 | -0.96px | Landing/dashboard H1 |
| `display` | 36px | 200 | 1.12 | -0.6px | Section hero, project detail H1 |
| `display-sm` | 28px | 300 | 1.18 | -0.3px | Sub-page H1, card titles |
| `display-xs` | 22px | 300 | 1.22 | -0.2px | Panel headers |
| `body-lg` | 18px | 400 | 1.55 | +0.18px | Intros, lead text |
| `body` | 15px | 400 | 1.55 | +0.15px | Default body |
| `body-sm` | 14px | 400 | 1.5 | +0.14px | Dense reading |
| `ui` | 15px | 500 | 1.4 | +0.15px | Nav, tabs, buttons |
| `ui-sm` | 13px | 500 | 1.35 | +0.13px | Dense UI, chips |
| `label` | 11px | 600 | 1.1 | +0.7px UPPER | Eyebrows, section labels |
| `caption` | 12px | 500 | 1.35 | +0.12px | Metadata |
| `mono` | 13px | 400 | 1.75 | 0 | Code, IDs (ui-monospace fallback stack) |

### 5.3 Principles
- Light-weight display (200 at hero, 300 at smaller sizes) carries the "whisper-thin" signature.
- Positive letter-spacing on body (+0.14 to +0.18) — tight on display, airy on body.
- The uppercase `label` token replaces ElevenLabs' WaldenburgFH uppercase button. Used **only** as eyebrows, never as a button style.
- Global `body { }` default: `font-family: var(--font-inter); font-size: 15px; line-height: 1.55; letter-spacing: 0.15px; color: var(--foreground)`.

---

## 6. Elevation & Shadows

### 6.1 Shadow tokens (`globals.css` `@theme`)
```css
--shadow-inset-edge:  inset 0 0 0 0.5px rgb(0 0 0 / 0.075);
--shadow-ring:        0 0 0 1px rgb(0 0 0 / 0.06);
--shadow-lift-sm:     0 1px 2px rgb(0 0 0 / 0.04), 0 2px 4px rgb(0 0 0 / 0.04);
--shadow-lift:        0 4px 8px rgb(0 0 0 / 0.04);
--shadow-card:        var(--shadow-ring), var(--shadow-lift-sm);
--shadow-button:      0 0 1px rgb(0 0 0 / 0.4), 0 4px 4px rgb(0 0 0 / 0.04);
--shadow-warm:        0 6px 16px rgb(78 50 23 / 0.04), var(--shadow-ring);
--shadow-focus:       0 0 0 3px oklch(0.48 0.13 148 / 0.35);
```

### 6.2 Elevation levels

| Level | Token | Surfaces |
|-------|-------|----------|
| 0 — flat | none | page bg, text blocks |
| 0.5 — inset edge | `--shadow-inset-edge` | idle inputs, subtle dividers |
| 1 — outline ring | `--shadow-card` | Card, Dialog, DropdownMenu, Select popover, Tooltip, Alert |
| 2 — button lift | `--shadow-button` | secondary/outline Button, sticky TopNavbar edge |
| 3 — warm lift | `--shadow-warm` | featured CTA (warm-stone pill), empty-state hero panels |
| Focus | `--shadow-focus` | keyboard focus on all interactive primitives |

### 6.3 Rules (non-negotiable)
1. Never exceed **0.1 opacity** on a shadow component. No Tailwind `shadow-lg`/`shadow-xl` defaults anywhere.
2. Every elevated surface includes the **ring component** — the 1px outline-ring defines the edge, not the drop shadow alone.
3. Hover lift: `box-shadow` transition 180ms ease-out. Shadow escalates one level. **No `translateY`** — too busy for a research tool.

### 6.4 Radius application
- Buttons → `--radius-pill`
- Inputs, Select triggers → `--radius` (10px)
- Cards, Dialog → `--radius-card` (16px)
- Featured panels, code blocks → `--radius-card-lg` (20px)
- Section containers, large modals → `--radius-panel` (24px)

### 6.5 Warm-stone featured button (signature)
- Background: `color-mix(in oklab, var(--surface-muted) 85%, transparent)`
- Text: `var(--foreground)`
- Shadow: `var(--shadow-warm)`
- Radius: `30px`
- Padding: `12px 20px 12px 14px` (asymmetric)
- **Scope:** hero CTAs only (dashboard "New project", empty-state primary action). Not a general-purpose variant.

---

## 7. Component Restyle Matrix

All 18 shadcn primitives + `TopNavbar`. **Public APIs and variant names unchanged.**

| Component | File | Changes |
|---|---|---|
| Button | `src/components/ui/button.tsx` | Radius → `--radius-pill`. Variant respec: `default` = `--primary` + `--shadow-button`, hover `--primary-hover`. `secondary` = white pill + `--shadow-button`. `outline` = transparent + `--shadow-ring`. `ghost` = hover `--surface-muted/50`. `destructive` = `--danger`. **New variant `featured`** = warm-stone CTA (radius 30px, asymmetric padding, `--shadow-warm`). Sizes tightened: `sm` 8/14, `md` 10/18, `lg` 12/24. Text `ui` (15/500). |
| Card | `src/components/ui/card.tsx` | Radius `--radius-card`. `--shadow-card` default; hover escalates to `--shadow-card, --shadow-lift`. Padding: Header `1.5rem 1.5rem 0.75rem`, Content `1.5rem`, Footer `1rem 1.5rem 1.5rem`. Title → `display-xs`. Description → `body-sm --muted-foreground`. |
| Dialog | `src/components/ui/dialog.tsx` | Overlay `bg-black/30 backdrop-blur-[2px]`. Content radius `--radius-panel`, `--shadow-card, --shadow-lift`, padding `1.75rem`. Title → `display-sm`. Description → `body --muted-foreground`. Close X 14px `--subtle-foreground`, hover `--foreground`. |
| AlertDialog | `src/components/ui/alert-dialog.tsx` | Matches Dialog; action button uses `default` variant, cancel uses `outline`. Destructive confirms swap to `destructive`. |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` | Popover radius `--radius-card`, `--shadow-card`, `p-1.5`. Items radius 8px, `py-2 px-2.5`, `ui-sm`, hover `--surface-muted`, active `--primary-subtle + --primary` text. Checkmark `--primary`. SubTrigger chevron `--subtle-foreground`. |
| Select | `src/components/ui/select.tsx` | Trigger matches Input. Popover matches DropdownMenu. Chevron `--subtle-foreground`. |
| Tooltip | `src/components/ui/tooltip.tsx` | Bg `--foreground`, text `--primary-foreground` at `caption`, radius 8px, `py-1.5 px-2.5`, `--shadow-ring`. Arrow removed. |
| Input | `src/components/ui/input.tsx` | Bg `--background`. Idle `--shadow-inset-edge`. Focus `--shadow-focus`. Radius `--radius`. Padding `0.625rem 0.875rem`. `body` type. Placeholder `--subtle-foreground`. |
| Textarea | `src/components/ui/textarea.tsx` | Matches Input. |
| Checkbox | `src/components/ui/checkbox.tsx` | 16px, radius 4px, unchecked `--shadow-inset-edge`. Checked → `--primary` fill + white check. Focus `--shadow-focus`. |
| Slider | `src/components/ui/slider.tsx` | Track 4px `--surface-muted`. Range `--primary`. Thumb 16px white circle + `--shadow-button`. Focus `--shadow-focus`. |
| Label | `src/components/ui/label.tsx` | `ui-sm` default. Optional eyebrow variant uses `label` token (11/600 UPPER +0.7px). |
| Badge | `src/components/ui/badge.tsx` | Pill. Default `--surface-muted + --foreground`. Variants: `primary` (`--primary-subtle + --primary`), `info`, `knowledge`, `danger`, `outline` (transparent + `--shadow-ring`). `ui-sm`, `py-0.5 px-2.5`. |
| Alert | `src/components/ui/alert.tsx` | Radius `--radius-card`. Default `--surface + --shadow-ring`. Title `display-xs`. Description `body-sm --muted-foreground`. Variants `info`/`warning`/`danger` = 3px left accent bar + tinted bg at 6%. Icon 18px in accent color. |
| Tabs | `src/components/ui/tabs.tsx` | **Change to underline style.** TabsList no bg, `border-b --border-subtle`. TabsTrigger `ui`, `py-2.5`, idle `--subtle-foreground`, active `--foreground` + 2px `--primary` underline. Hover bg `--surface-muted/40`. |
| Separator | `src/components/ui/separator.tsx` | `--border-subtle`, 1px. |
| ScrollArea | `src/components/ui/scroll-area.tsx` | Thumb `--subtle-foreground/30`, 6px, hover `/50`, pill radius. Track transparent. |
| Form | `src/components/ui/form.tsx` | FormItem gap 6px. FormLabel uses new Label style. FormMessage `caption --danger`. |
| TopNavbar | `src/components/top-navbar.tsx` | Sticky white, `border-b --border-subtle`, `--shadow-ring` at scroll. Logo lockup Inter 18/500 tracking -0.2px. Nav links `ui`, idle `--muted-foreground`, hover `--foreground`, active `--primary` + subtle underline. "New project" = Button `default`. Right-side user/settings DropdownMenu. <1024px collapse to Dialog-based drawer (no Sheet dep added). |
| **Kbd (new)** | `src/components/ui/kbd.tsx` | Inline element for keyboard shortcuts. 1px `--shadow-ring`, radius 4px, mono 11px. Used in empty states / menus. Optional, low-risk addition. |

### 7.1 Not installed, not adding
Sonner/Toast, Popover, Sheet, Command Palette. Flagged as optional follow-up projects.

---

## 8. Page Surface Phases (Rollout)

### PR 1 — Foundation
*(No user-visible change until PR 2 lands.)*
- Rewrite `src/app/globals.css` (tokens, typography scale, shadow tokens, strip dark vars).
- Update `src/app/layout.tsx` Inter weight list.
- Restyle all 18 primitives in `src/components/ui/*`.
- Restyle `TopNavbar`.
- Add `Kbd` primitive.
- **Verify:** `npm run build`, spot-check each primitive via existing pages; fix any render breakage in-PR.

### PR 2 — Entry & shell (7 routes)
- `/`, `/login`, `/dashboard`, `/kb`, `/settings`, `/privacy`, `/terms`.
- Dashboard: `featured` warm-stone CTA on "New project" hero. Empty state uses `display-hero`.
- `/kb`: card grid, `display-sm` titles, `caption` metadata.
- `/settings`: form fields + section labels rebuilt to eyebrow pattern.
- `/login`: centered card, pill CTA, quiet border.
- `/privacy` + `/terms`: long-form reading treatment — max-width 720px, `body-lg` lead paragraph.

### PR 3 — Project core (6 routes)
- `/projects/new`, `/projects/new/guide`, `/projects/[projectId]`, `/projects/[projectId]/kb`, `/projects/[projectId]/guide`, `/projects/[projectId]/dojo`.
- Wizard: quiet underline progress indicator (not segmented pills).
- Project detail: two-column layout with sub-project card grid, sticky summary panel.
- Dojo: functional UX preserved; chrome tightened — controls become ghost/featured pair, status chips use new Badge variants.

### PR 4 — Sub-project shell (3 routes)
- `/projects/[projectId]/sub/new`, `/sub/[subProjectId]` (home), `/sub/[subProjectId]/edit`.
- Sub-project home: tool-launcher grid (one card per tool — Insights, Simulate, HMW, Map, Ideation, Archetypes). Each card gets a single-color semantic accent (primary/info/knowledge).

### PR 5 — Sub-project tools (11 routes)
- `/insights`, `/simulate`, `/hmw`, `/map/new`, `/map/[sessionId]`, `/ideation/new`, `/ideation/[sessionId]`, `/archetypes/new`, `/archetypes/[sessionId]`, `/simulations/[id]`.
- Density note: rows/list items tighten to 40–44px minimum touch height (vs ElevenLabs' 56px+ panels). Typography unchanged; only padding compresses. Research tools need scannability.
- Empathy maps and ideation canvases: existing layout logic preserved; chrome (toolbars, panels, chips) restyled.

### Per-PR QA gate (non-negotiable)
- `npm run dev` and `npm run build` both clean.
- Walk every route in the PR in a browser. Use each page's primary function end-to-end.
- Diff screenshots before/after on visually-subtle surfaces.
- No PR merges with: failing build, broken form submission, broken data load, visibly regressed interaction.

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Token rewrite breaks color tokens referenced by existing class strings not in scope of this spec. | Foundation PR preserves every CSS variable name currently in use (`--primary`, `--background`, `--foreground`, etc.); only values change. New tokens are additive. |
| `--shadow-focus` conflicts with Tailwind's default focus-visible ring on some primitives. | Primitive-level audit: every interactive primitive gets an explicit focus style using `--shadow-focus`, and default Tailwind ring classes are removed from its variants. |
| `Tabs` underline change is a structural visual change that breaks existing page layouts relying on the segmented look. | Audit every `<Tabs>` call-site in PR 1 Verify step. Any page that layouts around the old segmented width is patched in that page's phase PR. |
| Strip-dark CSS leaves residual `.dark` class toggles in component code. | PR 1 greps for `.dark` usage in `src/components/**` and removes any hardcoded dark-class branches. |
| Mobile <1024px nav breakage when swapping to Dialog-based drawer. | PR 1 tests existing mobile disclaimer overlay still fires; drawer behavior tested independently on `/dashboard` and `/kb`. |
| "Warm stone featured" CTA applied outside scope → visual noise. | Spec limits it to hero + empty-state primary actions only; PRs 2/3 reviewed against this rule. |
| Page-level utility class strings (`text-2xl font-semibold`) look wrong after token-default shift. | Phase PRs fix per-page; foundation PR does not globally rewrite. Each page PR has a browser walk-through gate. |

---

## 10. Out-of-Scope / Deferred

- Dark mode reintroduction.
- Toast, Popover, Sheet, Command Palette primitives.
- Mobile redesign beyond existing breakpoints.
- Fraunces serif layer for marketing surfaces.
- Page-level information architecture changes (menus restructured, routes merged/split, etc.).
- Accessibility audit beyond "every interactive primitive has visible focus" — full WCAG pass is a separate project.

---

## 11. References

- `DESIGN-elevenlabs.md` — the visual reference document that seeded this spec.
- `src/app/globals.css` — current token source of truth.
- `src/components/ui/` — shadcn primitives scoped for restyle.
- `components.json` — shadcn config (retained as-is).
