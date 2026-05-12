/**
 * One-off helper — list all projects + their workspaces in the DB. Used to
 * pick the right name match for the archetype seed script.
 *
 * Run with: npx tsx scripts/list-projects.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const projects = await prisma.project.findMany({
        include: { subProjects: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
    });

    if (projects.length === 0) {
        console.log("(no projects)");
        return;
    }

    for (const p of projects) {
        console.log(`• ${p.name}  (id=${p.id})`);
        if (p.subProjects.length === 0) {
            console.log("    — no workspaces");
        } else {
            for (const sp of p.subProjects) {
                console.log(`    ↳ ${sp.name}  (subProjectId=${sp.id})`);
            }
        }
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
