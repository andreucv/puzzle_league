import type { ChannelName, ChannelMap } from '../types';
import { resolveCompetitionState } from './competition';
import { resolveNotificationState } from './notifications';

type ChannelResolver<K extends ChannelName> = (params: ChannelMap[K]['params']) => Promise<ChannelMap[K]['state']>;

interface ChannelConfig<K extends ChannelName> {
	resolver: ChannelResolver<K>;
	/** If true, only the resolver params are needed — auth is handled at the endpoint level */
	requiresAuth: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const channels: { [K in ChannelName]: ChannelConfig<K> } = {
	competition: {
		resolver: resolveCompetitionState as ChannelResolver<'competition'>,
		requiresAuth: true
	},
	notifications: {
		resolver: resolveNotificationState as ChannelResolver<'notifications'>,
		requiresAuth: true
	}
};

export function getChannel<K extends ChannelName>(name: K): ChannelConfig<K> {
	return channels[name];
}
