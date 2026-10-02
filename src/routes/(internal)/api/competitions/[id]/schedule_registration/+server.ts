import { json, type RequestEvent } from '@sveltejs/kit';
import {
	isRegistrationWorkflowError,
	registrationWorkflowHttpStatus,
	scheduleAllCategoryRegistrationOpenings,
} from '$lib/services/registration-workflow';
import { getRegistrationOpenScheduler } from '$lib/services/registration-open-scheduler';
import { getPostHogClient } from '$lib/server/posthog';

/** Schedule every closed, not-started category of the competition to open at `{ opensAt }`. */
export const POST = async (event: RequestEvent) => {
	try {
		const competitionId = parseInt(event.params.id as string);
		if (isNaN(competitionId)) return json({ error: 'Invalid competition ID' }, { status: 400 });

		const user = event.locals.user;
		if (!user) return json({ error: 'You must be logged in' }, { status: 401 });

		const scheduler = getRegistrationOpenScheduler();
		if (!scheduler) return json({ error: 'Scheduling is not available' }, { status: 503 });

		const { opensAt } = await event.request.json().catch(() => ({}));
		const { scheduledCount } = await scheduleAllCategoryRegistrationOpenings({
			competitionId,
			opensAt: new Date(opensAt),
			actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: true },
			scheduler,
		});

		getPostHogClient().capture({
			distinctId: user.id,
			event: 'registration_scheduled_all',
			properties: { competition_id: competitionId, scheduled_count: scheduledCount },
		});

		return json({ id: competitionId, scheduledCount });
	} catch (error) {
		if (isRegistrationWorkflowError(error)) {
			return json({ error: error.message }, { status: registrationWorkflowHttpStatus(error) });
		}
		console.error('Error scheduling competition registration:', error);
		return json({ error: 'Failed to schedule registration opening' }, { status: 500 });
	}
};
