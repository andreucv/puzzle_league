import { getSessionById, getUserById } from "$lib/database";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

// Auth handler
const handleAuth: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get("session");
  event.locals.user = undefined;

  try {
    if (sessionId) {
      // Get the session from our database
      const session = await getSessionById(sessionId);

      // Check if session exists and is not expired
      if (session && session.expiresAt > new Date()) {
        // Get the user data
        const user = await getUserById(session.userId);

        if (user) {
          event.locals.user = user;
        }
      } else if (session) {
        // Session exists but is expired, clean up by deleting the cookie
        event.cookies.delete("session", { path: "/" });
      }
    }
  } catch (error) {
    console.error("Error verifying session:", error);
    // Clear invalid session cookie
    event.cookies.delete("session", { path: "/" });
  }

  return await resolve(event);
};

// Protected routes handler
const protectedRoutes: Handle = async ({ event, resolve }) => {
  const protectedPaths = [
    "/profile",
    "/competitions/create_competition"
  ];

  // Check if the current path is protected
  const isProtectedPath = protectedPaths.some(path =>
    event.url.pathname.startsWith(path)
  );

  // If the path is protected and the user is not logged in, redirect to login
  if (isProtectedPath && !event.locals.user) {
    throw redirect(303, "/login");
  }

  return await resolve(event);
};

// Combine the handlers
export const handle = sequence(handleAuth, protectedRoutes);
