import { json, type RequestEvent } from '@sveltejs/kit';
import { getCompetition, updateCompetition } from '$lib/database';
import { Role } from '@prisma/client';
import { requireCompetitionRole } from '$lib/utils/api_auth';

export const POST = async (event: RequestEvent) => {
	try {
		const competitionId = parseInt(event.params.id as string);

		if (isNaN(competitionId)) {
			return json({ error: 'Invalid competition ID' }, { status: 400 });
		}

		const auth = await requireCompetitionRole(event, competitionId, [Role.ORGANIZER]);
		if (!auth.authorized) return auth.response;

		const competition = await getCompetition(competitionId);
		if (!competition) {
			return json({ error: 'Competition not found' }, { status: 404 });
		}

		const result = await updateCompetition(competitionId, {
			registrationOpen: !competition.registrationOpen
		});

		if (!result.success) {
			return json({ error: result.message }, { status: 500 });
		}

		return json({ competition: result.data?.competition });
	} catch (error) {
		console.error('Error toggling registration:', error);
		return json({ error: 'Failed to toggle registration status' }, { status: 500 });
	}
};
