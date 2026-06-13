import type { Page, Response } from '@playwright/test';

/**
 * Navigates to a URL and waits for Svelte hydration to complete.
 *
 * The root layout sets `data-hydrated` on `<body>` once client-side JS has
 * taken over (see src/routes/+layout.svelte). Interacting before that point
 * can drop clicks or submit forms natively (GET with query params), so always
 * use this instead of a bare `page.goto(...)` — every navigation in the suite
 * goes through here.
 *
 * Returns the navigation `Response` so callers that assert on the HTTP status
 * (e.g. a 403 error page, which still hydrates via the root layout) don't have
 * to fall back to a bare `page.goto`.
 */
export async function gotoHydrated(page: Page, url: string): Promise<Response | null> {
    const response = await page.goto(url);
    await page.locator('body[data-hydrated]').waitFor({ state: 'attached' });
    return response;
}
