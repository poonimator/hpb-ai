import * as React from "react"
import { cn } from "@/lib/utils"

function Eyebrow({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="eyebrow"
      className={cn(
        "text-eyebrow text-muted-foreground flex items-center gap-1.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Eyebrow }
// Created by Swapnil Bapat © 2026
