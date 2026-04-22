import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-[var(--radius-md2)] bg-[color:var(--surface)] text-body text-foreground",
        "shadow-inset-edge px-3.5 py-2.5",
        "placeholder:text-muted-foreground",
        "selection:bg-[color:var(--primary)] selection:text-[color:var(--primary-fg)]",
        "transition-shadow outline-none",
        "focus-visible:shadow-focus",
        "aria-invalid:shadow-[0_0_0_2px_color-mix(in_oklab,var(--danger)_45%,transparent)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-ui-sm file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
// Created by Swapnil Bapat © 2026
