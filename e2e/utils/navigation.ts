import type { Page } from '@playwright/test';

/**
 * Navigates to a URL and waits for Svelte hydration to complete.
 *
 * The root layout sets `data-hydrated` on `<body>` once client-side JS has
 * taken over (see src/routes/+layout.svelte). Interacting before that point
 * can drop clicks or submit forms natively (GET with query params), so use
 * this instead of `page.goto(url, { waitUntil: 'networkidle' })`.
 */
export async function gotoHydrated(page: Page, url: string): Promise<void> {
    await page.goto(url);
    await page.locator('body[data-hydrated]').waitFor({ state: 'attached' });
}
