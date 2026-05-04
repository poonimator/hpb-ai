import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  [
    "inline-flex items-center justify-center gap-1 w-fit whitespace-nowrap shrink-0 overflow-hidden",
    "rounded-[var(--radius-pill)] px-2.5 py-0.5 text-ui-sm",
    "shadow-inset-edge",
    "transition-[background-color,box-shadow,color]",
    "[&>svg]:size-3 [&>svg]:pointer-events-none",
    "outline-none focus-visible:shadow-focus",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--surface-muted)] text-foreground",
        primary:
          "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
        secondary:
          "bg-[color:var(--surface-muted)] text-foreground",
        info:
          "bg-[color:var(--info-soft)] text-[color:var(--info)]",
        success:
          "bg-[color:var(--success-soft)] text-[color:var(--success)]",
        warning:
          "bg-[color:var(--warning-soft)] text-[color:var(--warning)]",
        destructive:
          "bg-[color:var(--danger-soft)] text-[color:var(--danger)]",
        knowledge:
          "bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)]",
        outline:
          "bg-transparent text-foreground shadow-ring",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
// Created by Swapnil Bapat © 2026
