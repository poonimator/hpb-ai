# UI Refresh — ElevenLabs-Inspired Refinement (Warm Stone + Amber Accent)

**Status:** Design approved — ready for implementation
**Version:** 2 (supersedes v1 — amber pivot + comprehensive inconsistency fixes absorbed)
**Date:** 2026-04-22
**Branch:** `ui-upgrade-elevenlabs-style`
**Reference material:**
- `DESIGN-elevenlabs.md` (root) — typographic/shadow language
- `claude design explorations/shared.jsx` — shared tokens and atoms (canonical source)
- `claude design explorations/platform-screens.jsx` — workspace grammar (`WorkspaceFrame`, rails, HMW, Ideation, Archetype, synthesis)
- `claude design explorations/interview simulation.jsx` — single-participant live session pattern
- `claude design explorations/focus-group-live.jsx` — multi-participant live session pattern
- `claude design explorations/session-review-v2.jsx` — post-session review pattern

---

## 1. Goal & Non-Goals

### Goal
Refresh the UI of the HPB-AI research platform to a clean, refined, "bespoke modern SaaS" visual language — ElevenLabs foundation, warm stone canvas, amber accent — exactly matching the user's hand-designed exploration JSX files. Every route is considered: pages, sub-pages, overlays, popups, bars, breadcrumbs, navs, buttons, loading/empty/error states. Zero functional regression. Replace app-wide inconsistencies (hand-rolled markup, `alert()`/`confirm()`, hex literals, random radii) with systemic tokens and primitives.

### Success criteria
- A global design lead reviews the refreshed app and judges it as deliberate, systemic, bespoke, and production-grade.
- Every route is restyled; nothing is missed. Sub-project tool screens match the exploration files visually.
- Zero `alert()` / `confirm()` calls remain. Every page has a real loading state. Every page uses `bg-background` / `bg-card` — no `bg-white` literals. Every color comes from a token.
- Refresh ships as a foundation PR + phased page PRs, each independently mergeable and functionally complete.

### Non-goals
- No new *features*, routes, or business logic.
- No API, Prisma schema, or data-fetching changes.
- No migration away from shadcn / Radix / Tailwind v4 / Next.js App Router.
- No dark mode (dark tokens stripped; can be a future project).
- No mobile redesign beyond current breakpoints (desktop-only app with a mobile disclaimer overlay).
- No toast-other-than-Sonner, no command palette, no sheet/drawer — these are deferred unless a phase PR needs them (Sonner is in-scope as of v2).
- No WCAG full pass — only "every interactive primitive has a visible focus and label"; a full a11y audit is a separate project.

---

## 2. Strategic Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| Q1 | Color direction | **Warm + Amber accent** — matches exploration files. Green was a miscall; user's existing designs all use `#b45309`. |
| Q2 | Display typography | **Inter weight 300** (not 200). Matches exploration `display` token. `letter-spacing: -0.02em`. Body Inter 400. Monospace for timecodes, counts, IDs. |
| Q3 | Rollout | Foundation PR + phased page PRs by surface. |
| Q4 | Dark mode | Strip. Light-only. |
| Q5 | Canvas | **`#f5f5f5` warm off-white** (`bgAlt`). White cards and rails float on top. |
| Q6 | Dead routes | Archive, not delete. Move `/projects/[projectId]/dojo` and `/projects/[projectId]/guide` to `archive/` at project root. |
| Q7 | Scope additions | Install Sonner + kill all `alert()`/`confirm()`. Add `loading.tsx` / `error.tsx` / `not-found.tsx` app-wide. Ship primitive family. Tokenize every color. |

---

## 3. Architecture & Approach

- **Token-first.** All visual change flows from `src/app/globals.css` rewrites + a small number of primitive default swaps. Pages generally don't need className rewrites — they pick up changes via tokens.
- **Additive primitive family.** New primitives (EmptyState, ErrorState, PageSkeleton, PageHeader, BackLink, PageBar, WorkspaceFrame, RailSection, MetaRow, and the tool-specific atoms like OpportunityCard, ChatBubble, Composer) are added alongside existing ones. Pages migrate to them in phase PRs.
- **Public APIs unchanged.** Existing shadcn primitive props and variants keep working. New variants are additive.
- **Kill noise.** alert/confirm → Sonner + AlertDialog. Hand-rolled cards/buttons → primitives. Hex strings / raw tailwind colors → tokens. Random radii → 7-value scale.
- **Phase-PRs tackle surfaces.** Foundation PR is invisible until PR 2 lands. PR 2 migrates entry/shell pages. PR 3 migrates project core. PR 4 introduces WorkspaceFrame and the sub-project shell. PR 5 migrates the sub-project tools using the exploration-file components.

---

## 4. Design Token System

All in `src/app/globals.css`, Tailwind v4 `@theme` block, OKLCH or hex. Values below are canonical; they are lifted from `claude design explorations/shared.jsx:4-49` and adapted to OKLCH where helpful.

