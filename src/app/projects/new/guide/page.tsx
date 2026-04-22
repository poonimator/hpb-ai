"use client";

import { useState, useEffect, useCallback, useLayoutEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Loader2,
    BookOpen,
    Plus,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    RefreshCw,
    Sparkles,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Lightbulb,
    X,
    MessageSquareWarning,
    ClipboardPaste,
    FileText,
    Download,
    MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { CenteredSpinner } from "@/components/ui/centered-spinner";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import { JumpItem } from "@/components/layout/jump-item";
import { Mono } from "@/components/ui/mono";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface SubQuestion {
    id: string;
    text: string;
    intent?: string;
    issues?: QuestionIssue[];
    overallQuality?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'PROBLEMATIC';
    researchInsight?: ResearchInsight;
}

interface Question {
    id: string;
    text: string;
    intent?: string;
    issues?: QuestionIssue[];
    overallQuality?: 'GOOD' | 'NEEDS_IMPROVEMENT' | 'PROBLEMATIC';
    subQuestions: SubQuestion[];
    researchInsight?: ResearchInsight;
}

interface QuestionIssue {
    type: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    explanation: string;
    suggestedRewrite: string;
}

interface ResearchInsight {
    documentName: string;
    excerpt: string;
    summary?: string;
    introText?: string;
    actionSuggestion?: string;
}

interface GuideSet {
    id: string;
    title: string;
    intent: string;
    questions: Question[];
    isExpanded: boolean;
    isChecking: boolean;
}

interface Project {
    id: string;
    name: string;
    researchStatement: string;
    ageRange: string;
    lifeStage: string;
}

// Helper component for auto-resizing textarea
const AutoResizeTextarea = ({ value, onChange, placeholder, className, rows = 1, ...props }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, []);

    // Use useLayoutEffect for initial sizing to prevent flicker
    useLayoutEffect(() => {
        adjustHeight();
    }, [adjustHeight]);

    // Also adjust when value changes
    useEffect(() => {
        adjustHeight();
    }, [value, adjustHeight]);

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
                onChange(e);
                adjustHeight();
            }}
            placeholder={placeholder}
            rows={rows}
            className={`flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] resize-none overflow-hidden ${className}`}
            {...props}
        />
    );
};

