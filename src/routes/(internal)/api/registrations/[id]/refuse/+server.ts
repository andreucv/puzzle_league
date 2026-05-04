import { json, type RequestEvent } from '@sveltejs/kit';
import { refuseRegistration } from '$lib/database/db_registration';
import { prisma } from '$lib/database/create_prisma_client';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { createNotificationForUsers } from '$lib/notifications/notifications';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;
		const actorName = event.locals.user?.name || undefined;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const record = await prisma.entry.findUnique({
			where: { id: recordId },
			include: {
				category: { select: { competitionId: true, description: true } },
				users: { select: { id: true } }
			}
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const result = await refuseRegistration(recordId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		// Notify all participants on this record
		const userIds = record.users.map((u) => u.id);
		await createNotificationForUsers(
			userIds,
			NotificationType.REGISTRATION_REFUSED,
			'notifications.titles.registration_refused',
			'notifications.messages.registration_refused',
			`/competitions/competition_details/${record.category.competitionId}`,
			{ categoryName: record.category.description },
			actorName,
		);

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error refusing registration:', error);
		return json({ error: 'Failed to refuse registration' }, { status: 500 });
	}
};
