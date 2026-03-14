import { json, type RequestEvent } from '@sveltejs/kit';
import { getAuthUserId } from '$lib/api_utils/api_auth';
import { hasUnreadForUser } from '$lib/notifications/notifications';

/** GET – whether the current user has unread notifications */
export const GET = async (event: RequestEvent) => {
	const userId = getAuthUserId(event);

	try {
		const hasUnread = await hasUnreadForUser(userId);
		return json({ hasUnread });
	} catch (error) {
		console.error('Error checking unread notifications:', error);
		return json({ error: 'Failed to check unread notifications' }, { status: 500 });
	}
};
