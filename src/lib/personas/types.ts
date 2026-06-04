/**
 * Shared types for the SyntheticPersona pipeline.
 * Mirrors the JSON shape produced by the synthesis prompt and stored in
 * SyntheticPersona.contentJson. The provenance system makes it easy to
 * render stated/inferred/assumed/not_in_data/user_set badges per field.
 */

export type Provenance = "stated" | "inferred" | "assumed" | "not_in_data" | "user_set";

export interface EvidenceQuote {
    text: string;
    transcriptId: string;
    transcriptName?: string;
}

export interface PersonaField<T = string> {
    value: T | null;
    provenance: Provenance;
    evidenceQuotes?: EvidenceQuote[];
    confidence?: number;
}

export interface LifestyleDimension {
    name: string;
    description: PersonaField<string>;
}

export interface PersonaContextOther {
    key: string;
    field: PersonaField<string>;
}

export interface PersonaContent {
    summary: {
        name: PersonaField<string>;
        kicker: PersonaField<string>;
        headline: PersonaField<string>;
    };
    bio: {
        age: PersonaField<number>;
        gender: PersonaField<string>;
        ethnicity: PersonaField<string>;
        religion: PersonaField<string>;
        homeLanguage: PersonaField<string>;
        preferredLanguage: PersonaField<string>;
        literacy: PersonaField<string>;
    };
    contextAndEnvironment: {
        neighbourhood: PersonaField<string>;
        housing: PersonaField<string>;
        income: PersonaField<string>;
        commute: PersonaField<string>;
        foodAccess: PersonaField<string>;
        other?: PersonaContextOther[];
    };
    coreBehaviourPattern: {
        weekdayPattern: PersonaField<string>;
        weekendPattern: PersonaField<string>;
    };
    goalsAndConcerns: {
        goal: PersonaField<string>;
        fear: PersonaField<string>;
        mentalState: PersonaField<string>;
        perceivedRisk: PersonaField<string>;
        primarySource: PersonaField<string>;
    };
    dailyLifestyle: {
        dimensions: LifestyleDimension[];
    };
    programmesAndTouchpoints: {
        appUsage: PersonaField<string>;
        eventHistory: PersonaField<string>;
        preferredFormat: PersonaField<string>;
        depthAndTone: PersonaField<string>;
        channels: PersonaField<string>;
    };
    painPointsAndLanguage: {
        painPoints: PersonaField<string[]>;
        objection: PersonaField<string>;
        voiceQuote: PersonaField<string>;
    };
    verbatims: EvidenceQuote[];
}

/** A minimal fallback PersonaContent used when AI synthesis fails or no
 *  transcripts are classified — every field is not_in_data. */
export function emptyPersonaContent(name: string): PersonaContent {
    const empty = <T>(): PersonaField<T> => ({ value: null as T | null, provenance: "not_in_data", evidenceQuotes: [] });
    return {
        summary: {
            name: { value: name, provenance: "stated", evidenceQuotes: [] },
            kicker: empty<string>(),
            headline: empty<string>(),
        },
        bio: {
            age: empty<number>(),
            gender: empty<string>(),
            ethnicity: empty<string>(),
            religion: empty<string>(),
            homeLanguage: empty<string>(),
            preferredLanguage: empty<string>(),
            literacy: empty<string>(),
        },
        contextAndEnvironment: {
            neighbourhood: empty<string>(),
            housing: empty<string>(),
            income: empty<string>(),
            commute: empty<string>(),
            foodAccess: empty<string>(),
            other: [],
        },
        coreBehaviourPattern: {
            weekdayPattern: empty<string>(),
            weekendPattern: empty<string>(),
        },
        goalsAndConcerns: {
            goal: empty<string>(),
            fear: empty<string>(),
            mentalState: empty<string>(),
            perceivedRisk: empty<string>(),
            primarySource: empty<string>(),
        },
        dailyLifestyle: { dimensions: [] },
        programmesAndTouchpoints: {
            appUsage: empty<string>(),
            eventHistory: empty<string>(),
            preferredFormat: empty<string>(),
            depthAndTone: empty<string>(),
            channels: empty<string>(),
        },
        painPointsAndLanguage: {
            painPoints: empty<string[]>(),
            objection: empty<string>(),
            voiceQuote: empty<string>(),
        },
        verbatims: [],
    };
}

/** Coerce arbitrary AI JSON into PersonaContent. Best-effort — silently
 *  fills any missing field with a not_in_data placeholder so the renderer
 *  never crashes on malformed output. */
