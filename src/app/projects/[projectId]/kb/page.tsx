"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Upload,
    Loader2,
    FileText,
    Check,
    X,
    Trash2,
    User,
    BookOpen,
    FileSearch,
    Shield,
    HelpCircle,
    BookOpenText,
    Briefcase,
    Heart,
    AlertCircle,
    ChevronRight,
    Clock,
    Eye
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ParsedPersona {
    name?: string;
    age?: string;
    occupation?: string;
    summary?: string;
    gains?: string;
    pains?: string;
}

interface KbDocument {
    id: string;
    title: string;
    docType: string;
    status: string;
    originalFileName: string;
    createdAt: string;
    parsedMetaJson?: string;
    _count?: {
        chunks: number;
    };
}

interface Project {
    id: string;
    name: string;
}

interface PageProps {
    params: Promise<{ projectId: string }>;
}

const DOC_TYPES = ["PERSONA", "FRAMEWORK", "RESEARCH", "POLICY", "OTHER"] as const;

const DOC_TYPE_ICONS: Record<string, typeof User> = {
    PERSONA: User,
    FRAMEWORK: BookOpen,
    RESEARCH: FileSearch,
    POLICY: Shield,
    OTHER: HelpCircle,
};

const DOC_TYPE_LABELS: Record<string, string> = {
    PERSONA: "Personas",
    FRAMEWORK: "Frameworks",
    RESEARCH: "Research",
    POLICY: "Policies",
    OTHER: "Other",
};

function parsePersonaMeta(jsonStr?: string): ParsedPersona | null {
    if (!jsonStr) return null;
    try {
        return JSON.parse(jsonStr);
    } catch {
        return null;
    }
}

