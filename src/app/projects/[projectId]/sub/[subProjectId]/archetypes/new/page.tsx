"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { Badge } from "@/components/ui/badge";
import { type WorkspaceRailSubProject } from "@/components/tools/workspace-rail";
import {
    Loader2,
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
    const [profileTarget, setProfileTarget] = useState("");
    const [subProject, setSubProject] = useState<WorkspaceRailSubProject | null>(null);

    // Generation state
    const [generationPhase, setGenerationPhase] = useState(0);
    const PHASES = [
        "Reading mapping data...",
        "Analysing behavioural patterns...",
        "Identifying recurring tensions...",
        "Synthesising profiles...",
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
            if (res.ok && data.data) {
                if (data.data.mappingSessions) {
                    const completed = data.data.mappingSessions.filter(
                        (s: MappingSessionInfo) => s.status === "COMPLETE"
                    );
                    setMappingSessions(completed);
                }
                setSubProject({
                    id: data.data.id,
                    name: data.data.name,
                    researchStatement: data.data.researchStatement ?? null,
                    ageRange: data.data.ageRange ?? null,
                    lifeStage: data.data.lifeStage ?? null,
                    createdAt: data.data.createdAt ?? null,
                    project: data.data.project ?? null,
                });
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
        if (selectedMappingIds.length === 0 || profileTarget.trim() === "") return;

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
                body: JSON.stringify({ mappingSessionIds: selectedMappingIds, profileTarget: profileTarget.trim() }),
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

    const railNode = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Wizard</Badge>
                    <span className="text-caption text-muted-foreground">
                        Step {step} / 3
                    </span>
                </div>
                <h2 className="text-display-4 text-foreground leading-tight">
                    {subProject?.name || "Archetypes"}
                </h2>
                {subProject?.researchStatement && (
                    <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {subProject.researchStatement}
                    </p>
                )}
            </RailHeader>

            <RailSection title="Selections">
                <MetaRow k="Mappings" v={selectedMappingIds.length > 0 ? selectedMappingIds.length : "—"} />
                <MetaRow k="Profiling" v={profileTarget || "—"} />
            </RailSection>

            <RailSection title="Pipeline">
                <MetaRow k="Mode" v="Archetype generation" />
                <MetaRow k="Source" v="Mapping clusters" />
            </RailSection>

            <div className="flex-1" />
        </>
    );

    // Step 3: Reveal animation — must be full-viewport, chromeless. Render OUTSIDE the frame.
    if (step === 3) {
        return (
            <div className={`flex flex-col flex-1 min-h-0 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                <div className="py-8">
                    <div className="flex flex-col items-center justify-center h-[75vh] relative">
                        {/* Title */}
                        <div className={`text-center mb-10 transition-all duration-700 ${stacking ? 'opacity-0 -translate-y-4' : 'opacity-100'}`}>
                            <p className="text-caption font-medium tracking-widest text-[color:var(--primary)] uppercase mb-2">
                                Profiles Generated
                            </p>
                            <h3 className="text-display-2 text-foreground">
                                {generatedArchetypes.length} behavioural profiles identified
                            </h3>
                        </div>

                        {/* Cards Container */}
                        <div className="relative flex items-center justify-center" style={{ minHeight: 200 }}>
                            {generatedArchetypes.map((archetype, index) => {
                                const isRevealed = index < revealedCount;

                                // Calculate card positions
                                const totalCards = generatedArchetypes.length;
                                const spread = Math.min(totalCards * 150, 640);
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
                                        <div className="w-[140px] h-[170px] rounded-[14px] bg-[color:var(--surface)] shadow-card flex flex-col items-start justify-end p-4">
                                            <p className="text-display-4 text-foreground leading-tight line-clamp-3">
                                                {archetype.name}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{
                    href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes`,
                    label: "Back",
                }}
                crumbs={[
                    { label: "Archetypes", href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes` },
                    { label: "Generate Profiles" },
                ]}
            />

            <WorkspaceFrame variant="review" leftRail={railNode} scrollContained>
                {/* Step 1: Setup */}
                {step === 1 && (
                    <div className="mx-auto w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-8 space-y-8">
                            {/* Mapping Selection */}
                            <div className="space-y-3">
                                <Label className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                                    Select Mapping Sessions
                                </Label>
                                <p className="text-body-sm text-muted-foreground">
                                    Choose which mapping data to use for generating profiles. You can select multiple.
                                </p>

                                {loadingMappings ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" />
                                    </div>
                                ) : mappingSessions.length === 0 ? (
                                    <div className="text-center py-10 rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge">
                                        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[color:var(--surface)] shadow-inset-edge">
                                            <Network className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-body-sm text-foreground font-medium">No completed mapping sessions</p>
                                        <p className="text-caption text-muted-foreground mt-1">Create and complete a mapping session first.</p>
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
                                                        relative flex items-start gap-4 p-4 rounded-[14px] transition-all duration-300 text-left
                                                        ${isSelected
                                                            ? "shadow-outline-ring bg-[color:var(--primary-soft)] border border-[color:var(--primary)]"
                                                            : "bg-[color:var(--surface)] shadow-inset-edge hover:shadow-outline-ring"
                                                        }
                                                    `}
                                                >
                                                    <div className={`
                                                        h-6 w-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all
                                                        ${isSelected
                                                            ? "border-[color:var(--primary)] bg-[color:var(--primary)]"
                                                            : "border-[color:var(--border)] bg-[color:var(--surface)]"
                                                        }
                                                    `}>
                                                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-display-5 text-foreground leading-tight">
                                                            {session.name}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
                                                                <FileText className="h-3 w-3" />
                                                                {session._count.transcripts} files
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
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

                            {/* Target Audience Input */}
                            <div className="space-y-3 pt-6 border-t border-[color:var(--border-subtle)]">
                                <Label className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                                    Who are you profiling? *
                                </Label>
                                <p className="text-body-sm text-muted-foreground">
                                    Specify the exact group of people the AI should generate profiles for (e.g., &quot;parents&quot;, &quot;students&quot;, &quot;teachers&quot;). This helps the AI stay focused on the correct audience.
                                </p>
                                <Input
                                    placeholder="e.g. parents"
                                    className="max-w-md"
                                    value={profileTarget}
                                    onChange={(e) => setProfileTarget(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={selectedMappingIds.length === 0 || profileTarget.trim() === ""}
                                className="rounded-full px-8"
                            >
                                Generate Profiles
                                <Sparkles className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Step 2: Generating */}
                {step === 2 && (
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center h-[60vh] animate-in fade-in duration-1000">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-[color:var(--primary-soft)] shadow-inset-edge">
                            <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" />
                        </div>
                        <div className="mt-8 text-center space-y-2">
                            <h3 className="text-display-3 text-foreground">
                                Generating Profiles
                            </h3>
                            <p
                                key={generationPhase}
                                className="text-body-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500 min-h-[20px]"
                            >
                                {PHASES[generationPhase]}
                            </p>
                            <p className="text-caption text-muted-foreground mt-3">
                                Our AI agents are hard at work — this may take a moment
                            </p>
                        </div>
                    </div>
                )}

            </WorkspaceFrame>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
