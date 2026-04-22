"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FolderKanban, BookOpenText, Plus } from "lucide-react";

const navItems = [
  { title: "Projects", href: "/dashboard", icon: FolderKanban },
  { title: "Knowledge Base", href: "/kb", icon: BookOpenText },
];

export function TopNavbar() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[color:var(--border-subtle)] bg-[color:var(--surface)]/90 backdrop-blur-md"
      aria-label="Primary"
    >
      <div className="flex h-16 items-center px-6 gap-5 max-w-7xl mx-auto">
        <Link
          href="/dashboard"
          className="flex items-center min-w-fit outline-none rounded-[var(--radius-sm2)] focus-visible:shadow-focus"
          aria-label="HPB AI home"
        >
          <img src="/hpb-logo.png" alt="HPB" className="h-10 w-auto object-contain" />
        </Link>

        <div className="h-7 w-px bg-[color:var(--border)]" />

        <nav className="flex items-center gap-0.5" role="navigation" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm2)]",
                  "text-ui transition-colors outline-none",
                  "focus-visible:shadow-focus",
                  isActive
                    ? "bg-[color:var(--canvas)] text-foreground shadow-inset-edge"
                    : "text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)]/60"
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="default">
            <Link href="/projects/new">
              <Plus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
// Created by Swapnil Bapat © 2026
