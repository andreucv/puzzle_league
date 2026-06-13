import { expect, test, runSeed } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';
import type { Page } from '@playwright/test';

interface ProfileTestData {
    userId: string;
    userName: string;
    userEmail: string;
    userPassword: string;
}

// The suite edits profile fields, so each worker seeds its own dedicated user
// (never the shared bootstrap participant) and tests log in via the actor
// fixture.
let data: ProfileTestData;

test.beforeAll(async () => {
    data = await runSeed<ProfileTestData>(import.meta.url);
});

async function profilePage(actor: (creds: { email: string; password: string }) => Promise<Page>): Promise<Page> {
    const page = await actor({ email: data.userEmail, password: data.userPassword });
    await gotoHydrated(page, '/profile');
    return page;
}

test('GivenHomePage_WhenAccessingUserProfile_ThenUserProfileIsVisible', async ({ actor }) => {
    const page = await profilePage(actor);
    await expect(page.getByTestId('profile-heading')).toBeVisible();
    await expect(page.getByTestId('sign-out-button')).toBeVisible();
});

test('GivenProfilePage_WhenSigningOut_ThenRedirectsToLoginPage', async ({ actor }) => {
    const page = await profilePage(actor);
    await page.getByTestId('sign-out-button').click();
    await page.waitForURL(/\/login.*/);
});

test('GivenProfilePage_WhenClickingOnHambugerMenu_ThenCreateCompetitionIsNotVisible', async ({ actor }) => {
    const page = await profilePage(actor);
    await page.locator('#states-button').click();
    await expect(page.getByTestId('nav-drawer-create-competition')).not.toBeVisible();
});

test('GivenProfilePageOrganizer_WhenClickingOnHambugerMenu_ThenCreateCompetitionIsVisible', async ({ organizerPage }) => {
    await gotoHydrated(organizerPage, '/profile');
    await organizerPage.locator('#states-button').click();
    await expect(organizerPage.getByTestId('nav-drawer-create-competition')).toBeVisible();
});

test('GivenProfilePage_WhenEditingPhone_ThenPhoneIsSaved', async ({ actor }) => {
    const page = await profilePage(actor);

    // Click Change button for phone
    await page.getByTestId('phone-edit-button').click();

    // Fill prefix and number
    await page.getByTestId('phone-prefix-input').fill('+34');
    await page.getByRole('option', { name: /\+34/ }).first().click();
    await page.getByTestId('phone-number-input').fill('612345678');

    // Save
    await page.getByTestId('phone-save-button').click();

    // Verify the phone is displayed
    await expect(page.getByText('+34 612345678')).toBeVisible();
});

test('GivenProfilePage_WhenEditingName_ThenNameIsSaved', async ({ actor }) => {
    const page = await profilePage(actor);

    await page.getByTestId('profile-name-edit-button').click();
    await page.getByTestId('profile-name-input').fill('Profile User Renamed');
    await page.getByTestId('profile-name-save-button').click();

    await expect(page.getByTestId('profile-name-value')).toHaveText('Profile User Renamed');
});

test('GivenProfilePage_WhenClickingChangePassword_ThenNavigatesToPasswordPage', async ({ actor }) => {
    const page = await profilePage(actor);

    await page.getByTestId('change-password-trigger').click();

    await expect(page).toHaveURL(/\/profile\/password$/);
    await expect(page.getByTestId('change-password-current-password')).toBeVisible();
});

test('GivenProfilePage_WhenEmailIsVerified_ThenVerifiedStateIsVisible', async ({ actor }) => {
    const page = await profilePage(actor);

    await expect(page.getByTestId('profile-email-verified-badge')).toBeVisible();
});
