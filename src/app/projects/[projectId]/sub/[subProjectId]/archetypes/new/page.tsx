"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Loader2,
    Users,
    Network,
    Check,
    ChevronRight,
    Sparkles,
    FileText,
    Clock,
} from "lucide-react";

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

interface MappingSessionInfo {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { transcripts: number; clusters: number };
}



export default function NewArchetypePage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const router = useRouter();

    // Step 1: Select Mappings, Step 2: Generating, Step 3: Reveal animation
    const [step, setStep] = useState(1);
    const [mappingSessions, setMappingSessions] = useState<MappingSessionInfo[]>([]);
    const [selectedMappingIds, setSelectedMappingIds] = useState<string[]>([]);
    const [loadingMappings, setLoadingMappings] = useState(true);

    // Generation state
    const [generationPhase, setGenerationPhase] = useState(0);
    const PHASES = [
        "Reading mapping data...",
        "Analysing behavioural patterns...",
        "Identifying recurring tensions...",
        "Synthesising archetypes...",
        "Grounding in evidence...",
    ];

    // Reveal animation state
    const [generatedArchetypes, setGeneratedArchetypes] = useState<{ id: string; name: string }[]>([]);
    const [revealedCount, setRevealedCount] = useState(0);
    const [stacking, setStacking] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        fetchMappings();
    }, [subProjectId]);

    // Phase animation for loading state
    useEffect(() => {
        if (step !== 2) return;
        const interval = setInterval(() => {
            setGenerationPhase(prev => (prev + 1) % PHASES.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [step]);

    // Reveal animation sequence
    useEffect(() => {
        if (step !== 3) return;

        // Phase 1: Reveal cards one at a time
        if (revealedCount < generatedArchetypes.length) {
            const timer = setTimeout(() => {
                setRevealedCount(prev => prev + 1);
            }, 350);
            return () => clearTimeout(timer);
        }

        // Phase 2: After all revealed, wait then stack
        if (!stacking && revealedCount >= generatedArchetypes.length) {
            const timer = setTimeout(() => {
                setStacking(true);
            }, 1200);
            return () => clearTimeout(timer);
        }

        // Phase 3: After stacking, fade out and redirect
        if (stacking && !fadeOut) {
            const timer = setTimeout(() => {
                setFadeOut(true);
            }, 1000);
            return () => clearTimeout(timer);
        }

        if (fadeOut) {
            const timer = setTimeout(() => {
                router.push(`/projects/${projectId}/sub/${subProjectId}?tab=archetypes`);
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [step, revealedCount, stacking, fadeOut, generatedArchetypes.length]);

    const fetchMappings = async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();
            if (res.ok && data.data?.mappingSessions) {
                const completed = data.data.mappingSessions.filter(
                    (s: MappingSessionInfo) => s.status === "COMPLETE"
                );
                setMappingSessions(completed);
            }
        } catch (err) {
            console.error("Failed to fetch mappings:", err);
        } finally {
            setLoadingMappings(false);
        }
    };

    const toggleMapping = (id: string) => {
        setSelectedMappingIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (selectedMappingIds.length === 0) return;

        setStep(2);

        const autoName = `Archetypes — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

        try {
            const createRes = await fetch(`/api/sub-projects/${subProjectId}/archetypes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: autoName }),
            });

            if (!createRes.ok) throw new Error("Failed to create session");
            const { data: session } = await createRes.json();

            const genRes = await fetch(`/api/archetypes/${session.id}/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mappingSessionIds: selectedMappingIds }),
            });

            if (!genRes.ok) {
                const errData = await genRes.json().catch(() => ({}));
                throw new Error(errData.error || "Generation failed");
            }

            const genData = await genRes.json();
            const archetypes = genData.data?.archetypes || [];

            // Transition to reveal animation
            setGeneratedArchetypes(archetypes);
            setRevealedCount(0);
            setStacking(false);
            setFadeOut(false);
            setStep(3);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Something went wrong. Please try again.");
            setStep(1);
        }
    };

    return (
        <div className={`min-h-screen relative overflow-hidden transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            {/* Background Glow */}
            {/* Background removed */}

            <div className="max-w-4xl mx-auto px-6 py-10">
                {/* Header */}
                {step !== 3 && (
                    <div className="mb-8">
                        <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=archetypes`} className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-4 inline-flex items-center gap-1">
                            <ArrowLeft className="h-3 w-3" />
                            Back to Workspace
                        </Link>
                        <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                                <Users className="h-6 w-6" />
                            </div>
                            Generate Archetypes
                        </h1>
                    </div>
                )}

                {/* Step 1: Setup */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Card className="border-border bg-card">
                            <CardContent className="p-8 space-y-8">
                                {/* Mapping Selection */}
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                        Select Mapping Sessions
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Choose which mapping data to use for generating archetypes. You can select multiple.
                                    </p>

                                    {loadingMappings ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : mappingSessions.length === 0 ? (
                                        <div className="text-center py-10 bg-accent rounded-md border border-dashed border-border">
                                            <Network className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                            <p className="text-sm text-muted-foreground font-medium">No completed mapping sessions</p>
                                            <p className="text-xs text-muted-foreground mt-1">Create and complete a mapping session first.</p>
                                            <Link href={`/projects/${projectId}/sub/${subProjectId}/map/new`} className="mt-4 inline-block">
                                                <Button variant="outline" size="sm" className="rounded-full">
                                                    Create Mapping <ChevronRight className="h-3 w-3 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {mappingSessions.map((session) => {
                                                const isSelected = selectedMappingIds.includes(session.id);
                                                return (
                                                    <button
                                                        key={session.id}
                                                        onClick={() => toggleMapping(session.id)}
                                                        className={`
                                                            relative flex items-start gap-4 p-4 rounded-md border-2 transition-all duration-300 text-left
                                                            ${isSelected
                                                                ? "border-primary bg-accent shadow-sm"
                                                                : "border-border bg-white hover:border-input hover:bg-accent"
                                                            }
                                                        `}
                                                    >
                                                        <div className={`
                                                            h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                                                            ${isSelected
                                                                ? "border-primary bg-primary"
                                                                : "border-border bg-white"
                                                            }
                                                        `}>
                                                            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <h4 className={`font-semibold text-sm leading-tight ${isSelected ? "text-foreground" : "text-foreground"}`}>
                                                                {session.name}
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                                                    <FileText className="h-3 w-3" />
                                                                    {session._count.transcripts} files
                                                                </span>
                                                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {new Date(session.createdAt).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={selectedMappingIds.length === 0}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8"
                            >
                                Generate Archetypes
                                <Sparkles className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Generating */}
                {step === 2 && (
                    <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-1000">
                        <div className="relative group">
                            <div className="relative h-28 w-28">
                                <div className="absolute inset-0 rounded-full border border-border border-t-primary animate-[spin_4s_linear_infinite]" />
                                <div className="absolute inset-2.5 rounded-full border border-border border-b-primary/80 animate-[spin_2.5s_linear_infinite_reverse]" />
                                <div className="absolute inset-5 rounded-full border border-border border-t-primary/60 animate-[spin_1.8s_linear_infinite]" />
                                <div className="absolute inset-8 rounded-full bg-background border border-border shadow-inner flex items-center justify-center">
                                    <div className="h-4 w-4 rounded-full bg-primary animate-[pulse_2s_ease-in-out_infinite]" />
                                </div>
                            </div>
                        </div>
                        <div className="mt-10 text-center space-y-3 relative z-10">
                            <h3 className="text-xl font-light tracking-tight text-foreground">
                                Generating Archetypes
                            </h3>
                            <div className="flex flex-col gap-2 items-center">
                                <p className="text-[11px] font-medium tracking-widest text-primary uppercase">
                                    AI SYNTHESIS
                                </p>
                                <p key={generationPhase} className="text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500 min-h-[20px]">
                                    {PHASES[generationPhase]}
                                </p>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4">
                                Our AI agents are hard at work — this may take a moment
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 3: Reveal Animation */}
                {step === 3 && (
                    <div className="flex flex-col items-center justify-center h-[75vh] relative">
                        {/* Title */}
                        <div className={`text-center mb-10 transition-all duration-700 ${stacking ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
                            <p className="text-[11px] font-medium tracking-widest text-primary uppercase mb-2">
                                Archetypes Generated
                            </p>
                            <h3 className="text-2xl font-light tracking-tight text-foreground">
                                {generatedArchetypes.length} behavioural archetypes identified
                            </h3>
                        </div>

                        {/* Cards Container */}
                        <div className="relative flex items-center justify-center" style={{ minHeight: 200 }}>
                            {generatedArchetypes.map((archetype, index) => {
                                const isRevealed = index < revealedCount;


                                // Calculate card positions
                                const totalCards = generatedArchetypes.length;
                                const spread = Math.min(totalCards * 110, 500);
                                const startX = -spread / 2;
                                const normalX = startX + (index * (spread / (totalCards - 1 || 1)));

                                // Stacking: cards move to center with slight rotation spread
                                const stackRotation = (index - Math.floor(totalCards / 2)) * 3;
                                const stackY = index * -3;

                                return (
                                    <div
                                        key={archetype.id}
                                        className={`absolute transition-all ${stacking ? 'duration-700' : 'duration-500'} ease-out`}
                                        style={{
                                            transform: stacking
                                                ? `translate(0px, ${stackY}px) rotate(${stackRotation}deg) scale(0.95)`
                                                : isRevealed
                                                    ? `translate(${normalX}px, 0px) rotate(0deg) scale(1)`
                                                    : `translate(0px, 40px) rotate(0deg) scale(0.8)`,
                                            opacity: stacking && fadeOut ? 0 : isRevealed ? 1 : 0,
                                            zIndex: stacking ? totalCards - index : index,
                                        }}
                                    >
                                        <div className={`
                                            w-[100px] h-[120px] rounded-md bg-white border border-border
                                            shadow-lg flex flex-col items-start justify-end p-3
                                            ${stacking ? 'shadow-xl' : ''}
                                        `}>
                                            <Users className="h-4 w-4 text-muted-foreground absolute top-3 left-3" />
                                            <p className="text-[10px] font-bold text-foreground leading-tight line-clamp-3">
                                                {archetype.name}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
