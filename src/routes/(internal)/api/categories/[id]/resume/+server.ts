import { json, type RequestEvent } from '@sveltejs/kit';
import { resumeCategory, CategoryNotFoundError, InvalidStatusTransitionError } from '$lib/services/category-lifecycle';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const category = await resumeCategory(categoryId);
    return json({ category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidStatusTransitionError) {
      return json({ error: error.message }, { status: 409 });
    }
    console.error('Error resuming category:', error);
    return json({ error: 'Failed to resume category' }, { status: 500 });
  }
};
