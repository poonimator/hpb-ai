"use client";

import { useState, useEffect, use, useRef, useCallback } from "react";
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
    BookOpen,
    Target,
    Zap,
    Trash2,
    Plus,
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { Badge } from "@/components/ui/badge";
import { Mono } from "@/components/ui/mono";
import { cn } from "@/lib/utils";
import { LensCard, adaptCriteria } from "@/components/tools/lens-card";

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

interface CriteriaCritiqueInline {
    criterion: string;
    verdict: "PASS" | "PARTIAL" | "FAIL";
    explanation: string;
    suggestion?: string;
}

interface StatementAnnotation {
    text: string;
    note?: string;
    rationale?: string;
    criteriaCritique?: string | CriteriaCritiqueInline;
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
    ageRange?: string | null;
    lifeStage?: string | null;
    createdAt?: string | null;
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
    PASS: { fg: "text-[color:var(--success)]", bg: "bg-[color:var(--success-soft)]", border: "border-[color:var(--success-soft)]", icon: CheckCircle2, label: "Pass" },
    PARTIAL: { fg: "text-[color:var(--warning)]", bg: "bg-[color:var(--warning-soft)]", border: "border-[color:var(--warning-soft)]", icon: AlertTriangle, label: "Needs Work" },
    FAIL: { fg: "text-[color:var(--danger)]", bg: "bg-[color:var(--danger-soft)]", border: "border-[color:var(--danger-soft)]", icon: XCircle, label: "Fail" },
    NEEDS_WORK: { fg: "text-[color:var(--warning)]", bg: "bg-[color:var(--warning-soft)]", border: "border-[color:var(--warning-soft)]", icon: AlertTriangle, label: "Needs Work" },
};

function scoreFromVerdict(v: string | undefined) {
    if (v === "PASS") return 5;
    if (v === "NEEDS_WORK") return 3;
    if (v === "FAIL") return 1;
    return 0;
}

// ─── Helper Components ───────────────────────────────────────────────────

const CRITERIA_LABELS = [
    "Well-Informed",
    "More Than an Observation",
    "So What?",
    "Sticky",
    "Actionable",
];

function InsightFormula() {
    return (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
            {CRITERIA_LABELS.map((label, i) => (
                <span key={label} className="inline-flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 text-ui-sm font-semibold text-[color:var(--primary)] shadow-inset-edge">
                        {label}
                    </span>
                    {i < CRITERIA_LABELS.length - 1 && (
                        <span className="text-caption text-[color:var(--primary)]/60">&middot;</span>
                    )}
                </span>
            ))}
        </div>
    );
}

// ─── Annotated Insight (highlighted spans + cards) ──────────────────────

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

