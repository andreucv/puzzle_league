import type { ConnectionStatus } from '../types';
import type { AblyAdapter } from './ably-adapter';
import { invalidateAll } from '$app/navigation';

/**
 * Lightweight Svelte 5 runes-based hook for Ably channels that simply
 * invalidates all SvelteKit load functions on any incoming message.
 *
 * Use this on pages that don't need incremental state updates (e.g. results page).
 * For pages that need optimistic updates and state diffing, use `useAblyStream` instead.
 *
 * The adapter (and the ~186KB ably package behind it) is imported dynamically so
 * pages using this hook don't ship Ably in their eager bundle — it only loads
 * once the effect runs, i.e. when a live connection is actually wanted.
 *
 * @param channelName - Ably channel name, e.g. `competition:42`
 * @param authUrl - Auth URL for token generation
 */
export function useAblyInvalidation(channelName: string, authUrl: string) {
	let status = $state<ConnectionStatus>('disconnected');
	let adapter: AblyAdapter | null = null;

	$effect(() => {
		let disposed = false;

		import('./ably-adapter').then(({ AblyAdapter }) => {
			if (disposed) return;

			adapter = new AblyAdapter({ channelName, authUrl });

			adapter.onMessage(() => {
				invalidateAll();
			});

			adapter.onStatusChange((newStatus) => {
				status = newStatus;
			});

			adapter.connect();
		});

		return () => {
			disposed = true;
			adapter?.disconnect();
			adapter = null;
		};
	});

	return {
		get status() {
			return status;
		}
	};
}
