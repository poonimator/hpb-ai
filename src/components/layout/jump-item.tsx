"use client"

import * as React from "react"
import { Mono } from "@/components/ui/mono"
import { cn } from "@/lib/utils"

type Props = {
  label: React.ReactNode
  count?: number | string
  active?: boolean
  onClick?: () => void
  className?: string
}

function JumpItem({ label, count, active, onClick, className }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-active={active ? "true" : undefined}
      data-slot="jump-item"
      className={cn(
        "flex items-center justify-between w-full text-left",
        "px-2.5 py-2 -ml-2.5 rounded-[var(--radius-sm2)]",
        "text-body-sm transition-colors outline-none",
        "focus-visible:shadow-focus",
        active
          ? "bg-[color:var(--canvas)] text-foreground font-medium shadow-inset-edge"
          : "bg-transparent text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <span>{label}</span>
      {count != null && <Mono>{count}</Mono>}
    </button>
  )
}

export { JumpItem }
// Created by Swapnil Bapat © 2026
