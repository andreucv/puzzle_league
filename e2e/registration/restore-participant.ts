/**
 * Restore for participant-driven registration tests.
 * Deletes competitions created by seed-participant.ts by name.
 */
import "dotenv/config";
import { createSeedContext } from '../seed_utils';

const COMPETITION_NAMES = [
    'External Participant Individual Competition',
    'Pairs Team Build Competition',
    'Unregister Test Competition',
    'Remove Queued Competition',
    'Multi-Cat Batch Competition',
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

    console.log('✅ Participant registration restore complete');
    await ctx.prisma.$disconnect();
}

main().catch(err => {
    console.error('❌ Restore failed:', err);
    process.exit(1);
});
