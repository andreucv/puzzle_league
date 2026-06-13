import { expect, test } from '@playwright/test';
import { gotoHydrated } from '../utils/navigation';
import type { Page } from '@playwright/test';

function openDrawer(page: Page) {
    return test.step('Open the drawer', async () => {
        await page.locator('#states-button').click();
    });
}

test.use({ storageState: { cookies: [], origins: [] } });

test('LandingPage_VerifyMinimumViableContent', async ({ page }) => {
    await gotoHydrated(page, '/');
    await expect(page.getByRole('link', { name: 'PuzzLigas' })).toBeVisible();
    await expect(page.getByTestId('sign-in-button')).toBeVisible();
    await expect(page.getByTestId('explore-competitions-button')).toBeVisible();

    // Now open the left menu and check for the home button
    await openDrawer(page);
    await expect(page.getByTestId('nav-drawer-home')).toBeVisible();
    await expect(page.getByTestId('nav-drawer-competitions')).toBeVisible();
});

test('LandingPage_ExploreCompetitionsButtonWorks', async ({ page }) => {
    await gotoHydrated(page, '/');
    await expect(page.getByTestId('explore-competitions-button')).toBeVisible();
    await page.getByTestId('explore-competitions-button').click();
    await page.waitForURL(/\/explore_competitions.*/);
});

test('LandingPage_JoinNowButtonWorks', async ({ page }) => {
    await gotoHydrated(page, '/');
    await expect(page.getByTestId('sign-in-button')).toBeVisible();
    await page.getByTestId('sign-in-button').click();
    await page.waitForURL(/\/login/);
});

test('LandingPage_Menu_CompetitionButton_Works', async ({ page }) => {
    await gotoHydrated(page, '/');
    await openDrawer(page);
    await expect(page.getByTestId('nav-drawer-competitions')).toBeVisible();
    await page.getByTestId('nav-drawer-competitions').click();
    await page.waitForURL(/\/explore_competitions.*/);
});

test('LandingPage_Menu_HomeButton_Works', async ({ page }) => {
    await gotoHydrated(page, '/competitions/explore_competitions');
    await openDrawer(page);
    await expect(page.getByTestId('nav-drawer-home')).toBeVisible();
    await page.getByTestId('nav-drawer-home').click();
    await page.waitForURL(/\/$/);
});
