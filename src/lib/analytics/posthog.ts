import type { PostHog } from 'posthog-js';
import { PUBLIC_POSTHOG_PROJECT_TOKEN, PUBLIC_POSTHOG_HOST } from '$env/static/public';

// posthog-js is ~186KB; loading it statically put it in the eager bundle of every
// page. This lazy singleton defers the download until idle time (or the first
// capture/identify call, whichever comes first). Callers chain on the promise, so
// call order is preserved even before the library has loaded.
let posthogPromise: Promise<PostHog> | null = null;

export function getPosthog(): Promise<PostHog> {
	if (!posthogPromise) {
		posthogPromise = import('posthog-js').then(({ default: posthog }) => {
			// Uninitialized posthog-js silently no-ops capture/identify calls (e2e build).
			if (!import.meta.env.VITE_DISABLE_ANALYTICS) {
				posthog.init(PUBLIC_POSTHOG_PROJECT_TOKEN, {
					api_host: '/ingest',
					ui_host: PUBLIC_POSTHOG_HOST.replace('.i.posthog.com', '.posthog.com'),
					defaults: '2026-01-30',
					capture_exceptions: true
				});
			}
			return posthog;
		});
	}
	return posthogPromise;
}

/** Kick off the download during browser idle time so it never competes with hydration/LCP. */
export function schedulePosthogInit() {
	if (typeof window === 'undefined') return;
	if ('requestIdleCallback' in window) {
		requestIdleCallback(() => void getPosthog(), { timeout: 5000 });
	} else {
		setTimeout(() => void getPosthog(), 2000);
	}
}
