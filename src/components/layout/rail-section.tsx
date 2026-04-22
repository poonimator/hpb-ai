import * as React from "react"
import { Eyebrow } from "@/components/ui/eyebrow"
import { cn } from "@/lib/utils"

type Props = {
  title?: React.ReactNode
  last?: boolean
  className?: string
  children: React.ReactNode
}

function RailSection({ title, last, className, children }: Props) {
  return (
    <div
      data-slot="rail-section"
      className={cn(
        "px-5 py-[18px]",
        !last && "border-b border-[color:var(--border-subtle)]",
        className
      )}
    >
      {title && <div className="mb-2.5"><Eyebrow>{title}</Eyebrow></div>}
      {children}
    </div>
  )
}

export { RailSection }
// Created by Swapnil Bapat © 2026
