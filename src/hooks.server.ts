import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import { prisma } from "$lib/database/create_prisma_client";
import { redirect } from "@sveltejs/kit";

// Track users who have been checked for claim redirect within this server lifecycle
const checkedUsers = new Set<string>();

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
					const matchCount = await prisma.userIntent.count({
						where: {
							claimedById: null
						}
					});

					if (matchCount > 0) {
						// Check with fuzzy name matching
						const unclaimed = await prisma.userIntent.findMany({
							where: { claimedById: null },
							select: { name: true }
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
		}
	}

	return svelteKitHandler({ event, resolve, auth, building });
}
