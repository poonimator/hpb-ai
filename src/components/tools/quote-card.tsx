"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Trash2, User } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * QuoteCard — affinity / cluster card used by the mapping page.
 *
 * Shows a single leading quote with a transcript tag below. If additional
 * quotes are passed, a chevron reveals them stacked with a dashed divider.
 *
 * Hover exposes a trash button that fires `onDelete(id)` when present.
 *
 * The component is purely presentational — the caller parses the underlying
 * `cluster.quote` JSON blob and hands an array to `quotes`.
 */

/** Shared palette — map a transcript display name to a stable colour index.
 *  Five calm categorical tokens; the name-hash picks one deterministically. */
const TAG_COLORS = [
  { bg: "bg-[color:var(--cat-1-soft)]", text: "text-[color:var(--cat-1)]", border: "border-[color:var(--cat-1)]/25", icon: "text-[color:var(--cat-1)]" },
  { bg: "bg-[color:var(--cat-2-soft)]", text: "text-[color:var(--cat-2)]", border: "border-[color:var(--cat-2)]/25", icon: "text-[color:var(--cat-2)]" },
  { bg: "bg-[color:var(--cat-3-soft)]", text: "text-[color:var(--cat-3)]", border: "border-[color:var(--cat-3)]/25", icon: "text-[color:var(--cat-3)]" },
  { bg: "bg-[color:var(--cat-4-soft)]", text: "text-[color:var(--cat-4)]", border: "border-[color:var(--cat-4)]/25", icon: "text-[color:var(--cat-4)]" },
  { bg: "bg-[color:var(--cat-5-soft)]", text: "text-[color:var(--cat-5)]", border: "border-[color:var(--cat-5)]/25", icon: "text-[color:var(--cat-5)]" },
] as const

function getTagStyle(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % TAG_COLORS.length
  return TAG_COLORS[index]
}

interface QuoteCardProps {
  id: string
  /** All quotes in this cluster — the first is always visible. */
  quotes: string[]
  /** Transcript display name, rendered as a coloured pill. */
  transcriptName: string
  /** Optional theme/cluster name — used for `title` affordance only. */
  theme?: string
  /** Whether this card was added manually (dashed outline + "MANUAL" tag). */
  isManual?: boolean
  /** Fires when the user confirms deletion (parent handles the confirm UX). */
  onDelete?: (id: string) => void
  className?: string
}

function QuoteCard({
  id,
  quotes,
  transcriptName,
  theme,
  isManual = false,
  onDelete,
  className,
}: QuoteCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const hasMultiple = quotes.length > 1
  const tag = getTagStyle(transcriptName)

  return (
    <div
      title={theme}
      className={cn(
        "group relative rounded-[14px] border border-[color:var(--border-subtle)]",
        "bg-[color:var(--surface)] shadow-outline-ring",
        "transition-all duration-300 ease-out",
        isManual
          ? "border-l-2 border-l-[color:var(--knowledge)] bg-[color:var(--knowledge-soft)]/20"
          : "",
        className,
      )}
    >
      {onDelete ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(id)
          }}
          className={cn(
            "absolute right-1.5 top-1.5 z-10 rounded p-1 opacity-0 transition-all",
            "text-muted-foreground hover:bg-[color:var(--danger-soft)] hover:text-[color:var(--danger)]",
            "group-hover:opacity-100",
          )}
          title="Delete card"
        >
          <Trash2 className="size-3" />
        </button>
      ) : null}

      <div className="space-y-1.5 p-2 pl-3">
        <div className="relative pr-4">
          <p className="text-[11px] font-medium leading-snug text-muted-foreground break-words">
            &ldquo;{quotes[0]}&rdquo;
          </p>
          {expanded
            ? quotes.slice(1).map((q, i) => (
                <div
                  key={i}
                  className="mt-2 border-t border-dashed border-[color:var(--border)] pt-2"
                >
                  <p className="text-[11px] font-medium leading-snug text-muted-foreground break-words">
                    &ldquo;{q}&rdquo;
                  </p>
                </div>
              ))
            : null}
        </div>

        <div className="flex items-end justify-between pt-0.5">
          <div className="flex items-center gap-1.5">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--radius-md2)] border px-1.5 py-0.5",
                "text-[9px] font-bold uppercase tracking-wider",
                tag.bg,
                tag.text,
                tag.border,
              )}
            >
              <User className={cn("size-2.5", tag.icon)} />
              <span className="max-w-[80px] truncate">{transcriptName}</span>
            </div>
            {isManual ? (
              <span
                className={cn(
                  "rounded border px-1 text-[8px] font-medium",
                  "border-[color:var(--knowledge-soft)] bg-[color:var(--knowledge-soft)]",
                  "text-[color:var(--knowledge)]",
                )}
              >
                MANUAL
              </span>
            ) : null}
          </div>

          {hasMultiple ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((v) => !v)
              }}
              className={cn(
                "rounded-full p-1 text-muted-foreground transition-all",
                "bg-[color:var(--surface-muted)]/50 hover:bg-[color:var(--surface-muted)]",
                "hover:text-[color:var(--knowledge)]",
              )}
              aria-label={expanded ? "Collapse quotes" : "Expand quotes"}
            >
              {expanded ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export { QuoteCard, getTagStyle }
export type { QuoteCardProps }
// Created by Swapnil Bapat © 2026
