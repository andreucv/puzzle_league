import { SCW_SECRET_KEY, SCW_DEFAULT_PROJECT_ID } from '$env/static/private';
import { env } from '$env/dynamic/private';
import { mockSendScalewayEmail } from './scaleway_email.mock';

// ponytail: fr-par is the only region Scaleway TEM exposes today.
const SEND_URL = 'https://api.scaleway.com/transactional-email/v1alpha1/regions/fr-par/emails';

/**
 * Same shape as Resend's `emails.send()` payload, so migrating a call site is
 * `resend.emails.send({...})` → `sendScalewayEmail({...})`.
 * Addresses accept `"Name <email@x.com>"` or a bare `"email@x.com"`.
 */
export interface SendScalewayEmailParams {
	from: string;
	to: string | string[];
	cc?: string | string[];
	bcc?: string | string[];
	subject: string;
	html?: string;
	text?: string;
}

export interface ScalewayEmail {
	id: string;
	message_id: string;
	mail_rcpt: string;
	rcpt_type: 'to' | 'cc' | 'bcc' | 'unknown_rcpt_type';
	status: 'unknown' | 'new' | 'sending' | 'sent' | 'failed' | 'canceled';
	created_at: string;
}

type Address = { email: string; name?: string };

export function parseAddress(address: string): Address {
	const match = address.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
	if (!match) return { email: address.trim() };
	const name = match[1].replace(/^"|"$/g, '');
	return name ? { email: match[2].trim(), name } : { email: match[2].trim() };
}

const toAddresses = (value?: string | string[]) =>
	value === undefined ? undefined : [value].flat().map(parseAddress);

/**
 * Send an email through Scaleway Transactional Email.
 * Unlike Resend (which returns `{ error }`), this throws on any non-2xx response,
 * so existing `try/catch` blocks around the send keep catching failures.
 */
export async function sendScalewayEmail(params: SendScalewayEmailParams): Promise<ScalewayEmail[]> {
	// Runtime (not build-time) switch, so a cached e2e build can never send real emails.
	if (env.MOCK_EMAILS === 'true') return mockSendScalewayEmail(params);

	const response = await fetch(SEND_URL, {
		method: 'POST',
		headers: { 'X-Auth-Token': SCW_SECRET_KEY, 'Content-Type': 'application/json' },
		body: JSON.stringify({
			project_id: SCW_DEFAULT_PROJECT_ID,
			from: parseAddress(params.from),
			to: toAddresses(params.to),
			cc: toAddresses(params.cc),
			bcc: toAddresses(params.bcc),
			subject: params.subject,
			html: params.html,
			text: params.text,
		}),
	});

	const body = await response.json().catch(() => ({}));
	if (!response.ok) {
		// details names the offending field, e.g. from.email: "Email must be sent from a checked domain"
		const details = (body.details ?? [])
			.map((d: { argument_name?: string; help_message?: string }) => `${d.argument_name}: ${d.help_message}`)
			.join('; ');
		throw new Error(
			`Scaleway email failed (${response.status}): ${body.message ?? response.statusText}${details ? ` — ${details}` : ''}`,
		);
	}
	return body.emails;
}
