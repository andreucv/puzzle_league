/**
 * Suite seed for explore_competitions tests.
 *
 * Creates 4 competitions with different dates and statuses:
 * 1. "In 2 days" — 2 days from now, NOT_STARTED, registration open
 * 2. "In 9 days" — 9 days from now, NOT_STARTED, registration open
 * 3. "In 40 days" — 40 days from now, NOT_STARTED, registration closed
 * 4. "10 days ago (Finished)" — 10 days ago, FINISHED
 */
import "dotenv/config";
import {
    createSeedContext,
    writeSeedOutput,
    createCompetition,
} from '../seed_utils';

function daysFromNow(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(10, 0, 0, 0);
    return date;
}

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    const categoryTemplate = (description: string) => ({
        description,
        type: 'INDIVIDUAL' as const,
        maxPartySize: 1,
        maxParties: 20,
        startTime: new Date(new Date().setHours(10, 0, 0, 0)),
        endTime: new Date(new Date().setHours(14, 0, 0, 0)),
    });

    const baseCompetition = (name: string, startDate: Date, registrationOpen = true) => ({
        name,
        description: `E2E explore_competitions – ${name}`,
        location: 'Test Venue',
        country: 'ES',
        postalCode: '08001',
        startDate,
        endDate: startDate,
        creatorId: organizer.id,
        registrationOpen,
    });

    // 1. Competition in 2 days
    const in2Days = await createCompetition(ctx, {
        ...baseCompetition('Explore — In 2 days', daysFromNow(2), true),
        categories: [categoryTemplate('500 pcs Individual')],
    });

    // 2. Competition in 9 days
    const in9Days = await createCompetition(ctx, {
        ...baseCompetition('Explore — In 9 days', daysFromNow(9), true),
        categories: [categoryTemplate('500 pcs Individual')],
    });

    // 3. Competition in 40 days
    const in40Days = await createCompetition(ctx, {
        ...baseCompetition('Explore — In 40 days', daysFromNow(40), false),
        categories: [categoryTemplate('1000 pcs Individual')],
    });

    // 4. Competition 10 days ago → mark as FINISHED
    const ago10Days = await createCompetition(ctx, {
        ...baseCompetition('Explore — 10 days ago (Finished)', daysFromNow(-10), false),
        categories: [categoryTemplate('500 pcs Individual')],
    });

    // Update the past competition to FINISHED status
    await ctx.prisma.competition.update({
        where: { id: ago10Days.id },
        data: { status: 'FINISHED' },
    });

    writeSeedOutput(import.meta.url, {
        in2Days: { id: in2Days.id, name: in2Days.name },
        in9Days: { id: in9Days.id, name: in9Days.name },
        in40Days: { id: in40Days.id, name: in40Days.name },
        ago10Days: { id: ago10Days.id, name: ago10Days.name },
    });

    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
