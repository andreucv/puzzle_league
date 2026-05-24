import { createPrismaClient } from '../../src/lib/database/create_prisma_client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { confirm } from '@inquirer/prompts';

/**
 * Interactive CLI tool to delete an entry by its ID.
 *
 * Usage:
 *   npx tsx scripts/db_data_read_write/delete_entry.ts <env> --id <entryId>
 *
 * Environments:
 *   dev   → PARIS_LOCAL_DATABASE_URL
 *   test  → PARIS_TEST_DATABASE_URL
 *   prod  → PARIS_PROD_DATABASE_URL
 *
 * Examples:
 *   npx tsx scripts/db_data_read_write/delete_entry.ts dev --id clxyz1234abc
 *   npx tsx scripts/db_data_read_write/delete_entry.ts prod --id clxyz1234abc
 */

const ENV_VAR_MAP: Record<string, string> = {
    dev: 'PARIS_LOCAL_DATABASE_URL',
    test: 'PARIS_TEST_DATABASE_URL',
    prod: 'PARIS_PROD_DATABASE_URL',
};

function parseArgs(): { env: string; entryId: string } {
    const args = process.argv.slice(2);

    if (args.length === 0 || !ENV_VAR_MAP[args[0]]) {
        console.error('❌ Usage: npx tsx delete_entry.ts <dev|test|prod> --id <entryId>');
        process.exit(1);
    }

    const env = args[0];
    let entryId: string | undefined;

    for (let i = 1; i < args.length; i++) {
        if (args[i] === '--id' && args[i + 1]) {
            entryId = args[i + 1];
            i++;
        }
    }

    if (!entryId) {
        console.error('❌ Usage: npx tsx delete_entry.ts <dev|test|prod> --id <entryId>');
        process.exit(1);
    }

    return { env, entryId };
}

function loadEnv(env: string) {
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
    const { env, entryId } = parseArgs();
    loadEnv(env);

    const prisma = createPrismaClient(process.env.DATABASE_URL!);

    try {
        console.log(`\n📍 Environment: ${env}\n`);

        // ── 1. Fetch the entry with details ────────────────────
        const entry = await prisma.entry.findUnique({
            where: { id: entryId },
            include: {
                category: {
                    select: { description: true, competition: { select: { name: true } } },
                },
                users: { select: { name: true, email: true } },
                externalParticipants: { select: { id: true, name: true } },
                creator: { select: { name: true, email: true } },
            },
        });

        if (!entry) {
            console.error(`❌ Entry with id "${entryId}" not found.`);
            process.exit(1);
        }

        // ── 2. Show entry details ──────────────────────────────
        console.log(`📋 Entry details:`);
        console.log(`   ID:          ${entry.id}`);
        console.log(`   Status:      ${entry.status}`);
        console.log(`   Competition: ${entry.category.competition.name}`);
        console.log(`   Category:    ${entry.category.description}`);
        console.log(`   Creator:     ${entry.creator.name} (${entry.creator.email})`);
        console.log(`   Created at:  ${entry.createdAt.toLocaleString()}`);

        if (entry.users.length > 0) {
            console.log(`   Users:       ${entry.users.map(u => `${u.name} (${u.email})`).join(', ')}`);
        }

        if (entry.externalParticipants.length > 0) {
            console.log(`   Externals:   ${entry.externalParticipants.map(e => e.name).join(', ')}`);
        }

        // ── 3. Confirm deletion ────────────────────────────────
        const proceed = await confirm({
            message: `\n⚠️  Delete this entry? This will also remove associated external participants.`,
            default: false,
        });

        if (!proceed) {
            console.log('Cancelled.');
            return;
        }

        // ── 4. Delete external participants and entry ──────────
        // External participants are linked via a many-to-many relation,
        // so we delete them explicitly before removing the entry.
        if (entry.externalParticipants.length > 0) {
            await prisma.externalParticipant.deleteMany({
                where: { id: { in: entry.externalParticipants.map(e => e.id) } },
            });
            console.log(`   🗑️  Deleted ${entry.externalParticipants.length} external participant(s).`);
        }

        await prisma.entry.delete({ where: { id: entryId } });

        console.log(`\n✅ Entry "${entryId}" deleted successfully.\n`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
