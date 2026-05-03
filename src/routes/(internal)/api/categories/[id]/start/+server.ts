import { json, type RequestEvent } from '@sveltejs/kit';
import { startCategory, CategoryNotFoundError } from '$lib/services/category-lifecycle';
import { getAutoStopScheduler } from '$lib/services/auto-stop-singleton';

export const POST = async (event: RequestEvent) => {
  console.log('[auto-stop] === START ENDPOINT HIT ===', event.params.id);
  try {
    const categoryId = parseInt(event.params.id as string);

    if (isNaN(categoryId)) {
      return json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const body = await event.request.json().catch(() => ({}));
    const autoStop = body?.autoStop === true;
    const deadline = body?.deadline ? new Date(body.deadline) : undefined;

    console.log('[auto-stop] Start request body:', JSON.stringify(body));
    console.log('[auto-stop] autoStop:', autoStop, 'deadline:', deadline);

    let options;
    if (autoStop && deadline) {
      const scheduler = getAutoStopScheduler();
      console.log('[auto-stop] scheduler:', scheduler ? 'CONFIGURED' : 'NULL');
      if (scheduler) {
        options = { autoStop: true as const, deadline, scheduler };
      }
    }

    const category = await startCategory(categoryId, options);
    return json({ category });
  } catch (error) {
    if (error instanceof CategoryNotFoundError) {
      return json({ error: error.message }, { status: 404 });
    }
    console.error('Error starting category:', error);
    return json({ error: 'Failed to start category' }, { status: 500 });
  }
};
