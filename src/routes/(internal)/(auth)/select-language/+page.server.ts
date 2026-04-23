import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { saveLocaleForUser, skipLocalePrompt, isValidLocale } from '$lib/utils/locale_utils';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	if (user.localePromptLastChecked || user.locale) {
		throw redirect(302, '/');
	}

	return {};
};

export const actions: Actions = {
	saveLocale: async ({ request, locals, cookies }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const locale = formData.get('locale')?.toString().trim() ?? '';

		if (!isValidLocale(locale)) {
			return fail(400, { localeError: 'Please select a valid language.' });
		}

		try {
			await saveLocaleForUser(user.id, locale);
			cookies.set('lang', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
		} catch (err) {
			console.error('Error saving locale:', err);
			return fail(500, { message: 'Unable to save your preference. Please try again.' });
		}

		throw redirect(302, '/');
	},

	skip: async ({ locals }) => {
		const user = locals.user;
		if (!user) {
			return fail(401, { message: 'Unauthorized' });
		}

		try {
			await skipLocalePrompt(user.id);
		} catch (err) {
			console.error('Error marking locale prompt as seen:', err);
			return fail(500, { message: 'Something went wrong. Please try again.' });
		}

		throw redirect(302, '/');
	},
};
