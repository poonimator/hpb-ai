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
        // items-start so long values that wrap don't center-offset the key
        "flex items-start justify-between gap-3 py-1.5 text-body-sm",
        className
      )}
    >
      <span className="text-muted-foreground shrink-0">{k}</span>
      <span className="text-ui-sm text-foreground text-right min-w-0">{v}</span>
    </div>
  )
}

export { MetaRow }
// Created by Swapnil Bapat © 2026
