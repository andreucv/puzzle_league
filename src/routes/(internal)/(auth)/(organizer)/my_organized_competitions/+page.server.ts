import type { PageServerLoad } from './$types';
import { getOrganisedCompetitions } from '$lib/database';
import { auth } from '$lib/auth';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({request}) => {
    let userId = null;
    try {
        const session = await auth.api.getSession({
            headers: request.headers,
        });
        userId = session?.user.id;
    } catch (error) {
        console.error('Error getting user session:', error);
        return fail(401, { error_message: "User not authenticated" });
    }

    const organised_competitions = await getOrganisedCompetitions(String(userId));
    return {
        props: {
            organised_competitions
        }
    };
};
