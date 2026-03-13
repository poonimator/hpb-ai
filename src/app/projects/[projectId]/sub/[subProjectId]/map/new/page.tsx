"use client";

import { useState, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Upload,
    FileText,
    X,
    Loader2,
    Check,
    Wand2,
    Plus,
    Network,
    Sparkles,
    Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
                f.type === "text/plain" || f.type === "application/pdf" ||
                f.name.endsWith(".md") || f.name.endsWith(".docx")
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
        <div className="min-h-screen relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-violet-50 to-transparent blur-3xl -z-10 pointer-events-none" />

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="mb-8">
                    <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=mapping`} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 inline-flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" />
                        Back to Workspace
                    </Link>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                            <Network className="h-6 w-6" />
                        </div>
                        New Mapping Session
                    </h1>
                </div>

                {/* STEPS */}

                {/* Step 1: Upload & Name */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-violet-100/50 shadow-lg shadow-violet-500/5 bg-white/80 backdrop-blur-xl">
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Youth Mental Health Interviews - Batch 1"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="h-12 bg-white border-border focus:border-violet-500 focus:ring-violet-500/20 text-lg"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Interview Transcripts</Label>
                                    <div
                                        className="border-2 border-dashed border-border rounded-2xl p-8 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-all cursor-pointer relative group"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".txt,.pdf,.md,.docx"
                                            onChange={handleFileSelect}
                                        />
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-violet-50 flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                                                <Upload className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-foreground">Click to upload or drag & drop</p>
                                                <p className="text-sm text-muted-foreground">PDF, Custom Text, Markdown</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* File List */}
                                    {files.length > 0 && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                            {files.map((f) => (
                                                <div key={f.id} className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl shadow-sm">
                                                    <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center text-muted-foreground">
                                                        <FileText className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground truncate">{f.file.name}</p>
                                                        <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                    <button onClick={() => removeFile(f.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleNext}
                                disabled={!name || files.length === 0}
                                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8 shadow-lg shadow-violet-600/20"
                            >
                                Next Step
                                <Wand2 className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Loading State */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                        <div className="h-20 w-20 rounded-3xl bg-violet-50 flex items-center justify-center mb-6 relative">
                            <div className="absolute inset-0 bg-violet-400/20 blur-xl rounded-full animate-pulse" />
                            <Loader2 className="h-10 w-10 text-violet-600 animate-spin relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">Analyzing Context</h2>
                        <p className="text-muted-foreground text-center max-w-md">
                            Reading uploaded transcripts and identifying key themes for mapping...
                        </p>
                    </div>
                )}

                {/* Step 3: Theme Selection */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                                <Sparkles className="h-5 w-5 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground">Suggested Clustering Themes</h3>
                                <p className="text-sm text-muted-foreground">Based on the transcripts, we've identified these key themes. Customize them as needed.</p>
                            </div>
                        </div>

                        <Card className="border-border shadow-sm">
                            <CardContent className="p-8">
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-3">
                                        {themes.map((theme) => (
                                            <div key={theme} className="group flex items-center gap-2 pl-4 pr-2 py-2 bg-white border border-border rounded-full shadow-sm hover:border-violet-300 transition-colors">
                                                <span className="font-medium text-sm text-foreground">{theme}</span>
                                                <button onClick={() => handleRemoveTheme(theme)} className="p-1 rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                                                    <X className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-3 pt-6 border-t border-border">
                                        <Input
                                            placeholder="Add a custom theme..."
                                            value={customTheme}
                                            onChange={(e) => setCustomTheme(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTheme()}
                                            className="max-w-md"
                                        />
                                        <Button variant="outline" onClick={handleAddTheme}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setStep(1)} className="rounded-full">Back</Button>
                            <Button
                                size="lg"
                                onClick={handleBeginMapping}
                                className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-8 shadow-lg shadow-violet-600/20"
                            >
                                Begin Mapping
                                <Network className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 4: Final Processing */}
                {step === 4 && (
                    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-1000">

                        <div className="relative group">
                            {/* Outer Glow */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 rounded-full blur-2xl opacity-75 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />

                            {/* Rotating Rings */}
                            <div className="relative h-24 w-24">
                                {/* Ring 1 - Slow Spin */}
                                <div className="absolute inset-0 rounded-full border border-white/20 border-t-violet-400/80 animate-[spin_3s_linear_infinite]" />

                                {/* Ring 2 - Fast Reverse Spin */}
                                <div className="absolute inset-2 rounded-full border border-white/10 border-b-fuchsia-400/80 animate-[spin_2s_linear_infinite_reverse]" />

                                {/* Core - Breathing */}
                                <div className="absolute inset-6 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-inner flex items-center justify-center animate-[pulse_2s_ease-in-out_infinite]">
                                    <div className="h-3 w-3 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]" />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 text-center space-y-3 relative z-10">
                            <h3 className="text-xl font-light tracking-tight text-foreground">
                                Generating Map
                            </h3>
                            <div className="flex flex-col gap-1 items-center">
                                <p className="text-[11px] font-medium tracking-widest text-violet-500 uppercase">
                                    AI CLUSTERING
                                </p>
                                <p className="text-[10px] text-muted-foreground animate-pulse">
                                    The AI is clustering insights across {files.length} transcripts...
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
