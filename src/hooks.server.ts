import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";

// Auth handler
export async function handle({ event, resolve }) {
	return svelteKitHandler({ auth, event, resolve});
}
