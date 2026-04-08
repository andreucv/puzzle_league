import { prisma } from '$lib/database/create_prisma_client';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';

// ---------------------------------------------------------------------------
// Mail hooks (stubs – see instructions for future implementation)
// ---------------------------------------------------------------------------

/** Returns true for notification types that should also trigger an email. */
function shouldSendMail(_type: NotificationType): boolean {
	return false;
}

/** Stub – replace body with actual mail transport when enabling email. */
async function sendMailNotification(
	_userId: string,
	_title: string,
	_message: string,
): Promise<void> {
	// no-op
}

// ---------------------------------------------------------------------------
// Create notifications
// ---------------------------------------------------------------------------

export async function createNotification({
	userId,
	type,
	title,
	message,
	link,
	data,
}: {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
	data?: Record<string, string | number | boolean>;
}) {
	const notification = await prisma.notification.create({
		data: { userId, type, title, message, link, data: data ?? undefined },
	});

	if (shouldSendMail(type)) {
		await sendMailNotification(userId, title, message);
	}

	return notification;
}

export async function createNotificationForUsers(
	userIds: string[],
	type: NotificationType,
	title: string,
	message: string,
	link?: string,
	data?: Record<string, string | number | boolean>,
) {
	const notifications = await prisma.notification.createMany({
		data: userIds.map((userId) => ({ userId, type, title, message, link, data: data ?? undefined })),
	});

	if (shouldSendMail(type)) {
		await Promise.all(
			userIds.map((userId) => sendMailNotification(userId, title, message)),
		);
	}

	return notifications;
}

// ---------------------------------------------------------------------------
// Query notifications
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
