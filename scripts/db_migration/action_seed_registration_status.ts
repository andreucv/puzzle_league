import "dotenv/config";
import { prisma } from './create_prisma_client';
import { CategoryType, RegistrationStatus } from '../../prisma/generated/prisma/client';

/**
 * Seeds 2 competitions that exercise every case of the competition-card registration status
 * design (issue #120, docs/features/home-registration-status-120/03-design.md):
 *
 *  [#120] Copa Puzzle Barcelona (in 10 days)
 *    - Individual   → you CONFIRMED                          (✓, 8/10)
 *    - Pairs Sub-21 → you WAITLISTED on a full category       (clock-alert, 3/3)
 *    - Team         → not yours                               (hidden behind "+1 more", no marker)
 *
 *  [#120] Lliga Tarragona · Jornada 3 (in 30 days)
 *    - Individual   → you CONFIRMED                           (✓)
 *    - Pairs        → mixed: you CONFIRMED + 2 PENDING + 1 WAITLISTED created by you for others
 *                     (sm+: ✓ ⏳2 ⌛ · mobile: ⌛)
 *    - Seniors      → not yours                               (hidden)
 *    - Team         → created by you, you don't participate   (✓, creator-only)
 *    - Kids         → created by you, WAITLISTED on full      (4th user category → hidden,
 *                                                              "+2 more" shows ⌛)
 *
 * The given user (default andreucv@gmail.com) must already exist (log in once).
 * Filler users (seed120-N@example.local) only fill capacity; they can't log in.
 * Re-running deletes the previous [#120] competitions first.
 *
 * Usage: npx tsx scripts/db_migration/action_seed_registration_status.ts [user_email]
 */

// Only allow this script to run against a local database
const databaseUrl = process.env.DATABASE_URL ?? '';
if (!databaseUrl.includes('localhost') && !databaseUrl.includes('127.0.0.1')) {
    console.error('❌ This script is intended for LOCAL databases only.');
    process.exit(1);
}

const PREFIX = '[#120]';
const FILLER_COUNT = 12;
const DAY = 24 * 60 * 60 * 1000;

type EntrySpec = {
    status: RegistrationStatus;
    creatorId: string;
    userIds?: string[];
    externalNames?: string[];
};

function daysFromNow(days: number, hour: number) {
    const date = new Date(Date.now() + days * DAY);
    date.setHours(hour, 0, 0, 0);
    return date;
}

async function upsertFillers() {
    const now = new Date();
    const fillers = [];
    for (let i = 1; i <= FILLER_COUNT; i++) {
        const email = `seed120-${i}@example.local`;
        fillers.push(
            await prisma.user.upsert({
                where: { email },
                update: {},
                create: {
                    id: `seed120-user-${i}`,
                    name: `Seed Puzzler ${i}`,
                    email,
                    emailVerified: true,
                    createdAt: now,
                    updatedAt: now,
                },
            }),
        );
    }
    return fillers.map((u) => u.id);
}

async function cleanPrevious(meId: string) {
    const { count } = await prisma.competition.deleteMany({ where: { name: { startsWith: PREFIX } } });
    // Entries cascade with the competition; external participants created for them don't
    await prisma.externalParticipant.deleteMany({ where: { createdById: meId, name: { startsWith: PREFIX } } });
    if (count) console.log(`🧹 Removed ${count} previous ${PREFIX} competition(s)`);
}

async function createCategory(
    competitionId: number,
    data: { type: CategoryType; subname?: string; maxParties: number; maxPartySize: number; day: number; hour: number },
    entries: EntrySpec[],
) {
    const category = await prisma.category.create({
        data: {
            competitionId,
            description: '',
            type: data.type,
            subname: data.subname ?? null,
            maxParties: data.maxParties,
            maxPartySize: data.maxPartySize,
            startTime: daysFromNow(data.day, data.hour),
            endTime: daysFromNow(data.day, data.hour + 2),
            registrationOpen: true,
        },
    });

    for (const entry of entries) {
        await prisma.entry.create({
            data: {
                categoryId: category.id,
                status: entry.status,
                confirmedAt: entry.status === RegistrationStatus.CONFIRMED ? new Date() : null,
                creatorId: entry.creatorId,
                users: { connect: (entry.userIds ?? []).map((id) => ({ id })) },
                externalParticipants: {
                    create: (entry.externalNames ?? []).map((name) => ({
                        name: `${PREFIX} ${name}`,
                        createdById: entry.creatorId,
                    })),
                },
            },
        });
    }
    return category;
}

/** `count` confirmed entries, each with `size` distinct filler users, starting at filler `offset`. */
function fillerEntries(fillers: string[], count: number, size = 1, offset = 0): EntrySpec[] {
    return Array.from({ length: count }, (_, i) => {
        const userIds = Array.from({ length: size }, (_, j) => fillers[(offset + i * size + j) % fillers.length]);
        return { status: RegistrationStatus.CONFIRMED, creatorId: userIds[0], userIds };
    });
}

