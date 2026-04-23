import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  k: React.ReactNode
  v: React.ReactNode
  className?: string
}

function MetaRow({ k, v, className }: Props) {
  return (
    <div
      data-slot="meta-row"
      className={cn(
        // Stacked layout — label on top, value below. Both left-aligned so long
        // multi-line values flow naturally without breaking the grid of rows above.
        "flex flex-col gap-1 py-1.5 text-body-sm",
        className
      )}
    >
      <span className="text-caption text-muted-foreground">{k}</span>
      <span className="text-ui-sm text-foreground leading-snug">{v}</span>
    </div>
  )
}

export { MetaRow }
// Created by Swapnil Bapat © 2026
