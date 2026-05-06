import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '$env/static/private';
import { Resend } from 'resend';
import { buildSingleLanguageEmail, buildMultiLanguageEmail } from './email_template';
import type { EmailTranslation } from './email_translations';

const resend = new Resend(RESEND_API_KEY);

/**
 * Lightweight email sender for verification emails.
 *
 * Unlike `sendEmail()` in send_email_utils.ts, this does NOT look up the
 * user in the database — the caller provides the email and locale directly.
 * This is necessary because at signup time the user may not have a stored
 * locale yet.
 *
 * Sends a tri-lingual email (ca → es → en) since the user has not chosen
 * a language at this point in the flow.
 */
export type SendVerificationEmailResult =
	| { success: true }
	| { success: false; error: string };

export async function sendVerificationEmail(
	to: string,
	verificationUrl: string,
): Promise<SendVerificationEmailResult> {
	try {
		const translations: EmailTranslation[] = [
			{
				locale: 'ca',
				languageName: 'Català',
				title: 'Verifica el teu correu electrònic',
				message: 'Fes clic al botó per verificar la teva adreça de correu electrònic a Puzzle League.',
				buttonText: 'Verificar correu',
			},
			{
				locale: 'es',
				languageName: 'Español',
				title: 'Verifica tu correo electrónico',
				message: 'Haz clic en el botón para verificar tu dirección de correo electrónico en Puzzle League.',
				buttonText: 'Verificar correo',
			},
			{
				locale: 'en',
				languageName: 'English',
				title: 'Verify your email address',
				message: 'Click the button below to verify your email address for Puzzle League.',
				buttonText: 'Verify email',
			},
		];

		const html = buildMultiLanguageEmail(translations, verificationUrl);
		const subject = translations.map((t) => t.title).join(' / ');

		await resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to,
			subject,
			html,
		});

		return { success: true };
	} catch (err) {
		console.error('[sendVerificationEmail] Failed to send verification email:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}
