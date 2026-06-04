"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { ProvenancePill } from "@/components/personas/provenance-pill";
import { InlineField } from "@/components/personas/inline-field";
import {
    ArrowLeft,
    Loader2,
    Pencil,
    Check,
    X,
    RefreshCw,
    Sparkles,
    Plus,
    Trash2,
    UserCircle2,
    AlertCircle,
} from "lucide-react";
import type { PersonaContent, Provenance, EvidenceQuote } from "@/lib/personas/types";

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string; personaId: string }>;
}

interface PersonaResponse {
    id: string;
    name: string;
    kicker: string | null;
    avatarUrl: string | null;
    archetypeId: string | null;
    archetype: {
        id: string;
        name: string;
        kicker: string | null;
        description: string;
    } | null;
    content: PersonaContent;
    contributingTranscripts: Array<{ id: string; displayName: string; fileName: string }>;
    personaSession: {
        id: string;
        name: string;
        status: string;
        archetypeSession: { id: string; name: string } | null;
        subProject: { id: string; name: string; projectId: string };
    };
    createdAt: string;
    updatedAt: string;
}

interface SessionResponse {
    id: string;
    name: string;
    status: string;
    syntheticPersonas: Array<{ id: string; name: string; archetypeId: string | null }>;
    classifications: Array<{
        id: string;
        archetypeId: string | null;
        confidence: number;
        rationale: string | null;
        userOverridden: boolean;
        supportingQuotesJson: string | null;
        transcript: { id: string; displayName: string; mappingSessionId: string };
    }>;
    archetypeSession: {
        id: string;
        archetypes: Array<{ id: string; name: string; kicker: string | null }>;
    } | null;
    staleness: { isStale: boolean; newTranscriptIds: string[]; archetypeUpdatedAfterRun: boolean };
}

