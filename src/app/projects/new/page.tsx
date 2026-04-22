"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, FolderPlus, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NewProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State - simplified to just name and description
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            alert("Please enter a project name");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || "",
                }),
            });

            const data = await res.json();

            if (data.success) {
                // Redirect to the project home where they can create sub-projects
                router.push(`/projects/${data.data.id}`);
            } else {
                alert(data.error || "Failed to create project");
            }
        } catch (err) {
            alert("Failed to create project");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-8 flex flex-col items-center">

            <div className="w-full max-w-2xl">
                {/* Back Link */}
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Projects
                </Link>

                <Card>
                    <CardContent className="p-8 md:p-10">
                        {/* Header Section */}
                        <div className="mb-8 text-center">
                            <div className="h-10 w-10 rounded-md flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--color-interact-muted)', color: 'var(--color-interact)' }}>
                                <FolderPlus className="h-5 w-5" />
                            </div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-2">Create New Project</h1>
                            <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                Initialize a new research hub to organize your documents, workspaces, and simulation guides.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                {/* Project Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Project Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Youth Mental Health Study 2026"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Description <span className="text-muted-foreground font-normal">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Briefly describe the purpose and scope of this research project..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={4}
                                        className="resize-none"
                                    />
                                </div>

                                {/* Info Box */}
                                <div className="rounded-md p-4" style={{ backgroundColor: 'var(--color-info-subtle)' }}>
                                    <h4 className="text-xs font-medium mb-2" style={{ color: 'var(--color-info)' }}>Next Steps</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <div className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-info)' }} />
                                            Upload personas and documents to the project Knowledge Base
                                        </li>
                                        <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <div className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-info)' }} />
                                            Create Workspaces for specific research focuses and demographics
                                        </li>
                                        <li className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <div className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ backgroundColor: 'var(--color-info)' }} />
                                            Build moderator guides and run Simulations
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <Link href="/dashboard">
                                    <Button type="button" variant="ghost">
                                        Cancel
                                    </Button>
                                </Link>

                                <Button
                                    type="submit"
                                    disabled={loading || !name.trim()}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Project
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
