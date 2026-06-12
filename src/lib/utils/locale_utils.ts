import { prisma } from '$lib/database/create_prisma_client';
import { invalidateUserWithRolesCache } from '$lib/database/db_user';

export const SUPPORTED_LOCALES = ['en', 'es', 'ca'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function isValidLocale(locale: string): locale is SupportedLocale {
	return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}

export async function saveLocaleForUser(userId: string, locale: string | null): Promise<void> {
	await prisma.user.update({
		where: { id: userId },
		data: {
			locale,
			localePromptLastChecked: new Date(),
		},
	});
	await invalidateUserWithRolesCache(userId);
}

export async function skipLocalePrompt(userId: string): Promise<void> {
	await prisma.user.update({
		where: { id: userId },
		data: {
			localePromptLastChecked: new Date(),
		},
	});
	await invalidateUserWithRolesCache(userId);
}
