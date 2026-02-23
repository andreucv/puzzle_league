import { json, type RequestEvent } from '@sveltejs/kit';
import { acceptInscription, prisma } from '$lib/database/database';
import { Role } from '$lib/.prisma/generated/prisma/enums';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { requireCompetitionRole } from '$lib/utils/api_auth';
import { createNotificationForUsers } from '$lib/notifications/notifications';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		// Look up the record to get the competition ID for auth check
		const record = await prisma.record.findUnique({
			where: { id: recordId },
			include: {
				category: { select: { competitionId: true, description: true } },
				users: { select: { id: true } }
			}
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const auth = await requireCompetitionRole(event, record.category.competitionId, [Role.ORGANIZER]);
		if (!auth.authorized) return auth.response;

		const result = await acceptInscription(recordId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		// Notify all participants on this record
		const userIds = record.users.map((u) => u.id);
		await createNotificationForUsers(
			userIds,
			NotificationType.INSCRIPTION_ACCEPTED,
			'Inscription accepted',
			`Your inscription for "${record.category.description}" has been accepted.`,
			`/competitions/competition_details/${record.category.competitionId}`
		);

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error accepting inscription:', error);
		return json({ error: 'Failed to accept inscription' }, { status: 500 });
	}
};
