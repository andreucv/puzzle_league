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

    // Validate current status — only LIVE categories can be stopped
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, status: true, competitionId: true }
    });

    if (!category) {
      return json({ error: 'Category not found' }, { status: 404 });
    }

    if (category.status !== CategoryStatus.LIVE) {
      return json({ error: 'Only LIVE categories can be stopped' }, { status: 409 });
    }

    const now = new Date();

    // Transactional update: set status to STOPPED and record realEndTime.
    // Do NOT auto-set finishTime on unfinished records — they remain as DNFs
    // with finishTime = null for the organizer to review.
    const [updatedCategory, totalRecords, finishedRecords] = await prisma.$transaction([
      prisma.category.update({
        where: { id: categoryId },
        data: {
          realEndTime: now,
          status: CategoryStatus.STOPPED
        }
      }),
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
      realEndTime: updatedCategory.realEndTime?.toISOString() ?? null
    });

    return json({
      category: {
        ...updatedCategory,
        totalRecords,
        finishedRecords
      }
    });
  } catch (error) {
    console.error('Error stopping category:', error);
    return json({ error: 'Failed to stop category' }, { status: 500 });
  }
};
