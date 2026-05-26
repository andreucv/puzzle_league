import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetition, getCompetitionCategories } from '$lib/database/db_competition';
import { getCompetitionAccess } from '$lib/services/competition-access';
import { buildEventStateFromCategories } from '$lib/events/channels/competition';

export const load: PageServerLoad = async ({ params, locals, url }) => {
    const competitionId = parseInt(params.id as string);

    if (isNaN(competitionId)) {
        throw error(400, 'Invalid competition ID');
    }

    const user = locals.user;
    if (!user) {
        throw redirect(302, '/login?redirect=' + encodeURIComponent(url.pathname));
    }

    const [access, competition, categories] = await Promise.all([
        getCompetitionAccess(competitionId, user.id),
        getCompetition(competitionId),
        getCompetitionCategories(competitionId)
    ]);

    if (!access.isOrganizer && !access.isJudge) {
        throw error(403, 'You must be an organizer or judge for this competition');
    }

    if (!competition) {
        throw error(404, 'Competition not found');
    }

    const initialEventState = buildEventStateFromCategories(categories);

    return {
        props: {
            competition,
            categories,
            userRole: access.isOrganizer ? 'organizer' : 'judge',
            judgedCategoryIds: access.judgedCategoryIds,
            initialEventState
        }
    };
};
