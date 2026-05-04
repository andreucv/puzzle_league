import { json, type RequestEvent } from '@sveltejs/kit';
import { addTimeToCategory, CategoryNotFoundError, InvalidStatusTransitionError } from '$lib/services/category-lifecycle';
import { getAutoStopScheduler } from '$lib/services/auto-stop-singleton';

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const body = await event.request.json();
		const minutes = body?.minutes;

		const scheduler = getAutoStopScheduler();
		const result = await addTimeToCategory(categoryId, minutes, { scheduler: scheduler ?? undefined });

		return json({ success: true, extraMinutes: result.extraMinutes });
	} catch (error) {
		if (error instanceof CategoryNotFoundError) {
			return json({ error: error.message }, { status: 404 });
		}
		if (error instanceof InvalidStatusTransitionError) {
			return json({ error: error.message }, { status: 409 });
		}
		console.error('Error adding time to category:', error);
		return json({ error: 'Failed to add time' }, { status: 500 });
	}
};
