import "server-only";

import path from "path";
import fs from "fs/promises";

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Upload a file. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise writes to local filesystem under data/uploads/.
 * Returns the storage path (blob URL or local file path).
 */
export async function uploadFile(
    buffer: Buffer,
    pathname: string,
    contentType: string
): Promise<string> {
    if (useBlob) {
        const { put } = await import("@vercel/blob");
        const blob = await put(pathname, buffer, {
            access: "public",
            contentType,
        });
        return blob.url;
    }

    // Local filesystem — store relative path for portability
    const relativePath = path.join("data", "uploads", pathname);
    const filePath = path.join(process.cwd(), relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return relativePath;
}

/**
 * Delete a file. Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set,
 * otherwise removes from local filesystem.
 */
export async function deleteFile(storagePath: string): Promise<void> {
    try {
        if (useBlob) {
            const { del } = await import("@vercel/blob");
            await del(storagePath);
            return;
        }

        // Local filesystem — resolve relative or absolute path
        const resolvedPath = path.isAbsolute(storagePath)
            ? storagePath
            : path.join(process.cwd(), storagePath);
        await fs.rm(resolvedPath, { force: true });
    } catch (error) {
        console.warn("[Storage] Failed to delete file:", error);
    }
}

/**
 * Check if a storage path is a remote URL (Vercel Blob).
 */
export function isRemoteUrl(storagePath: string): boolean {
    return storagePath.startsWith("http://") || storagePath.startsWith("https://");
}

// Created by Swapnil Bapat © 2026
