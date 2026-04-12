import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { CategoryStatus, InscriptionStatus, CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const now = new Date();

    // Find all confirmed records without finishTime (unfinished)
    const unfinishedRecords = await prisma.record.findMany({
      where: {
        categoryId,
        status: InscriptionStatus.CONFIRMED,
        finishTime: null
      },
      select: { id: true }
    });

    // Auto-complete unfinished records with realEndTime = now
    if (unfinishedRecords.length > 0) {
      await prisma.record.updateMany({
        where: {
          id: { in: unfinishedRecords.map(r => r.id) }
        },
        data: {
          finishTime: now
          // nPiecesCompleted left as null — organizer can mark pieces later
        }
      });
    }

    // Count finished-on-time records (those that already had a finishTime)
    const finishedOnTime = await prisma.record.count({
      where: {
        categoryId,
        status: InscriptionStatus.CONFIRMED,
        finishTime: { not: null },
        id: { notIn: unfinishedRecords.map(r => r.id) }
      }
    });

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        realEndTime: now,
        status: CategoryStatus.COMPLETE
      },
      include: {
        records: {
          include: {
            users: true
          }
        }
      }
    });

    // Check if all categories of the competition are now completed
    const remainingCategories = await prisma.category.count({
      where: {
        competitionId: updatedCategory.competitionId,
        status: { not: CategoryStatus.COMPLETE }
      }
    });

    if (remainingCategories === 0) {
      await prisma.competition.update({
        where: { id: updatedCategory.competitionId },
        data: { status: CompetitionStatus.FINISHED }
      });
    }

    return json({
      category: updatedCategory,
      summary: {
        finishedOnTime,
        autoCompleted: unfinishedRecords.length,
        total: finishedOnTime + unfinishedRecords.length
      }
    });
  } catch (error) {
    console.error('Error stopping category:', error);
    return json({ error: 'Failed to stop category' }, { status: 500 });
  }
};
