import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { saveLocaleForUser, skipLocalePrompt, isValidLocale } from '$lib/utils/locale_utils';
import { validatePhone, savePhoneForUser } from '$lib/utils/phone_utils';

/** Onboarding steps the wizard can show. Order matters. */
export type OnboardingStep = 'language' | 'claim' | 'phone' | 'verify-email';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user } = await parent();

	// Query onboarding-specific flags not available via getUserWithRoles
	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: {
			userIntentsLastChecked: true,
			name: true,
			createdAt: true,
			emailVerified: true,
			emailVerificationPromptLastChecked: true,
			accounts: {
				where: { providerId: 'credential' },
				select: { id: true },
				take: 1,
			},
		},
	});

	// Determine which steps are needed
	const steps: OnboardingStep[] = [];

	// Step 1: Language (if not yet set or prompted)
	if (!user.localePromptLastChecked && !user.locale) {
		steps.push('language');
	}

	// Step 2: Claim participations (only for new users with matching intents)
	// Check if this user was already prompted for intents
	if (dbUser && !dbUser.userIntentsLastChecked) {
		const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
		if (new Date(dbUser.createdAt) > fiveMinutesAgo) {
			const userName = dbUser.name;
			if (userName) {
				const unclaimed = await prisma.userIntent.findMany({
					where: { claimedById: null },
					select: { name: true },
					take: 100,
				});
				const userNameLower = userName.toLowerCase();
				const hasMatch = unclaimed.some((ui) => {
					const intentNameLower = ui.name.toLowerCase();
					return intentNameLower.includes(userNameLower) || userNameLower.includes(intentNameLower);
				});
				if (hasMatch) {
					steps.push('claim');
				} else {
					// No matches — mark as checked so hooks don't re-evaluate
					await prisma.user.update({
						where: { id: user.id },
						data: { userIntentsLastChecked: new Date() },
					});
				}
			} else {
				// No user name — mark as checked
				await prisma.user.update({
					where: { id: user.id },
					data: { userIntentsLastChecked: new Date() },
				});
			}
		} else {
			// Not a new user — mark as checked
			await prisma.user.update({
				where: { id: user.id },
				data: { userIntentsLastChecked: new Date() },
			});
		}
	}

	// Step 3: Phone (if not yet set or prompted)
	if (!user.phonePromptLastChecked && !user.phoneNumber) {
		steps.push('phone');
	}

	// Step 4: Email verification (email/password users only, not yet verified or skipped)
	const isEmailPasswordUser = dbUser ? dbUser.accounts.length > 0 : false;
	if (isEmailPasswordUser && dbUser && !dbUser.emailVerified && !dbUser.emailVerificationPromptLastChecked) {
		steps.push('verify-email');
	}

	// If no onboarding steps needed, redirect to home
	if (steps.length === 0) {
		throw redirect(302, '/');
	}

	// Load unclaimed intents matching the user's name for the claim step
	const unclaimedIntents = steps.includes('claim')
		? await (async () => {
				const userName = dbUser!.name!;
				const userNameLower = userName.toLowerCase();
				const allUnclaimed = await prisma.userIntent.findMany({
					where: { claimedById: null },
					include: {
						createdBy: { select: { id: true, name: true } },
						records: {
							include: {
								category: {
									include: {
										competition: { select: { id: true, name: true } },
									},
								},
							},
						},
					},
					orderBy: { createdAt: 'desc' },
				});
				return allUnclaimed.filter((ui) => {
					const intentNameLower = ui.name.toLowerCase();
					return intentNameLower.includes(userNameLower) || userNameLower.includes(intentNameLower);
				});
			})()
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
			// Reuse the same claim logic as /api/user-intents/claim
			const result = await prisma.$transaction(async (tx) => {
				const intents = await tx.userIntent.findMany({
					where: { id: { in: userIntentIds }, claimedById: null },
					include: {
						records: true,
						createdBy: { select: { id: true, name: true } },
					},
				});

				if (intents.length !== userIntentIds.length) {
					throw new Error('Some participations are already claimed or not found.');
				}

				for (const intent of intents) {
					await tx.userIntent.update({
						where: { id: intent.id },
						data: { claimedById: user.id },
					});

					for (const record of intent.records) {
						await tx.record.update({
							where: { id: record.id },
							data: {
								users: { connect: { id: user.id } },
								userIntents: { disconnect: { id: intent.id } },
							},
						});
					}
				}

				return intents;
			});

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
			await prisma.user.update({
				where: { id: user.id },
				data: { userIntentsLastChecked: new Date() },
			});
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
			await prisma.user.update({
				where: { id: user.id },
				data: { emailVerificationPromptLastChecked: new Date() },
			});
		} catch (err) {
			console.error('Error marking email verification as skipped:', err);
			return fail(500, { error: 'Something went wrong. Please try again.' });
		}

		return { success: true, action: 'skipEmailVerification' };
	},
};
