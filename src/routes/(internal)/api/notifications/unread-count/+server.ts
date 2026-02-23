import { json, type RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/utils/api_auth';
import { hasUnreadForUser } from '$lib/notifications/notifications';

/** GET – whether the current user has unread notifications */
export const GET = async (event: RequestEvent) => {
	const auth = await requireAuth(event);
	if (!auth.authorized) return auth.response;

	try {
		const hasUnread = await hasUnreadForUser(auth.userId);
		return json({ hasUnread });
	} catch (error) {
		console.error('Error checking unread notifications:', error);
		return json({ error: 'Failed to check unread notifications' }, { status: 500 });
	}
};
