import { redirect, type Handle } from "@sveltejs/kit";
import { auth } from "$lib/auth"; // path to your auth file
import { svelteKitHandler } from "better-auth/svelte-kit";

// Auth handler
export async function handle({ event, resolve }) {
	return svelteKitHandler({ event, resolve, auth });
}

// Protected routes handler
const protectedRoutes: Handle = async ({ event, resolve }) => {
  // getting the session here?
  const locals = event.locals as Locals;
  const protectedPaths = [
    "/profile",
    "/competitions/create_competition"
  ];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path =>
    event.url.pathname.startsWith(path)
  );

  if (isProtectedPath && !locals.user) {
    throw redirect(303, "/login");
  }

  return await resolve(event);
};
