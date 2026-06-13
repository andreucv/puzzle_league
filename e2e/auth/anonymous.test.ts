import { expect, test } from '@playwright/test';
import { loginViaUi } from '../utils/auth';
import { gotoHydrated } from '../utils/navigation';

test.use({ storageState: { cookies: [], origins: [] } });

test('WhenAccessingLoginPage_Login_AfterSubmitCorrectUserPassword_RedirectsToHomePage', async ({ page }) => {
    await loginViaUi(
        page,
        process.env.TEST_PARTICIPANT_USER_EMAIL!,
        process.env.TEST_PARTICIPANT_USER_PASSWORD!,
    );

    await page.waitForURL('/home');
    await expect(page.getByTestId('profile-avatar')).toBeVisible();
});

test('WhenAccessingProfilePage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await gotoHydrated(page, '/profile');
    await page.waitForURL(/\/login.*/);
});

test('WhenAccessingAdminPage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await gotoHydrated(page, '/admin/review_requests/');
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

    await gotoHydrated(page, '/admin/review_requests/');
    await expect(page.getByTestId('error-page-title')).toBeVisible();
});
