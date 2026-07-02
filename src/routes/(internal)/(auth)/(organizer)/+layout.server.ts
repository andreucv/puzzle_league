import type { LayoutServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import { Role } from '$prisma/enums';

/**
 * Layout server load function
 *
 * This function checks if the user is authenticated and has the organizer or admin role.
 * Uses roleAssignments already fetched by the root layout (via parent()) to avoid
 * a duplicate DB query.
 */
export const load: LayoutServerLoad = async ({ parent }) => {
  const { user } = await parent();

  if (!user) {
    throw redirect(302, "/login");
  }

  const roleAssignments = user.roleAssignments;
  if (!roleAssignments) {
      throw error(403, { message: '', code: 'FORBIDDEN' });
  }

  // Allow global ORGANIZER or global ADMIN to access organizer routes
  const hasAccess = roleAssignments.some(
    assignment => assignment.role === Role.ORGANIZER || assignment.role === Role.ADMIN
  );
  if (!hasAccess) {
      throw error(403, { message: '', code: 'FORBIDDEN' });
  }

  return {
    user,
    roleAssignments
  };
};
