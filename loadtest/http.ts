import { metrics } from './metrics';

/**
 * HTTP/auth client for the load test. Talks to LOADTEST_BASE_URL.
 *
 * Every mutating /api/ call sends an Origin header matching the target so it passes the app's
 * CSRF check (validateOrigin in hooks.server.ts). Responses are timed and recorded into metrics;
 * 429s are retried with Retry-After backoff.
 */

const MAX_RETRIES = 6;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface HttpClient {
	baseUrl: string;
	origin: string;
}

/**
 * A mutable cookie store that behaves like a browser's: it starts from the sign-in response and
 * absorbs every subsequent `Set-Cookie`, so the rotated Better Auth cookie-cache cookie (refreshed
 * roughly every `maxAge`, 5 min) actually gets sent on later requests. Without this, a static
 * sign-in snapshot expires after maxAge and every authenticated request then falls through to a
 * real DB session validation — inflating the "uncached" query count and not reflecting real users.
 */
export class CookieJar {
	private cookies = new Map<string, string>();

	/** Merge any `Set-Cookie` headers from a response, overwriting same-named cookies. */
	update(res: Response): void {
		const setCookies = res.headers.getSetCookie?.() ?? [];
		for (const raw of setCookies) {
			const pair = raw.split(';')[0];
			const eq = pair.indexOf('=');
			if (eq === -1) continue;
			const name = pair.slice(0, eq).trim();
			const value = pair.slice(eq + 1).trim();
			// An empty value is the server clearing the cookie (e.g. on expiry/sign-out).
			if (value === '') this.cookies.delete(name);
			else this.cookies.set(name, value);
		}
	}

	/** Serialize to a `Cookie` request-header value. */
	header(): string {
		return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
	}

	get size(): number {
		return this.cookies.size;
	}
}

// ── Sign-in pacing ───────────────────────────────────────────────────────────
// Every sign-in originates from this one machine, so they all land in the same
// IP-keyed bucket of Better Auth's built-in rate limiter (enabled by default on a
// production build). Reserve a spaced time-slot per sign-in so the auth phase
// trickles under the limiter instead of bursting into 429s. Independent of caller
// concurrency. Tunable via LOADTEST_SIGNIN_SPACING_MS (default 800ms ≈ 75/min).
const SIGNIN_SPACING_MS = Math.max(0, Number(process.env.LOADTEST_SIGNIN_SPACING_MS ?? 800));
let nextSignInSlotAt = 0;

/** Resolves when this caller's spaced sign-in slot arrives. */
function acquireSignInSlot(): Promise<void> {
	const now = Date.now();
	const at = Math.max(now, nextSignInSlotAt);
	nextSignInSlotAt = at + SIGNIN_SPACING_MS;
	const wait = at - now;
	return wait > 0 ? sleep(wait) : Promise.resolve();
}

/**
 * Performs a timed request with 429-aware backoff, recording each attempt into metrics. When a
 * `jar` is given, any `Set-Cookie` on the final response is merged back into it, so rotated session
 * cookies are reused on subsequent requests (browser-like behavior).
 */
async function timedFetch(
	client: HttpClient,
	label: string,
	path: string,
	init: RequestInit = {},
	jar?: CookieJar
): Promise<Response> {
	const url = path.startsWith('http') ? path : `${client.baseUrl}${path}`;
	let attempt = 0;

	while (true) {
		const start = performance.now();
		let res: Response;
		try {
			res = await fetch(url, init);
		} catch (err) {
			metrics.record(label, 0, performance.now() - start);
			throw err;
		}
		const ms = performance.now() - start;
		metrics.record(label, res.status, ms);

		if (res.status === 429 && attempt < MAX_RETRIES) {
			// Better Auth sends `X-Retry-After` (seconds); the app limiter / proxies use the standard
			// `Retry-After`. Honor whichever is present, else back off exponentially. Jitter keeps a
			// herd of waiters from re-synchronizing onto the same retry instant.
			const headerSec = Number(res.headers.get('Retry-After') ?? res.headers.get('X-Retry-After'));
			const baseMs = Number.isFinite(headerSec) && headerSec > 0 ? headerSec * 1000 : 1000 * 2 ** attempt;
			await sleep(baseMs + Math.random() * 250);
			attempt++;
			continue;
		}
		jar?.update(res);
		return res;
	}
}

