"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Zap,
    X,
    RefreshCw,
    Users,
    AlertTriangle,
    Target,
    Lightbulb,
    FlaskConical,
    BarChart3,
    ImageOff,
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { ConceptCard } from "@/components/tools/concept-card";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { Badge } from "@/components/ui/badge";

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string; sessionId: string }>;
}

interface IdeationConcept {
    name: string;
    tagline: string;
    whoIsItFor: { text: string; source: string; reason: string };
    whatProblem: { text: string; source: string; reason: string };
    bigIdea: { text: string; source: string; reason: string };
    howItWorks: {
        description: string;
        imageBase64?: string | null;
        imageTextLabels: string[];
    };
    whyMightItFail: { text: string; source: string; reason: string };
    whatToPrototype: { text: string; source: string; reason: string };
    howToMeasure: { text: string; source: string; reason: string };
}

// Theme → accent color palette (matches exploration prototype).
const THEME_PALETTE: Record<string, string> = {
    Technology: "var(--cat-1)",
    Services: "var(--cat-2)",
    Education: "var(--cat-3)",
    Events: "var(--cat-4)",
    Entertainment: "var(--cat-5)",
};

interface IdeationSession {
    id: string;
    name: string;
    status: string;
    sourceMappingId: string;
    sourceProfileIdsJson: string | null;
    focusAreasJson: string | null;
    resultJson: string | null;
    createdAt: string;
}

