import { Client } from '@upstash/qstash';
import { env } from '$env/dynamic/private';

/**
 * Publishes the delayed QStash message that auto-opens a Category's registration at
 * `Category.registrationOpensAt`. Messages are never cancelled: the webhook only acts when the
 * body's `opensAt` still equals the stored value, so rescheduling/cancelling/manual open-close just
 * turns in-flight messages into no-ops.
 * ponytail: stale messages still hit the webhook (one cheap no-op each); store + delete message ids if QStash quota matters.
 */
export interface RegistrationOpenScheduler {
	publish(categoryId: number, opensAt: Date): Promise<void>;
}

/**
 * QStash caps a message delay per plan (Free: 7 days). Longer schedules "hop": the webhook
 * re-publishes until `opensAt` is reached.
 */
export const MAX_HOP_MS = 6 * 24 * 60 * 60 * 1000;

export function nextDeliveryTime(opensAt: Date, now: Date = new Date()): Date {
	return new Date(Math.min(opensAt.getTime(), now.getTime() + MAX_HOP_MS));
}

export function createRegistrationOpenScheduler({ qstashClient, webhookUrl }: { qstashClient: Client; webhookUrl: string }): RegistrationOpenScheduler {
	return {
		async publish(categoryId: number, opensAt: Date): Promise<void> {
			await qstashClient.publishJSON({
				url: webhookUrl,
				body: { categoryId, opensAt: opensAt.toISOString() },
				notBefore: Math.floor(nextDeliveryTime(opensAt).getTime() / 1000),
				headers: { 'ngrok-skip-browser-warning': 'true' },
			});
		},
	};
}

let _scheduler: RegistrationOpenScheduler | null = null;

/** Whether scheduled opening is available (QStash configured). */
export function isRegistrationScheduleAvailable(): boolean {
	return Boolean(env.QSTASH_TOKEN && env.QSTASH_PUBLIC_APP_URL);
}

/** The scheduler singleton, or null when QStash is not configured (feature degrades to manual). */
export function getRegistrationOpenScheduler(): RegistrationOpenScheduler | null {
	if (!isRegistrationScheduleAvailable()) return null;
	if (!_scheduler) {
		_scheduler = createRegistrationOpenScheduler({
			qstashClient: new Client({ token: env.QSTASH_TOKEN! }),
			webhookUrl: `${env.QSTASH_PUBLIC_APP_URL}/api/webhooks/qstash/registration-open`,
		});
	}
	return _scheduler;
}
