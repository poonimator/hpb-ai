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
        "flex items-center justify-between gap-3 py-1.5 text-body-sm",
        className
      )}
    >
      <span className="text-muted-foreground">{k}</span>
      <span className="text-ui-sm text-foreground">{v}</span>
    </div>
  )
}

export { MetaRow }
// Created by Swapnil Bapat © 2026
