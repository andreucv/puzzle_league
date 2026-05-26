/**
 * Restore seed for not-creator-organizer tests.
 *
 * Cleans up the competition and second organizer user created by the seed.
 */
import "dotenv/config";
import { createSeedContext, writeSeedOutput } from '../seed_utils';

const SECOND_ORGANIZER_EMAIL = 'second_organizer_e2e@test.com';

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);

    // Delete the test competition
    await ctx.prisma.competition.deleteMany({
        where: { name: 'Not Creator Test Competition' },
    });

    // Delete the second organizer user (cascade removes role assignments, accounts, etc.)
    await ctx.prisma.user.deleteMany({
        where: { email: SECOND_ORGANIZER_EMAIL },
    });

    writeSeedOutput(import.meta.url, { restored: true });
    await ctx.prisma.$disconnect();
}

main().catch((err) => {
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
