import { writeFileSync, readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

// ── Types matching seed_data.json schema ──

interface SeedUser {
    id: string;
    name: string;
    email: string;
    country: string;
    postalCode: string;
}

interface SeedCompetition {
    name: string;
    description: string;
    location: string;
    country: string;
    postalCode: string;
    startDate: string;
    endDate: string;
    creatorIndex: number;
}

interface SeedCategory {
    competitionIndex: number;
    description: string;
    type: string;
    maxPartySize: number;
    maxParties: number;
    startTime: string;
    endTime: string;
}

interface SeedRecord {
    competitionIndex: number;
    categoryIndex: number;
    creatorIndex: number;
    userIndices: number[];
    status: string;
}

interface SeedData {
    users: SeedUser[];
    competitions: SeedCompetition[];
    categories: SeedCategory[];
    records: SeedRecord[];
}

// ── User generation ──

const FIRST_NAMES = [
    'Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Hank',
    'Ivy', 'Jack', 'Karen', 'Leo', 'Mona', 'Nick', 'Olivia', 'Paul',
    'Quinn', 'Rosa', 'Sam', 'Tina', 'Ugo', 'Vera', 'Wade', 'Xena',
    'Yuri', 'Zara', 'Axel', 'Bella', 'Cleo', 'Dante',
    'Elena', 'Felix', 'Gina', 'Hugo', 'Iris', 'Joel', 'Kira', 'Liam',
    'Maya', 'Noah', 'Olga', 'Pedro', 'Rita', 'Sean', 'Thea', 'Ulf',
    'Vito', 'Wendy', 'Xavi', 'Yael', 'Zoe', 'Amir', 'Bea', 'Cyrus',
    'Dina', 'Elio', 'Faye', 'Gus', 'Hana', 'Ivan',
];

const LAST_NAMES = [
    'Johnson', 'Smith', 'Davis', 'Wilson', 'Martinez', 'Brown', 'Lee',
    'Taylor', 'Anderson', 'Thomas', 'White', 'Harris', 'Clark', 'Lewis',
    'Walker', 'Young', 'King', 'Wright', 'Hill', 'Scott', 'Green',
    'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts',
    'Turner', 'Phillips', 'Evans', 'Collins', 'Stewart', 'Morales', 'Reed',
    'Cook', 'Morgan', 'Bell', 'Murphy', 'Bailey', 'Rivera', 'Cooper',
    'Cox', 'Howard', 'Ward', 'Torres', 'Gray', 'Ramirez', 'James', 'Watson',
    'Brooks', 'Kelly', 'Sanders', 'Price', 'Bennett', 'Wood', 'Barnes',
    'Ross', 'Henderson', 'Coleman',
];

const COUNTRIES = ['ES', 'FR', 'DE', 'IT', 'NL', 'PT', 'BE', 'AT'];
const POSTAL_CODES = ['08001', '75001', '10115', '20121', '1012', '1000', '1000', '1010'];

function generateUsers(count: number): SeedUser[] {
    const users: SeedUser[] = [];
    for (let i = 0; i < count; i++) {
        const idx = i % COUNTRIES.length;
        users.push({
            id: randomUUID(),
            name: `${FIRST_NAMES[i]} ${LAST_NAMES[i]}`,
            email: `user${String(i + 1).padStart(2, '0')}@seed.local`,
            country: COUNTRIES[idx],
            postalCode: POSTAL_CODES[idx],
        });
    }
    return users;
}

// ── Competition generation ──

const COMPETITION_TEMPLATES = [
    { name: 'Spring Puzzle Championship', location: 'Barcelona Convention Center', country: 'ES', postalCode: '08001' },
    { name: 'European Puzzle Masters', location: 'Paris Expo Hall', country: 'FR', postalCode: '75001' },
    { name: 'Summer Jigsaw Open', location: 'Berlin Puzzle Arena', country: 'DE', postalCode: '10115' },
    { name: 'International Puzzle Cup', location: 'Milan Puzzlefest', country: 'IT', postalCode: '20121' },
];

function generateCompetitions(baseDate: Date, creatorIndices: number[]): SeedCompetition[] {
    return COMPETITION_TEMPLATES.map((tpl, i) => {
        // One competition per month, starting next month
        const compDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1 + i, 15);
        return {
            name: tpl.name,
            description: `${tpl.name} — a thrilling speed puzzling event!`,
            location: tpl.location,
            country: tpl.country,
            postalCode: tpl.postalCode,
            startDate: compDate.toISOString(),
            endDate: compDate.toISOString(),
            creatorIndex: creatorIndices[i] ?? creatorIndices[0],
        };
    });
}

// ── Category generation ──

interface CategoryTemplate {
    description: string;
    type: string;
    maxPartySize: number;
    maxParties: number;
    morningSlot: boolean;
}

const CATEGORY_POOL: CategoryTemplate[] = [
    { description: '500 pcs Ravensburger', type: 'INDIVIDUAL', maxPartySize: 1, maxParties: 50, morningSlot: true },
    { description: '1000 pcs Educa', type: 'PAIRS', maxPartySize: 2, maxParties: 45, morningSlot: false },
    { description: '2000 pcs Clementoni', type: 'TEAM', maxPartySize: 4, maxParties: 40, morningSlot: true },
    { description: '300 pcs Junior Challenge', type: 'INDIVIDUAL', maxPartySize: 1, maxParties: 50, morningSlot: false },
    { description: '1500 pcs Trefl Pairs', type: 'PAIRS', maxPartySize: 2, maxParties: 45, morningSlot: true },
    { description: '3000 pcs Team Marathon', type: 'TEAM', maxPartySize: 4, maxParties: 40, morningSlot: false },
];

