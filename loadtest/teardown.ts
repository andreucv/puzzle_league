import 'dotenv/config';
import { createPrismaClient } from '../src/lib/database/create_prisma_client';
import type { PrismaClient } from '../src/lib/.prisma/generated/prisma/client';
import { loadConfig } from './config';

/**
 * Removes everything a load-test run created, keyed strictly by its runId.
 *
 * Seeded competition names end with ` <runId>` (ctx.unique) and seeded user emails contain
 * `-<runId>@` (createAuthUser). Deleting the competitions cascades categories → entries (and judge
 * assignments / external-participant links); deleting the users cascades their sessions, accounts,
 * role assignments, and the ExternalParticipant rows they created.
 */
export async function teardownByRunId(prisma: PrismaClient, runId: string): Promise<void> {
	if (!runId) throw new Error('teardownByRunId requires a non-empty runId');

	const competitions = await prisma.competition.deleteMany({
		where: { name: { contains: runId } }
	});
	const users = await prisma.user.deleteMany({
		where: { email: { contains: `-${runId}@` } }
	});

	console.log(
		`🧹 Teardown runId=${runId}: removed ${competitions.count} competitions, ${users.count} users`
	);
}

/** Standalone entrypoint: LOADTEST_RUN_ID=<runId> pnpm loadtest:teardown */
async function main(): Promise<void> {
	const config = loadConfig(); // applies the prod guard on baseUrl/databaseUrl
	const runId = process.env.LOADTEST_RUN_ID;
	if (!runId) throw new Error('LOADTEST_RUN_ID is not set');

	const prisma = createPrismaClient(config.databaseUrl);
	try {
		await teardownByRunId(prisma, runId);
	} finally {
		await prisma.$disconnect();
	}
}

// Run only when invoked directly (not when imported by run.ts).
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((err) => {
		console.error(err);
		process.exit(1);
	});
}
