"use client";

import { useState, useEffect, use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Loader2, Network, User, Download,
    ChevronDown, ChevronUp, Plus, Trash2, X, Check,
    Sparkles, BookOpen, Search, Lightbulb, FileText, ExternalLink
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";

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
    { bg: "bg-red-50", text: "text-red-700", border: "border-red-100", icon: "text-red-500" },
    { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", icon: "text-orange-500" },
    { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: "text-amber-500" },
    { bg: "bg-lime-50", text: "text-lime-700", border: "border-lime-100", icon: "text-lime-500" },
    { bg: "bg-stone-50", text: "text-stone-700", border: "border-stone-100", icon: "text-stone-500" },
    { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-100", icon: "text-cyan-500" },
    { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-100", icon: "text-sky-500" },
    { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: "text-blue-500" },
    { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-100", icon: "text-indigo-500" },
    { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-100", icon: "text-violet-500" },
    { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", icon: "text-purple-500" },
    { bg: "bg-fuchsia-50", text: "text-fuchsia-700", border: "border-fuchsia-100", icon: "text-fuchsia-500" },
    { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-100", icon: "text-pink-500" },
    { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", icon: "text-rose-500" },
];

function getTagStyle(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TAG_COLORS.length;
    return TAG_COLORS[index];
}

// --- Components ---

function AffinityCard({ cluster, onDelete }: { cluster: MappingCluster; onDelete: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false);

    // Parse quotes
    let quotes: string[] = [];
    try {
        const parsed = JSON.parse(cluster.quote);
        if (Array.isArray(parsed)) quotes = parsed;
        else quotes = [cluster.quote];
    } catch {
        quotes = [cluster.quote];
    }

    const hasMultiple = quotes.length > 1;
    const tagStyle = getTagStyle(cluster.transcript.displayName);

    return (
        <Card
            className={`
                group relative border-0 bg-white/80 backdrop-blur-sm
                shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] 
                transition-all duration-300 ease-out
                ring-1 ring-border hover:ring-violet-200/50
                rounded-xl
                ${cluster.isManual ? "border-l-2 border-l-violet-400 bg-violet-50/10" : ""}
            `}
        >
            {/* Delete Hook */}
            <button
                onClick={(e) => { e.stopPropagation(); onDelete(cluster.id); }}
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-all z-10"
                title="Delete Card"
            >
                <Trash2 className="h-3 w-3" />
            </button>

            <CardContent className="p-2 space-y-1.5 pl-3">
                <div className="relative pr-4">
                    <p className="text-[11px] text-muted-foreground leading-snug font-medium break-words">
                        "{quotes[0]}"
                    </p>
                    {expanded && quotes.slice(1).map((q, i) => (
                        <div key={i} className="mt-2 pt-2 border-t border-dashed border-border animate-in fade-in slide-in-from-top-1 duration-200">
                            <p className="text-[11px] text-muted-foreground leading-snug font-medium break-words">
                                "{q}"
                            </p>
                        </div>
                    ))}
                </div>

                <div className="flex items-end justify-between pt-0.5">
                    <div className="flex items-center gap-1.5">
                        <div className={`
                            inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider
                            ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}
                        `}>
                            <User className={`h-2.5 w-2.5 ${tagStyle.icon}`} />
                            <span className="truncate max-w-[80px]">{cluster.transcript.displayName}</span>
                        </div>
                        {cluster.isManual && (
                            <span className="text-[8px] text-violet-400 font-medium px-1 bg-violet-50 rounded border border-violet-100">
                                MANUAL
                            </span>
                        )}
                    </div>

                    {hasMultiple && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                            className="p-1 rounded-full bg-muted/50 hover:bg-muted/50 text-muted-foreground hover:text-[var(--color-knowledge)] transition-all"
                        >
                            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

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
        <div className="bg-accent/80 border border-[var(--color-knowledge-muted)] rounded-xl p-2 mb-3 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
                <select
                    value={selectedTranscriptId}
                    onChange={(e) => setSelectedTranscriptId(e.target.value)}
                    className="w-full text-xs p-1.5 rounded border border-border bg-white focus:ring-1 focus:ring-[var(--color-knowledge)] outline-none"
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
                    className="w-full text-xs p-2 rounded border border-border min-h-[60px] resize-none focus:ring-1 focus:ring-[var(--color-knowledge)] outline-none"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                />
                <div className="flex gap-2 justify-end">
                    <button type="button" onClick={onCancel} className="p-1 text-muted-foreground hover:text-muted-foreground">
                        <X className="h-4 w-4" />
                    </button>
                    <button type="submit" className="p-1 text-violet-600 hover:text-violet-700 bg-violet-50 rounded hover:bg-violet-100 transition-colors">
                        <Check className="h-4 w-4" />
                    </button>
                </div>
            </form>
        </div>
    );
}

// --- Insights Components ---

function InsightCard({ item, colorClass }: { item: InsightItem; colorClass: string }) {
    return (
        <Card className="relative overflow-hidden border-0 bg-white/60 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 ring-1 ring-white/50 group">
            {/* Top Blurred Accent */}
            <div className={`absolute -top-[2px] left-1/2 -translate-x-1/2 w-[50%] h-[4px] ${colorClass} opacity-20 blur-[5px] rounded-[100%]`} />

            <CardContent className="p-3 space-y-2 pt-4">
                <p className="text-sm text-foreground font-medium leading-relaxed">
                    {item.text}
                </p>

                {/* Citation Section - Only if citation exists */}
                {item.citation && (
                    <div className="mt-2 pt-2 border-t border-border/50 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                Research Context
                            </span>
                            {item.citation_match !== "NONE" && (
                                <Badge variant="outline" className={`
                                    text-[9px] px-1.5 py-0 h-4 border
                                    ${item.citation_match === 'VALIDATION' ? 'bg-accent text-primary border-border' : ''}
                                    ${item.citation_match === 'CONTRADICTION' ? 'bg-red-50 text-red-600 border-red-100' : ''}
                                    ${item.citation_match === 'RELATED' ? 'bg-blue-50 text-blue-600 border-blue-100' : ''}
                                `}>
                                    {item.citation_match}
                                </Badge>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5 bg-accent/50 p-2 rounded-md mb-2">
                            <div className="flex items-start gap-1.5">
                                <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 opacity-70 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground italic leading-snug break-words line-clamp-2" title={item.citation}>
                                    {item.citation}
                                </span>
                            </div>
                            {item.citation_reason && (
                                <p className="text-[10px] text-muted-foreground leading-normal pl-4.5 border-l-2 border-border ml-0.5">
                                    {item.citation_reason}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Transcript Tags (Always show if present, possibly separate from Research Context logic) */}
                {item.transcript_tags && item.transcript_tags.length > 0 && (
                    <div className={`flex flex-wrap gap-1 ${item.citation ? 'pt-0' : 'mt-2 pt-2 border-t border-border/50'}`}>
                        {item.transcript_tags.map(tag => {
                            const style = getTagStyle(tag);
                            return (
                                <div key={tag} className={`
                                        inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold uppercase tracking-wider
                                        ${style.bg} ${style.text} ${style.border}
                                    `}>
                                    <User className={`h-2 w-2 ${style.icon}`} />
                                    <span>{tag}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function InsightsView({
    data,
    loading,
    onRegenerate,
    onClose
}: {
    data: InsightsData | null;
    loading: boolean;
    onRegenerate: () => void;
    onClose: () => void;
}) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-1000">

                <div className="relative group">
                    {/* Outer Glow */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />

                    {/* Rotating Rings */}
                    <div className="relative h-24 w-24">
                        {/* Ring 1 - Slow Spin */}
                        <div className="absolute inset-0 rounded-full border border-white/20 border-t-violet-400/80 animate-[spin_3s_linear_infinite]" />

                        {/* Ring 2 - Fast Reverse Spin */}
                        <div className="absolute inset-2 rounded-full border border-white/10 border-b-fuchsia-400/80 animate-[spin_2s_linear_infinite_reverse]" />

                        {/* Core - Breathing */}
                        <div className="absolute inset-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
                            <div className="h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center space-y-3 relative z-10">
                    <h3 className="text-xl font-light tracking-tight text-foreground">
                        Analysing Patterns
                    </h3>
                    <div className="flex flex-col gap-1 items-center">
                        <p className="text-[11px] font-medium tracking-widest text-violet-500 uppercase">
                            RESEARCH CROSS-VALIDATION
                        </p>
                        <p className="text-[10px] text-muted-foreground animate-pulse">
                            Cross-referencing behavioral frameworks...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="shrink-0 pb-6 flex items-center justify-between px-4">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Research Insights</h2>
                    <p className="text-xs text-muted-foreground">Patterns cross-referenced with your Knowledge Base</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onRegenerate}
                        className="h-8 text-xs gap-1.5"
                    >
                        <Network className="h-3.5 w-3.5" />
                        Regenerate
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onClose}
                        className="h-8 w-8 p-0 text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 h-full overflow-y-auto pb-20">
                {/* Col 1: Found Out */}
                <div className="flex flex-col gap-4">
                    <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-transparent pb-4 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-md bg-muted text-primary">
                                <Check className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-foreground text-sm">What have we found out?</h3>
                        </div>
                        <p className="text-xs text-muted-foreground pl-9">Validated by existing research</p>
                    </div>
                    <div className="space-y-3">
                        {(data.found_out || []).map((item, i) => (
                            <div key={i} className="animate-in slide-in-from-bottom-2 fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                <InsightCard item={item} colorClass="bg-primary" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Col 2: Look Further */}
                <div className="flex flex-col gap-4">
                    <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-transparent pb-4 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-md bg-amber-100 text-amber-700">
                                <Search className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-foreground text-sm">What to look further into?</h3>
                        </div>
                        <p className="text-xs text-muted-foreground pl-9">Ambiguities & contradictions</p>
                    </div>
                    <div className="space-y-3">
                        {(data.look_further || []).map((item, i) => (
                            <div key={i} className="animate-in slide-in-from-bottom-2 fade-in duration-500" style={{ animationDelay: `${i * 100 + 100}ms` }}>
                                <InsightCard item={item} colorClass="bg-amber-400" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Col 3: New Areas */}
                <div className="flex flex-col gap-4">
                    <div className="sticky top-0 z-10 bg-gradient-to-b from-white via-white/95 to-transparent pb-4 pt-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 rounded-md bg-violet-100 text-violet-700">
                                <Lightbulb className="h-4 w-4" />
                            </div>
                            <h3 className="font-bold text-foreground text-sm">New areas to explore?</h3>
                        </div>
                        <p className="text-xs text-muted-foreground pl-9">Novel findings & opportunities</p>
                    </div>
                    <div className="space-y-3">
                        {(data.new_areas || []).map((item, i) => (
                            <div key={i} className="animate-in slide-in-from-bottom-2 fade-in duration-500" style={{ animationDelay: `${i * 100 + 200}ms` }}>
                                <InsightCard item={item} colorClass="bg-violet-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
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

    useEffect(() => {
        const animation = requestAnimationFrame(() => setEnabled(true));
        return () => {
            cancelAnimationFrame(animation);
            setEnabled(false);
        };
    }, []);

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

        // Pseudo ID for optimistic
        const tempId = "temp-" + Date.now();
        const theme = addingToTheme;
        const currentCount = clustersByTheme[theme].length;

        const newCluster: MappingCluster = {
            id: tempId,
            themeName: theme,
            quote: text,
            context: "Manual Entry",
            transcriptId,
            // Find transcript obj
            transcript: session?.transcripts.find(t => t.id === transcriptId)!,
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xl">
                <div className="flex flex-col items-center gap-6">
                    {/* Loader */}
                    <div className="relative h-12 w-12 transform rotate-45">
                        <div className="absolute inset-0 border-2 border-violet-200 rounded-lg animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        <div className="absolute inset-0 border-2 border-violet-500 rounded-lg animate-[spin_3s_linear_infinite]" />
                        <div className="absolute inset-3 bg-violet-600 rounded-sm animate-pulse" />
                    </div>

                    <div className="flex flex-col items-center gap-1">
                        <span className="text-sm font-medium text-foreground tracking-wide">Loading</span>
                        <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Initializing Workspace</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!enabled) return null; // Wait for DND

    return (
        <div className="min-h-screen flex flex-col relative">
            {/* Sticky Header */}
            <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur-md transition-all duration-200 border-b border-border/40">
                <div className="w-full px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}?tab=mapping`}
                                className="group p-1.5 rounded-full hover:bg-muted transition-all text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
                            </Link>
                            {/* Title ... */}
                            <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-4 w-4 rounded bg-violet-100 flex items-center justify-center text-violet-600">
                                        <Network className="h-2.5 w-2.5" />
                                    </div>
                                    <h1 className="text-base font-bold text-foreground tracking-tight leading-none">
                                        {session.name}
                                    </h1>
                                    <span className="text-muted-foreground/50 text-xs">|</span>
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {session.clusters.length} insights • {themes.length} themes
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Button
                                variant={viewMode === "insights" ? "secondary" : "ghost"}
                                size="sm"
                                onClick={handleToggleView}
                                className={cn(
                                    "h-8 rounded-lg font-medium text-xs transition-all duration-300",
                                    viewMode === "insights"
                                        ? "bg-violet-100 text-violet-700 hover:bg-violet-200"
                                        : "text-muted-foreground hover:bg-accent hover:text-violet-600"
                                )}
                            >
                                {viewMode === "insights" ? (
                                    <>
                                        <Network className="h-3.5 w-3.5 mr-1.5" />
                                        View Mapping
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                        Insights View
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8 relative">
                {viewMode === "insights" ? (
                    <InsightsView
                        data={insightsData}
                        loading={generatingInsights}
                        onRegenerate={handleRegenerate}
                        onClose={() => setViewMode("mapping")}
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
                                                className="w-[260px] flex flex-col gap-3 group h-full"
                                            >
                                                {/* Column Header */}
                                                <div className="sticky top-0 z-10 py-2 mb-1 flex items-start justify-between gap-2 bg-white/50 backdrop-blur-sm rounded-lg">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <h3 className="font-bold text-foreground text-xs tracking-tight uppercase line-clamp-2 leading-tight break-words" title={theme}>
                                                            {theme}
                                                        </h3>
                                                    </div>

                                                </div>

                                                {/* Add Button Area */}
                                                {addingToTheme === theme ? (
                                                    <AddCardInput
                                                        themeName={theme}
                                                        transcripts={session.transcripts}
                                                        onCancel={() => setAddingToTheme(null)}
                                                        onAdd={handleAdd}
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => setAddingToTheme(theme)}
                                                        className="w-full py-1 border border-dashed border-border rounded-lg text-muted-foreground/50 hover:text-violet-600 hover:border-[var(--color-knowledge)] hover:bg-[var(--color-knowledge-muted)] transition-all text-[10px] flex items-center justify-center gap-1 opacity-100 hover:opacity-100 duration-200 mb-1"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                    </button>
                                                )}

                                                {/* Cards */}
                                                <div className="flex flex-col gap-3 relative min-h-[100px]">
                                                    {/* Track Line */}
                                                    <div className="absolute left-3 top-0 bottom-0 w-px bg-gradient-to-b from-border to-transparent -z-10" />

                                                    {columnClusters.map((cluster, idx) => (
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
                                                                    <AffinityCard cluster={cluster} onDelete={handleDelete} />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
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
            </main>
        </div >
    );
}
// Created by Swapnil Bapat © 2026
