import { auth } from "$lib/auth";
import type { PageServerLoad } from "./$types";
import { createRequest, getRequestsByUserId } from '$lib/database/db_request';
import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const load: PageServerLoad = async ({ request }) => {
    const session = await auth.api.getSession({
        headers: request.headers,
    });

    const rolesAvailable = Object.values(Role);
    const filteredRoles = rolesAvailable.filter(role => role !== Role.ADMIN && role !== Role.PARTICIPANT);

    if (!session?.user) {
        throw error(401, { message: 'You need to be signed in to request permissions.', code: 'AUTH_REQUIRED' });
    }

    const requests = await getRequestsByUserId(session.user.id);

    console.log('request_permissions/+page.server.ts requests', requests);
    console.log('request_permissions/+page.server.ts rolesAvailable', filteredRoles);

    return {
        props: {
            requests,
            filteredRoles
        }
    };
};

export const actions: Actions = {
    default: async ({ request }) => {
        try {
            const session = await auth.api.getSession({
                headers: request.headers,
            });

            const formData = await request.formData();
            console.log('request_permissions/+page.server.ts formData', formData);
            const userId = session?.user.id;
            const role = formData.get('role')?.toString();
            const reason = formData.get('reason')?.toString();
            const additionalInfo = formData.get('additionalInfo')?.toString() || '';

            if (!userId || !role || !reason) {
                return fail(400, {
                    missing: true,
                    error: 'Missing required fields'
                });
            }

            const roleRequest = await createRequest(userId, role, reason, additionalInfo);

            return {
                success: true,
                request: roleRequest
            };
        } catch (error) {
            console.error('Error processing request:', error);
            return fail(500, {
                error: 'Unable to submit your request. Please try again later.'
            });
        }
    }
};
