"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { PageBar } from "@/components/layout/page-bar";
import { toast } from "sonner";
import {
    Loader2,
    Save
} from "lucide-react";

interface SubProject {
    id: string;
    name: string;
    description?: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;
    projectId: string;
}

interface Project {
    id: string;
    name: string;
}

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

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

export default function EditSubProjectPage({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [project, setProject] = useState<Project | null>(null);
    const [subProject, setSubProject] = useState<SubProject | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [researchStatement, setResearchStatement] = useState("");
    const [ageMin, setAgeMin] = useState("13");
    const [ageMax, setAgeMax] = useState("25");
    const [selectedLifeStages, setSelectedLifeStages] = useState<string[]>([]);

    const fetchData = async () => {
        try {
            const spRes = await fetch(`/api/sub-projects/${subProjectId}`);
            const spData = await spRes.json();

            if (spRes.ok && spData.data) {
                const sp: SubProject = spData.data;
                setSubProject(sp);
                setName(sp.name);
                setResearchStatement(sp.researchStatement || "");

                // Fetch project for PageBar crumbs
                const pRes = await fetch(`/api/projects/${projectId}`);
                const pData = await pRes.json();
                if (pRes.ok) {
                    setProject(pData.data);
                }

                // Parse Age Range
                if (sp.ageRange) {
                    const parts = sp.ageRange.split("-");
                    if (parts.length === 2) {
                        setAgeMin(parts[0].trim());
                        setAgeMax(parts[1].trim());
                    } else {
                        setAgeMin(sp.ageRange);
                    }
                }

                // Parse Life Stages
                if (sp.lifeStage) {
                    const stages = sp.lifeStage.split(",").map(s => s.trim());
                    // Match checks against values
                    const mapped = LIFE_STAGE_OPTIONS.filter(opt =>
                        stages.some(s => s.toLowerCase().includes(opt.value.toLowerCase()) || s.toLowerCase().includes(opt.label.toLowerCase()))
                    ).map(opt => opt.value);

                    if (mapped.length > 0) {
                        setSelectedLifeStages(mapped);
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch sub-project:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, subProjectId]);

    const toggleLifeStage = (stage: string) => {
        setSelectedLifeStages(prev =>
            prev.includes(stage)
                ? prev.filter(s => s !== stage)
                : [...prev, stage]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !researchStatement.trim() || selectedLifeStages.length === 0) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    researchStatement: researchStatement.trim(),
                    ageRange: `${ageMin}-${ageMax}`,
                    lifeStage: selectedLifeStages.join(", "),
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update workspace");
            }

            // Redirect back to workspace page
            router.push(`/projects/${projectId}/sub/${subProjectId}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update workspace");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <PageBar
                back={{ href: `/projects/${projectId}/sub/${subProjectId}`, label: "Back" }}
                crumbs={
                    subProject?.name && project?.name
                        ? [
                            { label: project.name, href: `/projects/${projectId}` },
                            { label: subProject.name, href: `/projects/${projectId}/sub/${subProjectId}` },
                            { label: "Edit" },
                        ]
                        : undefined
                }
            />

            <div className="pt-6 pb-20">
                <div className="max-w-[640px] mx-auto">
                    {/* Hero Section */}
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-display-1 text-foreground">Edit workspace</h1>
                        <p className="text-body text-muted-foreground">
                            Update the name, research framing, audience, or stage for {subProject?.name ?? "this workspace"}.
                        </p>
                    </div>

                    {/* Main Card */}
                    <Card>
                        <CardContent className="p-8">
                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Workspace Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g., Secondary School Mental Health Awareness"
                                        required
                                    />
                                </div>

                                {/* Research Statement */}
                                <div className="space-y-2">
                                    <Label htmlFor="statement">
                                        Research Statement <span className="text-destructive">*</span>
                                    </Label>
                                    <Textarea
                                        id="statement"
                                        value={researchStatement}
                                        onChange={(e) => setResearchStatement(e.target.value)}
                                        placeholder="What are you trying to understand or explore?"
                                        className="min-h-[120px] resize-none"
                                        required
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 pt-2">
                                    {/* Age Range */}
                                    <div className="space-y-2">
                                        <Label>Age Range</Label>
                                        <div className="flex items-center gap-3 p-3 rounded-md border border-input">
                                            <div className="flex-1">
                                                <Label htmlFor="ageMin" className="text-[10px] uppercase text-muted-foreground mb-1 block tracking-wider text-center">
                                                    Min Age
                                                </Label>
                                                <Input
                                                    id="ageMin"
                                                    type="number"
                                                    value={ageMin}
                                                    onChange={(e) => setAgeMin(e.target.value)}
                                                    min="6"
                                                    max="100"
                                                    className="text-center font-medium text-lg"
                                                />
                                            </div>
                                            <div className="flex flex-col items-center justify-center pt-5">
                                                <div className="w-6 h-px bg-border" />
                                            </div>
                                            <div className="flex-1">
                                                <Label htmlFor="ageMax" className="text-[10px] uppercase text-muted-foreground mb-1 block tracking-wider text-center">
                                                    Max Age
                                                </Label>
                                                <Input
                                                    id="ageMax"
                                                    type="number"
                                                    value={ageMax}
                                                    onChange={(e) => setAgeMax(e.target.value)}
                                                    min="6"
                                                    max="100"
                                                    className="text-center font-medium text-lg"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Life Stages */}
                                    <div className="space-y-2">
                                        <Label>
                                            Target Life Stages <span className="text-destructive">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {LIFE_STAGE_OPTIONS.map((option) => (
                                                <label
                                                    key={option.value}
                                                    className="flex items-center gap-2 text-body-sm cursor-pointer"
                                                >
                                                    <Checkbox
                                                        checked={selectedLifeStages.includes(option.value)}
                                                        onCheckedChange={() => toggleLifeStage(option.value)}
                                                    />
                                                    {option.label}
                                                </label>
                                            ))}
                                        </div>
                                        {selectedLifeStages.length === 0 && (
                                            <p className="text-xs text-[color:var(--danger)] mt-1.5 flex items-center gap-1.5">
                                                Please select at least one life stage
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                                    <Link href={`/projects/${projectId}/sub/${subProjectId}`}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={saving || !name.trim() || !researchStatement.trim() || selectedLifeStages.length === 0}
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                Save changes
                                                <Save className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
