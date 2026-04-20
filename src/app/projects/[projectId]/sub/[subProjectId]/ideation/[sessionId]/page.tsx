"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
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

    useEffect(() => {
        fetchSession();
    }, [sessionId]);

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
                <p className="text-destructive">{error || "Session not found"}</p>
                <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}>
                    <Button variant="outline">Back to workspace</Button>
                </Link>
            </div>
        );
    }

    if (session.status !== "COMPLETE" || concepts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Zap className="h-12 w-12 text-muted-foreground/40" />
                <p className="text-muted-foreground">
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

    return (
        <div className="flex flex-col">
            {/* Header — breaks out of max-w-7xl container to go edge-to-edge */}
            <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white border-b border-border">
                <div className="flex items-center justify-between px-8 py-3 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/projects/${projectId}/sub/${subProjectId}?tab=ideation`}
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--color-interact-subtle)' }}>
                            <Zap className="h-4 w-4" style={{ color: 'var(--color-interact)' }} />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-foreground">{session.name}</h1>
                            <p className="text-[11px] text-muted-foreground">
                                {new Date(session.createdAt).toLocaleDateString()} &middot; 8 concepts
                                <span className="mx-1.5 text-muted-foreground/40">&middot;</span>
                                <span className="text-muted-foreground/60">Regeneration creates a separate batch</span>
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRegenerate} className="gap-2">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Regenerate
                    </Button>
                </div>
            </div>

            {/* 8-Card Grid — 4x2, vertically centred */}
            <div className="flex-1 flex items-center py-5">
                <div className="grid grid-cols-4 gap-4 w-full">
                    {concepts.map((concept, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedConcept(concept)}
                            className="group rounded-xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all duration-200 p-4 flex flex-col gap-3 cursor-pointer overflow-hidden text-left"
                        >
                            {/* Concept Name */}
                            <h3 className="text-sm font-bold text-foreground line-clamp-1">
                                {concept.name}
                            </h3>

                            {/* Generated Image */}
                            <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-muted/50">
                                {concept.howItWorks.imageBase64 ? (
                                    <img
                                        src={`data:image/png;base64,${concept.howItWorks.imageBase64}`}
                                        alt={concept.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <ImageOff className="h-8 w-8 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>

                            {/* Tagline */}
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {concept.tagline}
                            </p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Detail Overlay */}
            {selectedConcept && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-background rounded-2xl border border-border shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                        {/* Overlay Header */}
                        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-8 py-5 flex items-center justify-between rounded-t-2xl z-10">
                            <h2 className="text-xl font-bold text-foreground">{selectedConcept.name}</h2>
                            <button
                                onClick={() => setSelectedConcept(null)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                                <X className="h-5 w-5 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="px-8 py-6 space-y-8">
                            {/* Row 2: Who / What / Big Idea */}
                            <div className="grid grid-cols-3 gap-6">
                                <DetailCard
                                    icon={<Users className="h-4 w-4" />}
                                    title="Who is it for?"
                                    text={selectedConcept.whoIsItFor.text}
                                    source={selectedConcept.whoIsItFor.source}
                                    reason={selectedConcept.whoIsItFor.reason}
                                />
                                <DetailCard
                                    icon={<Target className="h-4 w-4" />}
                                    title="What problem does it solve?"
                                    text={selectedConcept.whatProblem.text}
                                    source={selectedConcept.whatProblem.source}
                                    reason={selectedConcept.whatProblem.reason}
                                />
                                <DetailCard
                                    icon={<Lightbulb className="h-4 w-4" />}
                                    title="What is the big idea?"
                                    text={selectedConcept.bigIdea.text}
                                    source={selectedConcept.bigIdea.source}
                                    reason={selectedConcept.bigIdea.reason}
                                />
                            </div>

                            {/* Row 3: How does it work? */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <Zap className="h-4 w-4" style={{ color: 'var(--color-interact)' }} />
                                    How does it work?
                                </h3>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="rounded-xl overflow-hidden bg-muted/50 border border-border aspect-square">
                                        {selectedConcept.howItWorks.imageBase64 ? (
                                            <img
                                                src={`data:image/png;base64,${selectedConcept.howItWorks.imageBase64}`}
                                                alt={selectedConcept.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageOff className="h-12 w-12 text-muted-foreground/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-sm text-foreground leading-relaxed">
                                            {selectedConcept.howItWorks.description}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Row 4: Fail / Prototype / Measure */}
                            <div className="grid grid-cols-3 gap-6">
                                <DetailCard
                                    icon={<AlertTriangle className="h-4 w-4" />}
                                    title="Why might it fail?"
                                    text={selectedConcept.whyMightItFail.text}
                                    source={selectedConcept.whyMightItFail.source}
                                    reason={selectedConcept.whyMightItFail.reason}
                                />
                                <DetailCard
                                    icon={<FlaskConical className="h-4 w-4" />}
                                    title="What should we prototype & test?"
                                    text={selectedConcept.whatToPrototype.text}
                                    source={selectedConcept.whatToPrototype.source}
                                    reason={selectedConcept.whatToPrototype.reason}
                                />
                                <DetailCard
                                    icon={<BarChart3 className="h-4 w-4" />}
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
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                {icon}
                {title}
            </h4>
            <p className="text-sm text-foreground leading-relaxed">{text}</p>
            <div className="pt-2 border-t border-border">
                <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-emerald-700">Source:</span> {source}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    <span className="font-semibold text-emerald-700">Why:</span> {reason}
                </p>
            </div>
        </div>
    );
}
