"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PageBar } from "@/components/layout/page-bar";
import { PageContainer } from "@/components/layout/page-container";
import { toast } from "sonner";
import {
    ArrowRight,
    Loader2
} from "lucide-react";

interface PageProps {
    params: Promise<{ projectId: string }>;
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

export default function NewSubProjectPage({ params }: PageProps) {
    const { projectId } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [researchStatement, setResearchStatement] = useState("");
    const [ageMin, setAgeMin] = useState("13");
    const [ageMax, setAgeMax] = useState("25");
    const [selectedLifeStages, setSelectedLifeStages] = useState<string[]>([]);

    useEffect(() => {
        setLoading(false);
    }, []);

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

        setCreating(true);

        try {
            const res = await fetch("/api/sub-projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    name: name.trim(),
                    researchStatement: researchStatement.trim(),
                    ageRange: `${ageMin}-${ageMax}`,
                    lifeStage: selectedLifeStages.join(", "),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to create workspace");
            }

            // Redirect to workspace page
            router.push(`/projects/${projectId}/sub/${data.data.id}`);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create workspace");
        } finally {
            setCreating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: `/projects/${projectId}`, label: "Back" }}
                crumbs={[{ label: "New workspace" }]}
            />

            <PageContainer innerClassName="pt-6 pb-20">
                <div className="max-w-[640px] mx-auto">
                    {/* Hero Section */}
                    <div className="flex flex-col gap-2 mb-8">
                        <h1 className="text-display-1 text-foreground">Create new workspace</h1>
                        <p className="text-body text-muted-foreground">
                            A workspace is where you organise one research stream — its moderator guide, simulations, and synthesis live here.
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
                                        placeholder="e.g. Secondary School Mental Health Awareness"
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
                                    <Link href={`/projects/${projectId}`}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={creating || !name.trim() || !researchStatement.trim() || selectedLifeStages.length === 0}
                                    >
                                        {creating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Create workspace
                                                <ArrowRight className="h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </PageContainer>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
