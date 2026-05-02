import type { NotificationType } from '$lib/.prisma/generated/prisma/enums';

/** Map NotificationType enum values to the translation key suffix. */
const NOTIFICATION_TYPE_KEY: Record<string, string> = {
	INSCRIPTION_CREATED: 'inscription_created',
	INSCRIPTION_CONFIRMED: 'inscription_confirmed',
	INSCRIPTION_CONFIRMED_TEAM: 'inscription_confirmed_team',
	INSCRIPTION_CONFIRMED_NONPLATFORM: 'inscription_confirmed_nonplatform',
	INSCRIPTION_REFUSED: 'inscription_refused',
	INSCRIPTION_WAITLISTED: 'inscription_waitlisted',
	COMPETITION_STARTED: 'competition_started',
	COMPETITION_CANCELLED: 'competition_cancelled',
	ROLE_REQUEST_APPROVED: 'role_request_approved',
	ROLE_REQUEST_REJECTED: 'role_request_rejected',
	USER_INTENT_CLAIMED: 'user_intent_claimed',
	TABLE_ASSIGNED: 'table_assigned',
	PAYMENT_REMINDER: 'payment_reminder',
	GENERAL: 'general',
};

/** Language display names shown in multi-language email headers. */
const LANGUAGE_NAMES: Record<string, string> = {
	ca: 'Català',
	es: 'Español',
	en: 'English',
};

/**
 * Load translation strings for a single locale by dynamically importing
 * the JSON file. Works server-side without depending on the SvelteKit
 * request-scoped i18n store.
 */
async function loadTranslationsForLocale(locale: string): Promise<Record<string, unknown>> {
	switch (locale) {
		case 'en':
			return (await import('$lib/translations/en/common.json')).default;
		case 'es':
			return (await import('$lib/translations/es/common.json')).default;
		case 'ca':
			return (await import('$lib/translations/ca/common.json')).default;
		default:
			return (await import('$lib/translations/en/common.json')).default;
	}
}

/**
 * Resolve a dot-separated key from a nested object.
 * e.g. resolveKey(obj, 'notifications.titles.inscription_confirmed')
 */
function resolveKey(obj: Record<string, unknown>, key: string): string | undefined {
	let current: unknown = obj;
	for (const part of key.split('.')) {
		if (current == null || typeof current !== 'object') return undefined;
		current = (current as Record<string, unknown>)[part];
	}
	return typeof current === 'string' ? current : undefined;
}

/**
 * Interpolate {{variable}} placeholders in a template string.
 */
function interpolate(template: string, data: Record<string, string>): string {
	return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

export interface EmailTranslation {
	locale: string;
	languageName: string;
	title: string;
	message: string;
	buttonText?: string;
}

/**
 * Resolve email title and message for a notification type in a given locale.
 */
export async function resolveEmailTranslation(
	locale: string,
	type: NotificationType,
	data: Record<string, string>,
	translationKey?: string,
): Promise<EmailTranslation> {
	const translations = await loadTranslationsForLocale(locale);
	const keySuffix = translationKey ?? NOTIFICATION_TYPE_KEY[type] ?? 'general';

	const titleKey = `notifications.titles.${keySuffix}`;
	const messageKey = `notifications.messages.${keySuffix}`;

	const rawTitle = resolveKey(translations, titleKey) ?? keySuffix;
	const rawMessage = resolveKey(translations, messageKey) ?? '';

	return {
		locale,
		languageName: LANGUAGE_NAMES[locale] ?? locale,
		title: interpolate(rawTitle, data),
		message: interpolate(rawMessage, data),
	};
}

/**
 * Resolve translations for all fallback locales (ca → es → en).
 * Used when a user has no stored locale preference.
 */
export async function resolveMultiLanguageTranslations(
	type: NotificationType,
	data: Record<string, string>,
	translationKey?: string,
): Promise<EmailTranslation[]> {
	const locales = ['ca', 'es', 'en'];
	return Promise.all(locales.map((locale) => resolveEmailTranslation(locale, type, data, translationKey)));
}
