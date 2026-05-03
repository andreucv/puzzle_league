import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { getPendingRequests, acceptRequest, rejectRequest } from '$lib/database/db_request';
import { getRoleAssignments } from '$lib/database/db_user';
import { auth } from '$lib/auth';
import { createNotification } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';

export const load: PageServerLoad = async ({ request }) => {
    try {
        // Get all pending requests with user information
        const pendingRequests = await getPendingRequests();

        return {
            pendingRequests: pendingRequests
        };
    } catch (err) {
        console.error('Error loading pending requests:', err);
        throw error(500, { message: 'Unable to load permission requests. Please try again later.', code: 'DB_ERROR' });
    }
};

export const actions: Actions = {
    accept: async ({ request }) => {
        // Get session using better-auth
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return fail(401, { error: 'Unauthorized' });
        }

        // Check admin permissions
        const userRoles = await getRoleAssignments(session.user.id);
        const isAdmin = userRoles?.some(role => role.role === 'ADMIN');

        if (!isAdmin) {
            return fail(403, { error: 'Forbidden - Admin access required' });
        }

        const data = await request.formData();
        const requestId = data.get('requestId')?.toString();

        if (!requestId) {
            return fail(400, { error: 'Request ID is required' });
        }

        try {
            const result = await acceptRequest(requestId, session.user.id);
            await createNotification({
                userId: result.updatedRequest.userId,
                type: NotificationType.ROLE_REQUEST_APPROVED,
                title: 'notifications.titles.role_request_approved',
                message: 'notifications.messages.role_request_approved',
                link: '/request_permissions',
                data: { roleName: result.updatedRequest.role },
            });
            return { success: true, message: 'Request approved successfully' };
        } catch (err) {
            console.error('Error accepting request:', err);
            return fail(500, { error: 'Unable to approve this request. Please try again.' });
        }
    },

    reject: async ({ request }) => {
        // Get session using better-auth
        const session = await auth.api.getSession({
            headers: request.headers,
        });

        if (!session) {
            return fail(401, { error: 'Unauthorized' });
        }

        // Check admin permissions
        const userRoles = await getRoleAssignments(session.user.id);
        const isAdmin = userRoles?.some(role => role.role === 'ADMIN');

        if (!isAdmin) {
            return fail(403, { error: 'Forbidden - Admin access required' });
        }

        const data = await request.formData();
        const requestId = data.get('requestId')?.toString();

        if (!requestId) {
            return fail(400, { error: 'Request ID is required' });
        }

        try {
            const result = await rejectRequest(requestId, session.user.id);
            await createNotification({
                userId: result.userId,
                type: NotificationType.ROLE_REQUEST_REJECTED,
                title: 'notifications.titles.role_request_rejected',
                message: 'notifications.messages.role_request_rejected',
                link: '/request_permissions',
                data: { roleName: result.role },
            });
            return { success: true, message: 'Request rejected successfully' };
        } catch (err) {
            console.error('Error rejecting request:', err);
            return fail(500, { error: 'Unable to reject this request. Please try again.' });
        }
    }
};
