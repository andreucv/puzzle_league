import { json, type RequestEvent } from '@sveltejs/kit';
import { getAuthUserId } from '$lib/api_utils/api_auth';
import {
	getNotificationsForUser,
	markAllNotificationsAsRead,
} from '$lib/notifications/notifications';

/** GET – fetch all notifications for the current user */
export const GET = async (event: RequestEvent) => {
	const userId = getAuthUserId(event);

	try {
		const notifications = await getNotificationsForUser(userId);
		return json({ notifications });
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return json({ error: 'Failed to fetch notifications' }, { status: 500 });
	}
};

/** POST – mark all notifications as read */
export const POST = async (event: RequestEvent) => {
	const userId = getAuthUserId(event);

	try {
		await markAllNotificationsAsRead(userId);
		return json({ success: true });
	} catch (error) {
		console.error('Error marking notifications as read:', error);
		return json({ error: 'Failed to mark notifications as read' }, { status: 500 });
	}
};
