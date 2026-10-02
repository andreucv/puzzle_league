import { json, type RequestEvent } from '@sveltejs/kit';
import {
	cancelCategoryRegistrationOpening,
	isRegistrationWorkflowError,
	registrationWorkflowHttpStatus,
	scheduleCategoryRegistrationOpening,
} from '$lib/services/registration-workflow';
import { getRegistrationOpenScheduler } from '$lib/services/registration-open-scheduler';
import { getPostHogClient } from '$lib/server/posthog';

function errorResponse(error: unknown) {
	if (isRegistrationWorkflowError(error)) {
		return json({ error: error.message }, { status: registrationWorkflowHttpStatus(error) });
	}
	console.error('Error scheduling category registration:', error);
	return json({ error: 'Failed to update the scheduled opening' }, { status: 500 });
}

/** Schedule the category's registration to open at `{ opensAt }` (ISO string). */
export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);
		if (isNaN(categoryId)) return json({ error: 'Invalid category ID' }, { status: 400 });

		const user = event.locals.user;
		if (!user) return json({ error: 'You must be logged in' }, { status: 401 });

		const scheduler = getRegistrationOpenScheduler();
		if (!scheduler) return json({ error: 'Scheduling is not available' }, { status: 503 });

		const { opensAt } = await event.request.json().catch(() => ({}));
		const result = await scheduleCategoryRegistrationOpening({
			categoryId,
			opensAt: new Date(opensAt),
			actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: true },
			scheduler,
		});

		getPostHogClient().capture({
			distinctId: user.id,
			event: 'category_registration_scheduled',
			properties: { category_id: categoryId },
		});

		return json(result);
	} catch (error) {
		return errorResponse(error);
	}
};

/** Cancel the category's scheduled opening. */
export const DELETE = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);
		if (isNaN(categoryId)) return json({ error: 'Invalid category ID' }, { status: 400 });

		const user = event.locals.user;
		if (!user) return json({ error: 'You must be logged in' }, { status: 401 });

		await cancelCategoryRegistrationOpening({
			categoryId,
			actor: { userId: user.id, name: user.name ?? undefined, isOrganizer: true },
		});

		return json({ id: categoryId, registrationOpensAt: null });
	} catch (error) {
		return errorResponse(error);
	}
};
