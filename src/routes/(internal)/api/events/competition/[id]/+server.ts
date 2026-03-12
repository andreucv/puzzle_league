import { json, type RequestEvent } from '@sveltejs/kit';
import { requireCompetitionRole } from '$lib/utils/api_auth';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import { handlePollRequest } from '$lib/events/server/response-handler';

export const GET = async (event: RequestEvent) => {
	const competitionId = parseInt(event.params.id as string);

	if (isNaN(competitionId)) {
		return json({ error: 'Invalid competition ID' }, { status: 400 });
	}

	const auth = await requireCompetitionRole(event, competitionId, [Role.ORGANIZER, Role.JUDGE]);
	if (!auth.authorized) return auth.response;

	return handlePollRequest(event, 'competition', { id: competitionId });
};
