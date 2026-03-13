// Seed script — uses better-sqlite3 directly since Prisma's generated client
// in this project requires the adapter pattern.

const Database = require("better-sqlite3");
const { randomBytes } = require("crypto");

const db = new Database("./data/app.db");

const SUB_PROJECT_ID = "cmk2aymqb0000x31chmsxfpxn";

function cuid() {
    return "cm" + randomBytes(12).toString("hex").slice(0, 23);
}

const archetypes = [
    {
        name: "The Self-Blamer",
        kicker: "When there's no clear next step, stress turns inward.",
        description: "When they cannot see what to do next, stress can quickly become self-blame. They look for certainty or a 'right answer', and if they cannot find it, they read 'feeling stuck' as personal failure. They may hide it as 'I am fine' while spiraling privately",
        order: 0,
        demographic: { ageRange: "15-25", occupation: "Student", livingSetup: "Living with family" },
        influences: [
            "Peer comparison (in school, friendships, online, community)",
            "Social media highlight reels and \"achievement\" cues",
            "Family expectations (spoken or implied)",
            "Their own track record (\"I should be able to handle this\")"
        ],
        livedExperience: "Reads 'stuck' as a personal failure. Any uncertainty is just unbearable. That feeling of being stuck isn't a normal part of life. It's felt as solid proof that they are failing as a person. And that triggers their really harsh critical inner monologue.",
        behaviours: [
            "Searches for rules or clear steps; ends up feeling worse when none appear",
            "Replays what happened and runs \"what if\" loops",
            "Compares self to others as \"evidence\" they're behind",
            "Withdraws or becomes irritable; sleep and mood can slip"
        ],
        barriers: [
            "Self-blame makes support feel undeserved or embarrassing",
            "Fear of being judged as overreacting or not coping",
            "Finds it hard to name the feeling without making it seem to be \"about them\"",
            "Adults may dismiss it as \"normal insecurity\", so they don't get caught early"
        ],
        motivations: [
            "Keep face and look like they're managing",
            "Avoid letting people down",
            "Restore a sense of steadiness quickly"
        ],
        goals: [
            "Stop the spiral before it gets worse",
            "Find a \"good enough\" next step for right now",
            "Feel normal again without needing a big conversation"
        ],
        habits: [
            "Quietly pushes through until it becomes too much",
            "Uses comparison as a reality check, even when it backfires on them",
            "Avoids asking for help until they have \"proof\" it's serious"
        ],
        spiral: {
            pattern: "Uncertainty \u2192 \"I should know this\" \u2192 Self-Blame.",
            avoidance: "They avoid the jump from \"stuck\" to \"it's my fault\" when adults and support normalise \"not sure yet\", and offer one small, clear next step. The aim is to separate the feeling from their worth, so the gap does not get filled with self-blame."
        }
    },
    {
        name: "The Switch-Off Seeker",
        kicker: "When it feels too much, they bring the feeling down first.",
        description: "When the feeling is intense, thinking and talking can feel like effort. They prioritise quick relief (i.e. to calm down, stop overthinking, or stop crying) before they can reflect or plan. Switching off works fast, which is why it's hard to stop at \"enough\".",
        order: 1,
        demographic: { ageRange: "15-25", occupation: "Student", livingSetup: "Living with family" },
        influences: [
            "Easy access to low-effort relief (phone, feeds, games)",
            "Late-night alone time and reduced supervision",
            "Busy schedules and fatigue (less capacity to cope)",
            "Peer norms that make switching off feel normal"
        ],
        livedExperience: "They are not trying to \"avoid life\". They are trying to get the feeling down fast so they can function. The phone, sleep, or switching off wins because it is instant, private, and needs no words. The problem is not the reset; it is when the reset runs on and quietly creates time-debt.",
        behaviours: [
            "Scrolls, sleeps, avoids the topic, disappears into distractions",
            "Puts off decisions and conversations until they feel calmer",
            "Chooses relief that is instant, private, and needs no words",
            "May re-enter later, or drift into longer avoidance"
        ],
        barriers: [
            "Support that starts with reflection feels like extra work",
            "Fear of getting emotional if they start talking",
            "Guilt after switching off can add more stress",
            "If they're told off for coping, they hide it more"
        ],
        motivations: [
            "Bring the intensity down fast",
            "Feel quiet, numb, or \"not bothered\" for a while",
            "Keep functioning without breaking down"
        ],
        goals: [
            "Get through the next hour/day",
            "Feel steady enough to think later",
            "Avoid making it a bigger thing than it needs to be"
        ],
        habits: [
            "Reaches for the quickest \"off switch\" under pressure",
            "Uses late night as recovery time",
            "Relief first, sense-making later (if at all)"
        ],
        spiral: {
            pattern: "Overwhelm \u2192 Quick switch-off \u2192 Time slips \u2192 Stress returns louder.",
            avoidance: "They avoid the spiral when they have a fast downshift with a clear end point, and a gentle way back into the next task. The aim is to bound the switch-off, not shame it."
        }
    },
    {
        name: "The Risk-Checker",
        kicker: "They test for understanding first, then test what happens next.",
        description: "Reaching out starts as a small test, not a full disclosure. They first check: \u201CDo you get it?\u201D Then they check consequences: \u201CWhat happens next; will this be judged, lectured, brushed off, or passed on?\u201D If the first response lands badly, they often stop trying.",
        order: 2,
        demographic: { ageRange: "15-25", occupation: "Student", livingSetup: "Living with family" },
        influences: [
            "Past experiences of being dismissed, lectured, or escalated",
            "Trust in confidentiality (school, adults, services)",
            "Fear of gossip or it travelling back to parents/teachers",
            "The supporter\u2019s tone (scripted vs present)"
        ],
        livedExperience: "They are searching for two things at once: understanding and safety. They often share a small piece first and watch what happens, because they do not want it to turn into judgement, advice, or escalation. If the response feels risky or scripted, they stop. Not because they do not care, but because it feels unsafe to continue.",
        behaviours: [
            "Shares a small piece first, then watches the reaction",
            "Chooses lowest-risk person or channel (not always closest)",
            "Tests indirectly (jokes, hints, vague comments) before going deeper",
            "Pulls back fast if it starts to feel like advice, judgement, or drama"
        ],
        barriers: [
            "Unclear privacy boundaries (\"who else will know?\")",
            "Fear it becomes a bigger deal than intended",
            "If the response feels scripted, it reads as \"you don't care\"",
            "Worry they'll be pushed into action before they're ready"
        ],
        motivations: [
            "Be understood without exposure",
            "Keep control of the story",
            "Avoid consequences that add stress"
        ],
        goals: [
            "Find those who can help but won't make it worse",
            "Get reassurance before taking any next step",
            "Keep it contained and manageable"
        ],
        habits: [
            "\"Test then decide\" sharing",
            "Limits detail until safety is proven",
            "Avoids channels that trigger escalation"
        ],
        spiral: {
            pattern: "Need help \u2192 Test the waters \u2192 Feels unsafe / out of control \u2192 Withdraw.",
            avoidance: "They avoid the spiral when the first response signals \"I get it\", and sets out what happens next in plain terms. Safety is built by privacy clarity and choice, not pressure."
        }
    },
    {
        name: "The Problem-Fix Home",
        kicker: "At home, feelings can get translated into fixing, fault, or performance.",
        description: "When they bring stress to adults at home, the response can move quickly to solutions, school talk, or \u201Cwhat you should do\u201D. Even when it\u2019s well-meant, it can land as correction. Over time, they share less of how they feel and more of what sounds solvable \u2014 or they stop bringing it up.",
        order: 3,
        demographic: { ageRange: "15-25", occupation: "Student", livingSetup: "Living with family" },
        influences: [
            "Parent default: protect outcomes, reduce risk, \"do something about it now\"",
            "Home culture: performance, responsibility, \"don't waste time\"",
            "Parents' own stress and coping style",
            "Previous conversations that ended in nagging, blame, or rules"
        ],
        livedExperience: "Home can feel like a place where feelings get turned into solutions, school talk, or fault. Even well-meant advice can land as correction, so they start editing what they share. Over time, they bring only the \u201Csolvable\u201D surface \u2014 or nothing \u2014 because they are trying to avoid making it into a bigger thing.",
        behaviours: [
            "Youth brings practical problems, not feelings",
            "Parent gives advice, reminders, comparisons, or consequences",
            "Youth shuts down, gives short answers, changes topic",
            "Emotional support shifts to friends; home becomes logistics"
        ],
        barriers: [
            "Fear of lectures, nagging, or being blamed",
            "Fear it triggers monitoring or restrictions",
            "Feeling misunderstood (\"you're not hearing me\")",
            "Lack of shared language for feelings beyond \"stress\""
        ],
        motivations: [
            "Keep things calm at home",
            "Avoid making it into \"a whole thing\"",
            "Stay independent and not be treated like a child"
        ],
        goals: [
            "Be heard before being fixed",
            "Get comfort without pressure to act immediately",
            "Keep autonomy while still getting support"
        ],
        habits: [
            "Shares late, when it's already big",
            "Edits what they say to avoid consequences",
            "Learns that \"feelings talk\" leads to correction, so avoids it"
        ],
        spiral: {
            pattern: "Vulnerability \u2192 Fixing / blame / lecture \u2192 Shutdown \u2192 Share less next time.",
            avoidance: "They avoid the spiral when adults listen first and reflect the feeling, before moving to problem-solving. Agreeing what kind of help is wanted keeps the conversation open."
        }
    },
    {
        name: "The Quiet Carrier",
        kicker: "They try to handle it alone so they don\u2019t burden others.",
        description: "They keep it to themselves for as long as they can. They don\u2019t want to trouble people, and they\u2019re not sure what counts as \u201Cserious enough\u201D to share. They often reach out later, and even then, they keep it small.",
        order: 4,
        demographic: { ageRange: "15-25", occupation: "Student", livingSetup: "Living with family" },
        influences: [
            "Beliefs about self-reliance (\"I should manage\")",
            "Fear of being a burden",
            "Peer norms around keeping it light",
            "Previous support that felt awkward or unhelpful"
        ],
        livedExperience: "They are trying to be low-maintenance and not burden anyone. They often do not know what is \u201Cserious enough\u201D to share, so they keep going and carry it privately. By the time they reach out, it can feel higher-stakes yet they still share in small pieces.",
        behaviours: [
            "Minimises, jokes, or says \"I'm fine\"",
            "Pushes through and keeps busy",
            "Uses private relief first (sleep/scroll/avoid)",
            "Reaches out late, and often only to the safest person"
        ],
        barriers: [
            "Shame about needing help",
            "Fear of awkwardness or saying the wrong thing",
            "Worry it will create more attention than they want",
            "Hard to start when they don't have words"
        ],
        motivations: [
            "Keep dignity and control",
            "Avoid burdening others or looking weak",
            "Maintain normal life and routine"
        ],
        goals: [
            "Feel better without making it public",
            "Have someone there without a long conversation",
            "Get reassurance they're not \"too much\""
        ],
        habits: [
            "Delays support until the feeling is bigger",
            "Shares in small pieces, if at all",
            "Avoids channels that feel formal or serious"
        ],
        spiral: {
            pattern: "Keep it in \u2192 Push through \u2192 Build-up \u2192 Reach out late (or not at all).",
            avoidance: "They avoid the spiral when support shows up as low-pressure check-ins and easy first steps that do not demand a big disclosure. Making \u201Csmall sharing\u201D acceptable helps them start earlier."
        }
    }
];

