import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetitionResults } from '$lib/database/database';

export const load: PageServerLoad = async ({ params }) => {
    const competitionId = parseInt(params.id as string);

    if (isNaN(competitionId)) {
        throw error(400, 'Invalid competition ID');
    }

    const competition = await getCompetitionResults(competitionId);

    if (!competition) {
        throw error(404, 'Competition not found');
    }

    return {
        competition
    };
};
