import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-[var(--radius-card-lg)] bg-[color:var(--surface)] shadow-outline-ring",
        "py-16 px-8 gap-4",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12",
            "rounded-[var(--radius-card)] bg-[color:var(--surface-muted)]",
            "text-muted-foreground shadow-inset-edge",
            "[&>svg]:h-5 [&>svg]:w-5"
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-md">
        <h3 className="text-display-5 text-foreground">{title}</h3>
        {description && (
          <p className="text-body-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 mt-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
// Created by Swapnil Bapat © 2026
