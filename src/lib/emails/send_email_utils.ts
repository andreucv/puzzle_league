import { SCW_FROM_EMAIL } from '$env/static/private';
import { sendScalewayEmail } from './scaleway_email';
import { prisma } from '$lib/database/create_prisma_client';
import type { NotificationType } from '$prisma/enums';
import { resolveEmailTranslation, resolveMultiLanguageTranslations } from './email_translations';
import { buildSingleLanguageEmail, buildMultiLanguageEmail } from './email_template';

/**
 * Send an email notification to one or more users.
 *
 * - Users with a stored `locale` receive a single-language email.
 * - Users without a locale receive a tri-lingual email (ca → es → en).
 *
 * Failures are logged but never thrown so the calling endpoint is not blocked.
 */
export async function sendEmail(
	userIds: string[],
	type: NotificationType,
	link: string,
	data: Record<string, string>,
	actorName?: string,
	translationKey?: string,
): Promise<void> {
	try {
		const users = await prisma.user.findMany({
			where: { id: { in: userIds } },
			select: { id: true, email: true, locale: true },
		});

		const baseEmail = SCW_FROM_EMAIL.match(/<(.+)>/)?.[1] ?? SCW_FROM_EMAIL;
		const fromAddress = actorName
			? `${actorName} from PuzzLigas <${baseEmail}>`
			: SCW_FROM_EMAIL;

		// Pre-resolve multi-language translations once (shared by all no-locale users)
		let multiLangTranslations: Awaited<ReturnType<typeof resolveMultiLanguageTranslations>> | null = null;
		let multiLangHtml: string | null = null;
		let multiLangSubject: string | null = null;

		const sendPromises = users.map(async (user) => {
			try {
				let html: string;
				let subject: string;

				if (user.locale) {
					const translation = await resolveEmailTranslation(user.locale, type, data, translationKey);
					html = buildSingleLanguageEmail(translation, link);
					subject = translation.title;
				} else {
					// Lazy-init shared multi-language content
					if (!multiLangTranslations) {
						multiLangTranslations = await resolveMultiLanguageTranslations(type, data, translationKey);
						multiLangHtml = buildMultiLanguageEmail(multiLangTranslations, link);
						multiLangSubject = multiLangTranslations.map((t) => t.title).join(' / ');
					}
					html = multiLangHtml!;
					subject = multiLangSubject!;
				}

				await sendScalewayEmail({
					from: fromAddress,
					to: user.email,
					subject,
					html,
				});
			} catch (err) {
				console.error(`[sendEmail] Failed to send email to user ${user.id}:`, err);
			}
		});

		await Promise.all(sendPromises);
	} catch (err) {
		console.error('[sendEmail] Failed to process email batch:', err);
	}
}
