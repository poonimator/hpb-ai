"use client";

import { useState, useEffect, useRef, use, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Play,
    Square,
    Send,
    User,
    Bot,
    Loader2,
    AlertCircle,
    Sliders,
    Sparkles,
    FileText,
    Settings2,
    ChevronLeft,
    CheckCircle2,
    Circle,
    Clock,
    SkipForward,
    AlertTriangle,
    ListChecks,
    ChevronDown,
    ChevronUp,
    Target,
    MessageSquare,
    MessageCircle
} from "lucide-react";

interface KBDocument {
    id: string;
    title: string;
    docType: string;
    status: string;
    parsedMetaJson?: string; // AI-parsed persona details (name, age, occupation, bio)
}

interface Message {
    id: string;
    role: "user" | "persona";
    content: string;
    timestamp: string;
}

interface MixerSettings {
    emotionalTone: number;
    responseLength: "short" | "medium" | "long";
    thinkingStyle: "concrete" | "abstract";
    moodSwings: number;
    singlishLevel: number;
}

interface GuideQuestion {
    id: string;
    text: string;
    intent: string | null;
    order: number;
    parentId: string | null;
    subQuestions?: GuideQuestion[];
}

interface GuideSet {
    id: string;
    title: string;
    intent: string;
    questions: GuideQuestion[];
}

interface CoverageItem {
    id: string;
    questionId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COVERED' | 'SKIPPED';
    isOutOfOrder: boolean;
    matchedCount: number;
    question: {
        id: string;
        text: string;
        intent: string | null;
        order: number;
        parentId: string | null;
        guideSet: {
            id: string;
            title: string;
            intent: string;
        };
    };
}

interface CoverageSummary {
    total: number;
    notStarted: number;
    inProgress: number;
    covered: number;
    skipped: number;
    outOfOrder: number;
}

interface PageProps {
    params: Promise<{ projectId: string }>;
}

// Helper function to get persona details from AI-parsed metadata
function getPersonaDetails(parsedMetaJson: string | undefined): {
    name: string;
    age: string;
    occupation: string;
    summary: string;
    gains: string;
    pains: string;
} {
    if (!parsedMetaJson) {
        return { name: "", age: "", occupation: "", summary: "", gains: "", pains: "" };
    }

    try {
        const parsed = JSON.parse(parsedMetaJson);
        return {
            name: parsed.name || "",
            age: parsed.age || "",
            occupation: parsed.occupation || "",
            summary: parsed.summary || parsed.bio || "", // Fallback to bio for older parses
            gains: parsed.gains || "",
            pains: parsed.pains || "",
        };
    } catch {
        return { name: "", age: "", occupation: "", summary: "", gains: "", pains: "" };
    }
}

