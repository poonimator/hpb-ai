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
    Plus,
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { Badge } from "@/components/ui/badge";
import { Mono } from "@/components/ui/mono";
import { cn } from "@/lib/utils";
import { LensCard, adaptLens } from "@/components/tools/lens-card";

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

const LENS_ICONS: Record<string, typeof Target> = {
    "Grounded in a Real Problem": Search,
    "Solution-Agnostic": ShieldCheck,
    "Appropriately Broad": Target,
    "Focused on Desired Outcome": Sparkles,
    "Positively Framed": Smile,
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

// Map a lens id/name to its soft-tinted highlight background.
// Matches the lens palette used in the right rail + exploration prototype.
function lensHighlightBg(key: string | undefined): string {
    if (!key) return "bg-[color:var(--primary-soft)]";
    const k = key.toLowerCase();
    if (k.includes("action") || k.includes("intended")) return "bg-[rgba(14,165,233,0.14)]";
    if (k.includes("user") || k.includes("potential") || k.includes("audience") || k.includes("broad")) return "bg-[color:var(--primary-soft)]";
    if (k.includes("timing") || k.includes("moment") || k.includes("grounded") || k.includes("real problem")) return "bg-[rgba(5,150,105,0.14)]";
    if (k.includes("outcome") || k.includes("desired")) return "bg-[rgba(190,24,93,0.1)]";
    if (k.includes("research") || k.includes("grounding") || k.includes("aligned")) return "bg-[rgba(124,58,237,0.1)]";
    return "bg-[color:var(--primary-soft)]";
}

// Lens-card tint + accent palette (matches exploration prototype).
// Index maps to 5-lens ordering: intended-action, potential-user, timing, outcome, research.
const LENS_PALETTE: { accent: string; bg: string }[] = [
    { accent: "#0ea5e9", bg: "rgba(14,165,233,0.06)" },  // intended action — sky
    { accent: "var(--primary)", bg: "var(--primary-soft)" }, // potential user — amber
    { accent: "#059669", bg: "rgba(5,150,105,0.06)" },   // timing / moment — green
    { accent: "#be185d", bg: "rgba(190,24,93,0.06)" },   // desired outcome — pink
    { accent: "#7c3aed", bg: "rgba(124,58,237,0.06)" },  // research grounding — purple
];

function lensPalette(key: string | undefined, fallbackIdx: number) {
    if (!key) return LENS_PALETTE[fallbackIdx % LENS_PALETTE.length];
    const k = key.toLowerCase();
    if (k.includes("action") || k.includes("intended")) return LENS_PALETTE[0];
    if (k.includes("user") || k.includes("potential") || k.includes("audience") || k.includes("broad")) return LENS_PALETTE[1];
    if (k.includes("timing") || k.includes("moment") || k.includes("grounded") || k.includes("real problem")) return LENS_PALETTE[2];
    if (k.includes("outcome") || k.includes("desired")) return LENS_PALETTE[3];
    if (k.includes("research") || k.includes("grounding") || k.includes("aligned")) return LENS_PALETTE[4];
    return LENS_PALETTE[fallbackIdx % LENS_PALETTE.length];
}

// Extract the lens key from an annotation so we can pick a highlight color.
function annotationLensKey(ann: StatementAnnotation, fallbackIdx: number): string {
    if (typeof ann.lensCritique === "object" && ann.lensCritique !== null) {
        return ann.lensCritique.lens || "";
    }
    if (typeof ann.lensCritique === "string") return ann.lensCritique;
    // Fall back to ordered palette by position.
    const ordered = ["intended-action", "potential-user", "timing-moment", "desired-outcome", "research-grounding"];
    return ordered[fallbackIdx % ordered.length];
}

// ─── Helper Components ───────────────────────────────────────────────────

function HMWFormula() {
    return (
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2 text-body-sm text-muted-foreground">
            <span className="text-ui-sm font-bold text-foreground">How Might We</span>
            <span className="text-caption text-[color:var(--primary)]/60">+</span>
            <span className="inline-flex flex-col items-center rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 shadow-inset-edge">
                <span className="text-ui-sm font-semibold text-[color:var(--primary)]">Intended Action</span>
                <span className="text-[10px] font-normal text-muted-foreground">(an action verb)</span>
            </span>
            <span className="text-caption text-[color:var(--primary)]/60">+</span>
            <span className="text-ui-sm font-medium text-foreground">For</span>
            <span className="text-caption text-[color:var(--primary)]/60">+</span>
            <span className="inline-flex flex-col items-center rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 shadow-inset-edge">
                <span className="text-ui-sm font-semibold text-[color:var(--primary)]">Potential User</span>
                <span className="text-[10px] font-normal text-muted-foreground">(the subject)</span>
            </span>
            <span className="text-caption text-[color:var(--primary)]/60">+</span>
            <span className="text-ui-sm font-medium text-foreground">So That</span>
            <span className="text-caption text-[color:var(--primary)]/60">+</span>
            <span className="inline-flex items-center rounded-full bg-[color:var(--primary-soft)] px-2.5 py-1 shadow-inset-edge">
                <span className="text-ui-sm font-semibold text-[color:var(--primary)]">Desired Outcome</span>
            </span>
        </div>
    );
}

function HighlightedHMW({ statement, highlights }: {
    statement: string;
    highlights: HighlightedPart[];
    activeLens: number | null;
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
                    <span key={i} className="relative inline group/highlight">
                        <span className="cursor-help rounded-sm bg-[color:var(--warning-soft)] px-0.5 shadow-inset-edge transition-colors">
                            {part.text}
                        </span>
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 break-words rounded-[10px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] px-3 py-2 text-caption leading-relaxed text-foreground opacity-0 shadow-outline-ring transition-opacity duration-200 group-hover/highlight:opacity-100">
                            {part.highlight.issue}
                        </span>
                    </span>
                ) : (
                    <span key={i}>{part.text}</span>
                )
            )}
        </span>
    );
}

