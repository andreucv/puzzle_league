import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { redirect } from "@sveltejs/kit";
import { isPublicApiRoute } from "$lib/api_utils/api_whitelist";
import { validateOrigin } from "$lib/api_utils/api_csrf";
import { apiRateLimiter, searchRateLimiter, isSearchEndpoint } from "$lib/api_utils/rate-limit";
import { enforceRouteGuard } from "$lib/api_utils/api_route_guards";
import { resolveOnboardingSteps } from "$lib/utils/onboarding_utils";
import type { HandleServerError } from "@sveltejs/kit";
import { getPostHogClient } from "$lib/server/posthog";
import { PUBLIC_POSTHOG_HOST } from "$env/static/public";
import { env } from "$env/dynamic/private";

// Derive proxy hostnames from PUBLIC_POSTHOG_HOST (e.g. "https://us.i.posthog.com")
const posthogHost = new URL(PUBLIC_POSTHOG_HOST).hostname;                      // "us.i.posthog.com"
const posthogAssetHost = posthogHost.replace(/^(\w+)\.i\./, '$1-assets.i.');    // "us-assets.i.posthog.com"

/** Returns true for navigable page requests (not API or auth endpoints). */
function isPageRequest(path: string): boolean {
	return !path.startsWith('/api/') && !path.startsWith('/auth/');
}

// Auth handler
export async function handle({ event, resolve }) {
	// PostHog reverse proxy — route /ingest/* to PostHog servers
	const { pathname } = event.url;
	if (pathname.startsWith('/ingest')) {
		const useAssetHost = pathname.startsWith('/ingest/static/') || pathname.startsWith('/ingest/array/');
		const hostname = useAssetHost ? posthogAssetHost : posthogHost;

		const url = new URL(event.request.url);
		url.protocol = 'https:';
		url.hostname = hostname;
		url.port = '443';
		url.pathname = pathname.replace(/^\/ingest/, '');

		const headers = new Headers(event.request.headers);
		headers.set('host', hostname);
		headers.set('accept-encoding', '');

		const clientIp = event.request.headers.get('x-forwarded-for') || event.getClientAddress();
		if (clientIp) {
			headers.set('x-forwarded-for', clientIp);
		}

		// Read body upfront — forwarding the raw ReadableStream hangs in Vite's dev server
		const body = event.request.body ? await event.request.arrayBuffer() : null;

		const response = await fetch(url.toString(), {
			method: event.request.method,
			headers,
			body
		});

		return response;
	}

	// Fetch current session from Better Auth
	// cookieCache enabled in auth.ts
	const session = await auth.api.getSession({
		headers: event.request.headers,
	});
	// Make session and user available on server
	if (session) {
		event.locals.session = session.session as typeof event.locals.session;
		event.locals.user = session.user;

		// Onboarding redirect — send users to unified wizard if any step is incomplete.
		// If the user has already been presented onboarding (cookie set) and navigates
		// away, we let them through — all steps are optional/skippable.
		const path = event.url.pathname;

		if (isPageRequest(path) && path !== '/onboarding' && path !== '/verify-email' && path !== '/forgot-password' && path !== '/reset-password') {
			const alreadyPresented = (event.cookies.get('onboarding_presented') === event.locals.session.id);
			if (!alreadyPresented) {
				console.log('User has not completed onboarding, redirecting to onboarding page');
				throw redirect(302, '/onboarding');
			}
		}
	}

	// Verbose request logging — enable by setting DEBUG_REQUEST_LOG=true in the
	// environment (e.g. Railway vars). Off by default; no commit needed to toggle.
	if (env.DEBUG_REQUEST_LOG === 'true') {
		console.log(
			"hooks.server.ts: handling request to", pathname,
			"| user:", event.locals.user?.id ?? 'undefined',
			"| ip:", event.getClientAddress(),
			"| ua:", event.request.headers.get('user-agent'),
			"| referer:", event.request.headers.get('referer'),
			"| has-cookie:", event.request.headers.has('cookie')
		);
	}

	// -----------------------------------------------------------------------
	// API Security Pipeline — runs for all /api/ routes
	// -----------------------------------------------------------------------

	if (pathname.startsWith('/api/') && !isPublicApiRoute(pathname)) {
		// 1. CSRF: reject cross-origin mutating requests
		const csrfError = validateOrigin(event);
		if (csrfError) return csrfError;

		// 2. Authentication: require a valid session
		if (!event.locals.user) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// 3. Rate limiting: stricter for search, general for everything else
		const rateLimitResponse = isSearchEndpoint(pathname)
			? await searchRateLimiter(event)
			: await apiRateLimiter(event);
		if (rateLimitResponse) return rateLimitResponse;

		// 4. Role-based authorization: check route-specific guards
		const guardResponse = await enforceRouteGuard(event);
		if (guardResponse) return guardResponse;
	}

	return svelteKitHandler({ event, resolve, auth, building });
}

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	console.error(`[${event.route.id}] Unhandled error (${status}):`, error);

	const posthog = getPostHogClient();
	const distinctId = event.locals.user?.id ?? 'server';
	posthog.capture({
		distinctId,
		event: 'server_error',
		properties: {
			error: error instanceof Error ? error.message : String(error),
			status,
			route: event.route.id
		}
	});

	// Map known error types to error codes
	let code: App.Error['code'] = 'UNKNOWN';
	if (error instanceof Error) {
		const name = error.constructor.name;
		if (name.includes('Prisma') || name.includes('Database')) {
			code = 'DB_ERROR';
		}
	}
	if (status === 401) code = 'AUTH_REQUIRED';
	if (status === 403) code = 'FORBIDDEN';
	if (status === 404) code = 'NOT_FOUND';

	return {
		message: message || 'An unexpected error occurred.',
		code,
	};
};
