"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, FolderPlus, ArrowRight } from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";

export default function NewProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Please enter a project name");
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
                router.push(`/projects/${data.data.id}`);
            } else {
                toast.error(data.error || "Failed to create project");
            }
        } catch (err) {
            toast.error("Failed to create project");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: "/dashboard", label: "Back" }}
                crumbs={[{ label: "New project" }]}
            />

            <div className="flex-1 min-h-0 w-full overflow-y-auto bg-[color:var(--canvas)]">
                <div className="max-w-2xl mx-auto px-6 py-12">
                    <header className="mb-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center">
                                <FolderPlus className="h-4 w-4" />
                            </div>
                            <span className="text-eyebrow text-muted-foreground">New project</span>
                        </div>
                        <h1 className="text-display-2 text-foreground leading-tight mb-3">
                            Start a research project
                        </h1>
                        <p className="text-body-sm text-muted-foreground leading-relaxed max-w-xl">
                            A project groups knowledge, workspaces, and simulation guides around a single research focus.
                        </p>
                    </header>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6 md:p-8 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-ui-sm">
                                    Project name <span className="text-[color:var(--danger)]">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Youth Mental Health Study 2026"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-ui-sm">
                                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe the purpose and scope of this research project…"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        <div className="rounded-[14px] border border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)] p-5">
                            <h4 className="text-caption uppercase tracking-wider text-muted-foreground mb-3">
                                Once created, you can
                            </h4>
                            <ul className="flex flex-col gap-2 text-[13px] text-foreground/80 leading-snug">
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[color:var(--primary)] shrink-0" />
                                    Upload personas and documents to the project Knowledge Base
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[color:var(--primary)] shrink-0" />
                                    Create workspaces for specific research focuses and demographics
                                </li>
                                <li className="flex items-start gap-2.5">
                                    <span className="mt-1.5 h-1 w-1 rounded-full bg-[color:var(--primary)] shrink-0" />
                                    Build moderator guides and run simulations
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <Button type="button" variant="ghost" asChild>
                                <Link href="/dashboard">Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={loading || !name.trim()}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creating…
                                    </>
                                ) : (
                                    <>
                                        Create project
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
