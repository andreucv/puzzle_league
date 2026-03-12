import { prisma } from '$lib/database/create_prisma_client';
import type { NotificationEventState } from '../types';
import crypto from 'node:crypto';

export async function resolveNotificationState(params: { userId: string }): Promise<NotificationEventState> {
	const [unreadCount, latest] = await Promise.all([
		prisma.notification.count({
			where: { userId: params.userId, read: false },
			take: 1
		}),
		prisma.notification.findFirst({
			where: { userId: params.userId },
			orderBy: { createdAt: 'desc' },
			select: { id: true }
		})
	]);

	const hasUnread = unreadCount > 0;
	const latestId = latest?.id ?? null;

	const versionPayload = `${hasUnread}:${latestId}`;
	const version = crypto.createHash('md5').update(versionPayload).digest('hex').slice(0, 12);

	return { version, hasUnread, latestId };
}
