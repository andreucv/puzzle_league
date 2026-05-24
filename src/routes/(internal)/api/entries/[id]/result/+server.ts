import { json, type RequestEvent } from '@sveltejs/kit';
import { recordFinishTime, undoFinishTime, EntryNotFoundError, InvalidEntryStateError } from '$lib/database/db_entry';
import { publishCompetitionEvent } from '$lib/events/server/ably';
import { getPostHogClient } from '$lib/server/posthog';

export const POST = async (event: RequestEvent) => {
  try {
    const entryId = event.params.id as string;
    const { finishTime, tableNumber } = await event.request.json();

    if (!entryId) {
      return json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    const updatedEntry = await recordFinishTime(entryId, finishTime, tableNumber);

    await publishCompetitionEvent(updatedEntry.category.competitionId, 'entry.finished', {
      entryId: updatedEntry.id,
      categoryId: updatedEntry.categoryId,
      competitionId: updatedEntry.category.competitionId,
      finishTime: updatedEntry.finishTime!.toISOString()
    });

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: event.locals.user?.id ?? 'server',
      event: 'entry_result_recorded',
      properties: {
        entry_id: entryId,
        category_id: updatedEntry.categoryId,
        competition_id: updatedEntry.category.competitionId,
        finish_time: updatedEntry.finishTime?.toISOString(),
        table_number: tableNumber
      }
    });

    return json({ entry: updatedEntry });
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
    const entryId = event.params.id as string;

    if (!entryId) {
      return json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    const updatedEntry = await undoFinishTime(entryId);

    await publishCompetitionEvent(updatedEntry.category.competitionId, 'entry.unfinished', {
      entryId: updatedEntry.id,
      categoryId: updatedEntry.categoryId,
      competitionId: updatedEntry.category.competitionId
    });

    return json({ entry: updatedEntry });
  } catch (error) {
    if (error instanceof EntryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidEntryStateError) {
      return json({ error: error.message }, { status: 409 });
    }
    console.error('Error undoing entry finish:', error);
    return json({ error: 'Failed to undo entry finish' }, { status: 500 });
  }
};
