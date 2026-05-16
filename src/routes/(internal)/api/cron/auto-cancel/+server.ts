import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { autoCancelExpiredCompetitions } from '$lib/services/auto-cancel';

export const GET = async (event: RequestEvent) => {
	// Verify CRON_SECRET
	const authHeader = event.request.headers.get('authorization');
	const expectedToken = env.CRON_SECRET;

	if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Parse query parameters
	const url = new URL(event.request.url);
	const dryRun = url.searchParams.get('dryRun') === 'true';
	const competitionIdParam = url.searchParams.get('competitionId');

	let competitionId: number | undefined;
	if (competitionIdParam != null) {
		competitionId = parseInt(competitionIdParam, 10);
		if (isNaN(competitionId)) {
			return json({ error: 'Invalid competitionId — must be a number' }, { status: 400 });
		}
	}

	try {
		const result = await autoCancelExpiredCompetitions({ dryRun, competitionId });
		return json(result);
	} catch (error) {
		console.error('[auto-cancel] Unexpected error in cron handler:', error);
		return json(
			{ error: 'Internal server error' },
			{ status: 500 },
		);
	}
};
