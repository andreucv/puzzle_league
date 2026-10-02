import { json, type RequestEvent } from '@sveltejs/kit';
import {
	closeAllCategoryRegistrations,
	isRegistrationWorkflowError,
	registrationWorkflowHttpStatus,
} from '$lib/services/registration-workflow';
import { getPostHogClient } from '$lib/server/posthog';

/** Close registration for every NOT_STARTED category of the competition. Opening is per category. */
export const POST = async (event: RequestEvent) => {
	try {
		const competitionId = parseInt(event.params.id as string);

		if (isNaN(competitionId)) {
			return json({ error: 'Invalid competition ID' }, { status: 400 });
		}

		const user = event.locals.user;
		if (!user) {
			return json({ error: 'You must be logged in' }, { status: 401 });
		}

		const { closedCount } = await closeAllCategoryRegistrations({
			competitionId,
			actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: true },
		});

		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: user.id,
			event: 'registration_closed_all',
			properties: {
				competition_id: competitionId,
				closed_count: closedCount,
			},
		});

		return json({ id: competitionId, closedCount });
	} catch (error) {
		if (isRegistrationWorkflowError(error)) {
			return json({ error: error.message }, { status: registrationWorkflowHttpStatus(error) });
		}
		console.error('Error closing competition registration:', error);
		return json({ error: 'Failed to close registration' }, { status: 500 });
	}
};
