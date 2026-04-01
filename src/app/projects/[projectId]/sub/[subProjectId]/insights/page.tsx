"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Lightbulb,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Sparkles,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    BookOpen,
    Target,
    Zap,
    Trash2,
    FileText,
    ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────

interface HighlightedPart {
    text: string;
    issue: string;
}

interface InsightCriteria {
    name: string;
    verdict: "PASS" | "PARTIAL" | "FAIL";
    explanation: string;
    highlightedParts: HighlightedPart[];
    suggestedImprovement: string;
}

interface ResearchEvidence {
    source: string;
    quote: string;
    connection: string;
}

interface ResearchAlignment {
    isAligned: boolean;
    explanation: string;
    soWhat?: string;
    relevantFindings: string[];
    evidence?: ResearchEvidence[];
}

interface StatementAnnotation {
    text: string;
    note: string;
    sentiment: "strength" | "issue" | "neutral";
}

interface InsightCritiqueResult {
    overallVerdict: "PASS" | "NEEDS_WORK" | "FAIL";
    overallSummary: string;
    criteria: InsightCriteria[];
    researchAlignment: ResearchAlignment;
    statementBreakdown?: StatementAnnotation[];
}

interface HistoryEntry {
    id: string;
    insightStatement: string;
    critique: InsightCritiqueResult;
    timestamp: Date;
}

interface SubProject {
    id: string;
    name: string;
    researchStatement: string;
    project: {
        id: string;
        name: string;
    };
}

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

// ─── Constants ───────────────────────────────────────────────────────────

const CRITERIA_ICONS: Record<string, typeof Target> = {
    "Well-Informed": BookOpen,
    "More Than an Observation": Lightbulb,
    "So What?": Target,
    "Sticky": Sparkles,
    "Actionable": Zap,
};

const VERDICT_CONFIG = {
    PASS: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", leftBorder: "border-l-emerald-400", icon: CheckCircle2, label: "Pass" },
    PARTIAL: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", leftBorder: "border-l-amber-400", icon: AlertTriangle, label: "Needs Work" },
    FAIL: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", leftBorder: "border-l-red-400", icon: XCircle, label: "Fail" },
    NEEDS_WORK: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", leftBorder: "border-l-amber-400", icon: AlertTriangle, label: "Needs Work" },
};

// ─── Helper Components ───────────────────────────────────────────────────

function InsightFormula() {
    return (
        <div className="flex items-center justify-center gap-3 flex-wrap text-sm text-muted-foreground mb-10">
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">Well-Informed</span>
            <span className="text-primary font-bold text-lg">&middot;</span>
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">More Than an Observation</span>
            <span className="text-primary font-bold text-lg">&middot;</span>
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">So What?</span>
            <span className="text-primary font-bold text-lg">&middot;</span>
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">Sticky</span>
            <span className="text-primary font-bold text-lg">&middot;</span>
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">Actionable</span>
        </div>
    );
}

function HighlightedInsight({ statement, highlights }: {
    statement: string;
    highlights: HighlightedPart[];
}) {
    if (!highlights || highlights.length === 0) {
        return <span>{statement}</span>;
    }

    // Build intervals and mark highlighted ranges
    const parts: { text: string; highlight: HighlightedPart | null; startIdx: number }[] = [];

    // Sort highlights by position in the statement
    const sortedHighlights = [...highlights]
        .map(h => ({ ...h, index: statement.toLowerCase().indexOf(h.text.toLowerCase()) }))
        .filter(h => h.index >= 0)
        .sort((a, b) => a.index - b.index);

    if (sortedHighlights.length === 0) {
        return <span>{statement}</span>;
    }

    let lastEnd = 0;
    for (const h of sortedHighlights) {
        if (h.index > lastEnd) {
            parts.push({ text: statement.substring(lastEnd, h.index), highlight: null, startIdx: lastEnd });
        }
        if (h.index >= lastEnd) {
            parts.push({ text: statement.substring(h.index, h.index + h.text.length), highlight: h, startIdx: h.index });
            lastEnd = h.index + h.text.length;
        }
    }
    if (lastEnd < statement.length) {
        parts.push({ text: statement.substring(lastEnd), highlight: null, startIdx: lastEnd });
    }

    return (
        <span>
            {parts.map((part, i) =>
                part.highlight ? (
                    <span
                        key={i}
                        className="relative inline group/highlight"
                    >
                        <span className="bg-amber-200/60 border-b-2 border-amber-400 px-0.5 rounded-sm cursor-help transition-colors hover:bg-amber-200/90">
                            {part.text}
                        </span>
                        {/* Tooltip */}
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 px-3 py-2 bg-white text-foreground text-xs leading-relaxed rounded-lg shadow-xl border border-border opacity-0 group-hover/highlight:opacity-100 transition-opacity duration-200 pointer-events-none break-words z-20">
                            {part.highlight.issue}
                            <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white" />
                        </span>
                    </span>
                ) : (
                    <span key={i}>{part.text}</span>
                )
            )}
        </span>
    );
}

