import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('GivenAddPhonePage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await page.goto('/add-phone');
    await page.waitForURL(/\/login.*/);
});
