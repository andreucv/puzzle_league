import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetition, getCompetitionCategories } from '$lib/database/database';
import { auth } from '$lib/auth';
import { getDuringCompetitionAccess } from '$lib/database/db_competition_utils';

export const load: PageServerLoad = async ({ params, request }) => {
    const competitionId = parseInt(params.id as string);

    if (isNaN(competitionId)) {
        throw error(400, 'Invalid competition ID');
    }

    // Auth: require login
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
        throw redirect(302, '/login');
    }
    const userId = session.user.id;

    const { isOrganizer, isJudge, judgedCategoryIds } = await getDuringCompetitionAccess(competitionId, userId);

    if (!isOrganizer && !isJudge) {
        throw error(403, 'You must be an organizer or judge for this competition');
    }

    const competition = await getCompetition(competitionId);
    const categories = await getCompetitionCategories(competitionId);

    if (!competition) {
        throw error(404, 'Competition not found');
    }

    return {
        props: {
            competition,
            categories,
            userRole: isOrganizer ? 'organizer' : 'judge',
            judgedCategoryIds
        }
    };
};
