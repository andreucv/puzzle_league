import { expect, test } from '@playwright/test';

const urlUnderTest = '/onboarding';

/** Navigates to the explore page and waits for Svelte hydration to complete. */
async function gotoExplore(page: import('@playwright/test').Page) {
    await page.goto(urlUnderTest, { waitUntil: 'networkidle' });
}

test.use({ storageState: { cookies: [], origins: [] } });

test('GivenOnboardingPage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await gotoExplore(page);
    await page.waitForURL(/\/login.*/);
});
