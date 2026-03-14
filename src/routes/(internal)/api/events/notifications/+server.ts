import type { RequestEvent } from '@sveltejs/kit';
import { getAuthUserId } from '$lib/api_utils/api_auth';
import { handlePollRequest } from '$lib/events/server/response-handler';

export const GET = async (event: RequestEvent) => {
	const userId = getAuthUserId(event);
	return handlePollRequest(event, 'notifications', { userId });
};
