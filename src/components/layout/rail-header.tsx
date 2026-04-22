import * as React from "react"
import { cn } from "@/lib/utils"

function RailHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="rail-header"
      className={cn(
        "flex flex-col gap-3 px-[22px] pt-[22px] pb-[18px]",
        "border-b border-[color:var(--border-subtle)]",
        className
      )}
      {...props}
    />
  )
}

export { RailHeader }
// Created by Swapnil Bapat © 2026
