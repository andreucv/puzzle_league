import { json, type RequestEvent } from '@sveltejs/kit';
import { remindPendingPayments } from '$lib/services/category-lifecycle';

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);
		const actorName = event.locals.user?.name || undefined;

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const body = await event.request.json().catch(() => ({}));
		const note = typeof body.note === 'string' ? body.note.replace(/<[^>]*>/g, '').slice(0, 200) : undefined;

		const result = await remindPendingPayments(categoryId, { actorName, note });

		return json({ success: true, remindedCount: result.remindedCount, skippedCount: result.skippedCount });
	} catch (error) {
		console.error('Error sending bulk payment reminders:', error);
		return json({ error: 'Failed to send payment reminders' }, { status: 500 });
	}
};
