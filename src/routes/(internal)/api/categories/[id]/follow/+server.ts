import { json, type RequestEvent } from '@sveltejs/kit';
import { isRegistrationWorkflowError, registrationWorkflowHttpStatus } from '$lib/services/registration-workflow';
import { followCategory, unfollowCategory } from '$lib/services/category-follows';
import { isRegistrationScheduleAvailable } from '$lib/services/registration-open-scheduler';
import { getPostHogClient } from '$lib/server/posthog';

function errorResponse(error: unknown) {
	if (isRegistrationWorkflowError(error)) {
		return json({ error: error.message }, { status: registrationWorkflowHttpStatus(error) });
	}
	console.error('Error updating category follow:', error);
	return json({ error: 'Failed to update the category follow' }, { status: 500 });
}

/** Follow a closed category to be notified (email + in-app) when its registration opens. */
export const POST = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);
		if (isNaN(categoryId)) return json({ error: 'Invalid category ID' }, { status: 400 });

		const user = event.locals.user;
		if (!user) return json({ error: 'You must be logged in' }, { status: 401 });

		// Follower notifications are sent through QStash; without it a follow could never notify.
		if (!isRegistrationScheduleAvailable()) return json({ error: 'Notifications are not available' }, { status: 503 });

		await followCategory({ categoryId, userId: user.id });

		getPostHogClient().capture({
			distinctId: user.id,
			event: 'category_followed',
			properties: { category_id: categoryId },
		});

		return json({ categoryId, following: true });
	} catch (error) {
		return errorResponse(error);
	}
};

/** Stop following a category. */
export const DELETE = async (event: RequestEvent) => {
	try {
		const categoryId = parseInt(event.params.id as string);
		if (isNaN(categoryId)) return json({ error: 'Invalid category ID' }, { status: 400 });

		const user = event.locals.user;
		if (!user) return json({ error: 'You must be logged in' }, { status: 401 });

		await unfollowCategory({ categoryId, userId: user.id });

		getPostHogClient().capture({
			distinctId: user.id,
			event: 'category_unfollowed',
			properties: { category_id: categoryId },
		});

		return json({ categoryId, following: false });
	} catch (error) {
		return errorResponse(error);
	}
};
