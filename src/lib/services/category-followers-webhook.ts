import type { Receiver } from '@upstash/qstash';
import type { PrismaClient } from '$prisma/client';
import { CategoryStatus, NotificationType } from '$prisma/enums';
import type { CategoryType } from '$prisma/browser';
import type { NotificationIntent } from '$lib/notifications/dispatcher';
import { getCategoryTypeName } from '$lib/utils/category_utils';
import { userIdsWithEntryInCategory } from './category-follows';

interface WebhookResult {
	status: number;
	body: Record<string, unknown>;
}

/**
 * QStash webhook that notifies a Category's pending followers (`notifiedAt = null`) that its
 * registration opened. Delivery is at-least-once: notifications are dispatched first and the
 * follows marked afterwards, so a crash in between can resend on QStash retry but never loses one.
 * Always answers 2xx except for a bad signature, so QStash does not retry no-ops.
 */
export async function handleCategoryFollowersWebhook({
	signature,
	body,
	receiver,
	db,
	dispatchNotifications,
	now = new Date(),
}: {
	signature: string;
	body: string;
	receiver: Receiver;
	db: PrismaClient;
	dispatchNotifications: (intents: NotificationIntent[]) => Promise<unknown>;
	now?: Date;
}): Promise<WebhookResult> {
	const isValid = await receiver.verify({ signature, body });
	if (!isValid) {
		return { status: 401, body: { error: 'Invalid signature' } };
	}

	const { categoryId } = JSON.parse(body) as { categoryId: number };

	const category = await db.category.findUnique({
		where: { id: categoryId },
		select: {
			id: true,
			type: true,
			subname: true,
			status: true,
			registrationOpen: true,
			competitionId: true,
			competition: { select: { name: true } },
		},
	});

	// Closed again or started since the trigger: keep the follows pending for a later opening.
	if (!category || category.status !== CategoryStatus.NOT_STARTED || !category.registrationOpen) {
		return { status: 200, body: { message: 'Category not open; nothing to notify' } };
	}

	const follows = await db.categoryFollow.findMany({
		where: { categoryId, notifiedAt: null },
		select: { userId: true },
	});
	const followerIds = follows.map((f) => f.userId);
	if (followerIds.length === 0) {
		return { status: 200, body: { message: 'No pending followers', notifiedCount: 0 } };
	}

	// Followers who registered meanwhile are not notified, but are marked like everyone else.
	const registered = await userIdsWithEntryInCategory(db, categoryId, followerIds);
	const recipients = followerIds.filter((id) => !registered.has(id));

	if (recipients.length > 0) {
		const typeLabel = getCategoryTypeName(category.type as CategoryType);
		const categoryName = category.subname ? `@:${typeLabel} - ${category.subname}` : `@:${typeLabel}`;
		await dispatchNotifications([
			{
				userIds: recipients,
				type: NotificationType.CATEGORY_REGISTRATION_OPENED,
				title: 'notifications.titles.category_registration_opened',
				message: 'notifications.messages.category_registration_opened',
				link: `/competitions/competition_details/${category.competitionId}/registration`,
				data: { competitionName: category.competition.name, categoryName },
			},
		]);
	}

	// Mark exactly the follows read above; a follow re-armed after the read stays pending.
	await db.categoryFollow.updateMany({
		where: { categoryId, userId: { in: followerIds }, notifiedAt: null },
		data: { notifiedAt: now },
	});

	return { status: 200, body: { message: 'Followers notified', categoryId, notifiedCount: recipients.length } };
}
