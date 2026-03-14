import { getMonthCompetitions } from '$lib/database/database';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const month = parseInt(params.month, 10);
		const year = parseInt(params.year, 10);

		if (isNaN(month) || isNaN(year) || month < 0 || month > 11) {
			return json({ error: 'Invalid month or year' }, { status: 400 });
		}

		const competitions = await getMonthCompetitions(month, year);
		return json(competitions);
	} catch (error) {
		console.error('Error fetching competitions by month:', error);
		return json({ error: 'Failed to fetch competitions' }, { status: 500 });
	}
};
