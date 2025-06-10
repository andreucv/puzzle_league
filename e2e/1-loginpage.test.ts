import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('WhenAccessingLoginPage_MinimumIsVisible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#login-button').first()).toBeHidden();
    await expect(page.locator('#create-account-button').first()).toBeVisible();
    await expect(page.locator('#login_submit').first()).toBeVisible();
});

test('WhenAccessingLoginPage_CreateAccount_PasswordConfirmationInputIsVisible', async ({ page }) => {
    await page.goto('/login');
    await page.click('#create-account-button');
    await expect(page.locator('#input_password_confirm').first()).toBeVisible();
});

test('WhenAccessingLoginPage_Login_AfterSubmitWrongUserPassword_ErrorIsVisible', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#input_email').fill('wrong@example.com');
    await page.locator('#input_password').fill('wrongpassword');

    const loginButton = page.locator('#login_submit');
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    await expect(page.locator('#login_error_message')).toBeVisible();
});

test('WhenAccessingLoginPage_Login_AfterSubmitCorrectUserPassword_RedirectsToHomePage', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#input_email').fill(process.env.TEST_USER_EMAIL);
    await page.locator('#input_password').fill(process.env.TEST_USER_PASSWORD);
    const loginButton = page.locator('#login_submit');
    await loginButton.click();

    // Wait until the page receives the cookies.
    //
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    await page.waitForURL('/');
    await expect(page.getByRole('link').filter({ hasText: /^U$/ })).toBeVisible();
});

// test('WhenAccessingCompetitionDetailPage_WhenLogin_ThenRedirectsToCompetitionDetailPage', async ({ page }) => {
//     await page.goto('/competitions');
//     await page.getByRole('link', { name: 'Competition1 26 Apr 2025 Pairs' }).click();
//     await page.getByRole('link', { name: 'log in', exact: true}).click();

//     await page.waitForURL(/\/login.*/);

//     await page.locator('#input_email').fill(process.env.TEST_USER_EMAIL);
//     await page.locator('#input_password').fill(process.env.TEST_USER_PASSWORD);
//     const loginButton = page.locator('#login_submit');
//     await loginButton.click();

//     await page.waitForURL('/competitions/competition_details/1');
// });

test('WhenAccessingProfilePage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForURL(/\/login.*/);
});
