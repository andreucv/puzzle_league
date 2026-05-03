import { json, type RequestEvent } from '@sveltejs/kit';
import { getCompetition, updateCompetition } from '$lib/database/db_competition';

export const POST = async (event: RequestEvent) => {
	try {
		const competitionId = parseInt(event.params.id as string);

		if (isNaN(competitionId)) {
			return json({ error: 'Invalid competition ID' }, { status: 400 });
		}

		const competition = await getCompetition(competitionId);
		if (!competition) {
			return json({ error: 'Competition not found' }, { status: 404 });
		}

		const result = await updateCompetition(competitionId, {
			registrationOpen: !competition.registrationOpen
		});

		if (!result.success) {
			return json({ error: result.message }, { status: 400 });
		}

		return json({ id: competitionId, registrationOpen: result.data?.competition?.registrationOpen });
	} catch (error) {
		console.error('Error toggling registration:', error);
		return json({ error: 'Failed to toggle registration status' }, { status: 500 });
	}
};
