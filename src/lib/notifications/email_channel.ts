import { sendEmail } from '$lib/emails/send_email_utils';
import type { NotificationIntent, NotificationChannel } from './dispatcher';

/**
 * Convert an intent's loosely-typed `data` into the string map `sendEmail` expects.
 */
function toEmailData(data: NotificationIntent['data']): Record<string, string> {
	const emailData: Record<string, string> = {};
	if (data) {
		for (const [key, value] of Object.entries(data)) emailData[key] = String(value);
	}
	return emailData;
}

/**
 * The email adapter at the notification dispatch seam. A thin wrapper over the
 * existing {@link sendEmail} (locale resolution, multi-language templates, Resend
 * — all unchanged). Synchronous, in-process, best-effort: `sendEmail` swallows
 * its own per-recipient failures, so a non-zero `failed` count here only reflects
 * an outright rejection of the send call.
 *
 * A future durable `OutboxChannel` can be swapped behind {@link NotificationChannel}
 * without touching any dispatcher caller.
 */
export const EmailChannel: NotificationChannel = {
	async send(intents: NotificationIntent[]): Promise<{ sent: number; failed: number }> {
		let sent = 0;
		let failed = 0;

		for (const intent of intents) {
			// The dispatcher only routes email-enabled intents that carry a link.
			if (!intent.link) continue;
			try {
				await sendEmail(
					intent.userIds,
					intent.type,
					intent.link,
					toEmailData(intent.data),
					intent.actorName,
					intent.translationKey,
				);
				sent += 1;
			} catch (err) {
				failed += 1;
				console.error(`[EmailChannel] Failed to send email for type ${intent.type}:`, err);
			}
		}

		return { sent, failed };
	},
};
