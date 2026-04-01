import { expect, test } from '@playwright/test';

function openDrawer(page: any) {
    return test.step('Open the drawer', async () => {
        await page.click('#states-button');
    });
}

test.use({ storageState: "playwright/.auth/participant_user.json" });

test('GivenHomePage_WhenAccessingLandingPage_ThenUserSeeUpcomingAndRegisteredCompetitions', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId("explore-competitions-button")).not.toBeVisible();
    await openDrawer(page);
    await expect(page.getByText('Organizer', { exact: true })).not.toBeVisible();
});

test.describe('GivenHomePageOrganizer_WhenAccessingLandingPage_ThenOrganizerActionsAreVisible', () => {
    test.use({ storageState: "playwright/.auth/organizer_user.json" });

    test('GivenProfilePageOrganizer_WhenClickingOnHambugerMenu_ThenCreateCompetitionIsVisible', async ({ page }) => {
        await page.goto('/');
        await openDrawer(page);
        await expect(page.getByText('Organizer', { exact: true })).toBeVisible();
    });
});
