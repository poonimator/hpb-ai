"use client";

import { useState, useEffect, useRef, use, Suspense, useCallback, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { AIFeedback } from "@/components/ai/feedback";
import { useRouter, useSearchParams } from "next/navigation";
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
    CheckCircle2,
    Sparkles,
    Heart,
    AlertCircle,
    Plus,
    BookOpen,
    Mic,
    MicOff,
    Lightbulb,
    SlidersHorizontal,
    X,
    ChevronDown,
    Zap,
    Users,
    ImagePlus
} from "lucide-react";
import { PageBar } from "@/components/layout/page-bar";
import { ChatBubble } from "@/components/tools/chat-bubble";
import { OpportunityCard } from "@/components/tools/opportunity-card";
import { ModeratorGuidePanel } from "@/components/tools/moderator-guide-panel";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ParsedPersona {
    name?: string;
    age?: string;
    occupation?: string;
    summary?: string;
    bio?: string;
    gains?: string;
    pains?: string;
    recommendedSettings?: MixerSettings;
}

interface PersonaDoc {
    id: string;
    title: string;
    docType: string;
    status: string;
    parsedMetaJson?: string;
}

interface GuideVersion {
    id: string;
    name: string;
    versionNumber: number;
    guideSets?: Array<{
        id: string;
        title: string;
        questions: Array<{
            id: string;
            text: string;
            subQuestions?: Array<{ id: string; text: string }>;
        }>;
    }>;
}

interface Message {
    id: string;
    role: "user" | "persona";
    content: string;
    timestamp: string;
    imageBase64?: string | null;
    archetypeId?: string | null;
    archetypeName?: string | null;
}

interface MixerSettings {
    emotionalTone: number;
    responseLength: "short" | "medium" | "long";
    thinkingStyle: "concrete" | "abstract";
    moodSwings: number;
    singlishLevel: number;
}

interface SubProject {
    id: string;
    name: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;
    project: {
        id: string;
        name: string;
    };
}

interface ArchetypeItem {
    id: string;
    name: string;
    kicker: string | null;
    description: string;
    demographicJson: string | null;
    fullContentJson: string | null;
    goalsJson: string | null;
    motivationsJson: string | null;
    order: number;
}

// Individual opportunity insight from coach
interface OpportunityInsight {
    quote: string;
    surfacedContext: string;
    testableAssumption: string | null;
    explorationDirection: string | null;
}

// Live Coach Types
interface LiveCoachNudge {
    id: string;
    timestamp: string;
    messageId: string; // ID of the persona message this nudge is for
    opportunities: OpportunityInsight[]; // Array of opportunities (max 2)
    coachingNudge: string | null; // Legacy field for backwards compatibility
    highlightQuote: string | null; // Legacy field for backwards compatibility
    suggestedGuideQuestion: {
        questionId: string;
        questionText: string;
        reason: string;
    } | null;
    missedOpportunity: boolean;
}

interface PageProps {
    params: Promise<{ projectId: string; subProjectId: string }>;
}

const DEFAULT_MIXER: MixerSettings = {
    emotionalTone: 50,
    responseLength: "medium",
    thinkingStyle: "concrete",
    moodSwings: 25,
    singlishLevel: 50,
};

function getMixerLabel(value: number, type: "tone" | "singlish" | "mood") {
    const stops = [0, 25, 50, 75, 100];
    const snapped = stops.reduce((prev, curr) =>
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );

    if (type === "tone") {
        const labels: Record<number, string> = {
            0: "Very Reserved", 25: "Reserved", 50: "Neutral", 75: "Expressive", 100: "Very Expressive"
        };
        return labels[snapped] || "Neutral";
    }
    if (type === "singlish") {
        const labels: Record<number, string> = {
            0: "Formal English", 25: "Standard", 50: "Light Singlish", 75: "Casual Singlish", 100: "Full Singlish"
        };
        return labels[snapped] || "Light Singlish";
    }
    if (type === "mood") {
        const labels: Record<number, string> = {
            0: "Very Stable", 25: "Stable", 50: "Moderate", 75: "Variable", 100: "Highly Variable"
        };
        return labels[snapped] || "Moderate";
    }
    return "";
}

