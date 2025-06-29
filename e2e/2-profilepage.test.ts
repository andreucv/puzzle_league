import { expect, test } from '@playwright/test';

test.use({ storageState: "playwright/.auth/participant_user.json" });

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

test('GivenProfilePage_WhenClickingOnHambugerMenu_ThenCreateCompetitionIsNotVisible', async ({ page }) => {
    await page.goto('/profile');
    await page.locator('#states-button').click();
    await expect(page.getByRole('link', { name: 'Create Competition' }).first()).not.toBeVisible();
});

test.describe('GivenProfilePageOrganizer_WhenClickingOnHambugerMenu_ThenCreateCompetitionIsVisible', () => {
    test.use({ storageState: "playwright/.auth/organizer_user.json" });

    test('GivenProfilePageOrganizer_WhenClickingOnHambugerMenu_ThenCreateCompetitionIsVisible', async ({ page }) => {
        await page.goto('/profile');
        await page.locator('#states-button').click();
        await expect(page.getByRole('link', { name: 'Create Competition' }).first()).toBeVisible();
    });
});
