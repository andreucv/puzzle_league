import { json, type RequestEvent } from '@sveltejs/kit';
import { prisma, startCategory } from '$lib/database';
import { start } from 'repl';

export const POST = async ({ params }: RequestEvent) => {
  try {
    const categoryId = parseInt(params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const updatedCategory = await startCategory(categoryId);

    console.log(`api/categories/${categoryId}/start: `, updatedCategory);
    return json({ category: updatedCategory });
  } catch (error) {
    console.error('Error starting category:', error);
    return json({ error: 'Failed to start category' }, { status: 500 });
  }
};
