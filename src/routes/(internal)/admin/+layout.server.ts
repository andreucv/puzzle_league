import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { getRoleAssignments } from "$lib/database/db_user";
import { Role } from '$lib/.prisma/generated/prisma/enums';

/**
 * Layout server load function
 *
 * This function checks if the user is authenticated and has the admin role.
 * If not, it redirects appropriately.
 */
export const load: LayoutServerLoad = async ({ locals }) => {
    const user = locals.user;

    if (!user) {
        throw redirect(302, "/login");
    }

    const roleAssignments = await getRoleAssignments(user.id);
    if (!roleAssignments) {
        throw redirect(302, "/error/no_permission/");
    }

    const hasAdminRole = roleAssignments.some(assignment => assignment.role === Role.ADMIN);
    if (!hasAdminRole) {
        throw redirect(302, "/error/no_permission/");
    }

    return {
        user,
        roleAssignments
    };
};
