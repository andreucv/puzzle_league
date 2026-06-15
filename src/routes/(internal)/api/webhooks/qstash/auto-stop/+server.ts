import { json, type RequestEvent } from '@sveltejs/kit';
import { Receiver } from '@upstash/qstash';
import { handleAutoStopWebhook } from '$lib/services/auto-stop-webhook';
import { stopCategory } from '$lib/services/category-lifecycle';
import { dispatchNotifications } from '$lib/notifications/dispatcher';
import { prisma } from '$lib/database/create_prisma_client';
import { env } from '$env/dynamic/private';

function getReceiver(): Receiver | null {
	const current = env.QSTASH_CURRENT_SIGNING_KEY;
	const next = env.QSTASH_NEXT_SIGNING_KEY;
	if (!current || !next) return null;
	return new Receiver({ currentSigningKey: current, nextSigningKey: next });
}

export const POST = async (event: RequestEvent) => {
	const receiver = getReceiver();
	if (!receiver) {
		return json({ error: 'QStash not configured' }, { status: 503 });
	}

	const signature = event.request.headers.get('upstash-signature') ?? '';
	const body = await event.request.text();

	const result = await handleAutoStopWebhook({
		signature,
		body,
		receiver,
		db: prisma as any,
		stopCategory,
		dispatchNotifications,
	});

	return json(result.body, { status: result.status });
};
