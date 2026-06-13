import type { LayoutServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import { Role } from '$lib/.prisma/generated/prisma/enums';

/**
 * Layout server load function
 *
 * This function checks if the user is authenticated and has the admin role.
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

    const hasAdminRole = roleAssignments.some(assignment => assignment.role === Role.ADMIN);
    if (!hasAdminRole) {
        throw error(403, { message: '', code: 'FORBIDDEN' });
    }

    return {
        user,
        roleAssignments
    };
};
