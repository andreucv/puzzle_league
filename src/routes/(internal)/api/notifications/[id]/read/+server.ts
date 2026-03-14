import { json, type RequestEvent } from '@sveltejs/kit';
import { getAuthUserId } from '$lib/api_utils/api_auth';
import { markNotificationAsRead } from '$lib/notifications/notifications';

/** POST – mark a single notification as read */
export const POST = async (event: RequestEvent) => {
	const userId = getAuthUserId(event);

	const notificationId = event.params.id as string;
	if (!notificationId) {
		return json({ error: 'Invalid notification ID' }, { status: 400 });
	}

	try {
		await markNotificationAsRead(notificationId, userId);
		return json({ success: true });
	} catch (error) {
		console.error('Error marking notification as read:', error);
		return json({ error: 'Failed to mark notification as read' }, { status: 500 });
	}
};
