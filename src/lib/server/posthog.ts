import { PostHog } from 'posthog-node';
import { PUBLIC_POSTHOG_PROJECT_TOKEN, PUBLIC_POSTHOG_HOST } from '$env/static/public';

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
	if (!posthogClient) {
		posthogClient = new PostHog(PUBLIC_POSTHOG_PROJECT_TOKEN, {
			host: PUBLIC_POSTHOG_HOST,
			flushAt: 1,
			flushInterval: 0,
			disabled: !!import.meta.env.VITE_DISABLE_ANALYTICS
		});
	}
	return posthogClient;
}

export async function shutdownPostHog() {
	if (posthogClient) {
		await posthogClient.shutdown();
	}
}
