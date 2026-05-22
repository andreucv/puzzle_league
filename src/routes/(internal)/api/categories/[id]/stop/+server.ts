import { json, type RequestEvent } from '@sveltejs/kit';
import { stopCategory, CategoryNotFoundError, InvalidStatusTransitionError } from '$lib/services/category-lifecycle';
import { getAutoStopScheduler } from '$lib/services/auto-stop-singleton';
import { getPostHogClient } from '$lib/server/posthog';

export const POST = async (event: RequestEvent) => {
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const scheduler = getAutoStopScheduler();
    const category = await stopCategory(categoryId, scheduler ? { scheduler } : undefined);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: event.locals.user?.id ?? 'server',
      event: 'category_stopped',
      properties: {
        category_id: categoryId
      }
    });

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
