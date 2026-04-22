import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  [
    "relative w-full rounded-[var(--radius-card-lg)] px-5 py-4 text-body-sm",
    "grid has-[>svg]:grid-cols-[20px_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-1 items-start",
    "[&>svg]:size-[18px] [&>svg]:translate-y-0.5",
    "shadow-outline-ring",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--surface)] text-foreground [&>svg]:text-muted-foreground",
        info:
          "bg-[color:var(--info-soft)] text-foreground [&>svg]:text-[color:var(--info)] border-l-[3px] border-l-[color:var(--info)] pl-4",
        warning:
          "bg-[color:var(--warning-soft)] text-foreground [&>svg]:text-[color:var(--warning)] border-l-[3px] border-l-[color:var(--warning)] pl-4",
        destructive:
          "bg-[color:var(--danger-soft)] text-[color:var(--danger)] [&>svg]:text-[color:var(--danger)] border-l-[3px] border-l-[color:var(--danger)] pl-4 *:data-[slot=alert-description]:text-[color:var(--danger)]/85",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-2 min-h-4 text-display-5",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-body-sm text-muted-foreground [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
// Created by Swapnil Bapat © 2026
