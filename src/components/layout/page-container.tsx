import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Page-level wrapper for non-tool pages. Provides viewport-constrained scrolling
 * (so rail-based tool pages can lock the shell at 100vh without clipping every
 * other page) and applies the max-w-7xl centered content gutter.
 *
 * Tool pages that render <WorkspaceFrame> full-bleed should NOT use this —
 * they manage their own layout inside the locked shell.
 */
function PageContainer({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
}) {
  return (
    <div className={cn("flex-1 min-h-0 w-full overflow-y-auto", className)}>
      <div
        className={cn(
          "max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex flex-col",
          innerClassName
        )}
      >
        {children}
      </div>
    </div>
  )
}

export { PageContainer }
// Created by Swapnil Bapat © 2026
