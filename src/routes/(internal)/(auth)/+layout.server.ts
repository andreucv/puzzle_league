import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import { getRoleAssignments } from "$lib/database";
/**
 * Layout server load function
 *
 * This function checks if the user is authenticated.
 * If not, it redirects to the login page.
 */
export const load: LayoutServerLoad = async ({ request }) => {
    let session = null;
    try {
        session = await auth.api.getSession({
            headers: request.headers,
        });
    } catch (error) {
        console.error('(auth) Error fetching session:', error);
    }

  /**
   * This is the important part.
   * If the user is not authenticated, redirect to the login page.
   */
  if (!session) {
    console.error('User not authenticated');
    throw redirect(302, "/login");
  }

  // Get here the user role assignments
  const roleAssignments = await getRoleAssignments(session.user.id);
  /**
   * If the user is authenticated, let them through, and add the user to the page data.
   */
  return {
    user: session.user,
    roleAssignments
  };
};
