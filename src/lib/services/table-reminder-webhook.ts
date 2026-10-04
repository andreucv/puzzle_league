import type { Receiver } from '@upstash/qstash';
import type { PrismaClient } from '$prisma/client';
import { CategoryStatus, RegistrationStatus } from '$prisma/enums';
import type { NotificationIntent } from '$lib/notifications/dispatcher';
import { notificationsForTableAssignment } from '$lib/notifications/registration_notifications';
import { reminderTime, type TableReminderScheduler } from './table-reminder-scheduler';

interface WebhookResult {
	status: number;
	body: Record<string, unknown>;
}

/**
 * QStash webhook that sends a Category's table reminder (TABLE_ASSIGNED, email + in-app) one hour
 * before it starts, with the table numbers stored at that moment. Sent at most once per Category
 * (#103). Always answers 2xx for anything but a bad signature, so QStash does not retry no-ops:
 * - body `startTime` differs from the stored value → stale (start time moved)
 * - category not NOT_STARTED or reminder already sent → nothing to do
 * - delivered early (long schedules hop past QStash's max delay) → publish the next hop
 * - no CONFIRMED Entry has a table → nothing to send
 */
export async function handleTableReminderWebhook({
	signature,
	body,
	receiver,
	db,
	scheduler,
	dispatchNotifications,
	now = new Date(),
}: {
	signature: string;
	body: string;
	receiver: Receiver;
	db: PrismaClient;
	scheduler: TableReminderScheduler;
	dispatchNotifications: (intents: NotificationIntent[]) => Promise<unknown>;
	now?: Date;
}): Promise<WebhookResult> {
	const isValid = await receiver.verify({ signature, body });
	if (!isValid) {
		return { status: 401, body: { error: 'Invalid signature' } };
	}

	const { categoryId, startTime } = JSON.parse(body) as { categoryId: number; startTime: string };
	const startTimeDate = new Date(startTime);

	const category = await db.category.findUnique({
		where: { id: categoryId },
		select: {
			id: true,
			status: true,
			startTime: true,
			tableReminderSentAt: true,
			competitionId: true,
			description: true,
			subname: true,
			type: true,
			competition: { select: { name: true } },
		},
	});

	if (!category || category.startTime.getTime() !== startTimeDate.getTime()) {
		return { status: 200, body: { message: 'Stale schedule' } };
	}

	if (category.status !== CategoryStatus.NOT_STARTED || category.tableReminderSentAt !== null) {
		return { status: 200, body: { message: 'Not applicable' } };
	}

	// 1s tolerance for clock skew between QStash and this server.
	if (now.getTime() < reminderTime(startTimeDate).getTime() - 1000) {
		await scheduler.publish(categoryId, startTimeDate);
		return { status: 200, body: { message: 'Rescheduled next hop' } };
	}

	const entries = await db.entry.findMany({
		where: { categoryId, status: RegistrationStatus.CONFIRMED, tableNumber: { not: null } },
		orderBy: { tableNumber: 'asc' },
		select: {
			id: true,
			tableNumber: true,
			creatorId: true,
			users: { select: { id: true, name: true } },
			externalParticipants: { select: { name: true } },
		},
	});

	if (entries.length === 0) {
		return { status: 200, body: { message: 'No tables' } };
	}

	// Claim before dispatching: a crash after the claim loses the reminder rather than sending it twice.
	const { count } = await db.category.updateMany({
		where: { id: categoryId, tableReminderSentAt: null },
		data: { tableReminderSentAt: now },
	});
	if (count === 0) {
		return { status: 200, body: { message: 'Already sent' } };
	}

	const records = entries.map((entry) => ({ ...entry, tableNumber: entry.tableNumber as number }));
	await dispatchNotifications(notificationsForTableAssignment(records, category));

	return { status: 200, body: { message: 'Table reminder sent', categoryId, notifiedCount: records.length } };
}
