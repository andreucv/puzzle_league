import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { prisma } from '$lib/database/create_prisma_client';
import { upsertLandingStats } from '$lib/database/db_competition';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import { CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';

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

	try {
		const upcomingStatuses = [CompetitionStatus.NOT_STARTED, CompetitionStatus.STARTED];

		const [upcomingCount, cityGroups, participantCount] = await Promise.all([
			prisma.competition.count({
				where: { status: { in: upcomingStatuses } },
			}),
			prisma.competition.groupBy({
				by: ['location'],
				where: { status: { in: upcomingStatuses }, location: { not: null } },
				_count: true,
			}),
			prisma.user.count({
				where: { entries: { some: {} } },
			}),
		]);

		const cityCount = cityGroups.length;

		const stats = await upsertLandingStats({ upcomingCount, cityCount, participantCount });

		return json({ success: true, stats });
	} catch (error) {
		console.error('[landing-stats] Unexpected error in cron handler:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
