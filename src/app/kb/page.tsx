"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Upload,
    FileText,
    CheckCircle,
    Clock,
    ShieldCheck,
    Loader2,
    Trash2,
    AlertCircle,
    Eye,
    XCircle,
    Download,
    BookOpenText,
    ArrowUpDown,
    User,
    BookOpen,
    FileSearch,
    Shield,
    HelpCircle,
    Briefcase,
    Heart
} from "lucide-react";

interface KBDocument {
    id: string;
    title: string;
    docType: string;
    status: string;
    mimeType: string;
    originalFileName: string;
    createdAt: string;
    parsedMetaJson?: string;
    _count: {
        chunks: number;
    };
}

interface ParsedPersona {
    name?: string;
    age?: string;
    occupation?: string;
    summary?: string;
    gains?: string;
    pains?: string;
}

const DOC_TYPES = ["FRAMEWORK", "RESEARCH", "POLICY", "OTHER"] as const;

const DOC_TYPE_ICONS: Record<string, typeof User> = {
    FRAMEWORK: BookOpen,
    RESEARCH: FileSearch,
    POLICY: Shield,
    OTHER: HelpCircle,
};

const DOC_TYPE_LABELS: Record<string, string> = {
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

export default function KnowledgeBasePage() {
    const [docs, setDocs] = useState<KBDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Filter State
    const [activeTab, setActiveTab] = useState("FRAMEWORK");

    // Upload Form State
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [docType, setDocType] = useState("FRAMEWORK");
    const [classificationConfirmed, setClassificationConfirmed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Dialog State
    const [viewDoc, setViewDoc] = useState<KBDocument | null>(null);
    const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            const res = await fetch("/api/kb/documents");
            const data = await res.json();
            if (data.success) {
                setDocs(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!file || !title) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", title);
        formData.append("docType", docType);

        try {
            const res = await fetch("/api/kb/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                setFile(null);
                setTitle("");
                setDocType("FRAMEWORK");
                setClassificationConfirmed(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                setUploadDialogOpen(false);
                fetchDocs();
            } else {
                const err = await res.json();
                toast.error(err.error || "Upload failed");
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch("/api/kb/approve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: id }),
            });

            if (res.ok) {
                fetchDocs();
            } else {
                toast.error("Failed to approve");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch("/api/kb/reject", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId: id }),
            });

            if (res.ok) {
                fetchDocs();
            } else {
                toast.error("Failed to reject");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const confirmDelete = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/kb/documents/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                fetchDocs();
            } else {
                toast.error("Failed to delete");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredDocs = docs.filter(d => d.docType === activeTab);
    const docCounts = DOC_TYPES.reduce((acc, type) => {
        acc[type] = docs.filter(d => d.docType === type).length;
        return acc;
    }, {} as Record<string, number>);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="py-8">
            <PageHeader
                title="Global Knowledge Base"
                description="Shared frameworks, policies, and research accessible across all projects."
            />

            {/* Main Content */}
            <div>
                {/* Tabs with Upload Button */}
                <div className="flex items-center justify-between mb-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                        <TabsList>
                            {DOC_TYPES.map((type) => (
                                <TabsTrigger
                                    key={type}
                                    value={type}
                                    className="px-3 py-1.5 text-sm font-medium"
                                >
                                    {DOC_TYPE_LABELS[type]}
                                    {docCounts[type] > 0 && (
                                        <Badge
                                            variant="secondary"
                                            className="ml-1.5 h-5 min-w-[20px] px-1.5 text-caption rounded-full"
                                        >
                                            {docCounts[type]}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Upload className="h-4 w-4" />
                                Upload Document
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>Upload Document</DialogTitle>
                                <DialogDescription>
                                    Documents uploaded here will be accessible across all projects.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Document Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g., Youth Health Trends Report 2024"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="docType">Document Type</Label>
                                    <Select value={docType} onValueChange={setDocType}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FRAMEWORK">Framework</SelectItem>
                                            <SelectItem value="RESEARCH">Research</SelectItem>
                                            <SelectItem value="POLICY">Policy</SelectItem>
                                            <SelectItem value="OTHER">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="file">Source File</Label>
                                    <div className="relative group">
                                        <Input
                                            id="file"
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".txt,.pdf"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="file"
                                            className={`
                                                flex flex-col items-center justify-center w-full h-28
                                                border-2 border-dashed rounded-md cursor-pointer transition-colors
                                                ${file
                                                    ? 'border-primary/40 bg-accent'
                                                    : 'border-input bg-background hover:border-primary/30 hover:bg-[var(--color-interact-subtle)]'}
                                            `}
                                        >
                                            {file ? (
                                                <div className="flex flex-col items-center text-foreground">
                                                    <FileText className="h-7 w-7 mb-2 text-muted-foreground" />
                                                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground mt-0.5">
                                                        {(file.size / 1024).toFixed(1)} KB
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-muted-foreground group-hover:text-foreground transition-colors">
                                                    <Upload className="h-7 w-7 mb-2" />
                                                    <span className="text-sm font-medium">Click to upload file</span>
                                                    <span className="text-xs mt-0.5">PDF or TXT (Max 10MB)</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                {/* Data Classification Confirmation */}
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center h-5 pt-0.5">
                                            <Checkbox
                                                id="classificationConfirmGlobal"
                                                checked={classificationConfirmed}
                                                onCheckedChange={(checked) => setClassificationConfirmed(checked === true)}
                                                aria-label="Confirm data classification compliance"
                                            />
                                        </div>
                                        <label htmlFor="classificationConfirmGlobal" className="text-sm select-none">
                                            <span className="block font-medium text-[color:var(--primary)] text-xs mb-1">Compliance Check</span>
                                            <p className="text-xs text-amber-800 leading-relaxed">
                                                I confirm this document contains no data classified above <strong>OFFICIAL (CLOSED) / SENSITIVE-NORMAL</strong> and complies with IM8.
                                            </p>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setUploadDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleUpload}
                                    disabled={uploading || !file || !title || !classificationConfirmed}
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

                {/* Documents Grid - Matching Project KB style */}
                {filteredDocs.length === 0 ? (
                    <EmptyState
                        icon={<BookOpenText />}
                        title={`No ${DOC_TYPE_LABELS[activeTab].toLowerCase()} yet`}
                        description={`Upload ${DOC_TYPE_LABELS[activeTab].toLowerCase()} to make them available across all projects.`}
                        action={
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDocType(activeTab);
                                    setUploadDialogOpen(true);
                                }}
                            >
                                <Upload className="h-4 w-4" />
                                Upload {DOC_TYPE_LABELS[activeTab]}
                            </Button>
                        }
                    />
                ) : (
                    <div className={`grid gap-4 ${activeTab === 'PERSONA' ? 'md:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1'}`}>
                        {filteredDocs.map((doc) => {
                            const IconComponent = DOC_TYPE_ICONS[doc.docType] || FileText;
                            const isPending = doc.status === "DRAFT";
                            const isRejected = doc.status === "REJECTED";
                            const isPersona = doc.docType === "PERSONA";
                            const persona = isPersona ? parsePersonaMeta(doc.parsedMetaJson) : null;

                            // Parsing State Card for Personas
                            if (isPersona && !persona) {
                                return (
                                    <Card key={doc.id} className="relative min-h-[320px] group">
                                        <div className="absolute top-4 right-4 z-20">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                                                onClick={() => setDeleteDocId(doc.id)}
                                                disabled={processingId === doc.id}
                                                title="Delete Stuck Persona"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full">
                                            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
                                            <h3 className="font-semibold text-base mb-2">Analyzing Persona...</h3>
                                            <p className="text-sm text-muted-foreground max-w-[220px]">
                                                Extracting motivations, frustrations, and demographics from {doc.originalFileName}...
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            }

                            // Persona Card
                            if (isPersona && persona) {
                                return (
                                    <Card
                                        key={doc.id}
                                        className={`group relative flex flex-col transition-colors hover:bg-[var(--color-interact-subtle)] ${isPending ? 'border-amber-200' : isRejected ? 'border-destructive/30' : ''}`}
                                    >
                                        <CardContent className="px-5 py-4 flex-1 flex flex-col">
                                            <div className="mb-3">
                                                <h3 className="font-medium text-base mb-1">
                                                    {persona.name || doc.title}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    {persona.age && (
                                                        <span>{persona.age} years old</span>
                                                    )}
                                                    {persona.age && persona.occupation && (
                                                        <span className="text-border">•</span>
                                                    )}
                                                    {persona.occupation && (
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="h-3 w-3" />
                                                            {persona.occupation}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {persona.summary && (
                                                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                                                    {persona.summary}
                                                </p>
                                            )}

                                            <div className="border-t border-border mb-3" />

                                            {(persona.gains || persona.pains) && (
                                                <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                                                    {persona.gains && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5 text-foreground">
                                                                <Heart className="h-3.5 w-3.5" />
                                                                <span className="text-caption font-medium uppercase tracking-wider">Motivations</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground leading-snug">
                                                                {persona.gains}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {persona.pains && (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center gap-1.5 text-foreground">
                                                                <AlertCircle className="h-3.5 w-3.5" />
                                                                <span className="text-caption font-medium uppercase tracking-wider">Frustrations</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground leading-snug">
                                                                {persona.pains}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="mt-auto pt-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {isPending && (
                                                    <div className="flex items-center gap-1 mr-auto opacity-100">
                                                        <Button
                                                            size="sm"
                                                            className="h-7 text-xs"
                                                            onClick={() => handleApprove(doc.id)}
                                                            disabled={processingId === doc.id}
                                                        >
                                                            {processingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 text-xs text-destructive hover:text-destructive"
                                                            onClick={() => handleReject(doc.id)}
                                                            disabled={processingId === doc.id}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                )}

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-muted-foreground"
                                                    onClick={() => setViewDoc(doc)}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>

                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setDeleteDocId(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            }

                            // Standard Document Card - Compact Row Design
                            return (
                                <Card key={doc.id} className="group transition-colors hover:bg-[var(--color-interact-subtle)]">
                                    <CardContent className="px-4 py-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className={`
                                                    h-9 w-9 rounded-md flex items-center justify-center shrink-0
                                                    ${isPending ? 'bg-amber-50 text-amber-600' : isRejected ? 'bg-destructive/10 text-destructive' : ''}
                                                `}
                                                    style={!isPending && !isRejected ? { backgroundColor: 'var(--color-knowledge-muted)', color: 'var(--color-knowledge)' } : undefined}
                                                >
                                                    <IconComponent className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1 min-w-0 flex items-center gap-4">
                                                    <h3 className="font-medium text-sm truncate">{doc.title}</h3>

                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                        <span className="text-border">•</span>
                                                        <span className="uppercase tracking-wider text-caption">{doc.docType}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {isPending ? (
                                                    <div className="flex gap-1">
                                                        <Button size="sm" onClick={() => handleApprove(doc.id)} className="h-7 text-xs px-2.5">
                                                            {processingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleReject(doc.id)} className="h-7 text-xs text-destructive hover:text-destructive px-2.5">
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Badge variant={isRejected ? "destructive" : "secondary"} className="text-caption uppercase tracking-wider">
                                                        {doc.status}
                                                    </Badge>
                                                )}

                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-xs text-muted-foreground"
                                                        onClick={() => setViewDoc(doc)}
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                        <span>View</span>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setDeleteDocId(doc.id)}
                                                        disabled={processingId === doc.id}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* View Dialog */}
            <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            {viewDoc?.title}
                        </DialogTitle>
                        <DialogDescription>
                            {viewDoc?.originalFileName} • {viewDoc?.docType} • {new Date(viewDoc?.createdAt || "").toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden bg-muted rounded-md border border-border relative mt-4">
                        {viewDoc && (
                            <iframe
                                src={`/api/kb/documents/${viewDoc.id}/view`}
                                className="w-full h-full bg-card"
                                title="Document Viewer"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteDocId} onOpenChange={(open) => !open && setDeleteDocId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This removes the document from the global Knowledge Base. Projects that reference it will lose access. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteDocId) await confirmDelete(deleteDocId);
                                setDeleteDocId(null);
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>

    );
}
// Created by Swapnil Bapat © 2026
