"use client"

import * as React from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * LensCard — critique lens rendered as a soft-tinted card that mirrors the
 * exploration prototype in `claude design explorations/platform-screens.jsx`.
 *
 * Two calling conventions are supported:
 *
 *   1. Exploration-style (primary):
 *        <LensCard bg="rgba(…)" accent="#0ea5e9"
 *                  fragment='"…"' body="…"
 *                  tags={["Solution-Agnostic"]}
 *                  needsWork="…"
 *                  research="…" researchTitle="…" />
 *
 *   2. Legacy `{ lens: LensLike }`:
 *        used by the fallback 5-lens / 5-criteria sections of the HMW +
 *        Insights pages. Renders a verdict-badged variant.
 *
 * Both renderers default to collapsed when the lens PASSES and expanded when
 * it NEEDS WORK / FAILS. Clicking the header toggles state, with a chevron
 * that rotates to signal direction.
 *
 * The `adaptCriteria()` / `adaptLens()` helpers exported at the bottom still
 * return the `LensLike` shape for those legacy call sites.
 */

type LensVerdict = "PASS" | "NEEDS_WORK" | "FAIL"

interface LensLikeEvidence {
  source?: string
  quote?: string
  connection?: string
}

interface LensLike {
  /** Display name of the lens / criterion (e.g. "Solution-Agnostic"). */
  name: string
  /** Normalised verdict — pass "PARTIAL" and it will render as NEEDS_WORK. */
  verdict: LensVerdict | "PARTIAL"
  /** Prose explanation of why the lens reached this verdict. */
  rationale: string
  /** Optional single-line follow-up suggestion (the "Try: …" line). */
  suggestion?: string | null
  /** Optional quotes / research evidence. Rendered as a stacked list. */
  evidence?: LensLikeEvidence[] | null
  /** Optional hint shown at top of card (e.g. mini formula fragment). */
  fragment?: string | null
}

/** Primary (exploration-style) props. */
interface LensCardExplorationProps {
  /** Soft tint for the outer card (e.g. `rgba(14,165,233,0.06)`). */
  bg?: string
  /** Accent colour for the bulb icon + italic fragment (e.g. `#0ea5e9`). */
  accent?: string
  /** Italicised HMW fragment — usually a quoted slice (e.g. `"to take…"`). */
  fragment?: string
  /** Body copy explaining the lens's take. */
  body?: string
  /** White pills rendered below the body (e.g. `['Solution-Agnostic']`). */
  tags?: string[]
  /** Amber "needs work" explanation. Adds a warning chip + prose. */
  needsWork?: string
  /** Research-context card body copy. */
  research?: string
  /** Italic secondary line under the research body (e.g. source). */
  researchTitle?: string
  /** Whether the card can be toggled open/closed. Defaults to `true`. */
  collapsible?: boolean
  /**
   * Initial expanded state. Defaults to `true` when `needsWork` is present,
   * `false` otherwise (PASS-style cards collapse by default).
   */
  defaultExpanded?: boolean
  className?: string
}

/** Legacy (verdict-badge) props. */
interface LensCardLegacyProps {
  lens: LensLike
  defaultExpanded?: boolean
  alwaysOpen?: boolean
  className?: string
}

type LensCardProps = LensCardExplorationProps | LensCardLegacyProps

function isLegacyProps(p: LensCardProps): p is LensCardLegacyProps {
  return typeof (p as LensCardLegacyProps).lens === "object"
    && (p as LensCardLegacyProps).lens !== null
}

// ─── Primary (exploration-style) renderer ────────────────────────────────

