import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/auth";

/**
 * Layout server load function
 *
 * This function checks if the user is authenticated.
 * If not, it redirects to the login page.
 */
export const load: LayoutServerLoad = async ({ request }) => {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  /**
   * This is the important part.
   * If the user is not authenticated, redirect to the login page.
   */
  if (!session) {
    throw redirect(302, "/login");
  }

  /**
   * If the user is authenticated, let them through, and add the user to the page data.
   */
  console.log("(auth)/+layout.server.ts session", session);
  return {
    user: session.user,
  };
};
