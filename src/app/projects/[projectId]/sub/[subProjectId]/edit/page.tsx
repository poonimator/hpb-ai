"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ArrowLeft,
    Loader2,
    Target,
    FolderPlus,
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
    project: {
        id: string;
        name: string;
    }
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
    const [subProject, setSubProject] = useState<SubProject | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [researchStatement, setResearchStatement] = useState("");
    const [ageMin, setAgeMin] = useState("13");
    const [ageMax, setAgeMax] = useState("25");
    const [selectedLifeStages, setSelectedLifeStages] = useState<string[]>([]);

    useEffect(() => {
        fetchSubProject();
    }, [projectId, subProjectId]);

    const fetchSubProject = async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();

            if (res.ok && data.data) {
                const sp: SubProject = data.data;
                setSubProject(sp);
                setName(sp.name);
                setResearchStatement(sp.researchStatement || "");

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
                    // Simple matching for clean UI
                    const knownValues = LIFE_STAGE_OPTIONS.map(o => o.value);
                    const matchedStages = stages.filter(s => knownValues.some(k => s.includes(k) || k.includes(s)));
                    // Fallback if formatting is different or create new mapping if needed, 
                    // for now assuming comma separated matching values or labels

                    // Better approach: match checks against values
                    const mapped = LIFE_STAGE_OPTIONS.filter(opt =>
                        stages.some(s => s.toLowerCase().includes(opt.value.toLowerCase()) || s.toLowerCase().includes(opt.label.toLowerCase()))
                    ).map(opt => opt.value);

                    if (mapped.length > 0) {
                        setSelectedLifeStages(mapped);
                    } else {
                        // If purely custom string, maybe just console log warning or try best effort
                        // For this context, we assume it was created via our UI
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch sub-project:", err);
        } finally {
            setLoading(false);
        }
    };

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
            alert("Please fill in all required fields");
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
                throw new Error("Failed to update sub-project");
            }

            // Redirect back to sub-project page
            router.push(`/projects/${projectId}/sub/${subProjectId}`);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to update sub-project");
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
        <div className="py-8">
            <div className="w-full max-w-4xl mx-auto animate-in zoom-in-95 fade-in duration-500 ease-out">
                    {/* Back Link */}
                    <Link
                        href={`/projects/${projectId}/sub/${subProjectId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {subProject?.name || "Workspace"}
                    </Link>

                    {/* Card */}
                    <div className="relative bg-card border border-border rounded-md shadow-sm p-8 md:p-10">
                        <div className="max-w-3xl mx-auto">
                            {/* Header Section */}
                            <div className="mb-8">
                                <h1 className="text-3xl font-semibold tracking-tight mb-2" aria-label="Edit Sub-Project">Edit Sub-Project</h1>
                                <p className="text-sm text-muted-foreground">
                                    Update the details regarding the research focus and target demographics.
                                </p>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Name Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-sm font-medium text-foreground">
                                        Sub-Project Name <span className="text-red-400">*</span>
                                    </Label>
                                    <div className="relative">
                                        <FolderPlus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="e.g., Secondary School Mental Health Awareness"
                                            className="pl-9 bg-white/50 border-input focus:border-input transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Research Statement */}
                                <div className="space-y-2">
                                    <Label htmlFor="statement" className="text-sm font-medium text-foreground">
                                        Research Statement <span className="text-red-400">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Target className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Textarea
                                            id="statement"
                                            value={researchStatement}
                                            onChange={(e) => setResearchStatement(e.target.value)}
                                            placeholder="What are you trying to understand or explore?"
                                            className="pl-9 bg-white/50 border-input focus:border-input transition-all resize-none min-h-[100px]"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Age Range */}
                                    <div className="space-y-3">
                                        <Label className="text-sm font-medium text-foreground block">Age Range</Label>
                                        <div className="flex items-center gap-3 bg-white/40 p-3 rounded-xl border border-border">
                                            <div className="flex-1">
                                                <Label htmlFor="ageMin" className="text-[10px] uppercase text-muted-foreground mb-1 block tracking-wider font-semibold">
                                                    Min Age
                                                </Label>
                                                <Input
                                                    id="ageMin"
                                                    type="number"
                                                    value={ageMin}
                                                    onChange={(e) => setAgeMin(e.target.value)}
                                                    min="6"
                                                    max="100"
                                                    className="h-9 bg-white border-input focus:border-input text-center"
                                                />
                                            </div>
                                            <span className="text-border pt-5">—</span>
                                            <div className="flex-1">
                                                <Label htmlFor="ageMax" className="text-[10px] uppercase text-muted-foreground mb-1 block tracking-wider font-semibold">
                                                    Max Age
                                                </Label>
                                                <Input
                                                    id="ageMax"
                                                    type="number"
                                                    value={ageMax}
                                                    onChange={(e) => setAgeMax(e.target.value)}
                                                    min="6"
                                                    max="100"
                                                    className="h-9 bg-white border-input focus:border-input text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Life Stages */}
                                    <div className="space-y-3 md:col-span-2">
                                        <Label className="text-sm font-medium text-foreground block">
                                            Target Life Stages <span className="text-red-400">*</span>
                                        </Label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {LIFE_STAGE_OPTIONS.map((option) => (
                                                <div
                                                    key={option.value}
                                                    onClick={() => toggleLifeStage(option.value)}
                                                    className={`
                                                        relative flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all select-none
                                                        ${selectedLifeStages.includes(option.value)
                                                            ? 'border-primary bg-accent text-foreground'
                                                            : 'border-input bg-white/40 hover:bg-white/60 hover:border-input text-muted-foreground'
                                                        }
                                                    `}
                                                >
                                                    <Checkbox
                                                        checked={selectedLifeStages.includes(option.value)}
                                                        onCheckedChange={() => toggleLifeStage(option.value)}
                                                        className={`data-[state=checked]:bg-primary data-[state=checked]:border-primary ${selectedLifeStages.includes(option.value) ? 'border-primary' : 'border-border'}`}
                                                    />
                                                    <span className="text-xs font-medium">{option.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {selectedLifeStages.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1 pl-1 flex items-center gap-1">
                                                <span className="h-1 w-1 rounded-full bg-amber-500" />
                                                Please select at least one life stage
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-end gap-3 pt-6 border-t border-border">
                                    <Link href={`/projects/${projectId}/sub/${subProjectId}`}>
                                        <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground">
                                            Cancel
                                        </Button>
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={saving || !name.trim() || !researchStatement.trim() || selectedLifeStages.length === 0}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                Save Changes
                                                <Save className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
