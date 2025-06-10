import { expect, test } from '@playwright/test';

test('GivenHomePage_WhenAccessingUserProfile_ThenUserProfileIsVisible', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Profile' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign out' }).first()).toBeVisible();
});

test('GivenProfilePage_WhenSigningOut_ThenRedirectsToLoginPage', async ({ page }) => {
    await page.goto('/profile');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await page.waitForURL(/\/login.*/);
});
