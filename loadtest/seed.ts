import {
	createSeedContext,
	createCompetition,
	createEntries,
	createAuthUser,
	type SeedContext
} from '../e2e/seed_utils';
import type { LoadTestConfig } from './config';

/**
 * Per-competition seed output consumed by the orchestrator.
 */
export interface SeededLoadTestCompetition {
	competitionId: number;
	categoryId: number;
	/** Entries that will be FINISHED in phase 1. */
	finishEntryIds: string[];
	/** DNF entries that will get PIECE counts in phase 2. */
	pieceEntryIds: string[];
	/** Platform-user participants who will watch as authenticated viewers. */
	authViewers: { email: string; password: string }[];
	/** Judges assigned to the category. */
	judges: { email: string; password: string }[];
}

export interface SeededLoadTest {
	runId: string;
	organizer: { email: string; password: string };
	competitions: SeededLoadTestCompetition[];
}

const PASSWORD = 'loadtest-Passw0rd!';

/** Assigns a user as judge of a category (the join the route guard checks). */
async function assignJudge(ctx: SeedContext, userId: string, categoryId: number): Promise<void> {
	await ctx.prisma.categoryJudgeAssignment.create({ data: { userId, categoryId } });
}

/** Flips a seeded category to LIVE so finishes are accepted (finishes require LIVE). */
async function setCategoryLive(ctx: SeedContext, categoryId: number): Promise<void> {
	await ctx.prisma.category.update({ where: { id: categoryId }, data: { status: 'LIVE' } });
}

/**
 * Creates `count` external-participant CONFIRMED entries on a category.
 * Mirrors createEntries but connects ExternalParticipant rows instead of platform users.
 */
async function createExternalParticipantEntries(
	ctx: SeedContext,
	categoryId: number,
	creatorId: string,
	count: number
): Promise<string[]> {
	const ids: string[] = [];
	for (let i = 0; i < count; i++) {
		const entry = await ctx.prisma.entry.create({
			data: {
				categoryId,
				creatorId,
				status: 'CONFIRMED',
				externalParticipants: {
					create: { name: ctx.unique(`Ext ${i + 1}`), createdById: creatorId }
				}
			}
		});
		ids.push(entry.id);
	}
	return ids;
}

function shuffleSplit<T>(items: T[], firstShare: number): [T[], T[]] {
	const cut = Math.round(items.length * firstShare);
	return [items.slice(0, cut), items.slice(cut)];
}

/**
 * Seeds the full load-test fixture: a dedicated runId-scoped organizer plus N competitions,
 * each LIVE with ~50 CONFIRMED entries (half platform users / half external) and judges.
 */
export async function seedLoadTest(config: LoadTestConfig): Promise<SeededLoadTest> {
	const ctx = await createSeedContext(config.databaseUrl);

	// Dedicated organizer for this run — creator of every competition and the stop-caller.
	const organizer = await createAuthUser(ctx, {
		name: 'LoadTest Organizer',
		email: 'loadtest-organizer@test.local',
		password: PASSWORD,
		role: 'ORGANIZER'
	});

	const now = new Date();
	const startTime = new Date(now);
	startTime.setHours(now.getHours() - 1);
	const endTime = new Date(now);
	endTime.setHours(now.getHours() + 4);

	const platformCount = Math.floor(config.participantsPerCompetition / 2);
	const externalCount = config.participantsPerCompetition - platformCount;

	const competitions: SeededLoadTestCompetition[] = [];

	for (let c = 0; c < config.competitions; c++) {
		const competition = await createCompetition(ctx, {
			name: `LoadTest Competition ${c + 1}`,
			description: 'Live-competition load test',
			location: 'Load Test Arena',
			country: 'ES',
			postalCode: '08001',
			startDate: now,
			endDate: now,
			creatorId: organizer.id,
			categories: [
				{
					description: '500 pcs Individual',
					type: 'INDIVIDUAL',
					maxPartySize: 1,
					maxParties: config.participantsPerCompetition,
					startTime,
					endTime
				}
			]
		});
		const categoryId = competition.categories[0].id;
		await setCategoryLive(ctx, categoryId);

		// Platform-user participants — each its own auth user + a CONFIRMED entry.
		const authViewers: { email: string; password: string }[] = [];
		const platformEntryInputs = [];
		for (let p = 0; p < platformCount; p++) {
			const user = await createAuthUser(ctx, {
				name: `LT C${c + 1} Player ${p + 1}`,
				email: `loadtest-c${c + 1}-player-${p + 1}@test.local`,
				password: PASSWORD
			});
			authViewers.push({ email: user.email, password: user.password });
			platformEntryInputs.push({
				categoryId,
				creatorId: user.id,
				userIds: [user.id],
				status: 'CONFIRMED' as const
			});
		}
		const platformEntries = await createEntries(ctx, platformEntryInputs);

		// External participants — CONFIRMED entries with ExternalParticipant rows, no accounts.
		const externalEntryIds = await createExternalParticipantEntries(
			ctx,
			categoryId,
			organizer.id,
			externalCount
		);

		// Judges — assigned to the category so they pass the result/pieces guard.
		const judges: { email: string; password: string }[] = [];
		for (let j = 0; j < config.judgesPerCompetition; j++) {
			const judge = await createAuthUser(ctx, {
				name: `LT C${c + 1} Judge ${j + 1}`,
				email: `loadtest-c${c + 1}-judge-${j + 1}@test.local`,
				password: PASSWORD
			});
			await assignJudge(ctx, judge.id, categoryId);
			judges.push({ email: judge.email, password: judge.password });
		}

		// Split all entries into the phase-1 (finish) and phase-2 (DNF/pieces) sets.
		const allEntryIds = [...platformEntries.map((e) => e.id), ...externalEntryIds];
		const [finishEntryIds, pieceEntryIds] = shuffleSplit(allEntryIds, config.finishShare);

		competitions.push({
			competitionId: competition.id,
			categoryId,
			finishEntryIds,
			pieceEntryIds,
			authViewers,
			judges
		});
	}

	return {
		runId: ctx.runId,
		organizer: { email: organizer.email, password: organizer.password },
		competitions
	};
}
