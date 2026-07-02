import type { Receiver } from '@upstash/qstash';
import type { PrismaClient } from '$prisma/client';
import { CategoryStatus } from '$prisma/enums';
import { NotificationType } from '$prisma/enums';
import type { NotificationIntent } from '$lib/notifications/dispatcher';

interface WebhookResult {
	status: number;
	body: Record<string, unknown>;
}

interface HandleAutoStopWebhookParams {
	signature: string;
	body: string;
	receiver: Receiver;
	db: PrismaClient;
	stopCategory: (categoryId: number, options?: { isAutoStop?: boolean }) => Promise<unknown>;
	dispatchNotifications: (intents: NotificationIntent[]) => Promise<unknown>;
}

const NON_STOPPABLE_STATUSES: string[] = [
	CategoryStatus.STOPPED,
	CategoryStatus.COMPLETE,
	CategoryStatus.CANCELED,
];

export async function handleAutoStopWebhook({
	signature,
	body,
	receiver,
	db,
	stopCategory,
	dispatchNotifications,
}: HandleAutoStopWebhookParams): Promise<WebhookResult> {
	// Verify QStash signature
	const isValid = await receiver.verify({ signature, body });
	if (!isValid) {
		return { status: 401, body: { error: 'Invalid signature' } };
	}

	const { categoryId, competitionId } = JSON.parse(body) as {
		categoryId: number;
		competitionId: number;
	};

	// Look up category with organizer info
	const category = await db.category.findUnique({
		where: { id: categoryId },
		select: {
			id: true,
			status: true,
			competitionId: true,
			competition: { select: { creatorId: true, name: true } },
		},
	});

	if (!category) {
		return { status: 404, body: { error: 'Category not found' } };
	}

	// Idempotent: already stopped/complete/canceled → no-op
	if (NON_STOPPABLE_STATUSES.includes(category.status as CategoryStatus)) {
		return { status: 200, body: { message: 'Category already stopped' } };
	}

	// Attempt to stop
	try {
		await stopCategory(categoryId, { isAutoStop: true });

		// Notify organizer of successful auto-stop
		await dispatchNotifications([
			{
				userIds: [category.competition.creatorId],
				type: NotificationType.AUTO_STOP_SUCCESS,
				title: 'notifications.titles.auto_stop_success',
				message: 'notifications.messages.auto_stop_success',
				link: `/competitions/competition_details/${competitionId}`,
				data: { competitionName: category.competition.name },
			},
		]);

		return { status: 200, body: { message: 'Category auto-stopped' } };
	} catch (error) {
		// Notify organizer of failure
		await dispatchNotifications([
			{
				userIds: [category.competition.creatorId],
				type: NotificationType.AUTO_STOP_FAILED,
				title: 'notifications.titles.auto_stop_failed',
				message: 'notifications.messages.auto_stop_failed',
				link: `/competitions/competition_details/${competitionId}`,
				data: { competitionName: category.competition.name },
			},
		]);

		return { status: 500, body: { error: 'Failed to stop category' } };
	}
}
