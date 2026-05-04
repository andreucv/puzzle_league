import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getOnboardingFlags, getUnclaimedIntentsMatchingName, claimUserIntents, markUserIntentsChecked, markEmailVerificationSkipped } from '$lib/database/db_user';
import { saveLocaleForUser, skipLocalePrompt, isValidLocale } from '$lib/utils/locale_utils';
import { validatePhone, savePhoneForUser } from '$lib/utils/phone_utils';
import { resolveOnboardingSteps } from './services/onboarding-flow';
export type { OnboardingStep } from './services/onboarding-flow';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();

	const dbUser = await getOnboardingFlags(user.id);

	const steps = await resolveOnboardingSteps(user, dbUser);

	// If no onboarding steps needed, redirect to home
	if (steps.length === 0) {
		throw redirect(302, '/');
	}

	// Load unclaimed intents matching the user's name for the claim step
	const unclaimedIntents = steps.includes('claim')
		? await getUnclaimedIntentsMatchingName(dbUser!.name!)
		: [];

	return {
		steps,
		unclaimedIntents,
		userName: dbUser?.name ?? '',
		userEmail: locals.user!.email,
	};
};

export const actions: Actions = {
	saveLocale: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const locale = formData.get('locale')?.toString().trim() ?? '';

		if (!isValidLocale(locale)) {
			return fail(400, { localeError: 'Please select a valid language.' });
		}

		try {
			await saveLocaleForUser(user.id, locale);
		} catch (err) {
			console.error('Error saving locale:', err);
			return fail(500, { error: 'Unable to save your preference. Please try again.' });
		}

		return { success: true, action: 'saveLocale' };
	},

	skipLocale: async ({ locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		try {
			await skipLocalePrompt(user.id);
		} catch (err) {
			console.error('Error marking locale prompt as seen:', err);
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}

		return { success: true, action: 'skipLocale' };
	},

	claimIntents: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const idsRaw = formData.get('userIntentIds')?.toString() ?? '';
		const userIntentIds = idsRaw ? idsRaw.split(',').filter(Boolean) : [];

		if (userIntentIds.length === 0) {
			return fail(400, { claimError: 'No participations selected.' });
		}

		try {
			const result = await claimUserIntents(user.id, userIntentIds);

			// Send notifications (non-blocking, best-effort)
			const { createNotification } = await import('$lib/notifications/notifications');
			const { NotificationType } = await import('$lib/.prisma/generated/prisma/enums');
			for (const intent of result) {
				await createNotification({
					userId: intent.createdById,
					type: NotificationType.USER_INTENT_CLAIMED,
					title: 'notifications.titles.user_intent_claimed',
					message: 'notifications.messages.user_intent_claimed',
					link: '/competitions/explore_competitions',
					data: { intentName: intent.name },
				});
			}
		} catch (err) {
			console.error('Error claiming intents:', err);
			return fail(400, {
				claimError: err instanceof Error ? err.message : 'Failed to claim participations.',
			});
		}

		return { success: true, action: 'claimIntents' };
	},

	skipClaim: async ({ locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		try {
			await markUserIntentsChecked(user.id);
		} catch (err) {
			console.error('Error marking claim as skipped:', err);
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}

		return { success: true, action: 'skipClaim' };
	},

	savePhone: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const result = validatePhone(formData, true);

		if (!result.valid) {
			return fail(400, { phoneError: result.error });
		}

		try {
			await savePhoneForUser(user.id, result.phonePrefix, result.phoneNumber);
		} catch (err) {
			console.error('Error saving phone:', err);
			return fail(500, { error: 'Unable to save your phone. Please try again.' });
		}

		return { success: true, action: 'savePhone' };
	},

	skipPhone: async ({ locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		try {
			await savePhoneForUser(user.id, '', '');
		} catch (err) {
			console.error('Error marking phone prompt as seen:', err);
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}

		return { success: true, action: 'skipPhone' };
	},

	skipEmailVerification: async ({ locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		try {
			await markEmailVerificationSkipped(user.id);
		} catch (err) {
			console.error('Error marking email verification as skipped:', err);
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}

		return { success: true, action: 'skipEmailVerification' };
	},
};
