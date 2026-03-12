import type { RequestEvent } from '@sveltejs/kit';
import { requireAuth } from '$lib/utils/api_auth';
import { handlePollRequest } from '$lib/events/server/response-handler';

export const GET = async (event: RequestEvent) => {
	const auth = await requireAuth(event);
	if (!auth.authorized) return auth.response;

	return handlePollRequest(event, 'notifications', { userId: auth.userId });
};
