"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    FolderKanban,
    BookOpenText,
    Plus,
} from "lucide-react";

const navItems = [
    {
        title: "Projects",
        href: "/dashboard",
        icon: FolderKanban,
    },
    {
        title: "Knowledge Base",
        href: "/kb",
        icon: BookOpenText,
    },
];

export function TopNavbar() {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-white backdrop-blur-sm">
            <div className="flex h-16 items-center px-6 gap-5 max-w-7xl mx-auto">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center min-w-fit">
                    <img
                        src="/hpb-logo.png"
                        alt="HPB Logo"
                        className="h-11 w-auto object-contain"
                    />
                </Link>

                {/* Separator */}
                <div className="h-7 w-px bg-border hidden sm:block" />

                {/* Navigation */}
                <nav className="flex items-center gap-1" role="navigation" aria-label="Main navigation">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-[var(--color-interact-subtle)] text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-[var(--color-interact-subtle)]"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* New Project Button */}
                <div className="ml-auto hidden md:block">
                    <Link
                        href="/projects/new"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        New Project
                    </Link>
                </div>
            </div>
        </header>
    );
}
// Created by Swapnil Bapat © 2026
