import { expect, test } from '@playwright/test';
import { loginViaUi } from '../utils/auth';

test.use({ storageState: { cookies: [], origins: [] } });

test('WhenAccessingLoginPage_Login_AfterSubmitCorrectUserPassword_RedirectsToHomePage', async ({ page }) => {
    await loginViaUi(
        page,
        process.env.TEST_PARTICIPANT_USER_EMAIL!,
        process.env.TEST_PARTICIPANT_USER_PASSWORD!,
    );

    await page.waitForURL('/home');
    await expect(page.locator('a').filter({ hasText: 'Pa' }).first()).toBeVisible();
});

test('WhenAccessingProfilePage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/\/login.*/);
});

test('WhenAccessingAdminPage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await page.goto('/admin/review_requests/');
    await page.waitForURL(/\/login.*/);
});

test('WhenAccessingAdminPage_WhenLoggedInUserWithoutPermission_ThenAdminPageIsNotVisible', async ({ page }) => {
    await loginViaUi(
        page,
        process.env.TEST_PARTICIPANT_USER_EMAIL!,
        process.env.TEST_PARTICIPANT_USER_PASSWORD!,
    );

    await page.waitForURL('/home');
    await expect(page.getByTestId('profile-avatar')).toBeVisible();

    await page.goto('/admin/review_requests/');
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
});
