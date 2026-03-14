import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';

export const POST = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const body = await event.request.json();
		const nPiecesCompleted = body.nPiecesCompleted;

		if (typeof nPiecesCompleted !== 'number' || nPiecesCompleted < 0 || !Number.isInteger(nPiecesCompleted)) {
			return json({ error: 'nPiecesCompleted must be a non-negative integer' }, { status: 400 });
		}

		const updatedRecord = await prisma.record.update({
			where: { id: recordId },
			data: { nPiecesCompleted },
			include: {
				users: {
					select: { id: true, name: true, email: true }
				}
			}
		});

		return json({ record: updatedRecord });
	} catch (error) {
		console.error('Error updating pieces completed:', error);
		return json({ error: 'Failed to update pieces completed' }, { status: 500 });
	}
};
