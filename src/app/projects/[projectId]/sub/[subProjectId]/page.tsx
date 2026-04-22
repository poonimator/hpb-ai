"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Plus,
    PlayCircle,
    BookOpen,
    Target,
    Users,
    Clock,
    MessageSquare,
    Award,
    Loader2,
    Edit,
    FileText,
    ChevronRight,
    Pencil,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Trash2,
    Network,
    Sparkles,
    Lightbulb,
    Zap
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { Mono } from "@/components/ui/mono";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const LIFE_STAGE_OPTIONS = [
    { value: "Primary", label: "Primary School" },
    { value: "Secondary", label: "Secondary School" },
    { value: "JC", label: "Junior College" },
    { value: "Poly", label: "Polytechnic" },
    { value: "ITE", label: "ITE" },
    { value: "NS", label: "National Service" },
    { value: "University", label: "University" },
    { value: "Working", label: "Working Adult" },
];

interface GuideVersion {
    id: string;
    name: string;
    versionNumber: number;
    createdAt: string;
    guideSets?: Array<{
        id: string;
        title: string;
        questions: Array<{ id: string }>;
    }>;
}

interface Simulation {
    id: string;
    mode: string;
    startedAt: string;
    endedAt: string | null;
    isFocusGroup?: boolean;
    personaDoc?: { id: string; title: string } | null;
    projectPersonaDoc?: { id: string; title: string } | null;
    archetype?: { id: string; name: string } | null;
    simulationArchetypes?: { archetype: { id: string; name: string } }[];
    _count: { messages: number };
    coachReview?: { id: string } | null;
}

interface MappingSession {
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
    description: string;
    demographicJson: string | null;
    createdAt: string;
    archetypeSessionId: string;
}

interface ArchetypeSessionData {
    id: string;
    status: string;
    archetypes: ArchetypeInfo[];
}

interface HmwCritiqueInfo {
    id: string;
    hmwStatement: string;
    overallVerdict: string;
    createdAt: string;
}

interface InsightCritiqueInfo {
    id: string;
    insightStatement: string;
    overallVerdict: string;
    createdAt: string;
}

interface IdeationSessionInfo {
    id: string;
    name: string;
    status: string;
    sourceMappingId: string;
    createdAt: string;
}

interface SubProject {
    id: string;
    name: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;
    createdAt: string;
    project: {
        id: string;
        name: string;
    };
    guideVersions: GuideVersion[];
    simulations: Simulation[];
    mappingSessions: MappingSession[];
    archetypeSessions: ArchetypeSessionData[];
    hmwCritiques: HmwCritiqueInfo[];
    insightCritiques: InsightCritiqueInfo[];
    ideationSessions: IdeationSessionInfo[];
    _count: {
        guideVersions: number;
        simulations: number;
        mappingSessions: number;
        archetypeSessions: number;
        hmwCritiques: number;
        insightCritiques: number;
        ideationSessions: number;
    };
}

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

