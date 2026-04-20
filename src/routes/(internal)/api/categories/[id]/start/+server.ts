import { json, type RequestEvent } from '@sveltejs/kit';
import { startCategory, CategoryNotFoundError } from '$lib/services/category-lifecycle';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const category = await startCategory(categoryId);
    return json({ category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    console.error('Error starting category:', error);
    return json({ error: 'Failed to start category' }, { status: 500 });
  }
};
