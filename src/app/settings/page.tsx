"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, Key, Info, Sparkles, Loader2, ShieldCheck } from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";

const NAV_ITEMS = [
    { id: "database", label: "Database", icon: Database },
    { id: "api", label: "API configuration", icon: Key },
    { id: "about", label: "About", icon: Info },
] as const;

export default function SettingsPage() {
    const [seeding, setSeeding] = useState(false);

    const seedDatabase = async () => {
        setSeeding(true);
        try {
            const res = await fetch("/api/seed");
            const data = await res.json();
            if (data.success) {
                toast.success(`Database seeded. Created ${data.data.personaCount} personas.`);
            } else {
                toast.error(data.error || "Failed to seed database");
            }
        } catch (err) {
            toast.error("Failed to seed database");
            console.error(err);
        } finally {
            setSeeding(false);
        }
    };

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const leftRail = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Admin</Badge>
                </div>
                <h2 className="text-display-4 text-foreground leading-tight">
                    Settings
                </h2>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                    Configure this HPB MHE AI instance.
                </p>
            </RailHeader>

            <RailSection title="Instance">
                <MetaRow k="Version" v="1.0.0" />
                <MetaRow k="Framework" v="Next.js 16" />
            </RailSection>

            <RailSection title="Jump to">
                <div className="flex flex-col gap-0.5">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => scrollTo(item.id)}
                                className="group flex items-center gap-2.5 w-full px-2 py-2 rounded-[8px] text-left text-muted-foreground hover:bg-[color:var(--surface-muted)] hover:text-foreground transition-colors"
                            >
                                <Icon className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-ui-sm truncate">{item.label}</span>
                            </button>
                        );
                    })}
                </div>
            </RailSection>
        </>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: "/dashboard", label: "Back" }}
                crumbs={[{ label: "Settings" }]}
            />

            <WorkspaceFrame variant="review" scrollContained leftRail={leftRail}>
                <div className="max-w-3xl flex flex-col gap-6">
                    <section id="database" className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6 scroll-mt-8">
                        <div className="flex items-start gap-3 mb-5">
                            <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center shrink-0">
                                <Database className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-display-4 text-foreground leading-tight">Database</h2>
                                <p className="text-body-sm text-muted-foreground mt-1">
                                    Manage your local SQLite database.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[10px] bg-[color:var(--surface-muted)] border border-[color:var(--border-subtle)] p-4 flex items-center justify-between mb-5">
                            <div>
                                <p className="text-sm text-foreground">Database location</p>
                                <p className="text-xs text-muted-foreground font-mono mt-0.5">./data/app.db</p>
                            </div>
                            <Badge variant="secondary">Connected</Badge>
                        </div>

                        <div className="border-t border-[color:var(--border-subtle)] pt-5">
                            <h4 className="text-ui-sm font-medium text-foreground mb-1">Seed database</h4>
                            <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                                Populate the database with sample personas for testing. Safe to run multiple times.
                            </p>
                            <Button onClick={seedDatabase} variant="outline" size="sm" disabled={seeding}>
                                {seeding ? (
                                    <>
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        Seeding…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Seed sample personas
                                    </>
                                )}
                            </Button>
                        </div>
                    </section>

                    <section id="api" className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6 scroll-mt-8">
                        <div className="flex items-start gap-3 mb-5">
                            <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center shrink-0">
                                <Key className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-display-4 text-foreground leading-tight">API configuration</h2>
                                <p className="text-body-sm text-muted-foreground mt-1">
                                    External service integrations.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-[10px] bg-[color:var(--surface-muted)] border border-[color:var(--border-subtle)] p-4 mb-4">
                            <p className="text-sm text-foreground">OpenAI API</p>
                            <p className="text-xs text-muted-foreground mt-0.5">For AI persona simulation and coaching.</p>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">
                            Set <code className="text-foreground bg-[color:var(--surface-muted)] px-1.5 py-0.5 rounded border border-[color:var(--border-subtle)] text-[11px]">OPENAI_API_KEY</code> in your <code className="text-foreground bg-[color:var(--surface-muted)] px-1.5 py-0.5 rounded border border-[color:var(--border-subtle)] text-[11px]">.env.local</code> to enable.
                        </p>
                    </section>

                    <section id="about" className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6 scroll-mt-8">
                        <div className="flex items-start gap-3 mb-5">
                            <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center shrink-0">
                                <Info className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-display-4 text-foreground leading-tight">About</h2>
                                <p className="text-body-sm text-muted-foreground mt-1">
                                    Instance metadata and compliance notice.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <p className="text-caption uppercase tracking-wider text-muted-foreground">Version</p>
                                <p className="text-sm text-foreground font-medium mt-1">1.0.0</p>
                            </div>
                            <div>
                                <p className="text-caption uppercase tracking-wider text-muted-foreground">Framework</p>
                                <p className="text-sm text-foreground font-medium mt-1">Next.js 16 (App Router)</p>
                            </div>
                        </div>

                        <div className="rounded-[10px] bg-[color:var(--warning-soft)] border border-[color:var(--warning)]/25 p-4 flex items-start gap-3">
                            <ShieldCheck className="h-4 w-4 text-[color:var(--warning)] shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-[color:var(--warning)] mb-1">
                                    Internal tool — HPB use only
                                </p>
                                <p className="text-[12px] text-muted-foreground leading-relaxed">
                                    Rehearsal output is training only and cannot inform synthesis. All sessions are logged for audit purposes.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </WorkspaceFrame>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
