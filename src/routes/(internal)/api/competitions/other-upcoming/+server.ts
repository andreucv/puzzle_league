import { json, type RequestHandler } from '@sveltejs/kit';
import { getOtherUpcomingCompetitions } from '$lib/database/db_competition';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

export const GET: RequestHandler = async (event) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const offsetParam = event.url.searchParams.get('offset');
	const limitParam = event.url.searchParams.get('limit');

	const offset = offsetParam ? parseInt(offsetParam, 10) : 0;
	const limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT;

	if (isNaN(offset) || offset < 0) {
		return json({ error: 'Invalid offset parameter' }, { status: 400 });
	}

	if (isNaN(limit) || limit < 1 || limit > MAX_LIMIT) {
		return json({ error: `Invalid limit parameter (must be 1–${MAX_LIMIT})` }, { status: 400 });
	}

	try {
		// Fetch one extra to determine if more results exist
		const competitions = await getOtherUpcomingCompetitions(user.id, limit + 1, offset);
		const hasMore = competitions.length > limit;
		const page = hasMore ? competitions.slice(0, limit) : competitions;

		return json({ competitions: page, hasMore });
	} catch (error) {
		console.error('Error fetching other upcoming competitions:', error);
		return json({ error: 'Failed to fetch competitions' }, { status: 500 });
	}
};
