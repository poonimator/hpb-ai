"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { WorkspaceRail, type WorkspaceRailSubProject } from "@/components/tools/workspace-rail";
import { PersonaPanel, type PersonaLike } from "@/components/tools/persona-panel";
import {
    ArrowLeft,
    Loader2,
} from "lucide-react";

interface ArchetypeData {
    id: string;
    name: string;
    kicker: string | null;
    description: string;
    demographicJson: string | null;
    fullContentJson: string | null;
    order: number;
    archetypeSession: {
        id: string;
        subProject: {
            id: string;
            name: string;
            project: { id: string; name: string };
        };
    };
}

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string; sessionId: string }>;
}

function parse(json: string | null) {
    if (!json) return null;
    try { return JSON.parse(json); } catch { return null; }
}

export default function ArchetypeViewPage({ params }: PageProps) {
    const { projectId, subProjectId, sessionId: archetypeId } = use(params);
    const [archetype, setArchetype] = useState<ArchetypeData | null>(null);
    const [subProject, setSubProject] = useState<WorkspaceRailSubProject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchArchetype();
    }, [archetypeId]);

    useEffect(() => {
        fetchSubProject();
    }, [subProjectId]);

    const fetchArchetype = async () => {
        try {
            const res = await fetch(`/api/archetypes/single/${archetypeId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch");
            setArchetype(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load");
        } finally {
            setLoading(false);
        }
    };

    const fetchSubProject = async () => {
        try {
            const res = await fetch(`/api/sub-projects/${subProjectId}`);
            const data = await res.json();
            if (res.ok && data.data) {
                setSubProject({
                    id: data.data.id,
                    name: data.data.name,
                    researchStatement: data.data.researchStatement ?? null,
                    ageRange: data.data.ageRange ?? null,
                    lifeStage: data.data.lifeStage ?? null,
                    createdAt: data.data.createdAt ?? null,
                    project: data.data.project ?? null,
                });
            }
        } catch (err) {
            console.error("Failed to fetch workspace:", err);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
            </div>
        );
    }

    if (error || !archetype) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-body-sm text-[color:var(--danger)] mb-4">{error || "Not found"}</p>
                    <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=archetypes`}>
                        <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const fullContent = parse(archetype.fullContentJson);
    const demographic = parse(archetype.demographicJson);

    // Extract all sections from fullContent
    const influences = fullContent?.influences || fullContent?.identity?.influences || [];
    const livedExperience = fullContent?.livedExperience || fullContent?.identity?.livedExperience || "";
    const behaviours = fullContent?.behaviours || fullContent?.identity?.behaviours || [];
    const barriers = fullContent?.barriers || fullContent?.identity?.barriers || [];
    const motivations = fullContent?.motivations || fullContent?.identity?.motivations || [];
    const goals = fullContent?.goals || fullContent?.identity?.goals || [];
    const habits = fullContent?.habits || fullContent?.identity?.habits || [];
    const spiral = fullContent?.spiral || fullContent?.identity?.spiral;

    const persona: PersonaLike = {
        name: archetype.name,
        kicker: archetype.kicker,
        description: archetype.description,
        demographics: demographic
            ? {
                ageRange: demographic.ageRange ?? null,
                occupation: demographic.occupation ?? null,
                livingSetup: demographic.livingSetup ?? null,
            }
            : null,
        livedExperience,
        influences,
        behaviours,
        barriers,
        motivations,
        goals,
        habits,
        spiral: spiral ?? null,
    };

    const demographicForRail = parse(archetype.demographicJson);

    const railNode = subProject ? (
        <WorkspaceRail
            subProject={subProject}
            projectId={projectId}
            subProjectId={subProjectId}
        >
            <RailSection title="Archetype">
                <MetaRow k="Name" v={archetype.name} />
                {archetype.kicker && <MetaRow k="Kicker" v={archetype.kicker} />}
                {demographicForRail?.ageRange && <MetaRow k="Age" v={demographicForRail.ageRange} />}
                {demographicForRail?.occupation && <MetaRow k="Occupation" v={demographicForRail.occupation} />}
                {demographicForRail?.livingSetup && <MetaRow k="Living setup" v={demographicForRail.livingSetup} />}
            </RailSection>
        </WorkspaceRail>
    ) : null;

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{
                    href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes`,
                    label: "Back",
                }}
                crumbs={[
                    { label: "Archetypes", href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes` },
                    { label: archetype.name },
                ]}
            />

            <WorkspaceFrame variant="review" leftRail={railNode} scrollContained>
                <PersonaPanel persona={persona} />

                {/* Mode note */}
                <p className="mt-8 text-caption italic text-muted-foreground">
                    Archetype mode — a person may shift between different modes depending on situation and support.
                </p>
            </WorkspaceFrame>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
