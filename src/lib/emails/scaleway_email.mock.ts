import type { ScalewayEmail, SendScalewayEmailParams } from './scaleway_email';

/**
 * Stand-in for Scaleway used when `MOCK_EMAILS=true` (set by e2e/e2e-server.ts).
 * Nothing leaves the process: it logs the email and returns a fake `sent` result
 * per recipient, shaped like the real API response.
 */
export function mockSendScalewayEmail(params: SendScalewayEmailParams): ScalewayEmail[] {
	const recipients = [params.to, params.cc ?? [], params.bcc ?? []].flat();
	console.log(`[mockSendScalewayEmail] "${params.subject}" → ${recipients.join(', ')}`);
	const now = new Date().toISOString();
	return recipients.map((rcpt, i) => ({
		id: `mock-${Date.now()}-${i}`,
		message_id: `mock-${Date.now()}-${i}`,
		mail_rcpt: rcpt,
		rcpt_type: 'to',
		status: 'sent',
		created_at: now,
	}));
}
