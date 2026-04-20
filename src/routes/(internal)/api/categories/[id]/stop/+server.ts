import { json, type RequestEvent } from '@sveltejs/kit';
import { stopCategory, CategoryNotFoundError, InvalidStatusTransitionError } from '$lib/services/category-lifecycle';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const category = await stopCategory(categoryId);
    return json({ category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidStatusTransitionError) {
      return json({ error: error.message }, { status: 409 });
    }
    console.error('Error stopping category:', error);
    return json({ error: 'Failed to stop category' }, { status: 500 });
  }
};
