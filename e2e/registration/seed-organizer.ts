/**
 * Seed for organizer-driven registration tests.
 *
 * Creates competitions needed by organizer.test.ts:
 * - Happy Path: paid category, registration closed → tests pending → confirm flow
 * - Refuse: paid category, registration open → tests organizer refusing
 * - Waitlist: paid category (maxParties=2), registration open → tests waitlisting + promotion
 * - Auto-Confirm: free category, registration closed → tests auto-confirm flow
 * - Per-Category: two free categories, registration open → tests closing one category (#90)
 * - Follow Category: one free category, registration closed → tests the "notify me" bell
 */
import "dotenv/config";
import { createSeedContext, createCompetition } from '../seed_utils';
import { getTimeSlots, individual, competition } from './seed-helpers';

export default async function seed() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;
    const { morning, afternoon } = getTimeSlots();

    const PAID = { showPaymentWarning: true } as const;

    const happyPath = await createCompetition(ctx,
        competition(organizer.id, 'Happy Path Competition',
            'Competition for happy path registration E2E tests',
            [individual('500 pcs', morning, { price: 500 })],
            { registrationOpen: false, ...PAID }),
    );

    const refuseRegistration = await createCompetition(ctx,
        competition(organizer.id, 'Refuse Test Competition',
            'Tests organizer refusing a registration',
            [individual('500 pcs refuse', morning, { price: 500 })],
            PAID),
    );

    const waitlist = await createCompetition(ctx,
        competition(organizer.id, 'Waitlist Test Competition',
            'Tests waitlisting when category is full',
            [individual('500 pcs waitlist', morning, { maxParties: 2, price: 500 })],
            PAID),
    );

    const autoConfirm = await createCompetition(ctx,
        competition(organizer.id, 'Auto-Confirm Competition',
            'Tests auto-confirm flow with free category',
            [individual('500 pcs free', morning)],
            { registrationOpen: false }),
    );

    const perCategory = await createCompetition(ctx,
        competition(organizer.id, 'Per-Category Registration Competition',
            'Tests closing registration for a single category',
            [individual('500 pcs to close', morning), individual('1000 pcs open', afternoon)]),
    );

    const followCategory = await createCompetition(ctx,
        competition(organizer.id, 'Follow Category Competition',
            'Tests following a closed category to be notified when it opens',
            [individual('500 pcs follow', morning)],
            { registrationOpen: false }),
    );

    const result = {
        happyPath: { competitionId: happyPath.id, name: happyPath.name },
        refuseRegistration: { competitionId: refuseRegistration.id },
        waitlist: { competitionId: waitlist.id },
        autoConfirm: { competitionId: autoConfirm.id, name: autoConfirm.name },
        perCategory: {
            competitionId: perCategory.id,
            closedCategoryId: perCategory.categories[0].id,
            openCategoryId: perCategory.categories[1].id,
        },
        followCategory: {
            competitionId: followCategory.id,
            categoryId: followCategory.categories[0].id,
        },
    };

    console.log('✅ Organizer registration seed complete');
    return result;
}
