import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { CategoryStatus, InscriptionStatus } from '$lib/.prisma/generated/prisma/enums';
import { publishCompetitionEvent } from '$lib/events/server/ably';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, status: true, competitionId: true }
    });

    if (!category) {
      return json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.status !== CategoryStatus.STOPPED) {
      return json({ error: 'Only STOPPED categories can be resumed' }, { status: 409 });
    }

    // Resume: set back to LIVE, clear realEndTime but preserve existing results
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        status: CategoryStatus.LIVE,
        realEndTime: null
      }
    });

    const [totalRecords, finishedRecords] = await Promise.all([
      prisma.record.count({
        where: { categoryId, status: InscriptionStatus.CONFIRMED }
      }),
      prisma.record.count({
        where: { categoryId, status: InscriptionStatus.CONFIRMED, finishTime: { not: null } }
      })
    ]);

    publishCompetitionEvent(updatedCategory.competitionId, 'category.status_changed', {
      categoryId: updatedCategory.id,
      competitionId: updatedCategory.competitionId,
      status: updatedCategory.status,
      realEndTime: null
    });

    return json({
      category: {
        ...updatedCategory,
        totalRecords,
        finishedRecords
      }
    });
  } catch (error) {
    console.error('Error resuming category:', error);
    return json({ error: 'Failed to resume category' }, { status: 500 });
  }
};
