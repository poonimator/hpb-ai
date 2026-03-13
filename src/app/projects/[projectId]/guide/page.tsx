"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface PageProps {
    params: Promise<{ projectId: string }>;
}

// Redirect to the new guide setup page
export default function GuideRedirectPage({ params }: PageProps) {
    const { projectId } = use(params);
    const router = useRouter();

    useEffect(() => {
        router.replace(`/projects/new/guide?projectId=${projectId}`);
    }, [projectId, router]);

    return (
        <div className="flex items-center justify-center h-screen">
            <p className="text-muted-foreground">Redirecting to guide editor...</p>
        </div>
    );
}
// Created by Swapnil Bapat © 2026
