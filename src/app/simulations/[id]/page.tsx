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
    simulationArchetypes: Array<{
        archetype: { id: string; name: string; kicker?: string | null };
        order: number;
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
    { bg: "bg-violet-100", border: "border-violet-200/50", text: "text-violet-900", avatar: "bg-gradient-to-br from-violet-500 to-purple-600", avatarText: "text-white" },
    { bg: "bg-amber-100", border: "border-amber-200/50", text: "text-amber-900", avatar: "bg-gradient-to-br from-amber-500 to-orange-600", avatarText: "text-white" },
    { bg: "bg-sky-100", border: "border-sky-200/50", text: "text-sky-900", avatar: "bg-gradient-to-br from-sky-500 to-blue-600", avatarText: "text-white" },
    { bg: "bg-rose-100", border: "border-rose-200/50", text: "text-rose-900", avatar: "bg-gradient-to-br from-rose-500 to-pink-600", avatarText: "text-white" },
    { bg: "bg-emerald-100", border: "border-emerald-200/50", text: "text-emerald-900", avatar: "bg-gradient-to-br from-emerald-500 to-teal-600", avatarText: "text-white" },
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
    useEffect(() => {
        fetchSimulation();
    }, [id]);

    useEffect(() => {
        coachChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [coachChatMessages]);

    const fetchSimulation = async () => {
        try {
            const res = await fetch(`/api/simulations/${id}`);
            const json = await res.json();
            if (json.success) {
                setSimulation(json.data);
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
            const res = await fetch("/api/gemini/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ simulationId: simulation.id }),
            });
            const json = await res.json();
            if (json.success) {
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
    const getFeedbackForMessage = (messageIndex: number, role: "user" | "persona", messageId: string): {
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
        // We search for nudges associated with this specific message ID
        let missedProbes: MissedProbe[] = [];

        if (simulation?.coachNudges) {
            const nudge = simulation.coachNudges.find(n => n.messageId === messageId);
            if (nudge && nudge.opportunities && nudge.opportunities.length > 0) {
                missedProbes = nudge.opportunities.map(op => ({
                    turn: turn,
                    opportunity: op.surfacedContext,
                    quote: op.quote,
                    suggestion: op.explorationDirection || "Dig deeper into this.",
                }));
            }
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
            <div className="min-h-screen bg-white pb-12">
                {/* Main Card Container - full width */}
                <div className="max-w-7xl mx-auto px-4 md:px-6 pt-4">
                    <div className="relative min-h-[800px] px-8 py-4 md:px-12">
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-6">
                            <Link href="/dashboard" className="hover:text-foreground transition-colors">
                                Projects
                            </Link>
                            <span className="text-border">/</span>
                            {projectName && (
                                <>
                                    <Link href={`/projects/${projectId}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                                        {projectName}
                                    </Link>
                                    <span className="text-border">/</span>
                                </>
                            )}
                            {subProjectId && subProjectName && (
                                <>
                                    <Link href={`/projects/${projectId}/sub/${subProjectId}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                                        {subProjectName}
                                    </Link>
                                    <span className="text-border">/</span>
                                </>
                            )}
                            <span className="text-foreground">
                                Session Review
                            </span>
                        </div>

                        {/* Header Section */}
                        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h1 className="text-3xl font-bold text-foreground">
                                            {isFocusGroup ? "Focus Group" : `Session with ${personaName}`}
                                        </h1>
                                        <Badge
                                            variant="secondary"
                                            className={`${isCompleted ? 'bg-accent text-foreground' : 'bg-amber-100 text-amber-700'}`}
                                        >
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            {isCompleted ? 'Completed' : 'In Progress'}
                                        </Badge>
                                    </div>
                                    {isFocusGroup ? (
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {focusGroupArchetypes.map((arch, idx) => {
                                                const color = ARCHETYPE_COLORS[idx % ARCHETYPE_COLORS.length];
                                                return (
                                                    <div key={arch.id} className="flex items-center gap-2 bg-white border border-border/60 rounded-lg px-3 py-1.5">
                                                        <div className={`w-5 h-5 rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} text-[10px] font-bold`}>
                                                            {getInitial(arch.name)}
                                                        </div>
                                                        <span className="text-xs font-medium text-foreground">{arch.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-sm">
                                            {new Date(simulation.startedAt).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={regenerateReview}
                                        disabled={regenerating}
                                        className="border-input text-foreground hover:bg-accent rounded-md"
                                    >
                                        {regenerating ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                        )}
                                        {regenerating ? "Analysing..." : "Analyse Interview Technique"}
                                    </Button>

                                    {summary && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSummaryDialogOpen(true)}
                                            className="text-foreground hover:text-foreground hover:bg-accent h-8 px-3 text-xs"
                                        >
                                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                                            View Summary
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>



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
                                        const feedback = getFeedbackForMessage(index, msg.role, msg.id);

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
                                                        : "bg-background border border-border text-foreground rounded-tl-none group/msg"
                                                        }`}
                                                >
                                                    {isFocusGroup && msg.role === "persona" && msg.archetypeId && (() => {
                                                        const arch = focusGroupArchetypes.find(a => a.id === msg.archetypeId);
                                                        const color = arch ? getArchetypeColor(arch.id) : null;
                                                        return arch ? (
                                                            <p className={`text-xs font-semibold mb-1 ${color?.text || "text-foreground"}`}>{arch.name}</p>
                                                        ) : null;
                                                    })()}
                                                    {quotes.length > 0
                                                        ? renderContentWithHighlights(msg.content, quotes, msg.role === "user")
                                                        : msg.content
                                                    }
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
            </div>
        </TooltipProvider>
    );
}
// Created by Swapnil Bapat © 2026
