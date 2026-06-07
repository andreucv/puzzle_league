import { json, type RequestEvent } from '@sveltejs/kit';
import { confirmEntryTag, entryTagHttpStatus, isEntryTagError } from '$lib/services/entry-tags';

/** Organizer confirms a PENDING tag claim. */
export const POST = async (event: RequestEvent) => {
	const user = event.locals.user;
	const entryTagId = event.params.id as string;
	if (!user) {
		return json({ error: 'You must be logged in' }, { status: 401 });
	}

	try {
		const entryTag = await confirmEntryTag(entryTagId, { userId: user.id });
		return json({ success: true, data: entryTag });
	} catch (error) {
		if (isEntryTagError(error)) {
			return json({ error: error.message }, { status: entryTagHttpStatus(error) });
		}
		console.error('Error confirming entry tag:', error);
		return json({ error: 'Failed to confirm tag' }, { status: 500 });
	}
};
