import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import type { ChannelName, ChannelMap } from '../types';
import { resolveChannelState } from './state-resolver';

/**
 * Generic poll request handler.
 * Parses If-None-Match header and returns 304 if state unchanged.
 */
export async function handlePollRequest<K extends ChannelName>(
	event: RequestEvent,
	channel: K,
	params: ChannelMap[K]['params']
): Promise<Response> {
	const clientEtag = event.request.headers.get('If-None-Match');
	const { state, etag } = await resolveChannelState(channel, params);

	if (clientEtag && clientEtag === `"${etag}"`) {
		return new Response(null, { status: 304, headers: { ETag: `"${etag}"` } });
	}

	return json(state, {
		headers: {
			ETag: `"${etag}"`,
			'Cache-Control': 'no-cache'
		}
	});
}
