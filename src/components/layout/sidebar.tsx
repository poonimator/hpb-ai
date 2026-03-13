"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    FolderKanban,
    Settings,
    ChevronLeft,
    ChevronRight,
    BookOpenText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Simplified navigation - projects contain their own pages now
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
        description: "Shared frameworks, policies, and research",
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "flex flex-col h-[calc(100vh-2rem)] my-4 ml-4 rounded-md bg-card border border-border transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Header/Logo */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-border">
                {!collapsed && (
                    <div className="flex items-center">
                        <img
                            src="/hpb-logo.png"
                            alt="HPB Logo"
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCollapsed(!collapsed)}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                    {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                                isActive
                                    ? "bg-accent text-foreground border border-border"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            {!collapsed && <span>{item.title}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Warning Banner */}
            {!collapsed && (
                <div className="px-3 py-3 mx-2 mb-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
                        ⚠️ Rehearsal output is training only and cannot inform synthesis.
                    </p>
                </div>
            )}

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border">
                {!collapsed && (
                    <p className="text-[10px] text-muted-foreground">
                        Internal HPB Tool • v0.1.0
                    </p>
                )}
            </div>
        </aside>
    );
}
// Created by Swapnil Bapat © 2026
