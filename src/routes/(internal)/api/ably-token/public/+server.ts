import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { createAblyJwt } from '$lib/events/server/ably-jwt';

export const GET = async (event: RequestEvent) => {
	const competitionIdParam = event.url.searchParams.get('competitionId');
	if (!competitionIdParam) {
		return json({ error: 'Missing competitionId parameter' }, { status: 400 });
	}

	const competitionId = parseInt(competitionIdParam);
	if (isNaN(competitionId)) {
		return json({ error: 'Invalid competitionId' }, { status: 400 });
	}

	try {
		const competition = await prisma.competition.findUnique({
			where: { id: competitionId },
			select: { id: true }
		});

		if (!competition) {
			return json({ error: 'Competition not found' }, { status: 404 });
		}

		const channelName = `competition:${competitionId}`;
		const token = createAblyJwt({ [channelName]: ['subscribe'] });

		return new Response(token, {
			headers: { 'Content-Type': 'application/jwt', 'Cache-Control': 'no-store' }
		});
	} catch {
		return json({ error: 'Failed to generate token' }, { status: 500 });
	}
};
