import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getRoleAssignments } from "$lib/database/database";
/**
 * Layout server load function
 *
 * This function checks if the user is authenticated.
 * If not, it redirects to the login page.
 */
export const load: LayoutServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, "/login");
  }

  return {
    user,
  };
};
