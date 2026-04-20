"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

    useEffect(() => {
        fetchSubProject();
    }, [subProjectId]);

    const fetchSubProject = async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch sub-project");
            }

            setSubProject(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load sub-project");
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
                alert("Failed to update workspace");
            }
        } catch (err) {
            alert("Failed to update workspace");
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
                alert(data.error || "Failed to create guide");
            }
        } catch (err) {
            alert("Failed to create guide");
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
                alert("Failed to rename guide");
            }
        } catch (err) {
            alert("Failed to rename guide");
        } finally {
            setIsSavingGuide(false);
        }
    };

    // Delete a guide
    const handleDeleteGuide = async (guideId: string) => {
        if (!confirm("Are you sure you want to delete this guide? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/guides/${guideId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchSubProject();
            } else {
                alert("Failed to delete guide");
            }
        } catch (err) {
            alert("Failed to delete guide");
        }
    };

    // Delete a simulation
    const handleDeleteSimulation = async (e: React.MouseEvent, simulationId: string) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this simulation? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/simulations/${simulationId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchSubProject();
            } else {
                alert("Failed to delete simulation");
            }
        } catch (err) {
            alert("Failed to delete simulation");
        }
    };

    // Delete a mapping session
    const handleDeleteMappingSession = async (e: React.MouseEvent, sessionId: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm("Are you sure you want to delete this mapping session? This action cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch(`/api/mapping/${sessionId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                await fetchSubProject();
            } else {
                alert("Failed to delete mapping session");
            }
        } catch (err) {
            alert("Failed to delete mapping session");
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
                        <CardTitle className="text-red-600">Error</CardTitle>
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

    return (
        <div className="relative overflow-hidden pb-20">
            {/* Ambient Background */}

            <div className="py-8 animate-in fade-in zoom-in-95 duration-500">

                {/* Breadcrumbs */}
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground mb-8">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">Projects</Link>
                    <span className="text-border">/</span>
                    <Link href={`/projects/${projectId}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                        {subProject.project.name}
                    </Link>
                    <span className="text-border">/</span>
                    <span className="text-foreground truncate max-w-[200px]">
                        {subProject.name}
                    </span>
                </div>

                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-4 mb-4 group">
                                <h1 className="text-4xl font-extrabold text-foreground tracking-tight leading-tight" aria-label={`Workspace: ${subProject.name}`}>
                                    {subProject.name}
                                </h1>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={openEditDialog}
                                    className="h-8 w-8 text-border hover:text-primary hover:bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Research Statement */}
                            {subProject.researchStatement && (
                                <div className="mb-6 relative">
                                    <div className="prose prose-sm max-w-none text-muted-foreground font-normal text-lg leading-relaxed">
                                        <p className="line-clamp-2">{subProject.researchStatement}</p>
                                    </div>
                                    {subProject.researchStatement.length > 150 && (
                                        <button
                                            className="text-primary hover:text-primary text-xs font-bold uppercase tracking-wide mt-2 flex items-center gap-1 transition-colors"
                                            onClick={() => setIsResearchDescriptionOpen(true)}
                                        >
                                            Read More <ChevronRight className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Badges - Hidden for now */}
                            {/* <div className="flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-border shadow-sm text-xs font-medium text-foreground">
                                    <Target className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-muted-foreground">Age:</span> {subProject.ageRange}
                                </div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/60 backdrop-blur-md rounded-full border border-border shadow-sm text-xs font-medium text-foreground">
                                    <Users className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-muted-foreground">Stage:</span> {subProject.lifeStage}
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center justify-between mb-4 overflow-x-auto">
                    <div className="inline-flex items-center p-1 bg-muted/50 backdrop-blur-sm rounded-full border border-border/60 shadow-inner whitespace-nowrap">
                        <button
                            onClick={() => switchTab("guides")}
                            className={`
                                relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-1.5
                                ${activeContentTab === "guides"
                                    ? "bg-white text-foreground shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                        >
                            <BookOpen className={`h-3.5 w-3.5 ${activeContentTab === "guides" ? "text-primary" : "text-muted-foreground"}`} />
                            Moderator Guides
                            {subProject.guideVersions.length > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "guides" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
                                    {subProject.guideVersions.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => switchTab("simulations")}
                            className={`
                                relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-1.5 ml-0.5
                                ${activeContentTab === "simulations"
                                    ? "bg-white shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            style={activeContentTab === "simulations" ? { color: 'var(--color-info)' } : undefined}
                        >
                            <PlayCircle className={`h-3.5 w-3.5 ${activeContentTab === "simulations" ? "" : "text-muted-foreground"}`} style={activeContentTab === "simulations" ? { color: 'var(--color-info)' } : undefined} />
                            Simulations
                            {subProject.simulations.length > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "simulations" ? "" : "bg-muted text-muted-foreground"}`} style={activeContentTab === "simulations" ? { backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' } : undefined}>
                                    {subProject.simulations.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => switchTab("mapping")}
                            className={`
                                relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-1.5 ml-0.5
                                ${activeContentTab === "mapping"
                                    ? "bg-white shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            style={activeContentTab === "mapping" ? { color: 'var(--color-knowledge)' } : undefined}
                        >
                            <Network className={`h-3.5 w-3.5 ${activeContentTab === "mapping" ? "" : "text-muted-foreground"}`} style={activeContentTab === "mapping" ? { color: 'var(--color-knowledge)' } : undefined} />
                            Mapping
                            {subProject.mappingSessions && subProject.mappingSessions.length > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "mapping" ? "" : "bg-muted text-muted-foreground"}`} style={activeContentTab === "mapping" ? { backgroundColor: 'var(--color-knowledge-subtle)', color: 'var(--color-knowledge)' } : undefined}>
                                    {subProject.mappingSessions.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => switchTab("archetypes")}
                            className={`
                                relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-1.5 ml-0.5
                                ${activeContentTab === "archetypes"
                                    ? "bg-white text-foreground shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                        >
                            <Users className={`h-3.5 w-3.5 ${activeContentTab === "archetypes" ? "text-primary" : "text-muted-foreground"}`} />
                            Profiles
                            {(() => {
                                const totalArchetypes = subProject.archetypeSessions?.reduce((sum, s) => sum + s.archetypes.length, 0) || 0;
                                return totalArchetypes > 0 ? (
                                    <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "archetypes" ? "bg-accent text-primary" : "bg-muted text-muted-foreground"}`}>
                                        {totalArchetypes}
                                    </span>
                                ) : null;
                            })()}
                        </button>

                        <button
                            onClick={() => switchTab("ideation")}
                            className={`
                                relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-1.5 ml-0.5
                                ${activeContentTab === "ideation"
                                    ? "bg-white shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            style={activeContentTab === "ideation" ? { color: 'var(--color-interact)' } : undefined}
                        >
                            <Zap className={`h-3.5 w-3.5 ${activeContentTab === "ideation" ? "" : "text-muted-foreground"}`} style={activeContentTab === "ideation" ? { color: 'var(--color-interact)' } : undefined} />
                            Ideation
                            {(subProject.ideationSessions?.length || 0) > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "ideation" ? "" : "bg-muted text-muted-foreground"}`} style={activeContentTab === "ideation" ? { backgroundColor: 'var(--color-interact-subtle)', color: 'var(--color-interact)' } : undefined}>
                                    {subProject.ideationSessions.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => switchTab("hmw")}
                            className={`
                                relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-1.5 ml-0.5
                                ${activeContentTab === "hmw"
                                    ? "bg-white shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            style={activeContentTab === "hmw" ? { color: 'var(--color-knowledge)' } : undefined}
                        >
                            <Lightbulb className={`h-3.5 w-3.5 ${activeContentTab === "hmw" ? "" : "text-muted-foreground"}`} style={activeContentTab === "hmw" ? { color: 'var(--color-knowledge)' } : undefined} />
                            How Might We
                            {(subProject.hmwCritiques?.length || 0) > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "hmw" ? "" : "bg-muted text-muted-foreground"}`} style={activeContentTab === "hmw" ? { backgroundColor: 'var(--color-knowledge-subtle)', color: 'var(--color-knowledge)' } : undefined}>
                                    {subProject.hmwCritiques.length}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => switchTab("insights")}
                            className={`
                                relative px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 flex items-center gap-1.5 ml-0.5
                                ${activeContentTab === "insights"
                                    ? "bg-white shadow-sm ring-1 ring-black/5"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }
                            `}
                            style={activeContentTab === "insights" ? { color: 'var(--color-info)' } : undefined}
                        >
                            <FileText className={`h-3.5 w-3.5 ${activeContentTab === "insights" ? "" : "text-muted-foreground"}`} style={activeContentTab === "insights" ? { color: 'var(--color-info)' } : undefined} />
                            Insights
                            {(subProject.insightCritiques?.length || 0) > 0 && (
                                <span className={`flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full text-[10px] ml-1.5 font-extrabold ${activeContentTab === "insights" ? "" : "bg-muted text-muted-foreground"}`} style={activeContentTab === "insights" ? { backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' } : undefined}>
                                    {subProject.insightCritiques.length}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {/* Moderator Guides */}
                    {activeContentTab === "guides" && (
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
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteGuide(guide.id); }}
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
                    )}

                    {/* Simulations */}
                    {activeContentTab === "simulations" && (
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Simulation Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/simulate`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <PlayCircle className="h-5 w-5" style={{ color: 'var(--color-info)' }} />
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
                                            onClick={(e) => { e.preventDefault(); handleDeleteSimulation(e, sim.id); }}
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
                    )}

                    {/* Mapping */}
                    {activeContentTab === "mapping" && (
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Mapping Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/map/new`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Network className="h-5 w-5" style={{ color: 'var(--color-knowledge)' }} />
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
                                            onClick={(e) => { e.preventDefault(); handleDeleteMappingSession(e, session.id); }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>

                                        {/* Icon */}
                                        <div
                                            className="h-9 w-9 rounded-lg flex items-center justify-center mb-auto"
                                            style={{ backgroundColor: 'var(--color-knowledge-subtle)', color: 'var(--color-knowledge)' }}
                                        >
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
                                                        &middot; <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> {session.status}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Archetypes */}
                    {activeContentTab === "archetypes" && (() => {
                        const CARD_ICON_BG = [
                            "bg-muted text-primary",
                            "bg-slate-50 text-slate-500",
                            "bg-cyan-50 text-cyan-500",
                            "bg-muted text-primary",
                            "bg-sky-50 text-sky-500",
                            "bg-violet-50 text-violet-400",
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
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!confirm("Delete this archetype?")) return;
                                                try {
                                                    const res = await fetch(`/api/archetypes/single/${archetype.id}`, { method: "DELETE" });
                                                    if (res.ok) await fetchSubProject();
                                                    else alert("Failed to delete");
                                                } catch { alert("Failed to delete"); }
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

                    {/* Ideation */}
                    {activeContentTab === "ideation" && (
                        <div className="animate-in slide-in-from-bottom-2 fade-in duration-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">

                            {/* Create New Ideation Card */}
                            <Link
                                href={`/projects/${projectId}/sub/${subProjectId}/ideation/new`}
                                className="group rounded-xl border-2 border-dashed border-border hover:border-primary/40 bg-card/50 hover:bg-[var(--color-interact-subtle)] transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[200px] cursor-pointer"
                            >
                                <div className="flex flex-col items-center gap-3 text-center">
                                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                        <Zap className="h-5 w-5" style={{ color: 'var(--color-interact)' }} />
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
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (!confirm("Delete this ideation session?")) return;
                                            try {
                                                const res = await fetch(`/api/sub-projects/${subProjectId}/ideations/${session.id}`, { method: "DELETE" });
                                                if (res.ok) {
                                                    await fetchSubProject();
                                                } else {
                                                    const data = await res.json().catch(() => ({}));
                                                    alert(data.error || "Failed to delete");
                                                }
                                            } catch (err) {
                                                console.error("Delete failed:", err);
                                                alert("Failed to delete");
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Icon */}
                                    <div
                                        className="h-9 w-9 rounded-lg flex items-center justify-center mb-auto"
                                        style={{ backgroundColor: 'var(--color-interact-subtle)', color: 'var(--color-interact)' }}
                                    >
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
                                                    &middot; <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> {session.status}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* How Might We */}
                    {activeContentTab === "hmw" && (
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
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!confirm("Delete this HMW critique?")) return;
                                                try {
                                                    const res = await fetch(`/api/sub-projects/${subProjectId}/hmw-critiques/${critique.id}`, { method: "DELETE" });
                                                    if (res.ok) await fetchSubProject();
                                                    else alert("Failed to delete");
                                                } catch { alert("Failed to delete"); }
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
                    )}

                    {/* Insight Statements */}
                    {activeContentTab === "insights" && (
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
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (!confirm("Delete this insight critique?")) return;
                                                try {
                                                    const res = await fetch(`/api/sub-projects/${subProjectId}/insight-critiques/${critique.id}`, { method: "DELETE" });
                                                    if (res.ok) await fetchSubProject();
                                                    else alert("Failed to delete");
                                                } catch { alert("Failed to delete"); }
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
                    )}
                </div>
            </div>
            {/* Edit Workspace Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-sm border-border shadow-lg rounded-md p-8 ring-1 ring-black/5 overflow-y-auto max-h-[90vh]">
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
                                className="bg-white border-border focus:border-input rounded-xl h-11 transition-all"
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
                                className="bg-white border-border focus:border-input rounded-xl resize-none transition-all"
                            />
                        </div>

                        {/* Age & Life Stage */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-foreground uppercase tracking-wider">Age Range</Label>
                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-border">
                                    <Input
                                        value={editAgeMin}
                                        onChange={(e) => setEditAgeMin(e.target.value)}
                                        className="h-9 bg-white border-border focus:border-input text-center"
                                        placeholder="Min"
                                    />
                                    <span className="text-muted-foreground">-</span>
                                    <Input
                                        value={editAgeMax}
                                        onChange={(e) => setEditAgeMax(e.target.value)}
                                        className="h-9 bg-white border-border focus:border-input text-center"
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
                                                    : 'bg-white text-muted-foreground border-border hover:border-input hover:text-primary'
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
                <DialogContent className="sm:max-w-2xl bg-white/95 backdrop-blur-sm border-border shadow-lg rounded-md p-8 ring-1 ring-black/5">
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
        </div>
    );
}
// Created by Swapnil Bapat © 2026
