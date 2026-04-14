"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    ArrowLeft,
    Loader2,
    Zap,
    Network,
    Users,
    Check,
    AlertCircle,
    Sparkles,
} from "lucide-react";

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

interface MappingSessionOption {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    _count: { transcripts: number; clusters: number };
}

interface ProfileOption {
    id: string;
    name: string;
    description: string;
    type: "archetype" | "kb_global" | "kb_project";
    kicker?: string | null;
}

const CREATIVE_MATRIX_ENABLERS = [
    { key: "technology_digital_media", label: "Technology & Digital Media" },
    { key: "events_programmes", label: "Events & Programmes" },
    { key: "internal_policies_procedures", label: "Internal Policies & Procedures" },
    { key: "public_policies_laws", label: "Public Policies & Laws" },
    { key: "games_competitions", label: "Games & Competitions" },
    { key: "mobile_wearable_tech", label: "Mobile & Wearable Tech" },
    { key: "social_media", label: "Social Media" },
    { key: "surprise_provocation", label: "Surprise & Provocation" },
    { key: "health_wellness", label: "Health & Wellness" },
    { key: "accessories", label: "Accessories" },
    { key: "physical_variation", label: "Physical Variation" },
    { key: "people_partnerships", label: "People & Partnerships" },
    { key: "hotspots_hangouts", label: "Hotspots & Hangouts" },
    { key: "engage_senses", label: "Engage Senses" },
    { key: "shows_videos", label: "Shows & Videos" },
    { key: "celebrities_superstars", label: "Celebrities & Superstars" },
];

