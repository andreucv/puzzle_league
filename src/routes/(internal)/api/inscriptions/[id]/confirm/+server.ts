import { json, type RequestEvent } from '@sveltejs/kit';
import { confirmInscription } from '$lib/database/db_inscription_utils';
import { prisma } from '$lib/database/create_prisma_client';
import { notifyInscriptionConfirmed } from '$lib/notifications/inscription_notifications';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;
		const actorName = event.locals.user?.name || undefined;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const record = await prisma.record.findUnique({
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
				userIntents: { select: { name: true } }
			}
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const result = await confirmInscription(recordId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		await notifyInscriptionConfirmed(record, actorName);

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error confirming inscription:', error);
		return json({ error: 'Failed to confirm inscription' }, { status: 500 });
	}
};
