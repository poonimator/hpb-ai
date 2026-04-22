"use client"

import * as React from "react"
import { BackLink } from "@/components/layout/back-link"
import { cn } from "@/lib/utils"

export type Crumb = { label: string; href?: string }

type Props = {
  back?: { href?: string; onClick?: () => void; label?: string }
  crumbs?: Crumb[]
  action?: React.ReactNode
  className?: string
  sticky?: boolean
}

function PageBar({ back, crumbs, action, className, sticky = true }: Props) {
  return (
    <div
      data-slot="page-bar"
      className={cn(
        sticky && "sticky top-16 z-40",
        "w-full bg-[color:var(--surface)] border-b border-[color:var(--border-subtle)]",
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          {back && <BackLink href={back.href} onClick={back.onClick} label={back.label} />}
          {back && crumbs && <div className="h-5 w-px bg-[color:var(--border)]" />}
          {crumbs && crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0 text-body-sm text-muted-foreground">
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1
                const sep = (
                  <span key={`sep-${i}`} className="text-muted-foreground/50 select-none" aria-hidden>
                    /
                  </span>
                )
                const item = c.href && !last ? (
                  <a
                    key={c.label}
                    href={c.href}
                    className="hover:text-foreground transition-colors truncate"
                  >
                    {c.label}
                  </a>
                ) : (
                  <span
                    key={c.label}
                    className={cn(
                      "truncate",
                      last && "text-foreground font-medium"
                    )}
                  >
                    {c.label}
                  </span>
                )
                return i === 0 ? item : [sep, item]
              })}
            </nav>
          )}
        </div>
        {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
      </div>
    </div>
  )
}

export { PageBar }
// Created by Swapnil Bapat © 2026
