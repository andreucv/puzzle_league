import { json, type RequestEvent } from '@sveltejs/kit';
import { publishTableAssignments, CategoryNotFoundError } from '$lib/services/category-lifecycle';

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const result = await publishTableAssignments(categoryId);

		if (result.assignedCount === 0) {
			return json({ error: 'No confirmed records to assign tables to' }, { status: 400 });
		}

		return json({ success: true, assignedCount: result.assignedCount, notifiedCount: result.notifiedCount });
	} catch (error) {
		if (error instanceof CategoryNotFoundError) {
			return json({ error: error.message }, { status: 404 });
		}
		console.error('Error publishing table assignments:', error);
		return json({ error: 'Failed to publish table assignments' }, { status: 500 });
	}
};
