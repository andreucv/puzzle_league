import { json, type RequestEvent } from '@sveltejs/kit';
import { Receiver } from '@upstash/qstash';
import { handleCategoryFollowersWebhook } from '$lib/services/category-followers-webhook';
import { dispatchNotifications } from '$lib/notifications/dispatcher';
import { prisma } from '$lib/database/create_prisma_client';
import { getPostHogClient } from '$lib/server/posthog';
import { env } from '$env/dynamic/private';

export const POST = async (event: RequestEvent) => {
	const current = env.QSTASH_CURRENT_SIGNING_KEY;
	const next = env.QSTASH_NEXT_SIGNING_KEY;
	if (!current || !next) {
		return json({ error: 'QStash not configured' }, { status: 503 });
	}

	const result = await handleCategoryFollowersWebhook({
		signature: event.request.headers.get('upstash-signature') ?? '',
		body: await event.request.text(),
		receiver: new Receiver({ currentSigningKey: current, nextSigningKey: next }),
		db: prisma as any,
		dispatchNotifications,
	});

	if (typeof result.body.notifiedCount === 'number' && result.body.notifiedCount > 0) {
		getPostHogClient().capture({
			distinctId: 'server',
			event: 'category_followers_notified',
			properties: { category_id: result.body.categoryId, notified_count: result.body.notifiedCount },
		});
	}

	return json(result.body, { status: result.status });
};
