import { createPrismaClient } from '../../src/lib/database/create_prisma_client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { select, confirm } from '@inquirer/prompts';

/**
 * Interactive CLI tool to update publicProfileVisibility for all users.
 *
 * Usage:
 *   npx tsx scripts/db_data_read_write/update_public_profile_visibility.ts <env>
 *
 * Environments:
 *   dev   → LOCAL_DATABASE_URL
 *   test  → TEST_DATABASE_URL
 *   prod  → PROD_DATABASE_URL
 *
 * Flow:
 *   1. Select target visibility value (true / false)
 *   2. Show how many users will be affected
 *   3. Confirm and apply changes
 */

const ENV_VAR_MAP: Record<string, string> = {
	dev: 'LOCAL_DATABASE_URL',
	test: 'TEST_DATABASE_URL',
	prod: 'PROD_DATABASE_URL',
};

function parseEnv(): string {
	const env = process.argv[2];

	if (!env || !ENV_VAR_MAP[env]) {
		console.error('❌ Usage: npx tsx update_public_profile_visibility.ts <dev|test|prod>');
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

		// ── 1. Select target visibility ────────────────────────
		const targetValue = await select({
			message: 'Set publicProfileVisibility to:',
			choices: [
				{ name: 'true (visible)', value: true },
				{ name: 'false (hidden)', value: false },
			],
		});

		// ── 2. Count affected users ────────────────────────────
		const affectedCount = await prisma.user.count({
			where: { publicProfileVisibility: !targetValue },
		});

		const totalCount = await prisma.user.count();

		console.log(`\n📊 ${affectedCount} of ${totalCount} users will be updated (currently set to ${!targetValue}).`);

		if (affectedCount === 0) {
			console.log('✅ All users already have the desired value. Nothing to do.');
			return;
		}

		// ── 3. Confirm ─────────────────────────────────────────
		const confirmed = await confirm({
			message: `Update ${affectedCount} users to publicProfileVisibility = ${targetValue}?`,
			default: false,
		});

		if (!confirmed) {
			console.log('❌ Aborted.');
			return;
		}

		// ── 4. Apply ───────────────────────────────────────────
		const result = await prisma.user.updateMany({
			where: { publicProfileVisibility: !targetValue },
			data: { publicProfileVisibility: targetValue },
		});

		console.log(`\n✅ Updated ${result.count} users.`);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((err) => {
	console.error('❌ Unexpected error:', err);
	process.exit(1);
});
