"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, AlertCircle, Trash2, Loader2 } from "lucide-react";
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

interface SubProject {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    description: string;
    createdAt: string;
    subProjects: SubProject[];
    _count: {
        subProjects: number;
        kbDocuments: number;
    };
}

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();

            if (data.success) {
                setProjects(data.data);
            } else {
                setError(data.error || "Failed to fetch projects");
            }
        } catch (err) {
            setError("Failed to connect to server");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/projects/${projectToDelete.id}`, {
                method: "DELETE"
            });
            const data = await res.json();

            if (data.success) {
                setProjects(projects.filter(p => p.id !== projectToDelete.id));
                setDeleteDialogOpen(false);
                setProjectToDelete(null);
            } else {
                toast.error("Failed to delete project: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete project");
        } finally {
            setDeleting(false);
        }
    };

    // Loading state — matches tool-page primary-soft chip treatment
    if (loading) {
        return (
            <div className="flex-1 min-h-0 w-full overflow-y-auto">
                <div className="flex h-full items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-[10px] bg-[color:var(--primary-soft)] shadow-inset-edge flex items-center justify-center">
                            <Loader2 className="h-5 w-5 text-[color:var(--primary)] animate-spin" />
                        </div>
                        <span className="text-body-sm text-muted-foreground">Loading projects…</span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state — soft destructive card
    if (error) {
        return (
            <div className="flex-1 min-h-0 w-full overflow-y-auto">
                <div className="flex items-center justify-center py-24">
                    <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6 max-w-md w-full flex flex-col items-center text-center gap-4">
                        <div className="h-10 w-10 rounded-[10px] bg-[color:var(--destructive)]/10 shadow-inset-edge flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground text-sm mb-1">Couldn&apos;t load projects</h3>
                            <p className="text-[12px] text-muted-foreground leading-snug">{error}</p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setError(null);
                                setLoading(true);
                                fetchProjects();
                            }}
                        >
                            Try again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        // Centered container with a standard max-width. Visually balanced on
        // any viewport size — the prior left-anchored (pl-[153px]) attempts
        // always read as right-shifted because of the empty left gutter.
        <div className="flex-1 min-h-0 w-full overflow-y-auto">
          <div className="w-full max-w-7xl mx-auto flex flex-col pt-10 pb-20 px-4 sm:px-6 lg:px-8">
            {/* Page header — matches the display-heavy intro blocks on the rest of the app */}
            <header className="mb-10 flex items-end justify-between gap-6 border-b border-[color:var(--border-subtle)] pb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-display-1 text-foreground leading-[1.05]">Projects</h1>
                    <p className="text-body-sm text-muted-foreground max-w-xl leading-relaxed">
                        Organise research, run interview simulations, map insights, and drive synthesis across your HPB projects.
                    </p>
                </div>
                <Button asChild variant="primary" className="shrink-0">
                    <Link href="/projects/new">
                        <Plus className="h-4 w-4" />
                        New project
                    </Link>
                </Button>
            </header>

            {/* Empty state — single prominent create tile */}
            {projects.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                    <Link
                        href="/projects/new"
                        className="group rounded-[14px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] hover:bg-[color:var(--surface)] hover:shadow-outline-ring hover:border-transparent transition-all duration-200 flex flex-col items-center justify-center p-8 min-h-[220px] w-full max-w-md cursor-pointer"
                    >
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="h-10 w-10 rounded-[10px] bg-[color:var(--surface)] shadow-inset-edge flex items-center justify-center">
                                <Plus className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-0.5">Create New Project</h3>
                                <p className="text-[12px] text-muted-foreground leading-snug max-w-[220px]">
                                    Start organising research, running simulations, and synthesising insights.
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Project Cards */}
                    {projects.map((project) => {
                        const createdLabel = new Date(project.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        });
                        const workspaceCount = project._count?.subProjects ?? 0;

                        return (
                            <div
                                key={project.id}
                                className="group rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring hover:shadow-card transition-shadow duration-200 p-4 min-h-[180px] flex flex-col cursor-pointer relative"
                            >
                                {/* Delete button on hover */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteClick(project);
                                    }}
                                    aria-label={`Delete project ${project.name}`}
                                    className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-[8px] text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>

                                <Link href={`/projects/${project.id}`} className="flex flex-col flex-1">
                                    {/* Icon */}
                                    <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center mb-auto">
                                        <FolderKanban className="h-4.5 w-4.5" />
                                    </div>

                                    {/* Content at bottom — mirrors project-detail workspace card */}
                                    <div className="mt-3">
                                        <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-1 mb-1">
                                            {project.name}
                                        </h3>
                                        <p className="text-[12px] text-muted-foreground leading-snug line-clamp-2 mb-2">
                                            {project.description || "No description yet."}
                                        </p>
                                        <p className="text-[12px] text-muted-foreground leading-snug">
                                            Created {createdLabel}
                                            {" · "}
                                            {workspaceCount} {workspaceCount === 1 ? "workspace" : "workspaces"}
                                        </p>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{projectToDelete?.name}&quot;?
                            <br /><br />
                            This will remove the project and its moderator guide.
                            Past simulations will be preserved but will no longer be linked to this project.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
