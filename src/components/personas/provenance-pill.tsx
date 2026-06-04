"use client";

import { type Provenance } from "@/lib/personas/types";

interface ProvenancePillProps {
    provenance: Provenance;
    className?: string;
    /** Show only the dot variant (compact). */
    compact?: boolean;
}

// "stated" and "inferred" share a pill — both are grounded in the data
// (directly or by extrapolation). The AI still distinguishes them internally
// so we keep the underlying provenance values intact; only the display
// collapses them under a single "Stated" label / colour.
const PROV_META: Record<Provenance, { label: string; classes: string }> = {
    stated: {
        label: "Stated",
        classes: "bg-[color:var(--success-soft,#dcfce7)] text-[color:var(--success,#15803d)]",
    },
    inferred: {
        label: "Stated",
        classes: "bg-[color:var(--success-soft,#dcfce7)] text-[color:var(--success,#15803d)]",
    },
    assumed: {
        label: "Assumed",
        classes: "bg-[color:var(--warning-soft,#fef3c7)] text-[color:var(--warning,#b45309)]",
    },
    not_in_data: {
        label: "Not in data",
        classes: "bg-[color:var(--surface)] text-muted-foreground border border-[color:var(--border)]",
    },
    user_set: {
        label: "Edited",
        classes: "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
    },
};

export function ProvenancePill({ provenance, className, compact }: ProvenancePillProps) {
    const meta = PROV_META[provenance];
    if (compact) {
        return (
            <span
                title={meta.label}
                className={`inline-block h-1.5 w-1.5 rounded-full ${meta.classes.split(" ")[0]} ${className || ""}`}
            />
        );
    }
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-wide whitespace-nowrap ${meta.classes} ${className || ""}`}
        >
            {meta.label}
        </span>
    );
}
// Created by Swapnil Bapat © 2026