export default function SubProjectHomePage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const [subProject, setSubProject] = useState<SubProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Dialog States
    const [isResearchDescriptionOpen, setIsResearchDescriptionOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Edit Form State
    const [editName, setEditName] = useState("");
    const [editStatement, setEditStatement] = useState("");
    const [editAgeMin, setEditAgeMin] = useState("");
    const [editAgeMax, setEditAgeMax] = useState("");
    const [editLifeStages, setEditLifeStages] = useState<string[]>([]);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Mapping state
    const [isCreatingMapping, setIsCreatingMapping] = useState(false);

    // Guide management state
    const [isCreatingGuide, setIsCreatingGuide] = useState(false);
    const [editingGuideId, setEditingGuideId] = useState<string | null>(null);
    const [editingGuideName, setEditingGuideName] = useState("");
    const [isSavingGuide, setIsSavingGuide] = useState(false);

    // Tab state for content section — initialise from URL search param
    const searchParams = useSearchParams();
    const initialTab = (searchParams.get("tab") as "guides" | "simulations" | "mapping" | "archetypes" | "ideation" | "hmw" | "insights") || "guides";
    const [activeContentTab, setActiveContentTab] = useState<"guides" | "simulations" | "mapping" | "archetypes" | "ideation" | "hmw" | "insights">(initialTab);

    const switchTab = useCallback((tab: "guides" | "simulations" | "mapping" | "archetypes" | "ideation" | "hmw" | "insights") => {
        setActiveContentTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tab);
        window.history.replaceState({}, "", url.toString());
    }, []);

    // Delete dialog state — one per destructive flow
    const [deleteGuideId, setDeleteGuideId] = useState<string | null>(null);
    const [deleteSimId, setDeleteSimId] = useState<string | null>(null);
    const [deleteMappingId, setDeleteMappingId] = useState<string | null>(null);
    const [deleteArchetypeId, setDeleteArchetypeId] = useState<string | null>(null);
    const [deleteIdeationId, setDeleteIdeationId] = useState<string | null>(null);
    const [deleteHmwId, setDeleteHmwId] = useState<string | null>(null);
    const [deleteInsightId, setDeleteInsightId] = useState<string | null>(null);

    useEffect(() => {
        fetchSubProject();
    }, [subProjectId]);

    const fetchSubProject = async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch workspace");
            }

            setSubProject(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load workspace");
        } finally {
            setLoading(false);
        }
    };

    const openEditDialog = () => {
        if (!subProject) return;
        setEditName(subProject.name);
        setEditStatement(subProject.researchStatement || "");

        // Parse Age
        if (subProject.ageRange) {
            const parts = subProject.ageRange.split("-");
            if (parts.length === 2) {
                setEditAgeMin(parts[0].trim());
                setEditAgeMax(parts[1].trim());
            } else {
                setEditAgeMin(subProject.ageRange);
                setEditAgeMax("");
            }
        }

        // Parse Life Stages
        if (subProject.lifeStage) {
            const stages = subProject.lifeStage.split(",").map(s => s.trim());
            const mapped = LIFE_STAGE_OPTIONS.filter(opt =>
                stages.some(s => s.toLowerCase().includes(opt.value.toLowerCase()) || s.toLowerCase().includes(opt.label.toLowerCase()))
            ).map(opt => opt.value);
            setEditLifeStages(mapped);
        } else {
            setEditLifeStages([]);
        }

        setIsEditOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editName.trim() || !editStatement.trim() || editLifeStages.length === 0) return;

        setIsSavingEdit(true);
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    researchStatement: editStatement.trim(),
                    ageRange: `${editAgeMin}-${editAgeMax}`,
                    lifeStage: editLifeStages.join(", "),
                }),
            });

            if (res.ok) {
                await fetchSubProject();
                setIsEditOpen(false);
            } else {
                toast.error("Failed to update workspace");
            }
        } catch (err) {
            toast.error("Failed to update workspace");
        } finally {
            setIsSavingEdit(false);
        }
    };

    const toggleEditLifeStage = (stage: string) => {
        setEditLifeStages(prev =>
            prev.includes(stage)
                ? prev.filter(s => s !== stage)
                : [...prev, stage]
        );
    };



    // Create a new guide
    const handleCreateGuide = async () => {
        setIsCreatingGuide(true);
        try {
            const res = await fetch("/api/guides/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subProjectId })
            });

            const data = await res.json();
            if (data.success && data.data.guide) {
                // Navigate to edit the new guide
                window.location.href = `/projects/new/guide?projectId=${projectId}&subProjectId=${subProjectId}&guideId=${data.data.guide.id}`;
            } else {
                toast.error(data.error || "Failed to create guide");
            }
        } catch (err) {
            toast.error("Failed to create guide");
        } finally {
            setIsCreatingGuide(false);
        }
    };

    // Start editing guide name
    const startEditingGuide = (guide: GuideVersion) => {
        setEditingGuideId(guide.id);
        setEditingGuideName(guide.name);
    };

    // Save guide name
    const saveGuideName = async () => {
        if (!editingGuideId || !editingGuideName.trim()) return;

        setIsSavingGuide(true);
        try {
            const res = await fetch(`/api/guides/${editingGuideId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editingGuideName.trim() })
            });

            if (res.ok) {
                await fetchSubProject();
                setEditingGuideId(null);
            } else {
                toast.error("Failed to rename guide");
            }
        } catch (err) {
            toast.error("Failed to rename guide");
        } finally {
            setIsSavingGuide(false);
        }
    };

    // Delete a guide
    const handleDeleteGuide = async (guideId: string) => {
        try {
            const res = await fetch(`/api/guides/${guideId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchSubProject();
            } else {
                toast.error("Failed to delete guide");
            }
        } catch (err) {
            toast.error("Failed to delete guide");
        }
    };

    // Delete a simulation
    const handleDeleteSimulation = async (simulationId: string) => {
        try {
            const res = await fetch(`/api/simulations/${simulationId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchSubProject();
            } else {
                toast.error("Failed to delete simulation");
            }
        } catch (err) {
            toast.error("Failed to delete simulation");
        }
    };

    // Delete a mapping session
    const handleDeleteMappingSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/mapping/${sessionId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchSubProject();
            } else {
                toast.error("Failed to delete mapping session");
            }
        } catch (err) {
            toast.error("Failed to delete mapping session");
        }
    };

    // Delete an archetype
    const handleDeleteArchetype = async (archetypeId: string) => {
        try {
            const res = await fetch(`/api/archetypes/single/${archetypeId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchSubProject();
            } else {
                toast.error("Failed to delete archetype");
            }
        } catch {
            toast.error("Failed to delete archetype");
        }
    };

    // Delete an ideation session
    const handleDeleteIdeation = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/ideations/${sessionId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchSubProject();
            } else {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Failed to delete ideation session");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete ideation session");
        }
    };

    // Delete a HMW critique
    const handleDeleteHmw = async (critiqueId: string) => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/hmw-critiques/${critiqueId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchSubProject();
            } else {
                toast.error("Failed to delete HMW critique");
            }
        } catch {
            toast.error("Failed to delete HMW critique");
        }
    };

    // Delete an insight critique
    const handleDeleteInsight = async (critiqueId: string) => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}/insight-critiques/${critiqueId}`, { method: "DELETE" });
            if (res.ok) {
                await fetchSubProject();
            } else {
                toast.error("Failed to delete insight critique");
            }
        } catch {
            toast.error("Failed to delete insight critique");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading workspace...</p>
                </div>
            </div>
        );
    }

    if (error || !subProject) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-[color:var(--danger)]">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{error || "Workspace not found"}</p>
                        <Link href={`/projects/${projectId}`} className="mt-4 inline-block">
                            <Button variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Project
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const hasGuide = subProject.guideVersions.length > 0;

    // Tab count derivations (consumed by the <TabsTrigger> labels below)
    const guideCount = subProject.guideVersions?.length ?? 0;
    const simulationCount = subProject.simulations?.length ?? 0;
    const mappingCount = subProject.mappingSessions?.length ?? 0;
    const archetypeCount = subProject.archetypeSessions?.reduce((sum, s) => sum + s.archetypes.length, 0) ?? 0;
    const ideationCount = subProject.ideationSessions?.length ?? 0;
    const hmwCount = subProject.hmwCritiques?.length ?? 0;
    const insightCount = subProject.insightCritiques?.length ?? 0;

    // Format created date if available on the subProject payload
    const createdLabel = subProject.createdAt
        ? new Date(subProject.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : null;

    const leftRail = (
        <>
            <RailHeader>
                {/* Parent project as a subtle eyebrow link — replaces the awkward 'In Project Name' prose */}
                {subProject.project?.name && (
                    <Link
                        href={`/projects/${projectId}`}
                        className="group inline-flex items-center gap-1.5 text-eyebrow text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-2.5 w-2.5" strokeWidth={2.5} />
                        <span className="truncate">{subProject.project.name}</span>
                    </Link>
                )}
                <h2 className="text-display-4 text-foreground leading-tight">
                    {subProject.name}
                </h2>
                {subProject.researchStatement && (
                    <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-4">
                        {subProject.researchStatement}
                    </p>
                )}
            </RailHeader>

            <RailSection title="Research" last>
                <MetaRow k="Age range" v={subProject.ageRange || "—"} />
                <MetaRow k="Life stage" v={subProject.lifeStage || "—"} />
                {createdLabel && <MetaRow k="Created" v={createdLabel} />}
            </RailSection>

            <div className="flex-1" />
        </>
    );

    return (
        <div className="flex flex-col">
            <PageBar
                back={{ href: `/projects/${projectId}`, label: "Back" }}
                crumbs={
                    subProject.project?.name && subProject.name
                        ? [
                            { label: subProject.project.name, href: `/projects/${projectId}` },
                            { label: subProject.name },
                        ]
                        : undefined
                }
                action={
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/projects/${projectId}/sub/${subProjectId}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                        </Link>
                    </Button>
                }
            />

            <WorkspaceFrame variant="platform" leftRail={leftRail}>
                {/* Main column hero */}
                <div className="flex flex-col gap-1 mb-8 max-w-[820px]">
                    <h1 className="text-display-1 text-foreground">
                        {subProject.name}
                    </h1>
                    {subProject.researchStatement && (
                        <p className="text-body text-muted-foreground">
                            {subProject.researchStatement}
                        </p>
                    )}
                </div>

                {/* Tab Navigation + Content */}
                <Tabs value={activeContentTab} onValueChange={(v) => switchTab(v as "guides" | "simulations" | "mapping" | "archetypes" | "ideation" | "hmw" | "insights")}>
                    <TabsList>
                        <TabsTrigger value="guides">
                            Moderator guides
                            {guideCount > 0 && <Mono className="ml-1.5">{guideCount}</Mono>}
                        </TabsTrigger>
                        <TabsTrigger value="simulations">
                            Simulations
                            {simulationCount > 0 && <Mono className="ml-1.5">{simulationCount}</Mono>}
                        </TabsTrigger>
                        <TabsTrigger value="mapping">
                            Mapping
                            {mappingCount > 0 && <Mono className="ml-1.5">{mappingCount}</Mono>}
                        </TabsTrigger>
                        <TabsTrigger value="archetypes">
                            Archetypes
                            {archetypeCount > 0 && <Mono className="ml-1.5">{archetypeCount}</Mono>}
                        </TabsTrigger>
                        <TabsTrigger value="ideation">
                            Ideation
                            {ideationCount > 0 && <Mono className="ml-1.5">{ideationCount}</Mono>}
                        </TabsTrigger>
                        <TabsTrigger value="hmw">
                            HMW
                            {hmwCount > 0 && <Mono className="ml-1.5">{hmwCount}</Mono>}
                        </TabsTrigger>
                        <TabsTrigger value="insights">
                            Insights
                            {insightCount > 0 && <Mono className="ml-1.5">{insightCount}</Mono>}
                        </TabsTrigger>
                    </TabsList>

                    {/* Moderator Guides */}
                    <TabsContent value="guides">
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Guide Card */}
                            <button
                                onClick={handleCreateGuide}
                                disabled={isCreatingGuide}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        {isCreatingGuide ? (
                                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                        ) : (
                                            <Plus className="h-5 w-5 text-primary" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">Create New Guide</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Start a new set of questions and persona configurations
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Guide Cards */}
                            {subProject.guideVersions.map((guide) => {
                                return (
                                    <div
                                        key={guide.id}
                                        className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                    >
                                        {/* Hover actions */}
                                        {editingGuideId !== guide.id && (
                                            <div className="absolute top-2.5 right-2.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditingGuide(guide); }}
                                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-primary transition-all"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteGuideId(guide.id); }}
                                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        {editingGuideId === guide.id ? (
                                            <div className="flex flex-col gap-2 flex-1">
                                                <Input
                                                    value={editingGuideName}
                                                    onChange={(e) => setEditingGuideName(e.target.value)}
                                                    className="h-8 text-sm font-semibold"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') saveGuideName();
                                                        if (e.key === 'Escape') setEditingGuideId(null);
                                                    }}
                                                />
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" onClick={saveGuideName} className="h-7 w-7 text-primary hover:bg-accent">
                                                        <Check className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingGuideId(null)} className="h-7 w-7 text-muted-foreground hover:bg-muted">
                                                        <X className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Link
                                                href={`/projects/new/guide?projectId=${projectId}&subProjectId=${subProjectId}&guideId=${guide.id}`}
                                                className="flex flex-col flex-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Icon */}
                                                <div className="h-9 w-9 rounded-lg bg-accent border border-border flex items-center justify-center mb-auto">
                                                    <FileText className="h-4.5 w-4.5 text-primary/80" />
                                                </div>

                                                {/* Content at bottom */}
                                                <div className="mt-3">
                                                    <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                                                        {guide.name}
                                                    </h4>
                                                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                                        Created {new Date(guide.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Simulations */}
                    <TabsContent value="simulations">
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Simulation Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/simulate`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <PlayCircle className="h-5 w-5 text-[color:var(--info)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">New Simulation</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Start a new practice session with an AI persona
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Simulation Cards */}
                            {subProject.simulations.map((sim) => {
                                const isFocusGroup = sim.isFocusGroup && (sim.simulationArchetypes?.length ?? 0) > 0;
                                const personaName = isFocusGroup
                                    ? "Focus Group"
                                    : sim.projectPersonaDoc?.title || sim.personaDoc?.title || sim.archetype?.name || "Unknown Persona";
                                const isCompleted = sim.endedAt !== null;
                                const hasReview = sim.coachReview !== null;

                                return (
                                    <Link
                                        key={sim.id}
                                        href={isCompleted ? `/simulations/${sim.id}` : `/projects/${projectId}/sub/${subProjectId}/simulate?resume=${sim.id}`}
                                        className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                    >
                                        {/* Delete on hover */}
                                        <button
                                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteSimId(sim.id); }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Icon */}
                                        <div
                                            className={`h-9 w-9 rounded-lg flex items-center justify-center mb-auto ${isCompleted ? 'bg-accent text-muted-foreground' : ''}`}
                                            style={!isCompleted ? { backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' } : undefined}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-4.5 w-4.5" />
                                            ) : isFocusGroup ? (
                                                <Users className="h-4.5 w-4.5" />
                                            ) : (
                                                <MessageSquare className="h-4.5 w-4.5" />
                                            )}
                                        </div>

                                        {/* Content at bottom */}
                                        <div className="mt-3">
                                            <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                                                {personaName}
                                            </h4>
                                            {isFocusGroup && (
                                                <div className="flex flex-wrap gap-1 mb-1">
                                                    {(sim.simulationArchetypes ?? []).map((sa) => (
                                                        <span key={sa.archetype.id} className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                                                            {sa.archetype.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                                {new Date(sim.startedAt).toLocaleDateString()} &middot;{' '}
                                                <span className="inline-flex items-center gap-1">
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-muted-foreground' : 'animate-pulse'}`} style={!isCompleted ? { backgroundColor: 'var(--color-info)' } : undefined} />
                                                    {isCompleted ? 'Completed' : 'Active'}
                                                </span>
                                                {hasReview && ' · Reviewed'}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Mapping */}
                    <TabsContent value="mapping">
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Mapping Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/map/new`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Network className="h-5 w-5 text-[color:var(--knowledge)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">New Mapping</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Cluster insights from interview transcripts
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Mapping Session Cards */}
                            {subProject.mappingSessions?.map((session) => {
                                const isComplete = session.status === "COMPLETE";

                                return (
                                    <Link
                                        key={session.id}
                                        href={`/projects/${projectId}/sub/${subProjectId}/map/${session.id}`}
                                        className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                    >
                                        {/* Delete on hover */}
                                        <button
                                            className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteMappingId(session.id); }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Icon */}
                                        <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-auto bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)]">
                                            <Network className="h-4.5 w-4.5" />
                                        </div>

                                        {/* Content at bottom */}
                                        <div className="mt-3">
                                            <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                                                {session.name}
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                                {new Date(session.createdAt).toLocaleDateString()} &middot; {session._count?.transcripts || 0} files
                                                {!isComplete && (
                                                    <span className="inline-flex items-center gap-1 ml-1">
                                                        &middot; <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--warning)] animate-pulse" /> {session.status}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </TabsContent>

                    {/* Archetypes */}
                    <TabsContent value="archetypes">
                        {(() => {
                            const CARD_ICON_BG = [
                                "bg-muted text-primary",
                                "bg-slate-50 text-slate-500",
                                "bg-cyan-50 text-cyan-500",
                                "bg-muted text-primary",
                                "bg-sky-50 text-sky-500",
                                "bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)]",
                                "bg-stone-50 text-stone-500",
                                "bg-muted text-primary",
                            ];

                            const allArchetypes = subProject.archetypeSessions?.flatMap(s => s.archetypes) || [];

                            return (
                                <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                                    {/* Generate Card */}
                                    <Link
                                        href={`/projects/${projectId}/sub/${subProjectId}/archetypes/new`}
                                        className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                                    >
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                                <Sparkles className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-semibold text-foreground mb-0.5">Generate Profiles</h3>
                                                <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                                    Create new persona profiles with AI
                                                </p>
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Archetype Cards */}
                                    {allArchetypes.map((archetype, index) => (
                                        <div
                                            key={archetype.id}
                                            onClick={() => window.location.href = `/projects/${projectId}/sub/${subProjectId}/archetypes/${archetype.id}`}
                                            className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                        >
                                            {/* Delete button on hover */}
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setDeleteArchetypeId(archetype.id);
                                                }}
                                                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>

                                            {/* Icon */}
                                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-auto ${CARD_ICON_BG[index % CARD_ICON_BG.length]}`}>
                                                <Users className="h-4.5 w-4.5" />
                                            </div>

                                            {/* Content at bottom */}
                                            <div className="mt-3">
                                                <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                                                    {archetype.name}
                                                </h4>
                                                {archetype.kicker && (
                                                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                                        {archetype.kicker}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </TabsContent>

                    {/* Ideation */}
                    <TabsContent value="ideation">
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Ideation Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/ideation/new`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-[color:var(--primary)]" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">New Ideation</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Generate concepts using the Crazy 8s framework
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Ideation Session Cards */}
                            {subProject.ideationSessions?.map((session) => (
                                <div
                                    key={session.id}
                                    onClick={() => window.location.href = `/projects/${projectId}/sub/${subProjectId}/ideation/${session.id}`}
                                    className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                >
                                    {/* Delete on hover */}
                                    <button
                                        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteIdeationId(session.id);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Icon */}
                                    <div className="h-9 w-9 rounded-lg flex items-center justify-center mb-auto bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
                                        <Zap className="h-4.5 w-4.5" />
                                    </div>

                                    {/* Content at bottom */}
                                    <div className="mt-3">
                                        <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-2 mb-1">
                                            {session.name}
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                                            {new Date(session.createdAt).toLocaleDateString()}{session.status === "COMPLETE" ? " · 8 concepts" : ""}
                                            {session.status !== "COMPLETE" && (
                                                <span className="inline-flex items-center gap-1 ml-1">
                                                    &middot; <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--warning)] animate-pulse" /> {session.status}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* How Might We */}
                    <TabsContent value="hmw">
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New HMW Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/hmw`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Lightbulb className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">Analyse HMW</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Critique statements with the 5-lens framework
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* HMW Critique Cards */}
                            {subProject.hmwCritiques?.map((critique) => (
                                <div
                                    key={critique.id}
                                    onClick={() => window.location.href = `/projects/${projectId}/sub/${subProjectId}/hmw?scrollTo=${critique.id}`}
                                    className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                >
                                    {/* Delete button on hover */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteHmwId(critique.id);
                                        }}
                                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Content */}
                                    <div className="mt-auto">
                                        <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-3 mb-1">
                                            <span className="text-primary">HMW </span>
                                            {critique.hmwStatement}
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            {new Date(critique.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    {/* Insight Statements */}
                    <TabsContent value="insights">
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Insight Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/insights`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-0.5">Analyse Insight</h3>
                                        <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">
                                            Critique statements against 5 insight criteria
                                        </p>
                                    </div>
                                </div>
                            </Link>

                            {/* Insight Critique Cards */}
                            {subProject.insightCritiques?.map((critique) => (
                                <div
                                    key={critique.id}
                                    onClick={() => window.location.href = `/projects/${projectId}/sub/${subProjectId}/insights?scrollTo=${critique.id}`}
                                    className="group rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-200 p-4 min-h-[200px] flex flex-col cursor-pointer relative"
                                >
                                    {/* Delete button on hover */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setDeleteInsightId(critique.id);
                                        }}
                                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg hover:bg-muted text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Content */}
                                    <div className="mt-auto">
                                        <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-3 mb-1">
                                            {critique.insightStatement}
                                        </h4>
                                        <p className="text-[11px] text-muted-foreground leading-snug">
                                            {new Date(critique.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

            </WorkspaceFrame>

            {/* Edit Workspace Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-2xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold text-foreground">Edit Workspace</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Update the details regarding the research focus and target demographics.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name" className="text-xs font-bold text-foreground uppercase tracking-wider">Workspace Name</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-[color:var(--surface)] border-border focus:border-input rounded-xl h-11 transition-all"
                            />
                        </div>

                        {/* Statement */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-statement" className="text-xs font-bold text-foreground uppercase tracking-wider">Research Statement</Label>
                            <Textarea
                                id="edit-statement"
                                value={editStatement}
                                onChange={(e) => setEditStatement(e.target.value)}
                                rows={4}
                                className="bg-[color:var(--surface)] border-border focus:border-input rounded-xl resize-none transition-all"
                            />
                        </div>

                        {/* Age & Life Stage */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Age Range</Label>
                                <div className="flex items-center gap-3 bg-[color:var(--surface)] p-3 rounded-xl border border-border">
                                    <Input
                                        value={editAgeMin}
                                        onChange={(e) => setEditAgeMin(e.target.value)}
                                        className="h-9 bg-[color:var(--surface)] border-border focus:border-input text-center"
                                        placeholder="Min"
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input
                                        value={editAgeMax}
                                        onChange={(e) => setEditAgeMax(e.target.value)}
                                        className="h-9 bg-[color:var(--surface)] border-border focus:border-input text-center"
                                        placeholder="Max"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Life Stages</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {LIFE_STAGE_OPTIONS.map((option) => (
                                        <div
                                            key={option.value}
                                            onClick={() => toggleEditLifeStage(option.value)}
                                            className={`
                                                cursor-pointer flex items-center justify-center p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider text-center transition-all border
                                                ${editLifeStages.includes(option.value)
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-[color:var(--surface)] text-muted-foreground border-border hover:border-input hover:text-primary'
                                                }
                                            `}
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="mt-8 gap-3">
                            <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={isSavingEdit} className="rounded-full hover:bg-muted text-muted-foreground">
                                Cancel
                            </Button>
                            <Button onClick={handleSaveEdit} disabled={isSavingEdit} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6">
                                {isSavingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Read More Dialog */}
            <Dialog open={isResearchDescriptionOpen} onOpenChange={setIsResearchDescriptionOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold text-foreground">{subProject.name}</DialogTitle>
                    </DialogHeader>
                    <div className="prose prose-neutral prose-sm max-w-none">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Research Statement</h3>
                        <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                            {subProject.researchStatement}
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-border">
                            <div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Age Range</span>
                                <span className="text-foreground font-medium">{subProject.ageRange}</span>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Target Life Stage</span>
                                <span className="text-foreground font-medium">{subProject.lifeStage}</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button onClick={() => setIsResearchDescriptionOpen(false)} className="rounded-full bg-muted hover:bg-muted/80 text-foreground font-medium">
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete AlertDialogs ── */}

            <AlertDialog open={!!deleteGuideId} onOpenChange={(open) => !open && setDeleteGuideId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this moderator guide?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The guide and all question sets inside it will be permanently removed. Simulations previously run against this guide are unaffected but will no longer be linked to it.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteGuideId) await handleDeleteGuide(deleteGuideId);
                                setDeleteGuideId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteSimId} onOpenChange={(open) => !open && setDeleteSimId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this simulation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The transcript, opportunities, and analysis for this simulation will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteSimId) await handleDeleteSimulation(deleteSimId);
                                setDeleteSimId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteMappingId} onOpenChange={(open) => !open && setDeleteMappingId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this mapping session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All tagged quotes, themes, and cluster layouts in this mapping session will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteMappingId) await handleDeleteMappingSession(deleteMappingId);
                                setDeleteMappingId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteArchetypeId} onOpenChange={(open) => !open && setDeleteArchetypeId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this archetype session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The generated personas and supporting evidence for this session will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteArchetypeId) await handleDeleteArchetype(deleteArchetypeId);
                                setDeleteArchetypeId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteIdeationId} onOpenChange={(open) => !open && setDeleteIdeationId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this ideation session?</AlertDialogTitle>
                        <AlertDialogDescription>
                            All concepts and their supporting quotes will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteIdeationId) await handleDeleteIdeation(deleteIdeationId);
                                setDeleteIdeationId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteHmwId} onOpenChange={(open) => !open && setDeleteHmwId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this HMW critique?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The framing, lenses, and rewrite suggestions for this critique will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteHmwId) await handleDeleteHmw(deleteHmwId);
                                setDeleteHmwId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!deleteInsightId} onOpenChange={(open) => !open && setDeleteInsightId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this insight critique?</AlertDialogTitle>
                        <AlertDialogDescription>
                            The insight statement, supporting evidence, and critique will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteInsightId) await handleDeleteInsight(deleteInsightId);
                                setDeleteInsightId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
