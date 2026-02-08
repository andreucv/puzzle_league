import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";

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
		console.log('Session found:', session);
	}

	return svelteKitHandler({ auth, event, resolve });
}
