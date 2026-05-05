/**
 * Suite seed for during_competition tests.
 *
 * Composes shared seed steps from seed_utils in order:
 * 1. Upsert 5 dummy participant users
 * 2. Create a competition with one INDIVIDUAL category
 * 3. Create 5 CONFIRMED entries (one per dummy user)
 * 4. Write test-data.json for the test file to consume
 */
import "dotenv/config";
import {
    createSeedContext,
    writeSeedOutput,
    upsertUsers,
    createCompetition,
    createEntries,
} from '../seed_utils';

const DUMMY_USERS = Array.from({ length: 5 }, (_, i) => ({
    name: `DC User ${i + 1}`,
    email: `dc-user-${i + 1}@test.local`,
}));

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    // 1. Upsert dummy users
    const users = await upsertUsers(ctx, DUMMY_USERS);

    // 2. Create competition with one category
    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(18, 0, 0, 0);

    const competition = await createCompetition(ctx, {
        name: 'E2E During Competition',
        description: 'Competition for during_competition e2e tests',
        location: 'Test Arena',
        country: 'ES',
        postalCode: '08001',
        startDate: now,
        endDate: now,
        creatorId: organizer.id,
        categories: [{
            description: '500 pcs Individual',
            type: 'INDIVIDUAL',
            maxPartySize: 1,
            maxParties: 50,
            startTime,
            endTime,
        }],
    });

    const category = competition.categories[0];

    // 3. Create confirmed entries
    const entries = await createEntries(
        ctx,
        users.map(u => ({
            categoryId: category.id,
            creatorId: u.id,
            userIds: [u.id],
            status: 'CONFIRMED' as const,
        })),
    );

    // 4. Write standardized output
    writeSeedOutput(import.meta.url, {
        competitionId: competition.id,
        categoryId: category.id,
        entryIds: entries.map(e => e.id),
        userNames: users.map(u => u.name),
    });

    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
