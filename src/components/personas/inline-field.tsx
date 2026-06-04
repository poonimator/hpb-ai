"use client";

import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";
import { ProvenancePill } from "./provenance-pill";
import type { PersonaField, Provenance } from "@/lib/personas/types";

interface InlineFieldProps<T> {
    label: string;
    field: PersonaField<T>;
    /** Path within PersonaContent for the patch API (e.g. ["bio", "age"]). */
    path: string[];
    /** Fired when the user saves. Parent should PATCH the persona. */
    onSave: (path: string[], value: T, provenance: Provenance) => Promise<void> | void;
    /** Optional input type hint (text | number). Defaults to text. */
    inputType?: "text" | "number" | "textarea";
    /** Display formatter for the value (when not editing). */
    format?: (v: T | null) => string;
    /** When true, the field renders a single-line value layout (label · value). */
    horizontal?: boolean;
    /** Empty-value placeholder text shown when value is null. */
    placeholder?: string;
}

export function InlineField<T extends string | number | string[] | null>(props: InlineFieldProps<T>) {
    const { label, field, path, onSave, inputType = "text", format, horizontal = false, placeholder = "—" } = props;

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<string>(stringify(field.value, inputType));
    const [saving, setSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (editing) {
            setDraft(stringify(field.value, inputType));
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [editing]);

    async function commit() {
        setSaving(true);
        try {
            const coerced = coerce<T>(draft, inputType);
            await onSave(path, coerced, "user_set");
            setEditing(false);
        } finally {
            setSaving(false);
        }
    }

    const display = field.value == null || (typeof field.value === "string" && field.value.trim() === "")
        ? placeholder
        : (format ? format(field.value) : Array.isArray(field.value) ? field.value.join(", ") : String(field.value));

    if (horizontal) {
        return (
            <div className="flex items-start justify-between gap-3 py-1.5 group">
                <span className="text-caption text-muted-foreground shrink-0 mt-1">{label}</span>
                <div className="flex items-start gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                        {editing ? (
                            <input
                                ref={(el) => { inputRef.current = el; }}
                                type={inputType === "number" ? "number" : "text"}
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") commit();
                                    if (e.key === "Escape") setEditing(false);
                                }}
                                className="w-full text-body-sm text-foreground bg-[color:var(--surface-muted)] shadow-inset-edge rounded-[6px] px-2 py-1 focus:outline-none focus:shadow-outline-ring"
                            />
                        ) : (
                            <p className="text-body-sm text-foreground text-right break-words">{display}</p>
                        )}
                    </div>
                    <FieldActions
                        provenance={field.provenance}
                        editing={editing}
                        saving={saving}
                        onEdit={() => setEditing(true)}
                        onCancel={() => setEditing(false)}
                        onSave={commit}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-1.5 group">
            <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                <FieldActions
                    provenance={field.provenance}
                    editing={editing}
                    saving={saving}
                    onEdit={() => setEditing(true)}
                    onCancel={() => setEditing(false)}
                    onSave={commit}
                />
            </div>
            {editing ? (
                inputType === "textarea" ? (
                    <textarea
                        ref={(el) => { inputRef.current = el; }}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Escape") setEditing(false);
                            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
                        }}
                        rows={3}
                        className="w-full text-body-sm text-foreground bg-[color:var(--surface-muted)] shadow-inset-edge rounded-[8px] px-2.5 py-2 focus:outline-none focus:shadow-outline-ring resize-y"
                    />
                ) : (
                    <input
                        ref={(el) => { inputRef.current = el; }}
                        type={inputType === "number" ? "number" : "text"}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") commit();
                            if (e.key === "Escape") setEditing(false);
                        }}
                        className="w-full text-body-sm text-foreground bg-[color:var(--surface-muted)] shadow-inset-edge rounded-[8px] px-2.5 py-1.5 focus:outline-none focus:shadow-outline-ring"
                    />
                )
            ) : (
                <p className="text-body-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {display}
                </p>
            )}
            {field.evidenceQuotes && field.evidenceQuotes.length > 0 && !editing && (
                <ul className="space-y-1 pt-1">
                    {field.evidenceQuotes.slice(0, 2).map((q, i) => (
                        <li key={i} className="text-caption text-muted-foreground italic leading-snug">
                            &ldquo;{q.text}&rdquo; {q.transcriptName && <span className="not-italic opacity-70">— {q.transcriptName}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function FieldActions({
    provenance,
    editing,
    saving,
    onEdit,
    onCancel,
    onSave,
}: {
    provenance: Provenance;
    editing: boolean;
    saving: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSave: () => void;
}) {
    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    aria-label="Save"
                    className="h-5 w-5 rounded-[6px] flex items-center justify-center bg-[color:var(--success-soft,#dcfce7)] text-[color:var(--success,#15803d)] hover:brightness-110"
                >
                    <Check className="h-3 w-3" />
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    aria-label="Cancel"
                    className="h-5 w-5 rounded-[6px] flex items-center justify-center bg-[color:var(--surface-muted)] text-muted-foreground hover:text-foreground"
                >
                    <X className="h-3 w-3" />
                </button>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-1.5">
            <ProvenancePill provenance={provenance} />
            <button
                type="button"
                onClick={onEdit}
                aria-label="Edit"
                className="h-5 w-5 rounded-[6px] flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)] transition-colors"
            >
                <Pencil className="h-3 w-3" />
            </button>
        </div>
    );
}

function stringify(v: unknown, inputType: "text" | "number" | "textarea"): string {
    if (v == null) return "";
    if (Array.isArray(v)) return v.join("\n");
    if (inputType === "number") return String(v);
    return String(v);
}

function coerce<T>(raw: string, inputType: "text" | "number" | "textarea"): T {
    const trimmed = raw.trim();
    if (trimmed === "") return null as unknown as T;
    if (inputType === "number") {
        const n = Number(trimmed);
        return (Number.isFinite(n) ? n : null) as unknown as T;
    }
    return trimmed as unknown as T;
}
// Created by Swapnil Bapat © 2026
