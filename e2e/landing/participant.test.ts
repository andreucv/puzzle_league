import { expect, test } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';
import type { Page } from '@playwright/test';

function openDrawer(page: Page) {
    return test.step('Open the drawer', async () => {
        await page.locator('#states-button').click();
    });
}

test('GivenHomePage_WhenAccessingLandingPage_ThenUserSeeUpcomingAndRegisteredCompetitions', async ({ participantPage }) => {
    await gotoHydrated(participantPage, '/home');
    await expect(participantPage.getByTestId('explore-competitions-button')).not.toBeVisible();
    await openDrawer(participantPage);
    await expect(participantPage.getByTestId('drawer-organizer-section')).not.toBeVisible();
});

test('GivenHomePageOrganizer_WhenClickingOnHambugerMenu_ThenOrganizerActionsAreVisible', async ({ organizerPage }) => {
    await gotoHydrated(organizerPage, '/home');
    await openDrawer(organizerPage);
    await expect(organizerPage.getByTestId('drawer-organizer-section')).toBeVisible();
});
