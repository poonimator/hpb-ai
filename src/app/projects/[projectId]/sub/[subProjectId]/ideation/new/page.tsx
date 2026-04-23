"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    Zap,
    Network,
    Check,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { Badge } from "@/components/ui/badge";

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
    // NOTE: subProject state retained for parity with fetch flow; rail no longer renders it.
    const [, setSubProject] = useState<{
        id: string;
        name: string;
        researchStatement: string | null;
        ageRange: string | null;
        lifeStage: string | null;
        createdAt: string | null;
        project: unknown;
    } | null>(null);

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

            // Capture sub-project metadata for the workspace rail
            setSubProject({
                id: sp.id,
                name: sp.name,
                researchStatement: sp.researchStatement ?? null,
                ageRange: sp.ageRange ?? null,
                lifeStage: sp.lifeStage ?? null,
                createdAt: sp.createdAt ?? null,
                project: sp.project ?? null,
            });

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
                <div className="h-20 w-20 rounded-[14px] bg-[color:var(--primary-soft)] shadow-inset-edge flex items-center justify-center">
                    <Zap className="h-10 w-10 animate-pulse text-[color:var(--primary)]" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-display-3 text-foreground">Generating Ideation</h2>
                    <p className="text-body-sm text-muted-foreground animate-pulse">
                        {PHASES[generationPhase]}
                    </p>
                </div>
                <p className="text-caption text-muted-foreground/70 max-w-xs text-center">
                    This may take up to 2 minutes as we generate 8 concepts with illustrations.
                </p>
            </div>
        );
    }

    const hasCompletedMappings = mappingSessions.length > 0;

    const archetypeProfiles = profiles.filter(p => p.type === "archetype");
    const kbProfilesList = profiles.filter(p => p.type !== "archetype");

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: `/projects/${projectId}/sub/${subProjectId}?tab=ideation`, label: "Back" }}
                crumbs={[
                    { label: "Workspace", href: `/projects/${projectId}/sub/${subProjectId}?tab=ideation` },
                    { label: "New Ideation" },
                ]}
            />

            <WorkspaceFrame
                variant="review"
                leftRail={
                    <>
                        <RailHeader>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">Wizard</Badge>
                            </div>
                            <h2 className="text-display-4 text-foreground leading-tight">
                                New Ideation
                            </h2>
                            <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
                                Generate 8 concepts from a mapping session, guided by selected profiles and creative focus areas.
                            </p>
                        </RailHeader>

                        <RailSection title="Selections">
                            <MetaRow k="Mapping" v={selectedMappingId ? "1" : "—"} />
                            <MetaRow k="Profiles" v={selectedProfileIds.length} />
                            <MetaRow k="Focus areas" v={selectedFocusAreas.length} />
                        </RailSection>

                        <RailSection title="Output">
                            <MetaRow k="Concepts" v="8" />
                            <MetaRow k="Method" v="Crazy 8s" />
                        </RailSection>

                        <div className="flex-1" />
                    </>
                }
                scrollContained
            >
                <div className="mx-auto w-full max-w-3xl">
                    {/* Page title */}
                    <div className="flex items-start gap-3 mb-10">
                        <div className="h-10 w-10 rounded-[12px] bg-[color:var(--primary-soft)] shadow-inset-edge flex items-center justify-center shrink-0">
                            <Zap className="h-5 w-5 text-[color:var(--primary)]" />
                        </div>
                        <div>
                            <h1 className="text-display-3 text-foreground">New Ideation — Crazy 8s</h1>
                            <p className="text-body-sm text-muted-foreground mt-1">
                                Generate 8 creative design concepts from your research.
                            </p>
                        </div>
                    </div>

                    {!hasCompletedMappings ? (
                        <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-10 flex flex-col items-center justify-center text-center">
                            <div className="h-12 w-12 rounded-[12px] bg-[color:var(--surface-muted)] shadow-inset-edge flex items-center justify-center mb-4">
                                <Network className="h-6 w-6 text-muted-foreground/60" />
                            </div>
                            <h3 className="text-display-4 text-foreground mb-2">No completed mappings</h3>
                            <p className="text-body-sm text-muted-foreground max-w-sm">
                                Complete a mapping session first to use Ideation. The AI needs clustered interview data to generate meaningful concepts.
                            </p>
                            <Link href={`/projects/${projectId}/sub/${subProjectId}/map/new`}>
                                <Button className="mt-5" variant="outline">
                                    <Network className="h-4 w-4 mr-2" /> Create a Mapping
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {/* 1. Select Mapping */}
                            <section className="space-y-4">
                                <div>
                                    <Label className="text-ui-sm font-bold text-foreground uppercase tracking-[0.08em]">
                                        Select Mapping <span className="text-destructive">*</span>
                                    </Label>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {mappingSessions.map((m) => {
                                        const isSelected = selectedMappingId === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedMappingId(m.id)}
                                                aria-pressed={isSelected}
                                                className={`flex items-start gap-3 p-4 rounded-[12px] transition-all text-left ${
                                                    isSelected
                                                        ? "bg-[color:var(--primary-soft)] border border-[color:var(--primary)] shadow-outline-ring"
                                                        : "bg-[color:var(--surface)] shadow-inset-edge border border-transparent hover:border-[color:var(--border-subtle)]"
                                                }`}
                                            >
                                                <div
                                                    className={`h-8 w-8 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                                                        isSelected
                                                            ? "bg-[color:var(--primary)] text-white"
                                                            : "bg-[color:var(--surface-muted)] shadow-inset-edge text-[color:var(--primary)]"
                                                    }`}
                                                >
                                                    {isSelected ? <Check className="h-4 w-4" /> : <Network className="h-4 w-4" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-body-sm font-semibold text-foreground truncate">
                                                        {m.name}
                                                    </p>
                                                    <p className="text-caption text-muted-foreground mt-0.5">
                                                        {new Date(m.createdAt).toLocaleDateString()} · {m._count.transcripts} files · {m._count.clusters} clusters
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* 2. Select Profiles */}
                            <section className="space-y-4">
                                <div>
                                    <Label className="text-ui-sm font-bold text-foreground uppercase tracking-[0.08em]">
                                        Select Profiles <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional, multi-select)</span>
                                    </Label>
                                </div>

                                {profiles.length === 0 ? (
                                    <div className="flex items-center gap-2 p-4 rounded-[12px] bg-[color:var(--surface-muted)] shadow-inset-edge">
                                        <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <p className="text-body-sm text-muted-foreground">
                                            No profiles available. Concepts will be based on mapping data and project context only.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Generated Profiles */}
                                        {archetypeProfiles.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                                                    Generated Profiles
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {archetypeProfiles.map((p) => {
                                                        const isSelected = selectedProfileIds.includes(p.id);
                                                        return (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => toggleProfile(p.id)}
                                                                aria-pressed={isSelected}
                                                                className={`flex items-start gap-3 p-3.5 rounded-[12px] transition-all text-left ${
                                                                    isSelected
                                                                        ? "bg-[color:var(--primary-soft)] border border-[color:var(--primary)] shadow-outline-ring"
                                                                        : "bg-[color:var(--surface)] shadow-inset-edge border border-transparent hover:border-[color:var(--border-subtle)]"
                                                                }`}
                                                            >
                                                                <div className={`h-5 w-5 rounded-[5px] flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                                    isSelected
                                                                        ? "bg-[color:var(--primary)]"
                                                                        : "bg-[color:var(--surface-muted)] shadow-inset-edge"
                                                                }`}>
                                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-body-sm font-semibold text-foreground truncate">{p.name}</p>
                                                                    {p.kicker && <p className="text-caption text-muted-foreground truncate mt-0.5">{p.kicker}</p>}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* KB Personas */}
                                        {kbProfilesList.length > 0 && (
                                            <div className="space-y-3">
                                                <p className="text-caption font-semibold text-muted-foreground uppercase tracking-[0.1em]">
                                                    Knowledge Base Personas
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {kbProfilesList.map((p) => {
                                                        const isSelected = selectedProfileIds.includes(p.id);
                                                        return (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => toggleProfile(p.id)}
                                                                aria-pressed={isSelected}
                                                                className={`flex items-start gap-3 p-3.5 rounded-[12px] transition-all text-left ${
                                                                    isSelected
                                                                        ? "bg-[color:var(--primary-soft)] border border-[color:var(--primary)] shadow-outline-ring"
                                                                        : "bg-[color:var(--surface)] shadow-inset-edge border border-transparent hover:border-[color:var(--border-subtle)]"
                                                                }`}
                                                            >
                                                                <div className={`h-5 w-5 rounded-[5px] flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                                                    isSelected
                                                                        ? "bg-[color:var(--primary)]"
                                                                        : "bg-[color:var(--surface-muted)] shadow-inset-edge"
                                                                }`}>
                                                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-body-sm font-semibold text-foreground truncate">{p.name}</p>
                                                                    <p className="text-caption text-muted-foreground truncate mt-0.5">{p.description}</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {selectedProfileIds.length === 0 && (
                                            <p className="text-caption text-muted-foreground flex items-center gap-1.5">
                                                <AlertCircle className="h-3 w-3" />
                                                No profiles selected — concepts will be based on mapping data only.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* 3. Focus Areas */}
                            <section className="space-y-4">
                                <div>
                                    <Label className="text-ui-sm font-bold text-foreground uppercase tracking-[0.08em]">
                                        Creative Focus Areas <span className="text-muted-foreground font-normal normal-case tracking-normal">(optional)</span>
                                    </Label>
                                    <p className="text-caption text-muted-foreground mt-1.5">
                                        Select creative lenses to guide concept generation. If none selected, the AI will consider all and pick the most relevant.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                    {CREATIVE_MATRIX_ENABLERS.map((enabler) => {
                                        const isSelected = selectedFocusAreas.includes(enabler.key);
                                        return (
                                            <button
                                                key={enabler.key}
                                                onClick={() => toggleFocusArea(enabler.key)}
                                                aria-pressed={isSelected}
                                                className={`flex items-center gap-2.5 p-3 rounded-[10px] transition-all text-left text-body-sm ${
                                                    isSelected
                                                        ? "bg-[color:var(--primary-soft)] border border-[color:var(--primary)] shadow-outline-ring font-semibold text-foreground"
                                                        : "bg-[color:var(--surface)] shadow-inset-edge border border-transparent hover:border-[color:var(--border-subtle)] text-muted-foreground"
                                                }`}
                                            >
                                                <div className={`h-4 w-4 rounded-[4px] flex items-center justify-center flex-shrink-0 ${
                                                    isSelected
                                                        ? "bg-[color:var(--primary)]"
                                                        : "bg-[color:var(--surface-muted)] shadow-inset-edge"
                                                }`}>
                                                    {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                                </div>
                                                {enabler.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Error */}
                            {error && (
                                <div className="flex items-center gap-2 p-3.5 rounded-[12px] bg-destructive/10 text-destructive text-body-sm shadow-inset-edge">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Generate Button */}
                            <Button
                                onClick={handleGenerate}
                                disabled={!selectedMappingId || isGenerating}
                                size="lg"
                                className="w-full h-12 text-base font-semibold rounded-[12px] bg-[color:var(--primary)] text-white hover:bg-[color:var(--primary)]/90"
                            >
                                <Sparkles className="h-5 w-5 mr-2" />
                                Ideate — Generate 8 Concepts
                            </Button>
                        </div>
                    )}
                </div>
            </WorkspaceFrame>
        </div>
    );
}
