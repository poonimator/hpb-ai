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
    Search,
    Smile,
    ShieldCheck,
    Trash2,
    FileText,
    ArrowRight,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────

interface HighlightedPart {
    text: string;
    issue: string;
}

interface LensCritique {
    lensName: string;
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

interface LensCritiqueInline {
    lens: string;
    verdict: string;
    explanation: string;
    suggestion?: string;
}

interface ResearchPointerInline {
    explanation: string;
    source: string;
}

interface StatementAnnotation {
    text: string;
    note?: string;
    rationale?: string;
    lensCritique?: string | LensCritiqueInline;
    researchPointer?: string | ResearchPointerInline;
    sentiment: "strength" | "issue" | "neutral";
}

interface HMWCritiqueResult {
    overallVerdict: "PASS" | "NEEDS_WORK" | "FAIL";
    overallSummary: string;
    lenses: LensCritique[];
    researchAlignment: ResearchAlignment;
    statementBreakdown?: StatementAnnotation[];
}

interface HistoryEntry {
    id: string;
    hmwStatement: string;
    critique: HMWCritiqueResult;
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

const LENS_ICONS: Record<string, typeof Target> = {
    "Grounded in a Real Problem": Search,
    "Solution-Agnostic": ShieldCheck,
    "Appropriately Broad": Target,
    "Focused on Desired Outcome": Sparkles,
    "Positively Framed": Smile,
};

const VERDICT_CONFIG = {
    PASS: { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2, label: "Pass" },
    PARTIAL: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, label: "Needs Work" },
    FAIL: { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: XCircle, label: "Fail" },
    NEEDS_WORK: { color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle, label: "Needs Work" },
};

// ─── Helper Components ───────────────────────────────────────────────────

function HMWFormula() {
    return (
        <div className="flex items-center justify-center gap-2 flex-wrap text-sm text-muted-foreground mb-10">
            <span className="font-bold text-foreground text-base">How Might We</span>
            <span className="text-primary font-bold text-lg">+</span>
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">
                Intended Action
                <span className="block text-[10px] font-normal text-muted-foreground">(an action verb)</span>
            </span>
            <span className="text-primary font-bold text-lg">+</span>
            <span className="font-medium text-foreground">For</span>
            <span className="text-primary font-bold text-lg">+</span>
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">
                Potential User
                <span className="block text-[10px] font-normal text-muted-foreground">(the subject)</span>
            </span>
            <span className="text-primary font-bold text-lg">+</span>
            <span className="font-medium text-foreground">So That</span>
            <span className="text-primary font-bold text-lg">+</span>
            <span className="px-2.5 py-1 bg-primary/5 border border-primary/20 rounded-full text-xs font-semibold text-primary">
                Desired Outcome
            </span>
        </div>
    );
}

function HighlightedHMW({ statement, highlights, activeLens }: {
    statement: string;
    highlights: HighlightedPart[];
    activeLens: number | null;
}) {
    if (!highlights || highlights.length === 0) {
        return <span>{statement}</span>;
    }

    // Build intervals and mark highlighted ranges
    const parts: { text: string; highlight: HighlightedPart | null; startIdx: number }[] = [];
    let remaining = statement;
    let offset = 0;

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

// ─── Annotated HMW with Connector Lines ────────────────────────────────

function parseAnnotatedParts(statement: string, annotations: StatementAnnotation[]) {
    const stmtLower = statement.toLowerCase();

    // Try to find each annotation in the statement, stripping common prefixes if needed
    const withPositions = annotations.map((a, origIdx) => {
        let searchText = a.text.toLowerCase();
        let idx = stmtLower.indexOf(searchText);

        // If not found, try stripping "how might we " prefix the AI sometimes includes
        if (idx < 0) {
            const prefixes = ["how might we ", "how might we"];
            for (const p of prefixes) {
                if (searchText.startsWith(p)) {
                    const stripped = searchText.slice(p.length);
                    idx = stmtLower.indexOf(stripped);
                    if (idx >= 0) { searchText = stripped; break; }
                }
            }
        }

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
// Muted desaturated tones from distinct hue families — neutral-feeling but visually distinct
const ANNOTATION_PALETTE = [
    { text: "text-slate-700", mark: "bg-blue-100/70", bg: "bg-blue-50/50", border: "border-blue-200/60" },
    { text: "text-stone-700", mark: "bg-amber-100/70", bg: "bg-amber-50/40", border: "border-amber-200/60" },
    { text: "text-slate-700", mark: "bg-indigo-100/70", bg: "bg-indigo-50/50", border: "border-indigo-200/60" },
    { text: "text-stone-700", mark: "bg-rose-100/60", bg: "bg-rose-50/40", border: "border-rose-200/60" },
    { text: "text-slate-700", mark: "bg-teal-100/70", bg: "bg-teal-50/50", border: "border-teal-200/60" },
];

function InlineLensCard({ lensCritique }: { lensCritique: string | LensCritiqueInline }) {
    const lc = typeof lensCritique === "string" ? null : lensCritique;
    const [expanded, setExpanded] = useState(() => {
        if (!lc) return true;
        return lc.verdict !== "PASS";
    });

    if (!lc) {
        return (
            <div className="flex items-start gap-1.5">
                <Target className="h-3 w-3 mt-0.5 text-primary/60 flex-shrink-0" />
                <p className="text-[11px] leading-relaxed">{lensCritique as string}</p>
            </div>
        );
    }

    const vConfig = VERDICT_CONFIG[lc.verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.PARTIAL;
    const VIcon = vConfig.icon;
    const isPass = lc.verdict === "PASS";

    return (
        <div className="rounded-md border border-border/50 bg-white shadow-sm overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted/30 transition-colors"
            >
                <Target className="h-3 w-3 text-primary/60 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-muted-foreground flex-1 text-left">{lc.lens}</span>
                {!expanded && !isPass && (
                    <VIcon className={`h-3 w-3 flex-shrink-0 ${vConfig.color}`} />
                )}
                {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />}
            </button>
            {expanded && (
                <div className="px-2.5 pb-2 pt-0.5 border-t border-border/30 space-y-1.5">
                    <p className="text-[11px] leading-relaxed text-foreground/80">{lc.explanation}</p>
                    {lc.suggestion && (
                        <p className="text-[11px] leading-relaxed text-primary/80 italic">
                            Try: &ldquo;{lc.suggestion}&rdquo;
                        </p>
                    )}
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${vConfig.bg} ${vConfig.color} border ${vConfig.border}`}>
                        <VIcon className="h-2.5 w-2.5" />
                        {vConfig.label}
                    </span>
                </div>
            )}
        </div>
    );
}

function InlineResearchCard({ researchPointer }: { researchPointer: string | ResearchPointerInline }) {
    const rp = typeof researchPointer === "string" ? null : researchPointer;
    const [expanded, setExpanded] = useState(false);

    if (!rp) {
        return (
            <div className="flex items-start gap-1.5">
                <BookOpen className="h-3 w-3 mt-0.5 text-emerald-500/70 flex-shrink-0" />
                <p className="text-[11px] leading-relaxed">{researchPointer as string}</p>
            </div>
        );
    }

    return (
        <div className="rounded-md border border-border/50 bg-white shadow-sm overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-muted/30 transition-colors"
            >
                <BookOpen className="h-3 w-3 text-emerald-600/70 flex-shrink-0" />
                <span className="text-[10px] font-semibold text-muted-foreground flex-1 text-left">Research Alignment</span>
                {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground/50" /> : <ChevronDown className="h-3 w-3 text-muted-foreground/50" />}
            </button>
            {expanded && (
                <div className="px-2.5 pb-2 pt-0.5 border-t border-border/30 space-y-1.5">
                    <p className="text-[11px] leading-relaxed text-foreground/80">{rp.explanation}</p>
                    {rp.source && rp.source !== "General Assessment" && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                            <FileText className="h-3 w-3 text-muted-foreground/50 flex-shrink-0" />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                {rp.source}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AnnotatedHMW({ statement, annotations }: {
    statement: string;
    annotations: StatementAnnotation[];
}) {
    const { parts } = parseAnnotatedParts(statement, annotations);

    return (
        <div>
            {/* HMW Statement with background highlights */}
            <p className="text-xl md:text-2xl font-bold text-center leading-relaxed px-4 text-foreground mb-6">
                <span className="text-primary">HMW </span>
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
                ?
            </p>

            {/* Annotation cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {annotations.map((ann, i) => {
                    const colors = ANNOTATION_PALETTE[i % ANNOTATION_PALETTE.length];
                    const hasNewFormat = !!(ann.lensCritique || ann.researchPointer) && !ann.note;
                    return (
                        <div
                            key={i}
                            className={`text-[11px] leading-relaxed rounded-lg border ${colors.bg} ${colors.border} ${colors.text} overflow-hidden`}
                        >
                            {/* Top sub-card: positive rationale */}
                            {ann.rationale && (
                                <div className="bg-white border-b border-border/30 px-3 py-2.5">
                                    <div className="flex items-start gap-1.5">
                                        <Lightbulb className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />
                                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                                            {ann.rationale}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {/* Bottom section: quoted text + lens critique + research pointer */}
                            <div className="px-3 py-2.5">
                                <p className={`font-semibold mb-1.5 ${colors.mark} rounded-sm inline`}>
                                    &ldquo;{ann.text}&rdquo;
                                </p>
                                {hasNewFormat ? (
                                    <div className="mt-2 space-y-2">
                                        {ann.lensCritique && (
                                            <InlineLensCard lensCritique={ann.lensCritique} />
                                        )}
                                        {ann.researchPointer && (
                                            <InlineResearchCard researchPointer={ann.researchPointer} />
                                        )}
                                    </div>
                                ) : (
                                    ann.note && <p className="mt-1.5">{ann.note}</p>
                                )}
                            </div>
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

function LensRow({ lens }: { lens: LensCritique }) {
    const [expanded, setExpanded] = useState(false);
    const Icon = LENS_ICONS[lens.lensName] || Target;
    const config = VERDICT_CONFIG[lens.verdict as keyof typeof VERDICT_CONFIG] || VERDICT_CONFIG.PARTIAL;
    const VerdictIcon = config.icon;
    const hasDetail = lens.explanation || lens.highlightedParts.length > 0 || lens.suggestedImprovement;

    return (
        <div>
            <button
                onClick={() => hasDetail && setExpanded(!expanded)}
                className={`w-full flex items-center gap-3 py-2.5 text-left transition-colors ${hasDetail ? 'cursor-pointer hover:bg-muted/20' : 'cursor-default'} rounded-lg px-2 -mx-2`}
            >
                <VerdictIcon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                <span className="text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">{lens.lensName}</span>
                <span className={`text-[11px] font-bold uppercase tracking-wide ${config.color}`}>{config.label}</span>
                {hasDetail && (
                    expanded
                        ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
            </button>

            {expanded && hasDetail && (
                <div className="pl-9 pr-2 pb-2 animate-in slide-in-from-top-1 fade-in duration-150">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{lens.explanation}</p>

                    {lens.highlightedParts.length > 0 && (
                        <div className="space-y-1.5 mb-2">
                            {lens.highlightedParts.map((hp, i) => (
                                <div key={i} className="flex items-start gap-2 pl-2.5 border-l-2 border-amber-300">
                                    <div className="flex-1">
                                        <span className="text-[11px] font-mono bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                                            &ldquo;{hp.text}&rdquo;
                                        </span>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{hp.issue}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {lens.suggestedImprovement && (
                        <div className="bg-muted/30 rounded-md p-2 border border-border/60">
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground">Tip: </span>{lens.suggestedImprovement}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function CritiqueDisplay({ entry, onDelete }: { entry: HistoryEntry; onDelete: (id: string) => void }) {
    const { critique, hmwStatement } = entry;
    const allHighlights = critique.lenses.flatMap(l => l.highlightedParts);
    const hasBreakdown = critique.statementBreakdown && critique.statementBreakdown.length > 0;
    const hasNewFormat = hasBreakdown && critique.statementBreakdown!.some(a => a.lensCritique || a.researchPointer);
    const hasEvidence = critique.researchAlignment.evidence && critique.researchAlignment.evidence.length > 0;
    const ra = critique.researchAlignment;

    return (
        <div id={`hmw-critique-${entry.id}`} className="animate-in slide-in-from-bottom-3 fade-in duration-500">
            {/* HMW Statement — annotated with connectors or fallback to highlights */}
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

                {hasBreakdown ? (
                    <AnnotatedHMW statement={hmwStatement} annotations={critique.statementBreakdown!} />
                ) : (
                    <p className="text-lg text-foreground leading-relaxed">
                        <span className="font-bold text-primary">HMW </span>
                        <HighlightedHMW statement={hmwStatement} highlights={allHighlights} activeLens={null} />
                    </p>
                )}

                <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/60 pt-3 mt-4">
                    {critique.overallSummary}
                </p>
            </div>

            {/* Old-format critiques: show separate 5-lens and research sections */}
            {!hasNewFormat && (
                <>
                    {/* 5 Lenses — compact single card */}
                    <div className="bg-white rounded-xl border border-border p-4 mb-3 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">5-Lens Assessment</p>
                        <div className="divide-y divide-border/60">
                            {critique.lenses.map((lens, i) => (
                                <LensRow key={i} lens={lens} />
                            ))}
                        </div>
                    </div>

                    {/* Research Alignment */}
                    <div className={`rounded-xl border p-4 mb-3 ${ra.isAligned ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen className={`h-3.5 w-3.5 ${ra.isAligned ? 'text-emerald-600' : 'text-amber-600'}`} />
                            <span className="text-[13px] font-semibold text-foreground">Research Alignment</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${ra.isAligned
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                                {ra.isAligned ? "Aligned" : "Gaps Found"}
                            </span>
                        </div>
                        <p className="text-[13px] text-foreground leading-relaxed mb-2">{ra.explanation}</p>
                        {ra.soWhat && (
                            <div className={`rounded-lg px-3 py-2 mb-3 ${ra.isAligned ? 'bg-emerald-100/50 border border-emerald-200/60' : 'bg-amber-100/50 border border-amber-200/60'}`}>
                                <p className={`text-[12px] font-medium leading-relaxed ${ra.isAligned ? 'text-emerald-800' : 'text-amber-800'}`}>
                                    <ArrowRight className="h-3 w-3 inline mr-1 -mt-0.5" />
                                    {ra.soWhat}
                                </p>
                            </div>
                        )}
                        {hasEvidence && (
                            <div className="space-y-1.5">
                                {ra.evidence!.map((ev, i) => (
                                    <div key={i} className="bg-white/70 rounded-lg border border-border/40 px-3 py-2">
                                        <p className="text-[12px] text-foreground leading-relaxed italic mb-1">
                                            &ldquo;{ev.quote}&rdquo;
                                            <span className="not-italic text-[10px] font-semibold text-muted-foreground ml-1.5 uppercase tracking-wide">— {ev.source}</span>
                                        </p>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed">{ev.connection}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!hasEvidence && ra.relevantFindings.length > 0 && (
                            <div className="space-y-1 mt-1">
                                {ra.relevantFindings.map((finding, i) => (
                                    <div key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{finding}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ─── Main Page Component ─────────────────────────────────────────────────

export default function HMWPage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const [subProject, setSubProject] = useState<SubProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [hmwInput, setHmwInput] = useState("");
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
            const res = await fetch(`/api/sub-projects/${subProjectId}/hmw-critiques`);
            const data = await res.json();
            if (data.success && data.data) {
                setHistory(data.data.map((c: any) => {
                    try {
                        return {
                            id: c.id,
                            hmwStatement: c.hmwStatement,
                            critique: JSON.parse(c.critiqueJson),
                            timestamp: new Date(c.createdAt),
                        };
                    } catch {
                        return null;
                    }
                }).filter(Boolean) as HistoryEntry[]);
            }
        } catch (err) {
            console.error("[HMW] Failed to fetch history:", err);
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
            localStorage.removeItem("hmw_critique_history_" + subProjectId);
        } catch {}
    }, [subProjectId]);

    // Scroll to specific critique if scrollTo param is present
    useEffect(() => {
        if (scrollToId && isHistoryLoaded && history.length > 0) {
            const el = document.getElementById(`hmw-critique-${scrollToId}`);
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
            const res = await fetch(`/api/sub-projects/${subProjectId}/hmw-critiques/${id}`, { method: "DELETE" });
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
        if (!hmwInput.trim() || isChecking) return;

        const statement = hmwInput.trim();
        setIsChecking(true);

        try {
            const res = await fetch("/api/gemini/hmw-critique", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    hmwStatement: statement,
                    projectId,
                    subProjectId,
                    researchStatement: subProject?.researchStatement,
                }),
            });

            const data = await res.json();

            if (data.success && data.data) {
                setHmwInput("");
                await fetchHistory();

                // Scroll to results
                setTimeout(() => {
                    historyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 300);
            } else {
                alert(data.error || "Failed to critique HMW statement");
            }
        } catch (err) {
            console.error("HMW critique error:", err);
            alert("Failed to check HMW statement. Please try again.");
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
            <div className="min-h-screen bg-background flex items-center justify-center">
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
                    <Link href={`/projects/${projectId}/sub/${subProjectId}`} className="hover:text-foreground transition-colors truncate max-w-[200px]">
                        {subProject?.name || "Workspace"}
                    </Link>
                    <span className="text-border">/</span>
                    <span className="text-foreground">How Might We</span>
                </div>

                {/* Page Title */}
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-xs font-bold text-primary mb-4">
                            <Lightbulb className="h-3.5 w-3.5" />
                            HMW ANALYSER
                        </div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
                            How Might We
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
                            Critique your HMW statements against the NN/g 5-lens framework, enriched with LUMA&apos;s human-centred design principles, and your project&apos;s research.
                        </p>
                    </div>

                    {/* HMW Formula */}
                    <HMWFormula />

                    {/* Input Area */}
                    <div className="bg-white rounded-2xl border border-border shadow-sm p-6 mb-6 transition-shadow hover:shadow-md">
                        <div className="flex items-start gap-3">
                            <span className="text-xl font-bold text-primary mt-1 flex-shrink-0 select-none">
                                HMW
                            </span>
                            <textarea
                                ref={inputRef}
                                value={hmwInput}
                                onChange={(e) => setHmwInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 resize-none border-0 bg-transparent text-foreground text-lg leading-relaxed focus:outline-none min-h-[80px]"
                                disabled={isChecking}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Check Button */}
                    <div className="flex justify-center mb-10">
                        <Button
                            onClick={handleCheck}
                            disabled={!hmwInput.trim() || isChecking}
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
                            <p className="text-sm font-medium text-foreground mb-1">Analysing your HMW statement</p>
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
