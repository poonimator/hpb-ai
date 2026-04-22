"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Projects", href: "/dashboard" },
  { title: "Knowledge Base", href: "/kb" },
];

export function TopNavbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[color:var(--border-subtle)] bg-[color:var(--surface)]/90 backdrop-blur-md"
      aria-label="Primary"
    >
      {/* Matches shared.jsx:165-200 TopNav — full-width, h-16, px-7, no max-width constraint */}
      <div className="flex h-16 items-center px-7">
        <Link
          href="/dashboard"
          className="flex items-center min-w-fit outline-none rounded-[var(--radius-sm2)] focus-visible:shadow-focus"
          aria-label="HPB AI home"
        >
          <img src="/hpb-logo.png" alt="HPB" className="h-10 w-auto object-contain" />
        </Link>

        {/* Divider: 1×28 with 24px left margin + 28px right margin (exploration exact) */}
        <div className="h-7 w-px bg-[color:var(--border)] ml-6 mr-7" />

        <nav
          className="flex items-center gap-5"
          role="navigation"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  // h-8 + px-2.5 + rounded-[8px] + text-[13.5px] font-medium — matches shared.jsx:178-192
                  "inline-flex items-center h-8 px-2.5 rounded-[8px]",
                  "text-[13.5px] font-medium tracking-[0.01em] transition-colors outline-none",
                  "focus-visible:shadow-focus",
                  isActive
                    ? "bg-[color:var(--canvas)] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
// Created by Swapnil Bapat © 2026
