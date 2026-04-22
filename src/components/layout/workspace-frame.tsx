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
