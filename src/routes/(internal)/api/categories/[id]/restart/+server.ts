import { json, type RequestEvent } from '@sveltejs/kit';
import { restartCategory, CategoryNotFoundError, InvalidStatusTransitionError } from '$lib/services/category-lifecycle';
import { getAutoStopScheduler } from '$lib/services/auto-stop-singleton';

export const POST = async (event: RequestEvent) => {
  console.log('[auto-stop] === RESTART ENDPOINT HIT ===', event.params.id);
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const scheduler = getAutoStopScheduler();
    const category = await restartCategory(categoryId, scheduler ? { scheduler } : undefined);
    return json({ category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    if (error instanceof InvalidStatusTransitionError) {
      return json({ error: error.message }, { status: 400 });
    }
    console.error('Error restarting category:', error);
    return json({ error: 'Failed to restart category' }, { status: 500 });
  }
};