// ─── Annotated Insight with Connector Lines ────────────────────────────────

function parseAnnotatedParts(statement: string, annotations: StatementAnnotation[]) {
    const stmtLower = statement.toLowerCase();

    // Try to find each annotation in the statement
    const withPositions = annotations.map((a, origIdx) => {
        let searchText = a.text.toLowerCase();
        let idx = stmtLower.indexOf(searchText);

        return { ...a, origIdx, index: idx, matchLength: searchText.length };
    }).filter(a => a.index >= 0);

    // Sort by position in the statement
    withPositions.sort((a, b) => a.index - b.index);

    // Resolve overlaps: if two annotations overlap, keep the one that starts first
    const resolved: typeof withPositions = [];
    let lastEnd = 0;
    for (const a of withPositions) {
        if (a.index >= lastEnd) {
            resolved.push(a);
            lastEnd = a.index + a.matchLength;
        } else {
            // Try to find this text further in the statement (past lastEnd)
            const laterIdx = stmtLower.indexOf(stmtLower.substring(a.index, a.index + a.matchLength), lastEnd);
            if (laterIdx >= 0) {
                resolved.push({ ...a, index: laterIdx });
                lastEnd = laterIdx + a.matchLength;
            }
        }
    }

    // Re-sort after potential repositioning
    resolved.sort((a, b) => a.index - b.index);

    const parts: { text: string; annIdx: number | null }[] = [];
    let cursor = 0;
    for (const a of resolved) {
        if (a.index > cursor) {
            parts.push({ text: statement.substring(cursor, a.index), annIdx: null });
        }
        parts.push({ text: statement.substring(a.index, a.index + a.matchLength), annIdx: a.origIdx });
        cursor = a.index + a.matchLength;
    }
    if (cursor < statement.length) {
        parts.push({ text: statement.substring(cursor), annIdx: null });
    }
    return { parts, sorted: resolved };
}

// Each annotation gets a unique colour so you can trace which highlight matches which card
const ANNOTATION_PALETTE = [
    { text: "text-emerald-700", mark: "bg-emerald-200/60", bg: "bg-emerald-50", border: "border-emerald-200" },
    { text: "text-amber-700", mark: "bg-amber-200/60", bg: "bg-amber-50", border: "border-amber-200" },
    { text: "text-sky-700", mark: "bg-sky-200/60", bg: "bg-sky-50", border: "border-sky-200" },
    { text: "text-violet-700", mark: "bg-violet-200/60", bg: "bg-violet-50", border: "border-violet-200" },
    { text: "text-rose-700", mark: "bg-rose-200/60", bg: "bg-rose-50", border: "border-rose-200" },
];

