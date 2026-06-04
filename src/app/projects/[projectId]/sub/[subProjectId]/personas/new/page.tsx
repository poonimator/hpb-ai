"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import {
    Loader2,
    Check,
    FileText,
    Clock,
    Users,
    Sparkles,
    ChevronRight,
    Network,
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

interface ArchetypeInfo {
    id: string;
    name: string;
    kicker: string | null;
}

interface ArchetypeSessionInfo {
    id: string;
    status: string;
    archetypes: ArchetypeInfo[];
}

interface SubProjectInfo {
    id: string;
    name: string;
    researchStatement: string | null;
    mappingSessions: MappingSessionInfo[];
    archetypeSessions: ArchetypeSessionInfo[];
}

const PHASES = [
    "Reading interview transcripts…",
    "Classifying interviewees…",
    "Aggregating demographics and behaviours…",
    "Synthesising persona profiles…",
    "Generating persona portraits…",
];

export default function NewPersonaSessionPage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();

    const prefillArchetypeSessionId = searchParams.get("archetypeSessionId") || "";

    const [step, setStep] = useState<1 | 2>(1);
    const [phase, setPhase] = useState(0);

    const [subProject, setSubProject] = useState<SubProjectInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedMappingIds, setSelectedMappingIds] = useState<string[]>([]);
    const [profileTarget, setProfileTarget] = useState("");
    const [selectedArchetypeSessionId, setSelectedArchetypeSessionId] = useState<string>(prefillArchetypeSessionId);
    const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<string[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/sub-projects/${subProjectId}`);
                const data = await res.json();
                if (res.ok && data?.data) {
                    setSubProject(data.data);
                    // If an archetype session was pre-filled via URL, default-select all its archetypes
                    if (prefillArchetypeSessionId) {
                        const ses = (data.data.archetypeSessions || []).find(
                            (s: ArchetypeSessionInfo) => s.id === prefillArchetypeSessionId
                        );
                        if (ses) setSelectedArchetypeIds(ses.archetypes.map((a: ArchetypeInfo) => a.id));
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        })();
    }, [subProjectId, prefillArchetypeSessionId]);

    // Cycling phase animation
    useEffect(() => {
        if (step !== 2) return;
        const t = setInterval(() => setPhase(p => (p + 1) % PHASES.length), 3500);
        return () => clearInterval(t);
    }, [step]);

    const completedMappings = (subProject?.mappingSessions || []).filter(
        m => m.status === "COMPLETE"
    );
    const completedArchetypeSessions = (subProject?.archetypeSessions || []).filter(
        s => s.status === "COMPLETE" && s.archetypes.length > 0
    );

    // When user clicks an archetype session, also auto-select all of its
    // archetypes; clicking again toggles it off. Switching sessions clears
    // any prior subset selection.
    function toggleArchetypeSession(id: string) {
        if (selectedArchetypeSessionId === id) {
            setSelectedArchetypeSessionId("");
            setSelectedArchetypeIds([]);
        } else {
            setSelectedArchetypeSessionId(id);
            const ses = completedArchetypeSessions.find(s => s.id === id);
            if (ses) setSelectedArchetypeIds(ses.archetypes.map(a => a.id));
            else setSelectedArchetypeIds([]);
        }
    }

    function toggleArchetype(id: string) {
        setSelectedArchetypeIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    function toggleMapping(id: string) {
        setSelectedMappingIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }

    const canGenerate = selectedMappingIds.length > 0 && profileTarget.trim() !== "";

    async function handleGenerate() {
        if (!canGenerate) return;
        setError(null);
        setStep(2);
        setPhase(0);

        try {
            const createRes = await fetch(`/api/sub-projects/${subProjectId}/persona-sessions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mappingSessionIds: selectedMappingIds,
                    profileTarget: profileTarget.trim(),
                    archetypeSessionId: selectedArchetypeSessionId || null,
                    selectedArchetypeIds: selectedArchetypeIds.length > 0 ? selectedArchetypeIds : undefined,
                }),
            });
            const createData = await createRes.json();
            if (!createRes.ok) {
                throw new Error(createData?.error || "Failed to create persona session");
            }
            const sessionId = createData.data.id;

            const genRes = await fetch(`/api/persona-sessions/${sessionId}/generate`, {
                method: "POST",
            });
            const genData = await genRes.json();
            if (!genRes.ok) {
                throw new Error(genData?.error || "Generation failed");
            }

            router.push(`/projects/${projectId}/sub/${subProjectId}?tab=archetypes`);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            setStep(1);
        }
    }

    const selectedArchetypeSession = completedArchetypeSessions.find(s => s.id === selectedArchetypeSessionId);

    const railNode = (
        <>
            <RailHeader>
                <span className="text-caption text-muted-foreground">
                    Step {step} / 2
                </span>
                <h2 className="text-display-4 text-foreground leading-tight">
                    {subProject?.name || "Personas"}
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
                <MetaRow k="Archetypes" v={selectedArchetypeIds.length > 0 ? selectedArchetypeIds.length : "Optional"} />
            </RailSection>

            <RailSection title="Pipeline">
                <MetaRow k="Mode" v={selectedArchetypeSessionId ? "Archetype-anchored" : "Cluster-discovery"} />
                <MetaRow k="Source" v="Interview transcripts" />
            </RailSection>

            <div className="flex-1" />
        </>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes`, label: "Back" }}
                crumbs={[
                    { label: "Profiles", href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes` },
                    { label: "Generate Personas" },
                ]}
            />

            <WorkspaceFrame variant="review" leftRail={railNode} scrollContained>
                {step === 1 && (
                    <div className="mx-auto w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-8 space-y-8">
                            {/* Mapping selection */}
                            <div className="space-y-3">
                                <Label className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                                    Select Mapping Sessions
                                </Label>
                                <p className="text-body-sm text-muted-foreground">
                                    Choose which mapping data&rsquo;s transcripts to use for generating personas. You can select multiple.
                                </p>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" />
                                    </div>
                                ) : completedMappings.length === 0 ? (
                                    <div className="text-center py-10 rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge">
                                        <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-[10px] bg-[color:var(--surface)] shadow-inset-edge">
                                            <Network className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <p className="text-body-sm text-foreground font-medium">No completed mapping sessions</p>
                                        <p className="text-caption text-muted-foreground mt-1">Create and complete a mapping session first.</p>
                                        <Link href={`/projects/${projectId}/sub/${subProjectId}/map/new`} className="mt-4 inline-block">
                                            <Button variant="outline" size="sm" className="rounded-full">
                                                Create Mapping <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {completedMappings.map((session) => {
                                            const isSelected = selectedMappingIds.includes(session.id);
                                            return (
                                                <button
                                                    key={session.id}
                                                    onClick={() => toggleMapping(session.id)}
                                                    className={`relative flex items-start gap-4 p-4 rounded-[14px] transition-all duration-300 text-left ${
                                                        isSelected
                                                            ? "shadow-outline-ring bg-[color:var(--primary-soft)] border border-[color:var(--primary)]"
                                                            : "bg-[color:var(--surface)] shadow-inset-edge hover:shadow-outline-ring"
                                                    }`}
                                                >
                                                    <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                                        isSelected
                                                            ? "border-[color:var(--primary)] bg-[color:var(--primary)]"
                                                            : "border-[color:var(--border)] bg-[color:var(--surface)]"
                                                    }`}>
                                                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-display-5 text-foreground leading-tight">{session.name}</h4>
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

                            {/* Profile target */}
                            <div className="space-y-3 pt-6 border-t border-[color:var(--border-subtle)]">
                                <Label className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                                    Who are you profiling? *
                                </Label>
                                <p className="text-body-sm text-muted-foreground">
                                    Specify the exact group of people the AI should build personas for (e.g. &quot;parents&quot;, &quot;students&quot;, &quot;teachers&quot;). This helps the AI stay focused on the correct audience.
                                </p>
                                <Input
                                    placeholder="e.g. parents"
                                    className="max-w-md"
                                    value={profileTarget}
                                    onChange={(e) => setProfileTarget(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Archetype anchor (optional) */}
                            <div className="space-y-3 pt-6 border-t border-[color:var(--border-subtle)]">
                                <div className="flex items-baseline justify-between">
                                    <Label className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                                        Archetypes to consider
                                    </Label>
                                    <span className="text-caption text-muted-foreground italic">Optional</span>
                                </div>
                                <p className="text-body-sm text-muted-foreground">
                                    If you already have archetypes for this workspace, pick a session to anchor personas to it (one persona per archetype). Skip this and the AI will cluster the transcripts on its own and discover personas from scratch.
                                </p>

                                {completedArchetypeSessions.length === 0 ? (
                                    <div className="rounded-[12px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4 text-caption text-muted-foreground">
                                        No completed archetype sessions in this workspace yet — the AI will discover personas directly from the transcripts.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {completedArchetypeSessions.map((s) => {
                                                const isSelected = selectedArchetypeSessionId === s.id;
                                                return (
                                                    <button
                                                        key={s.id}
                                                        type="button"
                                                        onClick={() => toggleArchetypeSession(s.id)}
                                                        className={`relative flex items-start gap-4 p-4 rounded-[14px] transition-all duration-300 text-left ${
                                                            isSelected
                                                                ? "shadow-outline-ring bg-[color:var(--cat-3-soft)] border border-[color:var(--cat-3)]"
                                                                : "bg-[color:var(--surface)] shadow-inset-edge hover:shadow-outline-ring"
                                                        }`}
                                                    >
                                                        <div className={`h-6 w-6 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                                            isSelected
                                                                ? "border-[color:var(--cat-3)] bg-[color:var(--cat-3)]"
                                                                : "border-[color:var(--border)] bg-[color:var(--surface)]"
                                                        }`}>
                                                            {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                <h4 className="text-display-5 text-foreground leading-tight">
                                                                    {s.archetypes.length} archetype{s.archetypes.length === 1 ? "" : "s"}
                                                                </h4>
                                                            </div>
                                                            <p className="text-caption text-muted-foreground mt-1 line-clamp-2">
                                                                {s.archetypes.map(a => a.name).join(" · ")}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Per-archetype subset selection — shows once a session is picked */}
                                        {selectedArchetypeSession && (
                                            <div className="rounded-[12px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4 space-y-3">
                                                <div className="flex items-baseline justify-between">
                                                    <p className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                                                        Restrict to specific archetypes
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (selectedArchetypeIds.length === selectedArchetypeSession.archetypes.length) {
                                                                setSelectedArchetypeIds([]);
                                                            } else {
                                                                setSelectedArchetypeIds(selectedArchetypeSession.archetypes.map(a => a.id));
                                                            }
                                                        }}
                                                        className="text-caption text-[color:var(--primary)] hover:underline"
                                                    >
                                                        {selectedArchetypeIds.length === selectedArchetypeSession.archetypes.length ? "Clear all" : "Select all"}
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {selectedArchetypeSession.archetypes.map((a) => {
                                                        const isSelected = selectedArchetypeIds.includes(a.id);
                                                        return (
                                                            <button
                                                                key={a.id}
                                                                type="button"
                                                                onClick={() => toggleArchetype(a.id)}
                                                                className={`flex items-center gap-2.5 p-2.5 rounded-[10px] transition-all text-left text-body-sm ${
                                                                    isSelected
                                                                        ? "bg-[color:var(--surface)] shadow-outline-ring"
                                                                        : "bg-[color:var(--surface)]/60 shadow-inset-edge hover:bg-[color:var(--surface)]"
                                                                }`}
                                                            >
                                                                <div className={`h-4 w-4 rounded-[4px] flex items-center justify-center shrink-0 ${
                                                                    isSelected
                                                                        ? "bg-[color:var(--cat-3)]"
                                                                        : "bg-[color:var(--surface-muted)] shadow-inset-edge"
                                                                }`}>
                                                                    {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                                                                </div>
                                                                <span className={isSelected ? "font-semibold text-foreground" : "text-muted-foreground"}>
                                                                    {a.name}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                <p className="text-caption text-muted-foreground italic">
                                                    The AI will only build personas for the ticked archetypes ({selectedArchetypeIds.length}/{selectedArchetypeSession.archetypes.length}).
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-3.5 rounded-[12px] bg-destructive/10 text-destructive text-body-sm shadow-inset-edge">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={!canGenerate}
                                className="rounded-full px-8"
                            >
                                Generate Personas
                                <Sparkles className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center h-[60vh] animate-in fade-in duration-1000">
                        <div className="inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-[color:var(--primary-soft)] shadow-inset-edge">
                            <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" />
                        </div>
                        <div className="mt-8 text-center space-y-2">
                            <h3 className="text-display-3 text-foreground">Generating Personas</h3>
                            <p
                                key={phase}
                                className="text-body-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-1 duration-500 min-h-[20px]"
                            >
                                {PHASES[phase]}
                            </p>
                            <p className="text-caption text-muted-foreground mt-3">
                                This usually takes 1–3 minutes depending on transcript count.
                            </p>
                        </div>
                    </div>
                )}
            </WorkspaceFrame>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
