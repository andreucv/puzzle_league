import { createPrismaClient } from '../../src/lib/database/create_prisma_client';
import { config } from 'dotenv';
import { resolve } from 'path';

/**
 * Lists all users who have NOT inscribed to a given competition in any category.
 *
 * Usage:
 *   npx tsx scripts/db_migration/query_users_not_inscribed.ts <env> --competitionId <id>
 *
 * Environments (same as prisma_deploy.sh):
 *   dev   → PARIS_LOCAL_DATABASE_URL
 *   test  → PARIS_TEST_DATABASE_URL
 *   prod  → PARIS_PROD_DATABASE_URL
 *
 * Examples:
 *   npx tsx scripts/db_migration/query_users_not_inscribed.ts prod --competitionId 3
 *   npx tsx scripts/db_migration/query_users_not_inscribed.ts dev --competitionId 1
 */

const ENV_VAR_MAP: Record<string, string> = {
    dev: 'PARIS_LOCAL_DATABASE_URL',
    test: 'PARIS_TEST_DATABASE_URL',
    prod: 'PARIS_PROD_DATABASE_URL',
};

function parseArgs(): { env: string; competitionId: number } {
    const args = process.argv.slice(2);

    if (args.length === 0 || !ENV_VAR_MAP[args[0]]) {
        console.error('❌ Usage: npx tsx query_users_not_inscribed.ts <dev|test|prod> --competitionId <id>');
        process.exit(1);
    }

    const env = args[0];
    let competitionId: number | undefined;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--competitionId' && args[i + 1]) {
            competitionId = parseInt(args[i + 1], 10);
            i++;
        }
    }

    if (competitionId === undefined || isNaN(competitionId)) {
        console.error('❌ Usage: npx tsx query_users_not_inscribed.ts <dev|test|prod> --competitionId <id>');
        process.exit(1);
    }

    return { env, competitionId };
}

function loadEnv(env: string) {
    // Load .env from project root (same as prisma_deploy.sh)
    config({ path: resolve(process.cwd(), '.env') });

    const varName = ENV_VAR_MAP[env];
    const dbUrl = process.env[varName];

    if (!dbUrl) {
        console.error(`❌ ${varName} is not set. Make sure .env contains it.`);
        process.exit(1);
    }

    process.env.DATABASE_URL = dbUrl;
}

async function main() {
    const { env, competitionId } = parseArgs();
    loadEnv(env);

    const prisma = createPrismaClient(process.env.DATABASE_URL!);

    try {
        // Verify the competition exists
        const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: { categories: { select: { id: true, description: true } } },
        });

        if (!competition) {
            console.error(`❌ Competition with id ${competitionId} not found.`);
            process.exit(1);
        }

        console.log(`\n🏆 Competition: "${competition.name}" (id: ${competitionId})`);
        console.log(`   Categories: ${competition.categories.map(c => c.description).join(', ')}`);
        console.log(`   Environment: ${env}\n`);

        // Find users NOT inscribed to this competition in any category
        const usersNotInscribed = await prisma.user.findMany({
            where: {
                entries: {
                    none: {
                        category: {
                            competitionId: competitionId,
                        },
                    },
                },
            },
            select: {
                id: true,
                name: true,
                email: true,
                country: true,
            },
            orderBy: { name: 'asc' },
        });

        console.log(`📋 Users NOT inscribed to this competition: ${usersNotInscribed.length}\n`);

        if (usersNotInscribed.length === 0) {
            console.log('   All users are inscribed to at least one category!');
        } else {
            for (const user of usersNotInscribed) {
                console.log(`   • ${user.name} (${user.email})${user.country ? ` — ${user.country}` : ''}`);
            }
        }

        console.log('');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
