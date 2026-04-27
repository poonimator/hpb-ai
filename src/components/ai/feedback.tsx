"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Flag, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AIFeedbackProps {
    entityType: "simulation_message" | "coach_review" | "coach_nudge" | "question_validation";
    entityId: string;
    simulationId?: string;
    messageContent?: string;
    className?: string;
    size?: "sm" | "md";
}

const ISSUE_CATEGORIES = [
    { value: "inaccurate", label: "Inaccurate", description: "Contains factual errors or wrong information" },
    { value: "harmful", label: "Harmful", description: "Contains dangerous or harmful content" },
    { value: "biased", label: "Biased", description: "Shows unfair bias or stereotyping" },
    { value: "inappropriate", label: "Inappropriate", description: "Contains inappropriate language or content" },
    { value: "other", label: "Other", description: "Other issue not listed above" },
] as const;

export function AIFeedback({
    entityType,
    entityId,
    simulationId,
    messageContent,
    className,
    size = "sm"
}: AIFeedbackProps) {
    const [feedback, setFeedback] = useState<"thumbs_up" | "thumbs_down" | null>(null);
    const [loading, setLoading] = useState(false);
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [issueDetails, setIssueDetails] = useState("");
    const [reportSubmitting, setReportSubmitting] = useState(false);
    const [reportSubmitted, setReportSubmitted] = useState(false);

    const handleFeedback = async (type: "thumbs_up" | "thumbs_down") => {
        if (feedback === type) return; // Already selected

        setLoading(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    entityType,
                    entityId,
                    simulationId,
                    messageContent: messageContent?.substring(0, 500),
                }),
            });

            if (res.ok) {
                setFeedback(type);
            }
        } catch (error) {
            console.error("Failed to submit feedback:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReportSubmit = async () => {
        if (!selectedCategory) return;

        setReportSubmitting(true);
        try {
            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "report_issue",
                    entityType,
                    entityId,
                    simulationId,
                    messageContent: messageContent?.substring(0, 500),
                    issueCategory: selectedCategory,
                    issueDetails,
                }),
            });

            if (res.ok) {
                setReportSubmitted(true);
                setTimeout(() => {
                    setReportDialogOpen(false);
                    // Reset after dialog closes
                    setTimeout(() => {
                        setSelectedCategory(null);
                        setIssueDetails("");
                        setReportSubmitted(false);
                    }, 300);
                }, 1500);
            }
        } catch (error) {
            console.error("Failed to submit report:", error);
        } finally {
            setReportSubmitting(false);
        }
    };

    // Inline segmented pill sizing — keeps the footer compact for `sm`,
    // breathes a touch more for `md`.
    const iconSize = size === "sm" ? "size-3" : "size-3.5";
    const slotPad = size === "sm" ? "px-2 py-1" : "px-2.5 py-1.5";
    const pillPadLeft = size === "sm" ? "pl-2.5" : "pl-3";

    // Loading guard — same semantics as before (disable thumbs while a fetch
    // is in flight), now centralised so the segmented pill reads as one
    // affordance instead of three independent buttons.
    const thumbsDisabled = loading;

    return (
        <>
            {/* ── Inline segmented feedback chip ───────────────────────────
                A single pill-chip that reads as one intentional affordance:
                a quiet "Rate" eyebrow on the left, then three glyphs
                separated by hairline dividers. Whisper-subtle at rest
                (already lives inside the chat-bubble hover footer), with
                gentle chromatic cues on active state — soft primary for
                thumbs-up, danger-soft for thumbs-down, warning-soft for
                flag. Nothing shouts. ───────────────────────────────────── */}
            <div
                className={cn(
                    "inline-flex items-stretch",
                    "rounded-[var(--radius-pill)] bg-[color:var(--surface)]",
                    "shadow-outline-ring",
                    className,
                )}
            >
                <span
                    className={cn(
                        "flex items-center text-eyebrow text-[color:var(--ink-secondary)]",
                        "select-none",
                        pillPadLeft,
                        "pr-2",
                    )}
                >
                    Rate
                </span>

                <span
                    aria-hidden
                    className="my-1.5 w-px bg-[color:var(--border-subtle)]"
                />

                <button
                    type="button"
                    onClick={() => handleFeedback("thumbs_up")}
                    disabled={thumbsDisabled}
                    className={cn(
                        "flex items-center justify-center transition-colors",
                        slotPad,
                        feedback === "thumbs_up"
                            ? "text-[color:var(--primary)] bg-[color:var(--primary-soft)]"
                            : "text-[color:var(--ink-secondary)] hover:text-[color:var(--primary)] hover:bg-[color:var(--primary-soft)]",
                        "disabled:cursor-not-allowed",
                    )}
                    title="This was helpful"
                    aria-pressed={feedback === "thumbs_up"}
                    aria-label="Helpful"
                >
                    {loading && feedback !== "thumbs_up" && feedback !== "thumbs_down" ? (
                        <Loader2 className={cn(iconSize, "animate-spin")} strokeWidth={1.75} />
                    ) : (
                        <ThumbsUp
                            className={cn(iconSize, feedback === "thumbs_up" && "fill-current")}
                            strokeWidth={1.75}
                        />
                    )}
                </button>

                <span
                    aria-hidden
                    className="my-1.5 w-px bg-[color:var(--border-subtle)]"
                />

                <button
                    type="button"
                    onClick={() => handleFeedback("thumbs_down")}
                    disabled={thumbsDisabled}
                    className={cn(
                        "flex items-center justify-center transition-colors",
                        slotPad,
                        feedback === "thumbs_down"
                            ? "text-[color:var(--danger)] bg-[color:var(--danger-soft)]"
                            : "text-[color:var(--ink-secondary)] hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)]",
                        "disabled:cursor-not-allowed",
                    )}
                    title="This wasn't helpful"
                    aria-pressed={feedback === "thumbs_down"}
                    aria-label="Not helpful"
                >
                    <ThumbsDown
                        className={cn(iconSize, feedback === "thumbs_down" && "fill-current")}
                        strokeWidth={1.75}
                    />
                </button>

                <span
                    aria-hidden
                    className="my-1.5 w-px bg-[color:var(--border-subtle)]"
                />

                <button
                    type="button"
                    onClick={() => setReportDialogOpen(true)}
                    className={cn(
                        "flex items-center justify-center transition-colors",
                        slotPad,
                        "rounded-r-[var(--radius-pill)]",
                        "text-[color:var(--ink-secondary)] hover:text-[color:var(--warning)] hover:bg-[color:var(--warning-soft)]",
                    )}
                    title="Report an issue"
                    aria-label="Report an issue"
                >
                    <Flag className={iconSize} strokeWidth={1.75} />
                </button>
            </div>

            {/* ── Report Issue dialog ───────────────────────────────────────
                Redesigned as a focused reflection surface — eyebrow label
                + display-3 title + one-line lead, no icon-chip ornament.
                Single-column stack of well-shadowed category cards that
                finally do something with the `description` field. Notes
                area is a quiet reflection box with an inset-edge shadow
                and its own eyebrow. Submit is the dashboard pill CTA.
                A thin `--warning-soft` hairline runs along the top of
                the content to acknowledge the cautionary tone without
                drowning the dialog in amber. ───────────────────────── */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden">
                    {/* Warning hairline at the top edge */}
                    <div
                        aria-hidden
                        className="h-[2px] bg-[color:var(--warning-soft)]"
                    />

                    {reportSubmitted ? (
                        // ── Success state: a whisper-thin "Thank you" moment ──
                        <div className="flex flex-col items-center justify-center gap-3 px-10 py-16 text-center">
                            <span className="text-eyebrow text-[color:var(--primary)]">
                                Received
                            </span>
                            <h2 className="text-display-2 text-foreground leading-[1.1]">
                                Thank you.
                            </h2>
                            <p className="text-body-sm text-muted-foreground max-w-sm leading-relaxed">
                                Your report has been logged. We use every flag to refine how the AI responds.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-7 px-8 pt-8 pb-7">
                            {/* Header — eyebrow + display title + lead */}
                            <header className="flex flex-col gap-2">
                                <span className="text-eyebrow text-[color:var(--warning)]">
                                    Report feedback
                                </span>
                                <h2 className="text-display-3 text-foreground leading-[1.1]">
                                    Flag something that felt wrong.
                                </h2>
                                <p className="text-body-sm text-muted-foreground max-w-md leading-relaxed">
                                    Pick the category that best captures the concern. Context helps us tune the model.
                                </p>
                            </header>

                            {/* Category picker — vertical stack of full-width rows.
                                Each row has a label + description; selected state is
                                a gentle primary-soft wash plus a shadow-card lift. */}
                            <section className="flex flex-col gap-3">
                                <span className="text-eyebrow text-[color:var(--ink-secondary)]">
                                    Category
                                </span>
                                <div className="flex flex-col gap-2">
                                    {ISSUE_CATEGORIES.map((cat) => {
                                        const isSelected = selectedCategory === cat.value;
                                        return (
                                            <button
                                                key={cat.value}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat.value)}
                                                aria-pressed={isSelected}
                                                className={cn(
                                                    "group relative flex items-start gap-3 rounded-[14px] px-4 py-3 text-left transition-all",
                                                    isSelected
                                                        ? "bg-[color:var(--primary-soft)] shadow-card"
                                                        : "bg-[color:var(--surface)] shadow-inset-edge hover:shadow-outline-ring",
                                                )}
                                            >
                                                {/* Leading accent dot — softly hints at selection */}
                                                <span
                                                    aria-hidden
                                                    className={cn(
                                                        "mt-[7px] inline-block size-1.5 shrink-0 rounded-full transition-colors",
                                                        isSelected
                                                            ? "bg-[color:var(--primary)]"
                                                            : "bg-[color:var(--border)]",
                                                    )}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div
                                                        className={cn(
                                                            "text-ui font-medium",
                                                            isSelected
                                                                ? "text-[color:var(--primary)]"
                                                                : "text-foreground",
                                                        )}
                                                    >
                                                        {cat.label}
                                                    </div>
                                                    <div className="mt-0.5 text-body-sm text-muted-foreground leading-relaxed">
                                                        {cat.description}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Notes area — a quiet reflection space */}
                            <section className="flex flex-col gap-2">
                                <span className="text-eyebrow text-[color:var(--ink-secondary)]">
                                    Additional notes
                                    <span className="ml-1.5 font-normal normal-case tracking-normal text-muted-foreground">
                                        (optional)
                                    </span>
                                </span>
                                <div className="rounded-[14px] bg-[color:var(--surface)] shadow-inset-edge">
                                    <Textarea
                                        value={issueDetails}
                                        onChange={(e) => setIssueDetails(e.target.value)}
                                        placeholder="Describe what went wrong, what you expected, or anything else that would help us understand."
                                        rows={4}
                                        className={cn(
                                            "border-0 bg-transparent shadow-none resize-none",
                                            "px-4 py-3 text-body-sm leading-relaxed",
                                            "placeholder:text-muted-foreground/70",
                                            "focus-visible:ring-0 focus-visible:ring-offset-0",
                                        )}
                                    />
                                </div>
                            </section>

                            {/* Footer — pill primary + ghost cancel */}
                            <footer className="flex items-center justify-between gap-3 pt-1">
                                <p className="text-caption text-muted-foreground">
                                    Reports are private and help us improve the AI.
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setReportDialogOpen(false)}
                                        className={cn(
                                            "rounded-[var(--radius-pill)] px-4 py-2 text-ui font-medium",
                                            "text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)]",
                                            "transition-colors",
                                        )}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReportSubmit}
                                        disabled={!selectedCategory || reportSubmitting}
                                        className={cn(
                                            "inline-flex items-center gap-1.5",
                                            "rounded-[var(--radius-pill)] px-4 py-2 text-ui font-medium",
                                            "bg-[color:var(--primary)] text-[color:var(--primary-fg)] shadow-card",
                                            "hover:brightness-110 transition-[filter,opacity]",
                                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:brightness-100",
                                        )}
                                    >
                                        {reportSubmitting ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin" strokeWidth={1.75} />
                                                Submitting
                                            </>
                                        ) : (
                                            <>
                                                Submit report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </footer>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
// Created by Swapnil Bapat © 2026
