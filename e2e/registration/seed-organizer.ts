/**
 * Seed for organizer-driven registration tests.
 *
 * Creates competitions needed by organizer.test.ts:
 * - Happy Path: paid category, registration closed → tests pending → confirm flow
 * - Refuse: paid category, registration open → tests organizer refusing
 * - Waitlist: paid category (maxParties=2), registration open → tests waitlisting + promotion
 * - Auto-Confirm: free category, registration closed → tests auto-confirm flow
 */
import "dotenv/config";
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createSeedContext, createCompetition } from '../seed_utils';
import {
    getTimeSlots, individual, competition,
    ORGANIZER_COMPETITION_NAMES,
} from './seed-helpers';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;
    const { morning } = getTimeSlots();

    const PAID = { showPaymentWarning: true } as const;

    const happyPath = await createCompetition(ctx,
        competition(organizer.id, ORGANIZER_COMPETITION_NAMES[0],
            'Competition for happy path registration E2E tests',
            [individual('500 pcs', morning, { price: 500 })],
            { registrationOpen: false, ...PAID }),
    );

    const refuseRegistration = await createCompetition(ctx,
        competition(organizer.id, ORGANIZER_COMPETITION_NAMES[1],
            'Tests organizer refusing a registration',
            [individual('500 pcs refuse', morning, { price: 500 })],
            PAID),
    );

    const waitlist = await createCompetition(ctx,
        competition(organizer.id, ORGANIZER_COMPETITION_NAMES[2],
            'Tests waitlisting when category is full',
            [individual('500 pcs waitlist', morning, { maxParties: 2, price: 500 })],
            PAID),
    );

    const autoConfirm = await createCompetition(ctx,
        competition(organizer.id, ORGANIZER_COMPETITION_NAMES[3],
            'Tests auto-confirm flow with free category',
            [individual('500 pcs free', morning)],
            { registrationOpen: false }),
    );

    const dir = dirname(fileURLToPath(import.meta.url));
    writeFileSync(join(dir, 'test-data-organizer.json'), JSON.stringify({
        happyPath: { competitionId: happyPath.id, name: happyPath.name },
        refuseRegistration: { competitionId: refuseRegistration.id },
        waitlist: { competitionId: waitlist.id },
        autoConfirm: { competitionId: autoConfirm.id, name: autoConfirm.name },
    }, null, 2), 'utf-8');

    console.log('✅ Organizer registration seed complete');
    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
