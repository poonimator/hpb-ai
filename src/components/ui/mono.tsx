import * as React from "react"
import { cn } from "@/lib/utils"

function Mono({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="mono"
      className={cn("text-mono-meta text-muted-foreground", className)}
      {...props}
    />
  )
}

export { Mono }
// Created by Swapnil Bapat © 2026
