import { expect, test } from '@playwright/test';

test.describe.configure({ mode: 'serial' });
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

test('GivenProfilePage_WhenEditingPhone_ThenPhoneIsSaved', async ({ page }) => {
    await page.goto('/profile');

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

test('GivenProfilePage_WhenEditingName_ThenNameIsSaved', async ({ page }) => {
    await page.goto('/profile');

    await page.getByTestId('profile-name-edit-button').click();
    await page.getByTestId('profile-name-input').fill('Test Participant');
    await page.getByTestId('profile-name-save-button').click();

    await expect(page.getByTestId('profile-name-value')).toHaveText('Test Participant');
});

test('GivenProfilePage_WhenClickingChangePassword_ThenNavigatesToPasswordPage', async ({ page }) => {
    await page.goto('/profile');

    await page.getByTestId('change-password-trigger').click();

    await expect(page).toHaveURL(/\/profile\/password$/);
    await expect(page.getByTestId('change-password-current-password')).toBeVisible();
});

test('GivenProfilePage_WhenEmailIsVerified_ThenVerifiedStateIsVisible', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.getByTestId('profile-email-verified-badge')).toBeVisible();
});