### 4.1 Surfaces (warm stone canvas)
```css
--canvas:          oklch(0.965 0.003 70);   /* #f5f5f5 — page base, warm off-white */
--surface:         oklch(1 0 0);            /* pure white — cards, rails, panels */
--surface-muted:   oklch(0.97 0.005 70);    /* #f5f2ef — stone callouts, eyebrow pills */
--surface-stone:   oklch(0.965 0.006 70 / 0.8);  /* rgba(245,242,239,0.8) — soft pill bg */
```

### 4.2 Ink (warm grays, not cool)
```css
--ink:             oklch(0 0 0);            /* #000000 — primary ink */
--ink-secondary:   oklch(0.37 0.005 70);    /* #4e4e4e — body secondary */
--ink-muted:       oklch(0.53 0.01 68);     /* #777169 — meta, tertiary */
```

### 4.3 Primary — amber accent
```css
--primary:         oklch(0.53 0.14 60);     /* #b45309 — the signature amber */
--primary-hover:   oklch(0.48 0.14 60);
--primary-fg:      oklch(0.985 0.005 70);   /* near-white */
--primary-soft:    oklch(0.53 0.14 60 / 0.08);   /* rgba(180,83,9,0.08) */
--primary-underline: oklch(0.53 0.14 60 / 0.45); /* rgba(180,83,9,0.45) — transcript highlight */
```

### 4.4 Persona palette (categorical — only for people/themes, never semantic)
```css
--persona-1:  oklch(0.48 0.20 300);    /* #7c3aed — purple */
--persona-2:  oklch(0.56 0.12 210);    /* #0891b2 — cyan */
--persona-3:  oklch(0.53 0.14 60);     /* #b45309 — amber (overlaps primary intentionally) */
--persona-4:  oklch(0.56 0.13 85);     /* #ca8a04 — gold */
--persona-5:  oklch(0.48 0.18 345);    /* #be185d — rose */
/* plus soft variants at / 0.08 opacity for chip backgrounds */
--persona-1-soft: oklch(0.48 0.20 300 / 0.08);
--persona-2-soft: oklch(0.56 0.12 210 / 0.08);
--persona-3-soft: oklch(0.53 0.14 60 / 0.08);
--persona-4-soft: oklch(0.56 0.13 85 / 0.08);
--persona-5-soft: oklch(0.48 0.18 345 / 0.08);
```

### 4.5 Semantic — synthesis categories + status
```css
/* Comparison categories (session review) */
--cat-agreements:       oklch(0.47 0.09 180);   /* #0f766e — teal, "agreements" */
--cat-agreements-soft:  oklch(0.47 0.09 180 / 0.08);
--cat-tensions:         oklch(0.50 0.20 27);    /* #b91c1c — red, "tensions" */
--cat-tensions-soft:    oklch(0.50 0.20 27 / 0.08);
--cat-gaps:             oklch(0.52 0 0);        /* rgb(105,105,105) — neutral, "gaps" */
--cat-gaps-soft:        oklch(0.93 0 0);        /* rgb(237,237,237) */

/* Semantic status */
--success:   oklch(0.62 0.15 145);   /* green, validation */
--warning:   oklch(0.70 0.14 70);    /* amber-warning, softer */
--danger:    oklch(0.57 0.17 27);    /* red, destructive */
--info:      oklch(0.55 0.14 245);   /* blue, info */
--knowledge: oklch(0.53 0.14 298);   /* purple, KB/research */

/* Soft variants at 0.08 */
--success-soft:   oklch(0.62 0.15 145 / 0.08);
--warning-soft:   oklch(0.70 0.14 70 / 0.08);
--danger-soft:    oklch(0.57 0.17 27 / 0.08);
--info-soft:      oklch(0.55 0.14 245 / 0.08);
--knowledge-soft: oklch(0.53 0.14 298 / 0.08);

/* Severity aliases (used by guide, hmw, insights) */
--severity-high:   var(--danger);
--severity-medium: var(--warning);
--severity-low:    var(--ink-muted);
```

### 4.6 Borders
```css
--border:         oklch(0 0 0 / 0.075);   /* default inset-edge border */
--border-strong:  oklch(0 0 0 / 0.12);
--border-subtle:  oklch(0 0 0 / 0.05);    /* rail dividers, section separators */
```

### 4.7 Radii
Full scale lifted from exploration files (`shared.jsx` + `platform-screens.jsx` grep of `borderRadius`):
```css
--radius-chip:       6px;    /* tiny icon tiles, step eyebrow chips */
--radius-sm:         8px;    /* nav items, menu items, back buttons */
--radius-md:         10px;   /* inline callouts, rail jump items, comparison category pill */
--radius:            12px;   /* quote cards, insight cards, compact panels */
--radius-lg:         14px;   /* default card, transcript blocks, step cards */
--radius-xl:         16px;   /* composer, persona panel, larger cards */
--radius-2xl:        18px;   /* chat bubble body (with asymmetric tail corner of 4px) */
--radius-panel:      24px;   /* dialog, large modal */
--radius-pill:       9999px; /* buttons, pill chips, avatars, status dots */
```

