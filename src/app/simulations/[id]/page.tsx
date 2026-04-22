"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    Info,
    ChevronRight,
    MessageCircle,
    Send,
    X,
    FileText,
    ArrowLeft,
    ArrowRight,
    Handshake,
    Zap,
    CircleDot,
    Quote,
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { AIFeedback } from "@/components/ai/feedback";

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

    return (
        <TooltipProvider delayDuration={200}>
            <div className="flex flex-col">
                {/* Edge-to-edge header bar */}
                <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white border-b border-border">
                    <div className="flex items-center justify-between px-8 py-3 max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            <Link
                                href={subProjectId && subProjectName ? `/projects/${projectId}/sub/${subProjectId}?tab=simulations` : (projectId ? `/projects/${projectId}` : "/dashboard")}
                                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={`Back to ${subProjectName || projectName || "Dashboard"}`}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back</span>
                            </Link>
                            <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                {isFocusGroup ? (
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <User className="h-4 w-4 text-muted-foreground" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-foreground flex items-center gap-2">
                                    {isFocusGroup ? "Focus Group" : `Session with ${personaName}`}
                                    <Badge
                                        variant="secondary"
                                        className={`text-[10px] px-1.5 py-0 ${isCompleted ? 'bg-accent text-foreground' : 'bg-amber-100 text-amber-700'}`}
                                    >
                                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                        {isCompleted ? 'Completed' : 'In Progress'}
                                    </Badge>
                                </h1>
                                <p className="text-[11px] text-muted-foreground">
                                    {isFocusGroup
                                        ? focusGroupArchetypes.map(a => a.name).join(" · ")
                                        : new Date(simulation.startedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {summary && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSummaryDialogOpen(true)}
                                    className="gap-1.5"
                                >
                                    <FileText className="h-3.5 w-3.5" />
                                    View Summary
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
                                {regenerating ? "Analysing..." : "Analyse Interview Technique"}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="py-8">
                    <div className="relative">
                        {/* Focus Group Archetype Summaries */}
                        {isFocusGroup && isCompleted && (
                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                    Participant Summaries
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {simulation.simulationArchetypes?.map((simArch) => {
                                        const color = getArchetypeColor(simArch.archetype.id);

                                        // Parse structured JSON or fall back to plain text
                                        let structured: { stance?: string; keyPoints?: string[]; quote?: string } | null = null;
                                        if (simArch.summary) {
                                            try { structured = JSON.parse(simArch.summary); } catch { structured = null; }
                                        }

                                        return (
                                            <Card key={simArch.archetype.id} className={`border ${color.border} shadow-sm overflow-hidden`}>
                                                <div className={`px-4 py-3 ${color.bg} border-b ${color.border} flex items-center gap-3`}>
                                                    <div className={`w-8 h-8 rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} text-xs font-bold shrink-0`}>
                                                        {getInitial(simArch.archetype.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className={`font-semibold text-sm ${color.text}`}>{simArch.archetype.name}</h4>
                                                        {structured?.stance ? (
                                                            <p className={`text-[10px] uppercase tracking-wider font-semibold opacity-80 ${color.text}`}>{structured.stance}</p>
                                                        ) : simArch.archetype.kicker ? (
                                                            <p className={`text-[10px] uppercase tracking-wider font-semibold opacity-80 ${color.text}`}>{simArch.archetype.kicker}</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <CardContent className="p-4 text-sm text-foreground leading-relaxed bg-card">
                                                    {!simArch.summary ? (
                                                        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2 py-4">
                                                            <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                                                            <p className="text-xs">Generating summary...</p>
                                                        </div>
                                                    ) : structured?.keyPoints ? (
                                                        <div>
                                                            <ul className="space-y-1.5 mb-3">
                                                                {structured.keyPoints.map((point, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-[12px] text-foreground">
                                                                        <CircleDot className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                                                                        {point}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                            {structured.quote && (
                                                                <div className="border-l-2 border-muted-foreground/20 pl-3 mt-2">
                                                                    <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                                                        &ldquo;{structured.quote}&rdquo;
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p>{simArch.summary}</p>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>

                                {/* Cross-Profile Comparison */}
                                <div className="mt-6 mb-2">
                                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-muted-foreground" />
                                        Cross-Profile Comparison
                                    </h3>

                                    {(() => {
                                        if (!simulation.crossProfileSummary) {
                                            return (
                                                <Card className="border border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                                                    <CardContent className="p-5 flex flex-col items-center justify-center text-muted-foreground gap-2 py-8">
                                                        <Loader2 className="h-5 w-5 animate-spin opacity-50" />
                                                        <p className="text-xs">Analyzing group dynamics...</p>
                                                    </CardContent>
                                                </Card>
                                            );
                                        }

                                        // Parse structured JSON or fall back to plain text
                                        let cross: { agreements?: { point: string; profiles: string[] }[]; tensions?: { point: string; between: string[] }[]; gaps?: (string | { text: string; source: string })[]; recommendedSteps?: { action: string; why: string }[] } | null = null;
                                        try { cross = JSON.parse(simulation.crossProfileSummary); } catch { cross = null; }

                                        if (!cross) {
                                            return (
                                                <Card className="border border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                                                    <CardContent className="p-5 text-sm text-foreground leading-relaxed">
                                                        <p>{simulation.crossProfileSummary}</p>
                                                    </CardContent>
                                                </Card>
                                            );
                                        }

                                        return (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {/* Agreements */}
                                                {cross.agreements && cross.agreements.length > 0 && (
                                                    <Card className="border border-emerald-200 shadow-sm overflow-hidden">
                                                        <div className="px-4 py-2.5 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2">
                                                            <Handshake className="h-4 w-4 text-emerald-600" />
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Agreements</h4>
                                                        </div>
                                                        <CardContent className="p-4 space-y-3">
                                                            {cross.agreements.map((a, i) => (
                                                                <div key={i}>
                                                                    <p className="text-[12px] text-foreground leading-relaxed">{a.point}</p>
                                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                                        {a.profiles.map((p, j) => (
                                                                            <span key={j} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{p}</span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Tensions */}
                                                {cross.tensions && cross.tensions.length > 0 && (
                                                    <Card className="border border-amber-200 shadow-sm overflow-hidden">
                                                        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
                                                            <Zap className="h-4 w-4 text-amber-600" />
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-700">Tensions</h4>
                                                        </div>
                                                        <CardContent className="p-4 space-y-3">
                                                            {cross.tensions.map((t, i) => (
                                                                <div key={i}>
                                                                    <p className="text-[12px] text-foreground leading-relaxed">{t.point}</p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{t.between[0]}</span>
                                                                        <span className="text-[9px] text-muted-foreground">vs</span>
                                                                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{t.between[1]}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </CardContent>
                                                    </Card>
                                                )}

                                                {/* Gaps */}
                                                {cross.gaps && cross.gaps.length > 0 && (
                                                    <Card className="border border-slate-200 shadow-sm overflow-hidden">
                                                        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                                                            <CircleDot className="h-4 w-4 text-slate-500" />
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">Gaps</h4>
                                                        </div>
                                                        <CardContent className="p-4 space-y-2.5">
                                                            {cross.gaps.map((g, i) => {
                                                                const gapText = typeof g === "string" ? g : g.text;
                                                                const gapSource = typeof g === "string" ? null : g.source;
                                                                return (
                                                                    <div key={i}>
                                                                        <p className="text-[12px] text-foreground leading-relaxed flex items-start gap-2">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                                                                            {gapText}
                                                                        </p>
                                                                        {gapSource && (
                                                                            <span className={`ml-3.5 mt-1 inline-flex items-center text-[9px] font-medium px-1.5 py-0.5 rounded ${gapSource === "AI Analysis" ? "bg-violet-100 text-violet-600" : "bg-slate-100 text-slate-500"}`}>
                                                                                {gapSource === "AI Analysis" ? "AI Analysis" : `Source: ${gapSource}`}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Recommended Steps */}
                                {(() => {
                                    if (!simulation.crossProfileSummary) return null;
                                    let cross: { recommendedSteps?: { action: string; why: string }[] } | null = null;
                                    try { cross = JSON.parse(simulation.crossProfileSummary); } catch { return null; }
                                    if (!cross?.recommendedSteps?.length) return null;

                                    return (
                                        <div className="mt-6 mb-2">
                                            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                                <Lightbulb className="h-5 w-5 text-muted-foreground" />
                                                Recommended Steps
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {cross.recommendedSteps.map((step, i) => (
                                                    <Card key={i} className="border border-primary/20 shadow-sm overflow-hidden">
                                                        <CardContent className="p-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                    <span className="text-xs font-bold text-primary">{i + 1}</span>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[13px] font-semibold text-foreground leading-snug">{step.action}</p>
                                                                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{step.why}</p>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="h-px bg-border/40 mt-8 mb-2 w-full" />
                            </div>
                        )}

                        {/* Legend */}
                        {hasReview && (
                            <div className="mb-6">
                                <div className="inline-flex items-center gap-4 text-xs text-muted-foreground px-4 py-2.5 bg-muted rounded-md border border-border">
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
                            </div>
                        )}

                        {/* Chat Transcript - No card container, flows with page */}
                        <div className="border-b border-border/50 pb-6 mb-6">
                            {/* Chat Header 
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                    {personaName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground text-lg">{personaName}</p>
                                    <p className="text-sm text-muted-foreground">Conversation Transcript</p>
                                </div>
                            </div>*/}

                            {/* Messages - No scroll container */}
                            <div className="space-y-6">
                                {simulation.messages.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">No messages in this session</p>
                                    </div>
                                ) : (
                                    simulation.messages.map((msg, index) => {
                                        const feedback = getFeedbackForMessage(index, msg.role, msg.id, msg.content);

                                        // Build quotes array for highlighting with feedback keys
                                        const quotes: Array<{ quote: string; type: "highlight" | "leading" | "missed"; tooltip: string; suggestion?: string; feedbackKey: string; feedbackContent: any }> = [];

                                        if (msg.role === "user") {
                                            feedback.highlights.forEach((h, i) => {
                                                if (h.quote) quotes.push({
                                                    quote: h.quote,
                                                    type: "highlight",
                                                    tooltip: h.observation,
                                                    feedbackKey: `highlight-${index}-${i}`,
                                                    feedbackContent: h
                                                });
                                            });
                                            feedback.leadingMoments.forEach((l, i) => {
                                                if (l.quote) quotes.push({
                                                    quote: l.quote,
                                                    type: "leading",
                                                    tooltip: l.issue,
                                                    suggestion: l.suggestion,
                                                    feedbackKey: `leading-${index}-${i}`,
                                                    feedbackContent: l
                                                });
                                            });
                                        }

                                        if (msg.role === "persona") {
                                            feedback.missedProbes.forEach((m, i) => {
                                                if (m.quote) quotes.push({
                                                    quote: m.quote,
                                                    type: "missed",
                                                    tooltip: m.opportunity,
                                                    suggestion: m.suggestion,
                                                    feedbackKey: `missed-${index}-${i}`,
                                                    feedbackContent: m
                                                });
                                            });
                                        }

                                        return (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                            >
                                                {msg.role === "persona" && (() => {
                                                    const fgArch = isFocusGroup && msg.archetypeId ? focusGroupArchetypes.find(a => a.id === msg.archetypeId) : null;
                                                    const fgColor = fgArch ? getArchetypeColor(fgArch.id) : null;
                                                    return fgColor ? (
                                                        <div className={`w-8 h-8 rounded-full ${fgColor.avatar} flex items-center justify-center ${fgColor.avatarText} text-xs font-bold mt-1 shrink-0`}>
                                                            {getInitial(fgArch!.name)}
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center text-foreground text-xs font-bold mt-1 shrink-0">
                                                            {personaName.charAt(0).toUpperCase()}
                                                        </div>
                                                    );
                                                })()}

                                                <div
                                                    className={`max-w-[75%] px-5 py-3 rounded-md text-sm leading-relaxed ${msg.role === "user"
                                                        ? "bg-accent border border-border text-foreground rounded-tr-none"
                                                        : "bg-white border border-border text-foreground rounded-tl-none group/msg"
                                                        }`}
                                                >
                                                    {isFocusGroup && msg.role === "persona" && msg.archetypeId && (() => {
                                                        const arch = focusGroupArchetypes.find(a => a.id === msg.archetypeId);
                                                        const color = arch ? getArchetypeColor(arch.id) : null;
                                                        return arch ? (
                                                            <p className={`text-xs font-semibold mb-1 ${color?.text || "text-foreground"}`}>{arch.name}</p>
                                                        ) : null;
                                                    })()}
                                                    {msg.imageBase64 && (
                                                        <img
                                                            src={msg.imageBase64}
                                                            alt="Shared image"
                                                            className="max-w-full max-h-[200px] rounded-md mb-2 object-contain cursor-pointer hover:opacity-90 transition-opacity border border-border"
                                                            onClick={() => setEnlargedImage(msg.imageBase64!)}
                                                        />
                                                    )}
                                                    {msg.content && msg.content !== "[Shared an image]" && (
                                                        quotes.length > 0
                                                            ? renderContentWithHighlights(msg.content, quotes, msg.role === "user")
                                                            : msg.content
                                                    )}
                                                    {/* Feedback for persona messages */}
                                                    {msg.role === "persona" && (
                                                        <div className="mt-2 pt-2 border-t border-border opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                            <AIFeedback
                                                                entityType="simulation_message"
                                                                entityId={msg.id}
                                                                simulationId={simulation?.id}
                                                                messageContent={msg.content}
                                                                size="sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {msg.role === "user" && (
                                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs mt-1">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={chatEndRef} />
                            </div>
                        </div>

                        {/* No Review Message */}
                        {!hasReview && simulation.messages.length >= 2 && (
                            <div className="mt-6 text-center">
                                <p className="text-muted-foreground mb-4">
                                    No coach review available yet. Generate one to see coaching feedback on your interview.
                                </p>
                                <Button
                                    onClick={regenerateReview}
                                    disabled={regenerating}
                                    className="bg-primary hover:bg-primary/90 rounded-md"
                                >
                                    {regenerating ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                    )}
                                    Analyze Interview Technique
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

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
// Created by Swapnil Bapat © 2026
