/**
 * Pre-assigned persona-name allocator.
 *
 * Synthesis runs in parallel, so each persona prompt would otherwise pick
 * its name independently and they collide on the most "obvious" name (e.g.
 * three Marcus Lims in five personas). To prevent that, we generate a
 * unique name list with a Singaporean race mix and balanced genders BEFORE
 * fan-out and inject the assigned name as a fixed requirement in each
 * synthesis prompt.
 *
 * Race targets follow Singapore's broad ethnic mix — Chinese majority,
 * Malay and Indian both meaningfully represented, Eurasian occasionally —
 * with hard guarantees that all three main races appear whenever N >= 3.
 */

export type PersonaNameGender = "male" | "female";
export type PersonaNameRace = "chinese" | "malay" | "indian" | "eurasian";

export interface NamePoolEntry {
    name: string;
    gender: PersonaNameGender;
    race: PersonaNameRace;
}

// Curated Singapore-flavoured name pool. Each entry carries gender + race
// so the allocator can guarantee both balance dimensions independently.
const NAME_POOL: NamePoolEntry[] = [
    // Chinese — female
    { name: "Mei Lin", gender: "female", race: "chinese" },
    { name: "Hui Min", gender: "female", race: "chinese" },
    { name: "Wei Ling", gender: "female", race: "chinese" },
    { name: "Jia Hui", gender: "female", race: "chinese" },
    { name: "Xin Yi", gender: "female", race: "chinese" },
    { name: "Pei Shan", gender: "female", race: "chinese" },
    { name: "Sok Cheng", gender: "female", race: "chinese" },
    { name: "Yan Ting", gender: "female", race: "chinese" },
    // Chinese — male
    { name: "Wei Jie", gender: "male", race: "chinese" },
    { name: "Boon Kheng", gender: "male", race: "chinese" },
    { name: "Kai Ming", gender: "male", race: "chinese" },
    { name: "Jun Hao", gender: "male", race: "chinese" },
    { name: "Yong Sheng", gender: "male", race: "chinese" },
    { name: "Chee Hong", gender: "male", race: "chinese" },
    { name: "Zhi Wei", gender: "male", race: "chinese" },
    { name: "Eng Chuan", gender: "male", race: "chinese" },
    // Malay — female
    { name: "Siti Aminah", gender: "female", race: "malay" },
    { name: "Nurul Aisyah", gender: "female", race: "malay" },
    { name: "Farah Hidayah", gender: "female", race: "malay" },
    { name: "Aida Rahmah", gender: "female", race: "malay" },
    { name: "Liyana Sofea", gender: "female", race: "malay" },
    // Malay — male
    { name: "Hafiz Rahman", gender: "male", race: "malay" },
    { name: "Iskandar Bakar", gender: "male", race: "malay" },
    { name: "Faizal Ismail", gender: "male", race: "malay" },
    { name: "Azhar Yusoff", gender: "male", race: "malay" },
    { name: "Ridzwan Salleh", gender: "male", race: "malay" },
    // Indian — female
    { name: "Priya Kumari", gender: "female", race: "indian" },
    { name: "Lakshmi Devi", gender: "female", race: "indian" },
    { name: "Aishwarya Pillai", gender: "female", race: "indian" },
    { name: "Divya Menon", gender: "female", race: "indian" },
    { name: "Anjali Rao", gender: "female", race: "indian" },
    // Indian — male
    { name: "Karthik Iyer", gender: "male", race: "indian" },
    { name: "Arjun Naidu", gender: "male", race: "indian" },
    { name: "Suresh Pillai", gender: "male", race: "indian" },
    { name: "Vikram Rao", gender: "male", race: "indian" },
    { name: "Rajiv Menon", gender: "male", race: "indian" },
    // Eurasian — small bucket, occasional representation
    { name: "Daniel Tan", gender: "male", race: "eurasian" },
    { name: "Ethan Lim", gender: "male", race: "eurasian" },
    { name: "Sarah Tan", gender: "female", race: "eurasian" },
    { name: "Rachel Lee", gender: "female", race: "eurasian" },
    { name: "Marcus Lim", gender: "male", race: "eurasian" },
    { name: "Joanna Chua", gender: "female", race: "eurasian" },
];

