import * as React from "react"
import { Eyebrow } from "@/components/ui/eyebrow"
import { cn } from "@/lib/utils"

type Props = {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

function PageHeader({ eyebrow, title, description, action, className }: Props) {
  return (
    <header
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-3 pt-8 pb-6",
        "md:flex-row md:items-end md:justify-between md:gap-6",
        className
      )}
    >
      <div className="flex flex-col gap-2 min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="text-display-2 text-foreground">{title}</h1>
        {description && (
          <p className="text-body text-muted-foreground max-w-2xl">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </header>
  )
}

export { PageHeader }
// Created by Swapnil Bapat © 2026
