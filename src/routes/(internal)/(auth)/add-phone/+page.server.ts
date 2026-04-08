import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { validatePhone, savePhoneForUser } from '$lib/utils/phone_utils';

export const load: PageServerLoad = async ({ parent }) => {
    const { user } = await parent();

    // If user already handled the prompt or has phone data, redirect to home
    if (user.phonePromptSeenAt || (user.phonePrefix && user.phoneNumber)) {
        throw redirect(302, '/');
    }

    return {};
};

export const actions: Actions = {
    savePhone: async ({ request, locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const result = validatePhone(formData, true);

        if (!result.valid) {
            return fail(400, { phoneError: result.error });
        }

        try {
            await savePhoneForUser(user.id, result.phonePrefix, result.phoneNumber);
        } catch (err) {
            console.error('Error saving phone:', err);
            return fail(500, { message: 'Unable to save your phone. Please try again.' });
        }

        throw redirect(302, '/');
    },

    skip: async ({ locals }) => {
        const user = locals.user;
        if (!user) {
            return fail(401, { message: 'Unauthorized' });
        }

        try {
            await savePhoneForUser(user.id, '', '');
        } catch (err) {
            console.error('Error marking phone prompt as seen:', err);
            return fail(500, { message: 'Something went wrong. Please try again.' });
        }

        throw redirect(302, '/');
    }
};
