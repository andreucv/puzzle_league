/**
 * Suite seed for registration tests.
 *
 * Creates all competitions needed by the registration test suites:
 * - Happy Path: 1 individual category, registration closed
 * - External Participant: 1 individual category, registration open
 * - Group Team: 1 pairs category, registration open
 * - Unregister: 1 individual category, registration open
 * - Refuse: 1 individual category, registration open
 * - Waitlist: 1 individual category (maxParties=1), registration open
 * - Remove Queued: 1 individual category, registration open
 * - Multi-Category: individual + pairs categories, registration open
 */
import "dotenv/config";
import {
    createSeedContext,
    writeSeedOutput,
    createCompetition,
} from '../seed_utils';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    const now = new Date();
    const morningStart = new Date(now);
    morningStart.setHours(10, 0, 0, 0);
    const morningEnd = new Date(now);
    morningEnd.setHours(12, 0, 0, 0);
    const afternoonStart = new Date(now);
    afternoonStart.setHours(14, 0, 0, 0);
    const afternoonEnd = new Date(now);
    afternoonEnd.setHours(16, 0, 0, 0);

    const individualCategory = (description: string, maxParties = 10) => ({
        description,
        type: 'INDIVIDUAL' as const,
        maxPartySize: 1,
        maxParties,
        startTime: morningStart,
        endTime: morningEnd,
    });

    const pairsCategory = (description: string, startTime = morningStart, endTime = morningEnd) => ({
        description,
        type: 'PAIRS' as const,
        maxPartySize: 2,
        maxParties: 10,
        startTime,
        endTime,
    });

    const baseCompetition = (name: string, description: string, registrationOpen = true) => ({
        name,
        description,
        location: 'Test Location',
        country: 'ES',
        postalCode: '08001',
        startDate: now,
        endDate: now,
        creatorId: organizer.id,
        registrationOpen,
    });

    // 1. Happy Path — registration starts closed
    const happyPath = await createCompetition(ctx, {
        ...baseCompetition('Happy Path Competition', 'Competition for happy path registration E2E tests', false),
        categories: [individualCategory('500 pcs')],
    });

    // 2. External Participant Individual
    const externalParticipant = await createCompetition(ctx, {
        ...baseCompetition('External Participant Individual Competition', 'Tests registering a non-platform participant'),
        categories: [individualCategory('500 pcs solo')],
    });

    // 3. Group Team (Pairs)
    const groupTeam = await createCompetition(ctx, {
        ...baseCompetition('Pairs Team Build Competition', 'Tests building a team for pairs category'),
        categories: [pairsCategory('500 pcs pairs')],
    });

    // 4. Unregister
    const unregister = await createCompetition(ctx, {
        ...baseCompetition('Unregister Test Competition', 'Tests unregistering from a category'),
        categories: [individualCategory('500 pcs unreg')],
    });

    // 5. Refuse
    const refuseRegistration = await createCompetition(ctx, {
        ...baseCompetition('Refuse Test Competition', 'Tests organizer refusing a registration'),
        categories: [individualCategory('500 pcs refuse')],
    });

    // 6. Waitlist (maxParties=1)
    const waitlist = await createCompetition(ctx, {
        ...baseCompetition('Waitlist Test Competition', 'Tests waitlisting when category is full'),
        categories: [individualCategory('500 pcs waitlist', 1)],
    });

    // 7. Remove Queued
    const removeQueued = await createCompetition(ctx, {
        ...baseCompetition('Remove Queued Competition', 'Tests removing a queued signup'),
        categories: [individualCategory('500 pcs remove')],
    });

    // 8. Multi-Category
    const multiCategory = await createCompetition(ctx, {
        ...baseCompetition('Multi-Cat Batch Competition', 'Tests registering for multiple categories at once'),
        categories: [
            individualCategory('500 pcs individual'),
            pairsCategory('500 pcs pairs', afternoonStart, afternoonEnd),
        ],
    });

    writeSeedOutput(import.meta.url, {
        happyPath: {
            competitionId: happyPath.id,
            name: happyPath.name,
        },
        externalParticipant: { competitionId: externalParticipant.id },
        groupTeam: { competitionId: groupTeam.id },
        unregister: { competitionId: unregister.id },
        refuseRegistration: { competitionId: refuseRegistration.id },
        waitlist: { competitionId: waitlist.id },
        removeQueued: { competitionId: removeQueued.id },
        multiCategory: {
            competitionId: multiCategory.id,
            individualCategoryId: multiCategory.categories[0].id,
            pairsCategoryId: multiCategory.categories[1].id,
        },
    });

    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
