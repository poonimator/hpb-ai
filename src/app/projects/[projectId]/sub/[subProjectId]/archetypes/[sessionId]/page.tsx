"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Loader2,
    Users,
    Target,
    ShieldAlert,
    Flame,
    Eye,
    Zap,
    RefreshCw,
    HeartCrack,
    ChevronDown,
} from "lucide-react";

interface ArchetypeData {
    id: string;
    name: string;
    kicker: string | null;
    description: string;
    demographicJson: string | null;
    fullContentJson: string | null;
    order: number;
    archetypeSession: {
        id: string;
        subProject: {
            id: string;
            name: string;
            project: { id: string; name: string };
        };
    };
}

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string; sessionId: string }>;
}

function parse(json: string | null) {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
}

// Muted color palette matching the tab cards
const DETAIL_COLORS = [
    { bg: "from-slate-400/90 to-slate-500/90", accent: "text-foreground", accentBg: "bg-muted", border: "border-border" },
    { bg: "from-slate-400/85 to-slate-500/85", accent: "text-foreground", accentBg: "bg-muted", border: "border-border" },
    { bg: "from-zinc-400/85 to-zinc-500/85", accent: "text-foreground", accentBg: "bg-muted", border: "border-border" },
    { bg: "from-neutral-400/85 to-neutral-500/85", accent: "text-foreground", accentBg: "bg-muted", border: "border-border" },
    { bg: "from-sky-400/85 to-cyan-500/85", accent: "text-sky-700", accentBg: "bg-sky-50", border: "border-sky-100" },
    { bg: "from-violet-400/80 to-indigo-400/80", accent: "text-violet-700", accentBg: "bg-violet-50", border: "border-violet-100" },
    { bg: "from-stone-400/80 to-stone-500/80", accent: "text-stone-700", accentBg: "bg-stone-50", border: "border-stone-100" },
    { bg: "from-zinc-500/80 to-slate-600/80", accent: "text-foreground", accentBg: "bg-muted", border: "border-border" },
];

function BulletList({ items }: { items: string[] }) {
    if (!items || items.length === 0) return null;
    return (
        <ul className="space-y-2.5">
            {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[13px] text-muted-foreground leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-[7px] shrink-0" />
                    {item}
                </li>
            ))}
        </ul>
    );
}

function SectionCard({ title, accentColor, children }: {
    title: string; accentColor: string; children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-md border border-border p-5">
            <h3 className={`text-sm font-bold ${accentColor} mb-4`}>{title}</h3>
            {children}
        </div>
    );
}

