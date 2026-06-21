import 'dotenv/config';

/**
 * Load-test configuration, env-driven with sensible defaults.
 *
 * The program runs locally and connects to a chosen target:
 *  - LOADTEST_BASE_URL — the app origin under test (local dev or remote testing server)
 *  - DATABASE_URL      — the SAME database that target uses (for seeding/teardown via Prisma)
 *
 * See docs/features/live-competition-loadtest/03-design.md (§2) for the rationale.
 */
export interface LoadTestConfig {
	baseUrl: string;
	databaseUrl: string;
	/** Number of simultaneously-live competitions. */
	competitions: number;
	/** Participants per competition (split 50/50 platform users / external). */
	participantsPerCompetition: number;
	/** Judges per competition (each its own identity for rate-limit headroom). */
	judgesPerCompetition: number;
	/** Fraction of entries that get a finish time in phase 1; the rest are DNF (phase 2). */
	finishShare: number;
	/** Phase-1 cadence ramp: interval between finishes across the field, start → end (ms). */
	finishRampStartMs: number;
	finishRampEndMs: number;
	/** Phase-2 piece-marking rate per category. */
	piecesPerMinute: number;
	/** Hard ceiling on total run time (seconds), as a safety net for draining. */
	maxRunSeconds: number;
	/** SLO thresholds; the run exits non-zero if any is breached. */
	slo: {
		readP95Ms: number;
		writeP95Ms: number;
		errorRate: number;
	};
	/** Explicit acknowledgement required to run against a production-looking target. */
	allowProd: boolean;
}

function num(envVar: string, fallback: number): number {
	const raw = process.env[envVar];
	if (raw === undefined || raw.trim() === '') return fallback;
	const parsed = Number(raw);
	if (Number.isNaN(parsed)) throw new Error(`${envVar} must be a number, got: ${raw}`);
	return parsed;
}

/** Heuristic: refuse to touch anything that looks like production unless explicitly allowed. */
const PROD_MARKERS = ['puzzleleague', 'prod', 'production'];

function looksProd(value: string): boolean {
	const v = value.toLowerCase();
	// Allow obvious non-prod targets through even if they contain a marker substring.
	if (v.includes('localhost') || v.includes('127.0.0.1') || v.includes('preview') || v.includes('staging')) {
		return false;
	}
	return PROD_MARKERS.some((m) => v.includes(m));
}

export function loadConfig(): LoadTestConfig {
	const baseUrl = process.env.LOADTEST_BASE_URL;
	if (!baseUrl) throw new Error('LOADTEST_BASE_URL is not set (e.g. http://localhost:5173)');

	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) throw new Error('DATABASE_URL is not set');

	const allowProd = process.env.LOADTEST_ALLOW_PROD === 'true';
	if (!allowProd && (looksProd(baseUrl) || looksProd(databaseUrl))) {
		throw new Error(
			'Target looks like production. Refusing to run. ' +
				'Set LOADTEST_ALLOW_PROD=true only if you are absolutely sure.'
		);
	}

	return {
		baseUrl: baseUrl.replace(/\/$/, ''),
		databaseUrl,
		competitions: num('LOADTEST_COMPETITIONS', 3),
		participantsPerCompetition: num('LOADTEST_PARTICIPANTS', 50),
		judgesPerCompetition: num('LOADTEST_JUDGES', 3),
		finishShare: num('LOADTEST_FINISH_SHARE', 0.75),
		finishRampStartMs: num('LOADTEST_FINISH_RAMP_START_MS', 8000),
		finishRampEndMs: num('LOADTEST_FINISH_RAMP_END_MS', 800),
		piecesPerMinute: num('LOADTEST_PIECES_PER_MINUTE', 5),
		maxRunSeconds: num('LOADTEST_MAX_RUN_SECONDS', 600),
		slo: {
			readP95Ms: num('LOADTEST_SLO_READ_P95_MS', 800),
			writeP95Ms: num('LOADTEST_SLO_WRITE_P95_MS', 1000),
			errorRate: num('LOADTEST_SLO_ERROR_RATE', 0.01)
		},
		allowProd
	};
}

/** The origin (scheme://host[:port]) of the target, for the CSRF Origin header. */
export function originOf(baseUrl: string): string {
	return new URL(baseUrl).origin;
}
