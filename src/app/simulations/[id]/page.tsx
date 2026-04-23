"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Loader2,
    User,
    Users,
    Bot,
    CheckCircle2,
    RefreshCw,
    AlertTriangle,
    ThumbsUp,
    Lightbulb,
    MessageCircle,
    Send,
    FileText,
    Handshake,
    Zap,
    CircleDot,
    Quote,
    ChevronDown,
    Tag,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AIFeedback } from "@/components/ai/feedback";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "persona";
    content: string;
    timestamp: string;
    archetypeId?: string | null;
    imageBase64?: string | null;
}

interface Highlight {
    turn: number;
    observation: string;
    quote: string;
}

interface LeadingMoment {
    turn: number;
    issue: string;
    quote: string;
    suggestion: string;
}

interface MissedProbe {
    turn: number;
    opportunity: string;
    suggestion: string;
    quote?: string;
}

interface CoachFindings {
    overallScore: number;
    summary: string;
    highlights: Highlight[];
    leadingMoments: LeadingMoment[];
    missedProbes: MissedProbe[];
    betterQuestions: Array<{ original: string; improved: string; rationale: string }>;
}

interface OpportunityInsight {
    quote: string;
    surfacedContext: string;
    testableAssumption: string | null;
    explorationDirection: string | null;
}

interface LiveCoachNudge {
    id: string;
    timestamp: string;
    messageId: string;
    opportunities: OpportunityInsight[];
    coachingNudge: string | null;
    highlightQuote: string | null;
    suggestedGuideQuestion: {
        questionId: string;
        questionText: string;
        reason: string;
    } | null;
    missedOpportunity: boolean;
}

interface Simulation {
    id: string;
    mode: string;
    startedAt: string;
    endedAt: string | null;
    messages: Message[];
    subProject: {
        id: string;
        name: string;
        projectId: string;
        project?: { name: string };
    } | null;
    project: {
        id: string;
        name: string;
    } | null;
    personaDoc: {
        id: string;
        title: string;
        parsedMetaJson: string | null;
    } | null;
    projectPersonaDoc: {
        id: string;
        title: string;
        parsedMetaJson: string | null;
    } | null;
    coachReview: {
        id: string;
        findingsJson: string | null;
    } | null;
    coachFindings: CoachFindings | null;
    coachNudges: LiveCoachNudge[];
    isFocusGroup: boolean;
    crossProfileSummary?: string | null;
    simulationArchetypes: Array<{
        archetype: { id: string; name: string; kicker?: string | null };
        order: number;
        summary?: string | null;
    }>;
    archetype?: { id: string; name: string; kicker?: string | null } | null;
}

interface CoachChatMessage {
    role: "user" | "coach";
    content: string;
}

interface PageProps {
    params: Promise<{ id: string }>;
}

function parsePersonaName(personaDoc: { parsedMetaJson: string | null } | null, fallbackTitle?: string): string {
    if (!personaDoc?.parsedMetaJson) return fallbackTitle || "Persona";
    try {
        const parsed = JSON.parse(personaDoc.parsedMetaJson);
        return parsed.name || fallbackTitle || "Persona";
    } catch {
        return fallbackTitle || "Persona";
    }
}

// Persona accent palette — drives avatar bars, chips, dots across the review page.
// Colour choices taken from session-review-v2.jsx PERSONAS array.
const PERSONA_PALETTE = [
    { accent: "#7c3aed", accentSoft: "rgba(124, 58, 237, 0.08)" },
    { accent: "#0891b2", accentSoft: "rgba(8, 145, 178, 0.08)" },
    { accent: "#b45309", accentSoft: "rgba(180, 83, 9, 0.08)" },
    { accent: "#db2777", accentSoft: "rgba(219, 39, 119, 0.08)" },
    { accent: "#059669", accentSoft: "rgba(5, 150, 105, 0.08)" },
    { accent: "#4f46e5", accentSoft: "rgba(79, 70, 229, 0.08)" },
];

