import { test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('GivenOnboardingPage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForURL(/\/login.*/);
});