export default function PersonaDetailPage({ params }: PageProps) {
    const { projectId, subProjectId, personaId } = use(params);
    const [persona, setPersona] = useState<PersonaResponse | null>(null);
    const [session, setSession] = useState<SessionResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [showUnclassified, setShowUnclassified] = useState(false);
    const [editingHeader, setEditingHeader] = useState<"name" | "kicker" | null>(null);
    const [draftName, setDraftName] = useState("");
    const [draftKicker, setDraftKicker] = useState("");

    const fetchAll = useCallback(async () => {
        try {
            const res = await fetch(`/api/personas/${personaId}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed");
            const p: PersonaResponse = data.data;
            setPersona(p);
            setDraftName(p.name);
            setDraftKicker(p.kicker || "");

            // Pull the parent session for staleness banner + classifications sidebar
            const sessRes = await fetch(`/api/persona-sessions/${p.personaSession.id}`);
            const sessData = await sessRes.json();
            if (sessRes.ok) setSession(sessData.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load persona");
        } finally {
            setLoading(false);
        }
    }, [personaId]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    async function patchPersona(body: Record<string, unknown>) {
        const res = await fetch(`/api/personas/${personaId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(d?.error || "Save failed");
            return false;
        }
        return true;
    }

    async function saveField(path: string[], value: unknown, provenance: Provenance) {
        const ok = await patchPersona({ contentPatch: { path, value, provenance } });
        if (ok) await fetchAll();
    }

    async function saveName() {
        if (!persona) return;
        const trimmed = draftName.trim() || persona.name;
        const ok = await patchPersona({ name: trimmed });
        if (ok) { setEditingHeader(null); await fetchAll(); }
    }

    async function saveKicker() {
        const trimmed = draftKicker.trim();
        const ok = await patchPersona({ kicker: trimmed === "" ? null : trimmed });
        if (ok) { setEditingHeader(null); await fetchAll(); }
    }

    async function handleAvatarUpload(file: File) {
        if (file.size > 4 * 1024 * 1024) {
            toast.error("Image must be under 4MB");
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            const dataUrl = reader.result as string;
            const ok = await patchPersona({ avatarUrl: dataUrl });
            if (ok) await fetchAll();
        };
        reader.readAsDataURL(file);
    }

    async function regenerate() {
        if (!persona) return;
        setRegenerating(true);
        try {
            const res = await fetch(`/api/personas/${personaId}/regenerate`, { method: "POST" });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d?.error || "Regenerate failed");
            }
            toast.success("Persona regenerated");
            await fetchAll();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Regenerate failed");
        } finally {
            setRegenerating(false);
        }
    }

    async function moveTranscript(classificationId: string, archetypeId: string | null) {
        const res = await fetch(`/api/transcript-classifications/${classificationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ archetypeId }),
        });
        if (res.ok) {
            await fetchAll();
            toast.success("Classification updated. Regenerate this persona to incorporate.");
        } else {
            toast.error("Failed to update classification");
        }
    }

    async function saveVerbatims(verbatims: EvidenceQuote[]) {
        const ok = await patchPersona({ verbatims });
        if (ok) await fetchAll();
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!persona) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-body-sm text-[color:var(--danger)] mb-4">Persona not found.</p>
                    <Link href={`/projects/${projectId}/sub/${subProjectId}?tab=archetypes`}>
                        <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Back</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const c = persona.content;
    const stale = session?.staleness;
    const unclassified = (session?.classifications || []).filter(c => !c.archetypeId);

    const railNode = (
        <>
            <RailHeader>
                <div className="space-y-3">
                    {persona.avatarUrl ? (
                        <div className="h-16 w-16 rounded-full overflow-hidden shadow-inset-edge bg-[color:var(--surface-muted)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={persona.avatarUrl} alt={persona.name} className="h-full w-full object-cover" />
                        </div>
                    ) : (
                        <div className="h-16 w-16 rounded-full bg-[color:var(--cat-1-soft)] text-[color:var(--cat-1)] shadow-inset-edge flex items-center justify-center">
                            <UserCircle2 className="h-8 w-8" />
                        </div>
                    )}
                    <label className="text-caption text-muted-foreground hover:text-foreground underline cursor-pointer">
                        Replace avatar
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleAvatarUpload(f);
                                e.target.value = "";
                            }}
                        />
                    </label>
                </div>

                {editingHeader === "name" ? (
                    <div className="flex items-center gap-1.5 mt-3">
                        <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") saveName();
                                if (e.key === "Escape") setEditingHeader(null);
                            }}
                            autoFocus
                            className="flex-1 text-display-4 bg-[color:var(--surface-muted)] shadow-inset-edge rounded-[8px] px-2 py-1 focus:outline-none focus:shadow-outline-ring"
                        />
                        <button onClick={saveName} className="h-6 w-6 rounded-[6px] flex items-center justify-center bg-[color:var(--success-soft,#dcfce7)] text-[color:var(--success,#15803d)]">
                            <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingHeader(null)} className="h-6 w-6 rounded-[6px] flex items-center justify-center text-muted-foreground">
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-start justify-between gap-2 group mt-3">
                        <h2 className="text-display-4 text-foreground leading-tight">{persona.name}</h2>
                        <button onClick={() => setEditingHeader("name")} className="h-5 w-5 rounded-[6px] flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)] mt-1.5 shrink-0">
                            <Pencil className="h-3 w-3" />
                        </button>
                    </div>
                )}

                {editingHeader === "kicker" ? (
                    <div className="flex items-start gap-1.5 mt-2">
                        <textarea
                            value={draftKicker}
                            onChange={(e) => setDraftKicker(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveKicker();
                                if (e.key === "Escape") setEditingHeader(null);
                            }}
                            autoFocus
                            rows={2}
                            className="flex-1 text-body-sm bg-[color:var(--surface-muted)] shadow-inset-edge rounded-[6px] px-2 py-1 focus:outline-none focus:shadow-outline-ring italic"
                        />
                        <button onClick={saveKicker} className="h-5 w-5 rounded-[6px] flex items-center justify-center bg-[color:var(--success-soft,#dcfce7)] text-[color:var(--success,#15803d)] mt-1">
                            <Check className="h-3 w-3" />
                        </button>
                        <button onClick={() => setEditingHeader(null)} className="h-5 w-5 rounded-[6px] flex items-center justify-center text-muted-foreground mt-1">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-start gap-2 group mt-2">
                        {persona.kicker ? (
                            <p className="text-body-sm text-muted-foreground leading-relaxed italic flex-1">
                                &ldquo;{persona.kicker}&rdquo;
                            </p>
                        ) : (
                            <p className="text-caption text-muted-foreground/60 italic flex-1">No kicker — click to add</p>
                        )}
                        <button onClick={() => { setDraftKicker(persona.kicker || ""); setEditingHeader("kicker"); }} className="h-5 w-5 rounded-[6px] flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)] mt-0.5 shrink-0">
                            <Pencil className="h-3 w-3" />
                        </button>
                    </div>
                )}
            </RailHeader>

            <RailSection title="Anchor">
                {persona.archetype ? (
                    <MetaRow k="From archetype" v={persona.archetype.name} />
                ) : (
                    <MetaRow k="Mode" v="Cluster-discovered" />
                )}
                <MetaRow k="Transcripts" v={persona.contributingTranscripts.length} />
            </RailSection>

            <div className="flex-1" />
        </>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes`, label: "Back" }}
                crumbs={[
                    { label: "Profiles", href: `/projects/${projectId}/sub/${subProjectId}?tab=archetypes` },
                    { label: persona.name },
                ]}
            />

            <WorkspaceFrame variant="review" leftRail={railNode} scrollContained>
                <div className="space-y-6 pb-10">
                    {/* Type chip + stale banner */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="bg-[color:var(--cat-1-soft)] text-[color:var(--cat-1)] border-0">
                            Persona
                        </Badge>
                        <span className="text-caption text-muted-foreground">
                            Synthesised from {persona.contributingTranscripts.length} interview{persona.contributingTranscripts.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    {stale?.isStale && (
                        <div className="flex items-start gap-3 p-3.5 rounded-[12px] bg-[color:var(--warning-soft,#fef3c7)] text-[color:var(--warning,#92400e)] shadow-inset-edge">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-body-sm font-semibold">This persona is stale.</p>
                                <p className="text-caption mt-0.5 opacity-90">
                                    {stale.newTranscriptIds.length > 0
                                        ? `${stale.newTranscriptIds.length} new transcript${stale.newTranscriptIds.length === 1 ? "" : "s"} since this persona was generated.`
                                        : null}
                                    {stale.archetypeUpdatedAfterRun ? " Parent archetype has been updated since this run." : null}
                                </p>
                            </div>
                            <Button size="sm" variant="outline" onClick={regenerate} disabled={regenerating}>
                                {regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                Regenerate
                            </Button>
                        </div>
                    )}

                    {/* Provenance legend — what each pill on this page means.
                        "stated" + "inferred" collapse under a single "Stated"
                        pill (both signal the value is grounded in the data). */}
                    <div className="rounded-[12px] bg-[color:var(--surface-muted)] shadow-inset-edge p-3 flex items-center gap-3 flex-wrap">
                        <span className="text-caption text-muted-foreground font-medium">Provenance:</span>
                        <span className="inline-flex items-center gap-1.5"><ProvenancePill provenance="stated" /><span className="text-caption text-muted-foreground">Grounded in the data</span></span>
                        <span className="inline-flex items-center gap-1.5"><ProvenancePill provenance="assumed" /><span className="text-caption text-muted-foreground">Assumed by AI</span></span>
                        <span className="inline-flex items-center gap-1.5"><ProvenancePill provenance="not_in_data" /><span className="text-caption text-muted-foreground">No signal</span></span>
                        <span className="inline-flex items-center gap-1.5"><ProvenancePill provenance="user_set" /><span className="text-caption text-muted-foreground">User edit</span></span>
                    </div>

                    {/* Summary headline */}
                    <SectionCard title="At a glance" subtitle="Headline summary of this persona">
                        <InlineField
                            label="Headline"
                            field={c.summary.headline}
                            path={["summary", "headline"]}
                            inputType="textarea"
                            onSave={saveField}
                        />
                    </SectionCard>

                    {/* Bio */}
                    <SectionCard title="Bio">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            <InlineField label="Age" field={c.bio.age} path={["bio", "age"]} inputType="number" onSave={saveField} horizontal />
                            <InlineField label="Gender" field={c.bio.gender} path={["bio", "gender"]} onSave={saveField} horizontal />
                            <InlineField label="Ethnicity" field={c.bio.ethnicity} path={["bio", "ethnicity"]} onSave={saveField} horizontal />
                            <InlineField label="Religion" field={c.bio.religion} path={["bio", "religion"]} onSave={saveField} horizontal />
                            <InlineField label="Home language" field={c.bio.homeLanguage} path={["bio", "homeLanguage"]} onSave={saveField} horizontal />
                            <InlineField label="Preferred language" field={c.bio.preferredLanguage} path={["bio", "preferredLanguage"]} onSave={saveField} horizontal />
                            <InlineField label="Literacy" field={c.bio.literacy} path={["bio", "literacy"]} onSave={saveField} horizontal />
                        </div>
                    </SectionCard>

                    {/* Context & environment */}
                    <SectionCard title="Context & environment">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            <InlineField label="Neighbourhood" field={c.contextAndEnvironment.neighbourhood} path={["contextAndEnvironment", "neighbourhood"]} onSave={saveField} horizontal />
                            <InlineField label="Housing" field={c.contextAndEnvironment.housing} path={["contextAndEnvironment", "housing"]} onSave={saveField} horizontal />
                            <InlineField label="Income" field={c.contextAndEnvironment.income} path={["contextAndEnvironment", "income"]} onSave={saveField} horizontal />
                            <InlineField label="Commute" field={c.contextAndEnvironment.commute} path={["contextAndEnvironment", "commute"]} onSave={saveField} horizontal />
                            <InlineField label="Food access" field={c.contextAndEnvironment.foodAccess} path={["contextAndEnvironment", "foodAccess"]} onSave={saveField} horizontal />
                            {(c.contextAndEnvironment.other || []).map((entry, i) => (
                                <InlineField
                                    key={i}
                                    label={entry.key}
                                    field={entry.field}
                                    path={["contextAndEnvironment", "other", String(i), "field"]}
                                    onSave={saveField}
                                    horizontal
                                />
                            ))}
                        </div>
                    </SectionCard>

                    {/* Core behaviour */}
                    <SectionCard title="Core behaviour pattern">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InlineField label="Weekday pattern" field={c.coreBehaviourPattern.weekdayPattern} path={["coreBehaviourPattern", "weekdayPattern"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Weekend pattern" field={c.coreBehaviourPattern.weekendPattern} path={["coreBehaviourPattern", "weekendPattern"]} inputType="textarea" onSave={saveField} />
                        </div>
                    </SectionCard>

                    {/* Goals & concerns */}
                    <SectionCard title="Goals & concerns">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InlineField label="Goal" field={c.goalsAndConcerns.goal} path={["goalsAndConcerns", "goal"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Fear" field={c.goalsAndConcerns.fear} path={["goalsAndConcerns", "fear"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Mental state" field={c.goalsAndConcerns.mentalState} path={["goalsAndConcerns", "mentalState"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Perceived risk" field={c.goalsAndConcerns.perceivedRisk} path={["goalsAndConcerns", "perceivedRisk"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Primary source" field={c.goalsAndConcerns.primarySource} path={["goalsAndConcerns", "primarySource"]} onSave={saveField} />
                        </div>
                    </SectionCard>

                    {/* Daily lifestyle */}
                    <SectionCard title="Daily lifestyle">
                        {c.dailyLifestyle.dimensions.length === 0 ? (
                            <p className="text-caption text-muted-foreground italic">No lifestyle dimensions captured.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {c.dailyLifestyle.dimensions.map((d, i) => (
                                    <InlineField
                                        key={i}
                                        label={d.name}
                                        field={d.description}
                                        path={["dailyLifestyle", "dimensions", String(i), "description"]}
                                        inputType="textarea"
                                        onSave={saveField}
                                    />
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    {/* Programmes & touchpoints */}
                    <SectionCard title="Programmes & touchpoints">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InlineField label="App usage" field={c.programmesAndTouchpoints.appUsage} path={["programmesAndTouchpoints", "appUsage"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Event history" field={c.programmesAndTouchpoints.eventHistory} path={["programmesAndTouchpoints", "eventHistory"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Preferred format" field={c.programmesAndTouchpoints.preferredFormat} path={["programmesAndTouchpoints", "preferredFormat"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Depth & tone" field={c.programmesAndTouchpoints.depthAndTone} path={["programmesAndTouchpoints", "depthAndTone"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Channels" field={c.programmesAndTouchpoints.channels} path={["programmesAndTouchpoints", "channels"]} onSave={saveField} />
                        </div>
                    </SectionCard>

                    {/* Pain points & language */}
                    <SectionCard title="Pain points & language">
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Pain points</p>
                                    <ProvenancePill provenance={c.painPointsAndLanguage.painPoints.provenance} />
                                </div>
                                {(c.painPointsAndLanguage.painPoints.value && c.painPointsAndLanguage.painPoints.value.length > 0) ? (
                                    <ul className="space-y-1">
                                        {c.painPointsAndLanguage.painPoints.value.map((p, i) => (
                                            <li key={i} className="text-body-sm text-foreground flex items-start gap-2">
                                                <span className="h-1 w-1 rounded-full bg-muted-foreground/50 mt-2 shrink-0" />
                                                <span>{p}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-caption text-muted-foreground italic">No pain points captured.</p>
                                )}
                            </div>
                            <InlineField label="Objection" field={c.painPointsAndLanguage.objection} path={["painPointsAndLanguage", "objection"]} inputType="textarea" onSave={saveField} />
                            <InlineField label="Voice quote" field={c.painPointsAndLanguage.voiceQuote} path={["painPointsAndLanguage", "voiceQuote"]} inputType="textarea" onSave={saveField} />
                        </div>
                    </SectionCard>

                    {/* Verbatims */}
                    <SectionCard title="Verbatims" action={(
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                const next: EvidenceQuote[] = [
                                    ...c.verbatims,
                                    { text: "New quote — click to edit", transcriptId: "", transcriptName: "" },
                                ];
                                saveVerbatims(next);
                            }}
                        >
                            <Plus className="h-3.5 w-3.5" /> Add quote
                        </Button>
                    )}>
                        {c.verbatims.length === 0 ? (
                            <p className="text-caption text-muted-foreground italic">No verbatims captured.</p>
                        ) : (
                            <ul className="space-y-3">
                                {c.verbatims.map((v, i) => (
                                    <VerbatimRow
                                        key={i}
                                        verbatim={v}
                                        onChange={(updated) => {
                                            const next = [...c.verbatims];
                                            next[i] = updated;
                                            saveVerbatims(next);
                                        }}
                                        onDelete={() => {
                                            const next = c.verbatims.filter((_, idx) => idx !== i);
                                            saveVerbatims(next);
                                        }}
                                    />
                                ))}
                            </ul>
                        )}
                    </SectionCard>

                    {/* Source transcripts — transparency for HPB-style "based on real
                        users" provenance. Lists the interviewees that contributed to
                        this persona, with the AI's confidence + 1-line rationale for
                        archetype-mode personas. */}
                    {persona.contributingTranscripts.length > 0 && (
                        <SectionCard
                            title={`Source transcripts (${persona.contributingTranscripts.length})`}
                            subtitle="Real interviewees whose words shaped this persona."
                        >
                            <ul className="space-y-2">
                                {persona.contributingTranscripts.map(t => {
                                    const cl = session?.classifications.find(c => c.transcript.id === t.id);
                                    return (
                                        <li key={t.id} className="flex items-start gap-3 p-3 rounded-[10px] bg-[color:var(--surface-muted)] shadow-inset-edge">
                                            <div className="h-7 w-7 rounded-[8px] bg-[color:var(--surface)] text-muted-foreground shadow-inset-edge flex items-center justify-center shrink-0">
                                                <UserCircle2 className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-body-sm font-medium text-foreground truncate">{t.displayName}</p>
                                                    {cl?.userOverridden && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[color:var(--primary-soft)] text-[color:var(--primary)]">
                                                            Manually assigned
                                                        </span>
                                                    )}
                                                    {cl && !cl.userOverridden && cl.confidence > 0 && (
                                                        <span
                                                            className="text-[10px] text-muted-foreground tabular-nums"
                                                            title={`AI confidence: ${Math.round(cl.confidence * 100)}%`}
                                                        >
                                                            {Math.round(cl.confidence * 100)}% match
                                                        </span>
                                                    )}
                                                </div>
                                                {cl?.rationale && (
                                                    <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">{cl.rationale}</p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </SectionCard>
                    )}

                    {/* Unclassified sidebar (inline at bottom) */}
                    {session && unclassified.length > 0 && (
                        <SectionCard
                            title={`Unclassified transcripts (${unclassified.length})`}
                            subtitle="Transcripts the AI couldn't confidently fit into any archetype. Move them manually if any belong here."
                            action={(
                                <Button size="sm" variant="ghost" onClick={() => setShowUnclassified(s => !s)}>
                                    {showUnclassified ? "Hide" : "Show"}
                                </Button>
                            )}
                        >
                            {showUnclassified && (
                                <ul className="space-y-2">
                                    {unclassified.map(cl => (
                                        <li key={cl.id} className="flex items-start gap-3 p-3 rounded-[10px] bg-[color:var(--surface-muted)] shadow-inset-edge">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-body-sm font-medium text-foreground">{cl.transcript.displayName}</p>
                                                {cl.rationale && <p className="text-caption text-muted-foreground mt-0.5 line-clamp-2">{cl.rationale}</p>}
                                            </div>
                                            <select
                                                value={cl.archetypeId || ""}
                                                onChange={(e) => moveTranscript(cl.id, e.target.value || null)}
                                                className="text-caption bg-[color:var(--surface)] shadow-inset-edge rounded-[8px] px-2 py-1 focus:outline-none focus:shadow-outline-ring"
                                            >
                                                <option value="">Unclassified</option>
                                                {(session.archetypeSession?.archetypes || []).map(a => (
                                                    <option key={a.id} value={a.id}>{a.name}</option>
                                                ))}
                                            </select>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </SectionCard>
                    )}

                </div>
            </WorkspaceFrame>
        </div>
    );
}

// --- Helpers ---

function SectionCard({
    title,
    subtitle,
    action,
    children,
}: {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                    <h3 className="text-display-5 text-foreground leading-tight">{title}</h3>
                    {subtitle && <p className="text-caption text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

function VerbatimRow({
    verbatim,
    onChange,
    onDelete,
}: {
    verbatim: EvidenceQuote;
    onChange: (v: EvidenceQuote) => void;
    onDelete: () => void;
}) {
    const [editing, setEditing] = useState(false);
    const [draftText, setDraftText] = useState(verbatim.text);
    const [draftName, setDraftName] = useState(verbatim.transcriptName || "");

    return (
        <li className="flex items-start gap-3 p-3 rounded-[10px] bg-[color:var(--surface-muted)] shadow-inset-edge group">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
                {editing ? (
                    <div className="space-y-2">
                        <textarea
                            value={draftText}
                            onChange={(e) => setDraftText(e.target.value)}
                            autoFocus
                            rows={2}
                            className="w-full text-body-sm text-foreground bg-[color:var(--surface)] shadow-inset-edge rounded-[8px] px-2.5 py-1.5 focus:outline-none focus:shadow-outline-ring italic"
                        />
                        <input
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            placeholder="Attribution (interviewee display name)"
                            className="w-full text-caption text-muted-foreground bg-[color:var(--surface)] shadow-inset-edge rounded-[8px] px-2.5 py-1 focus:outline-none focus:shadow-outline-ring"
                        />
                        <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                            <Button
                                size="sm"
                                onClick={() => {
                                    onChange({ ...verbatim, text: draftText, transcriptName: draftName || undefined });
                                    setEditing(false);
                                }}
                            >Save</Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <p className="text-body-sm text-foreground italic leading-relaxed">&ldquo;{verbatim.text}&rdquo;</p>
                        {verbatim.transcriptName && <p className="text-caption text-muted-foreground mt-1">— {verbatim.transcriptName}</p>}
                    </>
                )}
            </div>
            {!editing && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => { setDraftText(verbatim.text); setDraftName(verbatim.transcriptName || ""); setEditing(true); }}
                        className="h-6 w-6 rounded-[6px] flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface)]"
                        aria-label="Edit"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="h-6 w-6 rounded-[6px] flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive"
                        aria-label="Delete"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}
        </li>
    );
}
// Created by Swapnil Bapat © 2026
