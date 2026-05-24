import type { PageServerLoad } from './$types';
import { getUserAccountProvider } from '$lib/database/db_user';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
    const { user } = await parent();

    try {
        const account = await getUserAccountProvider(user.id);
        return { account };
    } catch (err) {
        console.error('Error loading password profile page:', err);
        throw error(500, { message: 'Unable to load your profile. Please try again later.', code: 'DB_ERROR' });
    }
};
