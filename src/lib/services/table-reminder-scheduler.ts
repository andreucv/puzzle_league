import { Client } from '@upstash/qstash';
import { env } from '$env/dynamic/private';
import type { PrismaClient } from '$prisma/client';
import { CategoryStatus, RegistrationStatus } from '$prisma/enums';
import { isRegistrationScheduleAvailable, nextDeliveryTime } from './registration-open-scheduler';

/** Participants are told their table this long before `Category.startTime` (#103). */
export const TABLE_REMINDER_LEAD_MS = 60 * 60 * 1000;

export function reminderTime(startTime: Date): Date {
	return new Date(startTime.getTime() - TABLE_REMINDER_LEAD_MS);
}

/**
 * Publishes the delayed QStash message that sends a Category's table reminder one hour before it
 * starts. Messages are never cancelled: the webhook only acts when the body's `startTime` still
 * equals the stored value and the reminder was not sent yet, so duplicates and stale messages are
 * no-ops. Long delays hop like the registration-open schedule.
 */
export interface TableReminderScheduler {
	publish(categoryId: number, startTime: Date): Promise<void>;
}

export function createTableReminderScheduler({ qstashClient, webhookUrl }: { qstashClient: Client; webhookUrl: string }): TableReminderScheduler {
	return {
		async publish(categoryId: number, startTime: Date): Promise<void> {
			await qstashClient.publishJSON({
				url: webhookUrl,
				body: { categoryId, startTime: startTime.toISOString() },
				notBefore: Math.floor(nextDeliveryTime(reminderTime(startTime)).getTime() / 1000),
				headers: { 'ngrok-skip-browser-warning': 'true' },
			});
		},
	};
}

let _scheduler: TableReminderScheduler | null = null;

/** The scheduler singleton, or null when QStash is not configured (no table reminders are sent). */
export function getTableReminderScheduler(): TableReminderScheduler | null {
	if (!isRegistrationScheduleAvailable()) return null;
	if (!_scheduler) {
		_scheduler = createTableReminderScheduler({
			qstashClient: new Client({ token: env.QSTASH_TOKEN! }),
			webhookUrl: `${env.QSTASH_PUBLIC_APP_URL}/api/webhooks/qstash/table-reminder`,
		});
	}
	return _scheduler;
}

/**
 * Schedule a Category's table reminder when it is eligible: NOT_STARTED, not sent yet, has at least
 * one CONFIRMED Entry with a table, and the reminder time is still in the future (late table
 * assignments are never notified). Best effort: errors are logged and never propagated, so
 * publishing tables or saving a competition cannot fail because of the reminder.
 */
export async function scheduleTableReminder(
	categoryId: number,
	{
		db,
		scheduler = getTableReminderScheduler(),
		now = new Date(),
	}: { db: PrismaClient; scheduler?: TableReminderScheduler | null; now?: Date },
): Promise<boolean> {
	if (!scheduler) return false;
	try {
		const category = await db.category.findUnique({
			where: { id: categoryId },
			select: { status: true, startTime: true, tableReminderSentAt: true },
		});
		if (
			!category ||
			category.status !== CategoryStatus.NOT_STARTED ||
			category.tableReminderSentAt !== null ||
			reminderTime(category.startTime).getTime() <= now.getTime()
		) {
			return false;
		}

		const tabledEntries = await db.entry.count({
			where: { categoryId, status: RegistrationStatus.CONFIRMED, tableNumber: { not: null } },
		});
		if (tabledEntries === 0) return false;

		await scheduler.publish(categoryId, category.startTime);
		return true;
	} catch (err) {
		console.error(`[table-reminder] Failed to schedule reminder for category ${categoryId}:`, err);
		return false;
	}
}
