import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';

export const POST = async (event: RequestEvent) => {
  try {
    const recordId = event.params.id as string;
    const { finishTime, tableNumber } = await event.request.json();

    if (!recordId) {
      return json({ error: 'Invalid entry ID' }, { status: 400 });
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

    const updatedRecord = await prisma.record.update({
      where: { id: recordId },
      data: { finishTime: null },
      include: {
        users: true,
        category: true
      }
    });

    return json({ record: updatedRecord });
  } catch (error) {
    console.error('Error undoing record finish:', error);
    return json({ error: 'Failed to undo record finish' }, { status: 500 });
  }
};
