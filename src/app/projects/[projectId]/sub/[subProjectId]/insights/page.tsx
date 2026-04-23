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

// Map an insight criterion name to its soft-tinted highlight background.
// Matches the palette used in the right rail + exploration prototype.
function criterionHighlightBg(key: string | undefined): string {
    if (!key) return "bg-[color:var(--primary-soft)]";
    const k = key.toLowerCase();
    if (k.includes("well-informed") || k.includes("well informed") || k.includes("informed")) return "bg-[rgba(14,165,233,0.14)]";
    if (k.includes("more than") || k.includes("observation")) return "bg-[color:var(--primary-soft)]";
    if (k.includes("so what")) return "bg-[rgba(5,150,105,0.14)]";
    if (k.includes("sticky")) return "bg-[rgba(190,24,93,0.1)]";
    if (k.includes("actionable") || k.includes("action")) return "bg-[rgba(124,58,237,0.1)]";
    return "bg-[color:var(--primary-soft)]";
}

// Criterion-card tint + accent palette (matches exploration prototype).
// Index maps to ordering: Well-Informed, More Than Observation, So What?, Sticky, Actionable.
const CRITERION_PALETTE: { accent: string; bg: string }[] = [
    { accent: "#0ea5e9", bg: "rgba(14,165,233,0.06)" },  // Well-Informed — sky
    { accent: "var(--primary)", bg: "var(--primary-soft)" }, // More Than Observation — amber
    { accent: "#059669", bg: "rgba(5,150,105,0.06)" },   // So What? — green
    { accent: "#be185d", bg: "rgba(190,24,93,0.06)" },   // Sticky — pink
    { accent: "#7c3aed", bg: "rgba(124,58,237,0.06)" },  // Actionable — purple
];

function criterionPalette(key: string | undefined, fallbackIdx: number) {
    if (!key) return CRITERION_PALETTE[fallbackIdx % CRITERION_PALETTE.length];
    const k = key.toLowerCase();
    if (k.includes("well-informed") || k.includes("well informed") || k.includes("informed")) return CRITERION_PALETTE[0];
    if (k.includes("more than") || k.includes("observation")) return CRITERION_PALETTE[1];
    if (k.includes("so what")) return CRITERION_PALETTE[2];
    if (k.includes("sticky")) return CRITERION_PALETTE[3];
    if (k.includes("actionable") || k.includes("action")) return CRITERION_PALETTE[4];
    return CRITERION_PALETTE[fallbackIdx % CRITERION_PALETTE.length];
}

function annotationCriterionKey(ann: StatementAnnotation, fallbackIdx: number): string {
    if (typeof ann.criteriaCritique === "object" && ann.criteriaCritique !== null) {
        return ann.criteriaCritique.criterion || "";
    }
    if (typeof ann.criteriaCritique === "string") return ann.criteriaCritique;
    const ordered = ["Well-Informed", "More Than an Observation", "So What?", "Sticky", "Actionable"];
    return ordered[fallbackIdx % ordered.length];
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
            {/* Insight Statement — display font, each fragment tinted by its criterion. */}
            <div
                className="mb-[22px] font-light leading-[1.4] tracking-[-0.01em] text-foreground"
                style={{ fontSize: 20 }}
            >
                {parts.map((part, i) => {
                    if (part.annIdx !== null) {
                        const ann = annotations[part.annIdx];
                        const bg = criterionHighlightBg(annotationCriterionKey(ann, part.annIdx));
                        return (
                            <span
                                key={i}
                                className={cn("rounded-[3px] px-1 py-px", bg)}
                            >
                                {part.text}
                            </span>
                        );
                    }
                    return <span key={i}>{part.text}</span>;
                })}
            </div>

            {/* Criterion-card grid — 2 cols, gap 12, matches exploration. */}
            <div className="columns-2 gap-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
                {annotations.map((ann, i) => {
                    const hasCriteria = typeof ann.criteriaCritique === "object" && ann.criteriaCritique !== null;
                    const criterionKey = annotationCriterionKey(ann, i);
                    const palette = criterionPalette(criterionKey, i);
                    const cc = hasCriteria ? (ann.criteriaCritique as CriteriaCritiqueInline) : null;

                    const body = cc?.explanation || ann.rationale || ann.note || "";
                    const verdict = cc?.verdict;
                    const needsWork =
                        verdict && verdict !== "PASS"
                            ? (cc?.suggestion || cc?.explanation || "")
                            : undefined;

                    return (
                        <LensCard
                            key={i}
                            accent={palette.accent}
                            lensName={cc?.criterion || "Criterion"}
                            fragment={`"${ann.text}"`}
                            body={body}
                            needsWork={needsWork}
                        />
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
            {/* Insight Statement card — exploration layout: white, rounded-16, p-6, outline ring. */}
            <div className="rounded-[16px] bg-[color:var(--surface)] p-6 shadow-outline-ring">
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

                {/* Summary — stone-muted inset panel. */}
                <div className="mt-[18px] rounded-[12px] bg-[color:var(--surface-muted)] px-4 py-[14px] shadow-inset-edge">
                    <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[color:var(--ink-muted)]">
                        Summary
                    </div>
                    <p className="text-[12.5px] leading-[1.65] tracking-[0.01em] text-[color:var(--ink-secondary)]">
                        {critique.overallSummary}
                    </p>
                </div>
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
                variant="analyser"
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
                rightRail={
                    <>
                        <RailSection title="The 5 criteria">
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { color: "#0ea5e9", label: "Well-Informed" },
                                    { color: "#b45309", label: "More Than an Observation" },
                                    { color: "#059669", label: "So What?" },
                                    { color: "#be185d", label: "Sticky" },
                                    { color: "#7c3aed", label: "Actionable" },
                                ].map((c) => (
                                    <div key={c.label} className="flex gap-2.5">
                                        <span className="w-2 h-2 rounded-full mt-[6px] shrink-0" style={{ background: c.color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-body-sm text-foreground font-medium">{c.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </RailSection>

                        <RailSection title="Formula">
                            <div className="text-body-sm text-foreground leading-[1.7] tracking-[0.01em]">
                                <span className="text-[color:var(--primary)]">Observation</span> +{" "}
                                <b>so what</b> +{" "}
                                <span className="text-[#059669]">action</span>
                            </div>
                        </RailSection>

                        <RailSection title="Sources">
                            <div className="text-body-sm text-muted-foreground leading-relaxed">
                                UX Research best practices · insight writing guides<br/>
                                Project research corpus · aligned via RAG
                            </div>
                        </RailSection>

                        <div className="flex-1" />
                    </>
                }
            >
                <div className="animate-in fade-in duration-500">
                    <div className="mx-auto max-w-5xl">

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
