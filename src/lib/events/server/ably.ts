import Ably from 'ably';
import { ABLY_API_KEY } from '$env/static/private';

const apiKey = ABLY_API_KEY;

// Lazy singleton — only instantiated when first used (avoids errors in environments without the key)
let _client: Ably.Rest | null = null;

function getClient(): Ably.Rest | null {
	if (!apiKey) {
		console.warn('[ably] ABLY_API_KEY not set — real-time events disabled');
		return null;
	}
	if (!_client) {
		_client = new Ably.Rest({ key: apiKey });
	}
	return _client;
}

/**
 * Publish a competition event to the `competition:{id}` channel.
 * Returns a Promise that resolves when the publish completes so callers can
 * await it before sending their HTTP response (required on Vercel Edge where
 * the runtime terminates as soon as the Response is returned).
 * Errors are caught and logged — the promise always resolves, never rejects.
 */
export async function publishCompetitionEvent(
	competitionId: number,
	eventName: string,
	data: Record<string, unknown>
): Promise<void> {
	const client = getClient();
	if (!client) {
		console.warn(`[ably] Client not available — cannot publish event ${eventName} for competition ${competitionId}`);
		return;
	}

	const channelName = `competition:${competitionId}`;
	try {
		await client.channels.get(channelName).publish(eventName, data);
	} catch (err) {
		console.error(`[ably] Failed to publish ${eventName} to ${channelName}:`, err);
	}
}
