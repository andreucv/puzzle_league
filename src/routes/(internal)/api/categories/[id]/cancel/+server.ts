import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database/database';
import { CategoryStatus } from '$lib/.prisma/generated/prisma/enums';

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

    if (category.status === CategoryStatus.COMPLETE) {
      return json({ error: 'Cannot cancel a completed category' }, { status: 400 });
    }

    if (category.status === CategoryStatus.CANCELED) {
      return json({ error: 'Category is already canceled' }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        status: CategoryStatus.CANCELED
      }
    });

    return json({ category: updatedCategory });
  } catch (error) {
    console.error('Error canceling category:', error);
    return json({ error: 'Failed to cancel category' }, { status: 500 });
  }
};
