import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('GivenLandingPage_HasExpectedH1', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1').first()).toBeVisible();
});

test('GivenLandingPage_WhenAccessingHomePage_ThenSignInButtonIsVisible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#login-button').first()).toBeVisible();
});

test('GivenLandingPage_LeftMenuIsVisible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#states-button').first()).toBeVisible();
});

test('GivenLandingPage_WhenOpeningLeftMenu_ThenHomeButtonIsVisible', async ({ page }) => {
    await page.goto('/');
    await page.click('#states-button');
    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Competitions' })).toBeVisible();
});
