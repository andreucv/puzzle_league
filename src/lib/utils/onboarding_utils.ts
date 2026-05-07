import {
	hasMatchingUnclaimedExternalParticipants,
	markExternalParticipantsChecked,
	getOnboardingFlags
} from '$lib/database/db_user';

/** Onboarding steps the wizard can show. Order matters. */
export type OnboardingStep = 'language' | 'location' | 'claim' | 'phone' | 'verify-email';

/**
 * Determines which onboarding steps are needed for a user.
 * Side-effect: marks intent-checking as done when no match is found
 * (so hooks don't re-evaluate on every request).
 */
export async function resolveOnboardingSteps(
	user: { id: string },
): Promise<OnboardingStep[]> {
	const dbUser = await getOnboardingFlags(user.id);

	const steps: OnboardingStep[] = [];

	// Step 1: Language (if not yet set or prompted)
	if (dbUser && !dbUser.localePromptLastChecked && !dbUser.locale) {
		steps.push('language');
	}

	// Step 2: Location (if not yet set or prompted)
	if (dbUser && !dbUser.locationPromptLastChecked && !dbUser.country) {
		steps.push('location');
	}

	// Step 3: Phone (if not yet set or prompted)
	if (dbUser && !dbUser.phonePromptLastChecked && !dbUser.phoneNumber) {
		steps.push('phone');
	}

	// Step 4: Claim participations (only for new users with matching intents)
	if (dbUser && !dbUser.externalParticipantsLastChecked) {
		const userName = dbUser.name;
		if (userName) {
			const hasMatch = await hasMatchingUnclaimedExternalParticipants(userName);
			if (hasMatch) {
				steps.push('claim');
			}
		}
		await markExternalParticipantsChecked(user.id);
	}

	// Step 5: Email verification (email/password users only, not yet verified or skipped)
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
