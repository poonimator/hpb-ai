import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-20 w-full rounded-[var(--radius-md2)] bg-[color:var(--surface)] text-body text-foreground",
        "shadow-inset-edge px-3.5 py-2.5",
        "placeholder:text-muted-foreground",
        "transition-shadow outline-none",
        "focus-visible:shadow-focus",
        "aria-invalid:shadow-[0_0_0_2px_color-mix(in_oklab,var(--danger)_45%,transparent)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
// Created by Swapnil Bapat © 2026
