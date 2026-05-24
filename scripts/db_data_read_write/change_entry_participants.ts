import { createPrismaClient } from '../../src/lib/database/create_prisma_client';
import { config } from 'dotenv';
import { resolve } from 'path';
import { select, input, confirm, checkbox } from '@inquirer/prompts';

/**
 * Interactive CLI tool to change platform users and external participants
 * for a given entry, located by table number.
 *
 * Usage:
 *   npx tsx scripts/db_data_read_write/change_entry_participants.ts <env>
 *
 * Environments:
 *   dev   → LOCAL_DATABASE_URL
 *   test  → TEST_DATABASE_URL
 *   prod  → PROD_DATABASE_URL
 *
 * Flow:
 *   1. Select a competition
 *   2. Select a category
 *   3. Enter a table number
 *   4. Show current entry participants
 *   5. Change platform users (select from existing users)
 *   6. Change external participants (select existing or create new ones)
 *   7. Confirm and apply changes
 */

const ENV_VAR_MAP: Record<string, string> = {
	dev: 'LOCAL_DATABASE_URL',
	test: 'TEST_DATABASE_URL',
	prod: 'PROD_DATABASE_URL',
};

function parseEnv(): string {
	const env = process.argv[2];

	if (!env || !ENV_VAR_MAP[env]) {
		console.error('❌ Usage: npx tsx change_entry_participants.ts <dev|test|prod>');
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
			choices: competitions.map((c) => ({
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
			},
		});

		if (categories.length === 0) {
			console.error('❌ No categories found for this competition.');
			process.exit(1);
		}

		const categoryId = await select({
			message: 'Select a category:',
			choices: categories.map((c) => ({
				name: `${c.description} [${c.type}] (party size: ${c.maxPartySize ?? 1})`,
				value: c.id,
			})),
		});

		const selectedCategory = categories.find((c) => c.id === categoryId)!;
		const partySize = selectedCategory.maxPartySize ?? 1;

		// ── 3. Enter table number ──────────────────────────────
		const tableNumberStr = await input({
			message: 'Enter the table number:',
			validate: (val) => {
				const n = parseInt(val, 10);
				if (isNaN(n) || n <= 0) return 'Please enter a valid positive number.';
				return true;
			},
		});
		const tableNumber = parseInt(tableNumberStr, 10);

		// ── 4. Find the entry ──────────────────────────────────
		const entry = await prisma.entry.findFirst({
			where: { categoryId, tableNumber },
			include: {
				users: { select: { id: true, name: true, email: true } },
				externalParticipants: { select: { id: true, name: true } },
				creator: { select: { id: true, name: true, email: true } },
			},
		});

		if (!entry) {
			console.error(`❌ No entry found with table number ${tableNumber} in "${selectedCategory.description}".`);
			process.exit(1);
		}

		// ── 5. Show current participants ───────────────────────
		console.log(`\n📋 Entry at table ${tableNumber}:`);
		console.log(`   ID:      ${entry.id}`);
		console.log(`   Status:  ${entry.status}`);
		console.log(`   Creator: ${entry.creator.name} (${entry.creator.email})`);

		if (entry.users.length > 0) {
			console.log(`   Platform users:`);
			for (const u of entry.users) {
				console.log(`     - ${u.name} (${u.email})`);
			}
		} else {
			console.log(`   Platform users: (none)`);
		}

		if (entry.externalParticipants.length > 0) {
			console.log(`   External participants:`);
			for (const ep of entry.externalParticipants) {
				console.log(`     - ${ep.name}`);
			}
		} else {
			console.log(`   External participants: (none)`);
		}

		console.log(`   Party size: ${partySize}\n`);

		// ── 6. Choose what to change ───────────────────────────
		const whatToChange = await select({
			message: 'What do you want to change?',
			choices: [
				{ name: 'Platform users', value: 'users' as const },
				{ name: 'External participants', value: 'externals' as const },
				{ name: 'Both', value: 'both' as const },
			],
		});

		let newUserIds: string[] = entry.users.map((u) => u.id);
		let newExternalIds: string[] = entry.externalParticipants.map((ep) => ep.id);

		// ── 6a. Change platform users ──────────────────────────
		if (whatToChange === 'users' || whatToChange === 'both') {
			const allUsers = await prisma.user.findMany({
				orderBy: { name: 'asc' },
				select: { id: true, name: true, email: true },
			});

			if (allUsers.length === 0) {
				console.log('⚠️  No platform users found in the database.');
			} else {
				const currentUserIds = new Set(entry.users.map((u) => u.id));

				newUserIds = await checkbox({
					message: `Select platform users for this entry (party size: ${partySize}):`,
					choices: allUsers.map((u) => ({
						name: `${u.name} (${u.email})`,
						value: u.id,
						checked: currentUserIds.has(u.id),
					})),
				});
			}
		}

		// ── 6b. Change external participants ───────────────────
		if (whatToChange === 'externals' || whatToChange === 'both') {
			// Fetch all externals in the same competition (reusable across categories)
			const existingExternals = await prisma.externalParticipant.findMany({
				where: {
					entries: { some: { category: { competitionId } } },
				},
				orderBy: { name: 'asc' },
				select: { id: true, name: true },
			});

			const currentExternalIds = new Set(entry.externalParticipants.map((ep) => ep.id));

			let keepSelecting = true;
			newExternalIds = [];
			const newExternalsToCreate: string[] = [];

			while (keepSelecting) {
				// Build choices: existing externals + option to add new
				const allChoices = existingExternals.map((ep) => ({
					name: `${ep.name}${currentExternalIds.has(ep.id) ? ' (current)' : ''}`,
					value: ep.id,
				}));

				// Also show any newly created ones in this session
				for (const name of newExternalsToCreate) {
					allChoices.push({
						name: `${name} (new - will be created)`,
						value: `__new__:${name}`,
					});
				}

				const action = await select({
					message: `External participants so far: [${[...newExternalIds.map((id) => {
						const found = existingExternals.find((ep) => ep.id === id);
						return found ? found.name : id;
					}), ...newExternalsToCreate].join(', ') || 'none'}]\nWhat do you want to do?`,
					choices: [
						{ name: 'Select from existing external participants', value: 'select' as const },
						{ name: 'Create a new external participant', value: 'create' as const },
						{ name: 'Done - finish selecting', value: 'done' as const },
					],
				});

				if (action === 'done') {
					keepSelecting = false;
				} else if (action === 'create') {
					const newName = await input({
						message: 'Enter new external participant name:',
						validate: (val) => (val.trim() === '' ? 'Name cannot be empty.' : true),
					});
					newExternalsToCreate.push(newName.trim());
					console.log(`   ➕ "${newName.trim()}" will be created.`);
				} else {
					// Select from existing
					if (allChoices.length === 0) {
						console.log('⚠️  No existing external participants found. Use "Create new" instead.');
						continue;
					}

					const selectedId = await select({
						message: 'Select an external participant:',
						choices: allChoices,
					});

					if (selectedId.startsWith('__new__:')) {
						// Already tracked in newExternalsToCreate
						continue;
					}

					if (newExternalIds.includes(selectedId)) {
						console.log('⚠️  Already selected.');
					} else {
						newExternalIds.push(selectedId);
						const found = existingExternals.find((ep) => ep.id === selectedId);
						console.log(`   ✅ Added: ${found?.name ?? selectedId}`);
					}
				}
			}

			// Create new external participants if any
			if (newExternalsToCreate.length > 0) {
				for (const name of newExternalsToCreate) {
					const created = await prisma.externalParticipant.create({
						data: {
							name,
							createdById: entry.creatorId,
						},
					});
					newExternalIds.push(created.id);
					console.log(`   ✅ Created external participant: "${name}" (${created.id})`);
				}
			}
		}

		// ── 7. Show summary and confirm ────────────────────────
		const totalParticipants = newUserIds.length + newExternalIds.length;
		console.log(`\n📋 Summary of changes for table ${tableNumber}:`);
		console.log(`   Total participants: ${totalParticipants} (party size: ${partySize})`);

		if (totalParticipants !== partySize) {
			console.log(`   ⚠️  Participant count (${totalParticipants}) does not match party size (${partySize}).`);
		}

		// Show new platform users
		if (whatToChange === 'users' || whatToChange === 'both') {
			const allUsers = await prisma.user.findMany({
				where: { id: { in: newUserIds } },
				select: { id: true, name: true, email: true },
			});
			console.log(`   Platform users: ${allUsers.map((u) => `${u.name} (${u.email})`).join(', ') || '(none)'}`);
		}

		// Show new externals
		if (whatToChange === 'externals' || whatToChange === 'both') {
			const allExternals = await prisma.externalParticipant.findMany({
				where: { id: { in: newExternalIds } },
				select: { id: true, name: true },
			});
			console.log(`   External participants: ${allExternals.map((ep) => ep.name).join(', ') || '(none)'}`);
		}

		const doConfirm = await confirm({
			message: 'Apply these changes?',
			default: true,
		});

		if (!doConfirm) {
			console.log('Cancelled.');
			return;
		}

		// ── 8. Apply changes ───────────────────────────────────
		await prisma.entry.update({
			where: { id: entry.id },
			data: {
				...(whatToChange === 'users' || whatToChange === 'both'
					? { users: { set: newUserIds.map((id) => ({ id })) } }
					: {}),
				...(whatToChange === 'externals' || whatToChange === 'both'
					? { externalParticipants: { set: newExternalIds.map((id) => ({ id })) } }
					: {}),
			},
		});

		console.log(`\n🎉 Entry at table ${tableNumber} updated successfully!\n`);
	} finally {
		await prisma.$disconnect();
	}
}

main().catch((err) => {
	console.error('❌ Error:', err);
	process.exit(1);
});
