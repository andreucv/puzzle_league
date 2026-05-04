import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/create_prisma_client';
import { updatePiecesCompleted, resetPiecesCompleted, EntryNotFoundError, InvalidEntryStateError } from '$lib/database/db_entry';
import { publishCompetitionEvent } from '$lib/events/server/ably';

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

		const updatedRecord = await updatePiecesCompleted(recordId, nPiecesCompleted);

		const cat = await prisma.category.findUnique({
			where: { id: updatedRecord.categoryId },
			select: { competitionId: true }
		});
		if (cat) {
			await publishCompetitionEvent(cat.competitionId, 'record.pieces_updated', {
				recordId: updatedRecord.id,
				categoryId: updatedRecord.categoryId,
				competitionId: cat.competitionId,
				nPiecesCompleted
			});
		}

		return json({ record: updatedRecord });
	} catch (error) {
		if (error instanceof EntryNotFoundError) {
			return json({ error: error.message }, { status: 404 });
		}
		if (error instanceof InvalidEntryStateError) {
			return json({ error: error.message }, { status: 409 });
		}
		console.error('Error updating pieces completed:', error);
		return json({ error: 'Failed to update pieces completed' }, { status: 500 });
	}
};

export const DELETE = async (event: RequestEvent) => {
	try {
		const recordId = event.params.id as string;

		if (!recordId) {
			return json({ error: 'Invalid record ID' }, { status: 400 });
		}

		const updatedRecord = await resetPiecesCompleted(recordId);

		return json({ record: updatedRecord });
	} catch (error) {
		if (error instanceof EntryNotFoundError) {
			return json({ error: error.message }, { status: 404 });
		}
		if (error instanceof InvalidEntryStateError) {
			return json({ error: error.message }, { status: 409 });
		}
		console.error('Error resetting pieces completed:', error);
		return json({ error: 'Failed to reset pieces completed' }, { status: 500 });
	}
};