export default function ProjectKbPage({ params }: PageProps) {
    const { projectId } = use(params);
    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<KbDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("PERSONA");

    // Upload form state
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadDocType, setUploadDocType] = useState("PERSONA");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [classificationConfirmed, setClassificationConfirmed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // View document state
    const [viewDoc, setViewDoc] = useState<KbDocument | null>(null);

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const fetchData = async () => {
        try {
            const [projectRes, docsRes] = await Promise.all([
                fetch(`/api/projects/${projectId}`),
                fetch(`/api/projects/${projectId}/kb`),
            ]);

            const projectData = await projectRes.json();
            const docsData = await docsRes.json();

            if (projectRes.ok) {
                setProject(projectData.data);
            }

            if (docsRes.ok) {
                setDocuments(docsData.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Polling for unparsed personas
    useEffect(() => {
        const hasUnparsedPersonas = documents.some(
            d => d.docType === "PERSONA" && !d.parsedMetaJson
        );

        if (hasUnparsedPersonas) {
            const interval = setInterval(() => {
                fetchData();
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [documents]);

    const handleUpload = async () => {
        if (!uploadFile || !uploadTitle || !uploadDocType) {
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", uploadFile);
            formData.append("title", uploadTitle);
            formData.append("docType", uploadDocType);

            const res = await fetch(`/api/projects/${projectId}/kb/upload`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Upload failed");
            }

            // Reset form and refresh
            setUploadTitle("");
            setUploadDocType("PERSONA");
            setUploadFile(null);
            setClassificationConfirmed(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            setUploadDialogOpen(false);
            fetchData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const approveDocument = async (documentId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/kb/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId }),
            });

            if (!res.ok) throw new Error("Approval failed");
            fetchData();
        } catch (err) {
            alert("Failed to approve document");
        }
    };

    const rejectDocument = async (documentId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/kb/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId }),
            });

            if (!res.ok) throw new Error("Rejection failed");
            fetchData();
        } catch (err) {
            alert("Failed to reject document");
        }
    };

    const deleteDocument = async (documentId: string) => {
        if (!confirm("Are you sure you want to delete this document?")) {
            return;
        }

        try {
            const res = await fetch(`/api/projects/${projectId}/kb/documents/${documentId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Delete failed");
            fetchData();
        } catch (err) {
            alert("Failed to delete document");
        }
    };

    const filteredDocuments = documents.filter(d => d.docType === activeTab);
    const docCounts = DOC_TYPES.reduce((acc, type) => {
        acc[type] = documents.filter(d => d.docType === type).length;
        return acc;
    }, {} as Record<string, number>);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-accent">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <div className="py-8">

                    {/* Back Link */}
                    <Link
                        href={`/projects/${projectId}`}
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {project?.name || "Project"}
                    </Link>

                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="h-10 w-10 rounded-md flex items-center justify-center shrink-0 mt-1" style={{ backgroundColor: 'var(--color-knowledge-muted)', color: 'var(--color-knowledge)' }}>
                                <BookOpenText className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-semibold tracking-tight mb-3">
                                    Project Knowledge Base
                                </h1>
                                <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
                                    Manage project-specific personas, frameworks, and documents used to ground the AI in this research context.
                                </p>
                            </div>
                        </div>

                        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                            <DialogTrigger asChild>
                                <button className="group relative flex items-center gap-2 px-4 py-2 rounded-md bg-background border border-input text-foreground shadow-sm hover:bg-accent transition-all duration-300 text-sm font-medium overflow-hidden cursor-pointer">
                                    <Upload className="h-3.5 w-3.5 relative z-10" />
                                    <span className="relative z-10">Upload Document</span>
                                </button>
                            </DialogTrigger>
                            <DialogContent className="bg-background border-border shadow-lg rounded-md p-0 gap-0 overflow-hidden max-w-[500px]">
                                <DialogHeader className="p-6 pb-4 border-b border-border/50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border border-border text-foreground">
                                            <Upload className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <DialogTitle className="text-xl font-bold text-foreground">
                                                Upload Document
                                            </DialogTitle>
                                            <DialogDescription className="text-xs font-medium text-muted-foreground uppercase tracking-widest mt-1">
                                                Project Knowledge Base
                                            </DialogDescription>
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Add a new document to this project's knowledge base.
                                    </p>
                                </DialogHeader>

                                <div className="p-6 space-y-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="title" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">
                                            Document Title
                                        </Label>
                                        <Input
                                            id="title"
                                            value={uploadTitle}
                                            onChange={(e) => setUploadTitle(e.target.value)}
                                            placeholder="e.g., Sarah - Secondary Student"
                                            className="h-11 bg-background border-input rounded-md text-sm placeholder:text-muted-foreground transition-all font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="docType" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">
                                            Document Type
                                        </Label>
                                        <Select value={uploadDocType} onValueChange={setUploadDocType}>
                                            <SelectTrigger className="h-11 bg-background border-input rounded-md text-sm font-medium">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-md border-border bg-background">
                                                <SelectItem value="PERSONA" className="text-sm font-medium focus:bg-accent focus:text-foreground rounded-md cursor-pointer my-1">Persona</SelectItem>
                                                <SelectItem value="FRAMEWORK" className="text-sm font-medium focus:bg-accent focus:text-foreground rounded-md cursor-pointer my-1">Framework</SelectItem>
                                                <SelectItem value="RESEARCH" className="text-sm font-medium focus:bg-accent focus:text-foreground rounded-md cursor-pointer my-1">Research</SelectItem>
                                                <SelectItem value="POLICY" className="text-sm font-medium focus:bg-accent focus:text-foreground rounded-md cursor-pointer my-1">Policy</SelectItem>
                                                <SelectItem value="OTHER" className="text-sm font-medium focus:bg-accent focus:text-foreground rounded-md cursor-pointer my-1">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="file" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground pl-1">
                                            Source File
                                        </Label>
                                        <div className="relative group">
                                            <Input
                                                id="file"
                                                type="file"
                                                ref={fileInputRef}
                                                accept=".txt,.pdf"
                                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                                className="hidden" // Hide the default input
                                            />
                                            {/* Custom File Upload Area */}
                                            <label
                                                htmlFor="file"
                                                className={`
                                                    flex flex-col items-center justify-center w-full h-32 
                                                    border-2 border-dashed rounded-md cursor-pointer transition-all duration-300
                                                    ${uploadFile
                                                        ? 'border-primary bg-accent'
                                                        : 'border-input bg-muted hover:border-border hover:bg-background'}
                                                `}
                                            >
                                                {uploadFile ? (
                                                    <div className="flex flex-col items-center text-foreground animate-in fade-in zoom-in duration-300">
                                                        <FileText className="h-8 w-8 mb-2" />
                                                        <span className="text-sm font-bold truncate max-w-[200px]">{uploadFile.name}</span>
                                                        <span className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                                                            {(uploadFile.size / 1024).toFixed(1)} KB
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center text-muted-foreground group-hover:text-foreground transition-colors">
                                                        <Upload className="h-8 w-8 mb-2 opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                                                        <span className="text-sm font-semibold">Click to upload file</span>
                                                        <span className="text-[10px] font-medium opacity-60 mt-1">PDF or TXT (Max 10MB)</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Data Classification Confirmation */}
                                    <div className="p-4 bg-amber-50/60 border border-amber-100/80 rounded-md relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-100/50 to-transparent rounded-bl-3xl -mr-4 -mt-4" />
                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="flex items-center h-5">
                                                <input
                                                    type="checkbox"
                                                    id="classificationConfirm"
                                                    checked={classificationConfirmed}
                                                    onChange={(e) => setClassificationConfirmed(e.target.checked)}
                                                    className="w-4 h-4 text-primary border-amber-300 rounded bg-background"
                                                />
                                            </div>
                                            <label htmlFor="classificationConfirm" className="text-sm text-amber-900/80 select-none">
                                                <span className="block font-bold text-amber-900 text-xs uppercase tracking-wide mb-1">Compliance Check</span>
                                                <p className="text-xs leading-relaxed opacity-90">
                                                    I confirm this document contains no data classified above <strong className="font-semibold text-amber-950">OFFICIAL (CLOSED) / SENSITIVE-NORMAL</strong> and complies with IM8.
                                                </p>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="p-6 pt-4 border-t border-border bg-muted/30 flex items-center justify-end gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={() => setUploadDialogOpen(false)}
                                        className="rounded-md h-10 px-5 text-muted-foreground font-medium hover:text-foreground hover:bg-accent"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpload}
                                        disabled={uploading || !uploadFile || !uploadTitle || !classificationConfirmed}
                                        className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-md font-bold tracking-wide transition-all duration-300 disabled:opacity-50"
                                    >
                                        {uploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="h-4 w-4 mr-2" />
                                                Upload Document
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                        <TabsList className="bg-transparent p-0 gap-2 h-auto flex-wrap justify-start">
                            {DOC_TYPES.map((type) => (
                                <TabsTrigger
                                    key={type}
                                    value={type}
                                    className="
                                        rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-300
                                        data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm
                                        text-muted-foreground hover:text-foreground hover:bg-accent
                                        border border-transparent data-[state=active]:border-primary
                                    "
                                >
                                    {DOC_TYPE_LABELS[type]}
                                    {docCounts[type] > 0 && (
                                        <span className={`ml-2 px-1.5 h-4 flex items-center justify-center rounded-full text-[10px] ${activeTab === type ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {docCounts[type]}
                                        </span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    {/* Documents Grid */}
                    {filteredDocuments.length === 0 ? (
                        <div className="border border-dashed border-border bg-card rounded-md p-16 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                            <div className="h-14 w-14 rounded-md flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300" style={{ backgroundColor: 'var(--color-knowledge-muted)' }}>
                                <BookOpenText className="h-6 w-6" style={{ color: 'var(--color-knowledge)' }} />
                            </div>
                            <h3 className="text-sm font-semibold text-foreground mb-1">
                                No content here
                            </h3>
                            <p className="text-xs text-muted-foreground mb-6 max-w-xs leading-relaxed">
                                This section is empty. Upload {DOC_TYPE_LABELS[activeTab].toLowerCase()} to get started.
                            </p>
                            <Button
                                onClick={() => {
                                    setUploadDocType(activeTab);
                                    setUploadDialogOpen(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-input text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent"
                            >
                                <Upload className="h-3 w-3 mr-2" />
                                Add {DOC_TYPE_LABELS[activeTab]}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-5 grid-cols-1">
                            {filteredDocuments.map((doc) => {
                                const IconComponent = DOC_TYPE_ICONS[doc.docType] || FileText;
                                const isPending = doc.status === "DRAFT";
                                const isRejected = doc.status === "REJECTED";
                                const isPersona = doc.docType === "PERSONA";
                                const persona = isPersona ? parsePersonaMeta(doc.parsedMetaJson) : null;

                                // Standard Document Card - Compact Row Design (Matched to Global KB)
                                return (
                                    <div
                                        key={doc.id}
                                        onClick={() => setViewDoc(doc)}
                                        className="group relative flex items-center justify-between px-4 py-3 bg-card hover:bg-[var(--color-interact-subtle)] border border-border transition-all duration-300 rounded-md cursor-pointer hover:shadow-sm overflow-visible"
                                    >

                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div
                                                className={`
                                                    h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm
                                                    ${isPending ? 'bg-amber-50 text-amber-600' : isRejected ? 'bg-red-50 text-red-600' : 'group-hover:scale-105'}
                                                `}
                                                style={!isPending && !isRejected ? { backgroundColor: 'var(--color-knowledge-muted)', color: 'var(--color-knowledge)' } : undefined}
                                            >
                                                <IconComponent className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-foreground text-sm truncate pr-4 group-hover:text-foreground transition-colors">
                                                    {doc.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(doc.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {isPending && <span className="text-amber-500 font-medium">Pending Review</span>}
                                                    {isRejected && <span className="text-red-500 font-medium">Rejected</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                                            {isPending && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); approveDocument(doc.id); }}
                                                        className="h-7 px-3 text-[10px] font-bold tracking-wide uppercase bg-primary hover:bg-primary/90 text-primary-foreground rounded-md shadow-sm"
                                                    >
                                                        Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={(e) => { e.stopPropagation(); rejectDocument(doc.id); }}
                                                        className="h-7 px-3 text-[10px] font-bold tracking-wide uppercase text-red-600 hover:bg-red-50 rounded-lg"
                                                    >
                                                        Reject
                                                    </Button>
                                                </>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 px-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md"
                                                onClick={(e) => { e.stopPropagation(); setViewDoc(doc); }}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-full"
                                                onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </div>

            {/* View Dialog - Modernized */}
            <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
                <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-lg rounded-md gap-0">
                    <DialogHeader className="px-6 py-4 border-b border-border bg-background/50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ backgroundColor: 'var(--color-knowledge-muted)', color: 'var(--color-knowledge)' }}>
                                <FileText className="h-4 w-4" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-semibold text-foreground">
                                    {viewDoc?.title}
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                    <span>{viewDoc?.originalFileName}</span>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span className="capitalize">{viewDoc?.docType.toLowerCase()}</span>
                                    <span className="h-1 w-1 rounded-full bg-border" />
                                    <span>{new Date(viewDoc?.createdAt || "").toLocaleDateString()}</span>
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 bg-accent/50 relative">
                        {viewDoc && (
                            <iframe
                                src={`/api/projects/${projectId}/kb/documents/${viewDoc.id}/view`}
                                className="w-full h-full"
                                title="Document Viewer"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
// Created by Swapnil Bapat © 2026