### 4.8 Shadows (warm, multi-layer, sub-0.1 opacity)
Directly from `shared.jsx:30-36`:
```css
--shadow-inset-edge:   inset 0 0 0 0.5px rgb(0 0 0 / 0.075);
--shadow-ring:         0 0 0 1px rgb(0 0 0 / 0.06);
--shadow-outline-ring: 0 0 0 1px rgb(0 0 0 / 0.06), 0 1px 2px rgb(0 0 0 / 0.04), 0 2px 4px rgb(0 0 0 / 0.04);
--shadow-card:         0 0 1px rgb(0 0 0 / 0.4), 0 4px 4px rgb(0 0 0 / 0.04);
--shadow-warm-lift:    0 6px 16px rgb(78 50 23 / 0.04);
--shadow-composer:     0 0 0 1px rgb(0 0 0 / 0.06), 0 2px 6px rgb(0 0 0 / 0.04), 0 10px 24px rgb(78 50 23 / 0.04);
--shadow-focus:        0 0 0 3px oklch(0.53 0.14 60 / 0.35);  /* amber focus ring */
--shadow-amber-active: 0 0 0 2px oklch(0.53 0.14 60 / 0.18);  /* active state on highlighted quote */
```

**Non-negotiable shadow rules:**
1. No shadow component exceeds 0.1 opacity.
2. Every elevated surface includes the **ring component** — the 1px outline-ring defines the edge. Drop shadow alone looks heavy.
3. Buttons/cards don't `translateY` on hover. Shadow escalates one level; that's it.

### 4.9 Dark tokens
Stripped. `.dark { ... }` block removed from `globals.css`.

---

## 5. Typography

### 5.1 Font loading
`src/app/layout.tsx`: Inter via `next/font/google`, weights `[300, 400, 500, 600, 700]`. No new font files. Drop the hard-coded `font-sans antialiased` on `<body>` — defaults live in `globals.css`.

### 5.2 Type families (aliased as `@theme` tokens)
```css
--font-display: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
--font-body:    var(--font-inter), ui-sans-serif, system-ui, sans-serif;
--font-mono:    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

### 5.3 Type scale (utility classes under `@layer utilities`)
Values lifted directly from exploration files (`shared.jsx`, `platform-screens.jsx`, `session-review-v2.jsx`):

| Utility | Size / line / weight / tracking | Usage |
|--|--|--|
| `text-display-hero` | 48/1.08/300/-0.02em | Marketing-style hero (rare; archetype profile hero). |
| `text-display-1` | 34/1.1/300/-0.02em | Session-review hero, archetype long-form hero. |
| `text-display-2` | 28/1.15/300/-0.02em | Page H1 (dashboard, kb, settings, project detail). |
| `text-display-3` | 22/1.15/300/-0.02em | Rail section hero, card hero, tab pane H2. |
| `text-display-4` | 18/1.2/300/-0.01em | Main section title (with icon leader). |
| `text-display-5` | 16/1.15/300/-0.01em | Panel title, persona-panel name. |
| `text-body-lg` | 15/1.55/400/+0.01em | Intro paragraph. |
| `text-body` | 13.5/1.7/400/+0.01em | Primary body (exploration default). |
| `text-body-sm` | 12.5/1.55/400/+0.01em | Secondary body, meta values. |
| `text-ui` | 12.5/1.47/500/+0.01em | Button, nav link, tab label. |
| `text-ui-sm` | 11/1.33/500/+0.01em | Dense UI, dropdown item, chip. |
| `text-eyebrow` | 10.5/1.1/700/+0.14em UPPER | **Signature**. Section eyebrows, rail headers, step labels. |
| `text-caption` | 11/1.4/500/+0.01em | Metadata, timestamps, footer text. |
| `text-mono-meta` | 11/1.1/500/0em — `font-mono` | Count badges, IDs, timecodes, "STEP 01" chips. |
| `text-tag` | 9/1/700/+0.1em UPPER | Persona trait chips (`RUMINATES`, `AVOIDS`). |

### 5.4 Global defaults (inside `@layer base`)
```css
body {
  background: var(--canvas);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: 13.5px;
  line-height: 1.7;
  letter-spacing: 0.01em;
  -webkit-font-smoothing: antialiased;
}

h1 { /* text-display-1 */ }
h2 { /* text-display-3 */ }
h3 { /* text-display-4 */ }
h4 { /* text-display-5 */ }
```

### 5.5 Principles
- Light display weight (300) is non-negotiable — it IS the voice.
- Every display H1 gets `letter-spacing: -0.02em`. Body stays positive at `+0.01em`.
- The `text-eyebrow` pattern (10.5/700/0.14em uppercase ink-muted) is the signature typographic move. Use it for section eyebrows, rail-section titles, and `STEP 01`-style numbered chips. Used 15+ times across exploration files.
- Monospace (`text-mono-meta`) is reserved for numbers, IDs, timestamps, and step codes. Never for body.

---

## 6. Layout Grammar

Canonical patterns from `platform-screens.jsx` + `session-review-v2.jsx`. Encoded as a `<WorkspaceFrame>` primitive (see §7.4).

### 6.1 Canvas stack (top to bottom)
```
<TopNav />                    64px, white, border-b border-subtle
<PageBar />                   sub-header: back + breadcrumbs + action slot
                              14px vertical / 32px horizontal padding
                              white bg, border-b border-subtle