export default function NewIdeationPage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Pre-fill from query params (for regeneration)
    const prefillMappingId = searchParams.get("mappingId") || "";
    const prefillProfileIds = searchParams.get("profileIds")?.split(",").filter(Boolean) || [];
    const prefillFocusAreas = searchParams.get("focusAreas")?.split(",").filter(Boolean) || [];

    const [mappingSessions, setMappingSessions] = useState<MappingSessionOption[]>([]);
    const [profiles, setProfiles] = useState<ProfileOption[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Form state
    const [selectedMappingId, setSelectedMappingId] = useState(prefillMappingId);
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(prefillProfileIds);
    const [selectedFocusAreas, setSelectedFocusAreas] = useState<string[]>(prefillFocusAreas);

    // Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationPhase, setGenerationPhase] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const PHASES = [
        "Reading mapping data & profiles...",
        "Analysing research patterns...",
        "Applying creative matrix lenses...",
        "Generating 8 concepts...",
        "Generating concept images...",
    ];

    useEffect(() => {
        fetchData();
    }, [subProjectId]);

    // Phase animation
    useEffect(() => {
        if (!isGenerating) return;
        const interval = setInterval(() => {
            setGenerationPhase(prev => (prev + 1) % PHASES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isGenerating]);

    async function fetchData() {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const sp = data.data;

            // Completed mapping sessions
            const completedMappings = (sp.mappingSessions || []).filter(
                (m: MappingSessionOption) => m.status === "COMPLETE"
            );
            setMappingSessions(completedMappings);

            // Profiles: archetypes from archetype sessions
            const archetypeProfiles: ProfileOption[] = [];
            for (const session of sp.archetypeSessions || []) {
                for (const arch of session.archetypes || []) {
                    archetypeProfiles.push({
                        id: arch.id,
                        name: arch.name,
                        description: arch.kicker || arch.description || "",
                        type: "archetype",
                        kicker: arch.kicker,
                    });
                }
            }

            // Fetch KB personas (global + project)
            const kbProfiles: ProfileOption[] = [];

            // Fetch global KB personas
            try {
                const globalRes = await fetch("/api/archetypes/kb-personas");
                if (globalRes.ok) {
                    const globalData = await globalRes.json();
                    for (const doc of globalData.data || []) {
                        kbProfiles.push({
                            id: doc.id,
                            name: doc.title,
                            description: doc.parsedMetaJson ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.name || ""; } catch { return ""; } })() : "",
                            type: "kb_global",
                        });
                    }
                }
            } catch { /* skip */ }

            // Fetch project KB personas
            try {
                const projRes = await fetch(`/api/archetypes/kb-personas?projectId=${sp.project.id}`);
                if (projRes.ok) {
                    const projData = await projRes.json();
                    for (const doc of projData.data || []) {
                        kbProfiles.push({
                            id: doc.id,
                            name: doc.title,
                            description: doc.parsedMetaJson ? (() => { try { const m = JSON.parse(doc.parsedMetaJson); return m.bio || m.name || ""; } catch { return ""; } })() : "",
                            type: "kb_project",
                        });
                    }
                }
            } catch { /* skip */ }

            setProfiles([...archetypeProfiles, ...kbProfiles]);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoadingData(false);
        }
    }

    function toggleProfile(id: string) {
        setSelectedProfileIds(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    }

    function toggleFocusArea(key: string) {
        setSelectedFocusAreas(prev =>
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    }

    async function handleGenerate() {
        if (!selectedMappingId) return;
        setIsGenerating(true);
        setError(null);
        setGenerationPhase(0);

        try {
            // 1. Create session
            const createRes = await fetch(`/api/sub-projects/${subProjectId}/ideations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mappingId: selectedMappingId,
                    profileIds: selectedProfileIds,
                    focusAreas: selectedFocusAreas,
                }),
            });

            if (!createRes.ok) {
                const err = await createRes.json();
                throw new Error(err.error || "Failed to create session");
            }

            const { data: session } = await createRes.json();

            // 2. Trigger generation
            const genRes = await fetch(
                `/api/sub-projects/${subProjectId}/ideations/${session.id}/generate`,
                { method: "POST" }
            );

            if (!genRes.ok) {
                const err = await genRes.json();
                throw new Error(err.error || "Generation failed");
            }

            // 3. Redirect to results
            router.push(`/projects/${projectId}/sub/${subProjectId}/ideation/${session.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsGenerating(false);
        }
    }

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    // Generation loading screen
    if (isGenerating) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
                <div className="relative">
                    <div className="h-20 w-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-interact-subtle)' }}>
                        <Zap className="h-10 w-10 animate-pulse" style={{ color: 'var(--color-interact)' }} />
                    </div>
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-foreground">Generating Ideation</h2>
                    <p className="text-sm text-muted-foreground animate-pulse">
                        {PHASES[generationPhase]}
                    </p>
                </div>
                <p className="text-xs text-muted-foreground/60 max-w-xs text-center">
                    This may take up to 2 minutes as we generate 8 concepts with illustrations.
                </p>
            </div>
        );
    }

    const hasCompletedMappings = mappingSessions.length > 0;

    return (
        <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to workspace
                </Link>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--color-interact-subtle)' }}>
                        <Zap className="h-5 w-5" style={{ color: 'var(--color-interact)' }} />
                    </div>
                    New Ideation — Crazy 8s
                </h1>
                <p className="text-sm text-muted-foreground mt-2">
                    Generate 8 creative design concepts grounded in your research data.
                </p>
            </div>

            {!hasCompletedMappings ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Network className="h-12 w-12 text-muted-foreground/40 mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">No Completed Mappings</h3>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Complete a mapping session first to use Ideation. The AI needs clustered interview data to generate meaningful concepts.
                        </p>
                        <Link href={`/projects/${projectId}/sub/${subProjectId}/map/new`}>
                            <Button className="mt-4" variant="outline">
                                <Network className="h-4 w-4 mr-2" /> Create a Mapping
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {/* 1. Select Mapping */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Select Mapping <span className="text-destructive">*</span>
                        </Label>
                        <div className="grid gap-2">
                            {mappingSessions.map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setSelectedMappingId(m.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                        selectedMappingId === m.id
                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20"
                                            : "border-border bg-card hover:bg-muted/50"
                                    }`}
                                >
                                    <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-knowledge-subtle)', color: 'var(--color-knowledge)' }}>
                                        {selectedMappingId === m.id ? <Check className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {new Date(m.createdAt).toLocaleDateString()} &middot; {m._count.transcripts} files &middot; {m._count.clusters} clusters
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Select Profiles */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Select Profiles <span className="text-muted-foreground font-normal normal-case">(optional, multi-select)</span>
                        </Label>

                        {profiles.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 rounded-xl border border-dashed border-border bg-muted/30">
                                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                    No profiles available. Concepts will be based on mapping data and project context only.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Generated Profiles */}
                                {profiles.filter(p => p.type === "archetype").length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Generated Profiles</p>
                                        <div className="grid gap-2">
                                            {profiles.filter(p => p.type === "archetype").map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => toggleProfile(p.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                                        selectedProfileIds.includes(p.id)
                                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20"
                                                            : "border-border bg-card hover:bg-muted/50"
                                                    }`}
                                                >
                                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        selectedProfileIds.includes(p.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                                                    }`}>
                                                        {selectedProfileIds.includes(p.id) && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                                                        {p.kicker && <p className="text-[11px] text-muted-foreground truncate">{p.kicker}</p>}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* KB Personas */}
                                {profiles.filter(p => p.type !== "archetype").length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Knowledge Base Personas</p>
                                        <div className="grid gap-2">
                                            {profiles.filter(p => p.type !== "archetype").map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => toggleProfile(p.id)}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                                        selectedProfileIds.includes(p.id)
                                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20"
                                                            : "border-border bg-card hover:bg-muted/50"
                                                    }`}
                                                >
                                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                        selectedProfileIds.includes(p.id) ? "border-primary bg-primary" : "border-muted-foreground/30"
                                                    }`}>
                                                        {selectedProfileIds.includes(p.id) && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                                                        <p className="text-[11px] text-muted-foreground truncate">{p.description}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedProfileIds.length === 0 && (
                                    <p className="text-[11px] text-amber-600 flex items-center gap-1.5">
                                        <AlertCircle className="h-3 w-3" />
                                        No profiles selected — concepts will be based on mapping data only
                                    </p>
                                )}
                            </>
                        )}
                    </div>

                    {/* 3. Focus Areas */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Creative Focus Areas <span className="text-muted-foreground font-normal normal-case">(optional)</span>
                        </Label>
                        <p className="text-[11px] text-muted-foreground -mt-1">
                            Select creative lenses to guide concept generation. If none selected, the AI will consider all and pick the most relevant.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {CREATIVE_MATRIX_ENABLERS.map((enabler) => (
                                <button
                                    key={enabler.key}
                                    onClick={() => toggleFocusArea(enabler.key)}
                                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all text-left text-xs ${
                                        selectedFocusAreas.includes(enabler.key)
                                            ? "border-primary bg-accent/50 ring-1 ring-primary/20 font-semibold text-foreground"
                                            : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                                    }`}
                                >
                                    <div className={`h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        selectedFocusAreas.includes(enabler.key) ? "border-primary bg-primary" : "border-muted-foreground/30"
                                    }`}>
                                        {selectedFocusAreas.includes(enabler.key) && <Check className="h-2.5 w-2.5 text-white" />}
                                    </div>
                                    {enabler.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={!selectedMappingId || isGenerating}
                        className="w-full h-12 text-base font-bold rounded-xl"
                        style={{ backgroundColor: 'var(--color-interact)' }}
                    >
                        <Sparkles className="h-5 w-5 mr-2" />
                        Ideate — Generate 8 Concepts
                    </Button>
                </div>
            )}
        </div>
    );
}
