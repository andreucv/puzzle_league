import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getOnboardingFlags, getUnclaimedExternalParticipantsMatchingName, claimExternalParticipants, markExternalParticipantsChecked, markEmailVerificationSkipped, saveLocationForUser, skipLocationPrompt } from '$lib/database/db_user';
import { saveLocaleForUser, skipLocalePrompt, isValidLocale } from '$lib/utils/locale_utils';
import { validatePhone, savePhoneForUser } from '$lib/utils/phone_utils';
import { countries } from '$lib/utils/country_utils';
import { resolveOnboardingSteps } from '$lib/utils/onboarding_utils';
import { auth } from '$lib/auth';

export const load: PageServerLoad = async ({ parent, locals, cookies }) => {
	const { user } = await parent();

	// Mark that the user has been presented onboarding so hooks.server.ts
	// won't block navigation if they choose to leave (all steps are optional).
	cookies.set('onboarding_presented', locals.session.id, { path: '/', httpOnly: true, sameSite: 'lax' });

	const steps = await resolveOnboardingSteps(user);
	// If no onboarding steps needed, clear the cookie and redirect to home
	if (steps.length === 0) {
		throw redirect(302, '/');
	}

	// Load unclaimed external participants matching the user's name for the claim step
	const unclaimedExternalParticipants = steps.includes('claim')
		? await getUnclaimedExternalParticipantsMatchingName(locals.user!.name!)
		: [];

	return {
		steps,
		unclaimedExternalParticipants,
		userName: locals.user!.name,
		userEmail: locals.user!.email,
	};
};

export const actions: Actions = {
	saveLocale: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const locale = formData.get('locale')?.toString().trim() || null;

		if (locale && !isValidLocale(locale)) {
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

	saveLocation: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const country = formData.get('country')?.toString().trim() || null;
		const postalCode = formData.get('postalCode')?.toString().trim() || null;

		if (country && !countries.some(c => c.code === country)) {
			return fail(400, { locationError: 'Please select a valid country.' });
		}

		try {
			await saveLocationForUser(user.id, country, postalCode);
		} catch (err) {
			console.error('Error saving location:', err);
			return fail(500, { error: 'Unable to save your location. Please try again.' });
		}

		return { success: true, action: 'saveLocation' };
	},

	skipLocation: async ({ locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		try {
			await skipLocationPrompt(user.id);
		} catch (err) {
			console.error('Error marking location prompt as seen:', err);
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}

		return { success: true, action: 'skipLocation' };
	},

	claimIntents: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const idsRaw = formData.get('externalParticipantIds')?.toString() ?? '';
		const externalParticipantIds = idsRaw ? idsRaw.split(',').filter(Boolean) : [];

		if (externalParticipantIds.length === 0) {
			return fail(400, { claimError: 'No participations selected.' });
		}

		try {
			const result = await claimExternalParticipants(user.id, externalParticipantIds);

			// Send notifications (non-blocking, best-effort)
			const { createNotification } = await import('$lib/notifications/notifications');
			const { NotificationType } = await import('$lib/.prisma/generated/prisma/enums');
			for (const ep of result) {
				await createNotification({
					userId: ep.createdById,
					type: NotificationType.EXTERNAL_PARTICIPANT_CLAIMED,
					title: 'notifications.titles.external_participant_claimed',
					message: 'notifications.messages.external_participant_claimed',
					link: '/competitions/explore_competitions',
					data: { externalParticipantName: ep.name },
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
			await markExternalParticipantsChecked(user.id);
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

	resendVerificationEmail: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) return fail(401, { resendError: 'Unauthorized' });

		try {
			await auth.api.sendVerificationEmail({
				body: { email: user.email, callbackURL: '/verify-email' },
				headers: request.headers,
			});
		} catch (err) {
			console.error('Error resending verification email:', err);
			return fail(500, { resendError: 'Failed to send verification email. Please try again later.' });
		}

		return { success: true, action: 'resendVerificationEmail' };
	},
};
