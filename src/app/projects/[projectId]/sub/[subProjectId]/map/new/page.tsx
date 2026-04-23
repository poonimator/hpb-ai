"use client";

import { useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload,
    FileText,
    X,
    Loader2,
    Check,
    Wand2,
    Plus,
    Network,
    Sparkles
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { Eyebrow } from "@/components/ui/eyebrow";

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

interface UploadedFile {
    file: File;
    id: string; // Temporary ID
    status: "pending" | "uploading" | "done" | "error";
}

const DEFAULT_THEMES = [
    "Pressures/Stressors",
    "Motivations to Take Action",
    "Barriers to Action",
    "Mental Model",
    "Life Prioritisation",
    "Support Ecosystem",
    "Digital Ecosystem",
    "Routines and Behaviours",
    "Protective Factors"
];

export default function NewMappingPage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const router = useRouter();

    // Steps: 1 = Setup (Name + Upload), 2 = AI Theme Gen, 3 = Theme Selection, 4 = Processing
    const [step, setStep] = useState(1);

    // Step 1 State
    const [name, setName] = useState("");
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Step 2/3 State
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [themes, setThemes] = useState<string[]>(DEFAULT_THEMES);
    const [customTheme, setCustomTheme] = useState("");
    const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);

    // Step 4 State
    const [isprocessing, setIsProcessing] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                id: Math.random().toString(36).substring(7),
                status: "pending" as const
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files).filter(f =>
                f.type === "text/plain" || f.type === "text/markdown" ||
                f.name.endsWith(".md") || f.name.endsWith(".txt")
            ).map(file => ({
                file,
                id: Math.random().toString(36).substring(7),
                status: "pending" as const
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleNext = async () => {
        if (!name.trim() || files.length === 0) return;

        setStep(2); // Show analyzing loader

        try {
            // 1. Create Session
            const createRes = await fetch(`/api/sub-projects/${subProjectId}/mapping`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim() })
            });

            if (!createRes.ok) throw new Error("Failed to create session");
            const { data: session } = await createRes.json();
            setSessionId(session.id);

            // 2. Upload Files (Parallel)
            await Promise.all(files.map(async (fileObj) => {
                const formData = new FormData();
                formData.append("file", fileObj.file);

                // TODO: Update file status to uploading

                await fetch(`/api/mapping/${session.id}/upload`, {
                    method: "POST",
                    body: formData
                });

                // TODO: Update file status to done
            }));

            // 3. Generate Themes
            setIsGeneratingThemes(true);
            const themesRes = await fetch(`/api/mapping/${session.id}/suggest-themes`, {
                method: "POST"
            });

            if (themesRes.ok) {
                const { data: suggestedThemes } = await themesRes.json();
                if (suggestedThemes && suggestedThemes.length > 0) {
                    setThemes(suggestedThemes);
                }
            }

            setStep(3); // Go to theme selection
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
            setStep(1);
        } finally {
            setIsGeneratingThemes(false);
        }
    };

    const handleAddTheme = () => {
        if (customTheme.trim() && !themes.includes(customTheme.trim())) {
            setThemes(prev => [...prev, customTheme.trim()]);
            setCustomTheme("");
        }
    };

    const handleRemoveTheme = (theme: string) => {
        setThemes(prev => prev.filter(t => t !== theme));
    };

    const handleBeginMapping = async () => {
        if (!sessionId) return;

        setIsProcessing(true);
        setStep(4);

        try {
            const res = await fetch(`/api/mapping/${sessionId}/process`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ themes })
            });

            if (!res.ok) throw new Error("Failed to start processing");

            // Redirect to results page
            router.push(`/projects/${projectId}/sub/${subProjectId}/map/${sessionId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to process mapping");
            setStep(3);
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{
                    href: `/projects/${projectId}/sub/${subProjectId}?tab=mapping`,
                    label: "Back",
                }}
                crumbs={[
                    { label: "Mapping", href: `/projects/${projectId}/sub/${subProjectId}?tab=mapping` },
                    { label: "New session" },
                ]}
            />

            <div className="py-8 px-8">
                <div className="max-w-3xl mx-auto w-full">

                    {/* STEPS */}

                    {/* Step 1: Upload & Name */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-8 space-y-8">
                                <div className="space-y-3">
                                    <Label
                                        htmlFor="name"
                                        className="text-eyebrow text-muted-foreground"
                                    >
                                        Session Name
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Youth Mental Health Interviews - Batch 1"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-11 text-base"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-eyebrow text-muted-foreground">
                                        Interview Transcripts
                                    </Label>
                                    <div
                                        className="group relative cursor-pointer rounded-[14px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:bg-[color:var(--surface)] hover:shadow-outline-ring hover:border-transparent transition-all p-8 text-center"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".txt,.md,text/plain,text/markdown"
                                            onChange={handleFileSelect}
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 rounded-[10px] bg-[color:var(--surface)] shadow-inset-edge flex items-center justify-center text-[color:var(--knowledge)]">
                                                <Upload className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">
                                                    Click to upload or drag &amp; drop
                                                </p>
                                                <p className="text-[12px] text-muted-foreground mt-0.5">
                                                    Plain text (.txt), Markdown (.md)
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File List */}
                                    {files.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                                            {files.map((f) => (
                                                <div
                                                    key={f.id}
                                                    className="flex items-center gap-3 p-2.5 rounded-[10px] shadow-inset-edge bg-[color:var(--surface-muted)]"
                                                >
                                                    <div className="h-7 w-7 rounded-[8px] bg-[color:var(--surface)] shadow-inset-edge flex items-center justify-center text-muted-foreground shrink-0">
                                                        <FileText className="h-3.5 w-3.5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">
                                                            {f.file.name}
                                                        </p>
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {(f.file.size / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                    {f.status === "done" ? (
                                                        <Check className="h-3.5 w-3.5 text-[color:var(--success,theme(colors.emerald.500))]" />
                                                    ) : null}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(f.id)}
                                                        className="p-1 rounded-[6px] text-muted-foreground hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] transition-colors"
                                                        aria-label={`Remove ${f.file.name}`}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    size="lg"
                                    onClick={handleNext}
                                    disabled={!name || files.length === 0}
                                    className="gap-2"
                                >
                                    Next Step
                                    <Wand2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Loading State */}
                    {step === 2 && (
                        <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-700">
                            <div className="relative h-14 w-14 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-[color:var(--knowledge-soft)] animate-pulse" />
                                <Loader2 className="h-7 w-7 text-[color:var(--knowledge)] animate-spin relative z-10" />
                            </div>
                            <h2 className="mt-6 text-lg font-semibold text-foreground">
                                Analysing Context
                            </h2>
                            <Eyebrow className="mt-1 justify-center text-[color:var(--knowledge)]">
                                Reading transcripts
                            </Eyebrow>
                            <p className="text-[12px] text-muted-foreground text-center max-w-md mt-2">
                                Identifying key themes for mapping across your uploaded transcripts…
                            </p>
                        </div>
                    )}

                    {/* Step 3: Theme Selection */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-5 flex items-start gap-4">
                                <div className="h-9 w-9 rounded-[10px] bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)] shadow-inset-edge flex items-center justify-center shrink-0">
                                    <Sparkles className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground">
                                        Suggested Clustering Themes
                                    </h3>
                                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                                        Based on the transcripts, we&apos;ve identified these key themes. Customise as needed.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6">
                                <div className="space-y-5">
                                    <div className="flex flex-wrap gap-2">
                                        {themes.map((theme) => (
                                            <div
                                                key={theme}
                                                className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1 shadow-inset-edge bg-[color:var(--primary-soft)] text-[color:var(--primary)]"
                                            >
                                                <span className="text-[12.5px] font-medium">{theme}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveTheme(theme)}
                                                    className="p-0.5 rounded-full text-[color:var(--primary)]/70 hover:text-[color:var(--danger)] hover:bg-[color:var(--danger-soft)] transition-colors"
                                                    aria-label={`Remove ${theme}`}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 pt-5 border-t border-[color:var(--border-subtle)]">
                                        <Input
                                            placeholder="Add a custom theme..."
                                            value={customTheme}
                                            onChange={(e) => setCustomTheme(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                                            className="max-w-md"
                                        />
                                        <Button variant="outline" onClick={handleAddTheme} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setStep(1)}>
                                    Back
                                </Button>
                                <Button
                                    size="lg"
                                    onClick={handleBeginMapping}
                                    className="gap-2"
                                >
                                    Begin Mapping
                                    <Network className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Final Processing */}
                    {step === 4 && (
                        <div className="flex flex-col items-center justify-center py-24 animate-in fade-in duration-700">
                            <div className="relative h-14 w-14 flex items-center justify-center">
                                <div className="absolute inset-0 rounded-full bg-[color:var(--knowledge-soft)] animate-pulse" />
                                <Loader2 className="h-7 w-7 text-[color:var(--knowledge)] animate-spin relative z-10" />
                            </div>
                            <h3 className="mt-6 text-lg font-semibold text-foreground">
                                Generating Map
                            </h3>
                            <Eyebrow className="mt-1 justify-center text-[color:var(--knowledge)]">
                                AI Clustering
                            </Eyebrow>
                            <p className="text-[12px] text-muted-foreground text-center max-w-md mt-2">
                                Clustering insights across {files.length} transcripts…
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
