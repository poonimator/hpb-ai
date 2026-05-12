/**
 * Manual archetype insert — "The Self-Filtered Sharer"
 *
 * Adds a single archetype to the MHE project's workspace ("Profiles" tab).
 * Reuses the existing "Manual Archetypes" ArchetypeSession if one already
 * exists on that workspace; otherwise creates one.
 *
 * Run locally:
 *   npx tsx scripts/add-self-filtered-sharer.ts
 *
 * Run against Vercel Postgres:
 *   DATABASE_URL="postgres://..." npx tsx scripts/add-self-filtered-sharer.ts
 *
 * Override the project name match (default: anything containing "MHE"):
 *   PROJECT_QUERY="Mental Health Experiences" npx tsx scripts/add-self-filtered-sharer.ts
 *
 * Pin to a specific subProject (skip auto-lookup):
 *   SUB_PROJECT_ID="cmXXXX" npx tsx scripts/add-self-filtered-sharer.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ARCHETYPE = {
    name: "The Self-Filtered Sharer",
    kicker: "If I say it, they will go straight into what I should have done, or what to do now.",
    description:
        "When they bring stress to adults at home, the response can quickly become solutions, school talk, or \"what you should do\". Even when well-meant, it can feel like correction. They learn to filter what they share, giving the practical part while holding back the emotion, so the conversation stays safe and solvable.",
    demographic: {
        ageRange: "15-25",
        occupation: "Student",
        livingSetup: "Living with family",
    },
    influences: [
        "Peer comparison",
        "Social media \"achievement\" cues",
        "Family expectations (spoken or implied)",
        "Their own track record",
        "Past advice, rules or correction after sharing",
    ],
    livedExperience:
        "Home can feel like a place where feelings become solutions, school talk, fault, or consequences. They may still want adult support, but the first response needs to feel steady, not corrective. Over time, they share only the \"solvable\" surface, or nothing, to avoid making it bigger.",
    behaviours: [
        "Brings practical issues, not feelings",
        "Edits what they say before sharing",
        "Shares the 'safe' version",
        "Shuts down or deflects when advice comes too fast",
        "Turns to friends when home feels too corrective",
    ],
    barriers: [
        "Fears lectures, nagging, restrictions or blame",
        "Worries sharing will create consequences",
        "Feels unheard when adults fix too fast",
        "Avoid making it into 'a whole thing'",
        "Lacks words to name their emotions, beyond 'stress' or 'tired'",
    ],
    motivations: [
        "Keep things calm at home",
        "Avoid being corrected",
        "Stay independent",
        "Get reassurance without a long talk",
        "Share enough without losing control",
    ],
    goals: [
        "Feel better without making it public",
        "Be heard before being advised",
        "Get reassurance they're not \"too much\"",
        "Keep control over what happens next",
    ],
    habits: [
        "Shares late, when it's already big",
        "Filters out the emotional part",
        "Gives adults the practical surface",
        "Learns that feelings can lead to correction",
    ],
    spiral: {
        pattern: "Vulnerability → Fixing / blame / lecture → Self-filtering → Share less next time.",
        avoidance:
            "They avoid the spiral when adults listen first, reflect the feeling, and ask what kind of help is useful before moving to advice or problem-solving.",
    },
};

async function main() {
    const projectQuery = process.env.PROJECT_QUERY || "MHE";
    const pinnedSubProjectId = process.env.SUB_PROJECT_ID || null;

    // 1. Resolve the SubProject we're adding into.
    let subProject;
    if (pinnedSubProjectId) {
        subProject = await prisma.subProject.findUnique({
            where: { id: pinnedSubProjectId },
            include: { project: true },
        });
        if (!subProject) {
            throw new Error(`SubProject ${pinnedSubProjectId} not found`);
        }
    } else {
        const candidateProjects = await prisma.project.findMany({
            where: { name: { contains: projectQuery, mode: "insensitive" } },
            include: { subProjects: true },
        });

        if (candidateProjects.length === 0) {
            throw new Error(
                `No project matched name contains "${projectQuery}". Set PROJECT_QUERY or SUB_PROJECT_ID env var.`
            );
        }
        if (candidateProjects.length > 1) {
            console.warn(
                `[warn] Multiple projects matched "${projectQuery}":`,
                candidateProjects.map((p) => `${p.name} (${p.id})`)
            );
            console.warn("[warn] Using the first match. Set SUB_PROJECT_ID to be explicit.");
        }
        const project = candidateProjects[0];

        if (project.subProjects.length === 0) {
            throw new Error(`Project "${project.name}" has no workspaces.`);
        }
        if (project.subProjects.length > 1) {
            console.warn(
                `[warn] Project "${project.name}" has ${project.subProjects.length} workspaces; using the first.`
            );
        }
        const chosen = project.subProjects[0];
        subProject = await prisma.subProject.findUnique({
            where: { id: chosen.id },
            include: { project: true },
        });
    }

    if (!subProject) throw new Error("Could not resolve SubProject");

    console.log(
        `→ Target: project "${subProject.project.name}" / workspace "${subProject.name}" (${subProject.id})`
    );

    // 2. Find or create a "Manual Archetypes" session for this workspace.
    let session = await prisma.archetypeSession.findFirst({
        where: { subProjectId: subProject.id, name: "Manual Archetypes" },
        include: { archetypes: true },
    });

    if (!session) {
        session = await prisma.archetypeSession.create({
            data: {
                subProjectId: subProject.id,
                name: "Manual Archetypes",
                status: "COMPLETE",
                modelName: "manual-entry",
            },
            include: { archetypes: true },
        });
        console.log(`→ Created Manual Archetypes session (${session.id})`);
    } else {
        console.log(`→ Reusing existing Manual Archetypes session (${session.id})`);
    }

    // 3. Guard against double-inserting the same archetype.
    const existing = session.archetypes.find((a) => a.name === ARCHETYPE.name);
    if (existing) {
        console.log(`→ Archetype "${ARCHETYPE.name}" already exists (${existing.id}). Skipping insert.`);
        return;
    }

    // 4. Insert.
    const fullContent = {
        name: ARCHETYPE.name,
        kicker: ARCHETYPE.kicker,
        description: ARCHETYPE.description,
        demographic: ARCHETYPE.demographic,
        influences: ARCHETYPE.influences,
        livedExperience: ARCHETYPE.livedExperience,
        behaviours: ARCHETYPE.behaviours,
        barriers: ARCHETYPE.barriers,
        motivations: ARCHETYPE.motivations,
        goals: ARCHETYPE.goals,
        habits: ARCHETYPE.habits,
        spiral: ARCHETYPE.spiral,
    };

    const nextOrder = session.archetypes.length;
    const created = await prisma.archetype.create({
        data: {
            archetypeSessionId: session.id,
            name: ARCHETYPE.name,
            kicker: ARCHETYPE.kicker,
            description: ARCHETYPE.description,
            demographicJson: JSON.stringify(ARCHETYPE.demographic),
            goalsJson: JSON.stringify(ARCHETYPE.goals),
            motivationsJson: JSON.stringify(ARCHETYPE.motivations),
            spiralJson: JSON.stringify(ARCHETYPE.spiral),
            fullContentJson: JSON.stringify(fullContent),
            order: nextOrder,
        },
    });

    console.log(`✓ Created archetype "${created.name}" (${created.id}) at order ${nextOrder}.`);
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
