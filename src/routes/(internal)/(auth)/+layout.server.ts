import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getRoleAssignments } from "$lib/database/database";
/**
 * Layout server load function
 *
 * This function checks if the user is authenticated.
 * If not, it redirects to the login page.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
  const user = locals.user;

  if (!user) {
    throw redirect(302, "/login");
  }

  const roleAssignments = await getRoleAssignments(user.id);

  return {
    user,
    roleAssignments
  };
};
