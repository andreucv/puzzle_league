import type { ConnectionStatus } from '../types';
import { AblyAdapter } from './ably-adapter';
import { invalidateAll } from '$app/navigation';

/**
 * Lightweight Svelte 5 runes-based hook for Ably channels that simply
 * invalidates all SvelteKit load functions on any incoming message.
 *
 * Use this on pages that don't need incremental state updates (e.g. results page).
 * For pages that need optimistic updates and state diffing, use `useAblyStream` instead.
 *
 * @param channelName - Ably channel name, e.g. `competition:42`
 * @param authUrl - Auth URL for token generation
 */
export function useAblyInvalidation(channelName: string, authUrl: string) {
	let status = $state<ConnectionStatus>('disconnected');

	const adapter = new AblyAdapter({ channelName, authUrl });

	adapter.onMessage(() => {
		invalidateAll();
	});

	adapter.onStatusChange((newStatus) => {
		status = newStatus;
	});

	$effect(() => {
		adapter.connect();
		return () => adapter.disconnect();
	});

	return {
		get status() {
			return status;
		}
	};
}