function snapToStop(value: number): number {
    const stops = [0, 25, 50, 75, 100];
    return stops.reduce((prev, curr) =>
        Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
}

function parsePersonaMeta(persona: PersonaDoc): ParsedPersona {
    try {
        if (persona.parsedMetaJson) {
            return JSON.parse(persona.parsedMetaJson);
        }
    } catch { }
    return { name: persona.title };
}

// Typewriter effect component - animates text word by word
interface TypewriterTextProps {
    text: string;
    onComplete: () => void;
    wordsPerSecond?: number;  // Speed control (default ~4 words/sec for natural reading)
    className?: string;
}

function TypewriterText({ text, onComplete, wordsPerSecond = 4, className = "" }: TypewriterTextProps) {
    const [displayedWords, setDisplayedWords] = useState<number>(0);
    const [trackedText, setTrackedText] = useState<string>(text);
    const words = text.split(/(\s+)/); // Split but keep whitespace

    // Reset counter when the text prop changes (render-time pattern, not useEffect).
    if (text !== trackedText) {
        setTrackedText(text);
        setDisplayedWords(0);
    }

    useEffect(() => {
        if (displayedWords >= words.length) {
            onComplete();
            return;
        }

        // Calculate delay based on words per second
        // Use variable timing for more natural feel
        const baseDelay = 1000 / wordsPerSecond;
        const randomVariation = (Math.random() - 0.5) * baseDelay * 0.3; // ±15% variation
        const delay = baseDelay + randomVariation;

        const timer = setTimeout(() => {
            setDisplayedWords(prev => prev + 1);
        }, delay);

        return () => clearTimeout(timer);
    }, [displayedWords, words.length, wordsPerSecond, onComplete]);

    const visibleText = words.slice(0, displayedWords).join('');
    const isComplete = displayedWords >= words.length;

    return (
        <span className={className}>
            {visibleText}
            {!isComplete && (
                <span className="inline-block w-0.5 h-[1em] bg-muted-foreground ml-0.5 animate-pulse align-text-bottom" />
            )}
        </span>
    );
}

function SimulationPageContent({ params }: PageProps) {
    const { projectId, subProjectId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const resumeId = searchParams.get("resume");

    // State
    const [subProject, setSubProject] = useState<SubProject | null>(null);
    const [personas, setPersonas] = useState<PersonaDoc[]>([]);
    const [archetypes, setArchetypes] = useState<ArchetypeItem[]>([]);
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
    const [selectionType, setSelectionType] = useState<"persona" | "archetype">("persona");
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [mixer, setMixer] = useState<MixerSettings>(DEFAULT_MIXER);
    const [defaultSettings, setDefaultSettings] = useState<MixerSettings | null>(null);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [resumedPersonaDetails, setResumedPersonaDetails] = useState<{ name: string; occupation?: string } | null>(null);

    // Focus Group state
    const [isFocusGroup, setIsFocusGroup] = useState(false);
    const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<string[]>([]);
    const [focusGroupArchetypes, setFocusGroupArchetypes] = useState<ArchetypeItem[]>([]);
    const [showAtMention, setShowAtMention] = useState(false);

    const ARCHETYPE_COLORS = [
        { bg: "bg-violet-50/50", border: "border-violet-100", text: "text-violet-800", avatar: "bg-violet-200/70", avatarText: "text-violet-900" },
        { bg: "bg-amber-50/50", border: "border-amber-100", text: "text-amber-800", avatar: "bg-amber-200/70", avatarText: "text-amber-900" },
        { bg: "bg-sky-50/50", border: "border-sky-100", text: "text-sky-800", avatar: "bg-sky-200/70", avatarText: "text-sky-900" },
        { bg: "bg-rose-50/50", border: "border-rose-100", text: "text-rose-800", avatar: "bg-rose-200/70", avatarText: "text-rose-900" },
        { bg: "bg-emerald-50/50", border: "border-emerald-100", text: "text-emerald-800", avatar: "bg-emerald-200/70", avatarText: "text-emerald-900" },
    ];

    // Get a distinctive initial from archetype name (skip "The" prefix)
    const getInitial = (name: string) => {
        const words = name.trim().split(/\s+/);
        const meaningful = words.length > 1 && words[0].toLowerCase() === "the" ? words[1] : words[0];
        return meaningful.charAt(0).toUpperCase();
    };

    const getArchetypeColor = (archetypeId: string) => {
        const allArchs = isFocusGroup ? focusGroupArchetypes : [];
        const idx = allArchs.findIndex(a => a.id === archetypeId);
        return ARCHETYPE_COLORS[idx >= 0 ? idx % ARCHETYPE_COLORS.length : 0];
    };

    // Guide selection
    const [guides, setGuides] = useState<GuideVersion[]>([]);
    const [selectedGuideId, setSelectedGuideId] = useState<string>("none");
    const [showConfig, setShowConfig] = useState(false);

    // Voice Dictation
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    const isModified = defaultSettings && (
        defaultSettings.emotionalTone !== mixer.emotionalTone ||
        defaultSettings.moodSwings !== mixer.moodSwings ||
        defaultSettings.singlishLevel !== mixer.singlishLevel ||
        defaultSettings.responseLength !== mixer.responseLength ||
        defaultSettings.thinkingStyle !== mixer.thinkingStyle
    );

    // Apply Recommended Settings when Persona changes
    useEffect(() => {
        if (!selectedPersonaId) return;
        const persona = personas.find(p => p.id === selectedPersonaId);
        if (!persona) return;

        const meta = parsePersonaMeta(persona);
        if (meta.recommendedSettings) {
            setMixer(meta.recommendedSettings);
            setDefaultSettings(meta.recommendedSettings);
            // Optional: Add toast here
        } else {
            // Reset to default if no recommendations? Or keep previous?
            // Usually reset or keep default
            setMixer(DEFAULT_MIXER);
            setDefaultSettings(DEFAULT_MIXER);
        }
    }, [selectedPersonaId, personas]);

    const saveRecommendedSettings = async () => {
        if (!selectedPersonaId) return;
        const persona = personas.find(p => p.id === selectedPersonaId);
        if (!persona) return;

        setIsSavingSettings(true);
        try {
            const meta = parsePersonaMeta(persona);
            const newMeta = { ...meta, recommendedSettings: mixer };

            const res = await fetch(`/api/personas/${selectedPersonaId}/meta`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ meta: newMeta, isProjectKb: true })
            });

            if (res.ok) {
                // Update local persona state to reflect saved changes
                const updatedPersona = { ...persona, parsedMetaJson: JSON.stringify(newMeta) };
                setPersonas(prev => prev.map(p => p.id === selectedPersonaId ? updatedPersona : p));
                setDefaultSettings(mixer);
            }
        } catch (error) {
            console.error("Failed to save settings", error);
        } finally {
            setIsSavingSettings(false);
        }
    };


    const [loading, setLoading] = useState(true);
    const [simulationId, setSimulationId] = useState<string | null>(resumeId);
    const [isStarted, setIsStarted] = useState(!!resumeId);
    const [isSending, setIsSending] = useState(false);
    const [isEnding, setIsEnding] = useState(false);

    // Live Coach State
    const [activePanel, setActivePanel] = useState<"guide" | "coach">("guide");
    const [coachNudges, setCoachNudges] = useState<LiveCoachNudge[]>([]);
    const [coveredQuestionIds, setCoveredQuestionIds] = useState<Set<string>>(new Set());
    const [isCoachLoading, setIsCoachLoading] = useState(false);
    const liveCoachScrollRef = useRef<HTMLDivElement>(null);

    // Expanded opportunity state - tracks which opportunity card is expanded (by unique ID)
    const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>(null);

    // Selected highlight quote state - for click-to-scroll from chat bubble to opportunity card
    const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
    const opportunityRefs = useRef<Map<string, HTMLDivElement>>(new Map());

    // Highlighted question state - for Live Coach suggestions shown in Moderator Guide
    const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);
    const [highlightedQuestionReason, setHighlightedQuestionReason] = useState<string | null>(null);
    const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const guideScrollAreaRef = useRef<HTMLDivElement>(null);

    // Normalise whitespace for quote-equality matching
    const normaliseQuote = (s: string) => s.trim().replace(/\s+/g, " ");

    // Click handler for chat bubble highlights — scroll to & expand matching opportunity card
    const handlePickQuote = (quote: string) => {
        const normalised = normaliseQuote(quote);
        if (!normalised) return;

        // If clicking the already-selected quote, deselect and collapse
        if (selectedQuote === normalised) {
            setSelectedQuote(null);
            setExpandedOpportunityId(null);
            return;
        }

        // Find matching opportunity across all nudges
        let matchedId: string | null = null;
        for (const nudge of coachNudges) {
            if (nudge.opportunities && nudge.opportunities.length > 0) {
                const idx = nudge.opportunities.findIndex(
                    (opp) => opp.quote && normaliseQuote(opp.quote) === normalised
                );
                if (idx !== -1) {
                    matchedId = `${nudge.id}-opp-${idx}`;
                    break;
                }
            } else if (nudge.coachingNudge && nudge.highlightQuote) {
                if (normaliseQuote(nudge.highlightQuote) === normalised) {
                    matchedId = nudge.id;
                    break;
                }
            }
        }

        if (!matchedId) return;

        setSelectedQuote(normalised);
        setExpandedOpportunityId(matchedId);

        setTimeout(() => {
            opportunityRefs.current.get(matchedId!)?.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }, 100);
    };

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image attachment state
    const [attachedImage, setAttachedImage] = useState<{ base64: string; previewUrl: string } | null>(null);

    const handleImageAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("Image must be under 5MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result as string;
            setAttachedImage({ base64, previewUrl: base64 });
        };
        reader.readAsDataURL(file);
        // Reset file input so the same file can be re-selected
        e.target.value = "";
    };

    // Typewriter animation state - tracks which message is currently animating
    const [typingMessageId, setTypingMessageId] = useState<string | null>(null);


    useEffect(() => {
        fetchData();
    }, [subProjectId, projectId]);

    useEffect(() => {
        if (resumeId) {
            loadExistingSimulation(resumeId);
        }
    }, [resumeId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, [messages]);

    const fetchData = async () => {
        try {
            const subProjectRes = await fetch(`/api/sub-projects/${subProjectId}`);
            if (subProjectRes.ok) {
                const data = await subProjectRes.json();
                setSubProject(data.data);

                // Set guides from sub-project data
                if (data.data.guideVersions?.length > 0) {
                    setGuides(data.data.guideVersions);
                }

                // Extract archetypes from completed sessions
                const allArchetypes: ArchetypeItem[] = [];
                if (data.data.archetypeSessions?.length > 0) {
                    for (const session of data.data.archetypeSessions) {
                        if (session.archetypes?.length > 0) {
                            allArchetypes.push(...session.archetypes);
                        }
                    }
                }
                setArchetypes(allArchetypes);
            }

            const personasRes = await fetch(`/api/projects/${projectId}/kb?docType=PERSONA`);
            if (personasRes.ok) {
                const data = await personasRes.json();
                const approvedPersonas = (data.data || []).filter(
                    (p: PersonaDoc) => p.status === "APPROVED"
                );
                setPersonas(approvedPersonas);
                if (approvedPersonas.length > 0 && !selectedPersonaId && !resumeId) {
                    setSelectedPersonaId(approvedPersonas[0].id);
                    setSelectionType("persona");
                }
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadExistingSimulation = async (simId: string) => {
        try {
            const res = await fetch(`/api/simulations/${simId}`);
            if (res.ok) {
                const data = await res.json();
                const sim = data.data;
                setMessages(sim.messages || []);
                setIsStarted(true);
                if (sim.mixerJson) {
                    setMixer(JSON.parse(sim.mixerJson));
                }
                // Restore the selected guide from the simulation
                if (sim.guideVersionId) {
                    setSelectedGuideId(sim.guideVersionId);
                } else if (sim.guideVersion?.id) {
                    setSelectedGuideId(sim.guideVersion.id);
                }
                // Restore persona/archetype selection
                if (sim.isFocusGroup && sim.simulationArchetypes?.length > 0) {
                    // Focus group resume
                    setIsFocusGroup(true);
                    const fgArchs = sim.simulationArchetypes.map((sa: { archetype: ArchetypeItem }) => sa.archetype);
                    setFocusGroupArchetypes(fgArchs);
                    setSelectedArchetypeIds(fgArchs.map((a: ArchetypeItem) => a.id));
                    // Build name lookup for messages
                    const nameMap: Record<string, string> = {};
                    for (const a of fgArchs) nameMap[a.id] = a.name;
                    // Annotate messages with archetype names
                    if (sim.messages) {
                        setMessages(sim.messages.map((m: Message) => ({
                            ...m,
                            archetypeName: m.archetypeId ? (nameMap[m.archetypeId] || null) : null,
                        })));
                    }
                } else if (sim.archetypeId && sim.archetype) {
                    setSelectedPersonaId(sim.archetypeId);
                    setSelectionType("archetype");
                    // Store persona details directly from API response (race-condition-proof)
                    setResumedPersonaDetails({
                        name: sim.archetype.name,
                        occupation: sim.archetype.kicker || undefined,
                    });
                } else if (sim.projectPersonaDocId && sim.projectPersonaDoc) {
                    setSelectedPersonaId(sim.projectPersonaDocId);
                    setSelectionType("persona");
                    // Store persona details directly from API response (race-condition-proof)
                    const meta = sim.projectPersonaDoc.parsedMetaJson
                        ? (() => { try { return JSON.parse(sim.projectPersonaDoc.parsedMetaJson); } catch { return null; } })()
                        : null;
                    setResumedPersonaDetails({
                        name: meta?.name || sim.projectPersonaDoc.title || "Persona",
                        occupation: meta?.occupation || undefined,
                    });
                }

                // Restore Live Coach data
                console.log("[Resume] Coach data from API:", {
                    coachNudges: sim.coachNudges,
                    coveredQuestionIds: sim.coveredQuestionIds
                });
                if (sim.coachNudges && Array.isArray(sim.coachNudges)) {
                    console.log("[Resume] Setting coachNudges:", sim.coachNudges.length, "nudges");
                    setCoachNudges(sim.coachNudges);
                }
                if (sim.coveredQuestionIds && Array.isArray(sim.coveredQuestionIds)) {
                    console.log("[Resume] Setting coveredQuestionIds:", sim.coveredQuestionIds);
                    setCoveredQuestionIds(new Set(sim.coveredQuestionIds));
                }
            }
        } catch (err) {
            console.error("Failed to load simulation:", err);
        }
    };

    const startSimulation = async () => {
        if (isFocusGroup) {
            if (selectedArchetypeIds.length < 2) {
                alert("Please select at least 2 archetypes for a focus group");
                return;
            }
            if (selectedArchetypeIds.length > 5) {
                alert("Maximum 5 archetypes in a focus group");
                return;
            }
        } else if (!selectedPersonaId) {
            alert("Please select a persona or archetype");
            return;
        }

        try {
            const bodyPayload = isFocusGroup
                ? {
                    subProjectId,
                    isFocusGroup: true,
                    archetypeIds: selectedArchetypeIds,
                    mode: "dojo",
                }
                : {
                    subProjectId,
                    guideVersionId: selectedGuideId !== "none" ? selectedGuideId : undefined,
                    ...(selectionType === "archetype"
                        ? { archetypeId: selectedPersonaId }
                        : { projectPersonaDocId: selectedPersonaId }
                    ),
                    mode: "dojo",
                    mixerSettings: mixer,
                };

            const res = await fetch("/api/simulations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyPayload),
            });

            if (!res.ok) throw new Error("Failed to start simulation");

            const data = await res.json();
            setSimulationId(data.data.id);
            setIsStarted(true);

            // Set focus group archetypes for the chat session
            if (isFocusGroup) {
                const fgArchs = archetypes.filter(a => selectedArchetypeIds.includes(a.id));
                setFocusGroupArchetypes(fgArchs);
            }

            router.replace(`/projects/${projectId}/sub/${subProjectId}/simulate?resume=${data.data.id}`);
        } catch (err) {
            alert("Failed to start simulation");
        }
    };


    // Voice Dictation Logic
    const startTextRef = useRef("");
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            return;
        }

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition. Please try Chrome.");
            return;
        }

        // Store the persistent text
        startTextRef.current = inputMessage;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            const baseText = startTextRef.current;
            const spacer = (baseText && baseText.length > 0 && !baseText.endsWith(' ')) ? ' ' : '';
            setInputMessage(baseText + spacer + transcript);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            if (event.error === 'not-allowed') {
                alert("Microphone access denied. Please check your settings.");
            }
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const sendMessage = async () => {
        if ((!inputMessage.trim() && !attachedImage) || !simulationId || isSending) return;

        const userMessage = inputMessage.trim();
        const imageData = attachedImage?.base64 || null;
        setInputMessage("");
        setAttachedImage(null);
        setShowAtMention(false);
        setIsSending(true);

        // Parse @mentions for focus group
        let targetArchetypeIds: string[] | undefined;
        let cleanedMessage = userMessage;
        if (isFocusGroup && focusGroupArchetypes.length > 0) {
            const taggedIds: string[] = [];
            for (const arch of focusGroupArchetypes) {
                const tagPattern = new RegExp(`@${arch.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
                if (tagPattern.test(userMessage)) {
                    taggedIds.push(arch.id);
                    cleanedMessage = cleanedMessage.replace(tagPattern, '').trim();
                }
            }
            if (taggedIds.length > 0) {
                targetArchetypeIds = taggedIds;
            }
        }

        const tempUserMessage: Message = {
            id: `temp-${Date.now()}`,
            role: "user",
            content: userMessage || (imageData ? "[Shared an image]" : ""),
            timestamp: new Date().toISOString(),
            imageBase64: imageData,
        };
        setMessages(prev => [...prev, tempUserMessage]);

        try {
            await fetch("/api/simulations/message", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    simulationId,
                    content: userMessage || "[Shared an image]",
                    role: "user",
                    imageBase64: imageData,
                }),
            });

            const aiRes = await fetch("/api/gemini/simulate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    simulationId,
                    content: cleanedMessage || "Please look at this image and respond as you would in character.",
                    imageBase64: imageData,
                    ...(targetArchetypeIds ? { targetArchetypeIds } : {}),
                }),
            });

            if (aiRes.ok) {
                const aiData = await aiRes.json();

                if (isFocusGroup && aiData.data.focusGroup) {
                    // Focus group: multiple messages
                    const fgMessages: Array<{ id: string; content: string; archetypeId: string; archetypeName: string; timestamp: string }> = aiData.data.messages || [];

                    for (const fgMsg of fgMessages) {
                        setTypingMessageId(fgMsg.id);
                        setMessages(prev => [...prev, {
                            id: fgMsg.id,
                            role: "persona",
                            content: fgMsg.content,
                            timestamp: fgMsg.timestamp,
                            archetypeId: fgMsg.archetypeId,
                            archetypeName: fgMsg.archetypeName,
                        }]);
                        // Small delay between messages for readability
                        await new Promise(r => setTimeout(r, 300));
                    }

                    // Call Live Coach with combined focus group responses (non-blocking)
                    if (fgMessages.length > 0) {
                        const combinedResponse = fgMessages
                            .map(m => `${m.archetypeName}: "${m.content}"`)
                            .join("\n\n");
                        const lastMsgId = fgMessages[fgMessages.length - 1].id;
                        fetchLiveCoach(userMessage, combinedResponse, lastMsgId);
                    }
                } else {
                    // Standard 1:1 mode
                    const personaResponse = aiData.data.message.content;
                    const personaMessageId = aiData.data.message.id;

                    setTypingMessageId(personaMessageId);
                    setMessages(prev => [...prev, {
                        id: personaMessageId,
                        role: "persona",
                        content: personaResponse,
                        timestamp: aiData.data.message.timestamp,
                    }]);

                    // Clear any highlighted guide question when persona responds
                    setHighlightedQuestionId(null);
                    setHighlightedQuestionReason(null);

                    // Call Live Coach after persona responds (non-blocking)
                    fetchLiveCoach(userMessage, personaResponse, personaMessageId);
                }
            }
        } catch (err) {
            console.error("Failed to send message:", err);
        } finally {
            setIsSending(false);
            inputRef.current?.focus();
        }
    };

    // Save coach state to database (debounced/non-blocking)
    const saveCoachState = useCallback(async (nudges: LiveCoachNudge[] | null, coveredIds: string[] | null) => {
        if (!simulationId) return;

        try {
            const body: { coachNudges?: LiveCoachNudge[]; coveredQuestionIds?: string[] } = {};
            if (nudges !== null) body.coachNudges = nudges;
            if (coveredIds !== null) body.coveredQuestionIds = coveredIds;

            console.log("[SaveCoach] Saving to API:", {
                simulationId,
                nudgesCount: nudges?.length,
                coveredIdsCount: coveredIds?.length,
                body
            });

            const res = await fetch(`/api/simulations/${simulationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const result = await res.json();
            console.log("[SaveCoach] API response:", result);
        } catch (err) {
            console.error("Failed to save coach state:", err);
        }
    }, [simulationId]);

    // Fetch live coaching feedback
    const fetchLiveCoach = useCallback(async (interviewerQuestion: string, personaResponse: string, messageId: string) => {
        if (!simulationId) return;

        setIsCoachLoading(true);

        try {
            const res = await fetch("/api/gemini/live-coach", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    simulationId,
                    latestInterviewerQuestion: interviewerQuestion,
                    latestPersonaResponse: personaResponse,
                    coveredQuestionIds: Array.from(coveredQuestionIds)
                }),
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    const coachData = data.data;

                    let newNudgeToSave: LiveCoachNudge | null = null;
                    let newCoveredIds: string[] = [];

                    // Add nudge to history if there are opportunities or a suggested question
                    if ((coachData.opportunities && coachData.opportunities.length > 0) || coachData.suggestedGuideQuestion) {
                        const newNudge: LiveCoachNudge = {
                            id: `nudge-${Date.now()}`,
                            timestamp: new Date().toISOString(),
                            messageId: messageId,
                            opportunities: coachData.opportunities || [],
                            coachingNudge: coachData.coachingNudge,
                            highlightQuote: coachData.highlightQuote || null,
                            suggestedGuideQuestion: coachData.suggestedGuideQuestion,
                            missedOpportunity: coachData.missedOpportunity
                        };
                        newNudgeToSave = newNudge;
                        setCoachNudges(prev => {
                            const updated = [...prev, newNudge];
                            // Save to database (async, non-blocking)
                            saveCoachState(updated, null);
                            return updated;
                        });

                        // DISABLED: Coach Suggests feature temporarily paused
                        // If there's a suggested guide question, highlight it and auto-scroll
                        // if (coachData.suggestedGuideQuestion?.questionId) {
                        //     setHighlightedQuestionId(coachData.suggestedGuideQuestion.questionId);
                        //     setHighlightedQuestionReason(coachData.suggestedGuideQuestion.reason || null);
                        //
                        //     // Auto-scroll to the question in the guide
                        //     setTimeout(() => {
                        //         const questionElement = questionRefs.current.get(coachData.suggestedGuideQuestion.questionId);
                        //         if (questionElement) {
                        //             questionElement.scrollIntoView({ behavior: "smooth", block: "center" });
                        //         }
                        //     }, 150);
                        // }
                    }

                    // Mark newly covered questions
                    if (coachData.newlyCoveredQuestionIds?.length > 0) {
                        newCoveredIds = coachData.newlyCoveredQuestionIds;
                        setCoveredQuestionIds(prev => {
                            const updated = new Set(prev);
                            coachData.newlyCoveredQuestionIds.forEach((id: string) => updated.add(id));
                            // Save to database (async, non-blocking)
                            saveCoachState(null, Array.from(updated));
                            return updated;
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Live coach error:", err);
        } finally {
            setIsCoachLoading(false);
        }
    }, [simulationId, coveredQuestionIds, saveCoachState]);


    const endSimulation = async () => {
        if (!simulationId || isEnding) return;
        if (!confirm("End this simulation and generate a coach review?")) return;

        setIsEnding(true);
        try {
            await fetch("/api/simulations/end", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ simulationId }),
            });
            router.push(`/simulations/${simulationId}`);
        } catch (err) {
            console.error("Failed to end simulation:", err);
            setIsEnding(false);
        }
    };

    // Elapsed session time — derived from first message timestamp.
    // Declared BEFORE any early return to preserve Rules of Hooks ordering.
    const elapsedLabel = useMemo(() => {
        if (!messages.length) return "0 min";
        const firstRaw = messages[0]?.timestamp;
        const first = firstRaw ? new Date(firstRaw).getTime() : Date.now();
        const totalMin = Math.max(0, Math.round((Date.now() - first) / 60000));
        if (totalMin < 60) return `${totalMin} min`;
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        if (h < 24) return `${h}h ${m}m`;
        const d = Math.floor(h / 24);
        const rh = h % 24;
        return `${d}d ${rh}h ${m}m`;
    }, [messages]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-[color:var(--canvas)]">
                <Loader2 className="h-12 w-12 animate-spin text-[color:var(--primary)]" />
            </div>
        );
    }

    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    const selectedArchetype = archetypes.find(a => a.id === selectedPersonaId);
    const selectedPersonaDetails = selectionType === "archetype" && selectedArchetype
        ? { name: selectedArchetype.name, occupation: selectedArchetype.kicker || undefined }
        : selectedPersona ? parsePersonaMeta(selectedPersona)
            : resumedPersonaDetails;

    const activeGuide = guides.find(g => g.id === selectedGuideId);
    const hasActiveGuide = isStarted && selectedGuideId && selectedGuideId !== "none" && !!activeGuide;

    // Build crumbs for PageBar (setup mode)
    const setupCrumbs = subProject?.name
        ? [
            { label: subProject.project?.name || "Project", href: `/projects/${projectId}` },
            { label: subProject.name, href: `/projects/${projectId}/sub/${subProjectId}?tab=simulations` },
            { label: "New Simulation" },
        ]
        : undefined;

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {isStarted ? (
                <>
                    {/* Session header — dedicated live chrome, rebuilt with design tokens */}
                    <div
                        data-slot="session-header"
                        className="w-screen ml-[calc(50%_-_50vw)] bg-[color:var(--surface)] border-b border-[color:var(--border-subtle)]"
                    >
                        <div className="flex items-center justify-between gap-4 py-[14px] px-8">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <Link
                                    href={`/projects/${projectId}/sub/${subProjectId}?tab=simulations`}
                                    className="inline-flex items-center gap-1.5 text-ui-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                    aria-label={`Back to ${subProject?.name || "Workspace"}`}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back</span>
                                </Link>
                                <div className="w-px h-[22px] bg-[color:var(--border)]" />
                                {isFocusGroup && focusGroupArchetypes.length > 0 ? (
                                    <>
                                        <div className="flex items-center -space-x-1.5 shrink-0">
                                            {focusGroupArchetypes.map((arch) => {
                                                const color = getArchetypeColor(arch.id);
                                                return (
                                                    <div
                                                        key={arch.id}
                                                        className={`h-8 w-8 rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} font-semibold text-[11px] shadow-inset-edge ring-2 ring-[color:var(--surface)]`}
                                                    >
                                                        {getInitial(arch.name)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="min-w-0">
                                            <h1 className="text-display-4 text-foreground leading-tight">Focus Group</h1>
                                            <p className="text-caption text-muted-foreground truncate">
                                                {focusGroupArchetypes.map(a => a.name).join(" · ")}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="h-9 w-9 rounded-full bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center font-semibold text-[13px] shrink-0">
                                            {(selectedPersonaDetails?.name || "P").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h1 className="text-display-4 text-foreground leading-tight truncate">
                                                {selectedPersonaDetails?.name || "Interview Simulation"}
                                            </h1>
                                            <p className="text-caption text-muted-foreground truncate">
                                                {selectedPersonaDetails?.occupation || subProject?.name || "Workspace"}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <span
                                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider"
                                    style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)' }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-info)' }} />
                                    In Progress
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={endSimulation}
                                    disabled={isEnding}
                                    className="gap-1.5 border-[color:var(--border)] text-[color:var(--destructive)] hover:bg-[color:var(--destructive)]/10 hover:text-[color:var(--destructive)]"
                                >
                                    {isEnding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Square className="h-3.5 w-3.5" />}
                                    End Session
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Live workspace — inline identity + optional guide · chat · opportunities */}
                    <WorkspaceFrame
                        variant="platform"
                        scrollContained
                        leftRail={
                            <>
                                <RailHeader>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">
                                            In Progress
                                        </Badge>
                                        <span className="text-caption text-muted-foreground">
                                            · {elapsedLabel}
                                        </span>
                                    </div>
                                    <h2 className="text-display-4 text-foreground leading-tight">
                                        {subProject?.name || "Session"}
                                    </h2>
                                    {subProject?.researchStatement && (
                                        <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
                                            {subProject.researchStatement}
                                        </p>
                                    )}
                                </RailHeader>

                                <RailSection title={isFocusGroup ? "Participants" : "Participant"}>
                                    {isFocusGroup ? (
                                        <div className="flex flex-col gap-2">
                                            {focusGroupArchetypes.map((a) => (
                                                <div key={a.id} className="text-body-sm text-foreground truncate">
                                                    {a.name}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-body-sm text-foreground font-medium truncate">
                                                {resumedPersonaDetails?.name || personas.find(p => p.id === selectedPersonaId)?.title || "Persona"}
                                            </div>
                                            {resumedPersonaDetails?.occupation && (
                                                <div className="text-caption text-muted-foreground truncate mt-0.5">
                                                    {resumedPersonaDetails.occupation}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </RailSection>

                                {hasActiveGuide ? (
                                    <div ref={guideScrollAreaRef} className="flex-1 min-h-0 overflow-y-auto border-t border-[color:var(--border-subtle)] p-4">
                                        <ModeratorGuidePanel
                                            sections={(activeGuide?.guideSets || []).map((set) => ({
                                                id: set.id,
                                                title: set.title,
                                                questions: (set.questions || []).map((q) => ({
                                                    id: q.id,
                                                    text: q.text,
                                                    subQuestions: q.subQuestions,
                                                })),
                                            }))}
                                            coveredQuestionIds={coveredQuestionIds}
                                            highlightedQuestionId={highlightedQuestionId}
                                            highlightedQuestionReason={highlightedQuestionReason}
                                            registerRef={(id, el) => {
                                                if (el) questionRefs.current.set(id, el);
                                                else questionRefs.current.delete(id);
                                            }}
                                            onPickQuestion={(text) => {
                                                setInputMessage(text);
                                                inputRef.current?.focus();
                                            }}
                                            onPickSubQuestion={(text) => {
                                                setInputMessage(text);
                                                inputRef.current?.focus();
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex-1" />
                                )}
                            </>
                        }
                        rightRail={
                            <div
                                data-slot="opportunity-rail"
                                ref={liveCoachScrollRef}
                                className="flex flex-col min-h-0 flex-1 overflow-y-auto"
                            >
                                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[color:var(--border-subtle)] shrink-0 bg-[color:var(--surface)] sticky top-0 z-10">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center">
                                            <Lightbulb className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="text-ui-sm font-semibold text-foreground">Live Coach</span>
                                    </div>
                                    {isCoachLoading && (
                                        <span className="inline-flex items-center gap-1.5 text-caption text-[color:var(--knowledge)]">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Analysing
                                        </span>
                                    )}
                                </div>
                                <div className="flex-1 min-h-0 p-4 flex flex-col gap-2.5">
                                    {coachNudges.length === 0 && !isCoachLoading && (
                                        <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-2">
                                            <div className="h-10 w-10 rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge flex items-center justify-center">
                                                <Sparkles className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-body-sm text-muted-foreground max-w-[220px]">
                                                Opportunities will appear here as the conversation unfolds.
                                            </p>
                                        </div>
                                    )}
                                    {coachNudges.flatMap((nudge) => {
                                        const rows: React.ReactNode[] = [];
                                        if (nudge.opportunities && nudge.opportunities.length > 0) {
                                            nudge.opportunities.forEach((opp, oppIdx) => {
                                                const opportunityId = `${nudge.id}-opp-${oppIdx}`;
                                                const isExpanded = expandedOpportunityId === opportunityId;
                                                rows.push(
                                                    <OpportunityCard
                                                        key={opportunityId}
                                                        quote={opp.quote}
                                                        surfacedContext={opp.surfacedContext}
                                                        testableAssumption={opp.testableAssumption}
                                                        explorationDirection={opp.explorationDirection}
                                                        expanded={isExpanded}
                                                        onToggle={() => setExpandedOpportunityId(isExpanded ? null : opportunityId)}
                                                        onClose={() => setExpandedOpportunityId(null)}
                                                    />
                                                );
                                            });
                                        } else if (nudge.coachingNudge) {
                                            const legacyId = nudge.id;
                                            const isExpanded = expandedOpportunityId === legacyId;
                                            rows.push(
                                                <OpportunityCard
                                                    key={legacyId}
                                                    quote={nudge.highlightQuote}
                                                    surfacedContext={nudge.coachingNudge}
                                                    expanded={isExpanded}
                                                    onToggle={() => setExpandedOpportunityId(isExpanded ? null : legacyId)}
                                                    onClose={() => setExpandedOpportunityId(null)}
                                                />
                                            );
                                        }
                                        return rows;
                                    })}
                                    {isCoachLoading && (
                                        <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-4 flex items-start gap-3">
                                            <div className="h-8 w-8 rounded-[10px] bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)] shadow-inset-edge flex items-center justify-center shrink-0">
                                                <Sparkles className="h-4 w-4 animate-pulse" />
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[color:var(--knowledge)]">
                                                        Coach Analysing
                                                    </span>
                                                    <div className="flex gap-1">
                                                        <span className="w-1.5 h-1.5 bg-[color:var(--knowledge)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                        <span className="w-1.5 h-1.5 bg-[color:var(--knowledge)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                        <span className="w-1.5 h-1.5 bg-[color:var(--knowledge)] rounded-full animate-bounce" />
                                                    </div>
                                                </div>
                                                <p className="text-caption text-muted-foreground leading-relaxed">
                                                    Reviewing research &amp; identifying opportunities...
                                                </p>
                                                <div className="space-y-1.5 pt-1">
                                                    <div className="h-2 bg-[color:var(--surface-muted)] rounded-full animate-pulse w-[85%]" />
                                                    <div className="h-2 bg-[color:var(--surface-muted)] rounded-full animate-pulse w-[60%]" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        }
                        mainClassName="!p-0 !overflow-hidden relative flex flex-col"
                    >
                        {/* CENTER — chat + composer */}
                        <div
                            data-slot="chat-main"
                            className="relative flex flex-col flex-1 min-h-0 overflow-hidden"
                        >
                            <div className="flex-1 min-h-0 overflow-y-auto px-6 md:px-10 pt-8 pb-40">
                                <div className="mx-auto w-full max-w-[760px] flex flex-col gap-5">
                                    {messages.length === 0 && (
                                        <div className="text-center py-16">
                                            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-body-sm text-muted-foreground">Start the conversation by sending a message...</p>
                                        </div>
                                    )}

                                    {messages.map((msg) => {
                                        // Collect all quotes from opportunities for highlighting
                                        const highlightsForMessage = coachNudges
                                            .filter(n => {
                                                if (n.messageId === msg.id) return true;
                                                // Check if any opportunity quote appears literally in this message (key for focus groups)
                                                if (isFocusGroup && n.opportunities) {
                                                    return n.opportunities.some(opp => opp.quote && msg.content.toLowerCase().includes(opp.quote.toLowerCase()));
                                                }
                                                return false;
                                            })
                                            .flatMap(n => {
                                                // Get quotes from opportunities array
                                                const oppQuotes = (n.opportunities || [])
                                                    .map(opp => opp.quote)
                                                    .filter(quote => quote && msg.content.toLowerCase().includes(quote.toLowerCase()));
                                                // Fall back to legacy highlightQuote if no opportunities
                                                if (oppQuotes.length === 0 && n.highlightQuote && msg.content.toLowerCase().includes(n.highlightQuote.toLowerCase())) {
                                                    return [n.highlightQuote];
                                                }
                                                return oppQuotes as string[];
                                            });

                                        const renderContentWithHighlights = (content: string, highlights: string[]) => {
                                            if (highlights.length === 0) return content;
                                            let parts: (string | React.ReactNode)[] = [content];
                                            highlights.forEach((highlight, idx) => {
                                                const newParts: (string | React.ReactNode)[] = [];
                                                parts.forEach((part) => {
                                                    if (typeof part === 'string') {
                                                        const lowerPart = part.toLowerCase();
                                                        const lowerHighlight = highlight.toLowerCase();
                                                        const index = lowerPart.indexOf(lowerHighlight);
                                                        if (index !== -1) {
                                                            const before = part.slice(0, index);
                                                            const match = part.slice(index, index + highlight.length);
                                                            const after = part.slice(index + highlight.length);
                                                            if (before) newParts.push(before);
                                                            newParts.push(
                                                                <span key={`highlight-${idx}-${index}`} className="bg-[color:var(--primary-soft)] text-foreground rounded px-0.5">
                                                                    {match}
                                                                </span>
                                                            );
                                                            if (after) newParts.push(after);
                                                        } else {
                                                            newParts.push(part);
                                                        }
                                                    } else {
                                                        newParts.push(part);
                                                    }
                                                });
                                                parts = newParts;
                                            });
                                            return parts;
                                        };

                                        // Persona message — rendered with shared ChatBubble
                                        if (msg.role === "persona") {
                                            const fgColor = isFocusGroup && msg.archetypeId ? getArchetypeColor(msg.archetypeId) : null;
                                            const isTyping = typingMessageId === msg.id;
                                            const bubbleContent = isTyping ? (
                                                <TypewriterText
                                                    text={msg.content}
                                                    onComplete={() => setTypingMessageId(null)}
                                                    wordsPerSecond={20}
                                                />
                                            ) : (
                                                renderContentWithHighlights(msg.content, highlightsForMessage)
                                            );
                                            return (
                                                <ChatBubble
                                                    key={msg.id}
                                                    id={`chat-bubble-${msg.id}`}
                                                    role="persona"
                                                    content={bubbleContent}
                                                    archetypeName={fgColor ? msg.archetypeName : null}
                                                    archetypeColor={fgColor?.text}
                                                    avatarClassName={fgColor?.avatar}
                                                    avatarTextClassName={fgColor?.avatarText}
                                                    initial={
                                                        fgColor
                                                            ? getInitial(msg.archetypeName || "P")
                                                            : (selectedPersonaDetails?.name || "P").charAt(0).toUpperCase()
                                                    }
                                                    typing={isTyping}
                                                    feedbackSlot={
                                                        <AIFeedback
                                                            entityType="simulation_message"
                                                            entityId={msg.id}
                                                            simulationId={simulationId || undefined}
                                                            messageContent={msg.content}
                                                            size="sm"
                                                        />
                                                    }
                                                />
                                            );
                                        }

                                        // User message — rendered with shared ChatBubble
                                        const userContent = msg.content && msg.content !== "[Shared an image]" ? msg.content : null;
                                        return (
                                            <ChatBubble
                                                key={msg.id}
                                                id={`chat-bubble-${msg.id}`}
                                                role="user"
                                                content={userContent}
                                                imageBase64={msg.imageBase64}
                                            />
                                        );
                                    })}
                                    {isSending && (
                                        <div className="flex gap-2.5 items-start">
                                            {isFocusGroup ? (
                                                <div className="flex -space-x-2 mt-0.5">
                                                    {focusGroupArchetypes.slice(0, 3).map((arch) => {
                                                        const color = getArchetypeColor(arch.id);
                                                        return (
                                                            <div
                                                                key={arch.id}
                                                                className={`w-[30px] h-[30px] rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} text-[11px] font-semibold shadow-inset-edge ring-2 ring-[color:var(--surface)]`}
                                                            >
                                                                {getInitial(arch.name)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="w-[30px] h-[30px] rounded-full bg-[color:var(--surface-muted)] text-[color:var(--ink-secondary)] shadow-inset-edge flex items-center justify-center text-[11px] font-semibold shrink-0">
                                                    {(selectedPersonaDetails?.name || "P").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="rounded-[var(--radius-chat)] rounded-tl-[4px] bg-[color:var(--surface)] shadow-outline-ring px-4 py-3 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-[color:var(--primary)] rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                <span className="w-1.5 h-1.5 bg-[color:var(--primary)] rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                <span className="w-1.5 h-1.5 bg-[color:var(--primary)] rounded-full animate-bounce" />
                                                {isFocusGroup && <span className="text-caption text-muted-foreground ml-2">Group is responding...</span>}
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Composer — absolute inside the main column so it floats over the chat */}
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center px-6 md:px-10 pointer-events-none">
                                <div className="w-full max-w-[720px] pointer-events-auto">
                                    <div className="rounded-[var(--radius-panel)] bg-[color:var(--surface)] shadow-composer px-4 py-3">
                                        {/* Image Preview */}
                                        {attachedImage && (
                                            <div className="mb-3 relative inline-block">
                                                <img
                                                    src={attachedImage.previewUrl}
                                                    alt="Attached"
                                                    className="max-h-[120px] rounded-[var(--radius-md2)] border border-[color:var(--border-subtle)] object-contain"
                                                />
                                                <button
                                                    onClick={() => setAttachedImage(null)}
                                                    className="absolute -top-2 -right-2 w-6 h-6 bg-[color:var(--destructive)] hover:opacity-90 text-white rounded-full flex items-center justify-center shadow-card transition-opacity"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={isListening ? "destructive" : "outline"}
                                                size="icon"
                                                onClick={toggleListening}
                                                disabled={isSending || isEnding}
                                                className={cn(
                                                    "shrink-0 h-10 w-10 rounded-[var(--radius-md2)] transition-all",
                                                    isListening && "animate-pulse"
                                                )}
                                                title={isListening ? "Stop listening" : "Start voice dictation"}
                                            >
                                                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                            </Button>
                                            {/* Image Attach Button — only when no mod guide */}
                                            {(!selectedGuideId || selectedGuideId === "none") && (
                                                <>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageAttach}
                                                        className="hidden"
                                                    />
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        disabled={isSending || isEnding}
                                                        className={cn(
                                                            "shrink-0 h-10 w-10 rounded-[var(--radius-md2)] transition-all",
                                                            attachedImage && "bg-[color:var(--info-soft)] text-[color:var(--info)]"
                                                        )}
                                                        title="Attach an image"
                                                    >
                                                        <ImagePlus className="h-4 w-4" />
                                                    </Button>
                                                </>
                                            )}
                                            <div className="relative flex-1">
                                                {/* @mention autocomplete dropdown */}
                                                {showAtMention && isFocusGroup && focusGroupArchetypes.length > 0 && (
                                                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-[color:var(--surface)] rounded-[var(--radius-md2)] shadow-card z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                                                        <div className="px-3 py-2 border-b border-[color:var(--border-subtle)]">
                                                            <p className="text-caption text-muted-foreground font-medium uppercase tracking-wider">Tag an archetype</p>
                                                        </div>
                                                        {focusGroupArchetypes.map((arch) => {
                                                            const color = getArchetypeColor(arch.id);
                                                            return (
                                                                <button
                                                                    key={arch.id}
                                                                    onClick={() => {
                                                                        const beforeAt = inputMessage.slice(0, inputMessage.lastIndexOf('@'));
                                                                        setInputMessage(`${beforeAt}@${arch.name} `);
                                                                        setShowAtMention(false);
                                                                        inputRef.current?.focus();
                                                                    }}
                                                                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[color:var(--surface-muted)] transition-colors text-left"
                                                                >
                                                                    <div className={`w-6 h-6 rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} text-[11px] font-semibold shadow-inset-edge`}>
                                                                        {getInitial(arch.name)}
                                                                    </div>
                                                                    <span className="text-ui-sm font-medium text-foreground">{arch.name}</span>
                                                                </button>
                                                            );
                                                        })}
                                                        <div className="px-3 py-2 border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-muted)]">
                                                            <p className="text-caption text-muted-foreground">Tag to direct your message. No tag = all respond.</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <textarea
                                                    ref={inputRef}
                                                    value={inputMessage}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setInputMessage(value);
                                                        // Auto-resize
                                                        e.target.style.height = 'auto';
                                                        e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
                                                        // @mention trigger
                                                        if (isFocusGroup) {
                                                            const lastChar = value.slice(-1);
                                                            if (lastChar === '@') {
                                                                setShowAtMention(true);
                                                            } else if (showAtMention && (lastChar === ' ' || value === '')) {
                                                                setShowAtMention(false);
                                                            }
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Escape" && showAtMention) {
                                                            setShowAtMention(false);
                                                            return;
                                                        }
                                                        if (e.key === "Enter" && !e.shiftKey) {
                                                            e.preventDefault();
                                                            sendMessage();
                                                            if (inputRef.current) {
                                                                inputRef.current.style.height = 'auto';
                                                            }
                                                        }
                                                    }}
                                                    placeholder={isFocusGroup ? "Type your message... (use @ to tag an archetype)" : "Type your message..."}
                                                    rows={1}
                                                    className="w-full min-h-[40px] max-h-[160px] py-[9px] px-3 bg-[color:var(--surface-muted)] shadow-inset-edge rounded-[var(--radius-md2)] focus:outline-none focus:shadow-outline-ring resize-none text-body-sm leading-[22px]"
                                                    disabled={isSending || isEnding}
                                                />
                                            </div>
                                            <Button
                                                onClick={sendMessage}
                                                disabled={(!inputMessage.trim() && !attachedImage) || isSending || isEnding}
                                                className="h-10 px-4 rounded-[var(--radius-md2)]"
                                            >
                                                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </WorkspaceFrame>
                </>
            ) : (
                /* When simulation is NOT STARTED - Setup View */
                <>
                    <PageBar
                        sticky={false}
                        back={{ href: `/projects/${projectId}/sub/${subProjectId}?tab=simulations`, label: "Back" }}
                        crumbs={setupCrumbs}
                        action={
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowConfig(!showConfig)}
                                    className="gap-1.5"
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5" />
                                    Settings
                                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showConfig ? "rotate-180" : ""}`} />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={startSimulation}
                                    disabled={isFocusGroup
                                        ? selectedArchetypeIds.length < 2
                                        : (!selectedPersonaId || (personas.length === 0 && archetypes.length === 0))
                                    }
                                    className="gap-1.5 bg-[color:var(--primary)] text-[color:var(--primary-fg)] shadow-card hover:brightness-110"
                                >
                                    {loading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            {isFocusGroup ? <Users className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                            {isFocusGroup ? `Start Focus Group (${selectedArchetypeIds.length})` : "Start Simulation"}
                                        </>
                                    )}
                                </Button>
                            </>
                        }
                    />

                    <WorkspaceFrame
                        variant="review"
                        scrollContained
                        leftRail={
                            <>
                                <RailHeader>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">New session</Badge>
                                    </div>
                                    <h2 className="text-display-4 text-foreground leading-tight">
                                        {subProject?.name || "Session"}
                                    </h2>
                                    {subProject?.researchStatement && (
                                        <p className="text-body-sm text-muted-foreground leading-relaxed line-clamp-3">
                                            {subProject.researchStatement}
                                        </p>
                                    )}
                                </RailHeader>

                                <RailSection title="Configuration">
                                    <MetaRow k="Mode" v={isFocusGroup ? "Focus group" : "1:1 interview"} />
                                    <MetaRow
                                        k="Guide"
                                        v={
                                            selectedGuideId && selectedGuideId !== "none"
                                                ? guides.find(g => g.id === selectedGuideId)?.name || "Selected"
                                                : "None"
                                        }
                                    />
                                    <MetaRow
                                        k={isFocusGroup ? "Archetypes" : "Persona"}
                                        v={
                                            isFocusGroup
                                                ? (selectedArchetypeIds.length > 0 ? String(selectedArchetypeIds.length) : "—")
                                                : (selectedPersonaId ? (personas.find(p => p.id === selectedPersonaId)?.title || "Selected") : "—")
                                        }
                                    />
                                </RailSection>

                                {isFocusGroup && focusGroupArchetypes.length > 0 && (
                                    <RailSection title="Focus group">
                                        <div className="flex flex-col gap-2">
                                            {focusGroupArchetypes.map((a) => (
                                                <div key={a.id} className="text-body-sm text-foreground truncate">
                                                    {a.name}
                                                </div>
                                            ))}
                                        </div>
                                    </RailSection>
                                )}

                                <div className="flex-1" />
                            </>
                        }
                    >
                        {/* Collapsible Configuration Panel */}
                        {showConfig && (
                            <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge p-5">
                                    {/* Focus Group Toggle — only show when archetypes exist */}
                                    {archetypes.length > 0 && (
                                        <div className="mb-5 pb-4 border-b border-[color:var(--border-subtle)]">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={isFocusGroup}
                                                        onChange={(e) => {
                                                            setIsFocusGroup(e.target.checked);
                                                            if (!e.target.checked) {
                                                                setSelectedArchetypeIds([]);
                                                            } else {
                                                                setSelectedPersonaId("");
                                                            }
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-9 h-5 bg-[color:var(--surface)] shadow-inset-edge peer-checked:bg-[color:var(--primary)] rounded-full transition-colors duration-200" />
                                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-[color:var(--surface)] rounded-full shadow-card transition-transform duration-200 peer-checked:translate-x-4" />
                                                </div>
                                                <div>
                                                    <span className="text-body-sm font-semibold text-foreground">Focus Group Mode</span>
                                                    <p className="text-caption text-muted-foreground">Simulate a group discussion with 2-4 archetypes</p>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {isFocusGroup ? (
                                        <div className="text-center py-4">
                                            <p className="text-caption text-muted-foreground italic">In Focus Group mode, each archetype uses its own personality profile. No additional settings needed — select 2-5 archetypes below.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Left: Guide Selection */}
                                            <div className="space-y-3">
                                                <Label className="text-caption font-bold text-muted-foreground uppercase tracking-widest">Moderator Guide</Label>
                                                {guides.length > 0 ? (
                                                    <div>
                                                        <Select
                                                            value={selectedGuideId}
                                                            onValueChange={(v) => setSelectedGuideId(v)}
                                                        >
                                                            <SelectTrigger className="h-10 bg-[color:var(--surface)] shadow-inset-edge text-ui-sm rounded-[var(--radius-md2)]">
                                                                <SelectValue placeholder="Select a guide..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">
                                                                    <span className="text-muted-foreground">No Moderator Guide</span>
                                                                </SelectItem>
                                                                {guides.map((guide) => {
                                                                    const questionCount = guide.guideSets?.reduce(
                                                                        (acc, set) => acc + (set.questions?.length || 0), 0
                                                                    ) || 0;
                                                                    return (
                                                                        <SelectItem key={guide.id} value={guide.id}>
                                                                            {guide.name} ({questionCount} questions)
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-caption text-muted-foreground mt-2 leading-relaxed">
                                                            {selectedGuideId !== "none"
                                                                ? "Questions from this guide will be used by the AI coach to evaluate your session."
                                                                : "No guide selected. The AI coach will not track question coverage during the session."}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-[color:var(--surface)] shadow-inset-edge rounded-[var(--radius-md2)] p-4 text-center">
                                                        <p className="text-caption text-muted-foreground mb-2">No guides available</p>
                                                        <Link href={`/projects/${projectId}/sub/${subProjectId}`} className="text-caption font-semibold text-[color:var(--primary)] hover:underline">
                                                            Create a Guide &rarr;
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Persona Settings */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-caption font-bold text-muted-foreground uppercase tracking-widest">Persona Settings</Label>
                                                    {defaultSettings && !isModified && selectedPersonaId && (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[color:var(--info-soft)] text-[color:var(--info)] text-caption font-semibold">
                                                            <Sparkles className="h-3 w-3" />
                                                            Optimized
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Tone */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-caption">
                                                            <span className="text-muted-foreground font-medium">Emotional Tone</span>
                                                            <span className="text-[color:var(--primary)] font-semibold">{getMixerLabel(mixer.emotionalTone, "tone")}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mixer.emotionalTone]}
                                                            onValueChange={([v]) => setMixer(m => ({ ...m, emotionalTone: snapToStop(v) }))}
                                                            max={100}
                                                            step={1}
                                                        />
                                                    </div>

                                                    {/* Singlish */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-caption">
                                                            <span className="text-muted-foreground font-medium">Singlish Level</span>
                                                            <span className="text-[color:var(--primary)] font-semibold">{getMixerLabel(mixer.singlishLevel, "singlish")}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mixer.singlishLevel]}
                                                            onValueChange={([v]) => setMixer(m => ({ ...m, singlishLevel: snapToStop(v) }))}
                                                            max={100}
                                                            step={1}
                                                        />
                                                    </div>

                                                    {/* Mood */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-caption">
                                                            <span className="text-muted-foreground font-medium">Mood Variability</span>
                                                            <span className="text-[color:var(--primary)] font-semibold">{getMixerLabel(mixer.moodSwings, "mood")}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mixer.moodSwings]}
                                                            onValueChange={([v]) => setMixer(m => ({ ...m, moodSwings: snapToStop(v) }))}
                                                            max={100}
                                                            step={1}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-caption text-muted-foreground font-medium">Response Length</Label>
                                                        <Select
                                                            value={mixer.responseLength}
                                                            onValueChange={(v) => setMixer(m => ({ ...m, responseLength: v as "short" | "medium" | "long" }))}
                                                        >
                                                            <SelectTrigger className="h-9 text-caption bg-[color:var(--surface)] shadow-inset-edge rounded-[var(--radius-sm2)]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="short">Short</SelectItem>
                                                                <SelectItem value="medium">Medium</SelectItem>
                                                                <SelectItem value="long">Long</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-caption text-muted-foreground font-medium">Thinking Style</Label>
                                                        <Select
                                                            value={mixer.thinkingStyle}
                                                            onValueChange={(v) => setMixer(m => ({ ...m, thinkingStyle: v as "concrete" | "abstract" }))}
                                                        >
                                                            <SelectTrigger className="h-9 text-caption bg-[color:var(--surface)] shadow-inset-edge rounded-[var(--radius-sm2)]">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="concrete">Concrete</SelectItem>
                                                                <SelectItem value="abstract">Abstract</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {/* Save Default Settings */}
                                                {isModified && selectedPersonaId && (
                                                    <div className="animate-in fade-in slide-in-from-top-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="w-full text-caption text-[color:var(--primary)] bg-[color:var(--primary-soft)] hover:bg-[color:var(--primary-soft)]/80 h-8"
                                                            onClick={saveRecommendedSettings}
                                                            disabled={isSavingSettings}
                                                        >
                                                            {isSavingSettings ? <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> : <Sparkles className="h-3 w-3 mr-1.5" />}
                                                            Update Default Settings
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Main Content — Persona List + Persona Detail */}
                        {personas.length === 0 && archetypes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge">
                                <div className="h-16 w-16 bg-[color:var(--surface)] rounded-full shadow-inset-edge flex items-center justify-center mb-4">
                                    <User className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-foreground font-semibold mb-1">No personas or archetypes found</p>
                                <p className="text-muted-foreground text-body-sm mb-6 max-w-xs">Upload a persona to the project Knowledge Base or generate profiles to get started.</p>
                                <Link href={`/projects/${projectId}/kb`}>
                                    <Button variant="outline">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Upload Persona
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                                {/* Left Column: Persona + Archetype List (4 cols) */}
                                <div className="lg:col-span-4 space-y-2">
                                    <h3 className="text-caption font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
                                        {isFocusGroup ? "Select Archetypes (2-5)" : "Select Persona"}
                                    </h3>
                                    <div className="space-y-1.5">

                                        {/* Personas section — hidden in focus group mode */}
                                        {!isFocusGroup && personas.length > 0 && (
                                            <>
                                                {archetypes.length > 0 && (
                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 pt-1">Personas</p>
                                                )}
                                                {personas.map((persona) => {
                                                    const details = parsePersonaMeta(persona);
                                                    const isSelected = selectedPersonaId === persona.id && selectionType === "persona";

                                                    return (
                                                        <div
                                                            key={persona.id}
                                                            onClick={() => { setSelectedPersonaId(persona.id); setSelectionType("persona"); }}
                                                            className={cn(
                                                                "group rounded-[14px] p-3.5 cursor-pointer transition-shadow duration-200",
                                                                isSelected
                                                                    ? "bg-[color:var(--surface)] shadow-card"
                                                                    : "bg-[color:var(--surface)] shadow-outline-ring hover:shadow-card"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-9 h-9 rounded-[10px] flex items-center justify-center text-body-sm font-bold shadow-inset-edge transition-all duration-200 shrink-0",
                                                                    isSelected
                                                                        ? "bg-[color:var(--primary)] text-white"
                                                                        : "bg-[color:var(--surface-muted)] text-[color:var(--ink-secondary)]"
                                                                )}>
                                                                    {(details.name || persona.title).charAt(0).toUpperCase()}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-body-sm font-semibold truncate text-foreground">
                                                                        {details.name || persona.title}
                                                                    </h4>
                                                                    {details.age && (
                                                                        <p className="text-caption text-muted-foreground truncate">
                                                                            {details.age}{details.occupation ? ` · ${details.occupation}` : ""}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {isSelected && (
                                                                    <div className="h-5 w-5 rounded-full bg-[color:var(--primary)] text-white flex items-center justify-center shrink-0">
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}

                                        {/* Archetypes section */}
                                        {archetypes.length > 0 && (
                                            <>
                                                {!isFocusGroup && <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1 pt-3">Profiles</p>}
                                                {isFocusGroup && (
                                                    <p className="text-caption font-medium text-muted-foreground px-1 pb-1">
                                                        {selectedArchetypeIds.length}/5 selected {selectedArchetypeIds.length < 2 && "· minimum 2"}
                                                    </p>
                                                )}
                                                {archetypes.map((arch, idx) => {
                                                    const isSelected = isFocusGroup
                                                        ? selectedArchetypeIds.includes(arch.id)
                                                        : (selectedPersonaId === arch.id && selectionType === "archetype");
                                                    const demographic = arch.demographicJson ? (() => { try { return JSON.parse(arch.demographicJson!); } catch { return null; } })() : null;
                                                    const fgColor = isFocusGroup ? ARCHETYPE_COLORS[idx % ARCHETYPE_COLORS.length] : null;

                                                    return (
                                                        <div
                                                            key={arch.id}
                                                            onClick={() => {
                                                                if (isFocusGroup) {
                                                                    setSelectedArchetypeIds(prev => {
                                                                        if (prev.includes(arch.id)) {
                                                                            return prev.filter(id => id !== arch.id);
                                                                        }
                                                                        if (prev.length >= 5) return prev; // Cap at 5
                                                                        return [...prev, arch.id];
                                                                    });
                                                                } else {
                                                                    setSelectedPersonaId(arch.id);
                                                                    setSelectionType("archetype");
                                                                }
                                                            }}
                                                            className={cn(
                                                                "group rounded-[14px] p-3.5 cursor-pointer transition-shadow duration-200",
                                                                isSelected && isFocusGroup && fgColor
                                                                    ? `${fgColor.bg} shadow-card`
                                                                    : isSelected
                                                                        ? "bg-[color:var(--surface)] shadow-card"
                                                                        : "bg-[color:var(--surface)] shadow-outline-ring hover:shadow-card"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-9 h-9 rounded-[10px] flex items-center justify-center text-body-sm font-bold shadow-inset-edge transition-all duration-200 shrink-0",
                                                                    isSelected && isFocusGroup && fgColor
                                                                        ? `${fgColor.avatar} ${fgColor.avatarText}`
                                                                        : isSelected
                                                                            ? "bg-[color:var(--primary)] text-white"
                                                                            : "bg-[color:var(--surface-muted)] text-[color:var(--primary)]"
                                                                )}>
                                                                    <Zap className="h-4 w-4" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="text-body-sm font-semibold truncate text-foreground">
                                                                        {arch.name}
                                                                    </h4>
                                                                    {demographic?.ageRange && (
                                                                        <p className="text-caption text-muted-foreground truncate">
                                                                            {demographic.ageRange}{demographic.occupation ? ` · ${demographic.occupation}` : ""}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                {isSelected && (
                                                                    <div className={cn(
                                                                        "h-5 w-5 rounded-full flex items-center justify-center shrink-0",
                                                                        isFocusGroup && fgColor
                                                                            ? `${fgColor.avatar} ${fgColor.avatarText}`
                                                                            : "bg-[color:var(--primary)] text-white"
                                                                    )}>
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Selected Detail (8 cols) */}
                                <div className="lg:col-span-8 lg:pt-[28px]">
                                    {selectedPersonaId ? (() => {
                                        // PERSONA detail view
                                        if (selectionType === "persona") {
                                            const persona = personas.find(p => p.id === selectedPersonaId);
                                            if (!persona) return null;
                                            const d = parsePersonaMeta(persona);

                                            return (
                                                <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6 animate-in fade-in duration-200">
                                                    <div className="flex items-start gap-4 mb-5">
                                                        <div className="w-12 h-12 rounded-[14px] bg-[color:var(--primary)] text-white shadow-inset-edge flex items-center justify-center text-lg font-bold shrink-0">
                                                            {(d.name || persona.title).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h2 className="text-display-3 text-foreground mb-0.5">
                                                                {d.name || persona.title}
                                                            </h2>
                                                            <div className="flex flex-wrap items-center gap-x-3 text-caption text-muted-foreground">
                                                                {d.age && <span>{d.age}</span>}
                                                                {d.occupation && (
                                                                    <span className="flex items-center gap-1.5">
                                                                        <span className="w-0.5 h-0.5 rounded-full bg-[color:var(--border)]" />
                                                                        {d.occupation}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {(d.summary || d.bio) && (
                                                        <p className="text-body-sm text-muted-foreground leading-relaxed mb-5">{d.summary || d.bio}</p>
                                                    )}
                                                    {(d.gains || d.pains) && (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {d.gains && (
                                                                <div className="rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4">
                                                                    <div className="flex items-center gap-1.5 mb-2.5">
                                                                        <Heart className="h-3.5 w-3.5 text-[color:var(--primary)]" />
                                                                        <span className="text-caption font-bold text-[color:var(--primary)] uppercase tracking-wider">Motivations</span>
                                                                    </div>
                                                                    <p className="text-caption text-muted-foreground leading-relaxed whitespace-pre-line">{d.gains}</p>
                                                                </div>
                                                            )}
                                                            {d.pains && (
                                                                <div className="rounded-[14px] shadow-inset-edge p-4" style={{ backgroundColor: 'var(--color-destructive)' + '10' }}>
                                                                    <div className="flex items-center gap-1.5 mb-2.5">
                                                                        <AlertCircle className="h-3.5 w-3.5 text-[color:var(--destructive)]" />
                                                                        <span className="text-caption font-bold text-[color:var(--destructive)] uppercase tracking-wider">Frustrations</span>
                                                                    </div>
                                                                    <p className="text-caption text-muted-foreground leading-relaxed whitespace-pre-line">{d.pains}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        // ARCHETYPE detail view
                                        if (selectionType === "archetype") {
                                            const arch = archetypes.find(a => a.id === selectedPersonaId);
                                            if (!arch) return null;

                                            const parse = (json: string | null) => { try { return json ? JSON.parse(json) : null; } catch { return null; } };
                                            const demographic = parse(arch.demographicJson);
                                            const full = parse(arch.fullContentJson);
                                            const influences = full?.influences || [];
                                            const livedExperience = full?.livedExperience || "";
                                            const behaviours = full?.behaviours || [];
                                            const barriers = full?.barriers || [];
                                            const motivations = full?.motivations || [];
                                            const goals = full?.goals || [];
                                            const habits = full?.habits || [];
                                            const spiral = full?.spiral;

                                            return (
                                                <div className="rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring p-6 animate-in fade-in duration-200 space-y-5">
                                                    {/* Header */}
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-12 h-12 rounded-[14px] bg-[color:var(--primary)] text-white shadow-inset-edge flex items-center justify-center shrink-0">
                                                            <Zap className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h2 className="text-display-3 text-foreground mb-0.5">{arch.name}</h2>
                                                            {arch.kicker && (
                                                                <p className="text-caption text-[color:var(--primary)] font-medium italic">{arch.kicker}</p>
                                                            )}
                                                            {demographic && (
                                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                                    {demographic.ageRange && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[color:var(--surface-muted)] text-[color:var(--primary)] shadow-inset-edge">
                                                                            {demographic.ageRange}
                                                                        </span>
                                                                    )}
                                                                    {demographic.occupation && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[color:var(--surface-muted)] text-muted-foreground shadow-inset-edge">
                                                                            {demographic.occupation}
                                                                        </span>
                                                                    )}
                                                                    {demographic.livingSetup && (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[color:var(--surface-muted)] text-muted-foreground shadow-inset-edge">
                                                                            {demographic.livingSetup}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-body-sm text-muted-foreground leading-relaxed">{arch.description}</p>

                                                    {/* Lived Experience */}
                                                    {livedExperience && (
                                                        <div className="rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4">
                                                            <h4 className="text-caption font-bold text-[color:var(--primary)] uppercase tracking-wider mb-2">Lived Experience</h4>
                                                            <p className="text-caption text-foreground leading-relaxed">{livedExperience}</p>
                                                        </div>
                                                    )}

                                                    {/* Grid sections */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {influences.length > 0 && (
                                                            <div className="rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4">
                                                                <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">Influences</h4>
                                                                <ul className="space-y-1.5">
                                                                    {influences.map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-caption text-muted-foreground leading-relaxed">
                                                                            <span className="w-1 h-1 rounded-full bg-[color:var(--border)] mt-1.5 shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {behaviours.length > 0 && (
                                                            <div className="rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4">
                                                                <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">Behaviours</h4>
                                                                <ul className="space-y-1.5">
                                                                    {behaviours.map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-caption text-muted-foreground leading-relaxed">
                                                                            <span className="w-1 h-1 rounded-full bg-[color:var(--border)] mt-1.5 shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {barriers.length > 0 && (
                                                            <div className="rounded-[14px] shadow-inset-edge p-4" style={{ backgroundColor: 'var(--color-destructive)' + '10' }}>
                                                                <h4 className="text-caption font-bold text-[color:var(--destructive)] uppercase tracking-wider mb-2">Barriers</h4>
                                                                <ul className="space-y-1.5">
                                                                    {barriers.map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-caption text-muted-foreground leading-relaxed">
                                                                            <span className="w-1 h-1 rounded-full bg-[color:var(--destructive)] mt-1.5 shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {motivations.length > 0 && (
                                                            <div className="rounded-[14px] bg-[color:var(--primary-soft)] shadow-inset-edge p-4">
                                                                <h4 className="text-caption font-bold text-[color:var(--primary)] uppercase tracking-wider mb-2">Motivations</h4>
                                                                <ul className="space-y-1.5">
                                                                    {motivations.map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-caption text-muted-foreground leading-relaxed">
                                                                            <span className="w-1 h-1 rounded-full bg-[color:var(--primary)] mt-1.5 shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {goals.length > 0 && (
                                                            <div className="rounded-[14px] bg-[color:var(--info-soft)] shadow-inset-edge p-4">
                                                                <h4 className="text-caption font-bold text-[color:var(--info)] uppercase tracking-wider mb-2">Goals</h4>
                                                                <ul className="space-y-1.5">
                                                                    {goals.map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-caption text-muted-foreground leading-relaxed">
                                                                            <span className="w-1 h-1 rounded-full bg-[color:var(--info)] mt-1.5 shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        {habits.length > 0 && (
                                                            <div className="rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge p-4">
                                                                <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider mb-2">Habits</h4>
                                                                <ul className="space-y-1.5">
                                                                    {habits.map((item: string, i: number) => (
                                                                        <li key={i} className="flex items-start gap-2 text-caption text-muted-foreground leading-relaxed">
                                                                            <span className="w-1 h-1 rounded-full bg-[color:var(--border)] mt-1.5 shrink-0" />
                                                                            {item}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* The Spiral */}
                                                    {spiral && (
                                                        <div className="rounded-[14px] bg-[color:var(--knowledge-soft)] shadow-inset-edge p-4">
                                                            <h4 className="text-caption font-bold text-[color:var(--knowledge)] uppercase tracking-wider mb-2">The Spiral</h4>
                                                            {spiral.pattern && (
                                                                <p className="text-caption text-foreground font-medium leading-relaxed mb-2">{spiral.pattern}</p>
                                                            )}
                                                            {spiral.avoidance && (
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">How They Avoid It:</p>
                                                                    <p className="text-caption text-muted-foreground leading-relaxed">{spiral.avoidance}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return null;
                                    })() : (
                                        <div className="flex flex-col items-center justify-center py-16 text-center rounded-[14px] bg-[color:var(--surface-muted)] shadow-inset-edge">
                                            <div className="h-12 w-12 bg-[color:var(--surface)] rounded-full shadow-inset-edge flex items-center justify-center mb-3">
                                                <User className="h-6 w-6 text-muted-foreground" />
                                            </div>
                                            <p className="text-body-sm font-medium text-muted-foreground">Select a persona or archetype to view their profile</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </WorkspaceFrame>
                </>
            )}
            {/* activePanel is preserved for future coach/guide tab-switching UX; reference to silence unused-var */}
            {false && <span data-active-panel={activePanel} />}
        </div>
    );
}

function SimulationLoading() {
    return (
        <div className="h-screen flex items-center justify-center bg-[color:var(--canvas)]">
            <Loader2 className="h-12 w-12 animate-spin text-[color:var(--primary)]" />
        </div>
    );
}

export default function SimulatePage({ params }: PageProps) {
    return (
        <Suspense fallback={<SimulationLoading />}>
            <SimulationPageContent params={params} />
        </Suspense>
    );
}
// Created by Swapnil Bapat © 2026
