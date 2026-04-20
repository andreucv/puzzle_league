import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { CategoryStatus } from '$lib/.prisma/generated/prisma/enums';
import { publishCompetitionEvent } from '$lib/events/server/ably';

export const POST = async (event: RequestEvent) => {
  try {
    const recordId = event.params.id as string;
    const { finishTime, tableNumber } = await event.request.json();

    if (!recordId) {
      return json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    // Enforce: finish actions only allowed while category is LIVE
    const record = await prisma.record.findUnique({
      where: { id: recordId },
      select: { category: { select: { status: true } } }
    });
    if (!record) {
      return json({ error: 'Record not found' }, { status: 404 });
    }
    if (record.category.status !== CategoryStatus.LIVE) {
      return json({ error: 'Finish actions are only allowed while the category is LIVE' }, { status: 409 });
    }

    const updatedEntry = await prisma.record.update({
      where: { id: recordId },
      data: {
        finishTime: finishTime ? new Date(finishTime) : new Date(),
        tableNumber: tableNumber ? parseInt(tableNumber) : undefined
      },
      include: {
        users: true,
        category: true
      }
    });

    publishCompetitionEvent(updatedEntry.category.competitionId, 'record.finished', {
      recordId: updatedEntry.id,
      categoryId: updatedEntry.categoryId,
      competitionId: updatedEntry.category.competitionId,
      finishTime: updatedEntry.finishTime!.toISOString()
    });

    return json({ record: updatedEntry });
  } catch (error) {
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

    // Enforce: undo-finish actions only allowed while category is LIVE
    const record = await prisma.record.findUnique({
      where: { id: recordId },
      select: { category: { select: { status: true } } }
    });
    if (!record) {
      return json({ error: 'Record not found' }, { status: 404 });
    }
    if (record.category.status !== CategoryStatus.LIVE) {
      return json({ error: 'Undo-finish actions are only allowed while the category is LIVE' }, { status: 409 });
    }

    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: { finishTime: null },
      include: {
        users: true,
        category: true
      }
    });

    publishCompetitionEvent(updatedRecord.category.competitionId, 'record.unfinished', {
      recordId: updatedRecord.id,
      categoryId: updatedRecord.categoryId,
      competitionId: updatedRecord.category.competitionId
    });

    return json({ record: updatedRecord });
  } catch (error) {
    console.error('Error undoing record finish:', error);
    return json({ error: 'Failed to undo record finish' }, { status: 500 });
  }
};