export default function IdeationResultsPage({ params }: PageProps) {
    const { projectId, subProjectId, sessionId } = use(params);
    const [session, setSession] = useState<IdeationSession | null>(null);
    const [concepts, setConcepts] = useState<IdeationConcept[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedConcept, setSelectedConcept] = useState<IdeationConcept | null>(null);
    const [subProject, setSubProject] = useState<{
        id: string;
        name: string;
        researchStatement: string | null;
        ageRange: string | null;
        lifeStage: string | null;
        createdAt: string | null;
        project: unknown;
    } | null>(null);

    useEffect(() => {
        fetchSession();
    }, [sessionId]);

    useEffect(() => {
        let cancelled = false;
        async function loadSubProject() {
            try {
                const res = await fetch(`/api/sub-projects/${subProjectId}`);
                if (!res.ok) return;
                const { data } = await res.json();
                if (cancelled || !data) return;
                setSubProject({
                    id: data.id,
                    name: data.name,
                    researchStatement: data.researchStatement ?? null,
                    ageRange: data.ageRange ?? null,
                    lifeStage: data.lifeStage ?? null,
                    createdAt: data.createdAt ?? null,
                    project: data.project ?? null,
                });
            } catch {
                /* ignore — rail will fall back to minimal placeholder */
            }
        }
        loadSubProject();
        return () => { cancelled = true; };
    }, [subProjectId]);

    async function fetchSession() {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/ideations/${sessionId}`);
            if (!res.ok) throw new Error("Session not found");
            const { data } = await res.json();
            setSession(data);
            if (data.resultJson) {
                setConcepts(JSON.parse(data.resultJson));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    }

    function handleRegenerate() {
        const profileIds = session?.sourceProfileIdsJson ? JSON.parse(session.sourceProfileIdsJson).join(",") : "";
        const focusAreas = session?.focusAreasJson ? JSON.parse(session.focusAreasJson).join(",") : "";
        const params = new URLSearchParams();
        if (session?.sourceMappingId) params.set("mappingId", session.sourceMappingId);
        if (profileIds) params.set("profileIds", profileIds);
        if (focusAreas) params.set("focusAreas", focusAreas);
        window.location.href = `/projects/${projectId}/sub/${subProjectId}/ideation/new?${params.toString()}`;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-destructive text-body-sm">{error || "Session not found"}</p>
                <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}>
                    <Button variant="outline">Back to workspace</Button>
                </Link>
            </div>
        );
    }

    if (session.status !== "COMPLETE" || concepts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-14 w-14 rounded-[12px] bg-[color:var(--primary-soft)] shadow-inset-edge flex items-center justify-center">
                    <Zap className="h-7 w-7 text-[color:var(--primary)]" />
                </div>
                <p className="text-body-sm text-muted-foreground">
                    {session.status === "PROCESSING" ? "Generation in progress..." :
                     session.status === "ERROR" ? "Generation failed. Please try again." :
                     "No concepts generated yet."}
                </p>
                <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}>
                    <Button variant="outline">Back to workspace</Button>
                </Link>
            </div>
        );
    }

    const themeCounts = concepts.reduce<Record<string, number>>((acc, c) => {
        const t = (c as unknown as { theme?: string }).theme;
        if (t) acc[t] = (acc[t] || 0) + 1;
        return acc;
    }, {});
    const themeEntries = Object.entries(themeCounts);
    const themePalette = ["var(--cat-1)", "var(--cat-2)", "var(--cat-3)", "var(--cat-4)", "var(--cat-5)"];
    const sourceProfileIds: string[] = session?.sourceProfileIdsJson
        ? (() => { try { return JSON.parse(session.sourceProfileIdsJson!) as string[]; } catch { return []; } })()
        : [];

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: `/projects/${projectId}/sub/${subProjectId}?tab=ideation`, label: "Back" }}
                crumbs={[
                    { label: "Workspace", href: `/projects/${projectId}/sub/${subProjectId}?tab=ideation` },
                    { label: session.name },
                ]}
                action={
                    <Button variant="outline" size="sm" onClick={handleRegenerate}>
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate
                    </Button>
                }
            />

            <WorkspaceFrame
                variant="review"
                leftRail={
                    <>
                        <RailHeader>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                    {session?.status === "COMPLETE" ? "Generated" : session?.status || "Draft"}
                                </Badge>
                                {session?.createdAt && (
                                    <span className="text-caption text-muted-foreground">
                                        {new Date(session.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                    </span>
                                )}
                            </div>
                            <h2 className="text-display-4 text-foreground leading-tight">
                                {session?.name || "Ideation"}
                            </h2>
                            {subProject?.researchStatement && (
                                <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
                                    {subProject.researchStatement}
                                </p>
                            )}
                        </RailHeader>

                        {themeEntries.length > 0 && (
                            <RailSection title="Themes">
                                <div className="flex flex-col gap-1">
                                    {themeEntries.map(([theme, count], i) => (
                                        <div
                                            key={theme}
                                            className="flex items-center justify-between py-1.5 text-body-sm"
                                        >
                                            <span className="inline-flex items-center gap-2 text-foreground">
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: themePalette[i % themePalette.length] }}
                                                />
                                                {theme}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground font-mono">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </RailSection>
                        )}

                        <RailSection title="Source">
                            <MetaRow k="Concepts" v={concepts.length} />
                            {session?.sourceMappingId && <MetaRow k="Mapping" v="Linked" />}
                            {sourceProfileIds.length > 0 && (
                                <MetaRow k="Profiles" v={sourceProfileIds.length} />
                            )}
                        </RailSection>

                        <div className="flex-1" />
                    </>
                }
                scrollContained
            >
                {/* Title */}
                <div className="mb-6 flex items-start gap-3">
                    <div className="h-10 w-10 rounded-[12px] bg-[color:var(--primary-soft)] shadow-inset-edge flex items-center justify-center shrink-0">
                        <Zap className="h-5 w-5 text-[color:var(--primary)]" />
                    </div>
                    <div>
                        <h1 className="text-display-3 text-foreground">{session.name}</h1>
                        <p className="text-caption text-muted-foreground mt-1">
                            {new Date(session.createdAt).toLocaleDateString()} · 8 concepts
                            <span className="mx-2 text-muted-foreground/40">·</span>
                            <span className="text-muted-foreground/70">Regeneration creates a separate batch</span>
                        </p>
                    </div>
                </div>

                {/* Concept grid — 4 columns so 8 concepts fit in 2 rows. */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {concepts.map((concept, index) => {
                        const conceptTheme = (concept as unknown as { theme?: string }).theme;
                        return (
                            <ConceptCard
                                key={index}
                                index={index + 1}
                                name={concept.name}
                                tagline={concept.tagline}
                                theme={conceptTheme}
                                themeColor={
                                    conceptTheme
                                        ? THEME_PALETTE[conceptTheme] ?? "var(--primary)"
                                        : "var(--primary)"
                                }
                                imageBase64={concept.howItWorks.imageBase64}
                                onClick={() => setSelectedConcept(concept)}
                            />
                        );
                    })}
                </div>
            </WorkspaceFrame>

            {/* Detail Overlay */}
            {selectedConcept && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="rounded-[14px] bg-[color:var(--surface)] shadow-card w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        {/* Overlay Header */}
                        <div className="sticky top-0 bg-[color:var(--surface)]/95 backdrop-blur-sm border-b border-[color:var(--border-subtle)] px-8 py-5 flex items-center justify-between rounded-t-[14px] z-10">
                            <h2 className="text-display-4 text-foreground font-semibold">{selectedConcept.name}</h2>
                            <button
                                onClick={() => setSelectedConcept(null)}
                                className="p-2 rounded-[8px] hover:bg-[color:var(--surface-muted)] transition-colors"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="px-8 py-6 space-y-6">
                            {/* Tagline */}
                            <p className="text-body-sm text-muted-foreground">{selectedConcept.tagline}</p>

                            {/* Row: Who / What / Big Idea */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <DetailCard
                                    icon={<Users className="h-3.5 w-3.5" />}
                                    title="Who is it for?"
                                    text={selectedConcept.whoIsItFor.text}
                                    source={selectedConcept.whoIsItFor.source}
                                    reason={selectedConcept.whoIsItFor.reason}
                                />
                                <DetailCard
                                    icon={<Target className="h-3.5 w-3.5" />}
                                    title="What problem does it solve?"
                                    text={selectedConcept.whatProblem.text}
                                    source={selectedConcept.whatProblem.source}
                                    reason={selectedConcept.whatProblem.reason}
                                />
                                <DetailCard
                                    icon={<Lightbulb className="h-3.5 w-3.5" />}
                                    title="What is the big idea?"
                                    text={selectedConcept.bigIdea.text}
                                    source={selectedConcept.bigIdea.source}
                                    reason={selectedConcept.bigIdea.reason}
                                />
                            </div>

                            {/* How does it work? — image + description */}
                            <div className="space-y-3">
                                <h3 className="text-ui-sm font-bold text-foreground uppercase tracking-[0.08em] flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-[color:var(--primary)]" />
                                    How does it work?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="rounded-[12px] overflow-hidden bg-[color:var(--surface-muted)] shadow-inset-edge aspect-square relative">
                                        {selectedConcept.howItWorks.imageBase64 ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={`data:image/png;base64,${selectedConcept.howItWorks.imageBase64}`}
                                                alt={selectedConcept.name}
                                                className="absolute inset-0 w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageOff className="h-10 w-10 text-muted-foreground/40" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-body-sm text-foreground leading-relaxed">
                                            {selectedConcept.howItWorks.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Row: Fail / Prototype / Measure */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <DetailCard
                                    icon={<AlertTriangle className="h-3.5 w-3.5" />}
                                    title="Why might it fail?"
                                    text={selectedConcept.whyMightItFail.text}
                                    source={selectedConcept.whyMightItFail.source}
                                    reason={selectedConcept.whyMightItFail.reason}
                                />
                                <DetailCard
                                    icon={<FlaskConical className="h-3.5 w-3.5" />}
                                    title="What should we prototype & test?"
                                    text={selectedConcept.whatToPrototype.text}
                                    source={selectedConcept.whatToPrototype.source}
                                    reason={selectedConcept.whatToPrototype.reason}
                                />
                                <DetailCard
                                    icon={<BarChart3 className="h-3.5 w-3.5" />}
                                    title="How might we measure success?"
                                    text={selectedConcept.howToMeasure.text}
                                    source={selectedConcept.howToMeasure.source}
                                    reason={selectedConcept.howToMeasure.reason}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailCard({ icon, title, text, source, reason }: {
    icon: React.ReactNode;
    title: string;
    text: string;
    source: string;
    reason: string;
}) {
    return (
        <div className="rounded-[12px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4 space-y-2.5">
            <div className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-[6px] bg-[color:var(--surface)] shadow-inset-edge flex items-center justify-center text-[color:var(--primary)] shrink-0">
                    {icon}
                </span>
                <h4 className="text-ui-sm font-bold text-foreground uppercase tracking-[0.08em]">
                    {title}
                </h4>
            </div>
            <p className="text-body-sm text-foreground leading-relaxed">{text}</p>
            <div className="pt-2 border-t border-[color:var(--border-subtle)] space-y-1">
                <p className="text-caption text-muted-foreground">
                    <span className="font-semibold text-foreground">Source:</span> {source}
                </p>
                <p className="text-caption text-muted-foreground">
                    <span className="font-semibold text-foreground">Why:</span> {reason}
                </p>
            </div>
        </div>
    );
}
