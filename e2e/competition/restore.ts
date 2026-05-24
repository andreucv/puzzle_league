/**
 * Restore seed for organizer competition tests.
 *
 * Deletes all competitions created by the organizer user so subsequent
 * test suites are not affected.
 */
import "dotenv/config";
import { createSeedContext, writeSeedOutput } from '../seed_utils';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    // Delete all competitions created by the organizer (cascade removes categories, entries, etc.)
    await ctx.prisma.competition.deleteMany({
        where: { creatorId: organizer.id },
    });

    const output = {
        organizerId: organizer.id,
        organizerName: organizer.name,
        organizerEmail: organizer.email,
    };

    writeSeedOutput(import.meta.url, output);
    await ctx.prisma.$disconnect();
}

main().catch((err) => {
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
