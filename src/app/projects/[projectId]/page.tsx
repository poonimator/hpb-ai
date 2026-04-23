"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    BookOpen,
    Loader2,
    Trash2,
    Pencil,
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";

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
    knowledgeDocumentCount?: number;
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
    const [isDescriptionOpen, setIsDescriptionOpen] = useState(false); // Read more dialog state

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

    const createdLabel = project.createdAt
        ? new Date(project.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : null;

    const workspaceCount = project.subProjects?.length ?? 0;

    const leftRail = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Project</Badge>
                </div>
                <h2 className="text-display-4 text-foreground leading-tight">
                    {project.name}
                </h2>
                {project.description && (
                    <div className="flex flex-col gap-1.5">
                        <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {project.description}
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsDescriptionOpen(true)}
                            className="self-start text-ui-sm text-[color:var(--primary)] hover:underline outline-none focus-visible:shadow-focus rounded-[2px]"
                        >
                            Read more
                        </button>
                    </div>
                )}
            </RailHeader>

            <RailSection title="Project">
                <MetaRow k="Workspaces" v={project.subProjects?.length ?? 0} />
                {createdLabel && <MetaRow k="Created" v={createdLabel} />}
            </RailSection>

            <div className="flex-1" />

            <div className="px-8 py-4 flex flex-col gap-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-center">
                    <Link href={`/projects/${projectId}/kb`}>
                        <BookOpen className="h-3.5 w-3.5" />
                        Knowledge base
                    </Link>
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    onClick={openEditDialog}
                >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit project
                </Button>
            </div>
        </>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: "/dashboard", label: "Back" }}
                crumbs={[{ label: project.name }]}
            />

            <WorkspaceFrame variant="review" scrollContained leftRail={leftRail}>
                {/* Workspaces header */}
                <div className="mb-6">
                    <h1 className="text-display-2 text-foreground">Workspaces</h1>
                    <p className="text-body-sm text-muted-foreground mt-1">
                        {workspaceCount > 0
                            ? `${workspaceCount} workspace${workspaceCount === 1 ? "" : "s"}`
                            : "Set up a workspace for each research strand"}
                    </p>
                </div>

                {/* Workspaces grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* New Workspace create card — always first */}
                    <Link
                        href={`/projects/${projectId}/sub/new`}
                        className="group rounded-[14px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:bg-[color:var(--surface)] hover:shadow-outline-ring hover:border-transparent transition-all duration-200 flex flex-col items-center justify-center p-5 min-h-[180px] cursor-pointer"
                    >
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="h-10 w-10 rounded-[10px] bg-[color:var(--surface)] shadow-inset-edge flex items-center justify-center">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-0.5">
                                    New workspace
                                </h3>
                                <p className="text-[12px] text-muted-foreground leading-snug max-w-[140px]">
                                    Set up a new research workspace
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Workspace Cards */}
                    {project.subProjects.map((subProject) => (
                        <Link
                            key={subProject.id}
                            href={`/projects/${projectId}/sub/${subProject.id}`}
                            className="group rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring hover:shadow-card transition-shadow duration-200 p-4 min-h-[180px] flex flex-col cursor-pointer relative"
                        >
                            {/* Hover-revealed delete */}
                            <button
                                type="button"
                                className="absolute top-2.5 right-2.5 p-1.5 rounded-[8px] text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setDeleteTarget({ id: subProject.id, name: subProject.name });
                                }}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            {/* Icon chip */}
                            <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center mb-auto">
                                <FolderOpen className="h-4.5 w-4.5" />
                            </div>

                            {/* Content at bottom */}
                            <div className="mt-3">
                                <h4 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 mb-1">
                                    {subProject.name}
                                </h4>
                                <p className="text-[12px] text-muted-foreground leading-snug line-clamp-2 mb-2">
                                    {subProject.researchStatement || "No research statement defined."}
                                </p>
                                <p className="text-[12px] text-muted-foreground leading-snug">
                                    {subProject._count.guideVersions} guide
                                    {subProject._count.guideVersions === 1 ? "" : "s"}
                                    {" · "}
                                    {subProject._count.simulations} simulation
                                    {subProject._count.simulations === 1 ? "" : "s"}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </WorkspaceFrame>

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
