"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * ConceptCard — a single Crazy 8s ideation concept.
 *
 * Layout (matching the exploration prototype in platform-screens.jsx):
 *   - top row: theme label (uppercase, letter-spaced, colored dot) +
 *     right-aligned mono concept id like "C01"
 *   - 4:3 illustration slot: either the provided base64 image, or a
 *     dotted-grid placeholder with a centered mono "CONCEPT ILLUSTRATION"
 *     label
 *   - title (14px / semibold)
 *   - tagline (12px / muted)
 *   - optional `details` paragraph for richer contexts (e.g. overlays)
 *
 * The whole card is a single clickable button so the caller can open a
 * detail view via `onClick`.
 */

interface ConceptCardProps {
  name: string
  tagline: string
  /** Optional theme label (e.g. "Technology", "Services"). */
  theme?: string | null
  /**
   * Optional theme accent. Accepts either a raw CSS color (e.g. "#0ea5e9"
   * or "var(--primary)") OR a Tailwind background class expression
   * (e.g. "bg-sky-500"). If omitted, falls back to `--primary`.
   */
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

/**
 * Decide whether `themeColor` should be rendered as an inline CSS color
 * (hex / rgb / hsl / var(...)) or applied as a Tailwind class.
 */
function isCssColorValue(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed.startsWith("#")) return true
  if (trimmed.startsWith("var(")) return true
  if (trimmed.startsWith("rgb(") || trimmed.startsWith("rgba(")) return true
  if (trimmed.startsWith("hsl(") || trimmed.startsWith("hsla(")) return true
  return false
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

  const resolvedThemeColor = themeColor ?? "var(--primary)"
  const themeColorIsCss =
    typeof resolvedThemeColor === "string" && isCssColorValue(resolvedThemeColor)

  const dotStyle: React.CSSProperties = themeColorIsCss
    ? { background: resolvedThemeColor }
    : {}
  const labelStyle: React.CSSProperties = themeColorIsCss
    ? { color: resolvedThemeColor }
    : {}

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[14px] p-[14px] text-left",
        "bg-[color:var(--surface)] shadow-outline-ring",
        "transition-all duration-200 hover:shadow-card",
        className,
      )}
      style={{ gap: 10 }}
    >
      {(theme || monoIndex) ? (
        <div className="flex items-center justify-between">
          {theme ? (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em]",
                !themeColorIsCss && resolvedThemeColor
                  ? ""
                  : "text-[color:var(--primary)]",
              )}
              style={labelStyle}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  !themeColorIsCss && resolvedThemeColor ? resolvedThemeColor : "",
                )}
                style={dotStyle}
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
            <span className="relative font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
              concept illustration
            </span>
          </>
        )}
      </div>

      <h3 className="text-[14px] font-semibold text-foreground line-clamp-1">
        {name}
      </h3>
      <p
        className="text-[12px] text-muted-foreground line-clamp-2"
        style={{ lineHeight: 1.55, letterSpacing: "0.01em" }}
      >
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
