"use client"

import * as React from "react"
import { ImageOff } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * ConceptCard — a single Crazy 8s ideation concept.
 *
 * Layout (matching the ideation grid in platform-screens.jsx):
 *   • top row: optional theme dot + label (uppercase), right-aligned mono index
 *   • 4:3 illustration slot — shows `imageBase64` (raw base64, no data: prefix)
 *     or a fallback placeholder
 *   • concept name (bold)
 *   • tagline (muted body copy)
 *   • optional `details` block — a short description used when a richer card
 *     is needed (e.g. in an overlay)
 *
 * Entire card is clickable via `onClick` so the caller can open a detail view.
 */

interface ConceptCardProps {
  name: string
  tagline: string
  /** Optional theme label (e.g. "Technology", "Services"). */
  theme?: string | null
  /** Tailwind class expression for the theme dot (e.g. "bg-sky-500"). */
  themeColor?: string | null
  /** Raw base64 (no "data:image/..." prefix) — matches ideation payload. */
  imageBase64?: string | null
  /** Optional longer description — rendered below the tagline when present. */
  details?: string | null
  /** 1-based card index used for the mono "C01"-style badge. Defaults to null. */
  index?: number | null
  onClick?: () => void
  className?: string
}

function ConceptCard({
  name,
  tagline,
  theme,
  themeColor,
  imageBase64,
  details,
  index = null,
  onClick,
  className,
}: ConceptCardProps) {
  const monoIndex =
    typeof index === "number" && index > 0
      ? `C${String(index).padStart(2, "0")}`
      : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col gap-2.5 overflow-hidden rounded-[14px] p-3.5 text-left",
        "border border-[color:var(--border-subtle)] bg-[color:var(--surface)]",
        "shadow-outline-ring transition-all duration-200",
        "hover:border-[color:var(--primary-soft)] hover:shadow-card",
        className,
      )}
    >
      {(theme || monoIndex) ? (
        <div className="flex items-center justify-between">
          {theme ? (
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-[color:var(--ink-secondary)]">
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  themeColor ?? "bg-[color:var(--primary)]",
                )}
              />
              {theme}
            </span>
          ) : (
            <span />
          )}
          {monoIndex ? (
            <span className="font-mono text-[10.5px] text-muted-foreground">
              {monoIndex}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden",
          "rounded-[10px] bg-[color:var(--surface-muted)] shadow-inset-edge",
        )}
      >
        {imageBase64 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              imageBase64.startsWith("data:")
                ? imageBase64
                : `data:image/png;base64,${imageBase64}`
            }
            alt={name}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage:
                  "radial-gradient(var(--border) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            />
            <ImageOff className="relative size-7 text-muted-foreground/40" />
          </>
        )}
      </div>

      <h3 className="text-[14px] font-semibold leading-snug text-foreground line-clamp-1">
        {name}
      </h3>
      <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2">
        {tagline}
      </p>

      {details ? (
        <p className="text-caption leading-relaxed text-muted-foreground line-clamp-3">
          {details}
        </p>
      ) : null}
    </button>
  )
}

export { ConceptCard }
export type { ConceptCardProps }
// Created by Swapnil Bapat © 2026
