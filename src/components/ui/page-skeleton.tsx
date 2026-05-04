import * as React from "react"
import { CardSkeleton } from "@/components/ui/card-skeleton"
import { cn } from "@/lib/utils"

function PageSkeleton({
  className,
  cards = 3,
  ...props
}: React.ComponentProps<"div"> & { cards?: number }) {
  return (
    <div
      data-slot="page-skeleton"
      className={cn("w-full py-10", className)}
      aria-busy="true"
      aria-live="polite"
      {...props}
    >
      {/* Title block */}
      <div className="flex flex-col gap-3 mb-8 max-w-xl">
        <div
          className="h-3 w-24 rounded-[4px] bg-[color:var(--surface-muted)]
            relative overflow-hidden before:absolute before:inset-0
            before:-translate-x-full before:bg-gradient-to-r
            before:from-transparent before:via-white/40 before:to-transparent
            before:animate-[shimmer_1.4s_infinite]"
          aria-hidden
        />
        <div
          className="h-7 w-2/3 rounded-[6px] bg-[color:var(--surface-muted)]
            relative overflow-hidden before:absolute before:inset-0
            before:-translate-x-full before:bg-gradient-to-r
            before:from-transparent before:via-white/40 before:to-transparent
            before:animate-[shimmer_1.4s_infinite]"
          aria-hidden
        />
      </div>

      {/* Card grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export { PageSkeleton }
// Created by Swapnil Bapat © 2026
