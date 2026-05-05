import { json, type RequestEvent } from '@sveltejs/kit';
import { refuseRegistration } from '$lib/database/db_registration';
import { prisma } from '$lib/database/create_prisma_client';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';
import { createNotificationForUsers } from '$lib/notifications/notifications';

export const POST = async (event: RequestEvent) => {
	try {
		const entryId = event.params.id as string;
		const actorName = event.locals.user?.name || undefined;

		if (!entryId) {
			return json({ error: 'Invalid entry ID' }, { status: 400 });
		}

		const entry = await prisma.entry.findUnique({
			where: { id: entryId },
			include: {
				category: { select: { competitionId: true, description: true } },
				users: { select: { id: true } }
			}
		});

		if (!entry) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		const result = await refuseRegistration(entryId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		// Notify all participants on this entry
		const userIds = entry.users.map((u) => u.id);
		await createNotificationForUsers(
			userIds,
			NotificationType.REGISTRATION_REFUSED,
			'notifications.titles.registration_refused',
			'notifications.messages.registration_refused',
			`/competitions/competition_details/${entry.category.competitionId}`,
			{ categoryName: entry.category.description },
			actorName,
		);

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error refusing registration:', error);
		return json({ error: 'Failed to refuse registration' }, { status: 500 });
	}
};
