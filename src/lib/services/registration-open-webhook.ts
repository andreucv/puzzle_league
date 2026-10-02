import type { Receiver } from '@upstash/qstash';
import type { PrismaClient } from '$prisma/client';
import { CategoryStatus, NotificationType } from '$prisma/enums';
import type { NotificationIntent } from '$lib/notifications/dispatcher';
import type { RegistrationOpenScheduler } from './registration-open-scheduler';
import { triggerCategoryFollowersNotification, type CategoryFollowersNotifier } from './category-followers-notifier';

interface WebhookResult {
	status: number;
	body: Record<string, unknown>;
}

/**
 * QStash webhook that opens a Category's registration at its scheduled `registrationOpensAt`.
 * Always answers 2xx for anything but a bad signature, so QStash does not retry no-ops:
 * - body `opensAt` differs from the stored value → stale (rescheduled/cancelled/manually changed)
 * - category started or already open → clear the schedule
 * - delivered early (long schedules hop past QStash's max delay) → publish the next hop
 */
export async function handleRegistrationOpenWebhook({
	signature,
	body,
	receiver,
	db,
	scheduler,
	dispatchNotifications,
	followersNotifier = null,
	now = new Date(),
}: {
	signature: string;
	body: string;
	receiver: Receiver;
	db: PrismaClient;
	scheduler: RegistrationOpenScheduler;
	dispatchNotifications: (intents: NotificationIntent[]) => Promise<unknown>;
	/** Publishes the async follower notification after a successful open (null = skip). */
	followersNotifier?: CategoryFollowersNotifier | null;
	now?: Date;
}): Promise<WebhookResult> {
	const isValid = await receiver.verify({ signature, body });
	if (!isValid) {
		return { status: 401, body: { error: 'Invalid signature' } };
	}

	const { categoryId, opensAt } = JSON.parse(body) as { categoryId: number; opensAt: string };
	const opensAtDate = new Date(opensAt);

	const category = await db.category.findUnique({
		where: { id: categoryId },
		select: {
			id: true,
			status: true,
			registrationOpen: true,
			registrationOpensAt: true,
			competitionId: true,
			competition: { select: { creatorId: true, name: true } },
		},
	});

	if (!category || category.registrationOpensAt?.getTime() !== opensAtDate.getTime()) {
		return { status: 200, body: { message: 'Stale schedule' } };
	}

	if (category.status !== CategoryStatus.NOT_STARTED || category.registrationOpen) {
		await db.category.update({ where: { id: categoryId }, data: { registrationOpensAt: null } });
		return { status: 200, body: { message: 'Category not openable; schedule cleared' } };
	}

	// 1s tolerance for clock skew between QStash and this server.
	if (now.getTime() < opensAtDate.getTime() - 1000) {
		await scheduler.publish(categoryId, opensAtDate);
		return { status: 200, body: { message: 'Rescheduled next hop' } };
	}

	// Conditional on the schedule so a concurrent manual change wins.
	const { count } = await db.category.updateMany({
		where: { id: categoryId, registrationOpensAt: opensAtDate, registrationOpen: false },
		data: { registrationOpen: true, registrationOpensAt: null },
	});
	if (count === 0) {
		return { status: 200, body: { message: 'Stale schedule' } };
	}

	// Followers are notified asynchronously; a failed publish never fails the open.
	await triggerCategoryFollowersNotification(categoryId, followersNotifier);

	await dispatchNotifications([
		{
			userIds: [category.competition.creatorId],
			type: NotificationType.REGISTRATION_OPENED,
			title: 'notifications.titles.registration_opened',
			message: 'notifications.messages.registration_opened',
			link: `/competition/${category.competitionId}/manage_registrations`,
			data: { competitionName: category.competition.name },
		},
	]);

	return { status: 200, body: { message: 'Registration opened' } };
}