// Legacy archetype colour map retained for highlight tooltips / misc.
const ARCHETYPE_COLORS = [
    { bg: "bg-violet-50/50", border: "border-violet-100", text: "text-violet-800", avatar: "bg-violet-200/70", avatarText: "text-violet-900" },
    { bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-800", avatar: "bg-amber-200/70", avatarText: "text-amber-900" },
    { bg: "bg-sky-50/50", border: "border-sky-100", text: "text-sky-800", avatar: "bg-sky-200/70", avatarText: "text-sky-900" },
    { bg: "bg-rose-50/50", border: "border-rose-100", text: "text-rose-800", avatar: "bg-rose-200/70", avatarText: "text-rose-900" },
    { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-800", avatar: "bg-emerald-200/70", avatarText: "text-emerald-900" },
];

function getInitial(name: string): string {
    const words = name.trim().split(/\s+/);
    const meaningful = words.length > 1 && words[0].toLowerCase() === "the" ? words[1] : words[0];
    return meaningful.charAt(0).toUpperCase();
}

function formatDuration(start: string, end: string | null): string | null {
    if (!end) return null;
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (!Number.isFinite(ms) || ms <= 0) return null;
    const mins = Math.max(1, Math.round(ms / 60000));
    return `${mins} min`;
}

function formatRecorded(iso: string): string {
    try {
        const d = new Date(iso);
        return d.toLocaleString(undefined, {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return iso;
    }
}

export default function ViewSessionPage({ params }: PageProps) {
    const { id } = use(params);
    const [simulation, setSimulation] = useState<Simulation | null>(null);
    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Coach chat dialog state
    const [coachChatOpen, setCoachChatOpen] = useState(false);
    const [coachChatFeedback, setCoachChatFeedback] = useState<{
        key: string;
        type: "highlight" | "leading" | "missed";
        content: { quote?: string; observation?: string; issue?: string; opportunity?: string; suggestion?: string };
    } | null>(null);
    const [coachChatMessages, setCoachChatMessages] = useState<CoachChatMessage[]>([]);
    const [coachChatInput, setCoachChatInput] = useState("");
    const [coachChatLoading, setCoachChatLoading] = useState(false);
    const coachChatEndRef = useRef<HTMLDivElement>(null);
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

    // Collapsible transcript state (keyed by block id; -1 means none open)
    const [openTranscriptIdx, setOpenTranscriptIdx] = useState<number>(0);
    useEffect(() => {
        fetchSimulation();
    }, [id]);

    useEffect(() => {
        coachChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [coachChatMessages]);

    const fetchSimulation = async () => {
        try {
            const res = await fetch(`/api/simulations/${id}?t=${Date.now()}`, { cache: 'no-store' });
            const json = await res.json();
            if (json.success) {
                const simData = json.data;

                // If focus group and ended, check if summaries are missing
                if (simData.isFocusGroup && simData.endedAt && (simData.simulationArchetypes.some((sa: any) => !sa.summary) || !simData.crossProfileSummary)) {
                    // Trigger summary generation gracefully in the background
                    fetch(`/api/gemini/archetype-summary`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ simulationId: id })
                    })
                        .then(r => r.json())
                        .then(summaryJson => {
                            if (summaryJson.success) {
                                // Re-fetch to get updated summaries
                                fetch(`/api/simulations/${id}?t=${Date.now()}`, { cache: 'no-store' })
                                    .then(r => r.json())
                                    .then(newJson => {
                                        if (newJson.success) setSimulation(newJson.data);
                                    });
                            }
                        })
                        .catch(e => console.error("Failed to generate archetype summaries:", e));
                }

                setSimulation(simData);
            }
        } catch (error) {
            console.error("Failed to fetch simulation:", error);
        } finally {
            setLoading(false);
        }
    };

    const regenerateReview = async () => {
        if (!simulation) return;
        setRegenerating(true);
        try {
            const promises = [
                fetch("/api/gemini/review", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ simulationId: simulation.id }),
                })
            ];

            if (simulation.isFocusGroup) {
                promises.push(
                    fetch("/api/gemini/archetype-summary", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ simulationId: simulation.id, force: true }),
                    })
                );
            }

            const results = await Promise.all(promises);
            const reviewJson = await results[0].json();

            // For focus groups, check results[1] (archetype summary API) as well if it exists
            let summarySuccess = false;
            if (promises.length > 1) {
                const summaryJson = await results[1].json();
                summarySuccess = summaryJson.success;
            }

            if (reviewJson.success || summarySuccess) {
                await fetchSimulation();
            }
        } catch (error) {
            console.error("Failed to regenerate review:", error);
        } finally {
            setRegenerating(false);
        }
    };

    const openCoachChat = (feedbackKey: string, feedbackType: "highlight" | "leading" | "missed", content: any) => {
        setCoachChatFeedback({ key: feedbackKey, type: feedbackType, content });
        setCoachChatMessages([]);
        setCoachChatInput("");
        setCoachChatOpen(true);

        // Load existing conversation if any
        loadCoachConversation(feedbackKey);
    };

    const loadCoachConversation = async (feedbackKey: string) => {
        try {
            const res = await fetch(`/api/gemini/coach-chat?simulationId=${id}&feedbackKey=${feedbackKey}`);
            const json = await res.json();
            if (json.success && json.data.conversation) {
                setCoachChatMessages(json.data.conversation.messages.map((m: any) => ({
                    role: m.role,
                    content: m.content
                })));
            }
        } catch (error) {
            console.error("Failed to load coach conversation:", error);
        }
    };

    const sendCoachMessage = async () => {
        if (!coachChatInput.trim() || !coachChatFeedback || !simulation) return;

        const userMessage = coachChatInput.trim();
        setCoachChatInput("");
        setCoachChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
        setCoachChatLoading(true);

        try {
            const res = await fetch("/api/gemini/coach-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    simulationId: simulation.id,
                    feedbackKey: coachChatFeedback.key,
                    feedbackType: coachChatFeedback.type,
                    feedback: coachChatFeedback.content,
                    message: userMessage
                }),
            });
            const json = await res.json();
            console.log("[Coach Chat] Response:", json);
            if (json.success && json.data?.message?.content) {
                setCoachChatMessages(prev => [...prev, { role: "coach", content: json.data.message.content }]);
            } else {
                console.error("[Coach Chat] Failed response:", json);
                // Check for rate limit error
                const errorMsg = json.error || "";
                if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("rate limit")) {
                    setCoachChatMessages(prev => [...prev, { role: "coach", content: "I'm currently busy helping others. Please try again in a minute." }]);
                } else {
                    setCoachChatMessages(prev => [...prev, { role: "coach", content: "Sorry, I couldn't process that. Please try again." }]);
                }
            }
        } catch (error) {
            console.error("Failed to send coach message:", error);
            setCoachChatMessages(prev => [...prev, { role: "coach", content: "Connection error. Please try again." }]);
        } finally {
            setCoachChatLoading(false);
        }
    };

    // Helper to find coaching feedback for a specific message
    const getFeedbackForMessage = (messageIndex: number, role: "user" | "persona", messageId: string, msgContent: string): {
        highlights: Highlight[];
        leadingMoments: LeadingMoment[];
        missedProbes: MissedProbe[];
    } => {
        // Highlights and Leading Moments come from the REVIEW (coachFindings)
        const findings = simulation?.coachFindings;
        const turn = messageIndex + 1;

        const highlights = findings?.highlights?.filter(h => h.turn === turn) || [];
        const leadingMoments = findings?.leadingMoments?.filter(l => l.turn === turn) || [];

        // Missed Probes now come from LIVE COACH NUDGES (coachNudges)
        // We search for nudges associated with this specific message ID, OR if the quote matches this message's content (for focus groups)
        let missedProbes: MissedProbe[] = [];

        if (simulation?.coachNudges) {
            const matchingNudges = simulation.coachNudges.filter(n => {
                if (n.messageId === messageId) return true;
                if (n.opportunities && n.opportunities.length > 0) {
                    return n.opportunities.some(op => op.quote && msgContent.toLowerCase().includes(op.quote.toLowerCase()));
                }
                return false;
            });

            matchingNudges.forEach(nudge => {
                if (nudge.opportunities && nudge.opportunities.length > 0) {
                    nudge.opportunities.forEach(op => {
                        // Only include the quote if it actually appears in this message's content
                        if (op.quote && msgContent.toLowerCase().includes(op.quote.toLowerCase())) {
                            // Check to avoid duplicates
                            if (!missedProbes.some(m => m.quote === op.quote)) {
                                missedProbes.push({
                                    turn: turn,
                                    opportunity: op.surfacedContext,
                                    quote: op.quote,
                                    suggestion: op.explorationDirection || "Dig deeper into this.",
                                });
                            }
                        }
                    });
                }
            });
        }

        return {
            highlights,
            leadingMoments,
            missedProbes,
        };
    };

    // Render message content with highlighted quotes
    const renderContentWithHighlights = (
        content: string,
        quotes: Array<{ quote: string; type: "highlight" | "leading" | "missed"; tooltip: string; suggestion?: string; feedbackKey: string; feedbackContent: any }>,
        isUserMessage: boolean = false
    ) => {
        if (quotes.length === 0) return content;

        let parts: Array<{ text: string; isHighlight: boolean; type?: string; tooltip?: string; suggestion?: string; feedbackKey?: string; feedbackContent?: any }> = [
            { text: content, isHighlight: false }
        ];

        quotes.forEach(({ quote, type, tooltip, suggestion, feedbackKey, feedbackContent }) => {
            if (!quote) return;

            const newParts: typeof parts = [];
            parts.forEach((part) => {
                if (!part.isHighlight && part.text) {
                    const lowerPart = part.text.toLowerCase();
                    const lowerQuote = quote.toLowerCase();
                    const index = lowerPart.indexOf(lowerQuote);

                    if (index !== -1) {
                        const before = part.text.slice(0, index);
                        const match = part.text.slice(index, index + quote.length);
                        const after = part.text.slice(index + quote.length);

                        if (before) newParts.push({ text: before, isHighlight: false });
                        newParts.push({ text: match, isHighlight: true, type, tooltip, suggestion, feedbackKey, feedbackContent });
                        if (after) newParts.push({ text: after, isHighlight: false });
                    } else {
                        newParts.push(part);
                    }
                } else {
                    newParts.push(part);
                }
            });
            parts = newParts;
        });

        return parts.map((part, idx) => {
            if (part.isHighlight) {
                const highlightStyle = isUserMessage
                    ? part.type === "highlight"
                        ? "bg-accent border-b-2 border-primary text-foreground"
                        : part.type === "leading"
                            ? "bg-amber-200/80 border-b-2 border-amber-500 text-amber-900"
                            : "bg-purple-200/80 border-b-2 border-purple-500 text-purple-900"
                    : part.type === "highlight"
                        ? "bg-muted border-b-2 border-primary text-foreground"
                        : part.type === "leading"
                            ? "bg-amber-100 border-b-2 border-amber-400 text-amber-900"
                            : "bg-purple-100 border-b-2 border-purple-400 text-purple-900";

                const iconBg = part.type === "highlight"
                    ? "bg-muted text-foreground"
                    : part.type === "leading"
                        ? "bg-amber-50 text-amber-500"
                        : "bg-purple-50 text-purple-500";

                const labelColor = part.type === "highlight"
                    ? "text-foreground"
                    : part.type === "leading"
                        ? "text-amber-600"
                        : "text-purple-600";

                const labelText = part.type === "highlight"
                    ? "Good Technique"
                    : part.type === "leading"
                        ? "Needs Improvement"
                        : "Missed Opportunity";

                return (
                    <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                            <span className={`${highlightStyle} cursor-help px-0.5 rounded`}>
                                {part.text}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent
                            side="top"
                            className="p-0 bg-transparent border-none shadow-none max-w-sm"
                        >
                            <div className="relative p-4 rounded-md bg-background border border-border shadow-sm">
                                {/* Subtle accent line at top */}
                                <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full ${part.type === 'highlight' ? 'bg-primary/40' : part.type === 'leading' ? 'bg-amber-400/40' : 'bg-purple-400/40'}`} />

                                <div className="flex items-start gap-3">
                                    <div className={`h-7 w-7 rounded-md ${iconBg} flex items-center justify-center shrink-0`}>
                                        {part.type === "highlight" && <ThumbsUp className="h-3.5 w-3.5" />}
                                        {part.type === "leading" && <AlertTriangle className="h-3.5 w-3.5" />}
                                        {part.type === "missed" && <Lightbulb className="h-3.5 w-3.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className={`text-[9px] font-bold uppercase tracking-[0.15em] mb-1 ${labelColor}/80`}>
                                            {labelText}
                                        </p>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            {part.tooltip}
                                        </p>
                                        {part.suggestion && (
                                            <p className="text-[11px] text-muted-foreground mt-2 italic border-t border-border pt-2">
                                                💡 {part.suggestion}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {/* Ask Coach Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openCoachChat(part.feedbackKey!, part.type as "highlight" | "leading" | "missed", part.feedbackContent);
                                    }}
                                    className="w-full mt-3 pt-2.5 border-t border-border flex items-center justify-center gap-1.5 text-[11px] font-medium text-primary hover:text-foreground transition-colors"
                                >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                    Ask Coach About This
                                </button>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                );
            }
            return <span key={idx}>{part.text}</span>;
        });
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    if (!simulation) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Session Not Found</h1>
                    <p className="text-muted-foreground mb-6">The simulation session you're looking for doesn't exist.</p>
                    <Link href="/dashboard">
                        <Button className="bg-primary hover:bg-primary/90">
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const personaDoc = simulation.projectPersonaDoc || simulation.personaDoc;
    const personaName = parsePersonaName(personaDoc, personaDoc?.title);
    const isCompleted = !!simulation.endedAt;
    const hasReview = !!simulation.coachFindings;
    const isFocusGroup = simulation.isFocusGroup && simulation.simulationArchetypes?.length > 0;
    const focusGroupArchetypes = isFocusGroup
        ? simulation.simulationArchetypes.map((sa) => sa.archetype)
        : [];

    const getArchetypeColor = (archetypeId: string) => {
        const idx = focusGroupArchetypes.findIndex(a => a.id === archetypeId);
        return ARCHETYPE_COLORS[idx >= 0 ? idx % ARCHETYPE_COLORS.length : 0];
    };
    const overallScore = simulation.coachFindings?.overallScore;
    const summary = simulation.coachFindings?.summary;

    // Build breadcrumb info
    const projectName = simulation.subProject?.project?.name || simulation.project?.name || "Project";
    const subProjectName = simulation.subProject?.name;
    const projectId = simulation.subProject?.projectId || simulation.project?.id;
    const subProjectId = simulation.subProject?.id;

    // ---- Derived data for the v2 layout ----

    // Participants: for focus groups, use archetypes; otherwise, single persona synthesised from personaDoc.
    type Participant = {
        id: string;
        name: string;
        kicker?: string | null;
        accent: string;
        accentSoft: string;
        summary?: string | null;
    };
    const participants: Participant[] = isFocusGroup
        ? simulation.simulationArchetypes.map((sa, i) => {
            const pal = PERSONA_PALETTE[i % PERSONA_PALETTE.length];
            return {
                id: sa.archetype.id,
                name: sa.archetype.name,
                kicker: sa.archetype.kicker,
                accent: pal.accent,
                accentSoft: pal.accentSoft,
                summary: sa.summary,
            };
        })
        : [
            {
                id: simulation.archetype?.id || personaDoc?.id || "persona",
                name: personaName,
                kicker: simulation.archetype?.kicker || null,
                accent: PERSONA_PALETTE[0].accent,
                accentSoft: PERSONA_PALETTE[0].accentSoft,
                summary: null,
            },
        ];

    const participantById = (pid: string) => participants.find(p => p.id === pid);

    // Cross-profile structured summary (focus-group only)
    let cross: {
        agreements?: { point: string; profiles: string[] }[];
        tensions?: { point: string; between: string[] }[];
        gaps?: (string | { text: string; source: string })[];
        recommendedSteps?: { action: string; why: string }[];
    } | null = null;
    if (simulation.crossProfileSummary) {
        try { cross = JSON.parse(simulation.crossProfileSummary); } catch { cross = null; }
    }

    const agreementsCount = cross?.agreements?.length ?? 0;
    const tensionsCount = cross?.tensions?.length ?? 0;
    const gapsCount = cross?.gaps?.length ?? 0;
    const recommendedCount = cross?.recommendedSteps?.length ?? 0;
    const compareCount = agreementsCount + tensionsCount + gapsCount;

    // Opportunities count from live coach nudges
    const opportunitiesCount = simulation.coachNudges?.reduce((acc, n) => acc + (n.opportunities?.length || 0), 0) ?? 0;

    // Transcript blocks — group messages into Q/A blocks keyed by user question
    type TranscriptBlock = {
        question: string;
        answers: { msg: Message; participant?: Participant }[];
    };
    const transcriptBlocks: TranscriptBlock[] = (() => {
        const blocks: TranscriptBlock[] = [];
        let current: TranscriptBlock | null = null;
        simulation.messages.forEach((m) => {
            if (m.role === "user") {
                current = { question: m.content, answers: [] };
                blocks.push(current);
            } else if (current) {
                const participant = m.archetypeId ? participantById(m.archetypeId) : participants[0];
                current.answers.push({ msg: m, participant });
            } else {
                // Persona message before any user question — create a pseudo-block
                current = { question: "Opening", answers: [{ msg: m, participant: m.archetypeId ? participantById(m.archetypeId) : participants[0] }] };
                blocks.push(current);
            }
        });
        return blocks;
    })();

    const questionsCount = transcriptBlocks.length;

    const duration = formatDuration(simulation.startedAt, simulation.endedAt);

    // Hero subtitle — derived from coach findings summary (if present) or structured cross summary
    const heroSubtitle = summary
        ? summary
        : cross?.agreements && cross.agreements.length > 0
            ? cross.agreements[0].point
            : "Post-session review of the interview transcript and participant profiles.";

    const backHref = subProjectId && subProjectName
        ? `/projects/${projectId}/sub/${subProjectId}?tab=simulations`
        : (projectId ? `/projects/${projectId}` : "/dashboard");

    const crumbs = [
        ...(projectName ? [{ label: projectName, href: projectId ? `/projects/${projectId}` : undefined }] : []),
        ...(subProjectName && subProjectId && projectId
            ? [{ label: subProjectName, href: `/projects/${projectId}/sub/${subProjectId}?tab=simulations` }]
            : []),
        { label: isFocusGroup ? "Focus Group · Review" : `Session · ${personaName}` },
    ];

    const scrollToSection = (sectionId: string) => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // ---- Left rail ----
    const leftRail = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={isCompleted ? "success" : "warning"}
                        className="gap-1"
                    >
                        <CheckCircle2 className="h-3 w-3" />
                        {isCompleted ? "Complete" : "In progress"}
                    </Badge>
                    {duration && (
                        <span className="text-caption text-muted-foreground">· {duration}</span>
                    )}
                </div>
                <h2 className="text-display-4 text-foreground leading-tight">
                    {isFocusGroup ? "Focus Group" : personaName}
                </h2>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                    {isFocusGroup
                        ? `${participants.length} participants walked through the guide.`
                        : `1:1 session with ${personaName}.`}
                </p>
            </RailHeader>

            <RailSection title="Session">
                <MetaRow k="Questions" v={String(questionsCount)} />
                <MetaRow k="Participants" v={String(participants.length)} />
                <MetaRow k="Opportunities" v={String(opportunitiesCount)} />
                <MetaRow k="Recorded" v={formatRecorded(simulation.startedAt)} />
            </RailSection>

            <RailSection title="Participants">
                <div className="flex flex-col gap-2.5">
                    {participants.map((p) => (
                        <div key={p.id} className="flex items-center gap-2.5">
                            <div
                                className="w-7 h-7 rounded-full inline-flex items-center justify-center text-[11px] font-semibold text-white shrink-0 shadow-inset-edge"
                                style={{ backgroundColor: p.accent }}
                            >
                                {getInitial(p.name)}
                            </div>
                            <div className="min-w-0">
                                <div className="text-ui-sm text-foreground truncate">{p.name}</div>
                                {p.kicker && (
                                    <div className="text-caption text-muted-foreground truncate uppercase tracking-[0.05em]">
                                        {p.kicker}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </RailSection>

            <RailSection title="Jump to">
                <div className="flex flex-col gap-0.5">
                    <button
                        type="button"
                        onClick={() => scrollToSection("participant-summaries")}
                        className="flex items-center justify-between w-full text-left px-2.5 py-2 -ml-2.5 rounded-[var(--radius-sm2)] text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span>Participant summaries</span>
                        <span className="text-mono-meta text-muted-foreground">{participants.length}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("cross-profile-compare")}
                        className="flex items-center justify-between w-full text-left px-2.5 py-2 -ml-2.5 rounded-[var(--radius-sm2)] text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span>Cross-profile compare</span>
                        <span className="text-mono-meta text-muted-foreground">{compareCount}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("recommended-steps")}
                        className="flex items-center justify-between w-full text-left px-2.5 py-2 -ml-2.5 rounded-[var(--radius-sm2)] text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span>Recommended steps</span>
                        <span className="text-mono-meta text-muted-foreground">{recommendedCount}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollToSection("transcript")}
                        className="flex items-center justify-between w-full text-left px-2.5 py-2 -ml-2.5 rounded-[var(--radius-sm2)] text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span>Transcript</span>
                        <span className="text-mono-meta text-muted-foreground">{questionsCount}</span>
                    </button>
                </div>
            </RailSection>

            <div className="flex-1" />
        </>
    );

    // ---- PageBar action cluster ----
    const pageBarAction = (
        <>
            {summary && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSummaryDialogOpen(true)}
                    className="gap-1.5"
                >
                    <FileText className="h-3.5 w-3.5" />
                    View summary
                </Button>
            )}
            <Button
                variant="outline"
                size="sm"
                onClick={regenerateReview}
                disabled={regenerating}
                className="gap-1.5"
            >
                {regenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                )}
                {regenerating ? "Analysing..." : "Analyse technique"}
            </Button>
        </>
    );

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex flex-col flex-1 min-h-0">
                <PageBar
                    sticky={false}
                    back={{ href: backHref, label: "Back" }}
                    crumbs={crumbs}
                    action={pageBarAction}
                />

                <WorkspaceFrame variant="review" scrollContained leftRail={leftRail}>
                    {/* Hero headline */}
                    <div className="max-w-[820px] mb-8">
                        <div className="text-eyebrow text-muted-foreground mb-2">Session review</div>
                        <h1 className="text-display-2 text-foreground leading-[1.1] tracking-tight">
                            {isFocusGroup
                                ? `${participants.length} participants, ${participants.length} very different ways of telling the story.`
                                : `A 1:1 with ${personaName}.`}
                        </h1>
                        <p className="text-body-sm text-muted-foreground mt-3.5 leading-[1.7]">
                            {heroSubtitle}
                        </p>
                    </div>

                    {/* Legend (when review exists) */}
                    {hasReview && (
                        <div className="mb-8 inline-flex items-center gap-4 text-caption text-muted-foreground px-4 py-2.5 bg-[color:var(--surface-muted)] rounded-[10px] shadow-inset-edge">
                            <span className="font-medium text-foreground">Hover on highlights:</span>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-md bg-accent border border-primary" />
                                <span>Good technique</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-md bg-amber-200/80 border border-amber-300" />
                                <span>Leading/Issues</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-md bg-purple-200/80 border border-purple-300" />
                                <span>Missed opportunity</span>
                            </div>
                        </div>
                    )}

                    {/* Participant summaries */}
                    <section id="participant-summaries" className="mb-10 scroll-mt-24">
                        <div className="flex items-center gap-2 mb-3.5">
                            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                            <h2 className="text-display-4 text-foreground leading-tight">Participant summaries</h2>
                        </div>

                        {isFocusGroup && isCompleted ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {simulation.simulationArchetypes.map((simArch) => {
                                    const p = participantById(simArch.archetype.id);
                                    if (!p) return null;

                                    // Parse structured JSON or fall back to plain text
                                    let structured: { stance?: string; keyPoints?: string[]; quote?: string } | null = null;
                                    if (simArch.summary) {
                                        try { structured = JSON.parse(simArch.summary); } catch { structured = null; }
                                    }

                                    const tags: string[] = structured?.stance
                                        ? [structured.stance]
                                        : simArch.archetype.kicker
                                            ? [simArch.archetype.kicker]
                                            : [];

                                    return (
                                        <div
                                            key={simArch.archetype.id}
                                            className="bg-[color:var(--surface)] rounded-[16px] shadow-outline-ring flex flex-col overflow-hidden"
                                        >
                                            {/* Header */}
                                            <div className="px-[18px] pt-[14px] pb-3 flex items-center gap-2.5 border-b border-[color:var(--border-subtle)]">
                                                <div
                                                    className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[13px] font-semibold text-white shrink-0 shadow-inset-edge"
                                                    style={{ backgroundColor: p.accent }}
                                                >
                                                    {getInitial(p.name)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[16px] font-semibold text-foreground leading-[1.15] tracking-tight truncate">
                                                        {p.name}
                                                    </div>
                                                    {tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {tags.map((t) => (
                                                                <span
                                                                    key={t}
                                                                    className="text-[9px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 rounded"
                                                                    style={{ color: p.accent, backgroundColor: p.accentSoft }}
                                                                >
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div className="px-[18px] py-[14px] flex flex-col gap-2.5">
                                                {!simArch.summary ? (
                                                    <div className="flex flex-col items-center justify-center text-muted-foreground gap-2 py-4">
                                                        <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                                                        <p className="text-caption">Generating summary...</p>
                                                    </div>
                                                ) : structured?.keyPoints ? (
                                                    structured.keyPoints.map((point, i) => (
                                                        <div key={i} className="flex gap-2 text-body-sm leading-[1.55] text-muted-foreground">
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                                                                style={{ backgroundColor: p.accent }}
                                                            />
                                                            <span className="flex-1">{point}</span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-body-sm leading-[1.55] text-muted-foreground">{simArch.summary}</p>
                                                )}
                                            </div>

                                            {/* Footer quote */}
                                            {structured?.quote && (
                                                <div
                                                    className="mx-[18px] mb-[16px] px-3 py-2.5 rounded-[10px] text-caption italic text-muted-foreground leading-[1.55] shadow-inset-edge"
                                                    style={{ backgroundColor: p.accentSoft }}
                                                >
                                                    &ldquo;{structured.quote}&rdquo;
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            // Empty state — non-focus-group or review not generated yet
                            <div className="bg-[color:var(--surface)] rounded-[16px] shadow-outline-ring p-6">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-8 h-8 rounded-full inline-flex items-center justify-center text-[13px] font-semibold text-white shrink-0 shadow-inset-edge"
                                        style={{ backgroundColor: participants[0].accent }}
                                    >
                                        {getInitial(participants[0].name)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-[16px] font-semibold text-foreground leading-[1.15]">{participants[0].name}</div>
                                        {participants[0].kicker && (
                                            <div className="text-caption text-muted-foreground uppercase tracking-[0.05em] mt-1">
                                                {participants[0].kicker}
                                            </div>
                                        )}
                                        <p className="text-body-sm text-muted-foreground mt-3 leading-[1.55]">
                                            {isFocusGroup
                                                ? "Summaries will appear here once the session completes."
                                                : "Per-participant summaries are generated for focus groups. Regenerate the review to refresh this view."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Cross-profile compare — focus-group only, but we always render a header with empty-state otherwise */}
                    {isFocusGroup && (
                        <section id="cross-profile-compare" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-2 mb-3.5">
                                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                                <h2 className="text-display-4 text-foreground leading-tight">Cross-profile compare</h2>
                            </div>

                            {!simulation.crossProfileSummary ? (
                                <div className="bg-[color:var(--surface)] rounded-[14px] shadow-outline-ring p-5 flex flex-col items-center justify-center text-muted-foreground gap-2 py-8">
                                    <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                                    <p className="text-caption">Analyzing group dynamics...</p>
                                </div>
                            ) : !cross ? (
                                <div className="bg-[color:var(--surface)] rounded-[14px] shadow-outline-ring p-5">
                                    <p className="text-body-sm text-muted-foreground leading-relaxed">{simulation.crossProfileSummary}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    {/* Agreements */}
                                    <div className="flex flex-col gap-2.5">
                                        <div
                                            className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] shadow-inset-edge"
                                            style={{ backgroundColor: "color-mix(in oklch, var(--success) 8%, transparent)" }}
                                        >
                                            <Handshake className="h-3.5 w-3.5 text-[color:var(--success)]" />
                                            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[color:var(--success)]">Agreements</span>
                                            <span className="flex-1" />
                                            <span className="text-mono-meta text-[color:var(--success)] font-semibold">{agreementsCount}</span>
                                        </div>
                                        {cross.agreements?.length ? (
                                            cross.agreements.map((a, i) => (
                                                <CompareRow
                                                    key={i}
                                                    text={a.point}
                                                    accent="var(--success)"
                                                    chips={a.profiles.map((pName) => {
                                                        const p = participants.find(pp => pp.name === pName) || participants[0];
                                                        return { id: `${i}-${pName}`, name: pName, accent: p.accent };
                                                    })}
                                                />
                                            ))
                                        ) : (
                                            <EmptyCompareCard label="No agreements surfaced." />
                                        )}
                                    </div>

                                    {/* Tensions */}
                                    <div className="flex flex-col gap-2.5">
                                        <div
                                            className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] shadow-inset-edge"
                                            style={{ backgroundColor: "color-mix(in oklch, var(--warning) 8%, transparent)" }}
                                        >
                                            <Zap className="h-3.5 w-3.5 text-[color:var(--warning)]" />
                                            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[color:var(--warning)]">Tensions</span>
                                            <span className="flex-1" />
                                            <span className="text-mono-meta text-[color:var(--warning)] font-semibold">{tensionsCount}</span>
                                        </div>
                                        {cross.tensions?.length ? (
                                            cross.tensions.map((t, i) => (
                                                <CompareRow
                                                    key={i}
                                                    text={t.point}
                                                    accent="var(--warning)"
                                                    chips={t.between.map((pName) => {
                                                        const p = participants.find(pp => pp.name === pName) || participants[0];
                                                        return { id: `${i}-${pName}`, name: pName, accent: p.accent };
                                                    })}
                                                />
                                            ))
                                        ) : (
                                            <EmptyCompareCard label="No tensions surfaced." />
                                        )}
                                    </div>

                                    {/* Gaps */}
                                    <div className="flex flex-col gap-2.5">
                                        <div
                                            className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] shadow-inset-edge"
                                            style={{ backgroundColor: "color-mix(in oklch, var(--danger) 8%, transparent)" }}
                                        >
                                            <CircleDot className="h-3.5 w-3.5 text-[color:var(--danger)]" />
                                            <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-[color:var(--danger)]">Gaps</span>
                                            <span className="flex-1" />
                                            <span className="text-mono-meta text-[color:var(--danger)] font-semibold">{gapsCount}</span>
                                        </div>
                                        {cross.gaps?.length ? (
                                            cross.gaps.map((g, i) => {
                                                const gapText = typeof g === "string" ? g : g.text;
                                                const gapSource = typeof g === "string" ? null : g.source;
                                                return (
                                                    <CompareRow
                                                        key={i}
                                                        text={gapText}
                                                        accent="var(--danger)"
                                                        chips={gapSource ? [{ id: `${i}-src`, name: gapSource, accent: "var(--muted-foreground)" }] : []}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <EmptyCompareCard label="No gaps surfaced." />
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Recommended steps */}
                    {isFocusGroup && (
                        <section id="recommended-steps" className="mb-10 scroll-mt-24">
                            <div className="flex items-center gap-2 mb-3.5">
                                <Lightbulb className="h-3.5 w-3.5 text-muted-foreground" />
                                <h2 className="text-display-4 text-foreground leading-tight">Recommended next steps</h2>
                            </div>

                            {cross?.recommendedSteps?.length ? (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                                    {cross.recommendedSteps.map((step, i) => (
                                        <div
                                            key={i}
                                            className="bg-[color:var(--surface)] rounded-[14px] shadow-outline-ring p-[18px] flex flex-col gap-2.5"
                                        >
                                            <div className="self-start inline-flex items-center bg-[color:var(--surface-muted)] rounded-md px-2 py-0.5 text-mono-meta font-semibold tracking-[0.1em] text-muted-foreground">
                                                STEP {(i + 1).toString().padStart(2, "0")}
                                            </div>
                                            <div className="text-body-sm font-medium text-foreground leading-[1.45]">
                                                {step.action}
                                            </div>
                                            <div className="text-caption text-muted-foreground leading-[1.6]">
                                                {step.why}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-[color:var(--surface)] rounded-[14px] shadow-outline-ring p-5">
                                    <p className="text-body-sm text-muted-foreground leading-relaxed">
                                        {simulation.crossProfileSummary
                                            ? "No recommended steps were surfaced for this session."
                                            : "Recommended steps will appear once the cross-profile summary is generated."}
                                    </p>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Transcript */}
                    <section id="transcript" className="mb-6 scroll-mt-24">
                        <div className="flex items-center gap-2 mb-3.5">
                            <Quote className="h-3.5 w-3.5 text-muted-foreground" />
                            <h2 className="text-display-4 text-foreground leading-tight">Transcript</h2>
                            <span className="flex-1" />
                            <span className="text-caption text-muted-foreground">Tap a question to expand</span>
                        </div>

                        {simulation.messages.length === 0 ? (
                            <div className="bg-[color:var(--surface)] rounded-[14px] shadow-outline-ring text-center py-10">
                                <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <p className="text-body-sm text-muted-foreground">No messages in this session</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2.5">
                                {transcriptBlocks.map((block, blockIdx) => {
                                    const open = openTranscriptIdx === blockIdx;
                                    return (
                                        <div
                                            key={blockIdx}
                                            className="bg-[color:var(--surface)] rounded-[14px] shadow-outline-ring overflow-hidden"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenTranscriptIdx(open ? -1 : blockIdx)}
                                                className="w-full text-left flex items-center gap-3 px-[18px] py-3.5 bg-transparent cursor-pointer"
                                            >
                                                <span className="w-[22px] h-[22px] rounded-md bg-[color:var(--surface-muted)] text-muted-foreground inline-flex items-center justify-center shrink-0 shadow-inset-edge">
                                                    <Quote className="h-2.5 w-2.5" />
                                                </span>
                                                <span className="flex-1 text-[13.5px] font-medium text-foreground truncate">
                                                    &ldquo;{block.question}&rdquo;
                                                </span>
                                                <span className="text-mono-meta text-muted-foreground">
                                                    {block.answers.length} {block.answers.length === 1 ? "answer" : "answers"}
                                                </span>
                                                <ChevronDown
                                                    className={cn(
                                                        "h-3.5 w-3.5 text-muted-foreground transition-transform duration-[160ms]",
                                                        open && "rotate-180"
                                                    )}
                                                />
                                            </button>
                                            {open && (
                                                <div className="px-[18px] pb-[18px] pt-1 flex flex-col gap-3">
                                                    {block.answers.map((ans, ansIdx) => {
                                                        const p = ans.participant;
                                                        const msgIndex = simulation.messages.findIndex(m => m.id === ans.msg.id);
                                                        const feedback = getFeedbackForMessage(
                                                            msgIndex,
                                                            ans.msg.role,
                                                            ans.msg.id,
                                                            ans.msg.content
                                                        );

                                                        const quotes: Array<{ quote: string; type: "highlight" | "leading" | "missed"; tooltip: string; suggestion?: string; feedbackKey: string; feedbackContent: any }> = [];
                                                        feedback.missedProbes.forEach((m, i) => {
                                                            if (m.quote) quotes.push({
                                                                quote: m.quote,
                                                                type: "missed",
                                                                tooltip: m.opportunity,
                                                                suggestion: m.suggestion,
                                                                feedbackKey: `missed-${msgIndex}-${i}`,
                                                                feedbackContent: m,
                                                            });
                                                        });

                                                        return (
                                                            <div key={ansIdx} className="flex gap-2.5 items-start group/msg">
                                                                <div
                                                                    className="w-[26px] h-[26px] rounded-full inline-flex items-center justify-center text-[11px] font-semibold text-white shrink-0 shadow-inset-edge"
                                                                    style={{ backgroundColor: p?.accent || PERSONA_PALETTE[0].accent }}
                                                                >
                                                                    {p ? getInitial(p.name) : "?"}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div
                                                                        className="text-[11px] font-semibold mb-1"
                                                                        style={{ color: p?.accent || PERSONA_PALETTE[0].accent }}
                                                                    >
                                                                        {p?.name || personaName}
                                                                    </div>
                                                                    {ans.msg.imageBase64 && (
                                                                        <img
                                                                            src={ans.msg.imageBase64}
                                                                            alt="Shared image"
                                                                            className="max-w-full max-h-[200px] rounded-md mb-2 object-contain cursor-pointer hover:opacity-90 transition-opacity border border-border"
                                                                            onClick={() => setEnlargedImage(ans.msg.imageBase64!)}
                                                                        />
                                                                    )}
                                                                    <div className="text-body-sm leading-[1.7] text-muted-foreground">
                                                                        {ans.msg.content && ans.msg.content !== "[Shared an image]"
                                                                            ? (quotes.length > 0
                                                                                ? renderContentWithHighlights(ans.msg.content, quotes, false)
                                                                                : ans.msg.content)
                                                                            : null}
                                                                    </div>
                                                                    {/* Feedback widget (visible on hover) */}
                                                                    <div className="mt-2 pt-2 border-t border-[color:var(--border-subtle)] opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                                        <AIFeedback
                                                                            entityType="simulation_message"
                                                                            entityId={ans.msg.id}
                                                                            simulationId={simulation?.id}
                                                                            messageContent={ans.msg.content}
                                                                            size="sm"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                                    {/* Interviewer question block — show highlights on the user message too */}
                                                    {(() => {
                                                        const userMsg = simulation.messages.find(m => m.role === "user" && m.content === block.question);
                                                        if (!userMsg) return null;
                                                        const msgIndex = simulation.messages.findIndex(m => m.id === userMsg.id);
                                                        const feedback = getFeedbackForMessage(msgIndex, "user", userMsg.id, userMsg.content);

                                                        const quotes: Array<{ quote: string; type: "highlight" | "leading" | "missed"; tooltip: string; suggestion?: string; feedbackKey: string; feedbackContent: any }> = [];
                                                        feedback.highlights.forEach((h, i) => {
                                                            if (h.quote) quotes.push({
                                                                quote: h.quote,
                                                                type: "highlight",
                                                                tooltip: h.observation,
                                                                feedbackKey: `highlight-${msgIndex}-${i}`,
                                                                feedbackContent: h,
                                                            });
                                                        });
                                                        feedback.leadingMoments.forEach((l, i) => {
                                                            if (l.quote) quotes.push({
                                                                quote: l.quote,
                                                                type: "leading",
                                                                tooltip: l.issue,
                                                                suggestion: l.suggestion,
                                                                feedbackKey: `leading-${msgIndex}-${i}`,
                                                                feedbackContent: l,
                                                            });
                                                        });

                                                        if (quotes.length === 0) return null;

                                                        return (
                                                            <div className="flex gap-2.5 items-start mt-1 pt-3 border-t border-[color:var(--border-subtle)]">
                                                                <div className="w-[26px] h-[26px] rounded-full bg-[color:var(--surface-muted)] text-muted-foreground inline-flex items-center justify-center shrink-0 shadow-inset-edge">
                                                                    <User className="h-3 w-3" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-[11px] font-semibold text-muted-foreground mb-1">Interviewer</div>
                                                                    <div className="text-body-sm leading-[1.7] text-foreground">
                                                                        {renderContentWithHighlights(userMsg.content, quotes, true)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div ref={chatEndRef} />
                            </div>
                        )}
                    </section>

                    {/* No Review Message */}
                    {!hasReview && simulation.messages.length >= 2 && (
                        <div className="mt-6 text-center">
                            <p className="text-body-sm text-muted-foreground mb-4">
                                No coach review available yet. Generate one to see coaching feedback on your interview.
                            </p>
                            <Button
                                onClick={regenerateReview}
                                disabled={regenerating}
                                className="gap-1.5"
                            >
                                {regenerating ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                                Analyse Interview Technique
                            </Button>
                        </div>
                    )}
                </WorkspaceFrame>

                {/* Coach Chat Dialog */}
                <Dialog open={coachChatOpen} onOpenChange={setCoachChatOpen}>
                    <DialogContent className="max-w-md p-0 overflow-hidden bg-background border border-border shadow-lg rounded-md gap-0">
                        <DialogHeader className="px-5 py-4 border-b border-border bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center text-primary-foreground">
                                        <MessageCircle className="h-4.5 w-4.5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <DialogTitle className="text-sm font-bold text-foreground">Ask Your Coach</DialogTitle>
                                        <p className="text-[11px] text-muted-foreground font-medium">Get deeper insights on this feedback</p>
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Feedback Context */}
                        {coachChatFeedback && (
                            <div className="px-5 py-4 bg-muted border-b border-border">
                                <div className="flex items-start gap-3">
                                    <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${coachChatFeedback.type === "highlight"
                                        ? "bg-accent text-foreground"
                                        : coachChatFeedback.type === "leading"
                                            ? "bg-amber-100 text-amber-600"
                                            : "bg-purple-100 text-purple-600"
                                        }`}>
                                        {coachChatFeedback.type === "highlight" && <ThumbsUp className="h-3.5 w-3.5" />}
                                        {coachChatFeedback.type === "leading" && <AlertTriangle className="h-3.5 w-3.5" />}
                                        {coachChatFeedback.type === "missed" && <Lightbulb className="h-3.5 w-3.5" />}
                                    </div>
                                    <p className="text-xs text-foreground leading-relaxed pt-0.5 font-medium">
                                        {coachChatFeedback.content.observation || coachChatFeedback.content.issue || coachChatFeedback.content.opportunity}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Chat Messages */}
                        <div className="h-72 overflow-y-auto p-5 space-y-4 bg-background">
                            {coachChatMessages.length === 0 && !coachChatLoading && (
                                <div className="text-center text-muted-foreground text-sm py-10 flex flex-col items-center">
                                    <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center mb-3">
                                        <MessageCircle className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="font-medium text-muted-foreground">Ask a question about this feedback</p>
                                    <p className="text-xs mt-1 text-muted-foreground">e.g., "Why is this important?"</p>
                                </div>
                            )}
                            {coachChatMessages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                    <div className={`max-w-[85%] px-4 py-2.5 rounded-md text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-accent border border-border text-foreground rounded-tr-none"
                                        : "bg-card border border-border text-foreground rounded-tl-none"
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {coachChatLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-card border border-border text-muted-foreground px-4 py-3 rounded-md rounded-tl-none text-sm flex items-center gap-2">
                                        <span className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                            <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"></span>
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={coachChatEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border bg-card">
                            <div className="flex gap-2 items-center bg-background border border-input rounded-md px-2 py-1.5 transition-all">
                                <Input
                                    value={coachChatInput}
                                    onChange={(e) => setCoachChatInput(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 text-sm border-none shadow-none focus-visible:ring-0 bg-transparent h-9"
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendCoachMessage()}
                                />
                                <Button
                                    size="sm"
                                    onClick={sendCoachMessage}
                                    disabled={!coachChatInput.trim() || coachChatLoading}
                                    className="h-8 w-8 rounded-md bg-primary hover:bg-primary/90 p-0 shrink-0"
                                >
                                    {coachChatLoading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Send className="h-3.5 w-3.5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Summary Dialog */}
                <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
                    <DialogContent className="sm:max-w-2xl bg-background border-border shadow-lg rounded-md p-8">
                        <DialogHeader className="mb-4">
                            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <div className="p-2 rounded-md bg-muted border border-border">
                                    <FileText className="h-5 w-5 text-foreground" />
                                </div>
                                Session Summary
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground">
                                Generated by AI Coach based on the interview transcript.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="prose prose-sm max-w-none">
                            <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                                {summary}
                            </p>
                        </div>
                        <div className="mt-8 flex justify-end">
                            <Button onClick={() => setSummaryDialogOpen(false)} className="rounded-full bg-muted hover:bg-muted text-foreground font-medium">
                                Close
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Image Lightbox Dialog */}
                <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
                    <DialogContent className="max-w-3xl p-2 bg-background border border-border shadow-lg rounded-md">
                        <DialogHeader className="sr-only">
                            <DialogTitle>Enlarged Image</DialogTitle>
                            <DialogDescription>Enlarged view of the attached image</DialogDescription>
                        </DialogHeader>
                        {enlargedImage && (
                            <img
                                src={enlargedImage}
                                alt="Enlarged view"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}

// ---- Local compare components ----
// Compact row for Agreements / Tensions / Gaps columns; mirrors SR2_CompareRow in the exploration.
function CompareRow({
    text,
    accent,
    chips,
}: {
    text: string;
    accent: string;
    chips: { id: string; name: string; accent: string }[];
}) {
    return (
        <div className="flex gap-3 items-start px-3.5 py-3 bg-[color:var(--surface)] rounded-[12px] shadow-outline-ring">
            <span className="w-[22px] h-[22px] rounded-md bg-black/[0.02] shrink-0 inline-flex items-center justify-center shadow-inset-edge">
                <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                />
            </span>
            <div className="flex-1 flex flex-col gap-2">
                <div className="text-body-sm leading-[1.55] text-foreground">{text}</div>
                {chips.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {chips.map((c) => (
                            <span
                                key={c.id}
                                className="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 bg-[color:var(--surface)] rounded-full text-[10.5px] font-semibold shadow-inset-edge"
                                style={{ color: c.accent }}
                            >
                                <span
                                    className="w-3.5 h-3.5 rounded-full inline-flex items-center justify-center text-[8.5px] font-bold text-white"
                                    style={{ backgroundColor: c.accent }}
                                >
                                    {getInitial(c.name)}
                                </span>
                                {c.name.replace(/^The /, "")}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function EmptyCompareCard({ label }: { label: string }) {
    return (
        <div className="px-3.5 py-3 bg-[color:var(--surface)] rounded-[12px] shadow-outline-ring text-caption italic text-muted-foreground">
            {label}
        </div>
    );
}

// Created by Swapnil Bapat © 2026
