import { json, type RequestEvent } from '@sveltejs/kit';
import { refuseRegistration } from '$lib/database/db_registration';
import { notifyRegistrationRefused, notifyWaitlistPromotion } from '$lib/notifications/registration_notifications';

export const POST = async (event: RequestEvent) => {
	const entryId = event.params.id as string;
	const actorName = event.locals.user?.name || undefined;

	if (!entryId) {
		return json({ error: 'Invalid entry ID' }, { status: 400 });
	}

	const result = await refuseRegistration(entryId);

	if (!result.success) {
		// Distinguish "not found" (already removed) from validation errors
		const status = result.error === 'Entry not found' ? 404 : 400;
		return json({ error: result.error }, { status });
	}

	// Mutation succeeded — send notifications best-effort (never convert a
	// successful delete/promotion into an HTTP error).
	try {
		await notifyRegistrationRefused(result.data, actorName);
	} catch (err) {
		console.error('[refuse] Failed to send refusal notifications:', err);
	}

	if (result.promotedEntry) {
		try {
			await notifyWaitlistPromotion(result.promotedEntry, actorName);
		} catch (err) {
			console.error('[refuse] Failed to send waitlist-promotion notifications:', err);
		}
	}

	return json({ success: true, data: result.data });
};
