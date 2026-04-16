import type { ChannelName, ChannelMap, ConnectionStatus, EventStreamOptions } from '../types';
import { PollingAdapter } from './polling-adapter';

const DEFAULT_ACTIVE_INTERVAL = 3_000;
const DEFAULT_IDLE_INTERVAL = 15_000;
const DEFAULT_BACKGROUND_INTERVAL = 30_000;

const CHANNEL_URLS: Record<ChannelName, (params: Record<string, unknown>) => string> = {
	competition: (p) => `/api/events/competition/${p.id}`,
	notifications: () => '/api/events/notifications'
};

/**
 * Svelte 5 runes-based event stream hook.
 * Returns reactive state that auto-updates via polling.
 */
export function useEventStream<K extends ChannelName>(
	channel: K,
	params: ChannelMap[K]['params'],
	options: EventStreamOptions = {}
) {
	let state = $state<ChannelMap[K]['state'] | null>(null);
	let status = $state<ConnectionStatus>('disconnected');
	let lastUpdated = $state<Date | null>(null);
	let error = $state<string | null>(null);
	let pollCount = $state(0);

	const url = CHANNEL_URLS[channel](params as Record<string, unknown>);

	const adapter = new PollingAdapter<ChannelMap[K]['state']>({
		url,
		activeInterval: options.activeInterval ?? DEFAULT_ACTIVE_INTERVAL,
		idleInterval: options.idleInterval ?? DEFAULT_IDLE_INTERVAL,
		backgroundInterval: options.backgroundInterval ?? DEFAULT_BACKGROUND_INTERVAL,
		isActive: options.isActive ?? (() => false)
	});

	adapter.onStateUpdate((newState) => {
		state = newState;
		lastUpdated = new Date();
		error = null;
	});

	adapter.onStatusChange((newStatus) => {
		status = newStatus;
		if (newStatus === 'error') {
			error = 'Connection error — retrying...';
		}
	});

	adapter.onPollComplete(() => {
		pollCount++;
	});

	// TEMPORARILY DISABLED — Prisma plan limit reached
	// $effect(() => {
	// 	adapter.connect();
	// 	return () => adapter.disconnect();
	// });

	function refresh() {
		adapter.refresh();
	}

	function resetErrors() {
		adapter.resetErrors();
	}

	function destroy() {
		adapter.disconnect();
	}

	return {
		get state() { return state; },
		get status() { return status; },
		get lastUpdated() { return lastUpdated; },
		get error() { return error; },
		get pollCount() { return pollCount; },
		refresh,
		resetErrors,
		destroy
	};
}
