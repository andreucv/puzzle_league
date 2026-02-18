import { json, type RequestEvent } from '@sveltejs/kit';
import { refuseInscription, prisma } from '$lib/database';
import { Role } from '@prisma/client';
import { requireCompetitionRole } from '$lib/utils/api_auth';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		// Look up the record to get the competition ID for auth check
		const record = await prisma.record.findUnique({
			where: { id: recordId },
			include: { category: { select: { competitionId: true } } }
		});

		if (!record) {
			return json({ error: 'Record not found' }, { status: 404 });
		}

		const auth = await requireCompetitionRole(event, record.category.competitionId, [Role.ORGANIZER]);
		if (!auth.authorized) return auth.response;

		const result = await refuseInscription(recordId);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		return json({ success: true, data: result.data });
	} catch (error) {
		console.error('Error refusing inscription:', error);
		return json({ error: 'Failed to refuse inscription' }, { status: 500 });
	}
};
