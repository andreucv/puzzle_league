import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma } from '$lib/database';

export const POST = async ({ params }: RequestEvent) => {
  try {
    const categoryId = parseInt(params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        realEndTime: new Date(),
        status: 'completed'
      },
      include: {
        records: {
          include: {
            users: true
          }
        }
      }
    });

    return json({ category: updatedCategory });
  } catch (error) {
    console.error('Error stopping category:', error);
    return json({ error: 'Failed to stop category' }, { status: 500 });
  }
};
