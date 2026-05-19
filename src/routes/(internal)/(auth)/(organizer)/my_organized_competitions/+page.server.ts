import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getOrganisedCompetitions } from '$lib/database/db_competition';

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) {
        throw error(401, { message: 'User not authenticated', code: 'AUTH_REQUIRED' });
    }

    try {
        const organised_competitions = await getOrganisedCompetitions(locals.user.id);
        return {
            props: {
                organised_competitions
            }
        };
    } catch (err) {
        console.error('Error loading organized competitions:', err);
        throw error(500, { message: 'Unable to load your competitions. Please try again later.', code: 'DB_ERROR' });
    }
};