function generateCategories(competitions: SeedCompetition[]): SeedCategory[] {
    const categories: SeedCategory[] = [];
    // Deterministic: competition 0 gets 3 cats, comp 1 gets 2, comp 2 gets 3, comp 3 gets 2
    const categoryCountPattern = [3, 2, 3, 2];

    for (let ci = 0; ci < competitions.length; ci++) {
        const compDate = new Date(competitions[ci].startDate);
        const count = categoryCountPattern[ci % categoryCountPattern.length];

        for (let j = 0; j < count; j++) {
            const tpl = CATEGORY_POOL[(ci * 3 + j) % CATEGORY_POOL.length];
            const startHour = tpl.morningSlot ? 10 : 14;
            const endHour = tpl.morningSlot ? 12 : 17;

            const startTime = new Date(compDate);
            startTime.setHours(startHour, 0, 0, 0);
            const endTime = new Date(compDate);
            endTime.setHours(endHour, 0, 0, 0);

            categories.push({
                competitionIndex: ci,
                description: tpl.description,
                type: tpl.type,
                maxPartySize: tpl.maxPartySize,
                maxParties: tpl.maxParties,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
            });
        }
    }
    return categories;
}

// ── Record (inscription) generation ──

// Deterministic pseudo-random: seeded from category index to produce varied but reproducible counts
function seededCount(catIdx: number, salt: number, min: number, max: number): number {
    return min + ((catIdx * 7 + salt * 13 + 3) % (max - min + 1));
}

function generateRecords(categories: SeedCategory[], totalUsers: number, startUserIndex = 0): SeedRecord[] {
    // Build global-to-local category index map
    const catCountByComp = new Map<number, number>();
    const catGlobalToLocal = new Map<number, number>();
    for (let i = 0; i < categories.length; i++) {
        const ci = categories[i].competitionIndex;
        const localIdx = catCountByComp.get(ci) ?? 0;
        catGlobalToLocal.set(i, localIdx);
        catCountByComp.set(ci, localIdx + 1);
    }

    const records: SeedRecord[] = [];
    let userCursor = startUserIndex;

    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
        const cat = categories[catIdx];
        const partySize = cat.maxPartySize;
        const localCatIdx = catGlobalToLocal.get(catIdx)!;

        // Deterministic varied counts per status
        const numConfirmed = seededCount(catIdx, 0, 15, 30);
        const numPending = seededCount(catIdx, 1, 5, 10);
        const numWaitlisted = seededCount(catIdx, 2, 1, 3);

        const statusBatches: { status: string; count: number }[] = [
            { status: 'CONFIRMED', count: numConfirmed },
            { status: 'PENDING_CONFIRMATION', count: numPending },
            { status: 'WAITLISTED', count: numWaitlisted },
        ];

        for (const batch of statusBatches) {
            for (let r = 0; r < batch.count; r++) {
                const userIndices: number[] = [];
                for (let p = 0; p < partySize; p++) {
                    userIndices.push(userCursor % totalUsers);
                    userCursor++;
                }

                records.push({
                    competitionIndex: cat.competitionIndex,
                    categoryIndex: localCatIdx,
                    creatorIndex: userIndices[0],
                    userIndices,
                    status: batch.status,
                });
            }
        }
    }

    return records;
}

// ── Main ──

export function generateSeedData(): SeedData {
    const baseDate = new Date(2026, 2, 1); // March 1, 2026
    const scriptDir = dirname(fileURLToPath(import.meta.url));

    // Load real users if real_seed_data.json is present
    const realSeedPath = join(scriptDir, 'real_seed_data.json');
    let realUsers: SeedUser[] = [];

    if (existsSync(realSeedPath)) {
        const realData = JSON.parse(readFileSync(realSeedPath, 'utf-8'));
        realUsers = (realData.users as Array<{
            id: string; name: string; email: string;
            country: string | null; postalCode: string | null;
        }>).map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            country: u.country ?? 'ES',
            postalCode: u.postalCode ?? '08001',
        }));
        console.log(`ℹ️  Found real_seed_data.json — ${realUsers.length} real user(s) will own one competition each`);
    }

    // Real users first (indices 0..M-1), generated users after (indices M..M+29)
    const generatedUsers = generateUsers(60);
    const users = [...realUsers, ...generatedUsers];
    const M = realUsers.length;

    // Creator indices: real users own the first min(M, 4) competitions;
    // remaining competitions use the first available generated users
    const creatorIndices = COMPETITION_TEMPLATES.map((_, i) =>
        i < M ? i : M + (i - M),
    );

    const competitions = generateCompetitions(baseDate, creatorIndices);
    const categories = generateCategories(competitions);
    // Participants start from the first generated user (index M), cycling through them
    const records = generateRecords(categories, users.length, M);

    return { users, competitions, categories, records };
}

// Run standalone: npx tsx scripts/db_migration/generate_seed_data.ts
const scriptDir = dirname(fileURLToPath(import.meta.url));
const outPath = join(scriptDir, 'seed_data.json');
const data = generateSeedData();
writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
console.log(`✅ Seed data generated: ${outPath}`);
console.log(`   👥 ${data.users.length} users`);
console.log(`   🏆 ${data.competitions.length} competitions`);
console.log(`   📋 ${data.categories.length} categories`);
console.log(`   📝 ${data.records.length} records`);
