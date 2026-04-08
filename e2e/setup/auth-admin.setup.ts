import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const authFile = path.join(__dirname, '../../playwright/.auth/admin_user.json');

setup('authenticate_admin', async ({ page }) => {
    // Perform authentication steps. Replace these actions with your own.
    await page.goto('/login');
    await page.locator('#input_email').fill(process.env.TEST_ADMIN_USER_EMAIL);
    await page.locator('#input_password').fill(process.env.TEST_ADMIN_USER_PASSWORD);
    const loginButton = page.locator('#login_submit');
    await loginButton.click();

    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('/');

    await page.goto('/profile');
    await expect(page.getByTestId("profile-admin-role-chip")).toBeVisible();
    await page.goto('/');
    await page.waitForURL('/');
    await page.context().storageState({ path: authFile });
});
