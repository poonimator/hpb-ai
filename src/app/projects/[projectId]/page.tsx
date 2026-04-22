"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    ArrowLeft,
    Plus,
    FolderOpen,
    BookOpenText,
    FileText,
    PlayCircle,
    BookOpen,
    Users,
    Loader2,
    MoreVertical,
    Trash2,
    Edit,
    Clock,
    Target,
    Pencil,
    Check,
    ChevronRight
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SubProject {
    id: string;
    name: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;
    createdAt: string;
    _count: {
        guideVersions: number;
        simulations: number;
    };
    guideVersions?: Array<{
        id: string;
        name: string;
        versionNumber: number;
    }>;
}

interface KbDocument {
    id: string;
    title: string;
    docType: string;
    status: string;
    createdAt: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    subProjects: SubProject[];
    kbDocuments: KbDocument[];
    _count: {
        subProjects: number;
        kbDocuments: number;
    };
}

interface PageProps {
    params: Promise<{ projectId: string }>;
}

export default function ProjectHomePage({ params }: PageProps) {
    const { projectId } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Edit dialog state
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false); // New Dialog State

    // Delete workspace state
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProject();
    }, [projectId]);

    const fetchProject = async () => {
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to fetch project");
            }

            setProject(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load project");
        } finally {
            setLoading(false);
        }
    };

    const confirmDelete = async (subProjectId: string) => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                throw new Error("Failed to delete workspace");
            }

            fetchProject(); // Refresh
        } catch (err) {
            toast.error("Failed to delete workspace");
        }
    };

    const openEditDialog = () => {
        if (project) {
            setEditName(project.name);
            setEditDescription(project.description || "");
            setIsEditOpen(true);
        }
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: editName.trim(),
                    description: editDescription.trim(),
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update project");
            }

            await fetchProject();
            setIsEditOpen(false);
        } catch (err) {
            toast.error("Failed to save changes");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="flex items-center justify-center py-20">
                <Card className="max-w-md">
                    <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{error || "Project not found"}</p>
                        <Button variant="outline" className="mt-4" asChild>
                            <Link href="/dashboard">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const approvedKbDocs = project.kbDocuments?.filter(d => d.status === "APPROVED") || [];
    const personaCount = approvedKbDocs.filter(d => d.docType === "PERSONA").length;

    return (
        <div className="relative">
            <div className="pt-6 pb-20">
                {/* Header Section */}
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Projects
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 max-w-3xl">
                            <div className="flex items-center gap-3 group">
                                <h1 className="text-display-2">
                                    {project.name}
                                </h1>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={openEditDialog}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-muted-foreground"
                                    aria-label="Edit project"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {project.description && (
                                <div className="mt-1">
                                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                        {project.description}
                                    </p>
                                    {project.description.length > 150 && (
                                        <button
                                            onClick={() => setIsDescriptionOpen(true)}
                                            className="text-foreground hover:underline text-xs font-medium mt-1 flex items-center gap-0.5 transition-colors"
                                        >
                                            Read more <ChevronRight className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <Button asChild variant="knowledge">
                                <Link href={`/projects/${projectId}/kb`}>
                                    <BookOpenText className="h-4 w-4 mr-1.5" />
                                    Knowledge Base
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href={`/projects/${projectId}/sub/new`}>
                                    <Plus className="h-4 w-4 mr-1.5" />
                                    New Workspace
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Workspaces Grid */}
                <div>
                    {project.subProjects.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-10">
                                <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-4" />
                                <h3 className="text-base font-medium mb-1">No workspaces yet</h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
                                    Create a workspace to start managing your moderator guides and simulations.
                                </p>
                                <Button variant="outline" asChild>
                                    <Link href={`/projects/${projectId}/sub/new`}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        New Workspace
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {project.subProjects.map((subProject) => (
                                <div key={subProject.id} className="group relative">
                                    <Link href={`/projects/${projectId}/sub/${subProject.id}`} className="block h-full">
                                        <Card className="h-full transition-colors hover:bg-[var(--color-interact-subtle)]">
                                            <CardContent className="p-4 flex flex-col h-full justify-between">
                                                <div>
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="h-9 w-9 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--color-interact-muted)', color: 'var(--color-interact)' }}>
                                                            <FolderOpen className="h-4 w-4" />
                                                        </div>

                                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setDeleteTarget({ id: subProject.id, name: subProject.name });
                                                                }}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <h3 className="font-medium text-base mb-1.5 line-clamp-1">
                                                        {subProject.name}
                                                    </h3>

                                                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                                                        {subProject.researchStatement || "No research statement defined."}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border">
                                                    <div className="flex items-center gap-1.5">
                                                        <BookOpen className="h-3.5 w-3.5" />
                                                        {subProject._count.guideVersions} Guides
                                                    </div>
                                                    <span className="text-border">•</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="h-3.5 w-3.5" />
                                                        {subProject._count.simulations} Simulations
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Project Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[460px]">
                    <DialogHeader>
                        <DialogTitle>Edit Project</DialogTitle>
                        <DialogDescription>
                            Refine your project details to keep things organized.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Project Name</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="e.g. Mental Health Initiative"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="What is this project about?"
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Read More Dialog */}
            <Dialog open={isDescriptionOpen} onOpenChange={setIsDescriptionOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{project.name}</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {project.description}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDescriptionOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Workspace Dialog */}
            <AlertDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deleteTarget?.name}&quot;?
                            All guides and simulations within it will be permanently deleted. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleting}
                            onClick={async () => {
                                if (!deleteTarget) return;
                                setDeleting(true);
                                try {
                                    await confirmDelete(deleteTarget.id);
                                    setDeleteTarget(null);
                                } finally {
                                    setDeleting(false);
                                }
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
