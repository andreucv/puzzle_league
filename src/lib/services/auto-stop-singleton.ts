import { Client } from '@upstash/qstash';
import { prisma } from '$lib/database/create_prisma_client';
import { createAutoStopScheduler, type AutoStopScheduler } from './auto-stop-scheduler';
import { env } from '$env/dynamic/private';

let _scheduler: AutoStopScheduler | null = null;

/**
 * Whether auto-stop scheduling is available (QStash configured). Used by loaders to tell
 * the UI to disable the toggle when scheduling is impossible.
 */
export function isAutoStopAvailable(): boolean {
	return Boolean(env.QSTASH_TOKEN && env.QSTASH_PUBLIC_APP_URL);
}

/**
 * Returns the auto-stop scheduler singleton, or null if QStash is not configured.
 * Gracefully degrades — auto-stop is optional and won't break the app if QStash
 * env vars are missing.
 */
export function getAutoStopScheduler(): AutoStopScheduler | null {
	const token = env.QSTASH_TOKEN;
	const appUrl = env.QSTASH_PUBLIC_APP_URL;

	if (!token || !appUrl) {
		return null;
	}

	if (!_scheduler) {
		const qstashClient = new Client({ token });
		_scheduler = createAutoStopScheduler({
			qstashClient,
			db: prisma as any,
			webhookUrl: `${appUrl}/api/webhooks/qstash/auto-stop`,
		});
	}

	return _scheduler;
}