export default function DojoPage({ params }: PageProps) {
    const { projectId } = use(params);

    const [project, setProject] = useState<{ name: string; lifeStage: string; setupComplete?: boolean } | null>(null);
    const [personas, setPersonas] = useState<KBDocument[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
    const [simulationId, setSimulationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [ending, setEnding] = useState(false);
    const [generatingReview, setGeneratingReview] = useState(false);
    const [hasDisclaimer, setHasDisclaimer] = useState(false);

    const [mixer, setMixer] = useState<MixerSettings>({
        emotionalTone: 50,
        responseLength: "medium",
        thinkingStyle: "concrete",
        moodSwings: 25,
        singlishLevel: 50,
    });

    // Coverage tracking state
    const [coverage, setCoverage] = useState<CoverageItem[]>([]);
    const [coverageSummary, setCoverageSummary] = useState<CoverageSummary | null>(null);
    const [expandedSets, setExpandedSets] = useState<Set<string>>(new Set());
    const [mappingQuestion, setMappingQuestion] = useState(false);





    const messagesEndRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        fetchProject();
        fetchKBPersonas();

        const resumeId = searchParams.get('resume');
        if (resumeId) {
            resumeSession(resumeId);
        }
    }, [projectId, searchParams]);

    useEffect(() => {
        if (simulationId) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, simulationId]);

    // Fetch coverage when simulation starts
    useEffect(() => {
        if (simulationId) {
            fetchCoverage();
        }
    }, [simulationId]);

    const fetchCoverage = useCallback(async () => {
        if (!simulationId) return;
        try {
            const res = await fetch(`/api/simulations/${simulationId}/coverage`);
            const data = await res.json();
            if (data.success) {
                // If coverage is empty, try to initialize it
                if (data.data.coverage.length === 0) {
                    const initRes = await fetch(`/api/simulations/${simulationId}/coverage`, {
                        method: 'POST'
                    });
                    const initData = await initRes.json();
                    if (initData.success && initData.data.count > 0) {
                        // Re-fetch after initialization
                        const refetchRes = await fetch(`/api/simulations/${simulationId}/coverage`);
                        const refetchData = await refetchRes.json();
                        if (refetchData.success) {
                            setCoverage(refetchData.data.coverage);
                            setCoverageSummary(refetchData.data.summary);
                            const setIds = new Set<string>(refetchData.data.coverage.map((c: CoverageItem) => c.question.guideSet.id));
                            setExpandedSets(setIds);
                        }
                        return;
                    }
                }
                setCoverage(data.data.coverage);
                setCoverageSummary(data.data.summary);
                // Expand all sets by default
                const setIds = new Set<string>(data.data.coverage.map((c: CoverageItem) => c.question.guideSet.id));
                setExpandedSets(setIds);
            }
        } catch (err) {
            console.error("Failed to fetch coverage:", err);
        }
    }, [simulationId]);

    // Map user message to question
    const mapQuestionToMessage = useCallback(async (utterance: string, messageId: string) => {
        if (!simulationId) return;

        setMappingQuestion(true);
        try {
            const res = await fetch("/api/gemini/map-question", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    simulationId,
                    userUtterance: utterance
                })
            });

            const data = await res.json();
            if (data.success && data.data.questionId && data.data.confidence >= 0.65) {
                // Update coverage
                await updateCoverage(data.data.questionId, messageId, false);
            }
        } catch (err) {
            console.error("Failed to map question:", err);
        } finally {
            setMappingQuestion(false);
        }
    }, [simulationId, projectId]);

    // Update coverage (auto or manual)
    const updateCoverage = async (questionId: string, messageId: string | null, isManual: boolean) => {
        if (!simulationId) return;

        try {
            const res = await fetch(`/api/simulations/${simulationId}/coverage`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ questionId, messageId, isManual })
            });

            if (res.ok) {
                await fetchCoverage();
            }
        } catch (err) {
            console.error("Failed to update coverage:", err);
        }
    };

    // Manual selection of current question
    const setCurrentQuestion = (questionId: string) => {
        updateCoverage(questionId, null, true);
    };

    // Populate input with question text
    const useQuestion = (text: string) => {
        setInputValue(text);
    };

    // Toggle guide set expansion
    const toggleSet = (setId: string) => {
        setExpandedSets(prev => {
            const next = new Set(prev);
            if (next.has(setId)) {
                next.delete(setId);
            } else {
                next.add(setId);
            }
            return next;
        });
    };

    // Group coverage by guide set
    const coverageBySet = coverage.reduce((acc, item) => {
        const setId = item.question.guideSet.id;
        if (!acc[setId]) {
            acc[setId] = {
                set: item.question.guideSet,
                items: []
            };
        }
        acc[setId].items.push(item);
        return acc;
    }, {} as Record<string, { set: { id: string; title: string; intent: string }; items: CoverageItem[] }>);

    // Helper to convert order to letter for sub-questions (0 = A, 1 = B, etc.)
    const numberToLetter = (num: number): string => String.fromCharCode(65 + num);

    // Get question display label (e.g., "1" for main, "1A" for sub)
    const getQuestionLabel = (item: CoverageItem, allItems: CoverageItem[]): string => {
        if (!item.question.parentId) {
            // Main question - find its position among main questions
            const mainQuestions = allItems.filter(i => !i.question.parentId);
            const mainIndex = mainQuestions.findIndex(mq => mq.questionId === item.questionId);
            return `${mainIndex + 1}`;
        } else {
            // Sub-question - find parent and sub-position
            const parentItem = allItems.find(i => i.questionId === item.question.parentId);
            if (parentItem) {
                const mainQuestions = allItems.filter(i => !i.question.parentId);
                const parentIndex = mainQuestions.findIndex(mq => mq.questionId === parentItem.questionId);
                const siblingSubQuestions = allItems.filter(i => i.question.parentId === item.question.parentId);
                const subIndex = siblingSubQuestions.findIndex(sq => sq.questionId === item.questionId);
                return `${parentIndex + 1}${numberToLetter(subIndex)}`;
            }
            return `${item.question.order + 1}`;
        }
    };

    const fetchProject = async () => {
        try {
            const res = await fetch("/api/projects");
            const data = await res.json();
            if (data.success) {
                const proj = data.data.find((p: { id: string }) => p.id === projectId);
                if (proj) setProject(proj);
            }
        } catch (err) {
            console.error("Failed to fetch project:", err);
        }
    };

    const fetchKBPersonas = async () => {
        try {
            const res = await fetch("/api/kb/documents?docType=PERSONA");
            const data = await res.json();
            if (data.success) {
                // Filter only approved docs
                const approved = data.data.filter((d: any) => d.status === "APPROVED");
                setPersonas(approved);
                if (approved.length > 0) {
                    setSelectedPersonaId(approved[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch personas:", err);
        }

    };



    const resumeSession = async (simId: string) => {
        setLoading(true);
        try {
            // Fetch full simulation details including messages and mixer settings
            const res = await fetch(`/api/simulations/${simId}`);
            const data = await res.json();

            if (data.success) {
                const fullSim = data.data;

                // 1. Restore state
                setSimulationId(fullSim.id);
                setMessages(fullSim.messages || []);

                // 2. Restore persona selection
                if (fullSim.personaDoc) {
                    setSelectedPersonaId(fullSim.personaDoc.id);
                } else if (fullSim.personaId) {
                    // Fallback to personaId if doc not found (legacy)
                    setSelectedPersonaId(fullSim.personaId);
                }

                // 3. Restore mixer settings
                if (fullSim.mixerSettings) {
                    setMixer(fullSim.mixerSettings);
                }

                // 4. Set ready state
                setHasDisclaimer(true);
            } else {
                alert("Failed to details for this session.");
            }
        } catch (err) {
            console.error("Failed to resume session:", err);
            alert("Failed to resume session.");
        } finally {
            setLoading(false);
        }
    };

    const startSession = async () => {
        if (!selectedPersonaId) return;

        // Block if guide setup is not complete
        if (!project?.setupComplete) {
            alert("Please complete your moderator guide setup before starting a rehearsal.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/simulations/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    personaDocId: selectedPersonaId, // Use KB doc ID
                    mode: "dojo",
                    mixerSettings: mixer,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setSimulationId(data.data.id);
                setMessages([]);
                setHasDisclaimer(true);
            } else {
                alert(data.error || "Failed to start session");
            }
        } catch (err) {
            alert("Failed to start session");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const endSession = async () => {
        if (!simulationId) return;

        setEnding(true);
        try {
            // Finalize coverage first
            await fetch(`/api/simulations/${simulationId}/coverage`, {
                method: "PUT"
            });

            const res = await fetch("/api/simulations/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ simulationId }),
            });

            const data = await res.json();
            if (data.success) {
                // Automatically ask if user wants to generate review
                if (confirm("Session ended. Would you like to generate a Coach Review now?")) {
                    generateReview(simulationId);
                }
                setSimulationId(null);
                setCoverage([]);
                setCoverageSummary(null);
            } else {
                alert(data.error || "Failed to end session");
            }
        } catch (err) {
            alert("Failed to end session");
            console.error(err);
        } finally {
            setEnding(false);
        }
    };

    const generateReview = async (simId: string) => {
        setGeneratingReview(true);
        try {
            const res = await fetch("/api/gemini/review", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ simulationId: simId }),
            });

            const data = await res.json();
            if (data.success) {
                window.location.href = `/simulations/${simId}`;
            } else {
                alert("Failed to generate review. Please try again from the simulation details page.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGeneratingReview(false);
        }
    };

    const sendMessage = async () => {
        if (!simulationId || !inputValue.trim()) return;

        const messageContent = inputValue.trim();
        setInputValue("");
        setSending(true);

        // 1. Optimistic update for User Message
        const tempUserMessage: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: messageContent,
            timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMessage]);

        try {
            // 2. Save User Message
            const userRes = await fetch("/api/simulations/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    simulationId,
                    content: messageContent,
                    role: "user",
                }),
            });

            const userData = await userRes.json();
            if (!userData.success) throw new Error("Failed to save user message");

            // Replace temp message with real one
            setMessages((prev) =>
                prev.map(m => m.id === tempUserMessage.id ? {
                    ...m,
                    id: userData.data.userMessage.id,
                    timestamp: userData.data.userMessage.timestamp
                } : m)
            );

            // 2b. Auto-map this question to guide (non-blocking)
            mapQuestionToMessage(messageContent, userData.data.userMessage.id);

            // 3. Trigger Gemini Persona Reply
            // Create temp loading bubble
            const tempBotMessageId = `temp-bot-${Date.now()}`;
            setMessages((prev) => [...prev, {
                id: tempBotMessageId,
                role: "persona",
                content: " Thinking...",
                timestamp: new Date().toISOString()
            }]);

            const botRes = await fetch("/api/gemini/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    simulationId,
                    content: messageContent, // context for stateless, though prompt builder loads DB
                    role: "user"
                }),
            });

            const botData = await botRes.json();

            if (botData.success) {
                // Replace temp bot message with real response
                setMessages((prev) =>
                    prev.map(m => m.id === tempBotMessageId ? {
                        ...m,
                        id: botData.data.message.id,
                        content: botData.data.message.content,
                        timestamp: botData.data.message.timestamp
                    } : m)
                );
            } else {
                // Show error state
                setMessages((prev) =>
                    prev.map(m => m.id === tempBotMessageId ? {
                        ...m,
                        content: "⚠️ Connection lost. Please try again."
                    } : m)
                );
            }

        } catch (err) {
            console.error(err);
            alert("Failed to process message");
        } finally {
            setSending(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Find selected persona object
    const activePersona = personas.find(p => p.id === selectedPersonaId);

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col bg-accent/50 overflow-hidden">
            {/* Edge-to-edge header bar */}
            <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-white border-b border-border shrink-0">
                <div className="flex items-center justify-between px-8 py-3 max-w-7xl mx-auto">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Back to Dashboard"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back</span>
                        </Link>
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-foreground">Interview Rehearsal</h1>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate max-w-[300px] md:max-w-[500px]">
                                <span className="truncate">{project?.name}</span>
                                {simulationId && activePersona && (
                                    <>
                                        <span className="text-muted-foreground/40">&middot;</span>
                                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            {activePersona.title}
                                        </span>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {simulationId ? (
                            <Button
                                onClick={endSession}
                                disabled={ending || generatingReview}
                                variant="outline"
                                size="sm"
                                className="gap-1.5 bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700"
                            >
                                {ending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                                End Session
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6 flex flex-col gap-4 max-w-7xl mx-auto w-full">




                {/* MODE SWITCHING */}
                {!simulationId ? (
                    // =================================================================================
                    // SETUP MODE: Side-by-Side Compact Layout
                    // =================================================================================
                    <div className="flex-1 overflow-y-auto w-full flex flex-col items-center justify-center py-4">

                        <div className="w-full max-w-6xl flex flex-col justify-center h-full gap-8">



                            {/* Cards Grid Side-by-Side */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">

                                {/* Step 1: Persona */}
                                <Card className="bg-white border-border shadow-sm flex flex-col h-full">
                                    <CardHeader className="py-3 px-5 border-b border-border bg-accent/50">
                                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                                            <div className="h-6 w-6 rounded bg-muted text-foreground flex items-center justify-center text-xs font-bold">1</div>
                                            Select Persona
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 flex-1 flex flex-col gap-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs text-muted-foreground uppercase font-semibold">Verified Profile</Label>
                                            <Select
                                                value={selectedPersonaId}
                                                onValueChange={setSelectedPersonaId}
                                            >
                                                <SelectTrigger className="bg-white border-border text-foreground h-9 text-sm">
                                                    <SelectValue placeholder="Select persona..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white border-border">
                                                    {personas.length === 0 ? (
                                                        <SelectItem value="none" disabled>No personas found</SelectItem>
                                                    ) : (
                                                        personas.map((persona) => {
                                                            const details = getPersonaDetails(persona.parsedMetaJson);
                                                            const displayName = details.name || persona.title;
                                                            const displayLabel = details.age
                                                                ? `${displayName}, ${details.age}`
                                                                : displayName;
                                                            return (
                                                                <SelectItem key={persona.id} value={persona.id} className="text-foreground focus:bg-accent">
                                                                    {displayLabel}
                                                                </SelectItem>
                                                            );
                                                        })
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Preview Card */}
                                        <div className="flex-1 bg-accent border border-border rounded-lg p-4 flex flex-col justify-center">
                                            {activePersona ? (() => {
                                                const details = getPersonaDetails(activePersona.parsedMetaJson);
                                                const displayName = details.name || activePersona.title;
                                                return (
                                                    <div className="space-y-3">
                                                        {/* Header with avatar and name */}
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                                                                {displayName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-foreground truncate">{displayName}</h3>
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {details.age && (
                                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                                            {details.age} years old
                                                                        </span>
                                                                    )}
                                                                    {details.occupation && (
                                                                        <span className="text-xs text-foreground bg-accent px-2 py-0.5 rounded border border-border truncate max-w-[150px]">
                                                                            {details.occupation}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Description */}
                                                        {/* Details Grid */}
                                                        <div className="text-xs space-y-2">
                                                            {/* Summary */}
                                                            {details.summary && (
                                                                <p className="text-muted-foreground leading-relaxed italic">
                                                                    "{details.summary}"
                                                                </p>
                                                            )}

                                                            {/* Gains & Pains */}
                                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                                {details.gains && (
                                                                    <div className="bg-accent p-2 rounded border border-border">
                                                                        <span className="block text-[10px] uppercase font-bold text-foreground mb-1">Motivations</span>
                                                                        <p className="text-foreground leading-tight">{details.gains}</p>
                                                                    </div>
                                                                )}
                                                                {details.pains && (
                                                                    <div className="bg-red-50 p-2 rounded border border-red-100">
                                                                        <span className="block text-[10px] uppercase font-bold text-red-700 mb-1">Frustrations</span>
                                                                        <p className="text-red-800 leading-tight">{details.pains}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {/* Verified badge */}
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                                            <CheckCircle2 className="h-3 w-3" />
                                                            <span>Verified persona from research data</span>
                                                        </div>
                                                    </div>
                                                );
                                            })() : (
                                                <div className="text-muted-foreground opacity-60 text-center py-4">
                                                    <FileText className="h-8 w-8 mx-auto mb-2" />
                                                    <p className="text-xs">Select a persona to preview details</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Step 2: Mixer */}
                                <Card className="bg-white border-border shadow-sm flex flex-col h-full">
                                    <CardHeader className="py-3 px-5 border-b border-border bg-accent/50">
                                        <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2 uppercase tracking-wide">
                                            <div className="h-6 w-6 rounded bg-muted text-foreground flex items-center justify-center text-xs font-bold">2</div>
                                            Configure Behavior
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-5 flex-1 grid grid-cols-2 gap-x-6 gap-y-5">
                                        {/* Tone */}
                                        <div className="space-y-2 col-span-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tone</Label>
                                                <span className="text-[10px] font-medium text-foreground">
                                                    {mixer.emotionalTone === 0 ? "Very Reserved" :
                                                        mixer.emotionalTone === 25 ? "Reserved" :
                                                            mixer.emotionalTone === 50 ? "Neutral" :
                                                                mixer.emotionalTone === 75 ? "Expressive" : "Very Expressive"}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-tight h-8">
                                                Adjust emotional range, from neutral to highly expressive.
                                            </p>
                                            <Slider
                                                value={[mixer.emotionalTone]}
                                                onValueChange={([v]) => {
                                                    // Snap to nearest stop
                                                    const stops = [0, 25, 50, 75, 100];
                                                    const snapped = stops.reduce((prev, curr) =>
                                                        Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
                                                    );
                                                    setMixer({ ...mixer, emotionalTone: snapped });
                                                }}
                                                max={100}
                                                step={1}
                                                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5"
                                            />
                                            <div className="flex justify-between text-[8px] text-muted-foreground uppercase">
                                                <span>Reserved</span>
                                                <span>Expressive</span>
                                            </div>
                                        </div>

                                        {/* Singlish */}
                                        <div className="space-y-2 col-span-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Singlish</Label>
                                                <span className="text-[10px] font-medium text-foreground">
                                                    {mixer.singlishLevel === 0 ? "Formal English" :
                                                        mixer.singlishLevel === 25 ? "Standard" :
                                                            mixer.singlishLevel === 50 ? "Light Singlish" :
                                                                mixer.singlishLevel === 75 ? "Casual Singlish" : "Full Singlish"}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-tight h-8">
                                                Control the density of colloquial Singaporean slang.
                                            </p>
                                            <Slider
                                                value={[mixer.singlishLevel]}
                                                onValueChange={([v]) => {
                                                    const stops = [0, 25, 50, 75, 100];
                                                    const snapped = stops.reduce((prev, curr) =>
                                                        Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
                                                    );
                                                    setMixer({ ...mixer, singlishLevel: snapped });
                                                }}
                                                max={100}
                                                step={1}
                                                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5"
                                            />
                                            <div className="flex justify-between text-[8px] text-muted-foreground uppercase">
                                                <span>Formal</span>
                                                <span>Colloquial</span>
                                            </div>
                                        </div>

                                        {/* Variability */}
                                        <div className="space-y-2 col-span-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase">Mood Variability</Label>
                                                <span className="text-[10px] font-medium text-foreground">
                                                    {mixer.moodSwings === 0 ? "Very Stable" :
                                                        mixer.moodSwings === 25 ? "Stable" :
                                                            mixer.moodSwings === 50 ? "Moderate" :
                                                                mixer.moodSwings === 75 ? "Variable" : "Highly Variable"}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-tight">
                                                Determine how frequently and intensely the persona's emotional state shifts during the session.
                                            </p>
                                            <Slider
                                                value={[mixer.moodSwings]}
                                                onValueChange={([v]) => {
                                                    const stops = [0, 25, 50, 75, 100];
                                                    const snapped = stops.reduce((prev, curr) =>
                                                        Math.abs(curr - v) < Math.abs(prev - v) ? curr : prev
                                                    );
                                                    setMixer({ ...mixer, moodSwings: snapped });
                                                }}
                                                max={100}
                                                step={1}
                                                className="[&_[role=slider]]:bg-primary [&_[role=slider]]:h-3.5 [&_[role=slider]]:w-3.5"
                                            />
                                            <div className="flex justify-between text-[8px] text-muted-foreground uppercase">
                                                <span>Stable</span>
                                                <span>Variable</span>
                                            </div>
                                        </div>

                                        <Separator className="col-span-2 bg-border" />

                                        {/* Dropdowns */}
                                        <div className="space-y-2 col-span-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Length</Label>
                                            <p className="text-[10px] text-muted-foreground leading-tight h-4">
                                                Target response verbosity.
                                            </p>
                                            <Select
                                                value={mixer.responseLength}
                                                onValueChange={(v) => setMixer({ ...mixer, responseLength: v as "short" | "medium" | "long" })}
                                            >
                                                <SelectTrigger className="bg-white border-border h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="short">Short</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="long">Long</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 col-span-1">
                                            <Label className="text-[10px] font-bold text-muted-foreground uppercase">Style</Label>
                                            <p className="text-[10px] text-muted-foreground leading-tight h-4">
                                                Concrete (literal) vs. Abstract thinking.
                                            </p>
                                            <Select
                                                value={mixer.thinkingStyle}
                                                onValueChange={(v) => setMixer({ ...mixer, thinkingStyle: v as "concrete" | "abstract" })}
                                            >
                                                <SelectTrigger className="bg-white border-border h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="concrete">Concrete</SelectItem>
                                                    <SelectItem value="abstract">Abstract</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Start Button */}
                            <div className="flex flex-col items-center gap-3">
                                {!project?.setupComplete && (
                                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 text-sm">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Complete your <a href={`/projects/new/guide?projectId=${projectId}`} className="underline font-medium hover:text-amber-700">moderator guide setup</a> before starting.</span>
                                    </div>
                                )}
                                <Button
                                    onClick={startSession}
                                    disabled={loading || !selectedPersonaId || !project?.setupComplete}
                                    className={`shadow-sm h-12 px-10 text-base rounded-md min-w-[240px] transform transition-all ${project?.setupComplete
                                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105'
                                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? (
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <Play className="h-5 w-5 mr-2 fill-current" />
                                    )}
                                    {project?.setupComplete ? 'Start Session' : 'Setup Required'}
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // =================================================================================
                    // ACTIVE MODE: Chat (Left) + Coverage Panel (Right)
                    // =================================================================================
                    <div className="flex-1 flex gap-4 min-h-0 animate-in fade-in duration-500">

                        {/* Left: Conversation Card */}
                        <Card className="flex-1 bg-white border-border flex flex-col overflow-hidden shadow-sm min-h-0">
                            <CardHeader className="py-3 px-5 border-b border-border bg-accent/30 shrink-0 h-14 flex justify-center">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <span>Live Conversation</span>
                                        <span className="text-[10px] text-muted-foreground font-normal ml-2 italic hidden md:inline-block">
                                            *Training simulation only. Outputs are synthetic.*
                                        </span>
                                        {mappingQuestion && (
                                            <div className="flex items-center gap-1 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 ml-2">
                                                <Target className="h-3 w-3 animate-pulse" />
                                                <span>Mapping...</span>
                                            </div>
                                        )}
                                    </CardTitle>
                                    <Badge className="w-fit bg-accent text-foreground border-border shadow-none text-xs">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-1.5 animate-pulse"></span>
                                        Active
                                    </Badge>
                                </div>
                            </CardHeader>

                            {/* Messages */}
                            <ScrollArea className="flex-1 h-0 p-6">
                                {messages.length === 0 ? (
                                    <div className="h-full flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-muted-foreground text-sm bg-accent px-4 py-2 rounded-full border border-border shadow-sm inline-block">
                                                Session started! Ask your first question below.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user"
                                                    ? "bg-primary"
                                                    : "bg-muted-foreground"
                                                    }`}>
                                                    {message.role === "user" ? (
                                                        <User className="h-4 w-4 text-white" />
                                                    ) : (
                                                        <Bot className="h-4 w-4 text-white" />
                                                    )}
                                                </div>
                                                <div className={`max-w-[85%] p-3.5 rounded-md shadow-sm border text-sm leading-relaxed ${message.role === "user"
                                                    ? "bg-accent text-foreground border-border rounded-tr-none"
                                                    : "bg-background text-foreground border-border rounded-tl-none"
                                                    }`}>
                                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-1 opacity-70 text-right">
                                                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                        {generatingReview && (
                                            <div className="flex justify-center my-6">
                                                <span className="flex items-center text-xs text-foreground bg-accent px-3 py-1.5 rounded-full animate-pulse border border-border shadow-sm">
                                                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                                                    Generating Coach Review...
                                                </span>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Input */}
                            <div className="p-4 border-t border-border bg-accent/30 shrink-0">
                                <div className="flex gap-2 w-full">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Type your question or click a guide question to auto-fill..."
                                        disabled={!simulationId || sending}
                                        className="bg-background border-input text-foreground placeholder:text-muted-foreground shadow-sm h-11 text-sm px-4"
                                    />
                                    <Button
                                        onClick={sendMessage}
                                        disabled={!simulationId || !inputValue.trim() || sending}
                                        className="bg-primary hover:bg-primary/90 shadow-sm w-11 h-11 rounded-md"
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </Card>

                        {/* Right: Coverage Panel */}
                        <Card className="w-[400px] bg-white border-border flex flex-col overflow-hidden shadow-sm shrink-0 min-h-0">
                            <CardHeader className="py-3 px-4 border-b border-border bg-accent/30 shrink-0">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        <ListChecks className="h-4 w-4 text-foreground" />
                                        Guide Coverage
                                    </CardTitle>
                                    {coverageSummary && (
                                        <div className="flex items-center gap-1.5">
                                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 bg-accent text-foreground border-border">
                                                {coverageSummary.covered}/{coverageSummary.total}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>

                            <ScrollArea className="flex-1 h-0 w-full">
                                <div className="p-3 space-y-3 w-full">
                                    {coverage.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <ListChecks className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-xs">No guide questions set up</p>
                                            <p className="text-[10px] mt-1">Add questions in project settings</p>
                                        </div>
                                    ) : (
                                        Object.values(coverageBySet).map(({ set, items }) => (
                                            <div key={set.id} className="border border-border rounded-lg overflow-hidden">
                                                {/* Set Header */}
                                                <button
                                                    onClick={() => toggleSet(set.id)}
                                                    className="w-full flex items-start justify-between p-2.5 bg-accent hover:bg-muted transition-colors text-left"
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-xs font-semibold text-foreground leading-snug">
                                                            {set.title}
                                                        </h4>
                                                        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed whitespace-normal break-words">
                                                            {set.intent}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-2">
                                                        <Badge variant="outline" className="text-[10px] h-4 px-1 bg-white">
                                                            {items.filter(i => i.status === 'COVERED').length}/{items.length}
                                                        </Badge>
                                                        {expandedSets.has(set.id) ? (
                                                            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </button>

                                                {/* Questions */}
                                                {expandedSets.has(set.id) && (
                                                    <div className="divide-y divide-accent">
                                                        {items
                                                            .sort((a, b) => {
                                                                // Sort main questions by order, sub-questions follow their parent
                                                                const aIsMain = !a.question.parentId;
                                                                const bIsMain = !b.question.parentId;
                                                                if (aIsMain && bIsMain) return a.question.order - b.question.order;
                                                                if (!aIsMain && !bIsMain) {
                                                                    if (a.question.parentId === b.question.parentId) {
                                                                        return a.question.order - b.question.order;
                                                                    }
                                                                }
                                                                // Sub-questions come after their parent
                                                                const aParent = aIsMain ? a : items.find(i => i.questionId === a.question.parentId);
                                                                const bParent = bIsMain ? b : items.find(i => i.questionId === b.question.parentId);
                                                                if (aParent && bParent) {
                                                                    if (aParent.questionId === bParent.questionId) {
                                                                        // Same parent - main comes first, then subs by order
                                                                        if (aIsMain) return -1;
                                                                        if (bIsMain) return 1;
                                                                        return a.question.order - b.question.order;
                                                                    }
                                                                    return aParent.question.order - bParent.question.order;
                                                                }
                                                                return 0;
                                                            })
                                                            .map((item) => {
                                                                const isSubQuestion = !!item.question.parentId;
                                                                const label = getQuestionLabel(item, items);

                                                                return (
                                                                    <button
                                                                        key={item.id}
                                                                        onClick={() => useQuestion(item.question.text)}
                                                                        className={`w-full p-2.5 text-left hover:bg-accent transition-colors flex items-start gap-2 group/q ${item.status === 'IN_PROGRESS' ? 'bg-amber-50/50 border-l-2 border-amber-400' : ''
                                                                            } ${isSubQuestion ? 'pl-6 bg-accent/30' : ''}`}
                                                                        title="Click to use this question"
                                                                    >
                                                                        {/* Question Label */}
                                                                        <span className={`text-[10px] font-mono pt-0.5 w-6 text-right shrink-0 ${isSubQuestion ? 'text-[var(--color-info)]' : 'text-muted-foreground font-semibold'
                                                                            }`}>
                                                                            {label}.
                                                                        </span>

                                                                        {/* Status Icon */}
                                                                        <div className="mt-0.5 shrink-0 group-hover/q:text-primary transition-colors">
                                                                            {item.status === 'COVERED' ? (
                                                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                                            ) : item.status === 'IN_PROGRESS' ? (
                                                                                <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
                                                                            ) : item.status === 'SKIPPED' ? (
                                                                                <SkipForward className="h-4 w-4 text-red-400" />
                                                                            ) : (
                                                                                <Target className="h-4 w-4 text-muted-foreground group-hover/q:text-primary" />
                                                                            )}
                                                                        </div>

                                                                        {/* Question Text */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className={`text-xs leading-relaxed whitespace-normal break-words ${item.status === 'COVERED' ? 'text-muted-foreground line-through' :
                                                                                item.status === 'IN_PROGRESS' ? 'text-amber-900 font-medium' :
                                                                                    'text-foreground'
                                                                                }`}>
                                                                                {item.question.text}
                                                                            </p>

                                                                            {/* Status Badges */}
                                                                            <div className="flex items-center gap-1 mt-1">
                                                                                {item.isOutOfOrder && (
                                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-orange-50 text-orange-600 border-orange-200">
                                                                                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                                                                        Out of order
                                                                                    </Badge>
                                                                                )}
                                                                                {item.matchedCount > 1 && (
                                                                                    <Badge variant="outline" className="text-[9px] h-4 px-1 bg-blue-50 text-blue-600 border-blue-200">
                                                                                        ×{item.matchedCount}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Coverage Summary Footer */}
                            {coverageSummary && coverageSummary.total > 0 && (
                                <div className="p-3 border-t border-border bg-accent/50">
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3 text-primary" />
                                                {coverageSummary.covered}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-amber-500" />
                                                {coverageSummary.inProgress}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Circle className="h-3 w-3 text-muted-foreground" />
                                                {coverageSummary.notStarted}
                                            </span>
                                        </div>
                                        <span className="text-muted-foreground">
                                            Click to mark current
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