async function main() {
    const email = process.argv[2] ?? 'andreucv@gmail.com';
    const me = await prisma.user.findUnique({ where: { email } });
    if (!me) {
        console.error(`❌ User not found: ${email}. Log in once on localhost first.`);
        process.exit(1);
    }

    console.log(`🧩 Seeding registration-status competitions for ${me.name} (${email})...`);
    await cleanPrevious(me.id);
    const fillers = await upsertFillers();
    const mine = (status: RegistrationStatus, partner?: string): EntrySpec => ({
        status,
        creatorId: me.id,
        userIds: partner ? [me.id, partner] : [me.id],
    });
    const forOthers = (status: RegistrationStatus, ...names: string[]): EntrySpec => ({
        status,
        creatorId: me.id,
        externalNames: names,
    });

    // --- Competition 1: confirmed + waitlisted on a full category --------------------------
    const barcelona = await prisma.competition.create({
        data: {
            name: `${PREFIX} Copa Puzzle Barcelona`,
            description: 'Seed data for issue #120: confirmed vs waitlisted on a full category.',
            location: 'Barcelona',
            country: 'ES',
            postalCode: '08001',
            startDate: daysFromNow(10, 9),
            endDate: daysFromNow(10, 20),
            creatorId: me.id,
        },
    });
    await createCategory(barcelona.id, { type: CategoryType.INDIVIDUAL, maxParties: 10, maxPartySize: 1, day: 10, hour: 10 }, [
        mine(RegistrationStatus.CONFIRMED),
        ...fillerEntries(fillers, 7),
    ]);
    await createCategory(barcelona.id, { type: CategoryType.PAIRS, subname: 'Sub-21', maxParties: 3, maxPartySize: 2, day: 10, hour: 13 }, [
        ...fillerEntries(fillers, 3, 2),
        mine(RegistrationStatus.WAITLISTED, fillers[11]),
    ]);
    await createCategory(barcelona.id, { type: CategoryType.TEAM, maxParties: 12, maxPartySize: 4, day: 10, hour: 16 }, fillerEntries(fillers, 5));
    console.log(`   ✅ ${barcelona.name} (id ${barcelona.id})`);

    // --- Competition 2: mixed statuses, creator-only entries, 4 user categories ------------
    const tarragona = await prisma.competition.create({
        data: {
            name: `${PREFIX} Lliga Tarragona · Jornada 3`,
            description: 'Seed data for issue #120: mixed statuses, entries created for others, hidden categories.',
            location: 'Tarragona',
            country: 'ES',
            postalCode: '43001',
            startDate: daysFromNow(30, 9),
            endDate: daysFromNow(30, 21),
            creatorId: me.id,
        },
    });
    await createCategory(tarragona.id, { type: CategoryType.INDIVIDUAL, maxParties: 40, maxPartySize: 1, day: 30, hour: 9 }, [
        mine(RegistrationStatus.CONFIRMED),
        ...fillerEntries(fillers, 11),
    ]);
    await createCategory(tarragona.id, { type: CategoryType.PAIRS, maxParties: 9, maxPartySize: 2, day: 30, hour: 11 }, [
        mine(RegistrationStatus.CONFIRMED, fillers[0]),
        forOthers(RegistrationStatus.PENDING_CONFIRMATION, 'Marta', 'Jordi'),
        forOthers(RegistrationStatus.PENDING_CONFIRMATION, 'Laia', 'Pau'),
        ...fillerEntries(fillers, 5, 2, 1),
        forOthers(RegistrationStatus.WAITLISTED, 'Núria', 'Oriol'),
    ]);
    await createCategory(tarragona.id, { type: CategoryType.OTHER, subname: 'Seniors', maxParties: 16, maxPartySize: 1, day: 30, hour: 13 }, fillerEntries(fillers, 4));
    await createCategory(tarragona.id, { type: CategoryType.TEAM, maxParties: 10, maxPartySize: 4, day: 30, hour: 15 }, [
        forOthers(RegistrationStatus.CONFIRMED, 'Anna', 'Biel', 'Clara'),
        ...fillerEntries(fillers, 4),
    ]);
    await createCategory(tarragona.id, { type: CategoryType.JUNIOR_INDIVIDUAL, subname: 'Kids', maxParties: 2, maxPartySize: 1, day: 30, hour: 17 }, [
        ...fillerEntries(fillers, 2),
        forOthers(RegistrationStatus.WAITLISTED, 'Pol'),
    ]);
    console.log(`   ✅ ${tarragona.name} (id ${tarragona.id})`);

    console.log('✅ Done. Open http://localhost:5173/home and check "My upcoming competitions".');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
