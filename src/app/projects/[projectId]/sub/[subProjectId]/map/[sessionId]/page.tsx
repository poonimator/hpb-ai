"use client";

import { useState, useEffect, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Loader2, Network, Plus, X, Check,
    Sparkles, BookOpen, Search, Lightbulb, FileText, RefreshCw,
    User
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { PageBar } from "@/components/layout/page-bar";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Mono } from "@/components/ui/mono";
import { QuoteCard } from "@/components/tools/quote-card";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";

interface SubProjectForRail {
    id: string;
    name: string;
    researchStatement?: string | null;
}

// --- Types ---
interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string; sessionId: string }>;
}

interface MappingTranscript {
    id: string;
    fileName: string;
    displayName: string;
}

interface MappingCluster {
    id: string;
    themeName: string;
    quote: string;
    context?: string;
    order: number;
    isManual: boolean;
    transcriptId: string;
    transcript: MappingTranscript;
}

interface MappingSession {
    id: string;
    name: string;
    status: string;
    themesJson?: string;
    clusters: MappingCluster[];
    transcripts: MappingTranscript[];
    createdAt: string;
    insightsJson?: string;
}

interface InsightItem {
    text: string;
    citation?: string | null;
    citation_match: "VALIDATION" | "CONTRADICTION" | "RELATED" | "NONE";
    citation_reason?: string | null;
    transcript_tags?: string[];
}

interface InsightsData {
    found_out: InsightItem[];
    look_further: InsightItem[];
    new_areas: InsightItem[];
}

// --- Constants & Helpers ---
const TAG_COLORS = [
    { bg: "bg-[color:var(--cat-1-soft)]", text: "text-[color:var(--cat-1)]", border: "border-[color:var(--cat-1)]/25", icon: "text-[color:var(--cat-1)]" },
    { bg: "bg-[color:var(--cat-2-soft)]", text: "text-[color:var(--cat-2)]", border: "border-[color:var(--cat-2)]/25", icon: "text-[color:var(--cat-2)]" },
    { bg: "bg-[color:var(--cat-3-soft)]", text: "text-[color:var(--cat-3)]", border: "border-[color:var(--cat-3)]/25", icon: "text-[color:var(--cat-3)]" },
    { bg: "bg-[color:var(--cat-4-soft)]", text: "text-[color:var(--cat-4)]", border: "border-[color:var(--cat-4)]/25", icon: "text-[color:var(--cat-4)]" },
    { bg: "bg-[color:var(--cat-5-soft)]", text: "text-[color:var(--cat-5)]", border: "border-[color:var(--cat-5)]/25", icon: "text-[color:var(--cat-5)]" },
];

function getTagStyle(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_COLORS.length;
    return TAG_COLORS[index];
}

// Parse quote field (may be JSON array or plain string)
function parseQuotes(raw: string): string[] {
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return [raw];
    } catch {
        return [raw];
    }
}

// --- Components ---

function AddCardInput({
    themeName,
    transcripts,
    onCancel,
    onAdd
}: {
    themeName: string;
    transcripts: MappingTranscript[];
    onCancel: () => void;
    onAdd: (transcriptId: string, text: string) => void;
}) {
    const [text, setText] = useState("");
    const [selectedTranscriptId, setSelectedTranscriptId] = useState(transcripts[0]?.id || "");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim() || !selectedTranscriptId) return;
        onAdd(selectedTranscriptId, text.trim());
    };

    return (
        <div className="rounded-[12px] bg-[color:var(--surface)] shadow-inset-edge p-2 mb-3 animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <select
                    value={selectedTranscriptId}
                    onChange={(e) => setSelectedTranscriptId(e.target.value)}
                    className="w-full text-[11px] p-1.5 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--surface)] focus:ring-1 focus:ring-[color:var(--knowledge)] outline-none"
                    autoFocus
                >
                    {transcripts.map(t => (
                        <option key={t.id} value={t.id}>{t.displayName}</option>
                    ))}
                </select>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter observation/quote..."
                    className="w-full text-[11px] p-2 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--surface)] min-h-[60px] resize-none focus:ring-1 focus:ring-[color:var(--knowledge)] outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <div className="flex gap-1 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1 rounded-[6px] text-muted-foreground hover:bg-[color:var(--surface-muted)] transition-colors"
                        aria-label="Cancel"
                    >
                        <X className="h-4 w-4" />
                    </button>
                    <button
                        type="submit"
                        className="p-1 rounded-[6px] text-[color:var(--primary)] bg-[color:var(--primary-soft)] hover:brightness-95 transition-all"
                        aria-label="Add card"
                    >
                        <Check className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}

