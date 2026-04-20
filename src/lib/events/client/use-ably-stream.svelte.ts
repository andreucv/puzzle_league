import type { ConnectionStatus, CompetitionEventState, CompetitionEvent } from '../types';
import { applyCompetitionEvent } from '../types';
import { AblyAdapter } from './ably-adapter';
import { invalidateAll } from '$app/navigation';

/**
 * Svelte 5 runes-based hook for Ably Pub/Sub on competition channels.
 *
 * Takes the initial state from SvelteKit load() and incrementally applies
 * Ably events. On reconnection after a suspension (missed messages), it
 * calls invalidateAll() to re-fetch fresh state from Prisma.
 *
 * @param channelName - Ably channel name, e.g. `competition:42`
 * @param initialState - CompetitionEventState from the page's load() function
 * @param authUrl - Optional auth URL for token generation (defaults to /api/ably-token)
 */
export function useAblyStream(
	channelName: string,
	initialState: CompetitionEventState | null,
	authUrl?: string
) {
	let state = $state<CompetitionEventState | null>(initialState);
	let status = $state<ConnectionStatus>('disconnected');
	let lastUpdated = $state<Date | null>(null);
	let error = $state<string | null>(null);
	let hasSuspended = false;

	const adapter = new AblyAdapter({ channelName, authUrl });

	adapter.onMessage((name, data) => {
		// After a suspension, don't apply incremental events — re-fetch instead
		if (hasSuspended) {
			hasSuspended = false;
			invalidateAll();
			return;
		}

		const event = { type: name, ...(data as Record<string, unknown>) } as CompetitionEvent;

		if (state) {
			state = applyCompetitionEvent(state, event);
		}
		lastUpdated = new Date();
		error = null;
	});

	adapter.onStatusChange((newStatus) => {
		status = newStatus;
		if (newStatus === 'error') {
			error = 'Connection lost — attempting to reconnect...';
			hasSuspended = true;
		} else if (newStatus === 'connected' && hasSuspended) {
			// Reconnected after suspension — re-fetch full state
			hasSuspended = false;
			invalidateAll();
		}
		if (newStatus === 'connected') {
			error = null;
		}
	});

	$effect(() => {
		adapter.connect();
		return () => adapter.disconnect();
	});

	/** Update the state from outside (e.g. when load() re-runs after invalidation) */
	function updateState(newState: CompetitionEventState) {
		state = newState;
	}

	/** Apply a synthetic event locally (e.g. optimistic update from user action) */
	function applyLocalEvent(event: CompetitionEvent) {
		if (state) {
			state = applyCompetitionEvent(state, event);
		}
	}

	function destroy() {
		adapter.disconnect();
	}

	return {
		get state() { return state; },
		get status() { return status; },
		get lastUpdated() { return lastUpdated; },
		get error() { return error; },
		updateState,
		applyLocalEvent,
		destroy
	};
}
