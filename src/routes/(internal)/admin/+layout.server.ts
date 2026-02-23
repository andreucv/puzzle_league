import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { auth } from "$lib/auth";
import { getRoleAssignments } from "$lib/database/database";
import { Role } from '$lib/.prisma/generated/prisma/enums';

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
        console.error('(admin) Error fetching session:', error);
    }

    /**
     * This is the important part.
     * If the user is not authenticated, redirect to the login page.
     */
    if (!session) {
        throw redirect(302, "/login");
    }

    // Get here the user role assignments
    const roleAssignments = await getRoleAssignments(session.user.id);
    if (!roleAssignments) {
        throw redirect(302, "/error/no_permission/");
    }
    // Check if user has admin role
    const hasAdminRole = roleAssignments.some(assignment => assignment.role === Role.ADMIN);
    if (!hasAdminRole) {
        throw redirect(302, "/error/no_permission/");
    }
    /**
     * If the user is authenticated, let them through, and add the user to the page data.
     */
    return {
        user: session.user,
        roleAssignments
    };
};
