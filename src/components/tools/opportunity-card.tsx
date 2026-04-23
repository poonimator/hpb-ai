"use client"

import * as React from "react"
import { ChevronRight, Lightbulb, X } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * OpportunityCard — live-coach nudge surfaced in the simulate page right rail.
 *
 * Two visual states:
 *   - collapsed (default): compact pill showing the quote and a chevron
 *   - expanded: amber-ruled quote, surfaced context, testable assumption with
 *     validation-status prefix ([ALREADY VALIDATED] / [PARTIALLY VALIDATED] /
 *     [NEW HYPOTHESIS]), and the exploration direction
 *
 * Expansion is *controlled*. The parent keeps the `expanded` flag and handles
 * `onToggle`; pass `onClose` to render a close (×) button in the expanded head.
 */
type OpportunityAssumptionStatus =
  | "ALREADY_VALIDATED"
  | "PARTIALLY_VALIDATED"
  | "NEW_HYPOTHESIS"
  | null

interface OpportunityCardProps {
  /** Direct participant quote — surrounded with curly quotes in render. */
  quote?: string | null
  /** Short AI-written framing of the insight the quote surfaces. */
  surfacedContext?: string | null
  /**
   * Hypothesis worth validating. May be prefixed with a status tag in square
   * brackets — the component parses and strips it before render.
   */
  testableAssumption?: string | null
  /** "Consider exploring" next-step prompt. */
  explorationDirection?: string | null
  /** Controlled expansion state. */
  expanded?: boolean
  /** Called on any click of the collapsed card / chevron in expanded head. */
  onToggle?: () => void
  /** Called when the close button in the expanded head is tapped. */
  onClose?: () => void
  /** Optional monospace time label (e.g. "00:12:58"). */
  timestamp?: string | null
  className?: string
}

function parseAssumption(raw: string | null | undefined): {
  status: OpportunityAssumptionStatus
  text: string
} {
  if (!raw) return { status: null, text: "" }
  if (raw.startsWith("[ALREADY VALIDATED]")) {
    return {
      status: "ALREADY_VALIDATED",
      text: raw.replace("[ALREADY VALIDATED]", "").trim(),
    }
  }
  if (raw.startsWith("[PARTIALLY VALIDATED]")) {
    return {
      status: "PARTIALLY_VALIDATED",
      text: raw.replace("[PARTIALLY VALIDATED]", "").trim(),
    }
  }
  if (raw.startsWith("[NEW HYPOTHESIS]")) {
    return {
      status: "NEW_HYPOTHESIS",
      text: raw.replace("[NEW HYPOTHESIS]", "").trim(),
    }
  }
  return { status: null, text: raw.trim() }
}

const STATUS_COPY: Record<Exclude<OpportunityAssumptionStatus, null>, string> =
  {
    ALREADY_VALIDATED: "Already validated",
    PARTIALLY_VALIDATED: "Partially validated",
    NEW_HYPOTHESIS: "New hypothesis",
  }

const STATUS_STYLES: Record<
  Exclude<OpportunityAssumptionStatus, null>,
  string
> = {
  ALREADY_VALIDATED:
    "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
  PARTIALLY_VALIDATED: "bg-[color:var(--info-soft)] text-[color:var(--info)]",
  NEW_HYPOTHESIS: "bg-[color:var(--success-soft)] text-[color:var(--success)]",
}

function OpportunityCard({
  quote,
  surfacedContext,
  testableAssumption,
  explorationDirection,
  expanded = false,
  onToggle,
  onClose,
  timestamp,
  className,
}: OpportunityCardProps) {
  const assumption = parseAssumption(testableAssumption)

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "w-full rounded-[14px] bg-[color:var(--surface)] px-3.5 py-3 text-left",
          "shadow-outline-ring transition-all",
          "hover:shadow-card",
          className,
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-[10px]",
              "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
            )}
          >
            <Lightbulb className="size-3.5" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[color:var(--primary)]">
              Opportunity
            </p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {quote ? `"${quote}"` : surfacedContext}
            </p>
          </div>
          {timestamp ? (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {timestamp}
            </span>
          ) : null}
          <ChevronRight className="size-3.5 text-muted-foreground" />
        </div>
      </button>
    )
  }

  return (
    <div
      className={cn(
        "rounded-[14px] bg-[color:var(--surface)] p-4",
        "shadow-outline-ring",
        "flex flex-col gap-3.5",
        className,
      )}
    >
      {/* Meta row */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-[10px]",
            "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
          )}
        >
          <Lightbulb className="size-3.5" strokeWidth={1.5} />
        </div>
        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-[color:var(--primary)]">
          Opportunity Identified
        </p>
        <div className="flex-1" />
        {timestamp ? (
          <span className="font-mono text-[10.5px] text-muted-foreground">
            {timestamp}
          </span>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className={cn(
              "flex size-6 items-center justify-center rounded-[var(--radius-chip)]",
              "text-muted-foreground transition-colors hover:text-foreground",
            )}
            aria-label="Close opportunity details"
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {/* Amber-ruled quote */}
      {quote ? (
        <div className="border-l-2 border-[color:var(--primary-underline)] pl-3">
          <p className="text-body-sm italic leading-relaxed text-foreground">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      ) : null}

      {/* Surfaced context */}
      {surfacedContext ? (
        <p className="text-body-sm font-medium leading-relaxed text-foreground">
          {surfacedContext}
        </p>
      ) : null}

      {/* Testable assumption */}
      {assumption.text ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-caption font-medium text-[color:var(--knowledge)]">
              Worth validating:
            </span>
            {assumption.status ? (
              <span
                className={cn(
                  "inline-flex items-center rounded-[var(--radius-chip)] px-1.5 py-0.5",
                  "text-[9px] font-bold uppercase tracking-wide",
                  STATUS_STYLES[assumption.status],
                )}
              >
                {STATUS_COPY[assumption.status]}
              </span>
            ) : null}
          </div>
          <p
            className={cn(
              "text-[11.5px] leading-relaxed",
              assumption.status === "ALREADY_VALIDATED"
                ? "italic text-[color:var(--primary)]"
                : "text-muted-foreground",
            )}
          >
            {assumption.text}
          </p>
        </div>
      ) : null}

      {/* Exploration direction */}
      {explorationDirection ? (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-[color:var(--primary)]">
            Consider exploring:
          </span>{" "}
          {explorationDirection}
        </p>
      ) : null}
    </div>
  )
}

export { OpportunityCard }
export type { OpportunityCardProps, OpportunityAssumptionStatus }
// Created by Swapnil Bapat © 2026
