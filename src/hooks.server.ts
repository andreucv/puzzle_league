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

/** Returns true for navigable page requests (not API or auth endpoints). */
function isPageRequest(path: string): boolean {
	return !path.startsWith('/api/') && !path.startsWith('/auth/');
}

// Auth handler
export async function handle({ event, resolve }) {
	// Fetch current session from Better Auth
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

		console.log(`Handling request for ${path} (user: ${session.user.email})`);

		if (isPageRequest(path) && path !== '/onboarding' && path !== '/verify-email' && path !== '/forgot-password' && path !== '/reset-password') {
			const alreadyPresented = (event.cookies.get('onboarding_presented') === event.locals.session.id);
			if (!alreadyPresented) {
				console.log('User has not completed onboarding, redirecting to onboarding page');
				throw redirect(302, '/onboarding');
			}
		}
	}

	// -----------------------------------------------------------------------
	// API Security Pipeline — runs for all /api/ routes
	// -----------------------------------------------------------------------
	const pathname = event.url.pathname;

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
