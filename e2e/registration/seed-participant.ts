/**
 * Seed for participant-driven registration tests.
 *
 * Creates competitions needed by participant.test.ts:
 * - External Participant: 1 individual category, registration open
 * - Group Team: 1 pairs category, registration open
 * - Unregister: 1 individual category, registration open
 * - Remove Queued: 1 individual category, registration open
 * - Multi-Category: individual + pairs categories, registration open
 */
import "dotenv/config";
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createSeedContext, createCompetition } from '../seed_utils';

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

    const baseCompetition = (name: string, description: string) => ({
        name,
        description,
        location: 'Test Location',
        country: 'ES',
        postalCode: '08001',
        startDate: now,
        endDate: now,
        creatorId: organizer.id,
        registrationOpen: true,
    });

    const externalParticipant = await createCompetition(ctx, {
        ...baseCompetition('External Participant Individual Competition', 'Tests registering a non-platform participant'),
        categories: [individualCategory('500 pcs solo')],
    });

    const groupTeam = await createCompetition(ctx, {
        ...baseCompetition('Pairs Team Build Competition', 'Tests building a team for pairs category'),
        categories: [pairsCategory('500 pcs pairs')],
    });

    const unregister = await createCompetition(ctx, {
        ...baseCompetition('Unregister Test Competition', 'Tests unregistering from a category'),
        categories: [individualCategory('500 pcs unreg')],
    });

    const removeQueued = await createCompetition(ctx, {
        ...baseCompetition('Remove Queued Competition', 'Tests removing a queued signup'),
        categories: [individualCategory('500 pcs remove')],
    });

    const multiCategory = await createCompetition(ctx, {
        ...baseCompetition('Multi-Cat Batch Competition', 'Tests registering for multiple categories at once'),
        categories: [
            individualCategory('500 pcs individual'),
            pairsCategory('500 pcs pairs', afternoonStart, afternoonEnd),
        ],
    });

    const dir = dirname(fileURLToPath(import.meta.url));
    writeFileSync(join(dir, 'test-data-participant.json'), JSON.stringify({
        externalParticipant: { competitionId: externalParticipant.id },
        groupTeam: { competitionId: groupTeam.id },
        unregister: { competitionId: unregister.id },
        removeQueued: { competitionId: removeQueued.id },
        multiCategory: {
            competitionId: multiCategory.id,
            individualCategoryId: multiCategory.categories[0].id,
            pairsCategoryId: multiCategory.categories[1].id,
        },
    }, null, 2), 'utf-8');

    console.log('✅ Participant registration seed complete');
    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
