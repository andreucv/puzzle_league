import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getOrganisedCompetitions } from '$lib/database/database';
import { auth } from '$lib/auth';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({request}) => {
    let userId = null;
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });
        userId = session?.user.id;
    } catch (err) {
        console.error('Error getting user session:', err);
        return fail(401, { error_message: "User not authenticated" });
    }

    try {
        const organised_competitions = await getOrganisedCompetitions(String(userId));
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
