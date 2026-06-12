import type { Page } from '@playwright/test';
import { gotoHydrated } from './navigation';

/**
 * Logs in through the UI with the given credentials on an existing page.
 *
 * Login sets cookies across several redirects and the target differs by
 * onboarding state, so this waits until we leave /login rather than for a
 * specific URL. Extended timeout: the auth API can be slow on cold start.
 */
export async function loginViaUi(page: Page, email: string, password: string): Promise<void> {
    await gotoHydrated(page, '/login');
    await page.locator('#input_email').fill(email);
    await page.locator('#input_password').fill(password);
    await page.locator('#login_submit').click();
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 });
}
