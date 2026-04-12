import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetition, getCompetitionCategories } from '$lib/database/database';
import { getDuringCompetitionAccess } from '$lib/database/db_competition_utils';

export const load: PageServerLoad = async ({ params, locals }) => {
    const competitionId = parseInt(params.id as string);

    if (isNaN(competitionId)) {
        throw error(400, 'Invalid competition ID');
    }

    const user = locals.user;
    if (!user) {
        throw redirect(302, '/login');
    }

    const [{ isOrganizer, isJudge, judgedCategoryIds }, competition, categories] = await Promise.all([
        getDuringCompetitionAccess(competitionId, user.id),
        getCompetition(competitionId),
        getCompetitionCategories(competitionId)
    ]);

    if (!isOrganizer && !isJudge) {
        throw error(403, 'You must be an organizer or judge for this competition');
    }

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
