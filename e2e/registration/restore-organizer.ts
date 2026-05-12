/**
 * Restore for organizer-driven registration tests.
 * Deletes competitions created by seed-organizer.ts by name.
 */
import "dotenv/config";
import { createSeedContext } from '../seed_utils';

const COMPETITION_NAMES = [
    'Happy Path Competition',
    'Refuse Test Competition',
    'Waitlist Test Competition',
];

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not set');

    const ctx = await createSeedContext(databaseUrl);
    const { organizer } = ctx.baseUsers;

    await ctx.prisma.competition.deleteMany({
        where: {
            creatorId: organizer.id,
            name: { in: COMPETITION_NAMES },
        },
    });

    console.log('✅ Organizer registration restore complete');
    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
