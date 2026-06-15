import { prisma } from '$lib/database/create_prisma_client';

// ---------------------------------------------------------------------------
// Query notifications
//
// Notification creation, the email decision, and delivery now live behind the
// Notification Dispatcher (see ./dispatcher.ts). This module owns only the
// read/mark side of the inbox.
// ---------------------------------------------------------------------------

export async function getNotificationsForUser(userId: string, limit = 50) {
	return prisma.notification.findMany({
		where: { userId },
		orderBy: { createdAt: 'desc' },
		take: limit,
	});
}

export async function hasUnreadForUser(userId: string): Promise<boolean> {
	const count = await prisma.notification.count({
		where: { userId, read: false },
		take: 1,
	});
	return count > 0;
}

// ---------------------------------------------------------------------------
// Mark as read
// ---------------------------------------------------------------------------

export async function markNotificationAsRead(notificationId: string, userId: string) {
	return prisma.notification.update({
		where: { id: notificationId, userId },
		data: { read: true },
	});
}

export async function markAllNotificationsAsRead(userId: string) {
	return prisma.notification.updateMany({
		where: { userId, read: false },
		data: { read: true },
	});
}
