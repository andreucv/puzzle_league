import { createPrismaClient } from '../../src/lib/database/create_prisma_client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { select, input, confirm } from '@inquirer/prompts';

/**
 * Interactive CLI tool to bulk-create entries with ExternalParticipants
 * in PENDING_CONFIRMATION status for a given category.
 *
 * Usage:
 *   npx tsx scripts/db_data_read_write/upsert_entries.ts <env>
 *
 * Environments:
 *   dev   → PARIS_LOCAL_DATABASE_URL
 *   test  → PARIS_TEST_DATABASE_URL
 *   prod  → PARIS_PROD_DATABASE_URL
 *
 * Flow:
 *   1. Select a competition
 *   2. Select a category
 *   3. Select a creator (existing user)
 *   4. Type external participant names one by one (empty to stop)
 *   5. Names are auto-grouped by category.maxPartySize (default 1)
 *   6. Entries are created in PENDING_CONFIRMATION status
 *   7. Duplicates (same name in same category) are skipped
 */

const ENV_VAR_MAP: Record<string, string> = {
    dev: 'PARIS_LOCAL_DATABASE_URL',
    test: 'PARIS_TEST_DATABASE_URL',
    prod: 'PARIS_PROD_DATABASE_URL',
};

function parseEnv(): string {
    const env = process.argv[2];

    if (!env || !ENV_VAR_MAP[env]) {
        console.error('❌ Usage: npx tsx upsert_entries.ts <dev|test|prod>');
        process.exit(1);
    }

    return env;
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
    const env = parseEnv();
    loadEnv(env);

    const prisma = createPrismaClient(process.env.DATABASE_URL!);

    try {
        console.log(`\n📍 Environment: ${env}\n`);

        // ── 1. Select competition ──────────────────────────────
        const competitions = await prisma.competition.findMany({
            orderBy: { startDate: 'desc' },
            select: { id: true, name: true, startDate: true, status: true },
        });

        if (competitions.length === 0) {
            console.error('❌ No competitions found.');
            process.exit(1);
        }

        const competitionId = await select({
            message: 'Select a competition:',
            choices: competitions.map(c => ({
                name: `${c.name} (${c.startDate.toLocaleDateString()}) [${c.status}]`,
                value: c.id,
            })),
        });

        // ── 2. Select category ─────────────────────────────────
        const categories = await prisma.category.findMany({
            where: { competitionId },
            orderBy: { startTime: 'asc' },
            select: {
                id: true,
                description: true,
                type: true,
                maxPartySize: true,
                maxParties: true,
                _count: { select: { entries: true } },
            },
        });

        if (categories.length === 0) {
            console.error('❌ No categories found for this competition.');
            process.exit(1);
        }

        const categoryId = await select({
            message: 'Select a category:',
            choices: categories.map(c => ({
                name: `${c.description} [${c.type}] (${c._count.entries} entries${c.maxParties ? `, max ${c.maxParties}` : ''}, party size: ${c.maxPartySize ?? 1})`,
                value: c.id,
            })),
        });

        const selectedCategory = categories.find(c => c.id === categoryId)!;
        const partySize = selectedCategory.maxPartySize ?? 1;

        // ── 3. Select creator (existing user) ──────────────────
        const users = await prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, email: true },
        });

        if (users.length === 0) {
            console.error('❌ No users found in the database.');
            process.exit(1);
        }

        const creatorId = await select({
            message: 'Select the creator (organizer) for these entries:',
            choices: users.map(u => ({
                name: `${u.name} (${u.email})`,
                value: u.id,
            })),
        });

        // ── 4. Collect external participant names ──────────────
        console.log(`\n📝 Enter external participant names one by one.`);
        console.log(`   Party size for this category: ${partySize}`);
        console.log(`   Leave empty and press Enter to finish.\n`);

        const names: string[] = [];
        let keepGoing = true;

        while (keepGoing) {
            const name = await input({
                message: `Participant name #${names.length + 1}:`,
            });

            if (name.trim() === '') {
                keepGoing = false;
            } else {
                names.push(name.trim());
            }
        }

        if (names.length === 0) {
            console.log('⚠️  No names entered. Nothing to do.');
            return;
        }

        // ── 5. Group names by party size ───────────────────────
        const groups: string[][] = [];
        for (let i = 0; i < names.length; i += partySize) {
            groups.push(names.slice(i, i + partySize));
        }

        // Warn if last group is incomplete
        const lastGroup = groups[groups.length - 1];
        if (lastGroup.length < partySize) {
            console.log(`\n⚠️  Last group has ${lastGroup.length}/${partySize} participants: ${lastGroup.join(', ')}`);
            const proceed = await confirm({
                message: 'Create an incomplete entry for this group?',
                default: true,
            });
            if (!proceed) {
                groups.pop();
                if (groups.length === 0) {
                    console.log('Nothing to do.');
                    return;
                }
            }
        }

        // ── 6. Check for duplicates & show summary ─────────────
        const existingExternals = await prisma.externalParticipant.findMany({
            where: {
                entries: { some: { categoryId } },
            },
            select: { name: true },
        });
        const existingNames = new Set(existingExternals.map(e => e.name.toLowerCase()));

        console.log(`\n📋 Summary: ${groups.length} entries to create in "${selectedCategory.description}":\n`);
        let skippedCount = 0;
        for (const [i, group] of groups.entries()) {
            const hasDuplicates = group.some(n => existingNames.has(n.toLowerCase()));
            const marker = hasDuplicates ? ' ⚠️  (has duplicates, will skip)' : '';
            if (hasDuplicates) skippedCount++;
            console.log(`   Entry ${i + 1}: ${group.join(' + ')}${marker}`);
        }

        const doConfirm = await confirm({
            message: `\nProceed to create ${groups.length - skippedCount} entries?`,
            default: true,
        });

        if (!doConfirm) {
            console.log('Cancelled.');
            return;
        }

        // ── 7. Create entries ──────────────────────────────────
        let created = 0;
        let skipped = 0;

        for (const group of groups) {
            // Skip if any name in the group already exists in this category
            if (group.some(n => existingNames.has(n.toLowerCase()))) {
                console.log(`   ⏭️  Skipped (duplicate): ${group.join(' + ')}`);
                skipped++;
                continue;
            }

            await prisma.entry.create({
                data: {
                    status: 'PENDING_CONFIRMATION',
                    categoryId,
                    creatorId,
                    externalParticipants: {
                        create: group.map(name => ({
                            name,
                            createdById: creatorId,
                        })),
                    },
                },
            });

            console.log(`   ✅ Created: ${group.join(' + ')}`);
            created++;
        }

        console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}\n`);
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
