import type { HandleClientError } from '@sveltejs/kit';
import { getPosthog, schedulePosthogInit } from '$lib/analytics/posthog';

export async function init() {
	// Deferred: posthog-js loads on idle instead of blocking the app entry bundle.
	schedulePosthogInit();
}

export const handleError: HandleClientError = async ({ error, status, message }) => {
	void getPosthog().then((posthog) => posthog.captureException(error));

	return {
		message,
		status
	};
};
