import { json, type RequestEvent } from '@sveltejs/kit';
import { assignEntryTag, entryTagHttpStatus, isEntryTagError } from '$lib/services/entry-tags';
import { isParticipantTagType } from '$lib/database/db_participant_tags';

/** Organizer directly assigns a tag to an entry (created as CONFIRMED). */
export const POST = async (event: RequestEvent) => {
	const user = event.locals.user;
	if (!user) {
		return json({ error: 'You must be logged in' }, { status: 401 });
	}

	const body = await event.request.json().catch(() => null);
	const entryId = body?.entryId;
	const tag = body?.tag;
	if (typeof entryId !== 'string' || !isParticipantTagType(tag)) {
		return json({ error: 'entryId and a valid tag are required' }, { status: 400 });
	}

	try {
		const entryTag = await assignEntryTag(entryId, tag, { userId: user.id });
		return json({ success: true, data: entryTag });
	} catch (error) {
		if (isEntryTagError(error)) {
			return json({ error: error.message }, { status: entryTagHttpStatus(error) });
		}
		console.error('Error assigning entry tag:', error);
		return json({ error: 'Failed to assign tag' }, { status: 500 });
	}
};
