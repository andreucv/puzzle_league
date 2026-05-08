import { RESEND_API_KEY, RESEND_FROM_EMAIL } from '$env/static/private';
import { Resend } from 'resend';
import { buildMultiLanguageEmail } from './email_template';
import type { EmailTranslation } from './email_translations';

/** Maps Better Auth provider IDs to user-friendly display names. */
const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
	google: 'Google',
};

const resend = new Resend(RESEND_API_KEY);

export type SendPasswordResetEmailResult =
	| { success: true }
	| { success: false; error: string };

/** Shared send logic: builds HTML from translations, sends via Resend, and normalises errors. */
async function sendPasswordEmail(
	to: string,
	translations: EmailTranslation[],
	actionUrl: string,
	logLabel: string,
): Promise<SendPasswordResetEmailResult> {
	try {
		const html = buildMultiLanguageEmail(translations, actionUrl);
		const subject = translations.map((t) => t.title).join(' / ');

		await resend.emails.send({
			from: RESEND_FROM_EMAIL,
			to,
			subject,
			html,
		});

		return { success: true };
	} catch (err) {
		console.error(`[${logLabel}] Failed to send email:`, err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}

/**
 * Lightweight email sender for password-reset emails.
 *
 * Like `sendVerificationEmail`, this does NOT look up the user in the
 * database — the caller provides the email directly. Sends a tri-lingual
 * email (ca → es → en) because at this point in the flow the user has
 * not authenticated and their locale preference is not available.
 */
export async function sendPasswordResetEmail(
	to: string,
	resetUrl: string,
	hasSocialProvider = false,
): Promise<SendPasswordResetEmailResult> {

	const translations: EmailTranslation[] = [
		{
			locale: 'ca',
			languageName: 'Català',
			title: 'Restableix la teva contrasenya',
			message: 'Fes clic al botó per restablir la contrasenya del teu compte a Puzzle League.',
			buttonText: 'Restablir contrasenya',
		},
		{
			locale: 'es',
			languageName: 'Español',
			title: 'Restablece tu contrasenya',
			message: 'Haz clic en el botón para restablecer la contraseña de tu cuenta en Puzzle League.',
			buttonText: 'Restablecer contraseña',
		},
		{
			locale: 'en',
			languageName: 'English',
			title: 'Reset your password',
			message: 'Click the button below to reset your password for Puzzle League.',
            buttonText: 'Reset password',
		},
	];

	return sendPasswordEmail(to, translations, resetUrl, 'sendPasswordResetEmail');
}

/**
 * Send an informational email to social-only accounts that request a password reset.
 * Explains that their account is linked to a social provider and provides a
 * link to the login page instead of a reset link.
 */
export async function sendSocialOnlyPasswordResetEmail(
	to: string,
	providerIds: string[],
): Promise<SendPasswordResetEmailResult> {
	const providerNames = providerIds
		.map((id) => PROVIDER_DISPLAY_NAMES[id] ?? id)
		.join(', ');

	const translations: EmailTranslation[] = [
		{
			locale: 'ca',
			languageName: 'Català',
			title: 'Sol·licitud de restabliment de contrasenya',
			message: `Hem rebut una sol·licitud per restablir la contrasenya del teu compte a Puzzle League.\n\nEl teu compte està vinculat a ${providerNames}. No cal restablir cap contrasenya — pots iniciar sessió directament amb el teu proveïdor.`,
			buttonText: 'Anar a iniciar sessió',
		},
		{
			locale: 'es',
			languageName: 'Español',
			title: 'Solicitud de restablecimiento de contraseña',
			message: `Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en Puzzle League.\n\nTu cuenta está vinculada a ${providerNames}. No es necesario restablecer ninguna contraseña — puedes iniciar sesión directamente con tu proveedor.`,
			buttonText: 'Ir a iniciar sesión',
		},
		{
			locale: 'en',
			languageName: 'English',
			title: 'Password reset request',
			message: `We received a request to reset your password for Puzzle League.\n\nYour account is linked to ${providerNames}. No password reset is needed — you can sign in directly with your provider.`,
			buttonText: 'Go to login',
		},
	];

	return sendPasswordEmail(to, translations, '/login', 'sendSocialOnlyPasswordResetEmail');
}
