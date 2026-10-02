import { json, type RequestEvent } from '@sveltejs/kit';
import { Receiver } from '@upstash/qstash';
import { handleRegistrationOpenWebhook } from '$lib/services/registration-open-webhook';
import { getRegistrationOpenScheduler } from '$lib/services/registration-open-scheduler';
import { getCategoryFollowersNotifier } from '$lib/services/category-followers-notifier';
import { dispatchNotifications } from '$lib/notifications/dispatcher';
import { prisma } from '$lib/database/create_prisma_client';
import { env } from '$env/dynamic/private';

export const POST = async (event: RequestEvent) => {
	const current = env.QSTASH_CURRENT_SIGNING_KEY;
	const next = env.QSTASH_NEXT_SIGNING_KEY;
	const scheduler = getRegistrationOpenScheduler();
	if (!current || !next || !scheduler) {
		return json({ error: 'QStash not configured' }, { status: 503 });
	}

	const result = await handleRegistrationOpenWebhook({
		signature: event.request.headers.get('upstash-signature') ?? '',
		body: await event.request.text(),
		receiver: new Receiver({ currentSigningKey: current, nextSigningKey: next }),
		db: prisma as any,
		scheduler,
		dispatchNotifications,
		followersNotifier: getCategoryFollowersNotifier(),
	});

	return json(result.body, { status: result.status });
};
