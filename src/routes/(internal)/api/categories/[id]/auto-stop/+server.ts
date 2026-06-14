import { json, type RequestEvent } from '@sveltejs/kit';
import { setAutoStop, CategoryNotFoundError, InvalidStatusTransitionError } from '$lib/services/category-lifecycle';
import { getAutoStopScheduler } from '$lib/services/auto-stop-singleton';
import { getPostHogClient } from '$lib/server/posthog';

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const body = await event.request.json().catch(() => ({}));
		const enabled = body?.enabled === true;

		const scheduler = getAutoStopScheduler();
		if (!scheduler) {
			return json({ error: 'Auto-stop is not available' }, { status: 503 });
		}

		const result = await setAutoStop(categoryId, enabled, { scheduler });

		getPostHogClient().capture({
			distinctId: event.locals.user?.id ?? 'server',
			event: 'category_auto_stop_toggled',
			properties: { category_id: categoryId, enabled }
		});

		return json(result);
	} catch (error) {
		if (error instanceof CategoryNotFoundError) {
			return json({ error: error.message }, { status: 404 });
		}
		if (error instanceof InvalidStatusTransitionError) {
			return json({ error: error.message }, { status: 409 });
		}
		console.error('Error toggling auto-stop:', error);
		return json({ error: 'Failed to toggle auto-stop' }, { status: 500 });
	}
};
