import * as Ably from 'ably';
import { metrics } from '../metrics';
import { fetchAblyToken, refetchResults, type CookieJar, type HttpClient } from '../http';

/**
 * A results-page viewer: holds a real Ably subscription to `competition:{id}` and re-fetches the
 * results data on every event — exactly like the real page's useAblyInvalidation hook.
 *
 *  - Authenticated viewer: pass `cookie` (uses /api/ably-token, re-fetches with the session).
 *  - External viewer: omit `cookie` (uses /api/ably-token/public, anonymous re-fetch).
 */
export interface Viewer {
	stop(): Promise<void>;
}

export async function startViewer(
	client: HttpClient,
	competitionId: number,
	opts: { cookie?: CookieJar } = {}
): Promise<Viewer> {
	const channelName = `competition:${competitionId}`;

	const realtime = new Ably.Realtime({
		authCallback: async (_params, callback) => {
			try {
				const token = await fetchAblyToken(client, competitionId, opts);
				callback(null, token);
			} catch (err) {
				callback(err instanceof Error ? err.message : String(err), null);
			}
		}
	});

	realtime.connection.on('failed', () => metrics.connectionFailed());
	realtime.connection.on('suspended', () => metrics.connectionFailed());

	const channel = realtime.channels.get(channelName);
	// subscribe() returns the attach promise; if the connection is closed (teardown) or fails while
	// the channel is still attaching, that promise rejects with "Connection closed" (80017). Swallow
	// it so a teardown race can't surface as an unhandled rejection that kills the run.
	void channel
		.subscribe(() => {
			metrics.eventReceived();
			// Fire-and-forget: the real page invalidates without blocking the message handler.
			void refetchResults(client, competitionId, opts).catch(() => {});
		})
		.catch(() => {});

	// Initial page-data load when the viewer "opens" the page.
	await refetchResults(client, competitionId, opts).catch(() => {});

	return {
		async stop() {
			channel.unsubscribe();
			realtime.close();
		}
	};
}
