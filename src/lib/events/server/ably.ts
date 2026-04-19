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
 * Fire-and-forget: errors are logged but never thrown — the calling
 * API endpoint must succeed regardless of Ably availability.
 */
export function publishCompetitionEvent(
	competitionId: number,
	eventName: string,
	data: Record<string, unknown>
): void {
	const client = getClient();
	if (!client) return;

	const channelName = `competition:${competitionId}`;
	client.channels.get(channelName).publish(eventName, data).catch((err) => {
		console.error(`[ably] Failed to publish ${eventName} to ${channelName}:`, err);
	});
}
