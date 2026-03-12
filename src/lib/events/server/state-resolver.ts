import type { ChannelName, ChannelMap } from '../types';
import { getChannel } from '../channels';

export interface ResolvedState<K extends ChannelName> {
	state: ChannelMap[K]['state'];
	etag: string;
}

export async function resolveChannelState<K extends ChannelName>(
	channel: K,
	params: ChannelMap[K]['params']
): Promise<ResolvedState<K>> {
	const config = getChannel(channel);
	const state = await config.resolver(params);
	// Use the version field as ETag
	const etag = (state as { version: string }).version;
	return { state, etag };
}