export default function ArchetypeViewPage({ params }: PageProps) {
    const { projectId, subProjectId, sessionId: archetypeId } = use(params);
    const [archetype, setArchetype] = useState<ArchetypeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchArchetype();
    }, [archetypeId]);

    const fetchArchetype = async () => {
        try {
            const res = await fetch(`/api/archetypes/single/${archetypeId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch");
            setArchetype(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !archetype) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error || "Not found"}</p>
                    <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=archetypes`}>
                        <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const colorScheme = DETAIL_COLORS[archetype.order % DETAIL_COLORS.length];
    const fullContent = parse(archetype.fullContentJson);
    const demographic = parse(archetype.demographicJson);

    // Extract all sections from fullContent
    const influences = fullContent?.influences || [];
    const livedExperience = fullContent?.livedExperience || "";
    const behaviours = fullContent?.behaviours || [];
    const barriers = fullContent?.barriers || [];
    const motivations = fullContent?.motivations || [];
    const goals = fullContent?.goals || [];
    const habits = fullContent?.habits || [];
    const spiral = fullContent?.spiral;

    const accentColor = colorScheme.accent;

    return (
        <div className="min-h-screen bg-accent/30 pb-20">
            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Back */}
                <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=archetypes`} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 inline-flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3" />
                    Back to Workspace
                </Link>

                {/* Header — kicker, name, description */}
                <div className="mb-8">
                    {/* Kicker */}
                    {archetype.kicker && (
                        <p className="text-sm text-muted-foreground mb-2">
                            {archetype.kicker}
                        </p>
                    )}

                    {/* Name */}
                    <h1 className={`text-3xl md:text-4xl font-extrabold ${accentColor} tracking-tight leading-tight mb-4`}>
                        {archetype.name}
                    </h1>

                    {/* Description */}
                    <p className="text-muted-foreground text-[15px] leading-relaxed max-w-3xl">
                        {archetype.description}
                    </p>

                    {/* Demographic pills */}
                    {demographic && (
                        <div className="flex flex-wrap gap-2 mt-4">
                            {demographic.ageRange && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold ${colorScheme.accentBg} ${accentColor} border ${colorScheme.border}`}>
                                    {demographic.ageRange}
                                </span>
                            )}
                            {demographic.occupation && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-accent text-muted-foreground border border-border">
                                    {demographic.occupation}
                                </span>
                            )}
                            {demographic.livingSetup && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold bg-accent text-muted-foreground border border-border">
                                    {demographic.livingSetup}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-border mb-8" />

                {/* 2-Column Grid — matching sample layout */}
                <div className="grid md:grid-cols-2 gap-4">

                    {/* LEFT COLUMN: Influences, Behaviours, Barriers, Motivations */}

                    {/* Influences */}
                    {influences.length > 0 && (
                        <SectionCard title="Influences" accentColor={accentColor}>
                            <BulletList items={influences} />
                        </SectionCard>
                    )}

                    {/* Behaviours */}
                    {behaviours.length > 0 && (
                        <SectionCard title="Behaviours" accentColor={accentColor}>
                            <BulletList items={behaviours} />
                        </SectionCard>
                    )}

                    {/* Barriers */}
                    {barriers.length > 0 && (
                        <SectionCard title="Barriers" accentColor={accentColor}>
                            <BulletList items={barriers} />
                        </SectionCard>
                    )}

                    {/* Motivations */}
                    {motivations.length > 0 && (
                        <SectionCard title="Motivations" accentColor={accentColor}>
                            <BulletList items={motivations} />
                        </SectionCard>
                    )}

                    {/* RIGHT COLUMN: Lived Experience, Goals, Habits, The Spiral */}

                    {/* Their Lived Experience — tinted card */}
                    {livedExperience && (
                        <div className={`${colorScheme.accentBg} rounded-md border ${colorScheme.border} p-5`}>
                            <h3 className={`text-sm font-bold ${accentColor} mb-3`}>Their Lived Experience</h3>
                            <p className="text-[13px] text-foreground leading-relaxed">
                                {livedExperience}
                            </p>
                        </div>
                    )}

                    {/* Goals */}
                    {goals.length > 0 && (
                        <SectionCard title="Goals" accentColor={accentColor}>
                            <BulletList items={goals} />
                        </SectionCard>
                    )}

                    {/* Habits */}
                    {habits.length > 0 && (
                        <SectionCard title="Habits" accentColor={accentColor}>
                            <BulletList items={habits} />
                        </SectionCard>
                    )}

                    {/* The Spiral — tinted card, spans full width on right or wherever it falls */}
                    {spiral && (
                        <div className={`${colorScheme.accentBg} rounded-md border ${colorScheme.border} p-5`}>
                            <h3 className={`text-sm font-bold ${accentColor} mb-3`}>The Spiral</h3>
                            {spiral.pattern && (
                                <p className="text-[13px] text-foreground font-medium mb-4 leading-relaxed">
                                    {spiral.pattern}
                                </p>
                            )}
                            {spiral.avoidance && (
                                <div>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">How They Avoid It:</p>
                                    <p className="text-[13px] text-foreground leading-relaxed">
                                        {spiral.avoidance}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mode note */}
                <p className="text-[11px] text-muted-foreground mt-8 italic">
                    Archetype mode — a young person may shift between different modes depending on situation and support.
                </p>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
