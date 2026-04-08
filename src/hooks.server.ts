import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { prisma } from "$lib/database/create_prisma_client";
import { redirect } from "@sveltejs/kit";
import { isPublicApiRoute } from "$lib/api_utils/api_whitelist";
import { validateOrigin } from "$lib/api_utils/api_csrf";
import { apiRateLimiter, searchRateLimiter, isSearchEndpoint } from "$lib/api_utils/rate-limit";
import { enforceRouteGuard } from "$lib/api_utils/api_route_guards";
import type { HandleServerError } from "@sveltejs/kit";

// TODO: consider relying on servers livecycle memory to track if user has been checked for redirects.
// Track users who have been checked for claim redirect within this server lifecycle
const checkedUsers = new Set<string>();
// Track users who have been checked for phone prompt redirect within this server lifecycle
const phonePromptCheckedUsers = new Set<string>();

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

		// First-login redirect to claim participations page
		const path = event.url.pathname;
		const isPageRequest = !path.startsWith('/api/') && !path.startsWith('/auth/');
		const isClaimPage = path === '/claim-participations';

		if (isPageRequest && !isClaimPage && !checkedUsers.has(session.user.id)) {
			checkedUsers.add(session.user.id);

			// Check if user was created recently (within last 5 minutes)
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
			if (new Date(session.user.createdAt) > fiveMinutesAgo) {
				// Check if there are unclaimed UserIntents matching this user's name
				const userName = session.user.name;
				if (userName) {
					// Single query: fetch only unclaimed intent names (avoids redundant count + findMany)
					const unclaimed = await prisma.userIntent.findMany({
						where: { claimedById: null },
						select: { name: true },
						take: 100
					});
					const userNameLower = userName.toLowerCase();
					const hasMatch = unclaimed.some(ui => {
						const intentNameLower = ui.name.toLowerCase();
						return intentNameLower.includes(userNameLower) || userNameLower.includes(intentNameLower);
					});

					if (hasMatch) {
						throw redirect(302, '/claim-participations');
					}
				}
			}
		}

		// Phone onboarding redirect — show once for users without phone data
		const isAddPhonePage = path === '/add-phone';
		if (isPageRequest && !isClaimPage && !isAddPhonePage && !phonePromptCheckedUsers.has(session.user.id)) {
			phonePromptCheckedUsers.add(session.user.id);
			if (!event.locals.user.phonePromptSeenAt && !event.locals.user.phoneNumber) {
				throw redirect(302, '/add-phone');
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
