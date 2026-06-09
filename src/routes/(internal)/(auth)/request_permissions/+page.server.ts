import type { PageServerLoad } from "./$types";
import { createRequest, getRequestsByUserId } from '$lib/database/db_request';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import { error, fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { getPostHogClient } from '$lib/server/posthog';

export const load: PageServerLoad = async ({ locals }) => {
    const rolesAvailable = Object.values(Role);
    const filteredRoles = rolesAvailable.filter(role => role !== Role.ADMIN && role !== Role.PARTICIPANT && role !== Role.JUDGE);

    if (!locals.user) {
        throw error(401, { message: 'You need to be signed in to request permissions.', code: 'AUTH_REQUIRED' });
    }

    const requests = await getRequestsByUserId(locals.user.id);

    return {
        props: {
            requests,
            filteredRoles
        }
    };
};

export const actions: Actions = {
    default: async ({ locals, request }) => {
        try {
            if (!locals.user) {
                return fail(401, { error: 'User not authenticated' });
            }

            const formData = await request.formData();
            const userId = locals.user.id;
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

            const posthog = getPostHogClient();
            posthog.capture({
                distinctId: userId,
                event: 'permission_requested',
                properties: {
                    role
                }
            });

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
