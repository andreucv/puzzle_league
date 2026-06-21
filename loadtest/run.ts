import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createPrismaClient } from '../src/lib/database/create_prisma_client';
import { loadConfig, originOf, type LoadTestConfig } from './config';
import { metrics } from './metrics';
import { seedLoadTest, type SeededLoadTest } from './seed';
import { teardownByRunId } from './teardown';
import { signIn, stopCategory, type HttpClient } from './http';
import { createJudge, type Judge } from './actors/judge';
import { startViewer, type Viewer } from './actors/viewer';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Runs `fn` over `items` with bounded concurrency (used to avoid a startup thundering herd). */
async function mapPool<T, R>(items: T[], concurrency: number, fn: (item: T) => Promise<R>): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let cursor = 0;
	const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
		while (cursor < items.length) {
			const i = cursor++;
			results[i] = await fn(items[i]);
		}
	});
	await Promise.all(workers);
	return results;
}

interface CompetitionRuntime {
	categoryId: number;
	competitionId: number;
	finishEntryIds: string[];
	pieceEntryIds: string[];
	judges: Judge[];
}

async function main(): Promise<void> {
	const config = loadConfig();
	const client: HttpClient = { baseUrl: config.baseUrl, origin: originOf(config.baseUrl) };
	console.log(`🎯 Target: ${client.baseUrl} (origin ${client.origin})`);

	// ── Seed ───────────────────────────────────────────────────────────────
	metrics.setPhase('setup');
	console.log('🌱 Seeding…');
	const seeded: SeededLoadTest = await seedLoadTest(config);
	console.log(`   runId=${seeded.runId}, ${seeded.competitions.length} competitions`);

	const viewers: Viewer[] = [];
	let exitCode = 0;
	const prisma = createPrismaClient(config.databaseUrl);

	try {
		// ── Sign in judges + organizer, build per-competition runtimes ─────────
		const organizerCookie = await signIn(client, seeded.organizer.email, seeded.organizer.password);

		const runtimes: CompetitionRuntime[] = await mapPool(seeded.competitions, 3, async (comp) => {
			const judges = await mapPool(comp.judges, 3, (j) => createJudge(client, j.email, j.password));
			return {
				categoryId: comp.categoryId,
				competitionId: comp.competitionId,
				finishEntryIds: comp.finishEntryIds,
				pieceEntryIds: comp.pieceEntryIds,
				judges
			};
		});

		// ── Start viewers (authenticated platform users + anonymous external) ──
		console.log('👀 Starting viewers…');
		const externalPerCompetition =
			config.participantsPerCompetition - Math.floor(config.participantsPerCompetition / 2);

		for (const comp of seeded.competitions) {
			await mapPool(comp.authViewers, 8, async (v) => {
				const cookie = await signIn(client, v.email, v.password);
				viewers.push(await startViewer(client, comp.competitionId, { cookie }));
			});
			const externals = Array.from({ length: externalPerCompetition }, (_, i) => i);
			await mapPool(externals, 8, async () => {
				viewers.push(await startViewer(client, comp.competitionId));
			});
		}
		console.log(`   ${viewers.length} viewers connected`);

		// Hard watchdog so an unresponsive target can't hang the run forever.
		const watchdog = setTimeout(() => {
			console.error(`⏱️  Max run time (${config.maxRunSeconds}s) exceeded — forcing teardown.`);
		}, config.maxRunSeconds * 1000);
		watchdog.unref?.();

		// ── Phase 1: accelerating finishes on ~75% of entries ──────────────────
		metrics.setPhase('phase1-finishes');
		console.log('🏁 Phase 1: finishes…');
		const writes: Promise<unknown>[] = [];
		await Promise.all(
			runtimes.map(async (rt) => {
				const n = rt.finishEntryIds.length;
				for (let i = 0; i < n; i++) {
					const interval = lerp(config.finishRampStartMs, config.finishRampEndMs, n > 1 ? i / (n - 1) : 1);
					await sleep(interval);
					const judge = rt.judges[i % rt.judges.length];
					writes.push(judge.finish(rt.finishEntryIds[i]).catch((e) => console.error('finish error', e)));
				}
			})
		);
		await Promise.all(writes);

		// ── Transition: organizer stops each category (LIVE → STOPPED) ─────────
		metrics.setPhase('transition');
		console.log('⏹️  Stopping categories…');
		await Promise.all(runtimes.map((rt) => stopCategory(client, organizerCookie, rt.categoryId)));

		// ── Phase 2: piece counts on the remaining DNF entries ─────────────────
		metrics.setPhase('phase2-pieces');
		console.log('🧩 Phase 2: piece counts…');
		const pieceInterval = 60_000 / config.piecesPerMinute;
		const pieceWrites: Promise<unknown>[] = [];
		await Promise.all(
			runtimes.map(async (rt) => {
				for (let i = 0; i < rt.pieceEntryIds.length; i++) {
					await sleep(pieceInterval);
					const judge = rt.judges[i % rt.judges.length];
					pieceWrites.push(judge.pieces(rt.pieceEntryIds[i]).catch((e) => console.error('pieces error', e)));
				}
			})
		);
		await Promise.all(pieceWrites);

		// ── Drain: let trailing events reach viewers and re-fetch ──────────────
		metrics.setPhase('drain');
		console.log('💧 Draining trailing events…');
		await sleep(5000);
		clearTimeout(watchdog);
	} finally {
		await Promise.all(viewers.map((v) => v.stop().catch(() => {})));
		await teardownByRunId(prisma, seeded.runId).catch((e) => console.error('teardown error', e));
		await prisma.$disconnect();
	}

	// ── Report ───────────────────────────────────────────────────────────────
	metrics.printSummary();
	const resultsDir = join(process.cwd(), 'loadtest', 'results');
	await mkdir(resultsDir, { recursive: true });
	const artifact = join(resultsDir, `${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
	await writeFile(artifact, JSON.stringify({ config: redact(config), ...metrics.toJSON() }, null, 2));
	console.log(`📄 Wrote ${artifact}`);

	// ── SLO gate ───────────────────────────────────────────────────────────────
	const breaches: string[] = [];
	if (metrics.readP95() > config.slo.readP95Ms) breaches.push(`read p95 ${metrics.readP95()}ms > ${config.slo.readP95Ms}ms`);
	if (metrics.writeP95() > config.slo.writeP95Ms) breaches.push(`write p95 ${metrics.writeP95()}ms > ${config.slo.writeP95Ms}ms`);
	if (metrics.errorRate() > config.slo.errorRate) breaches.push(`error rate ${(metrics.errorRate() * 100).toFixed(2)}% > ${(config.slo.errorRate * 100).toFixed(2)}%`);
	if (metrics.rateLimited > 0) breaches.push(`${metrics.rateLimited} unexpected 429s`);

	if (breaches.length > 0) {
		console.error('❌ SLO breaches:\n  - ' + breaches.join('\n  - '));
		exitCode = 1;
	} else {
		console.log('✅ All SLOs met.');
	}
	process.exit(exitCode);
}

function redact(config: LoadTestConfig): object {
	const { databaseUrl: _db, ...rest } = config;
	return rest;
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