export function coercePersonaContent(raw: unknown, fallbackName: string): PersonaContent {
    const base = emptyPersonaContent(fallbackName);
    if (!raw || typeof raw !== "object") return base;
    // Shallow-merge: trust the model when keys exist, fall back when they don't.
    const r = raw as Record<string, unknown>;

    const fieldOrEmpty = <T>(v: unknown, empty: PersonaField<T>): PersonaField<T> => {
        if (!v || typeof v !== "object") return empty;
        const f = v as Record<string, unknown>;
        const provenance: Provenance =
            f.provenance === "stated" ||
            f.provenance === "inferred" ||
            f.provenance === "assumed" ||
            f.provenance === "user_set"
                ? (f.provenance as Provenance)
                : "not_in_data";
        return {
            value: (f.value as T | null) ?? null,
            provenance,
            evidenceQuotes: Array.isArray(f.evidenceQuotes)
                ? (f.evidenceQuotes as EvidenceQuote[]).filter(q => q && typeof q.text === "string")
                : [],
            confidence: typeof f.confidence === "number" ? f.confidence : undefined,
        };
    };

    const mergeSection = <S extends Record<string, PersonaField<unknown>>>(
        raw: unknown,
        section: S,
    ): S => {
        if (!raw || typeof raw !== "object") return section;
        const r = raw as Record<string, unknown>;
        const out = { ...section };
        for (const k of Object.keys(section)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (out as any)[k] = fieldOrEmpty(r[k], (section as Record<string, PersonaField<unknown>>)[k]);
        }
        return out;
    };

    base.summary = mergeSection(r.summary, base.summary);
    base.bio = mergeSection(r.bio, base.bio);
    base.coreBehaviourPattern = mergeSection(r.coreBehaviourPattern, base.coreBehaviourPattern);
    base.goalsAndConcerns = mergeSection(r.goalsAndConcerns, base.goalsAndConcerns);
    base.programmesAndTouchpoints = mergeSection(r.programmesAndTouchpoints, base.programmesAndTouchpoints);

    // Context: merge the PersonaField leaves directly (mergeSection's generic
    // can't accept the `other?: ContextOther[]` shape), then handle `other[]`.
    if (r.contextAndEnvironment && typeof r.contextAndEnvironment === "object") {
        const c = r.contextAndEnvironment as Record<string, unknown>;
        const ctx = base.contextAndEnvironment;
        ctx.neighbourhood = fieldOrEmpty<string>(c.neighbourhood, ctx.neighbourhood);
        ctx.housing = fieldOrEmpty<string>(c.housing, ctx.housing);
        ctx.income = fieldOrEmpty<string>(c.income, ctx.income);
        ctx.commute = fieldOrEmpty<string>(c.commute, ctx.commute);
        ctx.foodAccess = fieldOrEmpty<string>(c.foodAccess, ctx.foodAccess);
        if (Array.isArray(c.other)) {
            base.contextAndEnvironment.other = c.other
                .filter(o => o && typeof o === "object")
                .map(o => {
                    const obj = o as Record<string, unknown>;
                    return {
                        key: typeof obj.key === "string" ? obj.key : "Other",
                        field: fieldOrEmpty<string>(obj.field, { value: null, provenance: "not_in_data", evidenceQuotes: [] }),
                    };
                });
        }
    }

    // Daily lifestyle dimensions
    if (r.dailyLifestyle && typeof r.dailyLifestyle === "object") {
        const dl = r.dailyLifestyle as Record<string, unknown>;
        if (Array.isArray(dl.dimensions)) {
            base.dailyLifestyle.dimensions = dl.dimensions
                .filter(d => d && typeof d === "object")
                .map(d => {
                    const obj = d as Record<string, unknown>;
                    return {
                        name: typeof obj.name === "string" ? obj.name : "Dimension",
                        description: fieldOrEmpty<string>(obj.description, { value: null, provenance: "not_in_data", evidenceQuotes: [] }),
                    };
                });
        }
    }

    // Pain points (painPoints.value is an array, not a string)
    if (r.painPointsAndLanguage && typeof r.painPointsAndLanguage === "object") {
        const pp = r.painPointsAndLanguage as Record<string, unknown>;
        base.painPointsAndLanguage.painPoints = fieldOrEmpty<string[]>(pp.painPoints, base.painPointsAndLanguage.painPoints);
        base.painPointsAndLanguage.objection = fieldOrEmpty<string>(pp.objection, base.painPointsAndLanguage.objection);
        base.painPointsAndLanguage.voiceQuote = fieldOrEmpty<string>(pp.voiceQuote, base.painPointsAndLanguage.voiceQuote);
    }

    // Verbatims
    if (Array.isArray(r.verbatims)) {
        base.verbatims = (r.verbatims as unknown[])
            .filter(v => v && typeof v === "object")
            .map(v => {
                const obj = v as Record<string, unknown>;
                return {
                    text: typeof obj.text === "string" ? obj.text : "",
                    transcriptId: typeof obj.transcriptId === "string" ? obj.transcriptId : "",
                    transcriptName: typeof obj.transcriptName === "string" ? obj.transcriptName : undefined,
                };
            })
            .filter(v => v.text.length > 0);
    }

    return base;
}

export interface PersonaStaleness {
    isStale: boolean;
    reason?: string;
    newTranscriptIds?: string[];
    archetypeUpdatedAt?: string;
}
// Created by Swapnil Bapat © 2026
