import { json, type RequestEvent } from '@sveltejs/kit';
import { isRegistrationWorkflowError, refuseRegistration, registrationWorkflowHttpStatus } from '$lib/services/registration-workflow';
import { getPostHogClient } from '$lib/server/posthog';

export const POST = async (event: RequestEvent) => {
	const entryId = event.params.id as string;
	const user = event.locals.user;

	if (!entryId) {
		return json({ error: 'Invalid entry ID' }, { status: 400 });
	}
	if (!user) {
		return json({ error: 'You must be logged in' }, { status: 401 });
	}

	try {
		const result = await refuseRegistration({
			entryId,
			actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: false },
		});

		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: user.id,
			event: 'registration_refused',
			properties: {
				entry_id: entryId,
				waitlist_promoted: !!result.promotedEntry
			}
		});

		return json({ success: true, data: result.entry });
	} catch (error) {
		if (isRegistrationWorkflowError(error)) {
			return json({ error: error.message }, { status: registrationWorkflowHttpStatus(error) });
		}
		console.error('Error refusing registration:', error);
		return json({ error: 'Failed to refuse registration' }, { status: 500 });
	}
};
