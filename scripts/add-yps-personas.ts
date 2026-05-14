/**
 * Manual archetype insert — YPS project (5 personas from the slide deck).
 *
 * Adds the following profiles to the YPS project's first workspace:
 *   1. The "Just Don't Get Into Trouble" Parent
 *   2. The "Let's Try This" Parent
 *   3. The Momentum Teen
 *   4. The Load-Bearing Teen
 *   5. The Friend Parent
 *
 * Reuses the existing "Manual Archetypes" ArchetypeSession on that workspace
 * if one exists; otherwise creates one. Inserts are idempotent — re-running
 * skips any archetype whose name already exists in the session.
 *
 * Source slide layout maps onto the Archetype schema like so:
 *   slide "Behaviours"        → fullContent.behaviours      (renders "Behaviours")
 *   slide "Barriers"          → fullContent.barriers        (renders "Barriers")
 *   slide "Motivations"       → fullContent.motivations     (renders "Motivations")
 *   slide "What is working"   → fullContent.goals           (renders "Goals")
 *   slide "What is not working" → fullContent.habits        (renders "Habits")
 *   slide health bar chart    → fullContent.healthScores    (stored, not rendered)
 *
 * Run locally:
 *   npx tsx scripts/add-yps-personas.ts
 *
 * Run against Neon prod:
 *   DATABASE_URL="postgres://..." npx tsx scripts/add-yps-personas.ts
 *
 * Override project match (default: anything containing "YPS"):
 *   PROJECT_QUERY="Youth Parental Support" npx tsx scripts/add-yps-personas.ts
 *
 * Pin to a specific subProject:
 *   SUB_PROJECT_ID="cmXXXX" npx tsx scripts/add-yps-personas.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type HealthScores = {
    exerciseWell: string;
    eatWell: string;
    sleepWell: string;
    relationshipWithParents: string;
    oralHealth: string;
    balancedScreenUse: string;
};

type PersonaInput = {
    name: string;
    kicker: string;
    description: string;
    demographic: { ageRange: string; occupation: string; livingSetup: string };
    behaviours: string[];
    barriers: string[];
    motivations: string[];
    whatIsWorking: string[];
    whatIsNotWorking: string[];
    healthScores: HealthScores;
};

const PARENT_DEMO = {
    ageRange: "40-50",
    occupation: "Parent of youth (13-19)",
    livingSetup: "Living with family",
};
const TEEN_DEMO = {
    ageRange: "13-19",
    occupation: "Student",
    livingSetup: "Living with family",
};

const PERSONAS: PersonaInput[] = [
    {
        name: 'The "Just Don\'t Get Into Trouble" Parent',
        kicker:
            "As long as they don't get into trouble, I'm okay to let some things go.",
        description:
            "These parents prioritise avoiding constant conflict by enforcing only what they consider most critical, while allowing flexibility in everyday habits.",
        demographic: PARENT_DEMO,
        behaviours: [
            "Sets a few non-negotiables (e.g. safety, attendance)",
            "Allows flexibility on sleep, screens, food",
            "Gives extensions instead of strict cut-offs",
            "Steps in when behaviour becomes concerning",
        ],
        barriers: [
            "Low energy or time to monitor daily habits",
            "Uncertainty about which habits matter most",
            "Concern that frequent enforcement leads to resistance",
        ],
        motivations: [
            "Maintains household peace",
            "Preserves the parent–youth relationship",
            "Accepts that full control is no longer realistic",
        ],
        whatIsWorking: [
            "Clear boundaries around high-risk behaviours",
            "Letting youth experience consequences naturally",
            "Stepping in selectively rather than constantly",
        ],
        whatIsNotWorking: [
            "Vague or shifting rules",
            "Waiting too long before addressing recurring issues",
            "Assuming habits will self-correct without support",
        ],
        healthScores: {
            exerciseWell: "2/6",
            eatWell: "5/6",
            sleepWell: "4/6",
            relationshipWithParents: "6/6",
            oralHealth: "2/6",
            balancedScreenUse: "2/6",
        },
    },
    {
        name: 'The "Let\'s Try This" Parent',
        kicker:
            "When I played football, my friends said the ground was shaking… so I started going to the gym.",
        description:
            "These parents recognise that past methods no longer work and actively experiment with different ways of guiding their youth, adjusting their approach based on how the youth responds.",
        demographic: PARENT_DEMO,
        behaviours: [
            "Explores different parenting approaches",
            "Tries negotiating instead of enforcing",
            "Adjusts tone and timing after resistance",
            "Alternates between stepping in and back",
            "Checks in before setting rules",
        ],
        barriers: [
            'Uncertainty about what is "too strict" or "too loose"',
            "Inconsistent results when trying new approaches",
            "Limited confidence in whether they are doing the right thing",
        ],
        motivations: [
            "Wants to remain relevant and effective as the youth grows",
            "Wants guidance to be received rather than rejected",
            "Is willing to change their own behaviour first",
        ],
        whatIsWorking: [
            "Calm conversations when there is no immediate issue",
            "Framing guidance as discussion rather than instruction",
            "Reflecting on what triggered resistance before trying again",
        ],
        whatIsNotWorking: [
            "Applying the same rule repeatedly after pushback",
            "Switching approaches too frequently without clarity",
            "Expecting immediate results from new methods",
        ],
        healthScores: {
            exerciseWell: "2/6",
            eatWell: "4.5/6",
            sleepWell: "4.5/6",
            relationshipWithParents: "5/6",
            oralHealth: "1.5/6",
            balancedScreenUse: "3/6",
        },
    },
    {
        name: "The Momentum Teen",
        kicker:
            "When I played football, my friends said the ground was shaking… so I started going to the gym.",
        description:
            "Youth whose healthy behaviours are activated by peer influence and sustained through belonging, identity, or enjoyment. Once momentum is built, behaviour continues with less reliance on parental involvement.",
        demographic: TEEN_DEMO,
        behaviours: [
            "Starts after peer comments or comparison",
            "Commits hard once something clicks (e.g. gym, basketball, sports)",
            "Prioritises that activity over others",
        ],
        barriers: [
            "Pulled between sport and academics",
            "Sees limits as holding them back",
            "Night-time phone use is a weak spot",
            "High exam pressure, little time to recover",
        ],
        motivations: [
            "Behaviours without social reinforcement",
            "Limited access or resources (e.g. money for healthier food)",
            "Loss of peer group or enjoyment",
        ],
        whatIsWorking: [
            "Wants to feel less tired the next day",
            "Wants to get through daily responsibilities",
            "Recognises links between habits and energy",
        ],
        whatIsNotWorking: [
            "Desire to fit in or not be singled out",
            "Enjoyment of the activity itself",
            "Sense of belonging or identity",
        ],
        healthScores: {
            exerciseWell: "4.5/6",
            eatWell: "4/6",
            sleepWell: "4/6",
            relationshipWithParents: "4.5/6",
            oralHealth: "2/6",
            balancedScreenUse: "1/6",
        },
    },
    {
        name: "The Load-Bearing Teen",
        kicker:
            "Whenever I tell myself I'm going to start sleeping earlier, maybe it will only last for about 3 to 4 days… then I'll end up sleeping really, really late.",
        description:
            "Youth who are aware of healthy behaviours but manage them day-to-day based on mental load and fatigue. Health actions are reactive and often short-lived, especially when daily demands accumulate.",
        demographic: TEEN_DEMO,
        behaviours: [
            "Stays up later than intended",
            "Uses phone or activities to wind down",
            "Attempts changes but doesn't sustain them",
            'Pushes through fatigue while still "functioning"',
        ],
        barriers: [
            "Mental load from schoolwork extending into late night",
            "Difficulty stopping activities once started",
            "Reliance on self-control when already tired",
            "Lack of stable routines to anchor behaviour",
        ],
        motivations: [
            "Mental load from schoolwork extending into late night",
            "Difficulty stopping activities once started",
            "Reliance on self-control when already tired",
        ],
        whatIsWorking: [
            "Wants to feel less tired the next day",
            "Wants to get through daily responsibilities",
            "Recognises links between habits and energy",
        ],
        whatIsNotWorking: [
            "One-off resolutions",
            "Relying on willpower late at night",
            "General advice without contextual support",
        ],
        healthScores: {
            exerciseWell: "2/6",
            eatWell: "3.5/6",
            sleepWell: "5/6",
            relationshipWithParents: "6/6",
            oralHealth: "4/6",
            balancedScreenUse: "1.5/6",
        },
    },
    {
        name: "The Friend Parent",
        kicker:
            "If they trust me, they will tell me what's going on. Then I can guide them.",
        description:
            "These parents minimise rules and control, relying on trust, openness, and mutual respect to influence their youth's behaviour.",
        demographic: PARENT_DEMO,
        behaviours: [
            "Avoids strict rules or punishments",
            "Encourages youth to make their own decisions",
            "Uses conversation instead of enforcement",
            "Participates in shared activities to stay connected",
            "Steps in mainly when youth asks for help",
        ],
        barriers: [
            "Difficulty intervening when habits worsen gradually",
            "Blurred boundary between guidance and permissiveness",
            "Relies heavily on youth to self-disclose issues",
        ],
        motivations: [
            "Keeps communication open",
            "Avoids creating fear or secrecy",
            "Treats youth as capable of self-regulation",
        ],
        whatIsWorking: [
            "Two-way conversations",
            "Youth-initiated discussions",
            "Shared activities that strengthen connection",
        ],
        whatIsNotWorking: [
            "Assuming trust alone leads to behaviour change",
            "Avoiding difficult conversations entirely",
            "Delaying intervention until problems escalate",
        ],
        healthScores: {
            exerciseWell: "4/6",
            eatWell: "3/6",
            sleepWell: "4/6",
            relationshipWithParents: "5.5/6",
            oralHealth: "2.5/6",
            balancedScreenUse: "2/6",
        },
    },
];

async function main() {
    const projectQuery = process.env.PROJECT_QUERY || "YPS";
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

    // 3. Insert each persona (skip duplicates by name).
    let nextOrder = session.archetypes.length;
    const existingNames = new Set(session.archetypes.map((a) => a.name));

    for (const p of PERSONAS) {
        if (existingNames.has(p.name)) {
            console.log(`→ Skipping "${p.name}" — already exists.`);
            continue;
        }

        const fullContent = {
            name: p.name,
            kicker: p.kicker,
            description: p.description,
            demographic: p.demographic,
            behaviours: p.behaviours,
            barriers: p.barriers,
            motivations: p.motivations,
            // Slide labels remapped onto PersonaPanel's existing slots:
            //   "What is working" → goals,  "What is not working" → habits
            goals: p.whatIsWorking,
            habits: p.whatIsNotWorking,
            // Stored for future UI surfacing; not rendered today.
            healthScores: p.healthScores,
        };

        const created = await prisma.archetype.create({
            data: {
                archetypeSessionId: session.id,
                name: p.name,
                kicker: p.kicker,
                description: p.description,
                demographicJson: JSON.stringify(p.demographic),
                goalsJson: JSON.stringify(p.whatIsWorking),
                motivationsJson: JSON.stringify(p.motivations),
                fullContentJson: JSON.stringify(fullContent),
                order: nextOrder,
            },
        });

        console.log(`✓ Created "${created.name}" (${created.id}) at order ${nextOrder}.`);
        nextOrder += 1;
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
// Created by Swapnil Bapat © 2026