// Create archetype session
const sessionId = cuid();
const now = new Date().toISOString();

db.prepare(`INSERT INTO ArchetypeSession (id, subProjectId, name, status, modelName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    sessionId, SUB_PROJECT_ID, "Manual Archetypes", "COMPLETE", "manual-entry", now, now
);
console.log(`Session created: ${sessionId}`);

const insertStmt = db.prepare(`
  INSERT INTO Archetype (id, archetypeSessionId, name, kicker, description, demographicJson, goalsJson, motivationsJson, spiralJson, groundTruthJson, internalConflictJson, breakingPointsJson, evidenceJson, fullContentJson, "order", createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const a of archetypes) {
    const id = cuid();
    const fullContent = {
        name: a.name,
        kicker: a.kicker,
        description: a.description,
        demographic: a.demographic,
        influences: a.influences,
        livedExperience: a.livedExperience,
        behaviours: a.behaviours,
        barriers: a.barriers,
        motivations: a.motivations,
        goals: a.goals,
        habits: a.habits,
        spiral: a.spiral,
    };

    insertStmt.run(
        id,
        sessionId,
        a.name,
        a.kicker,
        a.description,
        JSON.stringify(a.demographic),
        JSON.stringify(a.goals),
        JSON.stringify(a.motivations),
        JSON.stringify(a.spiral),
        null, // groundTruthJson
        null, // internalConflictJson
        null, // breakingPointsJson
        null, // evidenceJson
        JSON.stringify(fullContent),
        a.order,
        now,
        now
    );
    console.log(`  Created: ${a.name} (${id})`);
}

console.log("\nDone! All 5 archetypes inserted.");
db.close();
