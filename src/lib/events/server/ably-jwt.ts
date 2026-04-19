import { createHmac } from 'node:crypto';

function base64url(input: string | Buffer): string {
	const buf = typeof input === 'string' ? Buffer.from(input) : input;
	return buf.toString('base64url');
}

/**
 * Create an Ably JWT with the given capability and optional clientId.
 * Returns the raw JWT string signed with HMAC-SHA256.
 *
 * @param capability - Channel capability map, e.g. `{ "competition:42": ["subscribe"] }`
 * @param clientId - Optional Ably clientId to embed in the token
 */
export function createAblyJwt(
	capability: Record<string, string[]>,
	clientId?: string
): string {
	const apiKey = process.env.ABLY_API_KEY;
	if (!apiKey) {
		throw new Error('ABLY_API_KEY not configured');
	}

	const [keyName, keySecret] = apiKey.split(':');
	if (!keyName || !keySecret) {
		throw new Error('Invalid Ably API key format');
	}

	const now = Math.floor(Date.now() / 1000);

	const claims: Record<string, unknown> = {
		'x-ably-capability': JSON.stringify(capability),
		iat: now,
		exp: now + 3600
	};

	if (clientId) {
		claims['x-ably-clientId'] = clientId;
	}

	const header = base64url(JSON.stringify({ typ: 'JWT', alg: 'HS256', kid: keyName }));
	const payload = base64url(JSON.stringify(claims));
	const signature = base64url(
		createHmac('sha256', keySecret).update(`${header}.${payload}`).digest()
	);

	return `${header}.${payload}.${signature}`;
}
