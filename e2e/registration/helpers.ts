import { expect, type Page } from '@playwright/test';

/** Navigates to the given URL (defaults to the onboarding page) and waits for Svelte hydration to complete. */
async function gotoExplore(page: import('@playwright/test').Page, url: string = '') {
    await page.goto(url, { waitUntil: 'networkidle' });
}

/** Opens registration for a competition from the manage registrations page. */
export async function openRegistration(page: Page, competitionId: number): Promise<void> {
    await gotoExplore(page, `/competition/${competitionId}/manage_registrations`);
    await expect(page.getByText('closed')).toBeVisible();
    await page.getByTestId('toggle-registration').click();
    await expect(page.getByTestId('registration-status')).toHaveText('open', { timeout: 10000 });
}

/** Signs up the current user for the first individual category and submits. */
export async function signUpIndividualAndSubmit(page: Page, competitionId: number): Promise<void> {
    await gotoExplore(page, `/competitions/competition_details/${competitionId}/registration`);
    await page.getByRole('button', { name: 'Sign Up' }).first().click();
    await page.getByTestId('submit-all-registrations').click();
}

/** Signs up the current user AND an external (non-platform) participant for the first individual category and submits both. */
export async function signUpIndividualWithExternalAndSubmit(page: Page, competitionId: number, externalName: string): Promise<void> {
    await gotoExplore(page, `/competitions/competition_details/${competitionId}/registration`);

    // Self-register
    await page.getByRole('button', { name: 'Sign Up' }).first().click();

    // Add another registration for an external participant
    await page.getByRole('button', { name: 'Add another registration' }).first().click();

    const searchInput = page.locator('input.input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(externalName);

    await expect(page.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
    await page.getByText('Add as non-registered participant').click();

    await expect(page.getByText(externalName, { exact: true })).toBeVisible();

    // Submit both registrations
    await page.getByTestId('submit-all-registrations').click();

    // Wait for both status badges to appear
    await expect(page.getByTestId('registration-status-badge').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('registration-status-badge')).toHaveCount(2);
}

/** Confirms the first pending registration on the manage registrations page. */
export async function confirmFirstRegistration(page: Page, competitionId: number): Promise<void> {
    await gotoExplore(page, `/competition/${competitionId}/manage_registrations`);

    const firstRow = page.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]').first();
    await expect(firstRow).toBeVisible();

    // Capture the specific entry ID before clicking, so we can assert it after confirmation
    const entryTestId = await firstRow.getAttribute('data-testid');

    await expect(async () => {
        await firstRow.click();
        await expect(page.getByTestId('confirm-registration').first()).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });

    await page.getByTestId('confirm-registration').first().click();

    await expect(page.getByTestId('confirm-popover-action')).toBeVisible();
    await page.getByTestId('confirm-popover-action').click();

    const confirmedToggle = page.getByTestId('toggle-section-confirmed');
    await expect(confirmedToggle).toBeVisible({ timeout: 5000 });

    await confirmedToggle.click();
    // Use the captured ID to verify entry moved to the confirmed section
    await expect(page.locator(`[data-testid="section-confirmed"] [data-testid="${entryTestId}"]`)).toBeVisible({ timeout: 3000 });
}
