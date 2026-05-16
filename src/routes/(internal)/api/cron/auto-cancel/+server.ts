import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { autoCancelExpiredCompetitions } from '$lib/services/auto-cancel';
import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$lib/.prisma/generated/prisma/enums';

export const GET = async (event: RequestEvent) => {
	// Accept either CRON_SECRET Bearer token or authenticated admin session
	const authHeader = event.request.headers.get('authorization');
	const expectedToken = env.CRON_SECRET;
	const hasCronSecret = expectedToken && authHeader === `Bearer ${expectedToken}`;

	let hasAdminSession = false;
	if (!hasCronSecret && event.locals.user) {
		const adminRole = await prisma.roleAssignment.findFirst({
			where: { userId: event.locals.user.id, role: Role.ADMIN },
		});
		hasAdminSession = !!adminRole;
	}

	if (!hasCronSecret && !hasAdminSession) {
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
