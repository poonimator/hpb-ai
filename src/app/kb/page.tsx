"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
import { PageBar } from "@/components/layout/page-bar";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import { RailHeader } from "@/components/layout/rail-header";
import { RailSection } from "@/components/layout/rail-section";
import { MetaRow } from "@/components/layout/meta-row";
import {
    Upload,
    FileText,
    Loader2,
    Trash2,
    Eye,
    BookOpenText,
    BookOpen,
    FileSearch,
    Shield,
    HelpCircle,
    User,
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

export default function KnowledgeBasePage() {
    const [docs, setDocs] = useState<KBDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<string>("FRAMEWORK");

    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [docType, setDocType] = useState("FRAMEWORK");
    const [classificationConfirmed, setClassificationConfirmed] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            if (res.ok) fetchDocs();
            else toast.error("Failed to approve");
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
            if (res.ok) fetchDocs();
            else toast.error("Failed to reject");
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const confirmDelete = async (id: string) => {
        setProcessingId(id);
        try {
            const res = await fetch(`/api/kb/documents/${id}`, { method: "DELETE" });
            if (res.ok) fetchDocs();
            else toast.error("Failed to delete");
        } catch (error) {
            console.error(error);
        } finally {
            setProcessingId(null);
        }
    };

    const filteredDocs = docs.filter((d) => d.docType === activeTab);
    const docCounts = DOC_TYPES.reduce((acc, type) => {
        acc[type] = docs.filter((d) => d.docType === type).length;
        return acc;
    }, {} as Record<string, number>);
    const totalDocs = docs.length;
    const pendingCount = docs.filter((d) => d.status === "DRAFT").length;

    const leftRail = (
        <>
            <RailHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary">Knowledge base</Badge>
                </div>
                <h2 className="text-display-4 text-foreground leading-tight">
                    Global library
                </h2>
                <p className="text-body-sm text-muted-foreground leading-relaxed">
                    Shared frameworks, policies, and research accessible across all projects.
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
                        setDocType(activeTab);
                        setUploadDialogOpen(true);
                    }}
                >
                    <Upload className="h-3.5 w-3.5" />
                    Upload document
                </Button>
            </div>
        </>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <PageBar
                sticky={false}
                back={{ href: "/dashboard", label: "Back" }}
                crumbs={[{ label: "Knowledge base" }]}
            />

            <WorkspaceFrame variant="review" scrollContained leftRail={leftRail}>
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-display-2 text-foreground">{DOC_TYPE_LABELS[activeTab]}</h1>
                        <p className="text-body-sm text-muted-foreground mt-1">
                            {filteredDocs.length > 0
                                ? `${filteredDocs.length} document${filteredDocs.length === 1 ? "" : "s"} in this section`
                                : `No ${DOC_TYPE_LABELS[activeTab].toLowerCase()} yet`}
                        </p>
                    </div>
                </div>

                {filteredDocs.length === 0 ? (
                    <div className="rounded-[14px] border border-dashed border-[color:var(--border)] bg-[color:var(--surface-muted)] p-10 flex flex-col items-center justify-center text-center">
                        <div className="h-10 w-10 rounded-[10px] bg-[color:var(--surface)] shadow-inset-edge flex items-center justify-center mb-3">
                            <BookOpenText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="text-sm font-semibold text-foreground mb-1">
                            No {DOC_TYPE_LABELS[activeTab].toLowerCase()} yet
                        </h3>
                        <p className="text-[12px] text-muted-foreground max-w-sm mb-4">
                            Upload {DOC_TYPE_LABELS[activeTab].toLowerCase()} to make them available across all projects.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setDocType(activeTab);
                                setUploadDialogOpen(true);
                            }}
                        >
                            <Upload className="h-3.5 w-3.5" />
                            Upload {DOC_TYPE_LABELS[activeTab].toLowerCase()}
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredDocs.map((doc) => {
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
                                                    className="h-7 text-xs"
                                                    onClick={() => handleApprove(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    {processingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-[color:var(--danger)] hover:text-[color:var(--danger)]"
                                                    onClick={() => handleReject(doc.id)}
                                                    disabled={processingId === doc.id}
                                                >
                                                    Reject
                                                </Button>
                                            </>
                                        )}
                                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
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
                            Documents uploaded here will be accessible across all projects.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Document title</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Youth Health Trends Report 2024"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="docType">Document type</Label>
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
                            <Label htmlFor="file">Source file</Label>
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
                                    className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-md cursor-pointer transition-colors ${
                                        file
                                            ? "border-[color:var(--primary)]/40 bg-[color:var(--primary-soft)]"
                                            : "border-input bg-background hover:border-[color:var(--primary)]/30 hover:bg-[color:var(--surface-muted)]"
                                    }`}
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

                        <div className="p-3 bg-[color:var(--warning-soft)] border border-[color:var(--warning)]/25 rounded-md">
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
                                    <span className="block font-medium text-[color:var(--warning)] text-caption uppercase tracking-wider mb-1">Compliance check</span>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        I confirm this document contains no data classified above <strong>OFFICIAL (CLOSED) / SENSITIVE-NORMAL</strong> and complies with IM8.
                                    </p>
                                </label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
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
                                    Upload document
                                </>
                            )}
                        </Button>
                    </DialogFooter>
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
