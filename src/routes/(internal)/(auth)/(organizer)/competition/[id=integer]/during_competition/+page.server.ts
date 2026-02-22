import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { getCompetition, getCompetitionCategories } from '$lib/database/database';

export const load: PageServerLoad = async ({ params }) => {
    const competitionId = parseInt(params.id as string);

    const competition = await getCompetition(competitionId)
    const categories  = await getCompetitionCategories(competitionId)

    if (isNaN(competitionId)) {
        throw error(400, 'Invalid competition ID');
    }

    return {
        props: {
            competition,
            categories,
        }
    };
};


export const actions = {
    recordFinish: async ({ request, params }) => {
        const formData = await request.formData();
        const tableNumber = formData.get('tableNumber') as string;
        const entryId = formData.get('entryId') as string;
        const finishTime = formData.get('currentTime') as string;

        console.log('Recording finish:', {
            competitionId: params.id,
            tableNumber,
            entryId,
            finishTime
        });
    }
};
