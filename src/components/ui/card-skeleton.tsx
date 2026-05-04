import * as React from "react"
import { cn } from "@/lib/utils"

const shimmer =
  "relative overflow-hidden bg-[color:var(--surface-muted)] " +
  "before:absolute before:inset-0 before:-translate-x-full " +
  "before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent " +
  "before:animate-[shimmer_1.4s_infinite]"

function Bar({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("h-3 rounded-[4px]", shimmer, className)}
      {...props}
    />
  )
}

function CardSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-skeleton"
      className={cn(
        "rounded-[var(--radius-card-lg)] bg-[color:var(--surface)] p-6",
        "shadow-outline-ring flex flex-col gap-3",
        className
      )}
      {...props}
    >
      <Bar className="w-1/3" />
      <Bar className="w-full" />
      <Bar className="w-5/6" />
      <Bar className="w-2/3" />
    </div>
  )
}

export { CardSkeleton }
// Created by Swapnil Bapat © 2026
