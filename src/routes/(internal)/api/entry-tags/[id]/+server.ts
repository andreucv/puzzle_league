import { json, type RequestEvent } from '@sveltejs/kit';
import { changeEntryTag, removeEntryTag, entryTagHttpStatus, isEntryTagError } from '$lib/services/entry-tags';
import { isParticipantTagType } from '$lib/database/db_participant_tags';

/** Change the tag on an existing claim slot (participant while PENDING, or organizer). */
export const PATCH = async (event: RequestEvent) => {
	const user = event.locals.user;
	const entryTagId = event.params.id as string;
	if (!user) {
		return json({ error: 'You must be logged in' }, { status: 401 });
	}

	const body = await event.request.json().catch(() => null);
	const tag = body?.tag;
	if (!isParticipantTagType(tag)) {
		return json({ error: 'A valid tag is required' }, { status: 400 });
	}

	try {
		const entryTag = await changeEntryTag(entryTagId, tag, { userId: user.id });
		return json({ success: true, data: entryTag });
	} catch (error) {
		if (isEntryTagError(error)) {
			return json({ error: error.message }, { status: entryTagHttpStatus(error) });
		}
		console.error('Error changing entry tag:', error);
		return json({ error: 'Failed to change tag' }, { status: 500 });
	}
};

/** Remove a claim (participant while PENDING, or organizer). */
export const DELETE = async (event: RequestEvent) => {
	const user = event.locals.user;
	const entryTagId = event.params.id as string;
	if (!user) {
		return json({ error: 'You must be logged in' }, { status: 401 });
	}

	try {
		await removeEntryTag(entryTagId, { userId: user.id });
		return json({ success: true });
	} catch (error) {
		if (isEntryTagError(error)) {
			return json({ error: error.message }, { status: entryTagHttpStatus(error) });
		}
		console.error('Error removing entry tag:', error);
		return json({ error: 'Failed to remove tag' }, { status: 500 });
	}
};
