import type { PageServerLoad, Actions } from './$types';
import { getUserAccountProvider, updateUserLocation, updateUserName, updateUserVisibility, updateUserLocale } from '$lib/database/db_user';
import { error, fail } from '@sveltejs/kit';
import { savePhoneForUser, deletePhoneForUser } from '$lib/utils/phone_utils';
import { validatePhone, validatePostalCode } from '$lib/utils/contact_validation';
import { locales } from '$lib/translations';
import { auth } from '$lib/auth';

const MAX_PROFILE_NAME_LENGTH = 80;

function validateProfileName(formData: FormData) {
    const name = formData.get('name')?.toString().trim() || '';

    if (!name) {
        return { error: 'profile.name_required' };
    }

    if (name.length > MAX_PROFILE_NAME_LENGTH) {
        return { error: 'profile.name_too_long' };
    }

    return { name };
}

export const load: PageServerLoad = async ({ parent }) => {

	const { user } = await parent();

    try {
        const account = await getUserAccountProvider(user.id);
        return { account };
    } catch (err) {
        console.error('Error loading profile:', err);
        throw error(500, { message: 'Unable to load your profile. Please try again later.', code: 'DB_ERROR' });
    }
};

export const actions: Actions = {
    updateName: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const result = validateProfileName(formData);

        if ('error' in result) {
            return fail(400, { message: result.error });
        }

        try {
            await updateUserName(user.id, result.name);

            return { success: true };
        } catch (err) {
            console.error('Error updating name:', err);
            return fail(500, { message: 'Unable to save your name. Please try again.' });
        }
    },

    updateLocation: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const country = formData.get('country')?.toString().trim() || null;
        const postalCode = formData.get('postalCode')?.toString().trim() || null;
        const postalCodeResult = validatePostalCode(postalCode);

        if (!postalCodeResult.valid) {
            return fail(400, { message: postalCodeResult.error });
        }

        try {
            await updateUserLocation(user.id, country, postalCodeResult.postalCode);

            return { success: true };
        } catch (err) {
            console.error('Error updating location:', err);
            return fail(500, { message: 'Unable to save your location. Please try again.' });
        }
    },

    updatePhone: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const result = validatePhone(formData, false);

        if (!result.valid) {
            return fail(400, { phoneError: result.error });
        }

        try {
            await savePhoneForUser(user.id, result.phonePrefix, result.phoneNumber);
            return { success: true };
        } catch (err) {
            console.error('Error updating phone:', err);
            return fail(500, { message: 'Unable to save your phone. Please try again.' });
        }
    },

    deletePhone: async ({ locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        try {
            await deletePhoneForUser(user.id);
            return { success: true };
        } catch (err) {
            console.error('Error deleting phone:', err);
            return fail(500, { message: 'Unable to delete your phone. Please try again.' });
        }
    },

    updateVisibility: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const field = formData.get('field')?.toString();
        const value = formData.get('value')?.toString() === 'true';

        if (field !== 'publicProfileVisibility' && field !== 'publicResultsVisibility') {
            return fail(400, { message: 'Invalid visibility field' });
        }

        try {
            await updateUserVisibility(user.id, field, value);

            return { success: true };
        } catch (err) {
            console.error('Error updating visibility:', err);
            return fail(500, { message: 'Unable to update visibility setting. Please try again.' });
        }
    },

    updateLocale: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const locale = formData.get('locale')?.toString()?.trim() || null;

        if (locale) {
            const supportedLocales = locales.get().map((l) => l.toLowerCase());
            if (!supportedLocales.includes(locale.toLowerCase())) {
                return fail(400, { message: 'Invalid locale' });
            }
        }

        try {
            await updateUserLocale(user.id, locale);

            return { success: true };
        } catch (err) {
            console.error('Error updating locale:', err);
            return fail(500, { message: 'Unable to update language. Please try again.' });
        }
    },

    resendVerificationEmail: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        if (user.emailVerified) {
            return { success: true };
        }

        try {
            await auth.api.sendVerificationEmail({
                body: { email: user.email, callbackURL: '/verify-email' },
                headers: request.headers,
            });

            return { success: true };
        } catch (err) {
            console.error('Error resending verification email:', err);
            return fail(500, { message: 'profile.email_verification_send_error' });
        }
    }
};
