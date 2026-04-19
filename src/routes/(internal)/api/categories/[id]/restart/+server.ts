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

    if (category.status !== CategoryStatus.COMPLETE && category.status !== CategoryStatus.CANCELED && category.status !== CategoryStatus.STOPPED) {
      return json({ error: 'Can only restart completed, canceled, or stopped categories' }, { status: 400 });
    }

    const [updatedCategory] = await prisma.$transaction([
      prisma.category.update({
        where: { id: categoryId },
        data: {
          status: CategoryStatus.LIVE,
          realStartTime: new Date(),
          realEndTime: null
        }
      }),
      prisma.record.updateMany({
        where: { categoryId, status: InscriptionStatus.CONFIRMED },
        data: {
          finishTime: null,
          nPiecesCompleted: null
        }
      })
    ]);

    const totalRecords = await prisma.record.count({
      where: { categoryId, status: InscriptionStatus.CONFIRMED }
    });

    publishCompetitionEvent(updatedCategory.competitionId, 'category.status_changed', {
      categoryId: updatedCategory.id,
      competitionId: updatedCategory.competitionId,
      status: updatedCategory.status,
      realStartTime: updatedCategory.realStartTime?.toISOString() ?? null,
      realEndTime: null
    });

    return json({
      category: {
        ...updatedCategory,
        totalRecords,
        finishedRecords: 0
      }
    });
  } catch (error) {
    console.error('Error restarting category:', error);
    return json({ error: 'Failed to restart category' }, { status: 500 });
  }
};
