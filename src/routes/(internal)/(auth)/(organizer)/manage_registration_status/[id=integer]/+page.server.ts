import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCompetition, getCompetitionCategories } from '$lib/database';
import { auth } from '$lib/auth';

export const load: PageServerLoad = async ({ params, request }) => {
	const competitionId = parseInt(params.id as string);

	if (isNaN(competitionId)) {
		throw error(400, 'Invalid competition ID');
	}

	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const competition = await getCompetition(competitionId);

	if (!competition) {
		throw error(404, 'Competition not found');
	}

	if (competition.creatorId !== session.user.id) {
		throw error(403, 'You are not the creator of this competition');
	}

	const categories = await getCompetitionCategories(competitionId);

	return {
		props: {
			competition,
			categories
		}
	};
};
