"use client";

import { useState, useEffect, use, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import {
    Upload,
    Loader2,
    FileText,
    Trash2,
    Eye,
    User,
    BookOpen,
    FileSearch,
    Shield,
    HelpCircle,
    BookOpenText,
    AlertCircle,
    Briefcase,
    Heart,
} from "lucide-react";

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
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("PERSONA");

    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadDocType, setUploadDocType] = useState("PERSONA");
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [classificationConfirmed, setClassificationConfirmed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [viewDoc, setViewDoc] = useState<KbDocument | null>(null);
    const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

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

            if (projectRes.ok) setProject(projectData.data);
            if (docsRes.ok) setDocuments(docsData.data || []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };


    const handleUpload = async () => {
        if (!uploadFile || !uploadTitle || !uploadDocType) return;

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

            setUploadTitle("");
            setUploadDocType("PERSONA");
            setUploadFile(null);
            setClassificationConfirmed(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            setUploadDialogOpen(false);
            fetchData();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const approveDocument = async (documentId: string) => {
        setProcessingId(documentId);
        try {
            const res = await fetch(`/api/projects/${projectId}/kb/approve`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId }),
            });
            if (!res.ok) throw new Error("Approval failed");
            fetchData();
        } catch {
            toast.error("Failed to approve document");
        } finally {
            setProcessingId(null);
        }
    };

    const rejectDocument = async (documentId: string) => {
        setProcessingId(documentId);
        try {
            const res = await fetch(`/api/projects/${projectId}/kb/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ documentId }),
            });
            if (!res.ok) throw new Error("Rejection failed");
            fetchData();
        } catch {
            toast.error("Failed to reject document");
        } finally {
            setProcessingId(null);
        }
    };

    const confirmDeleteDoc = async (documentId: string) => {
        try {
            const res = await fetch(`/api/projects/${projectId}/kb/documents/${documentId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            fetchData();
        } catch {
            toast.error("Failed to delete document");
        }
    };

    const filteredDocuments = documents.filter((d) => d.docType === activeTab);
    const docCounts = DOC_TYPES.reduce((acc, type) => {
        acc[type] = documents.filter((d) => d.docType === type).length;
        return acc;
    }, {} as Record<string, number>);
    const totalDocs = documents.length;
    const pendingCount = documents.filter((d) => d.status === "DRAFT").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const leftRail = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Knowledge base</Badge>
                </div>
                <h2 className="text-display-4 text-foreground leading-tight">
                    {project?.name ?? "Project"}
                </h2>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                    Personas, frameworks, and documents used to ground the AI in this research context.
                </p>
            </RailHeader>

            <RailSection title="Library">
                <MetaRow k="Documents" v={totalDocs} />
                {pendingCount > 0 && <MetaRow k="Pending review" v={pendingCount} />}
            </RailSection>

            <RailSection title="Browse">
                <div className="flex flex-col gap-0.5">
                    {DOC_TYPES.map((type) => {
                        const Icon = DOC_TYPE_ICONS[type];
                        const isActive = activeTab === type;
                        return (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setActiveTab(type)}
                                className={`group flex items-center justify-between gap-3 w-full px-2 py-2 rounded-[8px] text-left transition-colors ${
                                    isActive
                                        ? "bg-[color:var(--primary-soft)] text-foreground"
                                        : "hover:bg-[color:var(--surface-muted)] text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                <span className="flex items-center gap-2.5 min-w-0">
                                    <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-[color:var(--primary)]" : ""}`} />
                                    <span className="text-ui-sm truncate">{DOC_TYPE_LABELS[type]}</span>
                                </span>
                                <span className={`text-[11px] tabular-nums shrink-0 ${isActive ? "text-[color:var(--primary)]" : "text-muted-foreground"}`}>
                                    {docCounts[type]}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </RailSection>

            <div className="flex-1" />

            <div className="px-8 py-4">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-center"
                    onClick={() => {
                        setUploadDocType(activeTab);
                        setUploadDialogOpen(true);
                    }}
                >
                    <Upload className="h-3.5 w-3.5" />
                    Upload document
                </Button>
            </div>
        </>
    );

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: `/projects/${projectId}`, label: "Back" }}
                crumbs={[
                    { label: project?.name ?? "Project", href: `/projects/${projectId}` },
                    { label: "Knowledge base" },
                ]}
            />

            <WorkspaceFrame variant="review" scrollContained leftRail={leftRail}>
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-display-2 text-foreground">{DOC_TYPE_LABELS[activeTab]}</h1>
                        <p className="text-body-sm text-muted-foreground mt-1">
                            {filteredDocuments.length > 0
                                ? `${filteredDocuments.length} document${filteredDocuments.length === 1 ? "" : "s"} in this section`
                                : `No ${DOC_TYPE_LABELS[activeTab].toLowerCase()} yet`}
                        </p>
                    </div>
                </div>

                {filteredDocuments.length === 0 ? (
                    <div className="rounded-[14px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-10 flex flex-col items-center justify-center text-center">
                        <div className="h-10 w-10 rounded-[10px] bg-[color:var(--surface)] shadow-inset-edge flex items-center justify-center mb-3">
                            <BookOpenText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                            No {DOC_TYPE_LABELS[activeTab].toLowerCase()} yet
                        </h3>
                        <p className="text-[12px] text-muted-foreground max-w-sm mb-4">
                            Upload {DOC_TYPE_LABELS[activeTab].toLowerCase()} to this project&apos;s knowledge base.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setUploadDocType(activeTab);
                                setUploadDialogOpen(true);
                            }}
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Upload {DOC_TYPE_LABELS[activeTab].toLowerCase()}
                        </Button>
                    </div>
                ) : activeTab === "PERSONA" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredDocuments.map((doc) => {
                            const persona = parsePersonaMeta(doc.parsedMetaJson);
                            const isPending = doc.status === "DRAFT";
                            const isRejected = doc.status === "REJECTED";

                            if (!persona) {
                                return (
                                    <div
                                        key={doc.id}
                                        className={`group rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring hover:shadow-card transition-shadow duration-200 p-5 flex flex-col ${
                                            isPending ? "ring-1 ring-[color:var(--warning)]/30" : isRejected ? "ring-1 ring-[color:var(--danger)]/30" : ""
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center shrink-0">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-foreground text-sm leading-tight">
                                                        {doc.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
                                                        <span className="truncate">{doc.originalFileName}</span>
                                                        <span className="opacity-50">·</span>
                                                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    className="text-muted-foreground"
                                                    onClick={() => setViewDoc(doc)}
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button
                                                    size="icon-sm"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:text-destructive"
                                                    onClick={() => setDeleteDocId(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>

                                        {isPending && (
                                            <div className="mt-4 flex items-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => approveDocument(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    {processingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                                    onClick={() => rejectDocument(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={doc.id}
                                    className={`group rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring hover:shadow-card transition-shadow duration-200 p-5 flex flex-col ${
                                        isPending ? "ring-1 ring-[color:var(--warning)]/30" : isRejected ? "ring-1 ring-[color:var(--danger)]/30" : ""
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-foreground text-sm leading-tight">
                                                {persona.name || doc.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
                                                {persona.age && <span>{persona.age} years</span>}
                                                {persona.age && persona.occupation && <span className="opacity-50">·</span>}
                                                {persona.occupation && (
                                                    <span className="flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {persona.occupation}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                className="text-muted-foreground"
                                                onClick={() => setViewDoc(doc)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteDocId(doc.id)}
                                                disabled={processingId === doc.id}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {persona.summary && (
                                        <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                                            {persona.summary}
                                        </p>
                                    )}

                                    {(persona.gains || persona.pains) && (
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[color:var(--border-subtle)] pt-3">
                                            {persona.gains && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Heart className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-caption uppercase tracking-wider text-muted-foreground">Motivations</span>
                                                    </div>
                                                    <p className="text-[12px] text-foreground/80 leading-snug">{persona.gains}</p>
                                                </div>
                                            )}
                                            {persona.pains && (
                                                <div>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                                        <span className="text-caption uppercase tracking-wider text-muted-foreground">Frustrations</span>
                                                    </div>
                                                    <p className="text-[12px] text-foreground/80 leading-snug">{persona.pains}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isPending && (
                                        <div className="mt-4 flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => approveDocument(doc.id)}
                                                disabled={processingId === doc.id}
                                            >
                                                {processingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                                onClick={() => rejectDocument(doc.id)}
                                                disabled={processingId === doc.id}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredDocuments.map((doc) => {
                            const IconComponent = DOC_TYPE_ICONS[doc.docType] || FileText;
                            const isPending = doc.status === "DRAFT";
                            const isRejected = doc.status === "REJECTED";
                            return (
                                <div
                                    key={doc.id}
                                    className="group rounded-[14px] bg-[color:var(--surface)] shadow-outline-ring hover:shadow-card transition-shadow duration-200 px-4 py-3 flex items-center gap-4"
                                >
                                    <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center shrink-0">
                                        <IconComponent className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground text-sm leading-tight truncate">
                                            {doc.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-0.5 text-[12px] text-muted-foreground">
                                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            <span className="opacity-50">·</span>
                                            <span className="uppercase tracking-wider text-caption">{doc.docType}</span>
                                            {isPending && (
                                                <>
                                                    <span className="opacity-50">·</span>
                                                    <span className="text-[color:var(--warning)] font-medium">Pending review</span>
                                                </>
                                            )}
                                            {isRejected && (
                                                <>
                                                    <span className="opacity-50">·</span>
                                                    <span className="text-[color:var(--danger)] font-medium">Rejected</span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {isPending && (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => approveDocument(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    {processingId === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                                    onClick={() => rejectDocument(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                className="text-muted-foreground"
                                                onClick={() => setViewDoc(doc)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                className="text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteDocId(doc.id)}
                                                disabled={processingId === doc.id}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </WorkspaceFrame>

            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Upload document</DialogTitle>
                        <DialogDescription>
                            Add a new document to this project&apos;s knowledge base.
                        </DialogDescription>
                    </DialogHeader>

                    {uploading ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                            <div className="h-9 w-9 rounded-[10px] bg-[color:var(--primary-soft)] text-[color:var(--primary)] shadow-inset-edge flex items-center justify-center mb-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                            <span className="text-eyebrow text-muted-foreground mb-1">Uploading</span>
                            <h3 className="text-display-4 text-foreground mb-2">Processing your document…</h3>
                            <p className="text-body-sm text-muted-foreground mb-5 max-w-xs">
                                This can take up to 30 seconds for larger PDFs.
                            </p>
                            <div className="w-full max-w-xs h-1 bg-[color:var(--surface-muted)] rounded-full overflow-hidden">
                                <div className="h-full w-1/3 bg-[color:var(--primary)] animate-pulse rounded-full" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="upload-title">Document title</Label>
                                <Input
                                    id="upload-title"
                                    value={uploadTitle}
                                    onChange={(e) => setUploadTitle(e.target.value)}
                                    placeholder="e.g. Sarah — Secondary Student"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="upload-docType">Document type</Label>
                                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERSONA">Persona</SelectItem>
                                        <SelectItem value="FRAMEWORK">Framework</SelectItem>
                                        <SelectItem value="RESEARCH">Research</SelectItem>
                                        <SelectItem value="POLICY">Policy</SelectItem>
                                        <SelectItem value="OTHER">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="upload-file">Source file</Label>
                                <div className="relative group">
                                    <Input
                                        id="upload-file"
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".txt,.pdf"
                                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="upload-file"
                                        className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                                            uploadFile
                                                ? "border-[color:var(--primary)]/40 bg-[color:var(--primary-soft)]"
                                                : "border-input bg-background hover:border-[color:var(--primary)]/30 hover:bg-[color:var(--surface-muted)]"
                                        }`}
                                    >
                                        {uploadFile ? (
                                            <div className="flex flex-col items-center text-foreground">
                                                <FileText className="h-7 w-7 mb-2 text-muted-foreground" />
                                                <span className="text-sm font-medium truncate max-w-[200px]">{uploadFile.name}</span>
                                                <span className="text-xs text-muted-foreground mt-0.5">
                                                    {(uploadFile.size / 1024).toFixed(1)} KB
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

                            <div className="p-3 bg-[color:var(--warning-soft)] border border-[color:var(--warning)]/25 rounded-md">
                                <div className="flex items-start gap-3">
                                    <div className="flex items-center h-5 pt-0.5">
                                        <Checkbox
                                            id="classificationConfirmProject"
                                            checked={classificationConfirmed}
                                            onCheckedChange={(checked) => setClassificationConfirmed(checked === true)}
                                            aria-label="Confirm data classification compliance"
                                        />
                                    </div>
                                    <label htmlFor="classificationConfirmProject" className="text-sm select-none">
                                        <span className="block font-medium text-[color:var(--warning)] text-caption uppercase tracking-wider mb-1">Compliance check</span>
                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                            I confirm this document contains no data classified above <strong>OFFICIAL (CLOSED) / SENSITIVE-NORMAL</strong> and complies with IM8.
                                        </p>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {uploading ? (
                        <DialogFooter>
                            <Button disabled>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                            </Button>
                        </DialogFooter>
                    ) : (
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={!uploadFile || !uploadTitle || !classificationConfirmed}
                            >
                                <Upload className="h-4 w-4" />
                                Upload document
                            </Button>
                        </DialogFooter>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewDoc} onOpenChange={(open) => !open && setViewDoc(null)}>
                <DialogContent className="!max-w-[min(1400px,95vw)] w-[min(1400px,95vw)] h-[92vh] flex flex-col p-6">
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
                                src={`/api/projects/${projectId}/kb/documents/${viewDoc.id}/view`}
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
                            This removes the document from this project&apos;s Knowledge Base. This cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={deleting}
                            onClick={async () => {
                                if (!deleteDocId) return;
                                setDeleting(true);
                                try {
                                    await confirmDeleteDoc(deleteDocId);
                                    setDeleteDocId(null);
                                } finally {
                                    setDeleting(false);
                                }
                            }}
                            className="bg-[color:var(--danger)] text-white hover:brightness-110"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
