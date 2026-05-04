import {
	hasMatchingUnclaimedExternalParticipants,
	markExternalParticipantsChecked
} from '$lib/database/db_user';

/** Onboarding steps the wizard can show. Order matters. */
export type OnboardingStep = 'language' | 'claim' | 'phone' | 'verify-email';

interface UserOnboardingContext {
	locale: string | null;
	localePromptLastChecked: Date | null;
	phoneNumber: string | null;
	phonePromptLastChecked: Date | null;
}

interface DbUserOnboardingContext {
	createdAt: Date;
	name: string | null;
	externalParticipantsLastChecked: Date | null;
	emailVerified: boolean;
	emailVerificationPromptLastChecked: Date | null;
	accounts: { id: string }[];
}

/**
 * Determines which onboarding steps are needed for a user.
 * Side-effect: marks intent-checking as done when no match is found
 * (so hooks don't re-evaluate on every request).
 */
export async function resolveOnboardingSteps(
	user: UserOnboardingContext & { id: string },
	dbUser: DbUserOnboardingContext | null
): Promise<OnboardingStep[]> {
	const steps: OnboardingStep[] = [];

	// Step 1: Language (if not yet set or prompted)
	if (!user.localePromptLastChecked && !user.locale) {
		steps.push('language');
	}

	// Step 2: Claim participations (only for new users with matching intents)
	if (dbUser && !dbUser.externalParticipantsLastChecked) {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		if (new Date(dbUser.createdAt) > fiveMinutesAgo) {
			const userName = dbUser.name;
			if (userName) {
				const hasMatch = await hasMatchingUnclaimedExternalParticipants(userName);
				if (hasMatch) {
					steps.push('claim');
				} else {
					await markExternalParticipantsChecked(user.id);
				}
			} else {
				await markExternalParticipantsChecked(user.id);
			}
		} else {
			await markExternalParticipantsChecked(user.id);
		}
	}

	// Step 3: Phone (if not yet set or prompted)
	if (!user.phonePromptLastChecked && !user.phoneNumber) {
		steps.push('phone');
	}

	// Step 4: Email verification (email/password users only, not yet verified or skipped)
	const isEmailPasswordUser = dbUser ? dbUser.accounts.length > 0 : false;
	if (
		isEmailPasswordUser &&
		dbUser &&
		!dbUser.emailVerified &&
		!dbUser.emailVerificationPromptLastChecked
	) {
		steps.push('verify-email');
	}

	return steps;
}
