import { json, type RequestEvent } from '@sveltejs/kit';
import { recordFinishTime, undoFinishTime, EntryNotFoundError, InvalidEntryStateError } from '$lib/database/db_entry';
import { publishCompetitionEvent } from '$lib/events/server/ably';

export const POST = async (event: RequestEvent) => {
  try {
    const recordId = event.params.id as string;
    const { finishTime, tableNumber } = await event.request.json();

    if (!recordId) {
      return json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    const updatedEntry = await recordFinishTime(recordId, finishTime, tableNumber);

    await publishCompetitionEvent(updatedEntry.category.competitionId, 'record.finished', {
      recordId: updatedEntry.id,
      categoryId: updatedEntry.categoryId,
      competitionId: updatedEntry.category.competitionId,
      finishTime: updatedEntry.finishTime!.toISOString()
    });

    return json({ record: updatedEntry });
  } catch (error) {
    if (error instanceof EntryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidEntryStateError) {
      return json({ error: error.message }, { status: 409 });
    }
    console.error('Error recording result:', error);
    return json({ error: 'Failed to record result' }, { status: 500 });
  }
};

export const DELETE = async (event: RequestEvent) => {
  try {
    const recordId = event.params.id as string;

    if (!recordId) {
      return json({ error: 'Invalid record ID' }, { status: 400 });
    }

    const updatedRecord = await undoFinishTime(recordId);

    await publishCompetitionEvent(updatedRecord.category.competitionId, 'record.unfinished', {
      recordId: updatedRecord.id,
      categoryId: updatedRecord.categoryId,
      competitionId: updatedRecord.category.competitionId
    });

    return json({ record: updatedRecord });
  } catch (error) {
    if (error instanceof EntryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidEntryStateError) {
      return json({ error: error.message }, { status: 409 });
    }
    console.error('Error undoing record finish:', error);
    return json({ error: 'Failed to undo record finish' }, { status: 500 });
  }
};
