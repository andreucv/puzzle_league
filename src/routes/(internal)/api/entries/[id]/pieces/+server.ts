import { json, type RequestEvent } from '@sveltejs/kit';
import { updatePiecesCompleted, resetPiecesCompleted, EntryNotFoundError, InvalidEntryStateError } from '$lib/database/db_entry';
import { publishCompetitionEvent } from '$lib/events/server/ably';

export const POST = async (event: RequestEvent) => {
	try {
		const entryId = event.params.id as string;

		if (!entryId) {
			return json({ error: 'Invalid entry ID' }, { status: 400 });
		}

		const body = await event.request.json();
		const nPiecesCompleted = body.nPiecesCompleted;

		if (typeof nPiecesCompleted !== 'number' || nPiecesCompleted < 0 || !Number.isInteger(nPiecesCompleted)) {
			return json({ error: 'nPiecesCompleted must be a non-negative integer' }, { status: 400 });
		}

		const updatedEntry = await updatePiecesCompleted(entryId, nPiecesCompleted);

		// competitionId is included in the update above, avoiding an extra query
		// on this high-frequency live-competition path.
		await publishCompetitionEvent(updatedEntry.category.competitionId, 'entry.pieces_updated', {
			entryId: updatedEntry.id,
			categoryId: updatedEntry.categoryId,
			competitionId: updatedEntry.category.competitionId,
			nPiecesCompleted
		});

		return json({ entry: updatedEntry });
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
		const entryId = event.params.id as string;

		if (!entryId) {
			return json({ error: 'Invalid entry ID' }, { status: 400 });
		}

		const updatedEntry = await resetPiecesCompleted(entryId);

		return json({ entry: updatedEntry });
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
