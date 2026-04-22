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
        // Edge-to-edge breakout: bar itself spans viewport, content goes edge-to-edge with own px-8
        "w-screen ml-[calc(50%_-_50vw)]",
        "bg-[color:var(--surface)] border-b border-[color:var(--border-subtle)]",
        className
      )}
    >
      {/* py-[14px] px-8 — matches session-review-v2.jsx:320-322 padding: '14px 32px' */}
      <div className="py-[14px] px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          {back && <BackLink href={back.href} onClick={back.onClick} label={back.label} />}
          {back && crumbs && (
            // Divider: w-px h-[22px] — matches session-review-v2.jsx:333 width:1,height:22
            <div className="w-px h-[22px] bg-[color:var(--border)]" />
          )}
          {crumbs && crumbs.length > 0 && (
            // text-[12.5px] font-medium — matches session-review-v2.jsx:334
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 min-w-0 text-[12.5px] font-medium text-muted-foreground"
            >
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1
                const sep = (
                  <span key={`sep-${i}`} className="opacity-50 select-none" aria-hidden>
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
                      // last crumb: text-foreground font-semibold — matches session-review-v2.jsx:339
                      last && "text-foreground font-semibold"
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
