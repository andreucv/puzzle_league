import { expect, test } from '@playwright/test';

test('WhenAccessingLoginPage_SignInButtonIsNotVisible', async ({ page }) => {
	await page.goto('/login');
	await expect(page.locator('#login-button').first()).toBeHidden();
});

test('WhenAccessingLoginPage_CreateAccountButtonIsVisible', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#create-account-button').first()).toBeVisible();
});

test('WhenAccessingLoginPage_CreateAccount_PasswordConfirmationInputIsVisible', async ({ page }) => {
    await page.goto('/login');
    await page.click('#create-account-button');
    await expect(page.locator('#input_password_confirm').first()).toBeVisible();
});