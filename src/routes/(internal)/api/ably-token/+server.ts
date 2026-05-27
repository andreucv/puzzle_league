import { json, type RequestEvent } from '@sveltejs/kit';
import { getCompetitionAccess } from '$lib/services/competition-access';
import { createAblyJwt } from '$lib/events/server/ably-jwt';

export const GET = async (event: RequestEvent) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const competitionIdParam = event.url.searchParams.get('competitionId');
	if (!competitionIdParam) {
		return json({ error: 'Missing competitionId parameter' }, { status: 400 });
	}

	const competitionId = parseInt(competitionIdParam);
	if (isNaN(competitionId)) {
		return json({ error: 'Invalid competitionId' }, { status: 400 });
	}

	try {
		const access = await getCompetitionAccess(competitionId, user.id);

		const channelName = `competition:${competitionId}`;
		const capability =
			access.canManageCompetition || access.isJudge
				? { [channelName]: ['subscribe', 'publish'] }
				: { [channelName]: ['subscribe'] };

		const token = createAblyJwt(capability, user.id);

		return new Response(token, {
			headers: { 'Content-Type': 'application/jwt', 'Cache-Control': 'no-store' }
		});
	} catch {
		return json({ error: 'Failed to generate token' }, { status: 500 });
	}
};