function AnnotatedInsight({ statement, annotations }: {
    statement: string;
    annotations: StatementAnnotation[];
}) {
    const { parts } = parseAnnotatedParts(statement, annotations);

    return (
        <div>
            {/* Insight Statement with background highlights */}
            <p className="text-xl md:text-2xl font-bold text-center leading-relaxed px-4 text-foreground mb-6">
                {parts.map((part, i) => {
                    if (part.annIdx !== null) {
                        const colors = ANNOTATION_PALETTE[part.annIdx % ANNOTATION_PALETTE.length];
                        return (
                            <span key={i} className={`${colors.mark} rounded-sm px-0.5`}>
                                {part.text}
                            </span>
                        );
                    }
                    return <span key={i}>{part.text}</span>;
                })}
            </p>

            {/* Annotation cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {annotations.map((ann, i) => {
                    const colors = ANNOTATION_PALETTE[i % ANNOTATION_PALETTE.length];
                    const tagLabel = ann.sentiment === "strength" ? "Strength" : ann.sentiment === "issue" ? "Issue" : "Neutral";
                    return (
                        <div
                            key={i}
                            className={`text-[11px] leading-relaxed px-3 py-2.5 rounded-lg border ${colors.bg} ${colors.border} ${colors.text}`}
                        >
                            <div className="mb-2"><span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/80 text-foreground/70 border border-border/40">{tagLabel}</span></div>
                            <p className={`font-semibold mb-1 ${colors.mark} rounded-sm inline`}>
                                &ldquo;{ann.text}&rdquo;
                            </p>
                            <p className="mt-1">{ann.note}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function VerdictBadge({ verdict }: { verdict: string }) {
    const config = VERDICT_CONFIG[verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.NEEDS_WORK;
    const Icon = config.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${config.bg} ${config.color} ${config.border} border`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
}

function CritiqueDisplay({ entry, onDelete }: { entry: HistoryEntry; onDelete: (id: string) => void }) {
    const { critique, insightStatement } = entry;

    return (
        <div id={`insight-critique-${entry.id}`} className="animate-in slide-in-from-bottom-3 fade-in duration-500">
            {/* Insight Statement + verdict */}
            <div className="bg-white rounded-2xl border border-border p-6 mb-3 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                        Checked at {entry.timestamp.toLocaleTimeString()}
                    </p>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete this critique"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>

                <p className="text-lg font-semibold text-foreground leading-relaxed">
                    {insightStatement}
                </p>

                <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3 mt-4">
                    {critique.overallSummary}
                </p>
            </div>

            {/* 5 Criteria — single card with divided rows, all expanded */}
            <div className="bg-white rounded-xl border border-border p-4 mb-3 shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">5-Criteria Assessment</p>
                <div className="divide-y divide-border/60">
                    {[...critique.criteria].sort((a, b) => {
                        const order: Record<string, number> = { PASS: 0, PARTIAL: 1, NEEDS_WORK: 1, FAIL: 2 };
                        return (order[a.verdict] ?? 1) - (order[b.verdict] ?? 1);
                    }).map((c, i) => {
                        const Icon = CRITERIA_ICONS[c.name] || Target;
                        const config = VERDICT_CONFIG[c.verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.PARTIAL;
                        const VIcon = config.icon;

                        return (
                            <div key={i} className="py-2.5">
                                <div className="flex items-center gap-3 px-2">
                                    <VIcon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                                    <span className="text-[13px] font-medium text-foreground flex-1 min-w-0">{c.name}</span>
                                    <span className={`text-[11px] font-bold uppercase tracking-wide ${config.color}`}>{config.label}</span>
                                </div>
                                <div className="pl-9 pr-2 pt-1.5">
                                    <p className="text-xs text-muted-foreground leading-relaxed">{c.explanation}</p>
                                    {c.suggestedImprovement && (
                                        <div className="bg-muted/30 rounded-md p-2 border border-border/60 mt-2">
                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                <span className="font-semibold text-foreground">Tip: </span>{c.suggestedImprovement}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}

// ─── Main Page Component ─────────────────────────────────────────────────

export default function InsightsPage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const [subProject, setSubProject] = useState<SubProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [insightInput, setInsightInput] = useState("");
    const [isChecking, setIsChecking] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const historyRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const scrollToId = searchParams.get("scrollTo");

    // Fetch history from API
    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/insight-critiques`);
            const data = await res.json();
            if (data.success && data.data) {
                setHistory(data.data.map((c: any) => {
                    try {
                        return {
                            id: c.id,
                            insightStatement: c.insightStatement,
                            critique: JSON.parse(c.critiqueJson),
                            timestamp: new Date(c.createdAt),
                        };
                    } catch {
                        return null;
                    }
                }).filter(Boolean) as HistoryEntry[]);
            }
        } catch (err) {
            console.error("[Insights] Failed to fetch history:", err);
        } finally {
            setIsHistoryLoaded(true);
        }
    }, [subProjectId]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    // One-time localStorage cleanup
    useEffect(() => {
        try {
            localStorage.removeItem("insight_critique_history_" + subProjectId);
        } catch {}
    }, [subProjectId]);

    // Scroll to specific critique if scrollTo param is present
    useEffect(() => {
        if (scrollToId && isHistoryLoaded && history.length > 0) {
            const el = document.getElementById(`insight-critique-${scrollToId}`);
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 300);
            }
        }
    }, [scrollToId, isHistoryLoaded, history]);

    useEffect(() => {
        fetchSubProject();
    }, [subProjectId]);

    const fetchSubProject = async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();
            if (res.ok) {
                setSubProject(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch sub-project:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/insight-critiques/${id}`, { method: "DELETE" });
            if (res.ok) {
                setHistory(prev => prev.filter(e => e.id !== id));
            } else {
                alert("Failed to delete");
            }
        } catch {
            alert("Failed to delete");
        }
    }, [subProjectId]);

    const handleCheck = async () => {
        if (!insightInput.trim() || isChecking) return;

        const statement = insightInput.trim();
        setIsChecking(true);

        try {
            const res = await fetch("/api/gemini/insight-critique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    insightStatement: statement,
                    projectId,
                    subProjectId,
                    researchStatement: subProject?.researchStatement,
                }),
            });

            const data = await res.json();

            if (data.success && data.data) {
                setInsightInput("");
                await fetchHistory();

                // Scroll to results
                setTimeout(() => {
                    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 300);
            } else {
                alert(data.error || "Failed to critique insight statement");
            }
        } catch (err) {
            console.error("Insight critique error:", err);
            alert("Failed to check insight statement. Please try again.");
        } finally {
            setIsChecking(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleCheck();
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden pb-20">
            <div className="py-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground mb-8">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Projects</Link>
                    <span className="text-border">/</span>
                    <Link href={`/projects/${projectId}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                        {subProject?.project.name || "Project"}
                    </Link>
                    <span className="text-border">/</span>
                    <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=insights`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
                        {subProject?.name || "Workspace"}
                    </Link>
                    <span className="text-border">/</span>
                    <span className="text-foreground">Insight Statements</span>
                </div>

                {/* Page Title */}
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary mb-4">
                            <Lightbulb className="h-3.5 w-3.5" />
                            INSIGHT ANALYSER
                        </div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                            Insight Statement Analyser
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                            Critique your insight statements against 5 quality criteria and your project&apos;s research.
                        </p>
                    </div>

                    {/* Insight Formula */}
                    <InsightFormula />

                    {/* Input Area */}
                    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6 transition-shadow hover:shadow-md">
                        <textarea
                            ref={inputRef}
                            value={insightInput}
                            onChange={(e) => setInsightInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your insight statement here..."
                            className="w-full resize-none border-0 bg-transparent text-foreground text-lg leading-relaxed focus:outline-none min-h-[80px] placeholder:text-muted-foreground/50"
                            disabled={isChecking}
                            rows={3}
                        />
                    </div>

                    {/* Check Button */}
                    <div className="flex justify-center mb-10">
                        <Button
                            onClick={handleCheck}
                            disabled={!insightInput.trim() || isChecking}
                            className="px-8 py-3 h-auto rounded-full text-sm font-bold uppercase tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg disabled:opacity-40"
                        >
                            {isChecking ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    Analysing...
                                </>
                            ) : history.length > 0 ? (
                                <>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Check Again
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Check
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Loading Animation */}
                    {isChecking && (
                        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-300">
                            <div className="relative mb-6">
                                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">Analysing your insight statement</p>
                            <p className="text-xs text-muted-foreground">Cross-referencing with your research knowledge base...</p>
                        </div>
                    )}

                    {/* History of Critiques */}
                    {history.length > 0 && (
                        <div ref={historyRef} className="mt-12">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    History
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <div className="space-y-10">
                                {history.map((entry) => (
                                    <CritiqueDisplay key={entry.id} entry={entry} onDelete={handleDelete} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
