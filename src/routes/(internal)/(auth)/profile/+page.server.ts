import type { PageServerLoad, Actions } from './$types';
import { getUserAccountProvider, updateUserLocation, updateUserVisibility, updateUserLocale } from '$lib/database/db_user';
import { error, fail } from '@sveltejs/kit';
import { savePhoneForUser, deletePhoneForUser } from '$lib/utils/phone_utils';
import { validatePhone, validatePostalCode } from '$lib/utils/contact_validation';
import { locales } from '$lib/translations';

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

    updateLocale: async ({ request, locals, cookies }) => {
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
    }
};