function AnnotatedInsight({ statement, annotations }: {
    statement: string;
    annotations: StatementAnnotation[];
}) {
    const { parts } = parseAnnotatedParts(statement, annotations);

    return (
        <div>
            {/* Insight Statement with subtle highlight underlay */}
            <p className="text-display-4 text-center leading-snug text-foreground mb-6">
                {parts.map((part, i) => {
                    if (part.annIdx !== null) {
                        return (
                            <span
                                key={i}
                                className="rounded-sm bg-[color:var(--primary-soft)] px-0.5 shadow-inset-edge"
                            >
                                {part.text}
                            </span>
                        );
                    }
                    return <span key={i}>{part.text}</span>;
                })}
            </p>

            {/* Annotation cards grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {annotations.map((ann, i) => {
                    const hasCriteria = typeof ann.criteriaCritique === "object" && ann.criteriaCritique !== null;
                    return (
                        <div
                            key={i}
                            className="flex flex-col gap-2 overflow-hidden rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] p-3 shadow-outline-ring"
                        >
                            {ann.rationale && (
                                <div className="flex items-start gap-2 rounded-[10px] bg-[color:var(--surface-muted)] px-2.5 py-2 shadow-inset-edge">
                                    <Lightbulb className="mt-0.5 size-3 shrink-0 text-[color:var(--primary)]" strokeWidth={1.5} />
                                    <p className="text-caption leading-relaxed text-muted-foreground">
                                        {ann.rationale}
                                    </p>
                                </div>
                            )}
                            <p className="text-body-sm font-semibold leading-snug text-foreground">
                                &ldquo;{ann.text}&rdquo;
                            </p>
                            {hasCriteria ? (
                                <LensCard
                                    lens={adaptCriteria(ann.criteriaCritique as CriteriaCritiqueInline)}
                                />
                            ) : (
                                ann.criteriaCritique ? (
                                    <p className="text-caption leading-relaxed text-muted-foreground">
                                        {ann.criteriaCritique as string}
                                    </p>
                                ) : (
                                    ann.note && <p className="text-caption leading-relaxed text-muted-foreground">{ann.note}</p>
                                )
                            )}
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
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-ui-sm font-bold ${config.bg} ${config.fg} ${config.border}`}>
            <Icon className="size-3.5" />
            {config.label}
        </span>
    );
}

function CritiqueDisplay({ entry, onDelete }: { entry: HistoryEntry; onDelete: (id: string) => void }) {
    const { critique, insightStatement } = entry;
    const hasAnnotatedBreakdown = critique.statementBreakdown && critique.statementBreakdown.length > 0
        && critique.statementBreakdown.some((a: any) => a.criteriaCritique || a.rationale);

    return (
        <div id={`insight-critique-${entry.id}`} className="animate-in slide-in-from-bottom-3 fade-in duration-500 space-y-3">
            {/* Insight Statement + annotations */}
            <div className="rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] p-6 shadow-outline-ring">
                <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <VerdictBadge verdict={critique.overallVerdict} />
                        <span className="text-caption uppercase tracking-wide text-muted-foreground">
                            Checked at {entry.timestamp.toLocaleTimeString()}
                        </span>
                    </div>
                    <button
                        onClick={() => onDelete(entry.id)}
                        className="rounded-[10px] p-1.5 text-muted-foreground/60 transition-colors hover:bg-[color:var(--danger-soft)] hover:text-[color:var(--danger)]"
                        title="Delete this critique"
                    >
                        <Trash2 className="size-3.5" />
                    </button>
                </div>

                {hasAnnotatedBreakdown ? (
                    <AnnotatedInsight statement={insightStatement} annotations={critique.statementBreakdown!} />
                ) : (
                    <p className="text-display-4 leading-snug text-foreground">
                        {insightStatement}
                    </p>
                )}

                <p className="mt-5 border-t border-[color:var(--border-subtle)] pt-4 text-body-sm leading-relaxed text-muted-foreground">
                    {critique.overallSummary}
                </p>
            </div>

            {/* Fallback: show legacy 5-criteria cards if no inline annotations */}
            {!hasAnnotatedBreakdown && critique.criteria && critique.criteria.length > 0 && (
                <div className="rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] p-5 shadow-outline-ring">
                    <p className="mb-3 text-ui-sm font-bold uppercase tracking-widest text-muted-foreground">
                        5-Criteria Assessment
                    </p>
                    <div className="flex flex-col gap-2">
                        {[...critique.criteria].sort((a, b) => {
                            const order: Record<string, number> = { PASS: 0, PARTIAL: 1, NEEDS_WORK: 1, FAIL: 2 };
                            return (order[a.verdict] ?? 1) - (order[b.verdict] ?? 1);
                        }).map((c, i) => (
                            <LensCard
                                key={i}
                                lens={{
                                    name: c.name,
                                    verdict: c.verdict,
                                    rationale: c.explanation,
                                    suggestion: c.suggestedImprovement || null,
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
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
            <div className="flex flex-1 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 size-10 animate-spin text-[color:var(--primary)]" />
                    <p className="text-body-sm text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    const crumbs = subProject
        ? [
            { label: subProject.project.name, href: `/projects/${projectId}` },
            { label: subProject.name, href: `/projects/${projectId}/sub/${subProjectId}?tab=insights` },
            { label: "Insight Analyser" },
        ]
        : undefined;

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{
                    href: `/projects/${projectId}/sub/${subProjectId}?tab=insights`,
                    label: "Back",
                }}
                crumbs={crumbs}
            />

            <WorkspaceFrame
                variant="review"
                scrollContained
                leftRail={
                    <>
                        <RailHeader>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Tool</Badge>
                            </div>
                            <h2 className="text-display-4 text-foreground leading-tight">
                                Insight Statement Analyser
                            </h2>
                            <p className="text-body-sm text-muted-foreground leading-relaxed">
                                Critique insight statements against the 5 insight criteria (Well-Informed, More Than an Observation, So What?, Sticky, Actionable).
                            </p>
                        </RailHeader>

                        <RailSection title="History">
                            {history.length === 0 ? (
                                <p className="text-body-sm text-muted-foreground">No analyses yet.</p>
                            ) : (
                                <div className="flex flex-col">
                                    {history.slice(0, 8).map((entry, i) => {
                                        const score = scoreFromVerdict(entry.critique.overallVerdict);
                                        const isActive = i === 0;
                                        const isLast = i === Math.min(history.length, 8) - 1;
                                        return (
                                            <div key={entry.id} className="relative pl-[18px] pt-1 pb-3">
                                                <span
                                                    className={cn(
                                                        "absolute left-1 top-2.5 w-[9px] h-[9px] rounded-full",
                                                        isActive
                                                            ? "bg-[color:var(--primary)] shadow-[0_0_0_3px_var(--primary-soft)]"
                                                            : "bg-[color:var(--surface)] shadow-inset-edge"
                                                    )}
                                                />
                                                {!isLast && (
                                                    <span className="absolute left-[8px] top-[22px] bottom-0 w-px bg-[color:var(--border)]" />
                                                )}
                                                <div className="flex items-center justify-between mb-1">
                                                    <Mono className="text-[11px] text-muted-foreground">
                                                        {new Date(entry.timestamp || entry.id).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                                    </Mono>
                                                    {isActive && (
                                                        <span className="text-[9.5px] font-bold tracking-[0.1em] text-[color:var(--primary)]">
                                                            ACTIVE
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const el = document.getElementById(`insight-critique-${entry.id}`);
                                                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                    }}
                                                    className={cn(
                                                        "text-left text-body-sm leading-snug line-clamp-2",
                                                        isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {entry.insightStatement}
                                                </button>
                                                <div className="flex gap-0.5 mt-1.5">
                                                    {[1, 2, 3, 4, 5].map((n) => (
                                                        <span
                                                            key={n}
                                                            className={cn(
                                                                "h-[3px] w-3.5 rounded-full",
                                                                n <= score ? "bg-[color:var(--primary)]" : "bg-[color:var(--border)]"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </RailSection>

                        <div className="flex-1" />

                        <div className="px-8 py-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full justify-center"
                                onClick={() => inputRef.current?.focus()}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                New insight
                            </Button>
                        </div>
                    </>
                }
            >
                <div className="animate-in fade-in duration-500">
                    <div className="mx-auto max-w-3xl">
                        {/* Page intro */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 inline-flex size-10 items-center justify-center rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge">
                            <Lightbulb className="size-5" strokeWidth={1.5} />
                        </div>
                        <h1 className="mb-2 text-display-4 font-semibold text-foreground">
                            Insight Statement Analyser
                        </h1>
                        <p className="mx-auto max-w-lg text-body-sm text-muted-foreground">
                            Critique your insight statements against 5 quality criteria, enriched with
                            LUMA&apos;s human-centred design principles and your project&apos;s research.
                        </p>
                    </div>

                    {/* Criteria Formula */}
                    <InsightFormula />

                    {/* Composer */}
                    <div className="mb-6 rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] p-5 shadow-composer">
                        <label className="mb-2 block text-ui-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Your insight statement
                        </label>
                        <textarea
                            ref={inputRef}
                            value={insightInput}
                            onChange={(e) => setInsightInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your insight statement here..."
                            className="w-full resize-none border-0 bg-transparent text-display-4 leading-snug text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[80px]"
                            disabled={isChecking}
                            rows={3}
                        />
                    </div>

                    {/* Check Button */}
                    <div className="mb-10 flex justify-center">
                        <Button
                            onClick={handleCheck}
                            disabled={!insightInput.trim() || isChecking}
                            size="lg"
                            className="h-11 rounded-full px-8 text-ui-sm font-bold uppercase tracking-wide bg-[color:var(--primary)] text-[color:var(--primary-fg)] hover:bg-[color:var(--primary-hover)] shadow-card transition-all duration-200 hover:shadow-warm-lift disabled:opacity-40"
                        >
                            {isChecking ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Analysing...
                                </>
                            ) : history.length > 0 ? (
                                <>
                                    <RotateCcw className="mr-2 size-4" />
                                    Check Again
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 size-4" />
                                    Check
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Loading Animation */}
                    {isChecking && (
                        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-300">
                            <div className="relative mb-6">
                                <div className="flex size-16 items-center justify-center rounded-full bg-[color:var(--primary-soft)] shadow-inset-edge">
                                    <Loader2 className="size-8 animate-spin text-[color:var(--primary)]" />
                                </div>
                                <div
                                    className="absolute inset-0 rounded-full border-2 border-[color:var(--primary)]/20 animate-ping"
                                    style={{ animationDuration: "2s" }}
                                />
                            </div>
                            <p className="mb-1 text-body-sm font-medium text-foreground">
                                Analysing your insight statement
                            </p>
                            <p className="text-caption text-muted-foreground">
                                Cross-referencing with your research knowledge base...
                            </p>
                        </div>
                    )}

                    {/* History of Critiques */}
                    {history.length > 0 && (
                        <div ref={historyRef} className="mt-12">
                            <div className="mb-8 flex items-center gap-3">
                                <div className="h-px flex-1 bg-[color:var(--border-subtle)]" />
                                <span className="text-ui-sm font-bold uppercase tracking-widest text-muted-foreground">
                                    History
                                </span>
                                <div className="h-px flex-1 bg-[color:var(--border-subtle)]" />
                            </div>

                            <div className="space-y-8">
                                {history.map((entry) => (
                                    <CritiqueDisplay key={entry.id} entry={entry} onDelete={handleDelete} />
                                ))}
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </WorkspaceFrame>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
