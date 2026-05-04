import { redirect } from "next/navigation";

export default async function RedirectLegacyEditPage({
    params,
}: {
    params: Promise<{ projectId: string; subProjectId: string }>;
}) {
    const { projectId, subProjectId } = await params;
    redirect(`/projects/${projectId}/sub/${subProjectId}`);
}
// Created by Swapnil Bapat © 2026
