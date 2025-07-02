import { expect, test } from '@playwright/test';

test.use({ storageState: "playwright/.auth/participant_user.json" });

test('GivenHomePage_WhenAccessingLandingPage_ThenUserSeeUpcomingAndRegisteredCompetitions', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Your upcoming competitions' }).first()).toBeVisible();
    await expect(page.locator('section').filter({ hasText: /^No completed competitions yet$/ }).first()).toBeVisible();
});

test.describe('GivenHomePageOrganizer_WhenAccessingLandingPage_ThenOrganizerActionsAreVisible', () => {
    test.use({ storageState: "playwright/.auth/organizer_user.json" });

    test('GivenProfilePageOrganizer_WhenClickingOnHambugerMenu_ThenCreateCompetitionIsVisible', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { name: 'Organizer Actions' }).first()).toBeVisible();
    });
});
