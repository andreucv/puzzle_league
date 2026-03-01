import { prisma } from './create_prisma_client';

async function main() {
    console.log('🧹 Cleaning database — deleting all data...');

    // Delete in FK-safe order: leaf tables first, then parents
    const deleted = {
        notifications: (await prisma.notification.deleteMany()).count,
        leaguePoints: (await prisma.leaguePoints.deleteMany()).count,
        records: (await prisma.record.deleteMany()).count,
        requests: (await prisma.request.deleteMany()).count,
        roleAssignments: (await prisma.roleAssignment.deleteMany()).count,
        categories: (await prisma.category.deleteMany()).count,
        puzzles: (await prisma.puzzle.deleteMany()).count,
        competitions: (await prisma.competition.deleteMany()).count,
        leagues: (await prisma.league.deleteMany()).count,
        verifications: (await prisma.verification.deleteMany()).count,
        accounts: (await prisma.account.deleteMany()).count,
        sessions: (await prisma.session.deleteMany()).count,
        users: (await prisma.user.deleteMany()).count,
    };

    for (const [table, count] of Object.entries(deleted)) {
        console.log(`   🗑️  ${table}: ${count} rows deleted`);
    }

    console.log('✅ Database cleaned successfully!');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
