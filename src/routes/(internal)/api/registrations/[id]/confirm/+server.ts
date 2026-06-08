import { json, type RequestEvent } from '@sveltejs/kit';
import { confirmRegistration, isRegistrationWorkflowError, registrationWorkflowHttpStatus } from '$lib/services/registration-workflow';
import { getPostHogClient } from '$lib/server/posthog';

export const POST = async (event: RequestEvent) => {
	try {
		const entryId = event.params.id as string;
		const user = event.locals.user;

		if (!entryId) {
			return json({ error: 'Invalid entry ID' }, { status: 400 });
		}
		if (!user) {
			return json({ error: 'You must be logged in' }, { status: 401 });
		}

		const result = await confirmRegistration({
			entryId,
			actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: false },
		});

		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: user.id,
			event: 'registration_confirmed',
			properties: {
				entry_id: entryId,
				competition_id: result.entry.category.competitionId,
				competition_name: result.entry.category.competition.name,
				category_type: result.entry.category.type
			}
		});

		return json({ success: true, data: result.entry });
	} catch (error) {
		if (isRegistrationWorkflowError(error)) {
			return json({ error: error.message }, { status: registrationWorkflowHttpStatus(error) });
		}
		console.error('Error confirming registration:', error);
		return json({ error: 'Failed to confirm registration' }, { status: 500 });
	}
};