<WorkspaceFrame>              optional: left rail / main / right rail
  <Aside leftRail>            white, border-r border-subtle, variable width
  <Main>                      canvas bg, padding 32px 40px 72px
  <Aside rightRail>           white, border-l border-subtle, variable width (optional)
</WorkspaceFrame>
<Footer />                    white, border-t border-subtle, 16px 32px
```

### 6.2 Column variants
Three standard column combinations (pick by page type):
- **Live session** — `260px | 1fr | 400px`. Identity+guide rail / transcript / opportunities.
- **Platform synthesis / tool** — `280px | 1fr | 320px`. Meta+filters rail / content / context rail (optional).
- **Review / detail** — `280px | 1fr`. Meta+anchors rail / content. Used by session-review-v2 and archetype profile.

### 6.3 Main column content widths
- Prose hero (session review, archetype hero): `max-w: 820px`.
- Centered tool UI (HMW composer card): `max-w: 780px`.
- Chat transcript column: `max-w: 760px`.
- Workspace card grids, kanban, tool-launcher grids: use the full main column width.

### 6.4 Non-workspace pages
Pages that aren't tools (dashboard, KB, settings, legal, login, project home, sub-project home — except when they're a tool launcher) don't use `<WorkspaceFrame>`. They use the plain shell (TopNav + PageBar + Main + Footer) with content centered to the existing `max-w-7xl` of `layout.tsx`. Per user: "the 2/3-column layouts are for tool flows only."

### 6.5 Spacing vocabulary
Page horizontal padding: 32px. Main padding: `32px 40px 72px`. Rail section padding: `18px 20px`, with the rail hero using `22px 22px 18px`. Inter-card gaps: 10–14px. Inter-section gap: 28–36px.

### 6.6 Top-of-page chrome patterns
- **`PageBar`** — the standard sub-header. Slots: `back`, `breadcrumbs`, `action`. Height 56px.
- **`SessionHeader`** — alternate header for in-session screens. Back + divider + teal-square avatar + title+subtitle on left, right: status Badge + destructive "End Session" pill. Used when a `PageBar` + crumbs is inappropriate (live session).

### 6.7 Footer
App-wide footer on the main shell: `padding: 16px 32px`, white, `border-t: var(--border-subtle)`. Left: "Version 1.0.0. Aleph Pte Ltd." at `text-caption text-ink-muted`. Right: `Terms of Use` + `Privacy Statement` links at `text-caption text-ink-muted`. This replaces the current footer, which uses `text-xs` utilities and different separators.

---

## 7. Primitive Matrix

### 7.1 shadcn primitives (restyle defaults; APIs unchanged)

| Component | Change summary |
|---|---|
| `Button` | Radius `--radius-pill`. Variants: `default` (ink bg + `--shadow-card`), `secondary` (white pill + `--shadow-card`), `outline` (transparent + `--shadow-outline-ring`), `ghost` (transparent + hover `--surface-muted`), `destructive` (transparent + red ink + ring), `link`, **new `featured`** (`--surface-stone` bg + 30px radius + `--shadow-warm-lift`, asymmetric padding `12px 20px 12px 14px`). Sizes `sm/default/lg` = 28/36/44 height. Text `text-ui`. Focus uses `--shadow-focus`. |
| `Card` | Radius `--radius-lg`. Default shadow `--shadow-outline-ring`. No `border`. Header padding `1.5rem 1.5rem 0.75rem`, content `1.5rem`, footer `1rem 1.5rem 1.5rem`. Title → `text-display-5`. Description → `text-body-sm text-ink-muted`. |
| `Dialog` | Overlay `bg-black/30 backdrop-blur-[2px]`. Content `rounded-[var(--radius-panel)]` (24px), `shadow-outline-ring + shadow-warm-lift`, padding `1.75rem`, `max-w-lg`. Title `text-display-3`. Description `text-body text-ink-muted`. Close X: 14px icon, `text-ink-muted` hover `text-ink`, round ghost. |
| `AlertDialog` | Matches Dialog. Action = Button `default`. Cancel = Button `outline`. Destructive confirms use Button `destructive`. |
| `DropdownMenu` | Popover `rounded-[var(--radius-lg)]`, `--shadow-outline-ring`, `p-1.5`. Items `rounded-[8px]`, `py-2 px-2.5`, `text-ui-sm`. Hover `bg-surface-muted`. Active `bg-primary-soft` + `text-primary`. Checkmark `text-primary`. Label slots become `text-eyebrow`. |
| `Select` | Trigger matches Input; popover matches DropdownMenu. |
| `Tooltip` | Bg `--ink` + text `--primary-fg` at `text-caption`. Radius 8px, `py-1.5 px-2.5`, `--shadow-ring`. No arrow. |
| `Input` / `Textarea` | Radius `--radius-md` (10px). Bg `--surface`, `--shadow-inset-edge`, focus `--shadow-focus`. Padding `10px 14px`. `text-body`. Placeholder `text-ink-muted`. Invalid: red ring + caption message. |
| `Checkbox` | 16px, radius 4px, `--shadow-inset-edge` unchecked, `--primary` fill checked. `--shadow-focus` on focus. |
| `Slider` | Track 4px, `--surface-muted`. Range `--primary`. Thumb 16px white + `--shadow-card`. |
| `Label` | `text-ui-sm`, default color `--ink`. New optional variant `eyebrow` uses `text-eyebrow`. |
| `Badge` | Pill. Variants: `default` (stone bg), `primary` (`--primary-soft` + `--primary`), `info`, `success`, `warning`, `danger`, `knowledge`, `outline`. All `text-ui-sm`, `py-0.5 px-2.5`, `--shadow-inset-edge`. |
| `Alert` | Radius `--radius-lg`, `--shadow-outline-ring`. Variants `default` / `info` / `warning` / `destructive`, all with 3px left accent bar + 6% accent-tinted bg. Title `text-display-5`, description `text-body-sm text-ink-muted`. |
| `Tabs` | **Underline style** (not segmented). TabsList: flex, `border-b border-subtle`, no bg. TabsTrigger: `text-ui`, `py-2.5 px-3`, idle `text-ink-muted`, hover `bg-surface-muted/40`, active adds `text-ink` + 2px `--primary` underline via `::after`. |
| `Separator` | `--border-subtle`, 1px. |
| `ScrollArea` | Scrollbar thumb `--ink-muted/30`, hover `/50`, 6px, pill. Track transparent. |
| `Form` | FormItem gap 6px. FormMessage `text-caption text-danger`. FormDescription `text-caption text-ink-muted`. |
| `TopNavbar` | Sticky, white, `border-b border-subtle`. Height 64px. Logo lockup: logo img + `28px` vertical 1px divider + 3-line stacked caps brand block (Inter 8/600/+0.08em). Nav links `text-ui`: idle `text-ink-secondary`, hover `text-ink`, active `bg-canvas` + `text-ink`. Right: `PillGhost` "Search" + `Button` "New Project". Mobile hamburger via Dialog-based drawer. |

### 7.2 New generic primitives (FOUNDATION PR)

| Component | File | Purpose |
|---|---|---|
| `PageHeader` | `src/components/layout/page-header.tsx` | Standard page title block. Eyebrow + title + optional description + optional action slot. Used on non-tool pages. |
| `PageBar` | `src/components/layout/page-bar.tsx` | Sticky sub-header with `back`, `breadcrumbs`, `action` slots. Matches `platform-screens.jsx:10-34` pattern. |
| `BackLink` | `src/components/layout/back-link.tsx` | 28px ghost with ChevronLeft, 12px ink-muted label, used in PageBar and on legal pages. |
| `EmptyState` | `src/components/ui/empty-state.tsx` | Props: `icon`, `title`, `description`, `action`. Renders as a centered block inside a `<Card>` with the icon in a 40×40 rounded stone tile. |
| `ErrorState` | `src/components/ui/error-state.tsx` | Props: `title`, `description`, `action` (retry). Red-tinted accent left bar variant of `<Alert>`. |
| `PageSkeleton` | `src/components/ui/page-skeleton.tsx` | Default full-page loading skeleton — page title shimmer + 3 card shimmers. Used by all `loading.tsx`. |
| `CardSkeleton` | `src/components/ui/card-skeleton.tsx` | Inline variant for per-card async content. |
| `CenteredSpinner` | `src/components/ui/centered-spinner.tsx` | Lucide `Loader2` centered in its parent. Used for transient in-page loads. Standardized size (20px) and color (`--ink-muted`). |
| `Kbd` | `src/components/ui/kbd.tsx` | Inline keyboard shortcut hint. Mono, ring shadow. |
| `Eyebrow` | `src/components/ui/eyebrow.tsx` | Wraps the `text-eyebrow` utility with optional icon leader. Used everywhere. |
| `Mono` | `src/components/ui/mono.tsx` | Inline `<span>` wrapper applying `text-mono-meta`. For counts, IDs, timestamps. |

### 7.3 Workspace primitives (FOUNDATION PR — structural scaffolding for PR 4/5)

| Component | File | Purpose |
|---|---|---|
| `WorkspaceFrame` | `src/components/layout/workspace-frame.tsx` | Grid layout: `[leftRail?] [main] [rightRail?]`. Columns variant prop: `live` / `platform` / `review`. Slots: `crumbs`, `rightHeader`, `leftRail`, `rightRail`, `children`. Mirrors `platform-screens.jsx:8-45`. |
| `RailHeader` | `src/components/layout/rail-header.tsx` | The 22px-padded rail hero section. |
| `RailSection` | `src/components/layout/rail-section.tsx` | 18×20 padded section with `text-eyebrow` title. |
| `MetaRow` | `src/components/layout/meta-row.tsx` | Key/value row (muted key + `text-ui-sm` ink value). |
| `JumpItem` | `src/components/layout/jump-item.tsx` | Rail anchor link. Active = `bg-canvas` + `--shadow-inset-edge`. Optional mono count suffix. |

### 7.4 Tool-specific primitives (INTRODUCED IN PR 5)

These are tool-flow components from the exploration files. They ship in PR 5 (sub-project tools) alongside the pages that use them — not in the Foundation PR, to keep PR 1 scoped.

| Component | Source file | Used on |
|---|---|---|
| `SessionHeader` | `shared.jsx:365` | `/simulations/[id]`, `/sub/.../simulate`, dojo-like live sessions |
| `Composer` | `shared.jsx:265` | Live sessions (message input) |
| `MsgInterviewer` / `MsgRespondent` | `shared.jsx:217` / `:240` | Plain chat bubbles (fallback) |
| `ChatBubble` (live, with highlights) | `interview simulation.jsx:397` | Live interview transcript |
| `FGChatBubble` | `focus-group-live.jsx:241` | Focus-group multi-participant transcript |
| `InlineHighlight` | `interview simulation.jsx:467` | Amber-underlined clickable transcript span |
| `OpportunityCard` | `shared.jsx:300` (collapsed) + `interview simulation.jsx:549` (expanded) | Live sessions right rail |
| `ModeratorGuide` | `interview simulation.jsx:234` | Live sessions left rail |
| `PersonBadge` | `platform-screens.jsx:124` | Participant chips |
| `QuoteCard` | `platform-screens.jsx:140` | Mapping/synthesis |
| `InsightCard` | `platform-screens.jsx:152` | Synthesis |
| `LensCard` | `platform-screens.jsx:656` | HMW critique lens |
| `FormulaPill` | `platform-screens.jsx:649` | HMW composer |
| `StepCard` | `session-review-v2.jsx:466` | Recommended next-steps (session review) |
| `SR2_PersonaPanel` | `session-review-v2.jsx:149` | Session review participant summaries |
| `SR2_CompareRow` | `session-review-v2.jsx:205` | Session review cross-profile compare |
| `SR2_TranscriptBlock` | `session-review-v2.jsx:244` | Session review collapsed transcript |

### 7.5 Highlight primitive (`<Highlight>`)
`shared.jsx:203` — inline `linear-gradient` underline in `--primary-underline`. **Rule**: reserved for clickable opportunity anchors in transcripts only. Not for prose emphasis. Introduced in PR 5.

### 7.6 Not installing
Popover, Sheet, CommandPalette, Date Picker. Out of scope.

---

## 8. State System

### 8.1 Loading
- Every route segment that fetches data gets a sibling `loading.tsx`. Default = `<PageSkeleton />`. Specialized routes can inline a tailored skeleton (e.g. a simulate transcript skeleton, a kanban skeleton) but they must use the canonical `bg-canvas` background.
- In-page transient loads (e.g. form submission spinner, list reload) use `<CenteredSpinner />` at 20px.
- **No more hand-rolled `<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary">`.** All spinners go through `<CenteredSpinner />`, which wraps Lucide `Loader2`.