function GuideSetupPageContent() {

    const router = useRouter();
    const searchParams = useSearchParams();
    const projectId = searchParams.get("projectId");
    const subProjectId = searchParams.get("subProjectId");
    const guideId = searchParams.get("guideId"); // Specific guide to load/edit

    const [project, setProject] = useState<Project | null>(null);
    const [guideSets, setGuideSets] = useState<GuideSet[]>([]);
    const [currentGuideId, setCurrentGuideId] = useState<string | null>(guideId);
    const [guideName, setGuideName] = useState("Moderator Guide");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null);
    const [flashQuestionId, setFlashQuestionId] = useState<string | null>(null);
    const [railFilter, setRailFilter] = useState<'All' | 'Feedback' | 'Research'>('All');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [hasSavedGuide, setHasSavedGuide] = useState(false); // Track if guide has been saved

    // Rail jump-to navigation
    const [activeSetId, setActiveSetId] = useState<string | null>(null);

    const handleJumpToSet = useCallback((setId: string) => {
        const el = document.getElementById(`guideset-${setId}`)
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }, []);

    useEffect(() => {
        if (guideSets.length === 0) return

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting)
                if (visible.length > 0) {
                    const top = visible.sort(
                        (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
                    )[0]
                    const id = top.target.getAttribute("data-guideset-id")
                    if (id) setActiveSetId(id)
                }
            },
            { rootMargin: "-80px 0px -60% 0px", threshold: [0, 0.25] }
        )

        guideSets.forEach((set) => {
            const el = document.getElementById(`guideset-${set.id}`)
            if (el) observer.observe(el)
        })

        return () => observer.disconnect()
    }, [guideSets]);

    // Import Guide Dialog State
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [importText, setImportText] = useState("");
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const [importSuccess, setImportSuccess] = useState<{ sections: number; questions: number } | null>(null);

    // Click outside handler to collapse expanded cards
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (expandedSuggestionId) {
                const target = event.target as HTMLElement;
                // Check if the click is inside an expanded card (has the specific class)
                const isInsideCard = target.closest('[data-feedback-card]');
                if (!isInsideCard) {
                    setExpandedSuggestionId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [expandedSuggestionId]);

    // Generate unique IDs
    const generateId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Fetch project details
    useEffect(() => {
        if (!projectId) {
            router.push("/projects/new");
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch project info
                const projectRes = await fetch(`/api/projects/${projectId}`);
                const projectData = await projectRes.json();
                if (!projectData.success) {
                    toast.error("Project not found");
                    router.push("/projects/new");
                    return;
                }
                setProject(projectData.data);

                // If we have a specific guideId, load that guide
                if (guideId) {
                    const guideRes = await fetch(`/api/guides/${guideId}`);
                    const guideData = await guideRes.json();

                    if (guideData.success && guideData.data.guide) {
                        const guide = guideData.data.guide;
                        setCurrentGuideId(guide.id);
                        setGuideName(guide.name);

                        if (guide.guideSets?.length > 0) {
                            const existingSets = guide.guideSets.map((set: any) => ({
                                id: set.id,
                                title: set.title,
                                intent: set.intent,
                                questions: set.questions.map((q: any) => ({
                                    id: q.id,
                                    text: q.text,
                                    intent: q.intent || '',
                                    issues: q.issues || [],
                                    overallQuality: q.overallQuality,
                                    researchInsight: q.researchInsight,
                                    subQuestions: (q.subQuestions || []).map((sq: any) => ({
                                        id: sq.id,
                                        text: sq.text,
                                        intent: sq.intent || '',
                                        issues: sq.issues || [],
                                        overallQuality: sq.overallQuality,
                                        researchInsight: sq.researchInsight
                                    }))
                                })),
                                isExpanded: true,
                                isChecking: false
                            }));
                            setGuideSets(existingSets);
                            setHasSavedGuide(true);
                        } else {
                            // New guide - start with empty set
                            setGuideSets([{
                                id: generateId(),
                                title: "",
                                intent: "",
                                questions: [{ id: generateId(), text: "", intent: "", subQuestions: [] }],
                                isExpanded: true,
                                isChecking: false
                            }]);
                        }
                    } else {
                        toast.error("Guide not found");
                        router.back();
                        return;
                    }
                } else {
                    // No guideId - start with empty set (legacy flow or error)
                    setGuideSets([{
                        id: generateId(),
                        title: "",
                        intent: "",
                        questions: [{ id: generateId(), text: "", intent: "", subQuestions: [] }],
                        isExpanded: true,
                        isChecking: false
                    }]);
                }
            } catch (err) {
                console.error(err);
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectId, guideId, router]);

    // Add a new guide set
    const addGuideSet = () => {
        setGuideSets([...guideSets, {
            id: generateId(),
            title: "",
            intent: "",
            questions: [{ id: generateId(), text: "", intent: "", subQuestions: [] }],
            isExpanded: true,
            isChecking: false
        }]);
        setHasUnsavedChanges(true);
    };

    // Remove a guide set
    const removeGuideSet = (setId: string) => {
        if (guideSets.length <= 1) {
            toast.error("You need at least one question set");
            return;
        }
        setGuideSets(guideSets.filter(s => s.id !== setId));
        setHasUnsavedChanges(true);
    };

    // Update guide set field
    const updateGuideSet = (setId: string, field: 'title' | 'intent', value: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId ? { ...s, [field]: value } : s
        ));
        setHasUnsavedChanges(true);
    };

    // Toggle guide set expansion
    const toggleGuideSet = (setId: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId ? { ...s, isExpanded: !s.isExpanded } : s
        ));
    };

    // Add question to a set
    const addQuestion = (setId: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId
                ? { ...s, questions: [...s.questions, { id: generateId(), text: "", intent: "", subQuestions: [] }] }
                : s
        ));
        setHasUnsavedChanges(true);
    };

    // Remove question from a set
    const removeQuestion = (setId: string, questionId: string) => {
        setGuideSets(guideSets.map(s => {
            if (s.id !== setId) return s;
            if (s.questions.length <= 1) return s; // Keep at least one
            return { ...s, questions: s.questions.filter(q => q.id !== questionId) };
        }));
        setHasUnsavedChanges(true);
    };

    // Update question
    const updateQuestion = (setId: string, questionId: string, field: 'text' | 'intent', value: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId
                ? {
                    ...s,
                    questions: s.questions.map(q =>
                        q.id === questionId ? { ...q, [field]: value, issues: undefined, overallQuality: undefined } : q
                    )
                }
                : s
        ));
        setHasUnsavedChanges(true);
    };

    // Apply suggested rewrite
    const applySuggestion = (setId: string, questionId: string, suggestedText: string, subQuestionId?: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId
                ? {
                    ...s,
                    questions: s.questions.map(q => {
                        if (q.id === questionId) {
                            if (subQuestionId) {
                                return {
                                    ...q,
                                    subQuestions: q.subQuestions.map(sq =>
                                        sq.id === subQuestionId
                                            ? { ...sq, text: suggestedText, issues: undefined, overallQuality: undefined }
                                            : sq
                                    )
                                };
                            }
                            return { ...q, text: suggestedText, issues: undefined, overallQuality: undefined };
                        }
                        return q;
                    })
                }
                : s
        ));
        setHasUnsavedChanges(true);
        setExpandedSuggestionId(null); // Collapse after applying
    };

    // Add sub-question to a main question
    const addSubQuestion = (setId: string, questionId: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId
                ? {
                    ...s,
                    questions: s.questions.map(q =>
                        q.id === questionId
                            ? { ...q, subQuestions: [...q.subQuestions, { id: generateId(), text: "", intent: "" }] }
                            : q
                    )
                }
                : s
        ));
        setHasUnsavedChanges(true);
    };

    // Remove sub-question
    const removeSubQuestion = (setId: string, questionId: string, subQuestionId: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId
                ? {
                    ...s,
                    questions: s.questions.map(q =>
                        q.id === questionId
                            ? { ...q, subQuestions: q.subQuestions.filter(sq => sq.id !== subQuestionId) }
                            : q
                    )
                }
                : s
        ));
        setHasUnsavedChanges(true);
    };

    // Update sub-question
    const updateSubQuestion = (setId: string, questionId: string, subQuestionId: string, field: 'text' | 'intent', value: string) => {
        setGuideSets(guideSets.map(s =>
            s.id === setId
                ? {
                    ...s,
                    questions: s.questions.map(q =>
                        q.id === questionId
                            ? {
                                ...q,
                                subQuestions: q.subQuestions.map(sq =>
                                    sq.id === subQuestionId ? { ...sq, [field]: value, issues: undefined, overallQuality: undefined } : sq
                                )
                            }
                            : q
                    )
                }
                : s
        ));
        setHasUnsavedChanges(true);
    };

    const numberToLetter = (num: number): string => String.fromCharCode(65 + num);

    // Focus a feedback/research card in the right rail and flash the source question
    const focusFeedback = useCallback((cardId: string, questionId: string) => {
        setExpandedSuggestionId(cardId);
        // Scroll the rail card into view
        const railCardEl = document.getElementById(`rail-card-${cardId}`);
        if (railCardEl) {
            railCardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        // Scroll the question into view and flash
        const questionEl = document.getElementById(`q-${questionId}`);
        if (questionEl) {
            questionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setFlashQuestionId(questionId);
        setTimeout(() => setFlashQuestionId(null), 1600);
    }, []);

    // Run quality check on a specific set
    const runQualityCheck = useCallback(async (setId: string) => {
        const set = guideSets.find(s => s.id === setId);
        if (!set) return;

        const validQuestions = set.questions.filter(q => q.text.trim());
        if (validQuestions.length === 0) {
            toast.error("Add at least one question before checking");
            return;
        }

        setGuideSets(prev => prev.map(s =>
            s.id === setId ? { ...s, isChecking: true } : s
        ));

        try {
            // Build a flat list of questions with proper labels for AI context
            // Each item includes: label (e.g., "1", "1A", "1B", "2"), text, intent, and metadata to map back
            const questionsForAI: {
                label: string;
                text: string;
                intent: string;
                questionId: string;
                subQuestionId?: string;
            }[] = [];

            validQuestions.forEach((q, qIndex) => {
                // Add main question
                questionsForAI.push({
                    label: `${qIndex + 1}`,
                    text: q.text,
                    intent: q.intent || '',
                    questionId: q.id
                });

                // Add sub-questions
                q.subQuestions.forEach((sq, sqIndex) => {
                    if (sq.text.trim()) {
                        questionsForAI.push({
                            label: `${qIndex + 1}${numberToLetter(sqIndex)}`,
                            text: sq.text,
                            intent: sq.intent || '',
                            questionId: q.id,
                            subQuestionId: sq.id
                        });
                    }
                });
            });



            // Run requests in parallel
            const [validationRes, researchRes] = await Promise.all([
                fetch("/api/gemini/validate-questions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        questions: questionsForAI.map(q => ({
                            label: q.label,
                            text: q.text,
                            intent: q.intent
                        })),
                        context: {
                            researchStatement: project?.researchStatement,
                            setTitle: set.title,
                            setIntent: set.intent,
                            setId: set.id,
                            projectName: project?.name,
                            ageRange: project?.ageRange,
                            lifeStage: project?.lifeStage
                        }
                    })
                }),
                fetch("/api/gemini/research-check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        questions: questionsForAI.map(q => ({
                            label: q.label,
                            text: q.text,
                            intent: q.intent
                        })),
                        projectId: projectId,
                        context: {
                            setIntent: set.intent,
                            projectName: project?.name
                        }
                    })
                })
            ]);

            const validationData = await validationRes.json();
            const researchData = await researchRes.json();

            if (validationData.success) {
                // Map results back to questions
                setGuideSets(prev => prev.map(s => {
                    if (s.id !== setId) return s;

                    const updatedQuestions = s.questions.map((q, qIndex) => {
                        const mainLabel = `${qIndex + 1}`;
                        const mainQIndex = questionsForAI.findIndex(ai => ai.questionId === q.id && !ai.subQuestionId);

                        // Validation Results
                        const mainResult = validationData.data.results.find((r: any) =>
                            r.questionLabel === mainLabel || r.questionIndex === mainQIndex
                        );

                        // Research Results
                        let mainInsight: ResearchInsight | undefined = undefined;
                        if (researchData.success && researchData.data.results) {
                            const rRes = researchData.data.results.find((r: any) => r.questionLabel === mainLabel && r.hasResearch);
                            if (rRes) {
                                mainInsight = {
                                    documentName: rRes.documentName,
                                    excerpt: rRes.excerpt,
                                    summary: rRes.summary,
                                    introText: rRes.introText,
                                    actionSuggestion: rRes.actionSuggestion
                                };
                            }
                        }

                        // Update sub-questions
                        const updatedSubQuestions = q.subQuestions.map((sq, sqIndex) => {
                            const subLabel = `${mainLabel}${numberToLetter(sqIndex)}`;
                            const subQIndex = questionsForAI.findIndex(ai => ai.questionId === q.id && ai.subQuestionId === sq.id);

                            const subResult = validationData.data.results.find((r: any) =>
                                r.questionLabel === subLabel || r.questionIndex === subQIndex
                            );

                            // Research Results for Sub
                            let subInsight: ResearchInsight | undefined = undefined;
                            if (researchData.success && researchData.data.results) {
                                const rRes = researchData.data.results.find((r: any) => r.questionLabel === subLabel && r.hasResearch);
                                if (rRes) {
                                    subInsight = {
                                        documentName: rRes.documentName,
                                        excerpt: rRes.excerpt,
                                        summary: rRes.summary,
                                        introText: rRes.introText,
                                        actionSuggestion: rRes.actionSuggestion
                                    };
                                }
                            }

                            return {
                                ...sq,
                                issues: subResult ? subResult.issues : [],
                                overallQuality: subResult ? subResult.overallQuality : sq.overallQuality,
                                researchInsight: subInsight // Update insight
                            };
                        });

                        return {
                            ...q,
                            issues: mainResult ? mainResult.issues : [],
                            overallQuality: mainResult ? mainResult.overallQuality : q.overallQuality,
                            researchInsight: mainInsight, // Update insight
                            subQuestions: updatedSubQuestions
                        };
                    });

                    return { ...s, questions: updatedQuestions, isChecking: false };
                }));

                setHasUnsavedChanges(true);

            } else {
                toast.error("Failed to check questions: " + (validationData.error || "Unknown error"));
                setGuideSets(prev => prev.map(s =>
                    s.id === setId ? { ...s, isChecking: false } : s
                ));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to check questions");
            setGuideSets(prev => prev.map(s =>
                s.id === setId ? { ...s, isChecking: false } : s
            ));
        }
    }, [guideSets, project]);

    // Dismiss a suggestion
    const dismissSuggestion = (setId: string, questionId: string, subQuestionId: string | undefined, issueIndex: number) => {
        setGuideSets(prev => prev.map(s => {
            if (s.id !== setId) return s;

            const updatedQuestions = s.questions.map(q => {
                if (q.id === questionId) {
                    // Handle Sub-question
                    if (subQuestionId) {
                        const updatedSubQuestions = q.subQuestions.map(sq => {
                            if (sq.id === subQuestionId && sq.issues) {
                                const newIssues = [...sq.issues];
                                newIssues.splice(issueIndex, 1);
                                return { ...sq, issues: newIssues };
                            }
                            return sq;
                        });
                        return { ...q, subQuestions: updatedSubQuestions };
                    }
                    // Handle Main question
                    else if (q.issues) {
                        const newIssues = [...q.issues];
                        newIssues.splice(issueIndex, 1);
                        return { ...q, issues: newIssues };
                    }
                }
                return q;
            });

            return { ...s, questions: updatedQuestions };
        }));
        setExpandedSuggestionId(null); // Collapse after dismissing
    };

    // Save guide sets
    const saveGuideSets = async () => {
        // Validate
        for (const set of guideSets) {
            if (!set.title.trim()) {
                toast.error("Please provide a title for all question sets");
                return false;
            }
            if (!set.intent.trim()) {
                toast.error("Please provide an intent for all question sets");
                return false;
            }
            const validQuestions = set.questions.filter(q => q.text.trim());
            if (validQuestions.length === 0) {
                toast.error(`Please add at least one question to "${set.title}"`);
                return false;
            }
        }

        setSaving(true);
        try {
            const res = await fetch("/api/guides", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    subProjectId: subProjectId || undefined,
                    guideVersionId: currentGuideId || undefined, // Save to specific guide
                    guideName: guideName,
                    guideSets: guideSets.map(set => ({
                        title: set.title,
                        intent: set.intent,
                        questions: set.questions.filter(q => q.text.trim()).map(q => ({
                            text: q.text,
                            intent: q.intent || undefined,
                            issues: q.issues,
                            overallQuality: q.overallQuality,
                            researchInsight: q.researchInsight,
                            subQuestions: q.subQuestions
                                .filter(sq => sq.text.trim())
                                .map(sq => ({
                                    text: sq.text,
                                    intent: sq.intent || undefined,
                                    issues: sq.issues,
                                    overallQuality: sq.overallQuality,
                                    researchInsight: sq.researchInsight
                                }))
                        }))
                    }))
                })
            });

            const data = await res.json();
            if (data.success) {
                setHasUnsavedChanges(false);
                setHasSavedGuide(true); // Mark that guide has been saved
                return true;
            } else {
                toast.error("Failed to save: " + (data.error || "Unknown error"));
                return false;
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to save guide");
            return false;
        } finally {
            setSaving(false);
        }
    };

    // Finish setup
    const finishSetup = async () => {
        setFinishing(true);

        // Save first
        const saved = await saveGuideSets();
        if (!saved) {
            setFinishing(false);
            return;
        }

        // Mark project as complete
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ setupComplete: true })
            });

            const data = await res.json();
            if (data.success) {
                router.push(`/projects/${projectId}/sub/${subProjectId}`);
            } else {
                toast.error("Failed to complete setup: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to complete setup");
        } finally {
            setFinishing(false);
        }
    };

    // Import guide from pasted text
    const importGuide = async () => {
        if (!importText.trim()) {
            setImportError("Please paste some guide text first");
            return;
        }

        setImporting(true);
        setImportError(null);
        setImportSuccess(null);

        try {
            const res = await fetch("/api/gemini/parse-guide", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ guideText: importText })
            });

            const data = await res.json();

            if (!data.success) {
                setImportError(data.error || "Failed to parse guide");
                return;
            }

            const parsedSections = data.data.sections;

            if (!parsedSections || parsedSections.length === 0) {
                setImportError("No sections could be parsed from the text");
                return;
            }

            // Check if current guide is effectively empty (single empty section)
            const isCurrentlyEmpty = guideSets.length === 1 &&
                !guideSets[0].title &&
                !guideSets[0].intent &&
                guideSets[0].questions.length === 1 &&
                !guideSets[0].questions[0].text;

            // Convert parsed sections to GuideSet format
            const newSections: GuideSet[] = parsedSections.map((section: any) => ({
                id: generateId(),
                title: section.title,
                intent: section.intent,
                questions: section.questions.map((q: any) => ({
                    id: generateId(),
                    text: q.text,
                    intent: "",
                    subQuestions: q.subQuestions.map((sq: any) => ({
                        id: generateId(),
                        text: sq.text,
                        intent: ""
                    }))
                })),
                isExpanded: true,
                isChecking: false
            }));

            // If empty, replace. Otherwise, append.
            if (isCurrentlyEmpty) {
                setGuideSets(newSections);
            } else {
                setGuideSets(prev => [...prev, ...newSections]);
            }

            setHasUnsavedChanges(true);
            setImportSuccess({
                sections: parsedSections.length,
                questions: data.data.questionCount
            });

            // Close dialog after short delay to show success
            setTimeout(() => {
                setImportDialogOpen(false);
                setImportText("");
                setImportSuccess(null);
            }, 1500);

        } catch (err) {
            console.error("Import error:", err);
            setImportError("An error occurred while parsing the guide");
        } finally {
            setImporting(false);
        }
    };

    // Check all guides
    const checkAllGuides = async () => {
        if (guideSets.length === 0) return;

        // Mark all as checking first to give immediate feedback
        setGuideSets(prev => prev.map(s =>
            s.questions.some(q => q.text.trim()) ? { ...s, isChecking: true } : s
        ));

        // Use a loop to check sequentially to avoid overwhelming the API
        for (const set of guideSets) {
            // Only check if it has questions
            const validQuestions = set.questions.filter(q => q.text.trim());
            if (validQuestions.length > 0) {
                await runQualityCheck(set.id);
            }
        }
    };

    // Export guide to text file
    const exportGuide = () => {
        let content = `MODERATOR GUIDE: ${guideName}\n`;
        content += `Date: ${new Date().toLocaleDateString()}\n\n`;

        guideSets.forEach((set, index) => {
            content += `SECTION ${index + 1}: ${set.title.toUpperCase()}\n`;
            content += `Intent: ${set.intent}\n`;
            content += `------------------------------------------------\n\n`;

            set.questions.forEach((q, qIndex) => {
                content += `Q${qIndex + 1}: ${q.text}\n`;
                if (q.intent) content += `   Intent: ${q.intent}\n`;

                // Add feedback if available
                if (q.overallQuality) content += `   [Quality: ${q.overallQuality}]\n`;
                if (q.issues && q.issues.length > 0) {
                    content += `   [Feedback]:\n`;
                    q.issues.forEach(issue => {
                        content += `   - ${issue.explanation} (Suggestion: ${issue.suggestedRewrite})\n`;
                    });
                }
                content += `\n`;

                // Sub-questions
                q.subQuestions.forEach((sq, sqIndex) => {
                    const letter = String.fromCharCode(65 + sqIndex);
                    content += `   ${letter}. ${sq.text}\n`;
                    if (sq.intent) content += `      Intent: ${sq.intent}\n`;

                    if (sq.overallQuality) content += `      [Quality: ${sq.overallQuality}]\n`;
                    if (sq.issues && sq.issues.length > 0) {
                        content += `      [Feedback]:\n`;
                        sq.issues.forEach(issue => {
                            content += `      - ${issue.explanation} (Suggestion: ${issue.suggestedRewrite})\n`;
                        });
                    }
                    content += `\n`;
                });
            });
            content += `\n\n`;
        });

        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${guideName.replace(/\s+/g, '_')}_Guide.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Quality indicator
    // Only show Good badge - hide Needs Work and Issues badges as per user request
    const getQualityBadge = (quality?: string) => {
        if (quality === 'GOOD') {
            return <Badge className="bg-accent text-foreground border-border"><CheckCircle2 className="h-3 w-3 mr-1" /> Good</Badge>;
        }
        return null;
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'HIGH':
                return 'text-[color:var(--danger)] bg-[color:var(--danger-soft)] border-[color:var(--danger)]/25'
            case 'MEDIUM':
                return 'text-[color:var(--warning)] bg-[color:var(--warning-soft)] border-[color:var(--warning)]/25'
            case 'LOW':
                return 'text-[color:var(--info)] bg-[color:var(--info-soft)] border-[color:var(--info)]/25'
            default:
                return 'text-muted-foreground bg-[color:var(--surface-muted)] border-[color:var(--border-subtle)]'
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalQuestions = guideSets.reduce((sum, s) => sum + s.questions.length, 0)
    const setsWithQuestions = guideSets.filter((s) => s.questions.length > 0).length
    const setsWithTitles = guideSets.filter((s) => s.title.trim().length > 0).length

    const statusLabel = hasUnsavedChanges
        ? "Unsaved"
        : hasSavedGuide
        ? "Saved"
        : "Draft"
    const statusBadgeVariant: "default" | "warning" | "success" =
        hasUnsavedChanges ? "warning" : hasSavedGuide ? "success" : "default"

    const leftRail = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant}>{statusLabel}</Badge>
                    {saving && <span className="text-caption text-muted-foreground">Saving…</span>}
                </div>
                <h2 className="text-display-5 text-foreground leading-tight">
                    {guideName || "Moderator Guide"}
                </h2>
                {project?.name && (
                    <p className="text-body-sm text-muted-foreground">
                        For <span className="text-foreground">{project.name}</span>
                    </p>
                )}
            </RailHeader>

            <RailSection title="Question sets">
                {guideSets.length === 0 ? (
                    <p className="text-body-sm text-muted-foreground">No question sets yet.</p>
                ) : (
                    <div className="flex flex-col gap-0.5">
                        {guideSets.map((set, idx) => (
                            <JumpItem
                                key={set.id}
                                label={set.title.trim() || `Untitled set ${idx + 1}`}
                                count={set.questions.length}
                                active={activeSetId === set.id}
                                onClick={() => handleJumpToSet(set.id)}
                            />
                        ))}
                    </div>
                )}
            </RailSection>

            <RailSection title="Readiness" last>
                <div className="flex flex-col gap-2">
                    <ReadinessRow
                        done={setsWithTitles === guideSets.length && guideSets.length > 0}
                        label="Every set has a title"
                    />
                    <ReadinessRow
                        done={setsWithQuestions === guideSets.length && guideSets.length > 0}
                        label="Every set has a question"
                    />
                    <ReadinessRow done={hasSavedGuide} label="Guide saved" />
                </div>
            </RailSection>

            {/* Trailing spacer — fills remaining aside height with surface bg (session-review-v2.jsx:404) */}
            <div className="flex-1" />
        </>
    )

    // Build flat list of all feedback + research items for the right rail
    const allFeedbackItems: Array<{
        kind: 'feedback' | 'research';
        id: string;
        setId: string;
        questionId: string;
        subQuestionId?: string;
        questionRef: string;
        severity?: 'HIGH' | 'MEDIUM' | 'LOW';
        title: string;
        explanation?: string;
        suggestedRewrite?: string;
        source?: string;
        excerpt?: string;
        introText?: string;
        actionSuggestion?: string;
        summary?: string;
    }> = [];

    guideSets.forEach((set) => {
        set.questions.forEach((q, qIndex) => {
            const setLabel = set.title.trim() || 'Set';
            const qLabel = `Q${qIndex + 1}`;
            // Main question feedback
            if (q.overallQuality !== 'GOOD' && q.issues && q.issues.length > 0) {
                const issue = q.issues[0];
                allFeedbackItems.push({
                    kind: 'feedback',
                    id: `${q.id}-main-0`,
                    setId: set.id,
                    questionId: q.id,
                    questionRef: `${setLabel} · ${qLabel}`,
                    severity: issue.severity,
                    title: issue.type || 'Issue',
                    explanation: issue.explanation,
                    suggestedRewrite: issue.suggestedRewrite,
                });
            }
            // Main question research
            if (q.researchInsight) {
                allFeedbackItems.push({
                    kind: 'research',
                    id: `${q.id}-research`,
                    setId: set.id,
                    questionId: q.id,
                    questionRef: `${setLabel} · ${qLabel}`,
                    title: q.researchInsight.summary || 'Research Insight',
                    source: q.researchInsight.documentName,
                    excerpt: q.researchInsight.excerpt,
                    introText: q.researchInsight.introText,
                    actionSuggestion: q.researchInsight.actionSuggestion,
                    summary: q.researchInsight.summary,
                });
            }
            // Sub-questions
            q.subQuestions.forEach((sq, sqIndex) => {
                const sqLabel = `${qLabel}${numberToLetter(sqIndex)}`;
                if (sq.overallQuality !== 'GOOD' && sq.issues && sq.issues.length > 0) {
                    const issue = sq.issues[0];
                    allFeedbackItems.push({
                        kind: 'feedback',
                        id: `${q.id}-sub-${sq.id}-0`,
                        setId: set.id,
                        questionId: q.id,
                        subQuestionId: sq.id,
                        questionRef: `${setLabel} · ${sqLabel}`,
                        severity: issue.severity,
                        title: issue.type || 'Issue',
                        explanation: issue.explanation,
                        suggestedRewrite: issue.suggestedRewrite,
                    });
                }
                if (sq.researchInsight) {
                    allFeedbackItems.push({
                        kind: 'research',
                        id: `${sq.id}-research`,
                        setId: set.id,
                        questionId: q.id,
                        subQuestionId: sq.id,
                        questionRef: `${setLabel} · ${sqLabel}`,
                        title: sq.researchInsight.summary || 'Research Insight',
                        source: sq.researchInsight.documentName,
                        excerpt: sq.researchInsight.excerpt,
                        introText: sq.researchInsight.introText,
                        actionSuggestion: sq.researchInsight.actionSuggestion,
                        summary: sq.researchInsight.summary,
                    });
                }
            });
        });
    });

    const filteredItems = allFeedbackItems.filter((item) => {
        if (railFilter === 'All') return true;
        if (railFilter === 'Feedback') return item.kind === 'feedback';
        if (railFilter === 'Research') return item.kind === 'research';
        return true;
    });

    const getSeverityDotColor = (severity?: string) => {
        switch (severity) {
            case 'HIGH': return 'bg-[color:var(--danger)]';
            case 'MEDIUM': return 'bg-[color:var(--warning)]';
            case 'LOW': return 'bg-[color:var(--info)]';
            default: return 'bg-muted-foreground';
        }
    };

    const rightRail = (
        <>
            {/* Rail header — matches interview simulation.jsx:510-532 */}
            {/* px-[22px] pt-[22px] pb-[14px] — padding:'20px 20px 14px' */}
            <div className="px-[22px] pt-[22px] pb-[14px] flex items-center justify-between border-b border-[color:var(--border-subtle)]">
                {/* text-display-4 — matches display fontSize:18 */}
                <div className="text-display-4 text-foreground">AI Feedback</div>
                {/* "N found" pill — matches interview simulation.jsx:516-517 Badge color="amber" */}
                <span className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-[color:var(--surface-muted)] shadow-inset-edge">
                    <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)]" />
                    <span className="text-[11.5px] font-semibold text-foreground">{allFeedbackItems.length} found</span>
                </span>
            </div>

            {/* Filter tabs — matches interview simulation.jsx:518-531 */}
            {/* gap-1 px-[22px] py-2.5 — gap:6, marginTop:14 on filter wrap */}
            <div className="flex gap-1 px-[22px] py-2.5 border-b border-[color:var(--border-subtle)]">
                {(['All', 'Feedback', 'Research'] as const).map((tab) => {
                    const active = railFilter === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setRailFilter(tab)}
                            className={`h-7 px-3 rounded-full text-[12px] font-medium transition-colors ${
                                active
                                    ? 'bg-[color:var(--ink)] text-white'
                                    : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)]/60'
                            }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Scrollable card list — matches interview simulation.jsx:535-545 */}
            {/* flex-1 overflow-y-auto padding:14, gap:10 */}
            <div className="flex-1 overflow-y-auto px-4 py-3.5 flex flex-col gap-2.5">
                {filteredItems.length === 0 ? (
                    <p className="text-body-sm text-muted-foreground text-center mt-8">
                        {allFeedbackItems.length === 0
                            ? 'Nothing yet. Run \u201cCheck All\u201d to surface feedback.'
                            : 'No items match this filter.'}
                    </p>
                ) : (
                    filteredItems.map((item) => {
                        const isExpanded = expandedSuggestionId === item.id;
                        return (
                            <div
                                key={item.id}
                                id={`rail-card-${item.id}`}
                                data-feedback-card
                                onClick={() => {
                                    if (!isExpanded) {
                                        setExpandedSuggestionId(item.id);
                                        const questionEl = document.getElementById(`q-${item.questionId}`);
                                        if (questionEl) {
                                            questionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }
                                        setFlashQuestionId(item.questionId);
                                        setTimeout(() => setFlashQuestionId(null), 1600);
                                    } else {
                                        setExpandedSuggestionId(null);
                                    }
                                }}
                                // RailCard outer — matches interview simulation.jsx:549-562
                                // bg-white rounded-[14px] border border-[borderSubtle] shadow-inset-edge cursor-pointer
                                // expanded: amber-pulse ring (outlineRing + 1.5px amberUnderline)
                                className={`bg-white rounded-[14px] border cursor-pointer transition-all duration-150 ${
                                    isExpanded
                                        ? 'border-[color:var(--border-subtle)] shadow-[0_0_0_1.5px_color-mix(in_oklab,var(--primary)_45%,transparent),var(--shadow-outline-ring)]'
                                        : 'border-[color:var(--border-subtle)] shadow-inset-edge hover:shadow-outline-ring'
                                }`}
                            >
                                {/* Collapsed — matches interview simulation.jsx:563-579 */}
                                {!isExpanded && (
                                    <div className="p-[12px_14px] flex flex-col gap-2">
                                        {/* Header row */}
                                        <div className="flex items-center gap-2.5">
                                            {/* Severity dot — w-1.5 h-1.5 rounded-full */}
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                item.kind === 'feedback'
                                                    ? getSeverityDotColor(item.severity)
                                                    : 'bg-[color:var(--knowledge)]'
                                            }`} />
                                            {/* Question ref in MONO — text-[11px] text-muted-foreground font-mono */}
                                            <span className="text-[11px] text-muted-foreground font-mono flex-1 truncate">
                                                {item.questionRef}
                                            </span>
                                            <ChevronDown className="text-muted-foreground shrink-0" style={{ width: 14, height: 14 }} />
                                        </div>
                                        {/* Body — text-[13.5px] text-foreground leading-[1.5] mt-2 line-clamp-2 */}
                                        <p className="text-[13.5px] text-foreground leading-[1.5] mt-2 line-clamp-2">
                                            {item.kind === 'feedback' ? item.explanation : item.excerpt}
                                        </p>
                                    </div>
                                )}

                                {/* Expanded — matches interview simulation.jsx:582-661 */}
                                {isExpanded && (
                                    <div className="p-[14px_16px_16px] flex flex-col gap-3.5">
                                        {/* Meta row */}
                                        <div className="flex items-center gap-2.5">
                                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                item.kind === 'feedback'
                                                    ? getSeverityDotColor(item.severity)
                                                    : 'bg-[color:var(--knowledge)]'
                                            }`} />
                                            <span className="text-[11px] text-muted-foreground font-mono flex-1 truncate">
                                                {item.questionRef}
                                            </span>
                                            {/* Close X — matches interview simulation.jsx:593-600 */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setExpandedSuggestionId(null); }}
                                                className="h-[22px] w-[22px] flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground transition-colors border-none bg-transparent"
                                            >
                                                <X style={{ width: 13, height: 13 }} strokeWidth={1.8} />
                                            </button>
                                        </div>

                                        {item.kind === 'feedback' ? (
                                            <>
                                                {/* The issue — guide-adapted: AI-written explanation, not a verbatim quote (no italic) */}
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="text-[10.5px] font-semibold text-muted-foreground tracking-[0.12em] uppercase">
                                                        Why this needs a look
                                                    </div>
                                                    <p className="text-[13.5px] text-foreground leading-[1.6]">
                                                        {item.explanation}
                                                    </p>
                                                </div>

                                                {/* Suggested rewrite — guide-adapted: proposed better version of the question, accent quote block since this is literal question copy */}
                                                {item.suggestedRewrite && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="text-[10.5px] font-semibold text-muted-foreground tracking-[0.12em] uppercase">
                                                            Suggested rewrite
                                                        </div>
                                                        <div className="border-l-2 border-[color:var(--primary)] pl-3 ml-0.5">
                                                            <p className="text-[13.5px] text-foreground leading-[1.55]">
                                                                {item.suggestedRewrite.replace(/^Reflection:\s*/i, '')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Dismiss */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dismissSuggestion(item.setId, item.questionId, item.subQuestionId, 0);
                                                    }}
                                                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-[color:var(--danger)] font-medium transition-colors mt-0.5"
                                                >
                                                    <Trash2 className="h-3 w-3" /> Dismiss
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {/* Research intro */}
                                                <p className="text-[13.5px] text-foreground leading-[1.6]">
                                                    {item.introText || 'Relevant insights from your research:'}
                                                </p>

                                                {/* Knowledge left-border excerpt — parallel to amber treatment for research */}
                                                <div className="border-l-2 border-[color:var(--knowledge)] pl-3 ml-0.5">
                                                    <p className="text-[14px] text-foreground leading-[1.5] italic">
                                                        &ldquo;{item.excerpt}&rdquo;
                                                    </p>
                                                    {item.source && (
                                                        <p className="text-[10px] text-[color:var(--knowledge)] font-medium mt-1.5 text-right">— {item.source}</p>
                                                    )}
                                                </div>

                                                {/* How to apply — guide-adapted: actionable suggestion for refining the question based on this research */}
                                                {item.actionSuggestion && (
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="text-[10.5px] font-semibold text-muted-foreground tracking-[0.12em] uppercase">
                                                            How to apply
                                                        </div>
                                                        <p className="text-[13px] text-muted-foreground leading-[1.55]">
                                                            {item.actionSuggestion}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </>
    );

    return (
        <div className="flex flex-col">
            <PageBar
                back={{
                    href: subProjectId
                        ? `/projects/${projectId}/sub/${subProjectId}?tab=guides`
                        : `/projects/${projectId}`,
                    label: "Back",
                }}
                crumbs={
                    project?.name
                        ? [
                              { label: project.name, href: `/projects/${projectId}` },
                              { label: "Moderator Guide" },
                          ]
                        : undefined
                }
                action={
                    <div className="flex items-center gap-2">
                        {/* PillGhost — h-8 px-3 rounded-full bg-white shadow-outline-ring text-[12.5px] font-medium */}
                        <button
                            onClick={checkAllGuides}
                            disabled={guideSets.some(s => s.isChecking)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-[12.5px] font-medium text-foreground shadow-outline-ring transition-colors hover:bg-[color:var(--surface-muted)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {guideSets.some(s => s.isChecking) ? (
                                <>
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Checking…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3 w-3" />
                                    Check All
                                </>
                            )}
                        </button>
                        {/* Primary pill — h-8 px-[14px] bg-foreground text-white rounded-full text-[12.5px] font-medium shadow-card */}
                        <button
                            onClick={saveGuideSets}
                            disabled={saving || finishing}
                            className="inline-flex items-center gap-1.5 h-8 px-[14px] rounded-full bg-[color:var(--ink)] text-white text-[12.5px] font-medium shadow-card transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                            Save
                        </button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="inline-flex items-center justify-center h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-[color:var(--surface-muted)]/60 transition-colors" title="More actions">
                                    <MoreHorizontal className="h-4 w-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={exportGuide}>
                                    <Download className="h-3.5 w-3.5 mr-2" />
                                    Export Guide
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setImportDialogOpen(true)} disabled={saving || finishing || importing}>
                                    <ClipboardPaste className="h-3.5 w-3.5 mr-2" />
                                    Import Guide
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            {/* Main Content Container */}
            <WorkspaceFrame variant="platform" leftRail={leftRail} rightRail={rightRail}>
                {/* Hero — session-review-v2.jsx:411-419: maxWidth:820, marginBottom:28 */}
                <div className="max-w-[820px] mb-7">
                    <h1 className="text-display-1 text-foreground">Moderator Guide</h1>
                    {/* fontSize:13.5 → text-body, lineHeight:1.7, marginTop:14 → mt-3.5 */}
                    <p className="text-body text-muted-foreground mt-3.5">
                        Design the question sets the AI moderator will use. Each set should have an intent and a few questions; quality feedback and research insights appear in the right rail.
                    </p>
                </div>
                <div className="relative min-h-[600px]">
                    {/* Legend */}
                    <div className="flex justify-end mb-8">
                        <div className="inline-flex items-center gap-4 text-xs text-muted-foreground px-4 py-2.5 bg-muted rounded-md border border-border">
                            <span className="font-medium text-foreground">Legend:</span>
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground border border-border">
                                    <MessageSquareWarning className="h-3 w-3" />
                                </div>
                                <span>Feedback / Issues</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-md bg-[color:var(--knowledge-soft)] flex items-center justify-center text-[color:var(--knowledge)] border border-[color:var(--knowledge)]/25">
                                    <FileText className="h-3 w-3" />
                                </div>
                                <span>Research Insight</span>
                            </div>
                        </div>
                    </div>

                    {/* Import Guide Dialog - Dialog content only (triggered from sticky bar) */}
                    <Dialog open={importDialogOpen} onOpenChange={(open) => {
                        setImportDialogOpen(open);
                        if (!open) {
                            setImportText("");
                            setImportError(null);
                            setImportSuccess(null);
                        }
                    }}>
                        <DialogContent className="sm:max-w-2xl bg-background border-border">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-foreground">
                                    <div className="p-2 rounded-md bg-accent border border-border">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    Import Existing Guide
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Copy and paste your moderator guide text below. It will be automatically parsed into topic sections with questions and follow-ups.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="py-4 space-y-4">
                                {/* Text Input Area */}
                                <div className="relative">
                                    <Textarea
                                        placeholder={`Paste your moderator guide text here...

Example format:
TOPIC 1: Daily Routines
What we want to uncover: Understanding how participants structure their day

1. Walk me through a typical day
   - What's the first thing you do?
   - How do you decide what to prioritize?

2. Tell me about your morning routine
   - Has it changed recently?`}
                                        value={importText}
                                        onChange={(e) => setImportText(e.target.value)}
                                        disabled={importing}
                                        className="h-[280px] resize-none overflow-y-auto bg-muted/50 border-input text-sm font-mono"
                                    />
                                    {importText && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setImportText("")}
                                            className="absolute top-2 right-2 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Character count */}
                                <div className="text-xs text-muted-foreground text-right">
                                    {importText.length.toLocaleString()} characters
                                </div>

                                {/* Error Message */}
                                {importError && (
                                    <div className="flex items-start gap-2 p-3 rounded-lg bg-[color:var(--danger-soft)] border border-[color:var(--danger)]/25 text-[color:var(--danger)] text-sm">
                                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>{importError}</span>
                                    </div>
                                )}

                                {/* Success Message */}
                                {importSuccess && (
                                    <div className="flex items-start gap-2 p-3 rounded-md bg-accent border border-border text-foreground text-sm">
                                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>
                                            Successfully imported {importSuccess.sections} topic section{importSuccess.sections !== 1 ? 's' : ''} with {importSuccess.questions} question{importSuccess.questions !== 1 ? 's' : ''}!
                                        </span>
                                    </div>
                                )}

                                {/* Parsing indicator */}
                                {importing && (
                                    <div className="flex items-center justify-center gap-3 p-4 rounded-md bg-accent border border-border">
                                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        <div className="text-sm text-foreground">
                                            <span className="font-medium">Parsing your guide...</span>
                                            <span className="text-muted-foreground ml-1">This may take a few seconds</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setImportDialogOpen(false)}
                                    disabled={importing}
                                    className="border-input"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={importGuide}
                                    disabled={importing || !importText.trim() || !!importSuccess}
                                    className=""
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Parsing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            Import
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Content Area */}
                    <div>
                        <div className="pb-8">

                            {/* Guide Sets */}
                            <div className="flex flex-col gap-6">
                            {guideSets.map((set) => (
                                <div
                                    key={set.id}
                                    id={`guideset-${set.id}`}
                                    data-guideset-id={set.id}
                                    className="bg-card rounded-xl border border-border animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-[120px]"
                                >
                                    {/* Header Section */}
                                    <div className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => toggleGuideSet(set.id)}
                                                        className="mt-1 text-muted-foreground hover:text-primary transition-colors p-1 rounded-md hover:bg-accent"
                                                    >
                                                        {set.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                    </button>
                                                    <BookOpen className="h-5 w-5 text-primary" />
                                                    <Input
                                                        placeholder="Question Set Title"
                                                        value={set.title}
                                                        onChange={(e) => updateGuideSet(set.id, 'title', e.target.value)}
                                                        className="text-lg font-bold flex-1 bg-transparent border-transparent hover:bg-accent/40 focus:bg-accent/60 rounded-md transition-all px-2 -ml-2 text-foreground placeholder:text-muted-foreground/50"
                                                    />
                                                </div>
                                                <div className="ml-10">
                                                    <Label className="text-xs text-primary/70 font-medium uppercase tracking-wide mb-1.5 block">What we want to uncover</Label>
                                                    <Textarea
                                                        placeholder="Describe the intent... e.g., Understand how participants structure their day"
                                                        value={set.intent}
                                                        onChange={(e) => updateGuideSet(set.id, 'intent', e.target.value)}
                                                        rows={2}
                                                        className="text-sm resize-none bg-accent/40 border-transparent hover:bg-accent/60 focus:bg-accent/80 rounded-md transition-all placeholder:text-muted-foreground/50"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => runQualityCheck(set.id)}
                                                    disabled={set.isChecking}
                                                    className="text-xs h-8"
                                                >
                                                    {set.isChecking ? (
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="h-3 w-3 mr-1" />
                                                    )}
                                                    Check
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeGuideSet(set.id)}
                                                    className="text-muted-foreground hover:text-[color:var(--danger)] h-8 w-8"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body Section */}
                                    {set.isExpanded && (
                                        <div className="px-6 pb-6 space-y-6">
                                            {set.questions.map((question, qIndex) => (
                                                <div
                                                    key={question.id}
                                                    id={`q-${question.id}`}
                                                    className={`space-y-4 rounded-lg transition-all duration-300 ${flashQuestionId === question.id ? 'ring-2 ring-[color:var(--primary)]/25 ring-offset-2' : ''}`}
                                                >
                                                    {/* Main Question Row */}
                                                    <div className="grid grid-cols-[1fr_auto] gap-3 items-start group">
                                                        {/* Main Input */}
                                                        <div className="flex items-start gap-3">
                                                            <span className="text-sm text-muted-foreground font-mono pt-2.5 w-6 text-right font-semibold shrink-0">
                                                                {qIndex + 1}.
                                                            </span>
                                                            <div className="flex-1 space-y-2">
                                                                <div className="flex items-center gap-2">
                                                                    <AutoResizeTextarea
                                                                        placeholder="Enter your question..."
                                                                        value={question.text}
                                                                        onChange={(e: any) => updateQuestion(set.id, question.id, 'text', e.target.value)}
                                                                        className="flex-1 bg-[color:var(--canvas)] border-input hover:border-border hover:bg-card focus:bg-card rounded-md transition-all min-h-[50px] resize-none py-3 placeholder:text-muted-foreground/50"
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => removeQuestion(set.id, question.id)}
                                                                        aria-label="Remove question"
                                                                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-[color:var(--danger)] transition-opacity h-8 w-8 shrink-0"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                                {/* Follow-up button */}
                                                                <button
                                                                    onClick={() => addSubQuestion(set.id, question.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-xs text-[color:var(--info)] hover:text-[color:var(--info)] font-medium flex items-center gap-1 ml-1 transition-all duration-200 hover:gap-1.5"
                                                                    title="Add follow-up question"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                    <span>Add follow-up</span>
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Feedback & Research indicator icons */}
                                                        <div className="flex items-center gap-1.5 pt-1 shrink-0">
                                                            {getQualityBadge(question.overallQuality)}
                                                            {question.overallQuality !== 'GOOD' && question.issues && question.issues.length > 0 && (
                                                                <button
                                                                    onClick={() => focusFeedback(`${question.id}-main-0`, question.id)}
                                                                    className="h-8 w-8 rounded-lg bg-[color:var(--surface-muted)] text-muted-foreground flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
                                                                    title="View Feedback in rail"
                                                                >
                                                                    <MessageSquareWarning className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            {question.researchInsight && (
                                                                <button
                                                                    onClick={() => focusFeedback(`${question.id}-research`, question.id)}
                                                                    className="h-8 w-8 rounded-lg bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)] flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
                                                                    title="View Research Insight in rail"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Sub-questions Loop */}
                                                    {question.subQuestions.map((subQ, sqIndex) => (
                                                        <div
                                                            key={subQ.id}
                                                            id={`q-${subQ.id}`}
                                                            className={`grid grid-cols-[1fr_auto] gap-3 items-start group/sub rounded-lg transition-all duration-300 ${flashQuestionId === subQ.id ? 'ring-2 ring-[color:var(--primary)]/25 ring-offset-2' : ''}`}
                                                        >
                                                            {/* Sub Input */}
                                                            <div className="flex items-start gap-3 pl-10 border-l-2 border-border ml-3">
                                                                <span className="text-sm text-[color:var(--info)] font-mono pt-2.5 w-8 text-right shrink-0">
                                                                    {qIndex + 1}{numberToLetter(sqIndex)}.
                                                                </span>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <AutoResizeTextarea
                                                                            placeholder="Enter follow-up question..."
                                                                            value={subQ.text}
                                                                            onChange={(e: any) => updateSubQuestion(set.id, question.id, subQ.id, 'text', e.target.value)}
                                                                            className="flex-1 bg-[color:var(--canvas)] border-input hover:border-border hover:bg-card focus:bg-card rounded-md transition-all min-h-[44px] resize-none py-2.5 placeholder:text-muted-foreground/50"
                                                                        />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => removeSubQuestion(set.id, question.id, subQ.id)}
                                                                            aria-label="Remove follow-up"
                                                                            className="opacity-0 group-hover/sub:opacity-100 text-muted-foreground hover:text-[color:var(--danger)] transition-opacity h-8 w-8 shrink-0"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Sub feedback/research icons */}
                                                            <div className="flex items-center gap-1.5 pt-1 shrink-0">
                                                                {getQualityBadge(subQ.overallQuality)}
                                                                {subQ.overallQuality !== 'GOOD' && subQ.issues && subQ.issues.length > 0 && (
                                                                    <button
                                                                        onClick={() => focusFeedback(`${question.id}-sub-${subQ.id}-0`, question.id)}
                                                                        className="h-8 w-8 rounded-lg bg-[color:var(--surface-muted)] text-muted-foreground flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
                                                                        title="View Feedback in rail"
                                                                    >
                                                                        <MessageSquareWarning className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                {subQ.researchInsight && (
                                                                    <button
                                                                        onClick={() => focusFeedback(`${subQ.id}-research`, question.id)}
                                                                        className="h-8 w-8 rounded-lg bg-[color:var(--knowledge-soft)] text-[color:var(--knowledge)] flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
                                                                        title="View Research Insight in rail"
                                                                    >
                                                                        <FileText className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}

                                            <div className="pl-9">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => addQuestion(set.id)}
                                                    className="text-primary hover:text-primary/90 hover:bg-accent"
                                                >
                                                    <Plus className="h-4 w-4 mr-1" />
                                                    Add Question
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            </div>

                            <Button
                                variant="outline"
                                onClick={addGuideSet}
                                className="mt-6 w-full border-dashed border-2 border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-accent"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Topic Section
                            </Button>
                        </div>
                    </div>
                </div>
            </WorkspaceFrame>
        </div >
    );
}

function ReadinessRow({ done, label }: { done: boolean; label: string }) {
    return (
        <div className="flex items-center gap-2 text-body-sm">
            <span
                aria-hidden
                className={
                    done
                        ? "inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-fg)]"
                        : "inline-flex h-3.5 w-3.5 rounded-full shadow-inset-edge bg-[color:var(--surface-muted)]"
                }
            >
                {done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1.5 4.2L3.2 5.8L6.5 2.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </span>
            <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
        </div>
    )
}

// Loading fallback for Suspense
function GuideSetupLoading() {
    return <CenteredSpinner label="Loading guide editor..." />;
}

// Export wrapped in Suspense for useSearchParams
export default function GuideSetupPage() {
    return (
        <Suspense fallback={<GuideSetupLoading />}>
            <GuideSetupPageContent />
        </Suspense>
    );
}

// Created by Swapnil Bapat © 2026
