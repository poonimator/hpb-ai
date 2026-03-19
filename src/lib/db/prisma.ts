import "server-only";

import { PrismaClient } from "@/generated/prisma/client";

// For hot reload in development, we store the client globally
const globalForPrisma = globalThis as unknown as {
    prisma2: PrismaClient | undefined;
};

function createPrismaClient() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    if (url.startsWith("file:")) {
        // Local SQLite mode
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
        const dbPath = url.replace("file:", "").replace(/^\.\//, `${process.cwd()}/`);
        const adapter = new PrismaBetterSqlite3({ url: dbPath });
        return new PrismaClient({ adapter });
    }

    // Production PostgreSQL mode
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaPg } = require("@prisma/adapter-pg");
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma2 ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma2 = prisma;
}

export default prisma;

// Created by Swapnil Bapat © 2026
