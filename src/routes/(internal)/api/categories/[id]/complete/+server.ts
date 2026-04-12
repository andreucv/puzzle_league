import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { CategoryStatus, CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';

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
      return json({ error: 'Only STOPPED categories can be completed' }, { status: 409 });
    }

    // Transactional: complete the category and check if competition is done
    const updatedCategory = await prisma.$transaction(async (tx) => {
      const updated = await tx.category.update({
        where: { id: categoryId },
        data: { status: CategoryStatus.COMPLETE }
      });

      // Check if all categories are now COMPLETE or CANCELED
      const remaining = await tx.category.count({
        where: {
          competitionId: category.competitionId,
          status: { notIn: [CategoryStatus.COMPLETE, CategoryStatus.CANCELED] }
        }
      });

      if (remaining === 0) {
        await tx.competition.update({
          where: { id: category.competitionId },
          data: { status: CompetitionStatus.FINISHED }
        });
      }

      return updated;
    });

    return json({ category: updatedCategory });
  } catch (error) {
    console.error('Error completing category:', error);
    return json({ error: 'Failed to complete category' }, { status: 500 });
  }
};
