import { json, type RequestEvent } from '@sveltejs/kit';
import { confirmRegistration } from '$lib/database/db_registration';
import { prisma } from '$lib/database/create_prisma_client';
import { notifyRegistrationConfirmed } from '$lib/notifications/registration_notifications';

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
				category: {
					select: {
						competitionId: true,
						description: true,
						subname: true,
						type: true,
						competition: { select: { name: true } }
					}
				},
				users: { select: { id: true, name: true } },
				externalParticipants: { select: { name: true } }
			}
		});

		if (!entry) {
			return json({ error: 'Entry not found' }, { status: 404 });
		}

		const result = await confirmRegistration(entryId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		await notifyRegistrationConfirmed(entry, actorName);

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error confirming registration:', error);
		return json({ error: 'Failed to confirm registration' }, { status: 500 });
	}
};