### 8.2 Empty
- Every "no data yet" surface uses `<EmptyState icon title description action />`. Same size, spacing, typography across dashboard, KB (global + project), project detail, sub-project home, and all tool pages.

### 8.3 Error
- Every route segment gets a sibling `error.tsx` that renders `<ErrorState />`. The top-level `app/error.tsx` catches everything else.
- In-page fetch errors (not route-level) use inline `<ErrorState>` inside the container.
- `app/not-found.tsx` shows `<ErrorState>` for 404s.

### 8.4 Toast & confirm (kill alert/confirm)
- Install **Sonner**. Toaster mounted at the top of `src/app/layout.tsx` body.
- Success / informational feedback → `toast.success(...)` or `toast(...)`.
- Destructive confirmations → always `<AlertDialog>`. **No `window.confirm()` remains anywhere.**
- Transient form errors → `toast.error(...)`; persistent/form-level errors → inline `<FormMessage>` or `<ErrorState>`.
- **Scope**: all 71 `alert()` / `confirm()` call-sites across 20 files (audit'd by Agent B) migrate in the relevant phase PRs (PR 2/3/4/5).

### 8.5 Hover / focus / disabled
- Hover on cards: shadow escalates by one level (e.g. `--shadow-outline-ring` → `+ --shadow-warm-lift`), transition 160ms ease.
- Hover on buttons: `bg` / ring darkens. No `translateY`.
- Focus on every interactive: `--shadow-focus`. Replaces Tailwind default `ring-ring` + `ring-offset`.
- Disabled: `opacity-50 pointer-events-none`. No custom disabled backgrounds.

---

## 9. Page Surface Phases (Rollout)

Five PRs. Each is independently mergeable. Per-PR QA gate: `npm run build` + `npm run lint` clean, browser walk of every affected route, no broken forms / data loads / interactions.

### PR 1 — Foundation (no user-visible change until PR 2 lands)
- `globals.css` rewrite (tokens, typography, shadows, radii, strip dark).
- `layout.tsx` update (Inter weights; Toaster mount; footer polish).
- Install `sonner`.
- Add `app/not-found.tsx`, `app/error.tsx` using `<ErrorState>`.
- Restyle 18 shadcn primitives.
- Restyle `TopNavbar` + update to use `Button asChild` for "New Project".
- Add generic primitives: `PageHeader`, `PageBar`, `BackLink`, `EmptyState`, `ErrorState`, `PageSkeleton`, `CardSkeleton`, `CenteredSpinner`, `Kbd`, `Eyebrow`, `Mono`.
- Add workspace primitives: `WorkspaceFrame`, `RailHeader`, `RailSection`, `MetaRow`, `JumpItem`.
- Evaluate `@layer base { html { cursor: default } }` global cursor block; preserve or simplify.

### PR 2 — Entry + shell (7 routes + archive)
Routes: `/`, `/login`, `/dashboard`, `/kb`, `/settings`, `/privacy`, `/terms`.
- Dashboard: `PageHeader`, `featured` CTA, `EmptyState`, `<AlertDialog>` replacing `confirm()`, all hand-rolled cards → `<Card>`.
- `/login`: rewrite with `<Input>`, `<Button>`, tokens (no hex literals). Keep fixed-overlay behaviour.
- `/kb`: `PageHeader`, `<Tabs>` (underline), `<EmptyState>`, `<Card>` rows, `<Checkbox>` replacing raw input, `<Button variant="outline">` replacing hand-rolled upload trigger.
- `/settings`: `PageHeader`, forms via `<Card>` + `<Form>` primitives. Purge stale "Development" / "gpt-5.2" copy or gate behind env.
- `/privacy` + `/terms`: reading treatment `max-w-[720px]`, `text-body-lg` lead, `<BackLink>`, prose `text-display-3` section headings.
- Replace `alert()` / `confirm()` in these 7 routes with Sonner / `<AlertDialog>`.
- **Archive** `src/app/projects/[projectId]/dojo/` → `archive/projects-[projectId]-dojo/` and `src/app/projects/[projectId]/guide/` → `archive/projects-[projectId]-guide/`. Remove the routes from the app tree.

### PR 3 — Project core (4 routes)
Routes: `/projects/new`, `/projects/new/guide`, `/projects/[projectId]`, `/projects/[projectId]/kb`.
- `/projects/new`: `PageHeader`, `<Form>`, `<Card>` form container, `max-w-[640px]` form width.
- `/projects/new/guide`: the big one (1500+ lines). Page-title drift fix (`text-display-2`). Severity tokens replace `getSeverityColor`. Violet-research → `--knowledge` tokens. Blue follow-up → `--info`. Red hover → `text-danger`. Success/error alerts → `<Alert variant="info|destructive">`. Hand-rolled spinner → `<CenteredSpinner>`. `alert()`/`confirm()` → toast/AlertDialog. Edit-guide header bar: swap inline bar to `<PageBar>` + `px-4 sm:px-6 lg:px-8` alignment (match main content padding).
- `/projects/[projectId]`: `PageHeader`, new-layout two-column with `Card` grid of sub-projects and sticky summary panel. `<Collapsible>` or consistent truncation for description (replaces Read-more dialog pattern). Tokenize `border-[var(--color-knowledge)]` + swap to `<Button variant="knowledge">` (adds variant).
- `/projects/[projectId]/kb`: match `/kb` patterns. Unify compliance-check module (`<ComplianceWarning>` extracted component). Unify empty state to `<EmptyState>`.

### PR 4 — Sub-project shell (3 routes + WorkspaceFrame deployment)
Routes: `/projects/[projectId]/sub/new`, `/projects/[projectId]/sub/[subProjectId]` (home), `/projects/[projectId]/sub/[subProjectId]/edit`.
- Sub-project home: **deploy `<WorkspaceFrame variant="platform">`.** Left rail: sub-project meta + tool launcher. Main: summary cards / context. Right rail optional.
- Tool-launcher grid: `<Card>` grid of 6–8 tools (Simulate, Insights, HMW, Map, Ideation, Archetypes, plus any synthesis tools). Each card has a single-color semantic accent (primary / info / knowledge) per tool category.
- Hand-rolled tab-like buttons (`ring-1 ring-black/5`) → `<Tabs>`.
- `/sub/new` + `/edit`: `<Form>` with consistent `max-w-[640px]` form width.
- `alert()`/`confirm()` migration: the sub-project page has 7 `confirm()` calls (guide/simulation/mapping/archetype/ideation/HMW/insights delete) — all → `<AlertDialog>`.

### PR 5 — Sub-project tools (11 routes; introduces tool primitives)
Routes: `/insights`, `/simulate`, `/hmw`, `/map/new`, `/map/[sessionId]`, `/ideation/new`, `/ideation/[sessionId]`, `/archetypes/new`, `/archetypes/[sessionId]`, `/simulations/[id]`.

Introduces the tool-specific primitive family (see §7.4). Each tool page adopts the workspace grammar:
- `/simulate` + `/simulations/[id]` → `WorkspaceFrame variant="live"` (260/1fr/400). Use `ModeratorGuide`, `ChatBubble`, `Composer`, `OpportunityCard`, `InlineHighlight`, `SessionHeader`.
- `/insights` → `WorkspaceFrame variant="platform"`. Mapping ↔ insights tab toggle. `QuoteCard` kanban, `InsightCard` columns, `PersonBadge` chips.
- `/hmw` → `WorkspaceFrame variant="platform"`. History timeline left, composer + critique + `LensCard` grid center, formula + sources right.
- `/map/*` → kanban view. `QuoteCard` tiles, persona-colored chips.
- `/ideation/*` → 3-col concept grid. Regenerate ghost pill header.
- `/archetypes/*` → `WorkspaceFrame variant="review"`. Hero + 2-col trait grid + signal-quotes.
- Session-review-v2 pattern (if we have a route for it): `SR2_PersonaPanel`, `SR2_CompareRow`, `SR2_TranscriptBlock`, `StepCard`.
- Hand-rolled tooltips in `/hmw`, `/insights` → `<Tooltip>`.
- Hand-rolled cards / radii / hex colors across these pages → tokens.
- All remaining `alert()`/`confirm()` in the tools → toast/AlertDialog.
- Density note: row/list heights here tighten to 40–44px touch target vs 56px panels in ElevenLabs ref — research tools need scannability. Typography unchanged.

**PR 5 is sized to possibly split into 5a (simulate + simulations + insights) and 5b (hmw + map + ideation + archetypes) during writing-plans, to keep per-PR review digestible.**

### Per-PR QA gate (mandatory)
1. `npm run build` clean (no TS, no CSS errors).
2. `npm run lint` clean.
3. Browser walk every affected route; confirm zero functional regression.
4. Grep for remaining `alert(`, `confirm(`, `bg-white`, hex strings, `text-red-500`, `text-blue-500`, `text-amber-900`, `text-violet-600`, `font-bold` on page titles in the files touched. Zero tolerance inside PR scope.
5. Screenshot diffs (before/after) for a sample of the affected pages.

---

## 10. Archived routes

Dead routes archived (not deleted) as part of PR 2:
- `src/app/projects/[projectId]/dojo/` → `archive/projects-[projectId]-dojo/`. Currently ~1200 lines; duplicate of `/sub/.../simulate`. Leave a note in `archive/README.md`.
- `src/app/projects/[projectId]/guide/` → `archive/projects-[projectId]-guide/`. 25-line redirect stub to `/projects/new/guide?projectId=...`. Leave a note.

Archive preserves history; if they're needed they can be restored from `archive/`.

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Token rewrite breaks existing classes that reference old var names (e.g. `--color-interact-subtle`). | Foundation PR preserves every existing var name as an alias (e.g. `--color-interact-subtle: var(--primary-soft)`). Only values change. |
| Tabs underline change is structural; may break pages that layout around old segmented width. | PR 1 audits every `<Tabs>` call-site. Any layout-dependent breakage logged for phase PRs. |
| Sonner mount + 71 alert/confirm replacements is substantial work. | Scoped per phase PR; Foundation PR sets up Toaster, each phase PR migrates its own routes. |
| `loading.tsx` / `error.tsx` / `not-found.tsx` added across the app may cause existing Suspense boundary behaviour to change. | Default `loading.tsx` is a skeleton, so the UX is additive. Each phase PR tests that the new loading state renders and data loads complete as before. |
| Archive move leaves import references to `/dojo` or `/guide` broken. | PR 2 greps for all references before moving; converts any `<Link href="/projects/:id/dojo">` etc. to route to the canonical page or removes the link. |
| Page-level utility class strings (`text-2xl font-semibold`) read wrong after token shift. | Phase PRs fix per-page; Foundation PR does not globally rewrite. |
| WorkspaceFrame changes the layout of the sub-project shell — may interact with tool-page rendering in PR 5. | PR 4 ships WorkspaceFrame at the sub-project home only; tool pages remain on their current layout until PR 5. Each tool gets its own column variant during PR 5. |
| Persona palette overlap (amber persona = primary color) causes visual clash when an amber-persona participant's chip sits next to an amber accent. | Chips use `-soft` bg + persona-color text — readability maintained. Document this rule in the Badge variant docstring. |

---

## 12. Out-of-scope / Deferred

- Dark mode reintroduction.
- Popover / Sheet / CommandPalette / date picker primitives (Sonner is in-scope).
- Mobile redesign beyond existing breakpoints.
- Fraunces serif layer.
- Page-level IA changes (menus restructured, routes merged/split).
- Full WCAG pass beyond "every interactive primitive has visible focus + a label".
- Search UI (the `Search` ghost pill in TopNav has no route yet; placeholder stays).
- Notifications center, audit log UI, team/member management — not in the app today.

---

## 13. References

- `DESIGN-elevenlabs.md` — original visual reference.
- `claude design explorations/*.jsx` — canonical source of truth for tokens, layout, components.
- `src/app/globals.css` — current token source.
- `src/components/ui/*.tsx` — current shadcn primitives.
- `components.json` — shadcn config (unchanged).
- Agent A extraction (this conversation) — full design-system reverse-engineer.
- Agent B audit (this conversation) — 72 inconsistency issues with file:line citations.
