import { json, type RequestEvent } from '@sveltejs/kit';
import { handlePollRequest } from '$lib/events/server/response-handler';

export const GET = async (event: RequestEvent) => {
	try {
		const competitionId = parseInt(event.params.id as string);

		if (isNaN(competitionId)) {
			return json({ error: 'Invalid competition ID' }, { status: 400 });
		}

		return handlePollRequest(event, 'competition', { id: competitionId });
	} catch (error) {
		console.error('Error in competition events:', error);
		return json({ error: 'Failed to handle competition events' }, { status: 500 });
	}
};