// ─── Annotated HMW ──────────────────────────────────────────────────────

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

function InlineResearchCard({ researchPointer }: { researchPointer: string | ResearchPointerInline }) {
    const rp = typeof researchPointer === "string" ? null : researchPointer;
    const [expanded, setExpanded] = useState(false);

    if (!rp) {
        return (
            <div className="flex items-start gap-1.5">
                <BookOpen className="mt-0.5 size-3 shrink-0 text-[color:var(--success)]/70" strokeWidth={1.5} />
                <p className="text-caption leading-relaxed text-muted-foreground">
                    {researchPointer as string}
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] shadow-outline-ring">
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full transition-colors hover:bg-[color:var(--surface-muted)]"
            >
                <div className="flex items-center gap-2 px-3 py-2">
                    <BookOpen className="size-3.5 shrink-0 text-[color:var(--success)]" strokeWidth={1.5} />
                    <span className="flex-1 truncate text-left text-[12px] font-semibold text-foreground">
                        Research Alignment
                    </span>
                    {expanded ? (
                        <ChevronUp className="size-3.5 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="size-3.5 text-muted-foreground" />
                    )}
                </div>
            </button>
            {expanded && (
                <div className="flex flex-col gap-2 border-t border-[color:var(--border-subtle)] px-3 py-2.5">
                    <p className="text-body-sm leading-relaxed text-muted-foreground">
                        {rp.explanation}
                    </p>
                    {rp.source && rp.source !== "General Assessment" && (
                        <div className="flex items-center gap-1.5 pt-0.5">
                            <FileText className="size-3 shrink-0 text-muted-foreground/60" />
                            <span className="text-caption leading-snug text-muted-foreground">
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
            {/* HMW Statement — display font, each fragment tinted by its lens. */}
            <div
                className="mb-[22px] font-light leading-[1.4] tracking-[-0.01em] text-foreground"
                style={{ fontSize: 20 }}
            >
                <span className="font-semibold text-[#059669]">HMW </span>
                {parts.map((part, i) => {
                    if (part.annIdx !== null) {
                        const ann = annotations[part.annIdx];
                        const bg = lensHighlightBg(annotationLensKey(ann, part.annIdx));
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

            {/* Lens-card grid — two parallel flex columns so cards don't
                reflow between columns when expanded/collapsed. */}
            <div className="grid grid-cols-2 gap-3 items-start">
                {[0, 1].map((col) => (
                    <div key={col} className="flex flex-col gap-3">
                        {annotations
                            .map((ann, i) => ({ ann, i }))
                            .filter(({ i }) => i % 2 === col)
                            .map(({ ann, i }) => {
                                const hasLens = typeof ann.lensCritique === "object" && ann.lensCritique !== null;
                                const lensKey = annotationLensKey(ann, i);
                                const palette = lensPalette(lensKey, i);
                                const lens = hasLens ? (ann.lensCritique as LensCritiqueInline) : null;

                                // Body copy: prefer the lens explanation, fall back to rationale/note.
                                const body = lens?.explanation || ann.rationale || ann.note || "";
                                const verdict = lens?.verdict;
                                const needsWork =
                                    verdict && verdict !== "PASS"
                                        ? (lens?.suggestion || lens?.explanation || "")
                                        : undefined;

                                // Research pointer → research card on this lens.
                                const rp = ann.researchPointer;
                                const research =
                                    typeof rp === "string"
                                        ? rp
                                        : rp?.explanation;
                                const researchTitle =
                                    typeof rp === "object" && rp?.source && rp.source !== "General Assessment"
                                        ? rp.source
                                        : undefined;

                                return (
                                    <LensCard
                                        key={i}
                                        accent={palette.accent}
                                        lensName={lens?.lens || "Lens"}
                                        fragment={`"${ann.text}"`}
                                        body={body}
                                        needsWork={needsWork}
                                        research={research}
                                        researchTitle={researchTitle}
                                    />
                                );
                            })}
                    </div>
                ))}
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
    const { critique, hmwStatement } = entry;
    const allHighlights = critique.lenses.flatMap(l => l.highlightedParts);
    const hasBreakdown = critique.statementBreakdown && critique.statementBreakdown.length > 0;
    const hasNewFormat = hasBreakdown && critique.statementBreakdown!.some(a => a.lensCritique || a.researchPointer);
    const hasEvidence = critique.researchAlignment.evidence && critique.researchAlignment.evidence.length > 0;
    const ra = critique.researchAlignment;

    return (
        <div id={`hmw-critique-${entry.id}`} className="animate-in slide-in-from-bottom-3 fade-in duration-500 space-y-3">
            {/* HMW Statement card — exploration layout: white, rounded-16, p-6, outline ring. */}
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

                {hasBreakdown ? (
                    <AnnotatedHMW statement={hmwStatement} annotations={critique.statementBreakdown!} />
                ) : (
                    <p className="text-display-4 leading-snug text-foreground">
                        <span className="font-semibold text-[#059669]">HMW </span>
                        <HighlightedHMW statement={hmwStatement} highlights={allHighlights} activeLens={null} />
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

            {/* Old-format critiques: show separate 5-lens and research sections */}
            {!hasNewFormat && (
                <>
                    {/* 5 Lenses */}
                    <div className="rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface)] p-5 shadow-outline-ring">
                        <p className="mb-3 text-ui-sm font-bold uppercase tracking-widest text-muted-foreground">
                            5-Lens Assessment
                        </p>
                        <div className="flex flex-col gap-2">
                            {critique.lenses.map((lens, i) => (
                                <LensCard
                                    key={i}
                                    lens={{
                                        name: lens.lensName,
                                        verdict: lens.verdict,
                                        rationale: lens.explanation,
                                        suggestion: lens.suggestedImprovement || null,
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Research Alignment */}
                    <div
                        className={`rounded-[14px] border p-5 shadow-outline-ring ${
                            ra.isAligned
                                ? "border-[color:var(--success-soft)] bg-[color:var(--success-soft)]"
                                : "border-[color:var(--warning-soft)] bg-[color:var(--warning-soft)]"
                        }`}
                    >
                        <div className="mb-3 flex items-center gap-2">
                            <BookOpen
                                className={`size-3.5 ${
                                    ra.isAligned ? "text-[color:var(--success)]" : "text-[color:var(--warning)]"
                                }`}
                                strokeWidth={1.5}
                            />
                            <span className="text-ui-sm font-semibold text-foreground">
                                Research Alignment
                            </span>
                            <span
                                className={`rounded-full px-2 py-0.5 text-caption font-bold ${
                                    ra.isAligned
                                        ? "bg-[color:var(--success-soft)] text-[color:var(--success)]"
                                        : "bg-[color:var(--warning-soft)] text-[color:var(--warning)]"
                                }`}
                            >
                                {ra.isAligned ? "Aligned" : "Gaps Found"}
                            </span>
                        </div>
                        <p className="mb-2 text-body-sm leading-relaxed text-foreground">
                            {ra.explanation}
                        </p>
                        {ra.soWhat && (
                            <div
                                className={`mb-3 rounded-[10px] px-3 py-2 shadow-inset-edge ${
                                    ra.isAligned
                                        ? "bg-[color:var(--success-soft)]"
                                        : "bg-[color:var(--warning-soft)]"
                                }`}
                            >
                                <p
                                    className={`text-body-sm font-medium leading-relaxed ${
                                        ra.isAligned
                                            ? "text-[color:var(--success)]"
                                            : "text-[color:var(--warning)]"
                                    }`}
                                >
                                    <ArrowRight className="mr-1 -mt-0.5 inline size-3" />
                                    {ra.soWhat}
                                </p>
                            </div>
                        )}
                        {hasEvidence && (
                            <div className="flex flex-col gap-2">
                                {ra.evidence!.map((ev, i) => (
                                    <div
                                        key={i}
                                        className="rounded-[10px] bg-[color:var(--surface)] px-3 py-2 shadow-inset-edge"
                                    >
                                        <p className="mb-1 text-caption italic leading-relaxed text-foreground">
                                            &ldquo;{ev.quote}&rdquo;
                                            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide not-italic text-muted-foreground">
                                                — {ev.source}
                                            </span>
                                        </p>
                                        <p className="text-caption leading-relaxed text-muted-foreground">
                                            {ev.connection}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {!hasEvidence && ra.relevantFindings.length > 0 && (
                            <div className="mt-1 space-y-1">
                                {ra.relevantFindings.map((finding, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-1.5 text-caption text-muted-foreground"
                                    >
                                        <span className="mt-0.5 text-[color:var(--primary)]">•</span>
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
            { label: subProject.name, href: `/projects/${projectId}/sub/${subProjectId}?tab=hmw` },
            { label: "How Might We Analyser" },
        ]
        : undefined;

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{
                    href: `/projects/${projectId}/sub/${subProjectId}?tab=hmw`,
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
                                How Might We Analyser
                            </h2>
                            <p className="text-body-sm text-muted-foreground leading-relaxed">
                                Critique HMW statements against the NN/g 5-lens framework, enriched with project research.
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
                                                        const el = document.getElementById(`hmw-critique-${entry.id}`);
                                                        el?.scrollIntoView({ behavior: "smooth", block: "start" });
                                                    }}
                                                    className={cn(
                                                        "text-left text-body-sm leading-snug line-clamp-2",
                                                        isActive ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
                                                    )}
                                                >
                                                    {entry.hmwStatement}
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
                                New HMW
                            </Button>
                        </div>
                    </>
                }
                rightRail={
                    <>
                        <RailSection title="The 5 lenses">
                            <div className="flex flex-col gap-2.5">
                                {[
                                    { color: "#0ea5e9", label: "Intended Action",  pass: "Solution-Agnostic" },
                                    { color: "#b45309", label: "Potential User",   pass: "Appropriately Broad" },
                                    { color: "#059669", label: "Timing / Moment",  pass: "Grounded in Real Problem" },
                                    { color: "#be185d", label: "Desired Outcome",  pass: "Outcome-Focused" },
                                    { color: "#7c3aed", label: "Research Grounding", pass: "Research-Aligned" },
                                ].map((l) => (
                                    <div key={l.label} className="flex gap-2.5">
                                        <span className="w-2 h-2 rounded-full mt-[6px] shrink-0" style={{ background: l.color }} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-body-sm text-foreground font-medium">{l.label}</div>
                                            <div className="text-caption mt-0.5 text-muted-foreground">
                                                {l.pass}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </RailSection>

                        <RailSection title="Formula">
                            <div className="text-body-sm text-foreground leading-[1.7] tracking-[0.01em]">
                                <b>HMW</b> +{" "}
                                <span className="text-[#059669]">action</span> +{" "}
                                <b>for</b> +{" "}
                                <span className="text-[color:var(--primary)]">user</span> +{" "}
                                <b>so that</b> +{" "}
                                <span className="text-[#be185d]">outcome</span>
                            </div>
                        </RailSection>

                        <RailSection title="Sources">
                            <div className="text-body-sm text-muted-foreground leading-relaxed">
                                Nielsen Norman Group · 5-lens framework<br/>
                                LUMA Institute · human-centred design principles
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
                            Your HMW statement
                        </label>
                        <div className="flex items-start gap-3">
                            <span className="flex-shrink-0 select-none text-display-4 font-bold leading-[1.4] text-[color:var(--primary)]">
                                HMW
                            </span>
                            <textarea
                                ref={inputRef}
                                value={hmwInput}
                                onChange={(e) => setHmwInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 resize-none border-0 bg-transparent text-display-4 leading-[1.4] text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-h-[80px] p-0"
                                disabled={isChecking}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Check Button */}
                    <div className="mb-10 flex justify-center">
                        <Button
                            onClick={handleCheck}
                            disabled={!hmwInput.trim() || isChecking}
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
                                Analysing your HMW statement
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
