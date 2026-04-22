import * as React from "react"
import { cn } from "@/lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex items-center justify-center min-w-[1.5rem] h-[1.25rem] px-1",
        "font-mono text-[11px] leading-none text-muted-foreground",
        "bg-background rounded-[4px] shadow-ring align-middle",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
// Created by Swapnil Bapat © 2026
