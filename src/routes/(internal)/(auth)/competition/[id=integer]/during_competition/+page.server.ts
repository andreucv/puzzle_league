import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetition, getCompetitionCategories } from '$lib/database/db_competition';
import { buildEventStateFromCategories } from '$lib/events/channels/competition';
import { isAutoStopAvailable } from '$lib/services/auto-stop-singleton';

export const load: PageServerLoad = async ({ parent }) => {
    const { competitionId, access } = await parent();

    if (!access.canManageCompetition && !access.isJudge) {
        throw error(403, 'You must be an organizer or judge for this competition');
    }

    const [competition, categories] = await Promise.all([
        getCompetition(competitionId),
        getCompetitionCategories(competitionId)
    ]);

    if (!competition) {
        throw error(404, 'Competition not found');
    }

    const initialEventState = buildEventStateFromCategories(categories);

    return {
        props: {
            competition,
            categories,
            userRole: access.canManageCompetition ? 'organizer' : 'judge',
            judgedCategoryIds: access.judgedCategoryIds,
            initialEventState,
            autoStopAvailable: isAutoStopAvailable()
        }
    };
};
