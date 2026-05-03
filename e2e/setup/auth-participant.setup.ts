import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../../playwright/.auth/participant_user.json');

setup('authenticate_participant', async ({ page }) => {
    // Wait for networkidle to ensure Svelte has hydrated the page
    // before interacting. Without this, the form may submit natively
    // (GET with query params) because the onsubmit handler isn't attached yet.
    await page.goto('/login', { waitUntil: 'networkidle' });
    await page.locator('#input_email').fill(process.env.TEST_PARTICIPANT_USER_EMAIL!);
    await page.locator('#input_password').fill(process.env.TEST_PARTICIPANT_USER_PASSWORD!);
    const loginButton = page.locator('#login_submit');
    await loginButton.click();

    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    // Extended timeout: on cold start the auth API may be slow to respond.
    await page.waitForURL('/', { timeout: 60_000 });

    await page.context().storageState({ path: authFile });
});
