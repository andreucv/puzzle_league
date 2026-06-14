import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Receiver } from '@upstash/qstash';
import { prisma } from '$lib/database/create_prisma_client';
import { upsertLandingStats } from '$lib/database/db_competition';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import { CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';

function getReceiver(): Receiver | null {
	const current = env.QSTASH_CURRENT_SIGNING_KEY;
	const next = env.QSTASH_NEXT_SIGNING_KEY;
	if (!current || !next) return null;
	return new Receiver({ currentSigningKey: current, nextSigningKey: next });
}

export const GET = async (event: RequestEvent) => {
	// Accept either a valid QStash signature (scheduled cron) or an authenticated
	// admin session (manual run).
	let authorized = false;

	const signature = event.request.headers.get('upstash-signature');
	if (signature) {
		const receiver = getReceiver();
		if (!receiver) {
			return json({ error: 'QStash not configured' }, { status: 503 });
		}
		const body = await event.request.text();
		const isValid = await receiver.verify({ signature, body });
		if (!isValid) {
			return json({ error: 'Invalid signature' }, { status: 401 });
		}
		authorized = true;
	} else if (event.locals.user) {
		const adminRole = await prisma.roleAssignment.findFirst({
			where: { userId: event.locals.user.id, role: Role.ADMIN },
		});
		authorized = !!adminRole;
	}

	if (!authorized) {
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