/**
 * Signs in via Better Auth and returns a CookieJar to reuse on subsequent requests. The jar keeps
 * absorbing rotated cookies as it is threaded through later calls.
 *
 * `/api/auth/*` is allowlisted, so it bypasses the app's CSRF/auth/apiRateLimiter pipeline — but
 * Better Auth's own built-in limiter still applies (IP-keyed). Sign-ins are paced via
 * acquireSignInSlot() and 429s are retried honoring `X-Retry-After`, so the auth phase self-throttles.
 */
export async function signIn(
	client: HttpClient,
	email: string,
	password: string
): Promise<CookieJar> {
	await acquireSignInSlot();
	const jar = new CookieJar();
	const res = await timedFetch(
		client,
		'signin',
		'/api/auth/sign-in/email',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Origin: client.origin },
			body: JSON.stringify({ email, password })
		},
		jar
	);
	if (!res.ok) {
		throw new Error(`Sign-in failed for ${email}: ${res.status} ${await res.text()}`);
	}
	if (jar.size === 0) throw new Error(`Sign-in for ${email} returned no session cookie`);
	return jar;
}

/** Fetches a raw Ably JWT from the given token endpoint (cookie optional for the public one). */
export async function fetchAblyToken(
	client: HttpClient,
	competitionId: number,
	opts: { cookie?: CookieJar } = {}
): Promise<string> {
	const path = opts.cookie
		? `/api/ably-token?competitionId=${competitionId}`
		: `/api/ably-token/public?competitionId=${competitionId}`;
	const headers: Record<string, string> = {};
	if (opts.cookie) headers.Cookie = opts.cookie.header();
	const res = await timedFetch(client, 'token', path, { headers }, opts.cookie);
	if (!res.ok) throw new Error(`Token fetch failed (${path}): ${res.status}`);
	return res.text();
}

export async function recordFinish(
	client: HttpClient,
	cookie: CookieJar,
	entryId: string,
	finishTime: string,
	tableNumber: number
): Promise<void> {
	await timedFetch(
		client,
		'finish',
		`/api/entries/${entryId}/result`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Origin: client.origin, Cookie: cookie.header() },
			body: JSON.stringify({ finishTime, tableNumber })
		},
		cookie
	);
}

export async function recordPieces(
	client: HttpClient,
	cookie: CookieJar,
	entryId: string,
	nPiecesCompleted: number
): Promise<void> {
	await timedFetch(
		client,
		'pieces',
		`/api/entries/${entryId}/pieces`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Origin: client.origin, Cookie: cookie.header() },
			body: JSON.stringify({ nPiecesCompleted })
		},
		cookie
	);
}

export async function stopCategory(
	client: HttpClient,
	cookie: CookieJar,
	categoryId: number
): Promise<void> {
	const res = await timedFetch(
		client,
		'stop',
		`/api/categories/${categoryId}/stop`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Origin: client.origin, Cookie: cookie.header() }
		},
		cookie
	);
	if (!res.ok) {
		throw new Error(`Stop category ${categoryId} failed: ${res.status} ${await res.text()}`);
	}
}

/**
 * Reproduces the SvelteKit invalidateAll() re-query of the results page by fetching its data
 * endpoint. This re-runs the server load (getCompetitionResults). Not under /api/, so unthrottled.
 */
export async function refetchResults(
	client: HttpClient,
	competitionId: number,
	opts: { cookie?: CookieJar } = {}
): Promise<void> {
	const path = `/competitions/competition_details/${competitionId}/results/__data.json`;
	const headers: Record<string, string> = {};
	if (opts.cookie) headers.Cookie = opts.cookie.header();
	await timedFetch(client, 'refetch', path, { headers }, opts.cookie);
}
