"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Flag, Loader2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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

    const buttonSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
    const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

    return (
        <>
            <div className={cn("flex items-center gap-1", className)}>
                <button
                    onClick={() => handleFeedback("thumbs_up")}
                    disabled={loading}
                    className={cn(
                        buttonSize,
                        "rounded-full flex items-center justify-center transition-all",
                        feedback === "thumbs_up"
                            ? "bg-accent text-primary"
                            : "text-muted-foreground hover:text-primary hover:bg-accent"
                    )}
                    title="This was helpful"
                >
                    {loading && feedback !== "thumbs_up" ? (
                        <Loader2 className={cn(iconSize, "animate-spin")} />
                    ) : (
                        <ThumbsUp className={cn(iconSize, feedback === "thumbs_up" && "fill-current")} />
                    )}
                </button>

                <button
                    onClick={() => handleFeedback("thumbs_down")}
                    disabled={loading}
                    className={cn(
                        buttonSize,
                        "rounded-full flex items-center justify-center transition-all",
                        feedback === "thumbs_down"
                            ? "bg-destructive/10 text-destructive"
                            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    )}
                    title="This wasn't helpful"
                >
                    {loading && feedback !== "thumbs_down" ? (
                        <Loader2 className={cn(iconSize, "animate-spin")} />
                    ) : (
                        <ThumbsDown className={cn(iconSize, feedback === "thumbs_down" && "fill-current")} />
                    )}
                </button>

                <button
                    onClick={() => setReportDialogOpen(true)}
                    className={cn(
                        buttonSize,
                        "rounded-full flex items-center justify-center transition-all",
                        "text-muted-foreground hover:text-amber-600 hover:bg-amber-50"
                    )}
                    title="Report an issue"
                >
                    <Flag className={iconSize} />
                </button>
            </div>

            {/* Report Issue Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Flag className="h-5 w-5 text-amber-600" />
                            Report an Issue
                        </DialogTitle>
                        <DialogDescription>
                            Help us improve by reporting problematic AI-generated content.
                        </DialogDescription>
                    </DialogHeader>

                    {reportSubmitted ? (
                        <div className="py-8 text-center">
                            <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center mx-auto mb-4">
                                <Check className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground mb-1">Report Submitted</h3>
                            <p className="text-sm text-muted-foreground">Thank you for your feedback!</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 py-4">
                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                        What type of issue is this?
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {ISSUE_CATEGORIES.map((cat) => (
                                            <button
                                                key={cat.value}
                                                onClick={() => setSelectedCategory(cat.value)}
                                                className={cn(
                                                    "px-3 py-2 rounded-md border text-left transition-all text-sm",
                                                    selectedCategory === cat.value
                                                        ? "border-primary bg-accent text-foreground"
                                                        : "border-input hover:border-border text-muted-foreground"
                                                )}
                                            >
                                                <div className="font-medium">{cat.label}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-foreground mb-2 block">
                                        Additional details (optional)
                                    </label>
                                    <Textarea
                                        value={issueDetails}
                                        onChange={(e) => setIssueDetails(e.target.value)}
                                        placeholder="Describe the issue in more detail..."
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setReportDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleReportSubmit}
                                    disabled={!selectedCategory || reportSubmitting}
                                    className="bg-amber-600 hover:bg-amber-700"
                                >
                                    {reportSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Flag className="h-4 w-4 mr-2" />
                                            Submit Report
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
// Created by Swapnil Bapat © 2026
