import { test } from '@playwright/test';
import { gotoHydrated } from '../utils/navigation';

test.use({ storageState: { cookies: [], origins: [] } });

test('GivenOnboardingPage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await gotoHydrated(page, '/onboarding');
    await page.waitForURL(/\/login.*/);
});
