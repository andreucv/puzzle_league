import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database';
import { requireRecordJudge } from '$lib/utils/api_auth';

export const POST = async (event: RequestEvent) => {
  try {
    const recordId = event.params.id as string;
    const { finishTime, tableNumber } = await event.request.json();

    if (!recordId) {
      return json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    // Authorization check
    const auth = await requireRecordJudge(event, recordId);
    if (!auth.authorized) return auth.response;

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
