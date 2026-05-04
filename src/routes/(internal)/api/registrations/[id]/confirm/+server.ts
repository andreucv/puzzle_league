import { json, type RequestEvent } from '@sveltejs/kit';
import { confirmRegistration } from '$lib/database/db_registration';
import { prisma } from '$lib/database/create_prisma_client';
import { notifyRegistrationConfirmed } from '$lib/notifications/registration_notifications';

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

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const result = await confirmRegistration(recordId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		await notifyRegistrationConfirmed(record, actorName);

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error confirming registration:', error);
		return json({ error: 'Failed to confirm registration' }, { status: 500 });
	}
};
