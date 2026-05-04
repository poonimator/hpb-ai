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
        // Two-column row — label left, value right. items-start so long wrapping
        // values don't vertically re-centre the key. Value is text-right to keep
        // short values visually flush with the rail's right edge.
        "flex items-start justify-between gap-4 py-1.5 text-body-sm",
        className
      )}
    >
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="text-ui-sm text-foreground text-right min-w-0 leading-snug">{v}</span>
    </div>
  )
}

export { MetaRow }
// Created by Swapnil Bapat © 2026