function shuffleInPlace<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Compute target name counts per race for `count` total personas.
 *
 * Rules:
 * - Below 3, we don't bother with a mandatory race mix (random pick).
 * - From 3 upward, the three main Singaporean races are each guaranteed
 *   at least one name. Chinese gets the leftover capacity reflecting
 *   their majority share. Eurasian only appears for larger groups (5+).
 */
function targetRaceDistribution(count: number): Record<PersonaNameRace, number> {
    const out: Record<PersonaNameRace, number> = { chinese: 0, malay: 0, indian: 0, eurasian: 0 };
    if (count <= 0) return out;
    if (count === 1) { out.chinese = 1; return out; }
    if (count === 2) { out.chinese = 1; out.malay = 1; return out; }

    // From 3 personas onward: 1 Malay + 1 Indian guaranteed, the rest
    // Chinese (occasionally swapping one Chinese slot for Eurasian once
    // the group is large enough to spare it).
    out.malay = 1;
    out.indian = 1;
    let remaining = count - 2;

    if (count >= 5) {
        out.eurasian = 1;
        remaining -= 1;
    }
    out.chinese = remaining;
    return out;
}

/**
 * Allocate `count` unique persona names with both race mix and rough
 * gender balance. Race targets reflect a Singapore audience; gender
 * within each race is split as evenly as the bucket allows.
 *
 * Optional `excludeNames` lets the caller exclude names already in use
 * elsewhere (e.g. on a re-run that should not collide with old personas).
 */
export function allocatePersonaNames(count: number, excludeNames: Iterable<string> = []): NamePoolEntry[] {
    if (count <= 0) return [];

    const exclude = new Set(Array.from(excludeNames).map(n => n.trim().toLowerCase()));
    const available = NAME_POOL.filter(e => !exclude.has(e.name.toLowerCase()));

    // Per-race buckets, each pre-shuffled and split by gender.
    type Bucket = { female: NamePoolEntry[]; male: NamePoolEntry[] };
    const buckets: Record<PersonaNameRace, Bucket> = {
        chinese: { female: [], male: [] },
        malay: { female: [], male: [] },
        indian: { female: [], male: [] },
        eurasian: { female: [], male: [] },
    };
    for (const e of available) buckets[e.race][e.gender].push(e);
    for (const race of Object.keys(buckets) as PersonaNameRace[]) {
        shuffleInPlace(buckets[race].female);
        shuffleInPlace(buckets[race].male);
    }

    const targets = targetRaceDistribution(count);
    const picked: NamePoolEntry[] = [];

    // First pass: try to honour race targets, alternating gender to keep
    // each bucket balanced. We track gender count globally so the overall
    // mix is close to 50/50 too.
    let femaleCount = 0;
    let maleCount = 0;
    const takeFromBucket = (race: PersonaNameRace): NamePoolEntry | null => {
        const b = buckets[race];
        // Prefer the gender that currently has fewer picks overall to
        // nudge gender balance, but fall through if that bucket is empty.
        const preferFemale = femaleCount <= maleCount;
        const primary = preferFemale ? b.female : b.male;
        const fallback = preferFemale ? b.male : b.female;
        const next = primary.shift() ?? fallback.shift();
        if (!next) return null;
        if (next.gender === "female") femaleCount += 1;
        else maleCount += 1;
        return next;
    };

    for (const race of Object.keys(targets) as PersonaNameRace[]) {
        for (let i = 0; i < targets[race]; i++) {
            const next = takeFromBucket(race);
            if (next) picked.push(next);
        }
    }

    // Second pass: if any race bucket ran short of names, top up from
    // whichever races still have available names. Maintains uniqueness
    // because each bucket is drained via shift().
    if (picked.length < count) {
        const races: PersonaNameRace[] = ["chinese", "malay", "indian", "eurasian"];
        let idx = 0;
        while (picked.length < count && idx < races.length * 8) {
            const race = races[idx % races.length];
            const next = takeFromBucket(race);
            if (next) picked.push(next);
            idx += 1;
        }
    }

    // Final fallback: synthesise indexed placeholders if the pool was
    // genuinely too small (shouldn't happen with the bundled pool).
    while (picked.length < count) {
        picked.push({
            name: `Persona ${picked.length + 1}`,
            gender: picked.length % 2 ? "male" : "female",
            race: "chinese",
        });
    }

    // Final shuffle so race/gender order on the grid isn't predictable.
    return shuffleInPlace(picked).slice(0, count);
}
// Created by Swapnil Bapat © 2026
