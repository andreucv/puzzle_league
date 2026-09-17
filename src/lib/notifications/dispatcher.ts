import { prisma } from '$lib/database/create_prisma_client';
import { NotificationType } from '$prisma/enums';
import { getPostHogClient } from '$lib/server/posthog';
import { EmailChannel } from './email_channel';

/**
 * A plain, side-effect-free description of one notification to one *or many*
 * users sharing identical content. The unit of currency handed to the
 * {@link dispatchNotifications} seam. Builders produce these; they do not write
 * to the database or send email.
 */
export interface NotificationIntent {
	userIds: string[];
	type: NotificationType;
	title: string; // translation key
	message: string; // translation key
	link?: string;
	data?: Record<string, string | number | boolean>;
	actorName?: string; // email "from" display + sender attribution
	translationKey?: string; // email template variant selector
}

/** Outcome of a dispatch, surfaced for telemetry — failures are non-fatal. */
export interface DispatchResult {
	persisted: number; // Notification rows written
	emailed: number; // intents routed to the email channel and sent
	emailFailures: number; // non-fatal; counted, not thrown
}

/** A downstream realisation of notification intents (email today, outbox later). */
export interface NotificationChannel {
	send(intents: NotificationIntent[]): Promise<{ sent: number; failed: number }>;
}

/** Notification types that also email. Owned by the dispatcher, not the create call. */
export const EMAIL_ENABLED_TYPES = new Set<NotificationType>([
	NotificationType.REGISTRATION_CONFIRMED,
	NotificationType.REGISTRATION_REFUSED,
	NotificationType.REGISTRATION_PROMOTED,
	NotificationType.PAYMENT_REMINDER,
]);

function shouldEmail(intent: NotificationIntent): boolean {
	return EMAIL_ENABLED_TYPES.has(intent.type) && !!intent.link;
}

/**
 * The single seam that realises notification intents: persists the `Notification`
 * rows, routes email-enabled intents through the email channel, and emits one
 * observable telemetry event. Runs post-commit by construction — persistence
 * failure is logged and counted, never rolled back into a domain mutation; email
 * failure is counted, never thrown.
 *
 * @param intents the notifications to deliver
 * @param channel the downstream channel (defaults to {@link EmailChannel}; injectable for tests)
 */
export async function dispatchNotifications(
	intents: NotificationIntent[],
	channel: NotificationChannel = EmailChannel,
): Promise<DispatchResult> {
	let persisted = 0;

	for (const intent of intents) {
		try {
			const result = await prisma.notification.createMany({
				data: intent.userIds.map((userId) => ({
					userId,
					type: intent.type,
					title: intent.title,
					message: intent.message,
					link: intent.link,
					data: intent.data ?? undefined,
				})),
			});
			persisted += result.count;
		} catch (err) {
			console.error(`[dispatchNotifications] Failed to persist ${intent.type} notifications:`, err);
		}
	}

	const emailIntents = intents.filter(shouldEmail);
	let emailed = 0;
	let emailFailures = 0;
	if (emailIntents.length > 0) {
		const { sent, failed } = await channel.send(emailIntents);
		emailed = sent;
		emailFailures = failed;
	}

	const types = [...new Set(intents.map((i) => i.type))];
	getPostHogClient().capture({
		distinctId: 'server',
		event: 'notification_dispatch',
		properties: { persisted, emailed, emailFailures, types },
	});

	return { persisted, emailed, emailFailures };
}
