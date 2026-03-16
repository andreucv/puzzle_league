import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('WhenAccessingLoginPage_Login_AfterSubmitCorrectUserPassword_RedirectsToHomePage', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#input_email').fill(process.env.TEST_PARTICIPANT_USER_EMAIL!);
    await page.locator('#input_password').fill(process.env.TEST_PARTICIPANT_USER_PASSWORD!);
    const loginButton = page.locator('#login_submit');
    await loginButton.click();

    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('/');
    await expect(page.locator('a').filter({ hasText: 'Te' }).first()).toBeVisible();
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
    await page.goto('/login');
    await page.locator('#input_email').fill(process.env.TEST_PARTICIPANT_USER_EMAIL!);
    await page.locator('#input_password').fill(process.env.TEST_PARTICIPANT_USER_PASSWORD!);
    const loginButton = page.locator('#login_submit');
    await loginButton.click();

    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('/');
    await expect(page.getByTestId('profile-avatar')).toBeVisible();

    await page.goto('/admin/review_requests/');
    await expect(page.getByRole('heading', { name: 'Access Denied' })).toBeVisible();
});
