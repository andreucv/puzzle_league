/**
 * Seed for organizer-driven registration tests.
 *
 * Creates competitions needed by organizer.test.ts:
 * - Happy Path: 1 individual category, registration closed
 * - Refuse: 1 individual category, registration open
 * - Waitlist: 1 individual category (maxParties=2), registration open
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

    const individualCategory = (description: string, maxParties = 10) => ({
        description,
        type: 'INDIVIDUAL' as const,
        maxPartySize: 1,
        maxParties,
        startTime: morningStart,
        endTime: morningEnd,
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

    const happyPath = await createCompetition(ctx, {
        ...baseCompetition('Happy Path Competition', 'Competition for happy path registration E2E tests', false),
        categories: [individualCategory('500 pcs')],
    });

    const refuseRegistration = await createCompetition(ctx, {
        ...baseCompetition('Refuse Test Competition', 'Tests organizer refusing a registration'),
        categories: [individualCategory('500 pcs refuse')],
    });

    const waitlist = await createCompetition(ctx, {
        ...baseCompetition('Waitlist Test Competition', 'Tests waitlisting when category is full'),
        categories: [individualCategory('500 pcs waitlist', 2)],
    });

    const dir = dirname(fileURLToPath(import.meta.url));
    writeFileSync(join(dir, 'test-data-organizer.json'), JSON.stringify({
        happyPath: { competitionId: happyPath.id, name: happyPath.name },
        refuseRegistration: { competitionId: refuseRegistration.id },
        waitlist: { competitionId: waitlist.id },
    }, null, 2), 'utf-8');

    console.log('✅ Organizer registration seed complete');
    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
