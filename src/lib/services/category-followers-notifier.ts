import { Client } from '@upstash/qstash';
import { env } from '$env/dynamic/private';
import { isRegistrationScheduleAvailable } from './registration-open-scheduler';

/**
 * Publishes an immediate QStash message asking the category-followers webhook to notify a
 * Category's pending followers. Opening registration only publishes this message, so notifying
 * (email + in-app) is an asynchronous side effect that never slows down or fails the open.
 */
export interface CategoryFollowersNotifier {
	publish(categoryId: number): Promise<void>;
}

export function createCategoryFollowersNotifier({ qstashClient, webhookUrl }: { qstashClient: Client; webhookUrl: string }): CategoryFollowersNotifier {
	return {
		async publish(categoryId: number): Promise<void> {
			await qstashClient.publishJSON({
				url: webhookUrl,
				body: { categoryId },
				headers: { 'ngrok-skip-browser-warning': 'true' },
			});
		},
	};
}

let _notifier: CategoryFollowersNotifier | null = null;

/** The notifier singleton, or null when QStash is not configured (followers are not notified). */
export function getCategoryFollowersNotifier(): CategoryFollowersNotifier | null {
	if (!isRegistrationScheduleAvailable()) return null;
	if (!_notifier) {
		_notifier = createCategoryFollowersNotifier({
			qstashClient: new Client({ token: env.QSTASH_TOKEN! }),
			webhookUrl: `${env.QSTASH_PUBLIC_APP_URL}/api/webhooks/qstash/category-followers`,
		});
	}
	return _notifier;
}

/**
 * Trigger follower notification after a Category opened. Best effort: a failed publish is logged
 * and never propagated, so it cannot fail the open; the follows simply stay pending.
 */
export async function triggerCategoryFollowersNotification(
	categoryId: number,
	notifier: CategoryFollowersNotifier | null = getCategoryFollowersNotifier(),
): Promise<void> {
	if (!notifier) return;
	try {
		await notifier.publish(categoryId);
	} catch (err) {
		console.error(`[category-followers] Failed to publish notification for category ${categoryId}:`, err);
	}
}
