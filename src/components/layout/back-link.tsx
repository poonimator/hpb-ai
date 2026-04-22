"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  href?: string
  onClick?: () => void
  label?: string
  className?: string
}

function BackLink({ href, onClick, label = "Back", className }: Props) {
  const router = useRouter()

  const content = (
    <>
      <ChevronLeft className="h-3 w-3" strokeWidth={2} />
      <span>{label}</span>
    </>
  )

  const base = cn(
    "inline-flex items-center gap-1.5 h-7 px-2.5 -ml-2.5",
    "text-ui-sm text-muted-foreground hover:text-foreground",
    "bg-transparent hover:bg-[color:var(--surface-muted)]/50",
    "rounded-[var(--radius-sm2)] transition-colors outline-none",
    "focus-visible:shadow-focus",
    className
  )

  if (href) {
    return <Link href={href} className={base}>{content}</Link>
  }

  return (
    <button
      type="button"
      onClick={onClick ?? (() => router.back())}
      className={base}
    >
      {content}
    </button>
  )
}

export { BackLink }
// Created by Swapnil Bapat © 2026
