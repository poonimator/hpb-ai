import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "live" | "platform" | "analyser" | "review"

const columns: Record<Variant, string> = {
  live: "grid-cols-[300px_1fr_400px]",
  platform: "grid-cols-[320px_1fr_400px]",
  analyser: "grid-cols-[300px_1fr_280px]",
  review: "grid-cols-[320px_1fr]",
}

type Props = {
  variant: Variant
  leftRail?: React.ReactNode
  rightRail?: React.ReactNode
  children: React.ReactNode
  /**
   * `scrollContained=true` — app-shell pattern. The frame sizes to its parent (via flex-1)
   * and rails + main each scroll INTERNALLY; the page itself doesn't grow. Use this on pages
   * whose outer wrapper already pins a viewport-sized height. The footer stays visible.
   *
   * `scrollContained=false` (default) — page-scroll pattern. The frame is viewport-tall
   * at minimum via min-h-[calc(100vh-120px)] so rail bgs extend to the footer edge; rails
   * use sticky positioning so they pin under the TopNav+PageBar while the page scrolls.
   */
  scrollContained?: boolean
  className?: string
  /**
   * Override classes for the inner <main>. Use to remove default padding or
   * disable main's overflow-y-auto for pages whose content manages its own
   * internal scroll container (e.g. chat with a floating composer).
   */
  mainClassName?: string
}

function WorkspaceFrame({
  variant,
  leftRail,
  rightRail,
  children,
  scrollContained = false,
  className,
  mainClassName,
}: Props) {
  const hasRight = variant !== "review" && rightRail
  const gridCols = hasRight ? columns[variant] : "grid-cols-[320px_1fr]"

  return (
    <div
      data-slot="workspace-frame"
      className={cn(
        scrollContained
          ? "grid flex-1 min-h-0 overflow-hidden grid-rows-[1fr]"
          : "grid flex-1 min-h-[calc(100vh-120px)]",
        gridCols,
        "bg-[color:var(--canvas)]",
        className
      )}
    >
      {leftRail && (
        <aside
          data-slot="workspace-rail-left"
          className={cn(
            "bg-[color:var(--surface)] border-r border-[color:var(--border-subtle)]",
            scrollContained ? "flex flex-col overflow-y-auto" : "relative"
          )}
        >
          {scrollContained ? (
            leftRail
          ) : (
            <div className="sticky top-[120px] max-h-[calc(100vh-120px)] overflow-y-auto flex flex-col">
              {leftRail}
            </div>
          )}
        </aside>
      )}
      <main
        data-slot="workspace-main"
        className={cn(
          "min-w-0 px-10 pt-8 pb-18",
          scrollContained && "overflow-y-auto",
          mainClassName
        )}
      >
        {children}
      </main>
      {hasRight && (
        <aside
          data-slot="workspace-rail-right"
          className={cn(
            "bg-[color:var(--surface)] border-l border-[color:var(--border-subtle)]",
            scrollContained ? "flex flex-col overflow-y-auto" : "relative"
          )}
        >
          {scrollContained ? (
            rightRail
          ) : (
            <div className="sticky top-[120px] max-h-[calc(100vh-120px)] overflow-y-auto flex flex-col">
              {rightRail}
            </div>
          )}
        </aside>
      )}
    </div>
  )
}

export { WorkspaceFrame }
// Created by Swapnil Bapat © 2026
