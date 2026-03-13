"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FolderKanban, FolderOpen, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useRouter } from "next/navigation";

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
                alert("Failed to delete project: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            alert("Failed to delete project");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-semibold tracking-tight">My Projects</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your HPB research projects
                </p>

                {/* Mobile FAB */}
                <Link href="/projects/new" className="md:hidden fixed bottom-6 right-6 z-50">
                    <Button size="icon" className="h-14 w-14 rounded-full shadow-lg">
                        <Plus className="h-6 w-6" />
                    </Button>
                </Link>
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : error ? (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            ) : projects.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                        <FolderKanban className="h-10 w-10 text-muted-foreground/40 mb-4" />
                        <h3 className="text-base font-medium mb-1">No projects yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Create your first project to get started
                        </p>
                        <Link href="/projects/new">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Project
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {projects.map((project) => (
                        <div key={project.id} className="group relative">
                            <Link href={`/projects/${project.id}`} className="block h-full">
                                <Card className="h-full transition-colors hover:bg-[var(--color-interact-subtle)]">
                                    <CardContent className="p-4 flex flex-col h-full justify-between">
                                        <div>
                                            <h3 className="font-medium text-base mb-2 line-clamp-2">
                                                {project.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                                                {project.description || "No description provided."}
                                            </p>
                                        </div>

                                        <div className="pt-3 border-t border-border flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>

                                            <div
                                                className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteClick(project);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </div>
                    ))}
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
    );
}
// Created by Swapnil Bapat © 2026
