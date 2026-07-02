import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { Receiver } from '@upstash/qstash';
import { autoCancelExpiredCompetitions } from '$lib/services/auto-cancel';
import { prisma } from '$lib/database/create_prisma_client';
import { Role } from '$prisma/enums';

function getReceiver(): Receiver | null {
	const current = env.QSTASH_CURRENT_SIGNING_KEY;
	const next = env.QSTASH_NEXT_SIGNING_KEY;
	if (!current || !next) return null;
	return new Receiver({ currentSigningKey: current, nextSigningKey: next });
}

export const GET = async (event: RequestEvent) => {
	// Accept either a valid QStash signature (scheduled cron) or an authenticated
	// admin session (manual run / dry-run from the admin drawer).
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