// --- Insights Components ---

function InsightCard({ item }: { item: InsightItem }) {
    return (
        <div className="rounded-[14px] p-5 bg-[color:var(--surface)] shadow-outline-ring">
            <p className="text-[13px] text-foreground font-medium leading-relaxed">
                {item.text}
            </p>

            {/* Citation Section */}
            {item.citation && (
                <div className="mt-3 pt-3 border-t border-[color:var(--border-subtle)] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Eyebrow className="gap-1">
                            <BookOpen className="h-3 w-3" />
                            Research Context
                        </Eyebrow>
                        {item.citation_match !== "NONE" && (
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[9px] px-1.5 py-0 h-4 border shadow-inset-edge",
                                    item.citation_match === 'VALIDATION' && "bg-[color:var(--primary-soft)] text-[color:var(--primary)] border-transparent",
                                    item.citation_match === 'CONTRADICTION' && "bg-[color:var(--danger-soft)] text-[color:var(--danger)] border-transparent",
                                    item.citation_match === 'RELATED' && "bg-[color:var(--info-soft)] text-[color:var(--info)] border-transparent",
                                )}
                            >
                                {item.citation_match}
                            </Badge>
                        )}
                    </div>

                    <div className="flex flex-col gap-1.5 rounded-[10px] bg-[color:var(--surface-muted)] shadow-inset-edge p-2.5">
                        <div className="flex items-start gap-1.5">
                            <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-70 text-muted-foreground" />
                            <span className="text-[11.5px] text-muted-foreground italic leading-snug break-words line-clamp-2" title={item.citation}>
                                {item.citation}
                            </span>
                        </div>
                        {item.citation_reason && (
                            <p className="text-[10.5px] text-muted-foreground leading-normal pl-[18px] border-l-2 border-[color:var(--border-subtle)] ml-0.5">
                                {item.citation_reason}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Transcript Tags */}
            {item.transcript_tags && item.transcript_tags.length > 0 && (
                <div
                    className={cn(
                        "flex flex-wrap gap-1",
                        item.citation ? "mt-2" : "mt-3 pt-3 border-t border-[color:var(--border-subtle)]",
                    )}
                >
                    {item.transcript_tags.map(tag => {
                        const style = getTagStyle(tag);
                        return (
                            <div
                                key={tag}
                                className={cn(
                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-md2)] border text-[9px] font-bold uppercase tracking-wider",
                                    style.bg, style.text, style.border,
                                )}
                            >
                                <User className={cn("h-2 w-2", style.icon)} />
                                <span>{tag}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function InsightsView({
    data,
    loading,
}: {
    data: InsightsData | null;
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
                <div className="relative h-14 w-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-[color:var(--primary-soft)] animate-pulse" />
                    <Loader2 className="h-7 w-7 text-[color:var(--primary)] animate-spin relative z-10" />
                </div>
                <h3 className="mt-6 text-lg font-semibold text-foreground">
                    Analysing Patterns
                </h3>
                <Eyebrow className="mt-1 justify-center text-[color:var(--primary)]">
                    Research Cross-Validation
                </Eyebrow>
                <p className="text-[12px] text-muted-foreground text-center max-w-md mt-2">
                    Cross-referencing behavioural frameworks…
                </p>
            </div>
        );
    }

    if (!data) return null;

    const cols = [
        {
            key: "found_out" as const,
            items: data.found_out || [],
            iconWrap: "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
            icon: <Check className="h-4 w-4" />,
            title: "What have we found out?",
            sub: "Validated by existing research",
        },
        {
            key: "look_further" as const,
            items: data.look_further || [],
            iconWrap: "bg-[color:var(--warning-soft)] text-[color:var(--warning)]",
            icon: <Search className="h-4 w-4" />,
            title: "What to look further into?",
            sub: "Ambiguities & contradictions",
        },
        {
            key: "new_areas" as const,
            items: data.new_areas || [],
            iconWrap: "bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)]",
            icon: <Lightbulb className="h-4 w-4" />,
            title: "New areas to explore?",
            sub: "Novel findings & opportunities",
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {cols.map((col, ci) => (
                <div key={col.key} className="flex flex-col gap-3">
                    <div className="sticky top-0 z-10 bg-[color:var(--canvas)] pb-3 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                            <div className={cn(
                                "p-1.5 rounded-[8px] shadow-inset-edge flex items-center justify-center",
                                col.iconWrap,
                            )}>
                                {col.icon}
                            </div>
                            <h3 className="font-semibold text-foreground text-sm">{col.title}</h3>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground pl-9">{col.sub}</p>
                    </div>
                    <div className="space-y-3">
                        {col.items.map((item, i) => (
                            <div
                                key={i}
                                className="animate-in slide-in-from-bottom-2 fade-in duration-500"
                                style={{ animationDelay: `${i * 100 + ci * 100}ms` }}
                            >
                                <InsightCard item={item} />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// --- Main Page ---

export default function MappingSessionPage({ params }: PageProps) {
    const { projectId, subProjectId, sessionId } = use(params);
    const router = useRouter();

    const [session, setSession] = useState<MappingSession | null>(null);
    const [localClusters, setLocalClusters] = useState<MappingCluster[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingToTheme, setAddingToTheme] = useState<string | null>(null);
    const [enabled, setEnabled] = useState(false); // For DND strict mode

    // Insights State
    const [viewMode, setViewMode] = useState<"mapping" | "insights">("mapping");
    const [insightsData, setInsightsData] = useState<InsightsData | null>(null);
    const [generatingInsights, setGeneratingInsights] = useState(false);

    // Workspace rail data
    const [subProject, setSubProject] = useState<SubProjectForRail | null>(null);

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/sub-projects/${subProjectId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled || !data?.data) return;
                setSubProject({
                    id: data.data.id,
                    name: data.data.name,
                    researchStatement: data.data.researchStatement ?? null,
                });
            } catch (err) {
                console.error("Failed to fetch workspace for rail", err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [subProjectId]);

    useEffect(() => {
        fetchSession();
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const res = await fetch(`/api/mapping/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                const s = data.data;
                setSession(s);
                // Initial sort
                setLocalClusters(s.clusters.sort((a: any, b: any) => a.order - b.order));

                if (s.status === "PROCESSING") setTimeout(fetchSession, 3000);

                // Load existing insights if present
                if (s.insightsJson) {
                    try {
                        setInsightsData(JSON.parse(s.insightsJson));
                        // Automatically set view mode if desired? No, let user choose.
                    } catch (e) {
                        console.error("Failed to parse existing insights", e);
                    }
                }

            } else {
                alert("Failed to load session");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate themes
    const themes = useMemo(() => {
        if (!session) return [];
        let t: string[] = [];
        try {
            if (session.themesJson) {
                t = JSON.parse(session.themesJson).map((x: any) => x.name);
            } else {
                t = Array.from(new Set(session.clusters.map(c => c.themeName)));
            }
        } catch {
            t = Array.from(new Set(session.clusters.map(c => c.themeName)));
        }
        return t;
    }, [session]);

    // Grouping for rendering
    const clustersByTheme = useMemo(() => {
        const groups: Record<string, MappingCluster[]> = {};
        themes.forEach(t => groups[t] = []);
        localClusters.forEach(c => {
            if (groups[c.themeName]) {
                groups[c.themeName].push(c);
            } else {
                // Fallback if theme mismatch
                if (!groups['Uncategorized']) groups['Uncategorized'] = [];
                groups['Uncategorized'].push(c);
            }
        });
        // Ensure sorted by order
        Object.keys(groups).forEach(k => {
            groups[k].sort((a, b) => a.order - b.order);
        });
        return groups;
    }, [themes, localClusters]);

    // --- Actions ---

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        const sourceTheme = source.droppableId;
        const destTheme = destination.droppableId;

        // Create new array
        const newClusters = [...localClusters];

        // Get items in source column
        const sourceItems = newClusters.filter(c => c.themeName === sourceTheme).sort((a, b) => a.order - b.order);
        const movedItem = sourceItems[source.index]; // Use index logic carefully

        if (!movedItem || movedItem.id !== draggableId) {
            // Safety check fallback
            return;
        }

        // Remove from source
        const remainingSource = sourceItems.filter(c => c.id !== draggableId);

        // Insert into dest
        let destItems = sourceTheme === destTheme ? remainingSource : newClusters.filter(c => c.themeName === destTheme).sort((a, b) => a.order - b.order);
        destItems.splice(destination.index, 0, { ...movedItem, themeName: destTheme });

        // Update orders for both columns
        const updates: any[] = [];

        // Re-index dest
        destItems.forEach((c, idx) => {
            c.order = idx;
            updates.push({ id: c.id, order: idx, themeName: destTheme });
        });

        // If different columns, re-index source too
        if (sourceTheme !== destTheme) {
            remainingSource.forEach((c, idx) => {
                c.order = idx;
                updates.push({ id: c.id, order: idx, themeName: sourceTheme });
            });
        }

        // Update local state (merge updates)
        const updatedMap = new Map(updates.map(u => [u.id, u]));
        const finalClusters = newClusters.map(c => {
            const up = updatedMap.get(c.id);
            return up ? { ...c, ...up } : c;
        });

        setLocalClusters(finalClusters);

        // API Call
        try {
            await fetch(`/api/mapping/${sessionId}/clusters/batch`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates })
            });
        } catch (err) {
            console.error("Failed to save reorder", err);
            // Revert? (Complex, skip for now)
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this card?")) return;

        // Optimistic
        setLocalClusters(prev => prev.filter(c => c.id !== id));

        try {
            await fetch(`/api/mapping/${sessionId}/clusters/${id}`, { method: "DELETE" });
        } catch (err) {
            alert("Failed to delete");
            fetchSession(); // Revert
        }
    };

    const handleAdd = async (transcriptId: string, text: string) => {
        if (!addingToTheme) return;
        const matchedTranscript = session?.transcripts.find(t => t.id === transcriptId);
        if (!matchedTranscript) return;

        // Pseudo ID for optimistic
        const tempId = "temp-" + Date.now();
        const theme = addingToTheme;

        const newCluster: MappingCluster = {
            id: tempId,
            themeName: theme,
            quote: text,
            context: "Manual Entry",
            transcriptId,
            transcript: matchedTranscript,
            order: 0, // Should be 0 if at top, or logic? User said "Add button... between title and FIRST card".
            // So render input at top implies adding to top?
            // If adding to top, order should be -1 relative to others, or re-index.
            // Let's assume Add adds to TOP (index 0).
            isManual: true
        };

        // Shift others down?
        const existingInTheme = localClusters.filter(c => c.themeName === theme).map(c => ({ ...c, order: c.order + 1 }));
        const others = localClusters.filter(c => c.themeName !== theme);
        setLocalClusters([newCluster, ...existingInTheme, ...others]);
        setAddingToTheme(null);

        try {
            const res = await fetch(`/api/mapping/${sessionId}/clusters`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    themeName: theme,
                    quote: text,
                    transcriptId,
                    order: 0
                })
            });
            // On success, we should eventually refresh to get real ID,
            // but for now we might leave it or silence background refresh.
            // Better: update the ID in local state if the list is stable.
            if (res.ok) {
                const data = await res.json();
                setLocalClusters(prev => prev.map(c => c.id === tempId ? { ...c, id: data.cluster.id } : c));
            }
        } catch (err) {
            alert("Failed to add");
            fetchSession();
        }
    };

    const handleToggleView = async () => {
        if (viewMode === "insights") {
            setViewMode("mapping");
            return;
        }

        // Switching to insights
        setViewMode("insights");

        // If we already have data (from DB or previous fetch), don't reload unless forced
        if (!insightsData) {
            await fetchInsights(false);
        }
    };

    const fetchInsights = async (regenerate: boolean) => {
        setGeneratingInsights(true);
        try {
            // pass ?regenerate=true if needed
            const url = `/api/mapping/${sessionId}/insights${regenerate ? '?regenerate=true' : ''}`;
            const res = await fetch(url, { method: "POST" });

            if (res.ok) {
                const json = await res.json();
                setInsightsData(json.data);
            } else {
                alert("Failed to generate insights. Please try again.");
                if (!insightsData) setViewMode("mapping"); // Only revert if we have nothing
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred.");
            if (!insightsData) setViewMode("mapping");
        } finally {
            setGeneratingInsights(false);
        }
    }

    const handleRegenerate = () => {
        if (confirm("Regenerate insights? This will overwrite the current analyses.")) {
            fetchInsights(true);
        }
    };

    // --- Render ---

    if (loading || !session) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--surface)]/80 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative h-12 w-12 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-[color:var(--primary-soft)] animate-pulse" />
                        <Loader2 className="h-6 w-6 text-[color:var(--primary)] animate-spin relative z-10" />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium text-foreground">Loading</span>
                        <Eyebrow className="text-[color:var(--primary)]">Initialising Workspace</Eyebrow>
                    </div>
                </div>
            </div>
        );
    }

    if (!enabled) return null; // Wait for DND

    const viewToggle = (
        <>
            {viewMode === "insights" && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={generatingInsights}
                >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Regenerate Insights
                </Button>
            )}
            <Button
                variant={viewMode === "insights" ? "secondary" : "outline"}
                size="sm"
                onClick={handleToggleView}
            >
                {viewMode === "insights" ? (
                    <>
                        <Network className="h-3.5 w-3.5" />
                        View Mapping
                    </>
                ) : (
                    <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Insights View
                    </>
                )}
            </Button>
        </>
    );

    const uniqueThemeCount = new Set(localClusters.map(c => c.themeName)).size;
    const sourcesCount = session.transcripts?.length ?? 0;

    const leftRail = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Synthesis</Badge>
                </div>
                <h2 className="text-display-4 text-foreground leading-tight">
                    {session?.name || "Mapping"}
                </h2>
                {subProject?.researchStatement && (
                    <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {subProject.researchStatement}
                    </p>
                )}
            </RailHeader>

            <RailSection title="Batch">
                <MetaRow k="Clusters" v={localClusters.length} />
                <MetaRow k="Themes" v={uniqueThemeCount} />
                <MetaRow k="Sources" v={sourcesCount} />
                <MetaRow k="Status" v={session?.status || "—"} />
            </RailSection>

            {session?.transcripts && session.transcripts.length > 0 && (
                <RailSection title="Sources">
                    <div className="flex flex-col gap-1.5">
                        {session.transcripts.slice(0, 6).map((t: any) => (
                            <div key={t.id} className="text-body-sm text-foreground truncate">
                                {t.displayName || t.fileName || "Transcript"}
                            </div>
                        ))}
                        {session.transcripts.length > 6 && (
                            <span className="text-caption text-muted-foreground">
                                +{session.transcripts.length - 6} more
                            </span>
                        )}
                    </div>
                </RailSection>
            )}

            <div className="flex-1" />
        </>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{
                    href: `/projects/${projectId}/sub/${subProjectId}?tab=mapping`,
                    label: "Back",
                }}
                crumbs={[
                    { label: "Mapping", href: `/projects/${projectId}/sub/${subProjectId}?tab=mapping` },
                    { label: session.name },
                ]}
                action={viewToggle}
            />

            <WorkspaceFrame variant="review" leftRail={leftRail} scrollContained>
                {viewMode === "insights" ? (
                    <InsightsView
                        data={insightsData}
                        loading={generatingInsights}
                    />
                ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
                        <div className="flex gap-4 min-w-max pb-12">
                            {themes.map((theme) => {
                                const columnClusters = clustersByTheme[theme] || [];

                                return (
                                    <Droppable key={theme} droppableId={theme}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className="w-[280px] shrink-0 flex flex-col rounded-[14px] p-4 gap-3"
                                            >
                                                {/* Column Header */}
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <Eyebrow className="line-clamp-2" title={theme}>
                                                            {theme}
                                                        </Eyebrow>
                                                        <Mono>{columnClusters.length}</Mono>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddingToTheme(theme)}
                                                        className="h-6 w-6 rounded-full bg-[color:var(--surface)] shadow-inset-edge text-muted-foreground hover:text-[color:var(--knowledge)] hover:brightness-95 flex items-center justify-center transition-colors shrink-0"
                                                        title={`Add to ${theme}`}
                                                        aria-label={`Add to ${theme}`}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                </div>

                                                {/* Add Composer */}
                                                {addingToTheme === theme && (
                                                    <AddCardInput
                                                        themeName={theme}
                                                        transcripts={session.transcripts}
                                                        onCancel={() => setAddingToTheme(null)}
                                                        onAdd={handleAdd}
                                                    />
                                                )}

                                                {/* Cards */}
                                                <div className="flex flex-col gap-3 relative min-h-[80px]">
                                                    {columnClusters.map((cluster, idx) => {
                                                        const quotes = parseQuotes(cluster.quote);
                                                        return (
                                                            <Draggable key={cluster.id} draggableId={cluster.id} index={idx}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        {...provided.dragHandleProps}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            rotate: snapshot.isDragging ? '2deg' : '0deg',
                                                                            scale: snapshot.isDragging ? '1.05' : '1'
                                                                        }}
                                                                    >
                                                                        <QuoteCard
                                                                            id={cluster.id}
                                                                            quotes={quotes}
                                                                            transcriptName={cluster.transcript.displayName}
                                                                            theme={cluster.themeName}
                                                                            isManual={cluster.isManual}
                                                                            onDelete={handleDelete}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    })}
                                                    {provided.placeholder}
                                                </div>
                                            </div>
                                        )}
                                    </Droppable>
                                );
                            })}
                        </div>
                    </DragDropContext>
                )}
            </WorkspaceFrame>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
