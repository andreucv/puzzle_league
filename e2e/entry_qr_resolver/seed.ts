/**
 * Suite seed for the /e/[entryId] QR-resolver tests.
 *
 * 1. Upsert 3 dummy participant users
 * 2. Create a competition with one INDIVIDUAL category
 * 3. Create 3 CONFIRMED entries with published table numbers
 * 4. Set the category LIVE (so during_competition loads its entry records)
 * 5. Create a suite-private judge assigned to the category
 */
import "dotenv/config";
import {
    createSeedContext,
    upsertUsers,
    createCompetition,
    createEntries,
    createAuthUser,
} from '../seed_utils';

const DUMMY_USERS = Array.from({ length: 3 }, (_, i) => ({
    name: `QR User ${i + 1}`,
    email: `qr-user-${i + 1}@test.local`,
}));

export default async function seed() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    const users = await upsertUsers(ctx, DUMMY_USERS);

    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(10, 0, 0, 0);
    const endTime = new Date(now);
    endTime.setHours(18, 0, 0, 0);

    const competition = await createCompetition(ctx, {
        name: 'E2E QR Resolver',
        description: 'Competition for /e/[entryId] resolver e2e tests',
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

    const entries = await createEntries(
        ctx,
        users.map(u => ({
            categoryId: category.id,
            creatorId: u.id,
            userIds: [u.id],
            status: 'CONFIRMED' as const,
        })),
    );

    // Publish table numbers (what the printed cards carry)
    for (const [index, entry] of entries.entries()) {
        await ctx.prisma.entry.update({
            where: { id: entry.id },
            data: { tableNumber: index + 1 },
        });
    }

    // LIVE so during_competition fetches the category's entry records
    await ctx.prisma.category.update({
        where: { id: category.id },
        data: { status: 'LIVE', realStartTime: now },
    });

    // Suite-private judge assigned to the category
    const judge = await createAuthUser(ctx, {
        name: 'QR Judge',
        email: 'qr-judge@test.local',
        password: 'qr-judge-password-1234',
    });
    await ctx.prisma.categoryJudgeAssignment.create({
        data: { categoryId: category.id, userId: judge.id },
    });

    return {
        competitionId: competition.id,
        categoryId: category.id,
        entryIds: entries.map(e => e.id),
        judge: { email: judge.email, password: judge.password },
    };
}
