/**
 * Suite seed for public_profile tests.
 *
 * Creates a FINISHED competition with one INDIVIDUAL category that has
 * a confirmed entry with a finish time (result). The participant user
 * from the base users is the one competing, so their profile link
 * appears on the results page.
 */
import "dotenv/config";
import {
    createSeedContext,
    writeSeedOutput,
    createCompetition,
    createEntries,
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
    const { organizer, participant } = ctx.baseUsers;

    const pastDate = daysFromNow(-5);
    const startTime = new Date(pastDate);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(pastDate);
    endTime.setHours(14, 0, 0, 0);

    const realStartTime = new Date(pastDate);
    realStartTime.setHours(10, 30, 0, 0);

    const finishTime = new Date(pastDate);
    finishTime.setHours(11, 15, 0, 0);

    const realEndTime = new Date(pastDate);
    realEndTime.setHours(14, 0, 0, 0);

    // 1. Create a finished competition
    const competition = await createCompetition(ctx, {
        name: 'Public Profile Test Competition',
        description: 'E2E test for public profile access control',
        location: 'Test Venue',
        country: 'ES',
        postalCode: '08001',
        startDate: pastDate,
        endDate: pastDate,
        creatorId: organizer.id,
        registrationOpen: false,
        categories: [{
            description: '500 pcs Individual',
            type: 'INDIVIDUAL',
            maxPartySize: 1,
            maxParties: 20,
            startTime,
            endTime,
        }],
    });

    const category = competition.categories[0];

    // 2. Create a confirmed entry for the participant
    const entries = await createEntries(ctx, [{
        categoryId: category.id,
        creatorId: participant.id,
        userIds: [participant.id],
        status: 'CONFIRMED',
    }]);

    // 3. Mark the category as COMPLETE with real start/end times
    await ctx.prisma.category.update({
        where: { id: category.id },
        data: {
            status: 'COMPLETE',
            realStartTime,
            realEndTime,
        },
    });

    // 4. Set a finish time on the entry (so it appears in results)
    await ctx.prisma.entry.update({
        where: { id: entries[0].id },
        data: { finishTime },
    });

    // 5. Mark competition as FINISHED
    await ctx.prisma.competition.update({
        where: { id: competition.id },
        data: { status: 'FINISHED' },
    });

    writeSeedOutput(import.meta.url, {
        competitionId: competition.id,
        categoryId: category.id,
        participantId: participant.id,
        participantName: participant.name,
    });

    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
