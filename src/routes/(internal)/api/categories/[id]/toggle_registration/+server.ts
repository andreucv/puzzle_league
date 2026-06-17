import { json, type RequestEvent } from '@sveltejs/kit';
import {
	isRegistrationWorkflowError,
	registrationWorkflowHttpStatus,
	toggleCategoryRegistration,
} from '$lib/services/registration-workflow';
import { getPostHogClient } from '$lib/server/posthog';

export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);

		if (isNaN(categoryId)) {
			return json({ error: 'Invalid category ID' }, { status: 400 });
		}

		const user = event.locals.user;
		if (!user) {
			return json({ error: 'You must be logged in' }, { status: 401 });
		}

		const { id, registrationOpen } = await toggleCategoryRegistration({
			categoryId,
			actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: true },
		});

		const posthog = getPostHogClient();
		posthog.capture({
			distinctId: user.id,
			event: 'category_registration_toggled',
			properties: {
				category_id: id,
				registration_open: registrationOpen,
			},
		});

		return json({ id, registrationOpen });
	} catch (error) {
		if (isRegistrationWorkflowError(error)) {
			return json({ error: error.message }, { status: registrationWorkflowHttpStatus(error) });
		}
		console.error('Error toggling category registration:', error);
		return json({ error: 'Failed to toggle category registration status' }, { status: 500 });
	}
};
