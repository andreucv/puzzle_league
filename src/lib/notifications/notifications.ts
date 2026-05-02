import { prisma } from '$lib/database/create_prisma_client';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { sendEmail } from '$lib/emails/send_email_utils';

// ---------------------------------------------------------------------------
// Mail hooks — delegates to src/lib/emails/send_email_utils
// ---------------------------------------------------------------------------

/** Notification types that should also trigger an email. */
const EMAIL_ENABLED_TYPES = new Set<NotificationType>([
	NotificationType.INSCRIPTION_CONFIRMED,
	NotificationType.PAYMENT_REMINDER,
]);

function shouldSendMail(type: NotificationType): boolean {
	return EMAIL_ENABLED_TYPES.has(type);
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
	actorName,
	translationKey,
}: {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	link?: string;
	data?: Record<string, string | number | boolean>;
	actorName?: string;
	translationKey?: string;
}) {
	const notification = await prisma.notification.create({
		data: { userId, type, title, message, link, data: data ?? undefined },
	});

	if (shouldSendMail(type) && link) {
		const emailData: Record<string, string> = {};
		if (data) {
			for (const [k, v] of Object.entries(data)) emailData[k] = String(v);
		}
		await sendEmail([userId], type, link, emailData, actorName, translationKey).catch((err) => {
			console.error(`[createNotification] Email send failed for user ${userId}:`, err);
		});
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
	actorName?: string,
	translationKey?: string,
) {
	const notifications = await prisma.notification.createMany({
		data: userIds.map((userId) => ({ userId, type, title, message, link, data: data ?? undefined })),
	});

	if (shouldSendMail(type) && link) {
		const emailData: Record<string, string> = {};
		if (data) {
			for (const [k, v] of Object.entries(data)) emailData[k] = String(v);
		}
		await sendEmail(userIds, type, link, emailData, actorName, translationKey).catch((err) => {
			console.error(`[createNotificationForUsers] Email send failed:`, err);
		});
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