function LensCardExploration({
  accent = "var(--primary)",
  fragment,
  body,
  tags = [],
  needsWork,
  research,
  researchTitle,
  collapsible = true,
  defaultExpanded,
  className,
}: LensCardExplorationProps) {
  const isPass = !needsWork
  const initial = defaultExpanded ?? !isPass
  const [expanded, setExpanded] = React.useState(initial)

  const header = (
    <div className="flex min-w-0 items-center gap-2.5">
      <Lightbulb
        size={15}
        style={{ color: accent }}
        strokeWidth={1.75}
        className="shrink-0"
      />
      {fragment ? (
        <span
          className="flex-1 min-w-0 truncate italic text-[12.5px] font-medium"
          style={{ color: accent }}
        >
          {fragment}
        </span>
      ) : (
        <span className="flex-1 min-w-0" />
      )}
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 text-[11px] font-medium",
          needsWork
            ? "text-[color:var(--primary)]"
            : "text-[color:var(--ink-muted)]",
        )}
      >
        {needsWork ? (
          <AlertTriangle className="size-3" strokeWidth={1.75} />
        ) : (
          <CheckCircle2 className="size-3" strokeWidth={1.75} />
        )}
        {needsWork ? "Needs work" : "Pass"}
      </span>
      {collapsible ? (
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-[color:var(--ink-muted)] transition-transform duration-200",
            expanded ? "rotate-180" : "",
          )}
          strokeWidth={1.75}
        />
      ) : null}
    </div>
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-[12px] bg-[color:var(--surface-muted)] shadow-inset-edge px-[18px] py-4 min-w-0 overflow-hidden",
        className,
      )}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-2 text-left transition-colors hover:opacity-90"
          aria-expanded={expanded}
        >
          {header}
        </button>
      ) : (
        header
      )}

      {(!collapsible || expanded) && (
        <>
          {body ? (
            <p className="text-[12.5px] leading-[1.55] tracking-[0.01em] text-[color:var(--ink-secondary)]">
              {body}
            </p>
          ) : null}

          {tags.length > 0
            ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-[8px] bg-white px-[10px] py-[6px] text-[11.5px] text-[color:var(--ink-secondary)] shadow-inset-edge"
                  >
                    <CheckCircle2 className="size-3 text-[color:var(--ink-muted)]" strokeWidth={1.75} />
                    {t}
                  </span>
                ))}
              </div>
            )
            : null}

          {needsWork ? (
            <>
              <span className="inline-flex w-fit items-center gap-1 rounded-[4px] bg-[color:var(--primary-soft)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--primary)] shadow-inset-edge">
                <AlertTriangle className="size-3" strokeWidth={2} />
                Needs work
              </span>
              <p className="text-[11.5px] leading-[1.55] text-[color:var(--ink-secondary)]">
                {needsWork}
              </p>
            </>
          ) : null}

          {research ? (
            <div className="rounded-[8px] bg-white px-3 py-2.5 text-[11.5px] leading-[1.55] text-[color:var(--ink-secondary)] shadow-inset-edge">
              {research}
              {researchTitle ? (
                <>
                  <br />
                  <span className="italic text-[color:var(--ink-muted)]">
                    {researchTitle}
                  </span>
                </>
              ) : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

// ─── Legacy (verdict-badge) renderer — kept for fallback sections ────────

const VERDICT_CONFIG: Record<
  LensVerdict,
  {
    label: string
    icon: React.ComponentType<{ className?: string }>
    fg: string
    bg: string
    border: string
  }
> = {
  PASS: {
    label: "Pass",
    icon: CheckCircle2,
    fg: "text-[color:var(--success)]",
    bg: "bg-[color:var(--success-soft)]",
    border: "border-[color:var(--success-soft)]",
  },
  NEEDS_WORK: {
    label: "Needs Work",
    icon: AlertTriangle,
    fg: "text-[color:var(--warning)]",
    bg: "bg-[color:var(--warning-soft)]",
    border: "border-[color:var(--warning-soft)]",
  },
  FAIL: {
    label: "Fail",
    icon: XCircle,
    fg: "text-[color:var(--danger)]",
    bg: "bg-[color:var(--danger-soft)]",
    border: "border-[color:var(--danger-soft)]",
  },
}

function normaliseVerdict(v: LensLike["verdict"]): LensVerdict {
  if (v === "PASS") return "PASS"
  if (v === "FAIL") return "FAIL"
  return "NEEDS_WORK"
}

function LensCardLegacy({
  lens,
  defaultExpanded,
  alwaysOpen = false,
  className,
}: LensCardLegacyProps) {
  const verdict = normaliseVerdict(lens.verdict)
  const config = VERDICT_CONFIG[verdict]
  const VIcon = config.icon
  const isPass = verdict === "PASS"

  const initial = defaultExpanded ?? (alwaysOpen || !isPass)
  const [expanded, setExpanded] = React.useState(initial)

  const header = (
    <div className="flex items-center gap-2 px-3 py-2">
      <Lightbulb className="size-3.5 shrink-0 text-[color:var(--primary)]" strokeWidth={1.5} />
      <span className="flex-1 truncate text-[12px] font-semibold text-foreground">
        {lens.name}
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5",
          "text-[10px] font-bold uppercase tracking-wide",
          config.fg,
          config.bg,
          config.border,
        )}
      >
        <VIcon className="size-2.5" />
        {config.label}
      </span>
      {!alwaysOpen ? (
        expanded ? (
          <ChevronUp className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-3.5 text-muted-foreground" />
        )
      ) : null}
    </div>
  )

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)]",
        "shadow-outline-ring",
        className,
      )}
    >
      {alwaysOpen ? (
        <div>{header}</div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="w-full text-left transition-colors hover:bg-[color:var(--surface-muted)]"
        >
          {header}
        </button>
      )}

      {expanded ? (
        <div className="flex flex-col gap-2.5 border-t border-[color:var(--border-subtle)] px-3 py-2.5">
          {lens.fragment ? (
            <p className="text-caption italic text-[color:var(--primary)]">
              {lens.fragment}
            </p>
          ) : null}

          <p className="text-body-sm leading-relaxed text-muted-foreground">
            {lens.rationale}
          </p>

          {lens.suggestion ? (
            <p className="text-body-sm italic leading-relaxed text-[color:var(--primary)]">
              Try: &ldquo;{lens.suggestion}&rdquo;
            </p>
          ) : null}

          {lens.evidence && lens.evidence.length > 0 ? (
            <div className="flex flex-col gap-2 border-t border-[color:var(--border-subtle)] pt-2">
              {lens.evidence.map((ev, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-[10px] px-2.5 py-2 shadow-inset-edge",
                    "bg-[color:var(--surface-muted)]",
                  )}
                >
                  {ev.quote ? (
                    <p className="text-caption italic leading-relaxed text-muted-foreground">
                      &ldquo;{ev.quote}&rdquo;
                    </p>
                  ) : null}
                  {ev.connection ? (
                    <p className="mt-1 text-caption leading-relaxed text-muted-foreground">
                      {ev.connection}
                    </p>
                  ) : null}
                  {ev.source ? (
                    <p className="mt-1 text-[10px] italic text-muted-foreground">
                      {ev.source}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

// ─── Public entry point ──────────────────────────────────────────────────

function LensCard(props: LensCardProps) {
  if (isLegacyProps(props)) return <LensCardLegacy {...props} />
  return <LensCardExploration {...props} />
}

/**
 * Adapter for the insights page (`CriteriaCritiqueInline`).
 */
function adaptCriteria(cc: {
  criterion: string
  verdict: "PASS" | "PARTIAL" | "FAIL"
  explanation: string
  suggestion?: string
}): LensLike {
  return {
    name: cc.criterion,
    verdict: cc.verdict,
    rationale: cc.explanation,
    suggestion: cc.suggestion ?? null,
  }
}

/**
 * Adapter for the hmw page (`LensCritiqueInline`).
 */
function adaptLens(lc: {
  lens: string
  verdict: string
  explanation: string
  suggestion?: string
}): LensLike {
  const v = (lc.verdict as LensLike["verdict"]) ?? "PARTIAL"
  return {
    name: lc.lens,
    verdict: v,
    rationale: lc.explanation,
    suggestion: lc.suggestion ?? null,
  }
}

export { LensCard, adaptCriteria, adaptLens }
export type { LensCardProps, LensLike, LensVerdict, LensLikeEvidence }
// Created by Swapnil Bapat © 2026
