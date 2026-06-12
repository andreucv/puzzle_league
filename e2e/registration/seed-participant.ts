/**
 * Seed for participant-driven registration tests.
 *
 * Creates competitions needed by participant.test.ts:
 * - External Participant: paid individual category → tests external participant signup
 * - Group Team: paid pairs category → tests team building
 * - Unregister: paid individual category → tests unregistering
 * - Remove Queued: free individual category → tests removing queued signup (no submission)
 * - Multi-Category: paid individual + pairs → tests batch registration
 * - Free With Warning: showPaymentWarning=true but price=0 → tests auto-confirm edge case
 */
import "dotenv/config";
import { createSeedContext, createCompetition } from '../seed_utils';
import { getTimeSlots, individual, pairs, competition } from './seed-helpers';

export default async function seed() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;
    const { morning, afternoon } = getTimeSlots();

    const PAID = { showPaymentWarning: true } as const;

    const externalParticipant = await createCompetition(ctx,
        competition(organizer.id, 'External Participant Individual Competition',
            'Tests registering a non-platform participant',
            [individual('500 pcs solo', morning, { price: 500 })],
            PAID),
    );

    const groupTeam = await createCompetition(ctx,
        competition(organizer.id, 'Pairs Team Build Competition',
            'Tests building a team for pairs category',
            [pairs('500 pcs pairs', morning, { price: 500 })],
            PAID),
    );

    const unregister = await createCompetition(ctx,
        competition(organizer.id, 'Unregister Test Competition',
            'Tests unregistering from a category',
            [individual('500 pcs unreg', morning, { price: 500 })],
            PAID),
    );

    const removeQueued = await createCompetition(ctx,
        competition(organizer.id, 'Remove Queued Competition',
            'Tests removing a queued signup',
            [individual('500 pcs remove', morning)]),
    );

    const multiCategory = await createCompetition(ctx,
        competition(organizer.id, 'Multi-Cat Batch Competition',
            'Tests registering for multiple categories at once',
            [
                individual('500 pcs individual', morning, { price: 500 }),
                pairs('500 pcs pairs', afternoon, { price: 500 }),
            ],
            PAID),
    );

    const freeWithWarning = await createCompetition(ctx,
        competition(organizer.id, 'Free With Warning Competition',
            'Tests auto-confirm when showPaymentWarning=true but price=0',
            [individual('500 pcs free-warning', morning)],
            { showPaymentWarning: true }),
    );

    const result = {
        externalParticipant: { competitionId: externalParticipant.id },
        groupTeam: { competitionId: groupTeam.id },
        unregister: { competitionId: unregister.id },
        removeQueued: { competitionId: removeQueued.id },
        multiCategory: {
            competitionId: multiCategory.id,
            individualCategoryId: multiCategory.categories[0].id,
            pairsCategoryId: multiCategory.categories[1].id,
        },
        freeWithWarning: { competitionId: freeWithWarning.id },
    };

    console.log('✅ Participant registration seed complete');
    await ctx.prisma.$disconnect();
    return result;
}
