"use client";

import { useState, useEffect, useRef, use, Suspense, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Sliders,
    ChevronRight,
    CheckCircle2,
    Briefcase,
    Sparkles,
    Heart,
    AlertCircle,
    Plus,
    BookOpen,
    Mic,
    MicOff,
    Lightbulb,
    MessageSquare,
    Target,
    Eye,
    SlidersHorizontal,
    X,
    ChevronDown,
    Zap,
    Users,
    ImagePlus
} from "lucide-react";

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
    const words = text.split(/(\s+)/); // Split but keep whitespace
    const totalWords = words.filter(w => w.trim()).length;

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

    // Reset when text changes
    useEffect(() => {
        setDisplayedWords(0);
    }, [text]);

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

    // Focus group archetype colors
    const ARCHETYPE_COLORS = [
        { bg: "bg-violet-100", border: "border-violet-200/50", text: "text-violet-900", avatar: "bg-gradient-to-br from-violet-500 to-purple-600", avatarText: "text-white" },
        { bg: "bg-amber-100", border: "border-amber-200/50", text: "text-amber-900", avatar: "bg-gradient-to-br from-amber-500 to-orange-600", avatarText: "text-white" },
        { bg: "bg-sky-100", border: "border-sky-200/50", text: "text-sky-900", avatar: "bg-gradient-to-br from-sky-500 to-blue-600", avatarText: "text-white" },
        { bg: "bg-rose-100", border: "border-rose-200/50", text: "text-rose-900", avatar: "bg-gradient-to-br from-rose-500 to-pink-600", avatarText: "text-white" },
        { bg: "bg-emerald-100", border: "border-emerald-200/50", text: "text-emerald-900", avatar: "bg-gradient-to-br from-emerald-500 to-teal-600", avatarText: "text-white" },
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

    // Highlighted question state - for Live Coach suggestions shown in Moderator Guide
    const [highlightedQuestionId, setHighlightedQuestionId] = useState<string | null>(null);
    const [highlightedQuestionReason, setHighlightedQuestionReason] = useState<string | null>(null);
    const questionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const guideScrollAreaRef = useRef<HTMLDivElement>(null);

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

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-accent">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    const selectedPersona = personas.find(p => p.id === selectedPersonaId);
    const selectedArchetype = archetypes.find(a => a.id === selectedPersonaId);
    const selectedPersonaDetails = selectionType === "archetype" && selectedArchetype
        ? { name: selectedArchetype.name, occupation: selectedArchetype.kicker || undefined }
        : selectedPersona ? parsePersonaMeta(selectedPersona)
            : resumedPersonaDetails;

    return (
        <div className="min-h-screen">
            {/* When simulation is STARTED - Fixed header + sidebar layout */}
            {isStarted ? (
                <>
                    {/* Fixed Top Bar with Breadcrumbs - below main navbar */}
                    <div className="fixed top-16 left-0 right-0 bg-white z-30 border-b border-border/60">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
                            <div className="flex items-center justify-between">
                                {/* Breadcrumb Navigation - minimal */}
                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                    <Link href="/dashboard" className="hover:text-foreground transition-colors">
                                        Projects
                                    </Link>
                                    <span className="text-border">/</span>
                                    <Link href={`/projects/${projectId}`} className="hover:text-foreground transition-colors truncate max-w-[120px]">
                                        {subProject?.project.name || "Project"}
                                    </Link>
                                    <span className="text-border">/</span>
                                    <Link href={`/projects/${projectId}/sub/${subProjectId}`} className="hover:text-foreground transition-colors truncate max-w-[120px]">
                                        {subProject?.name || "Workspace"}
                                    </Link>
                                    <span className="text-border">/</span>
                                    <span className="text-foreground">
                                        Interview Simulation
                                    </span>
                                </div>

                                {/* Status Badges - Right side of breadcrumbs */}
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5" style={{ backgroundColor: 'var(--color-info-subtle)', color: 'var(--color-info)', borderColor: 'var(--color-info-muted)' }}>
                                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse" style={{ backgroundColor: 'var(--color-info)' }} />
                                        In Progress
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={endSimulation}
                                        disabled={isEnding}
                                        className="h-6 px-2.5 text-[10px] rounded-full bg-red-50 border-red-200 text-red-600 hover:bg-red-100 hover:border-red-300 hover:text-red-700 transition-all"
                                    >
                                        {isEnding ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Square className="h-3 w-3 mr-1" />}
                                        End Session
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fixed LEFT Sidebar - Moderator Guide */}
                    {selectedGuideId && selectedGuideId !== "none" && guides.find(g => g.id === selectedGuideId) && (
                        <div className="fixed top-[120px] left-4 md:left-6 lg:left-[calc((100vw-1280px)/2+24px)] w-[300px] z-30 hidden lg:block">
                            <Card className="relative flex flex-col bg-white/90 backdrop-blur-md border-border/60 overflow-hidden py-0 gap-0 h-[calc(100vh-220px)] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]">
                                {/* Subtle gradient accent line at top */}
                                <div className="absolute top-0 left-4 right-4 h-[2px] bg-border rounded-full" />

                                {/* Header */}
                                <div className="py-3 px-4 flex-shrink-0 border-b border-border/60">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-accent flex items-center justify-center">
                                            <BookOpen className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <span className="text-sm font-semibold text-primary">Moderator Guide</span>
                                    </div>
                                </div>

                                {/* Guide Content */}
                                <div className="flex-1 overflow-hidden min-h-0">
                                    <ScrollArea className="h-[calc(100vh-280px)]">
                                        <div className="p-4 space-y-5">
                                            {/* Covered Questions Badge */}
                                            {coveredQuestionIds.size > 0 && (
                                                <div className="flex items-center gap-2 px-3 py-2 bg-accent rounded-lg border border-border">
                                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                                    <span className="text-xs text-primary font-medium">
                                                        {coveredQuestionIds.size} question{coveredQuestionIds.size !== 1 ? 's' : ''} covered
                                                    </span>
                                                </div>
                                            )}

                                            {guides.find(g => g.id === selectedGuideId)?.guideSets?.map((set, i) => (
                                                <div key={set.id} className="space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-5 w-5 rounded bg-muted text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider leading-tight">
                                                            {set.title}
                                                        </h4>
                                                    </div>
                                                    <div className="space-y-3 pl-2 border-l-2 border-border ml-2.5">
                                                        {set.questions?.map((q) => {
                                                            const isCovered = coveredQuestionIds.has(q.id);
                                                            const isHighlighted = highlightedQuestionId === q.id;
                                                            return (
                                                                <div
                                                                    key={q.id}
                                                                    ref={(el) => {
                                                                        if (el) questionRefs.current.set(q.id, el);
                                                                    }}
                                                                    className={`transition-all duration-300 ${isHighlighted
                                                                        ? 'bg-violet-50/80 backdrop-blur-sm ml-2 px-4 py-4 rounded-2xl border border-violet-200/50'
                                                                        : isCovered
                                                                            ? 'opacity-50 pl-4'
                                                                            : 'cursor-pointer hover:bg-accent/50 -ml-2 pl-6 py-1.5 rounded-lg'
                                                                        }`}
                                                                    onClick={() => {
                                                                        if (!isCovered) {
                                                                            setInputMessage(q.text);
                                                                            inputRef.current?.focus();
                                                                        }
                                                                    }}
                                                                >
                                                                    {/* Suggested badge for highlighted question */}
                                                                    {isHighlighted && (
                                                                        <div className="flex items-center gap-2 mb-3">
                                                                            <div className="h-5 w-5 rounded-lg bg-gradient-to-br from-violet-100 to-violet-200/80 flex items-center justify-center">
                                                                                <Sparkles className="h-3 w-3 text-violet-600" />
                                                                            </div>
                                                                            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-violet-600/80">
                                                                                Coach Suggests
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <p className={`text-sm leading-relaxed font-medium transition-all ${isHighlighted
                                                                        ? 'text-foreground'
                                                                        : isCovered
                                                                            ? 'text-muted-foreground line-through decoration-primary decoration-2'
                                                                            : 'text-foreground group-hover:text-primary'
                                                                        }`}>
                                                                        {q.text}
                                                                        {isCovered && !isHighlighted && (
                                                                            <Badge className="ml-2 bg-muted text-primary text-[10px] px-1.5 py-0 border-input">
                                                                                <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                                                                                Covered
                                                                            </Badge>
                                                                        )}
                                                                    </p>
                                                                    {/* Show reason when highlighted */}
                                                                    {isHighlighted && highlightedQuestionReason && (
                                                                        <div className="flex items-start gap-2 mt-3 pt-3 border-t border-violet-100">
                                                                            <Lightbulb className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />
                                                                            <p className="text-xs text-violet-600 italic leading-relaxed">
                                                                                {highlightedQuestionReason}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {q.subQuestions && q.subQuestions.length > 0 && !isCovered && !isHighlighted && (
                                                                        <ul className="mt-2 space-y-1.5">
                                                                            {q.subQuestions.map(sq => (
                                                                                <li
                                                                                    key={sq.id}
                                                                                    className="text-xs text-muted-foreground grid grid-cols-[auto_1fr] gap-2 hover:text-primary cursor-pointer"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setInputMessage(sq.text);
                                                                                        inputRef.current?.focus();
                                                                                    }}
                                                                                >
                                                                                    <span className="w-1 h-1 rounded-full bg-border mt-1.5" />
                                                                                    <span>{sq.text}</span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                            {(!guides.find(g => g.id === selectedGuideId)?.guideSets || guides.find(g => g.id === selectedGuideId)?.guideSets?.length === 0) && (
                                                <div className="text-center py-10 text-muted-foreground italic text-sm">
                                                    No questions in this guide
                                                </div>
                                            )}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Scrollable Chat Area - Two column layout: Chat on left, Opportunities on right */}
                    <div className="pt-6 pb-24 px-4 md:px-6 lg:pl-[340px]">
                        <div className="max-w-5xl mx-auto">
                            {/* Persona Header - Compact inline version */}
                            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,600px)_minmax(0,280px)] gap-6">
                                {isFocusGroup ? (
                                    <div className="flex items-center gap-3 mb-4 pt-6">
                                        <div className="flex items-center -space-x-1.5">
                                            {focusGroupArchetypes.map((arch) => {
                                                const color = getArchetypeColor(arch.id);
                                                return (
                                                    <div key={arch.id} className={`w-10 h-10 rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} font-bold text-sm ring-2 ring-white shadow-sm shrink-0`}>
                                                        {getInitial(arch.name)}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-foreground">Focus Group</h2>
                                            <p className="text-xs text-muted-foreground">
                                                {focusGroupArchetypes.map(a => a.name).join(" · ")}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 mb-4 pt-6">
                                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md shadow-sm shrink-0">
                                            {(selectedPersonaDetails?.name || "P").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-base font-semibold text-foreground">
                                                {selectedPersonaDetails?.name || "Persona"}
                                            </h2>
                                            {selectedPersonaDetails?.occupation && (
                                                <p className="text-xs text-muted-foreground">
                                                    {selectedPersonaDetails.occupation}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                {/* Empty right column for header */}
                                <div className="hidden lg:block" />
                            </div>

                            {/* Chat Messages - Two column grid */}
                            <div className="space-y-5">
                                {messages.length === 0 && (
                                    <div className="text-center py-16">
                                        <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">Start the conversation by sending a message...</p>
                                    </div>
                                )}

                                {messages.map((msg, msgIndex) => {
                                    // Check if this is the last persona message (for showing coach loading state)
                                    const isLastPersonaMessage = msg.role === "persona" &&
                                        !messages.slice(msgIndex + 1).some(m => m.role === "persona");
                                    // Collect all quotes from opportunities for highlighting
                                    const highlightsForMessage = coachNudges
                                        .filter(n => n.messageId === msg.id)
                                        .flatMap(n => {
                                            // Get quotes from opportunities array
                                            const oppQuotes = (n.opportunities || [])
                                                .map(opp => opp.quote)
                                                .filter(Boolean);
                                            // Fall back to legacy highlightQuote if no opportunities
                                            return oppQuotes.length > 0 ? oppQuotes : (n.highlightQuote ? [n.highlightQuote] : []);
                                        });

                                    // Get coaching nudges for this message (with opportunities or legacy coachingNudge)
                                    const nudgesForMessage = coachNudges.filter(
                                        n => n.messageId === msg.id && ((n.opportunities && n.opportunities.length > 0) || n.coachingNudge)
                                    );

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
                                                            <span key={`highlight-${idx}-${index}`} className="bg-amber-100 text-amber-900 px-0.5 rounded">
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

                                    // Persona message with potential coaching nudge
                                    if (msg.role === "persona") {
                                        const hasNudge = nudgesForMessage.length > 0;
                                        const fgColor = isFocusGroup && msg.archetypeId ? getArchetypeColor(msg.archetypeId) : null;
                                        return (
                                            <div key={msg.id} className="grid grid-cols-1 lg:grid-cols-[minmax(0,600px)_minmax(0,280px)] gap-4 items-start">
                                                {/* LEFT COLUMN: Chat message */}
                                                <div className="flex items-start gap-3 relative z-20">
                                                    {/* Persona Avatar */}
                                                    {fgColor ? (
                                                        <div className={`w-8 h-8 rounded-full ${fgColor.avatar} flex items-center justify-center ${fgColor.avatarText} text-xs font-bold mt-1 shadow-sm shrink-0`}>
                                                            {getInitial(msg.archetypeName || "P")}
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-muted border border-input flex items-center justify-center text-primary text-xs font-bold mt-1 shadow-sm shrink-0">
                                                            {(selectedPersonaDetails?.name || "P").charAt(0).toUpperCase()}
                                                        </div>
                                                    )}

                                                    {/* Chat Bubble */}
                                                    <div
                                                        id={`chat-bubble-${msg.id}`}
                                                        className="flex-1 max-w-full px-5 py-3 rounded-2xl text-sm leading-relaxed backdrop-blur-sm rounded-tl-none group/message bg-white/95 border border-border/60 text-foreground"
                                                    >
                                                        {/* Archetype name label for focus group */}
                                                        {fgColor && msg.archetypeName && (
                                                            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${fgColor.text}`}>{msg.archetypeName}</p>
                                                        )}
                                                        {/* Show typewriter animation for currently typing message */}
                                                        {typingMessageId === msg.id ? (
                                                            <TypewriterText
                                                                text={msg.content}
                                                                onComplete={() => setTypingMessageId(null)}
                                                                wordsPerSecond={20}
                                                            />
                                                        ) : (
                                                            renderContentWithHighlights(msg.content, highlightsForMessage)
                                                        )}
                                                        {/* Feedback buttons - appear on hover, hide during typing */}
                                                        {typingMessageId !== msg.id && (
                                                            <div className="mt-2 pt-2 border-t border-border opacity-0 group-hover/message:opacity-100 transition-opacity">
                                                                <AIFeedback
                                                                    entityType="simulation_message"
                                                                    entityId={msg.id}
                                                                    simulationId={simulationId || undefined}
                                                                    messageContent={msg.content}
                                                                    size="sm"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* RIGHT COLUMN: Opportunity Identified card - vertically centered with chat bubble */}
                                                {/* Only show opportunity cards after typewriter completes (typingMessageId is null) */}
                                                <div className="hidden lg:flex items-center justify-end relative overflow-visible">
                                                    {hasNudge && typingMessageId === null ? (
                                                        <>
                                                            {/* Horizontal dotted connector line with gradient fade */}
                                                            <div className="absolute -left-16 top-1/2 -translate-y-1/2 z-0">
                                                                <div
                                                                    className="w-24 h-[2px]"
                                                                    style={{
                                                                        background: 'repeating-linear-gradient(to right, rgb(209 213 219 / 0.6) 0, rgb(209 213 219 / 0.6) 6px, transparent 6px, transparent 12px)',
                                                                        maskImage: 'linear-gradient(to right, black, transparent)',
                                                                        WebkitMaskImage: 'linear-gradient(to right, black, transparent)'
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* AI Coach Nudge cards - Show each opportunity (collapsed by default) */}
                                                            <div className="w-[90%] relative z-10 space-y-2">
                                                                {nudgesForMessage.flatMap((nudge) =>
                                                                    nudge.opportunities && nudge.opportunities.length > 0
                                                                        ? nudge.opportunities.map((opp, oppIdx) => {
                                                                            const opportunityId = `${nudge.id}-opp-${oppIdx}`;
                                                                            const isExpanded = expandedOpportunityId === opportunityId;
                                                                            // Hide all collapsed cards when ANY opportunity is expanded
                                                                            const isAnyExpanded = expandedOpportunityId !== null;

                                                                            return (
                                                                                <div
                                                                                    key={opportunityId}
                                                                                    className="relative"
                                                                                    style={{ animationDelay: `${oppIdx * 100}ms` }}
                                                                                >
                                                                                    {/* Collapsed Card - Hidden when ANY card is expanded */}
                                                                                    <button
                                                                                        onClick={() => setExpandedOpportunityId(isExpanded ? null : opportunityId)}
                                                                                        className={`w-full text-left px-3 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border transition-all duration-200 animate-in fade-in slide-in-from-left-3 ${isAnyExpanded
                                                                                            ? 'opacity-0 invisible pointer-events-none'
                                                                                            : 'border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.06)] hover:border-amber-200 hover:shadow-[0_4px_15px_-4px_rgba(245,158,11,0.15)]'
                                                                                            }`}
                                                                                    >
                                                                                        <div className="flex items-center gap-2.5">
                                                                                            {/* Icon */}
                                                                                            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                                                                <Lightbulb className="h-3.5 w-3.5" />
                                                                                            </div>
                                                                                            {/* Content */}
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-amber-600/70 mb-0.5">
                                                                                                    Opportunity
                                                                                                </p>
                                                                                                <p className="text-[11px] text-muted-foreground truncate">
                                                                                                    {opp.quote ? `"${opp.quote}"` : opp.surfacedContext?.slice(0, 50) + '...'}
                                                                                                </p>
                                                                                            </div>
                                                                                            {/* Expand indicator */}
                                                                                            <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                                                        </div>
                                                                                    </button>

                                                                                    {/* Expanded Overlay - Positioned absolutely */}
                                                                                    {isExpanded && (
                                                                                        <>
                                                                                            {/* Backdrop to close on click outside */}
                                                                                            <div
                                                                                                className="fixed inset-0 z-[100]"
                                                                                                onClick={() => setExpandedOpportunityId(null)}
                                                                                            />
                                                                                            {/* Expanded Card - fixed, vertically centered */}
                                                                                            <div className="fixed right-[8%] w-[300px] z-[110] animate-in fade-in zoom-in-95 duration-200" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                                                                                                <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-[0_8px_30px_-4px_rgba(245,158,11,0.25)] max-h-[70vh] overflow-y-auto">
                                                                                                    {/* Close button */}
                                                                                                    <button
                                                                                                        onClick={() => setExpandedOpportunityId(null)}
                                                                                                        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                                                    >
                                                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                                        </svg>
                                                                                                    </button>

                                                                                                    <div className="flex items-start gap-3">
                                                                                                        {/* Icon */}
                                                                                                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                                                                                                            <Lightbulb className="h-4 w-4" />
                                                                                                        </div>
                                                                                                        <div className="flex-1 min-w-0 pt-0.5 space-y-2.5 pr-4">
                                                                                                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-amber-600/80">
                                                                                                                Opportunity Identified
                                                                                                            </p>

                                                                                                            {/* Quote highlight */}
                                                                                                            {opp.quote && (
                                                                                                                <p className="text-[11px] text-amber-800/70 italic border-l-2 border-amber-200 pl-2 py-0.5 bg-amber-50/50 rounded-r">
                                                                                                                    &ldquo;{opp.quote}&rdquo;
                                                                                                                </p>
                                                                                                            )}

                                                                                                            {/* Surfaced Context - Main insight */}
                                                                                                            {opp.surfacedContext && (
                                                                                                                <p className="text-xs text-foreground leading-relaxed font-medium">
                                                                                                                    {opp.surfacedContext}
                                                                                                                </p>
                                                                                                            )}

                                                                                                            {/* Testable Assumption - Hypothesis angle with validation status */}
                                                                                                            {opp.testableAssumption && (() => {
                                                                                                                // Parse validation status from the response
                                                                                                                const assumption = opp.testableAssumption;
                                                                                                                const isAlreadyValidated = assumption.startsWith('[ALREADY VALIDATED]');
                                                                                                                const isPartiallyValidated = assumption.startsWith('[PARTIALLY VALIDATED]');
                                                                                                                const isNewHypothesis = assumption.startsWith('[NEW HYPOTHESIS]');

                                                                                                                // Strip prefix for display
                                                                                                                let displayText = assumption
                                                                                                                    .replace('[ALREADY VALIDATED]', '')
                                                                                                                    .replace('[PARTIALLY VALIDATED]', '')
                                                                                                                    .replace('[NEW HYPOTHESIS]', '')
                                                                                                                    .trim();

                                                                                                                return (
                                                                                                                    <div className="space-y-1.5">
                                                                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                                                                            <span className="text-violet-600/80 font-medium text-[11px]">Worth validating:</span>
                                                                                                                            {isAlreadyValidated && (
                                                                                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-[9px] font-bold text-amber-700 uppercase tracking-wide">
                                                                                                                                    ⚠️ Already Validated
                                                                                                                                </span>
                                                                                                                            )}
                                                                                                                            {isPartiallyValidated && (
                                                                                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 text-[9px] font-bold text-blue-700 uppercase tracking-wide">
                                                                                                                                    🔄 Partially Validated
                                                                                                                                </span>
                                                                                                                            )}
                                                                                                                            {isNewHypothesis && (
                                                                                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-green-50 border border-green-200/60 text-[9px] font-bold text-green-700 uppercase tracking-wide">
                                                                                                                                    ✨ New Hypothesis
                                                                                                                                </span>
                                                                                                                            )}
                                                                                                                        </div>
                                                                                                                        <p className={`text-[11px] leading-relaxed ${isAlreadyValidated ? 'text-amber-600/80 italic' : 'text-muted-foreground'}`}>
                                                                                                                            {displayText}
                                                                                                                        </p>
                                                                                                                    </div>
                                                                                                                );
                                                                                                            })()}

                                                                                                            {/* Exploration Direction - Next step */}
                                                                                                            {opp.explorationDirection && (
                                                                                                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                                                                    <span className="text-primary/80 font-medium">Consider exploring:</span>{' '}
                                                                                                                    {opp.explorationDirection}
                                                                                                                </p>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })
                                                                        : nudge.coachingNudge ? [
                                                                            // Fallback for legacy nudges - also make collapsible
                                                                            (() => {
                                                                                const legacyId = nudge.id;
                                                                                const isExpanded = expandedOpportunityId === legacyId;
                                                                                const isAnyExpanded = expandedOpportunityId !== null;
                                                                                return (
                                                                                    <div key={legacyId} className="relative">
                                                                                        <button
                                                                                            onClick={() => setExpandedOpportunityId(isExpanded ? null : legacyId)}
                                                                                            className={`w-full text-left px-3 py-2.5 rounded-xl bg-white/90 backdrop-blur-md border transition-all duration-200 ${isAnyExpanded
                                                                                                ? 'opacity-0 invisible pointer-events-none'
                                                                                                : 'border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.06)] hover:border-amber-200'
                                                                                                }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-2.5">
                                                                                                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                                                                    <Lightbulb className="h-3.5 w-3.5" />
                                                                                                </div>
                                                                                                <div className="flex-1 min-w-0">
                                                                                                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-amber-600/70 mb-0.5">
                                                                                                        Opportunity
                                                                                                    </p>
                                                                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                                                                        {nudge.coachingNudge?.slice(0, 50)}...
                                                                                                    </p>
                                                                                                </div>
                                                                                                <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                                                                                            </div>
                                                                                        </button>
                                                                                        {isExpanded && (
                                                                                            <>
                                                                                                <div className="fixed inset-0 z-[100]" onClick={() => setExpandedOpportunityId(null)} />
                                                                                                <div className="fixed right-[8%] w-[300px] z-[110] animate-in fade-in zoom-in-95 duration-200" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                                                                                                    <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-[0_8px_30px_-4px_rgba(245,158,11,0.25)] max-h-[70vh] overflow-y-auto">
                                                                                                        <button
                                                                                                            onClick={() => setExpandedOpportunityId(null)}
                                                                                                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                                                                        >
                                                                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                                                            </svg>
                                                                                                        </button>
                                                                                                        <div className="flex items-start gap-3">
                                                                                                            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
                                                                                                                <Lightbulb className="h-4 w-4" />
                                                                                                            </div>
                                                                                                            <div className="flex-1 min-w-0 pt-0.5 pr-4">
                                                                                                                <p className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1.5 text-amber-600/80">
                                                                                                                    Opportunity Identified
                                                                                                                </p>
                                                                                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                                                                                    {nudge.coachingNudge}
                                                                                                                </p>
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })()
                                                                        ] : []
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : isCoachLoading && isLastPersonaMessage ? (
                                                        /* AI Coach Loading State - Sleek, tech-inspired skeleton */
                                                        <>
                                                            {/* Horizontal dotted connector line with gradient fade */}
                                                            <div className="absolute -left-16 top-1/2 -translate-y-1/2 z-0">
                                                                <div
                                                                    className="w-24 h-[2px] animate-pulse"
                                                                    style={{
                                                                        background: 'repeating-linear-gradient(to right, rgb(139 92 246 / 0.4) 0, rgb(139 92 246 / 0.4) 6px, transparent 6px, transparent 12px)',
                                                                        maskImage: 'linear-gradient(to right, black, transparent)',
                                                                        WebkitMaskImage: 'linear-gradient(to right, black, transparent)'
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* AI Thinking Card */}
                                                            <div className="w-[90%] relative z-10">
                                                                <div className="relative overflow-hidden px-4 py-4 rounded-xl bg-gradient-to-br from-violet-50/90 via-white/95 to-amber-50/80 backdrop-blur-md border border-violet-200/50 shadow-[0_4px_20px_-4px_rgba(139,92,246,0.15)]">
                                                                    {/* Animated gradient shimmer overlay */}
                                                                    <div className="absolute inset-0 overflow-hidden">
                                                                        <div
                                                                            className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite]"
                                                                            style={{
                                                                                background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.08), transparent)',
                                                                            }}
                                                                        />
                                                                    </div>

                                                                    {/* Content */}
                                                                    <div className="relative z-10 flex items-start gap-3">
                                                                        {/* Animated AI Icon */}
                                                                        <div className="relative">
                                                                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                                                                <svg className="h-4 w-4 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                                </svg>
                                                                            </div>
                                                                            {/* Subtle glow ring */}
                                                                            <div className="absolute inset-0 rounded-lg bg-violet-400/20 blur-md animate-pulse" />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0 space-y-2.5">
                                                                            {/* Header */}
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-violet-600/90">
                                                                                    Coach Analysing
                                                                                </span>
                                                                                <div className="flex gap-1">
                                                                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                                                    <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" />
                                                                                </div>
                                                                            </div>

                                                                            {/* Status text - cycling through phases */}
                                                                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                                                                <span className="inline-flex items-center gap-1.5">
                                                                                    <svg className="h-3 w-3 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                                    </svg>
                                                                                    Reviewing research & identifying opportunities...
                                                                                </span>
                                                                            </p>

                                                                            {/* Skeleton lines */}
                                                                            <div className="space-y-2 pt-1">
                                                                                <div className="h-2 bg-gradient-to-r from-violet-100 via-muted to-transparent rounded-full animate-pulse w-[85%]" />
                                                                                <div className="h-2 bg-gradient-to-r from-amber-100/70 via-muted to-transparent rounded-full animate-pulse w-[60%] [animation-delay:150ms]" />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        /* Empty placeholder to maintain column */
                                                        <div />
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    }

                                    // User message - also uses grid but content is in left column, right-aligned
                                    return (
                                        <div
                                            key={msg.id}
                                            className="grid grid-cols-1 lg:grid-cols-[minmax(0,600px)_minmax(0,280px)] gap-4"
                                        >
                                            {/* LEFT COLUMN: User message */}
                                            <div className="flex gap-3 justify-end">
                                                <div
                                                    className="max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed bg-muted/70 backdrop-blur-sm border border-input/50 text-foreground rounded-tr-none"
                                                >
                                                    {msg.imageBase64 && (
                                                        <img
                                                            src={msg.imageBase64}
                                                            alt="Shared image"
                                                            className="max-w-full max-h-[240px] rounded-xl mb-2 object-contain"
                                                        />
                                                    )}
                                                    {msg.content && msg.content !== "[Shared an image]" && msg.content}
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs mt-1 shrink-0">
                                                    <User className="h-4 w-4" />
                                                </div>
                                            </div>
                                            {/* RIGHT COLUMN: Empty for user messages */}
                                            <div className="hidden lg:block" />
                                        </div>
                                    );
                                })}
                                {isSending && (
                                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,600px)_minmax(0,280px)] gap-4">
                                        <div className="flex gap-3 justify-start">
                                            {isFocusGroup ? (
                                                <div className="flex -space-x-2 mt-1">
                                                    {focusGroupArchetypes.slice(0, 3).map((arch) => {
                                                        const color = getArchetypeColor(arch.id);
                                                        return (
                                                            <div key={arch.id} className={`w-7 h-7 rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} text-[10px] font-bold border-2 border-white`}>
                                                                {getInitial(arch.name)}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-muted border border-input/60 flex items-center justify-center text-primary text-xs font-bold mt-1 shrink-0">
                                                    {(selectedPersonaDetails?.name || "P").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div className="bg-white/95 backdrop-blur-sm border border-border/60 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                                                {isFocusGroup && <span className="text-xs text-muted-foreground ml-2">Group is responding...</span>}
                                            </div>
                                        </div>
                                        <div className="hidden lg:block" />
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    </div>

                    {/* Fixed Input Bar at Bottom - Floating glass effect */}
                    <div className={`fixed bottom-4 left-4 right-4 lg:right-8 z-50 ${selectedGuideId && selectedGuideId !== "none" ? 'lg:left-[360px]' : 'lg:left-4'}`}>
                        <div className="max-w-3xl mx-auto">
                            <div className="bg-white/90 backdrop-blur-xl border border-border/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] rounded-2xl px-4 py-3">
                                {/* Image Preview */}
                                {attachedImage && (
                                    <div className="mb-3 relative inline-block">
                                        <img
                                            src={attachedImage.previewUrl}
                                            alt="Attached"
                                            className="max-h-[120px] rounded-xl border border-border object-contain"
                                        />
                                        <button
                                            onClick={() => setAttachedImage(null)}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant={isListening ? "destructive" : "outline"}
                                        size="icon"
                                        onClick={toggleListening}
                                        disabled={isSending || isEnding}
                                        className={`shrink-0 h-11 w-11 rounded-xl transition-all mb-0 ${isListening ? "animate-pulse shadow-red-500/20 shadow-lg" : "hover:bg-accent hover:text-primary hover:border-input"}`}
                                        title={isListening ? "Stop listening" : "Start voice dictation"}
                                    >
                                        {isListening ? (
                                            <MicOff className="h-4 w-4" />
                                        ) : (
                                            <Mic className="h-4 w-4" />
                                        )}
                                    </Button>
                                    {/* Image Attach Button - only when no mod guide */}
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
                                                className={`shrink-0 h-11 w-11 rounded-xl transition-all mb-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 ${attachedImage ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}`}
                                                title="Attach an image"
                                            >
                                                <ImagePlus className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                    <div className="relative flex-1">
                                        {/* @mention autocomplete dropdown */}
                                        {showAtMention && isFocusGroup && focusGroupArchetypes.length > 0 && (
                                            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white rounded-xl border border-border shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
                                                <div className="p-2 border-b border-border">
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Tag an archetype</p>
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
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-accent transition-colors text-left"
                                                        >
                                                            <div className={`w-6 h-6 rounded-full ${color.avatar} flex items-center justify-center ${color.avatarText} text-xs font-bold`}>
                                                                {getInitial(arch.name)}
                                                            </div>
                                                            <span className="text-sm font-medium text-foreground">{arch.name}</span>
                                                        </button>
                                                    );
                                                })}
                                                <div className="p-2 border-t border-border bg-accent">
                                                    <p className="text-[10px] text-muted-foreground">Tag to direct your message. No tag = all respond.</p>
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
                                            className="w-full min-h-[44px] max-h-[160px] py-2.5 px-4 bg-accent border border-border rounded-xl focus:ring-2 focus:ring-ring focus:border-input outline-none resize-none text-sm leading-relaxed"
                                            disabled={isSending || isEnding}
                                        />
                                    </div>
                                    <Button
                                        onClick={sendMessage}
                                        disabled={(!inputMessage.trim() && !attachedImage) || isSending || isEnding}
                                        className="h-11 px-5 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-sm rounded-xl"
                                    >
                                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                /* When simulation is NOT STARTED - Setup View */
                <div className="w-full max-w-6xl mx-auto px-4 md:px-6 py-6">

                    {/* Header */}
                    <div className="mb-6">
                        {/* Breadcrumb Navigation */}
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mb-4">
                            <Link href="/dashboard" className="hover:text-foreground transition-colors">
                                Projects
                            </Link>
                            <span className="text-border">/</span>
                            <Link href={`/projects/${projectId}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                                {subProject?.project.name || "Project"}
                            </Link>
                            <span className="text-border">/</span>
                            <Link href={`/projects/${projectId}/sub/${subProjectId}`} className="hover:text-foreground transition-colors truncate max-w-[150px]">
                                {subProject?.name || "Workspace"}
                            </Link>
                            <span className="text-border">/</span>
                            <span className="text-foreground">
                                New Session
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight mb-1" aria-label="New Simulation Session">New Simulation Session</h1>
                                <p className="text-sm text-muted-foreground">
                                    Select a persona and start your simulation.
                                </p>
                            </div>

                            {/* Action buttons — config toggle + start */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowConfig(!showConfig)}
                                    className={`h-9 px-3 rounded-xl text-xs font-medium transition-all ${showConfig ? "bg-muted border-border text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-border"}`}
                                >
                                    <SlidersHorizontal className="h-3.5 w-3.5 mr-1.5" />
                                    Settings
                                    <ChevronDown className={`h-3 w-3 ml-1 transition-transform duration-200 ${showConfig ? "rotate-180" : ""}`} />
                                </Button>
                                <Button
                                    onClick={startSimulation}
                                    disabled={isFocusGroup
                                        ? selectedArchetypeIds.length < 2
                                        : (!selectedPersonaId || (personas.length === 0 && archetypes.length === 0))
                                    }
                                    className="h-9 px-5 rounded-xl text-xs font-bold shadow-sm bg-primary hover:bg-primary/90 transition-all active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <>
                                            {isFocusGroup ? <Users className="h-3.5 w-3.5 mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
                                            {isFocusGroup ? `Start Focus Group (${selectedArchetypeIds.length})` : "Start Simulation"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Configuration Panel */}
                    {showConfig && (
                        <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-200">
                            <Card className="bg-white/80 backdrop-blur-xl border-border/60 shadow-sm rounded-2xl overflow-hidden">
                                <CardContent className="p-5">
                                    {/* Focus Group Toggle — only show when archetypes exist */}
                                    {archetypes.length > 0 && (
                                        <div className="mb-5 pb-4 border-b border-border">
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
                                                    <div className="w-9 h-5 bg-muted peer-checked:bg-accent0 rounded-full transition-colors duration-200" />
                                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 peer-checked:translate-x-4" />
                                                </div>
                                                <div>
                                                    <span className="text-sm font-semibold text-foreground group-hover:text-foreground">Focus Group Mode</span>
                                                    <p className="text-[11px] text-muted-foreground">Simulate a group discussion with 2-4 archetypes</p>
                                                </div>
                                            </label>
                                        </div>
                                    )}

                                    {isFocusGroup ? (
                                        <div className="text-center py-4">
                                            <p className="text-xs text-muted-foreground italic">In Focus Group mode, each archetype uses its own personality profile. No additional settings needed — select 2-5 archetypes below.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                            {/* Left: Guide Selection */}
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Moderator Guide</Label>
                                                {guides.length > 0 ? (
                                                    <div>
                                                        <Select
                                                            value={selectedGuideId}
                                                            onValueChange={(v) => setSelectedGuideId(v)}
                                                        >
                                                            <SelectTrigger className="h-10 bg-white border-border hover:border-input shadow-sm transition-all text-sm rounded-xl">
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
                                                        <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
                                                            {selectedGuideId !== "none"
                                                                ? "Questions from this guide will be used by the AI coach to evaluate your session."
                                                                : "No guide selected. The AI coach will not track question coverage during the session."}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-accent border border-dashed border-border rounded-xl p-4 text-center">
                                                        <p className="text-xs text-muted-foreground mb-2">No guides available</p>
                                                        <Link href={`/projects/${projectId}/sub/${subProjectId}`} className="text-xs font-semibold text-primary hover:underline">
                                                            Create a Guide &rarr;
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right: Persona Settings */}
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Persona Settings</Label>
                                                    {defaultSettings && !isModified && selectedPersonaId && (
                                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                                            <Sparkles className="h-3 w-3" />
                                                            Optimized
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Tone */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground font-medium">Emotional Tone</span>
                                                            <span className="text-primary font-semibold">{getMixerLabel(mixer.emotionalTone, "tone")}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mixer.emotionalTone]}
                                                            onValueChange={([v]) => setMixer(m => ({ ...m, emotionalTone: snapToStop(v) }))}
                                                            max={100}
                                                            step={1}
                                                            className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-primary [&_[role=slider]]:border-2 [&_[role=slider]]:ring-offset-2 [&_[role=slider]]:ring-ring"
                                                        />
                                                    </div>

                                                    {/* Singlish */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground font-medium">Singlish Level</span>
                                                            <span className="text-primary font-semibold">{getMixerLabel(mixer.singlishLevel, "singlish")}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mixer.singlishLevel]}
                                                            onValueChange={([v]) => setMixer(m => ({ ...m, singlishLevel: snapToStop(v) }))}
                                                            max={100}
                                                            step={1}
                                                            className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-primary [&_[role=slider]]:border-2 [&_[role=slider]]:ring-offset-2 [&_[role=slider]]:ring-ring"
                                                        />
                                                    </div>

                                                    {/* Mood */}
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <span className="text-muted-foreground font-medium">Mood Variability</span>
                                                            <span className="text-primary font-semibold">{getMixerLabel(mixer.moodSwings, "mood")}</span>
                                                        </div>
                                                        <Slider
                                                            value={[mixer.moodSwings]}
                                                            onValueChange={([v]) => setMixer(m => ({ ...m, moodSwings: snapToStop(v) }))}
                                                            max={100}
                                                            step={1}
                                                            className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-primary [&_[role=slider]]:border-2 [&_[role=slider]]:ring-offset-2 [&_[role=slider]]:ring-ring"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs text-muted-foreground font-medium">Response Length</Label>
                                                        <Select
                                                            value={mixer.responseLength}
                                                            onValueChange={(v) => setMixer(m => ({ ...m, responseLength: v as "short" | "medium" | "long" }))}
                                                        >
                                                            <SelectTrigger className="h-9 text-xs bg-white border-border rounded-lg">
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
                                                        <Label className="text-xs text-muted-foreground font-medium">Thinking Style</Label>
                                                        <Select
                                                            value={mixer.thinkingStyle}
                                                            onValueChange={(v) => setMixer(m => ({ ...m, thinkingStyle: v as "concrete" | "abstract" }))}
                                                        >
                                                            <SelectTrigger className="h-9 text-xs bg-white border-border rounded-lg">
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
                                                            className="w-full text-xs text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200/50 h-8"
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
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Main Content — Persona List + Persona Detail */}
                    {personas.length === 0 && archetypes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-border">
                            <div className="h-16 w-16 bg-accent rounded-full flex items-center justify-center mb-4">
                                <User className="h-8 w-8 text-border" />
                            </div>
                            <p className="text-foreground font-semibold mb-1">No personas or archetypes found</p>
                            <p className="text-muted-foreground text-sm mb-6 max-w-xs">Upload a persona to the project Knowledge Base or generate archetypes to get started.</p>
                            <Link href={`/projects/${projectId}/kb`}>
                                <Button variant="outline" className="border-input text-primary hover:bg-accent">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Upload Persona
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                            {/* Left Column: Persona + Archetype List (4 cols) */}
                            <div className="lg:col-span-4 space-y-2">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 pl-1">
                                    {isFocusGroup ? "Select Archetypes (2-5)" : "Select Persona"}
                                </h3>
                                <div className="space-y-1.5">

                                    {/* Personas section — hidden in focus group mode */}
                                    {!isFocusGroup && personas.length > 0 && (
                                        <>
                                            {archetypes.length > 0 && (
                                                <p className="text-[10px] font-bold text-border uppercase tracking-widest px-1 pt-1">Personas</p>
                                            )}
                                            {personas.map((persona) => {
                                                const details = parsePersonaMeta(persona);
                                                const isSelected = selectedPersonaId === persona.id && selectionType === "persona";

                                                return (
                                                    <div
                                                        key={persona.id}
                                                        onClick={() => { setSelectedPersonaId(persona.id); setSelectionType("persona"); }}
                                                        className={`group relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected
                                                            ? "bg-white border-primary/30 shadow-sm"
                                                            : "bg-white/60 border-border hover:border-border hover:bg-white"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 shrink-0 ${isSelected
                                                                ? "bg-primary text-white"
                                                                : "bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-primary"
                                                                }`}>
                                                                {(details.name || persona.title).charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-foreground" : "text-foreground"}`}>
                                                                    {details.name || persona.title}
                                                                </h4>
                                                                {details.age && (
                                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                                        {details.age}{details.occupation ? ` · ${details.occupation}` : ""}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <div className="h-5 w-5 rounded-full bg-accent0 text-white flex items-center justify-center shrink-0">
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
                                            {!isFocusGroup && <p className="text-[10px] font-bold text-border uppercase tracking-widest px-1 pt-3">Profiles</p>}
                                            {isFocusGroup && (
                                                <p className="text-[10px] font-medium text-muted-foreground px-1 pb-1">
                                                    {selectedArchetypeIds.length}/5 selected {selectedArchetypeIds.length < 2 && "· minimum 2"}
                                                </p>
                                            )}
                                            {archetypes.map((arch, idx) => {
                                                const isSelected = isFocusGroup
                                                    ? selectedArchetypeIds.includes(arch.id)
                                                    : (selectedPersonaId === arch.id && selectionType === "archetype");
                                                const demographic = arch.demographicJson ? (() => { try { return JSON.parse(arch.demographicJson); } catch { return null; } })() : null;
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
                                                        className={`group relative p-3.5 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected
                                                            ? isFocusGroup && fgColor
                                                                ? `${fgColor.bg} ${fgColor.border} shadow-sm`
                                                                : "bg-white border-primary/30 shadow-sm"
                                                            : "bg-white/60 border-border hover:border-border hover:bg-white"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 shrink-0 ${isSelected
                                                                ? isFocusGroup && fgColor
                                                                    ? `${fgColor.avatar} ${fgColor.avatarText}`
                                                                    : "bg-primary text-white"
                                                                : "bg-accent text-primary group-hover:bg-muted group-hover:text-primary"
                                                                }`}>
                                                                <Zap className="h-4 w-4" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-foreground" : "text-foreground"}`}>
                                                                    {arch.name}
                                                                </h4>
                                                                {demographic?.ageRange && (
                                                                    <p className="text-[11px] text-muted-foreground truncate">
                                                                        {demographic.ageRange}{demographic.occupation ? ` · ${demographic.occupation}` : ""}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {isSelected && (
                                                                <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${isFocusGroup && fgColor ? `${fgColor.avatar} ${fgColor.avatarText}` : "bg-accent0 text-white"
                                                                    }`}>
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
                                            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 animate-in fade-in duration-200">
                                                <div className="flex items-start gap-4 mb-5">
                                                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                                                        {(d.name || persona.title).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h2 className="text-xl font-bold text-foreground mb-0.5">
                                                            {d.name || persona.title}
                                                        </h2>
                                                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                                                            {d.age && <span>{d.age}</span>}
                                                            {d.occupation && (
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="w-0.5 h-0.5 rounded-full bg-border" />
                                                                    {d.occupation}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {(d.summary || d.bio) && (
                                                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">{d.summary || d.bio}</p>
                                                )}
                                                {(d.gains || d.pains) && (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {d.gains && (
                                                            <div className="bg-accent/50 rounded-xl border border-border/50 p-4">
                                                                <div className="flex items-center gap-1.5 mb-2.5">
                                                                    <Heart className="h-3.5 w-3.5 text-primary" />
                                                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Motivations</span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{d.gains}</p>
                                                            </div>
                                                        )}
                                                        {d.pains && (
                                                            <div className="bg-red-50/50 rounded-xl border border-red-100/50 p-4">
                                                                <div className="flex items-center gap-1.5 mb-2.5">
                                                                    <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                                                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Frustrations</span>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{d.pains}</p>
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
                                            <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 animate-in fade-in duration-200 space-y-5">
                                                {/* Header */}
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center text-lg font-bold shrink-0">
                                                        <Zap className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h2 className="text-xl font-bold text-foreground mb-0.5">{arch.name}</h2>
                                                        {arch.kicker && (
                                                            <p className="text-xs text-primary font-medium italic">{arch.kicker}</p>
                                                        )}
                                                        {demographic && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {demographic.ageRange && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-primary border border-border">
                                                                        {demographic.ageRange}
                                                                    </span>
                                                                )}
                                                                {demographic.occupation && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-muted-foreground border border-border">
                                                                        {demographic.occupation}
                                                                    </span>
                                                                )}
                                                                {demographic.livingSetup && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent text-muted-foreground border border-border">
                                                                        {demographic.livingSetup}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-sm text-muted-foreground leading-relaxed">{arch.description}</p>

                                                {/* Lived Experience */}
                                                {livedExperience && (
                                                    <div className="bg-accent/50 rounded-xl border border-border/50 p-4">
                                                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Lived Experience</h4>
                                                        <p className="text-xs text-foreground leading-relaxed">{livedExperience}</p>
                                                    </div>
                                                )}

                                                {/* Grid sections */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {influences.length > 0 && (
                                                        <div className="bg-accent/50 rounded-xl border border-border p-4">
                                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Influences</h4>
                                                            <ul className="space-y-1.5">
                                                                {influences.map((item: string, i: number) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                                                        <span className="w-1 h-1 rounded-full bg-border mt-1.5 shrink-0" />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {behaviours.length > 0 && (
                                                        <div className="bg-accent/50 rounded-xl border border-border p-4">
                                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Behaviours</h4>
                                                            <ul className="space-y-1.5">
                                                                {behaviours.map((item: string, i: number) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                                                        <span className="w-1 h-1 rounded-full bg-border mt-1.5 shrink-0" />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {barriers.length > 0 && (
                                                        <div className="bg-red-50/50 rounded-xl border border-red-100/50 p-4">
                                                            <h4 className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">Barriers</h4>
                                                            <ul className="space-y-1.5">
                                                                {barriers.map((item: string, i: number) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                                                        <span className="w-1 h-1 rounded-full bg-red-300 mt-1.5 shrink-0" />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {motivations.length > 0 && (
                                                        <div className="bg-accent/50 rounded-xl border border-border/50 p-4">
                                                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Motivations</h4>
                                                            <ul className="space-y-1.5">
                                                                {motivations.map((item: string, i: number) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                                                        <span className="w-1 h-1 rounded-full bg-border mt-1.5 shrink-0" />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {goals.length > 0 && (
                                                        <div className="bg-sky-50/50 rounded-xl border border-sky-100/50 p-4">
                                                            <h4 className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-2">Goals</h4>
                                                            <ul className="space-y-1.5">
                                                                {goals.map((item: string, i: number) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                                                        <span className="w-1 h-1 rounded-full bg-sky-300 mt-1.5 shrink-0" />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {habits.length > 0 && (
                                                        <div className="bg-accent/50 rounded-xl border border-border p-4">
                                                            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Habits</h4>
                                                            <ul className="space-y-1.5">
                                                                {habits.map((item: string, i: number) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                                                                        <span className="w-1 h-1 rounded-full bg-border mt-1.5 shrink-0" />
                                                                        {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* The Spiral */}
                                                {spiral && (
                                                    <div className="bg-amber-50/50 rounded-xl border border-amber-100/50 p-4">
                                                        <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">The Spiral</h4>
                                                        {spiral.pattern && (
                                                            <p className="text-xs text-foreground font-medium leading-relaxed mb-2">{spiral.pattern}</p>
                                                        )}
                                                        {spiral.avoidance && (
                                                            <div>
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">How They Avoid It:</p>
                                                                <p className="text-xs text-muted-foreground leading-relaxed">{spiral.avoidance}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return null;
                                })() : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center bg-white/40 rounded-2xl border border-dashed border-border">
                                        <div className="h-12 w-12 bg-accent rounded-full flex items-center justify-center mb-3">
                                            <User className="h-6 w-6 text-border" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">Select a persona or archetype to view their profile</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}

function SimulationLoading() {
    return (
        <div className="h-screen flex items-center justify-center bg-accent">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
