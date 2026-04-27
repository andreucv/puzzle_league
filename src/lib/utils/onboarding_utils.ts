import { prisma } from '$lib/database/create_prisma_client';

/**
 * Checks whether a user has any incomplete onboarding steps.
 *
 * This is the single source of truth for the onboarding redirect guard
 * in hooks.server.ts. The wizard page (onboarding/+page.server.ts) uses
 * the same conditions to determine which steps to show.
 *
 * When adding a new onboarding step, update the query select and add
 * a new condition here — hooks.server.ts needs no changes.
 */
export async function hasIncompleteOnboarding(userId: string): Promise<boolean> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			locale: true,
			localePromptLastChecked: true,
			phoneNumber: true,
			phonePromptLastChecked: true,
			userIntentsLastChecked: true,
		},
	});

	if (!user) return false;

	const needsLocale = !user.localePromptLastChecked && !user.locale;
	const needsPhone = !user.phonePromptLastChecked && !user.phoneNumber;
	const needsIntentCheck = !user.userIntentsLastChecked;

	return needsLocale || needsPhone || needsIntentCheck;
}
