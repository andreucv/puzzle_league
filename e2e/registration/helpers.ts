import { expect, type Page } from '@playwright/test';
import { gotoHydrated } from '../utils/navigation';

/**
 * Clicks the submit button and confirms the payment warning popover if it appears.
 * For paid categories (showPaymentWarning=true + price>0), the submit button opens
 * a popover instead of submitting; clicking confirm in the popover actually submits.
 * For free categories, the form submits directly.
 */
export async function submitAndConfirmPaymentIfNeeded(page: Page): Promise<void> {
    await page.getByTestId('submit-all-registrations').click();
    // Short timeout: this only probes whether the popover branch rendered
    try {
        await page.getByTestId('payment-warning-confirm').click({ timeout: 2000 });
    } catch {
        // No payment popover — free category, form was already submitted
    }
}

/** Opens registration for a competition from the manage registrations page. */
export async function openRegistration(page: Page, competitionId: number): Promise<void> {
    await gotoHydrated(page, `/competition/${competitionId}/manage_registrations`);
    await expect(page.getByText('closed')).toBeVisible();
    await page.getByTestId('toggle-registration').click();
    await expect(page.getByTestId('registration-status')).toHaveText('open');
}

/** Signs up the current user for the first individual category and submits (handles payment popover). */
export async function signUpIndividualAndSubmit(page: Page, competitionId: number): Promise<void> {
    await gotoHydrated(page, `/competitions/competition_details/${competitionId}/registration`);
    await page.getByRole('button', { name: 'Sign Up' }).first().click();
    await submitAndConfirmPaymentIfNeeded(page);
}

/** Adds an external (non-platform) participant to the currently open slot via the search input. */
export async function addExternalParticipant(page: Page, externalName: string): Promise<void> {
    const searchInput = page.getByTestId('participant-search-input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(externalName);

    await expect(page.getByText('Add as non-registered participant')).toBeVisible();
    await page.getByText('Add as non-registered participant').click();

    await expect(page.getByText(externalName, { exact: true })).toBeVisible();
}

/** Signs up the current user AND an external (non-platform) participant for the first individual category and submits both (handles payment popover). */
export async function signUpIndividualWithExternalAndSubmit(page: Page, competitionId: number, externalName: string): Promise<void> {
    await gotoHydrated(page, `/competitions/competition_details/${competitionId}/registration`);

    // Self-register
    await page.getByRole('button', { name: 'Sign Up' }).first().click();

    // Add another registration for an external participant
    await page.getByRole('button', { name: 'Add another registration' }).first().click();
    await addExternalParticipant(page, externalName);

    // Submit both registrations (handles payment popover if needed)
    await submitAndConfirmPaymentIfNeeded(page);

    // Wait for both status badges to appear
    await expect(page.getByTestId('registration-status-badge').first()).toBeVisible();
    await expect(page.getByTestId('registration-status-badge')).toHaveCount(2);
}

/** Confirms the first pending registration on the manage registrations page. */
export async function confirmFirstRegistration(page: Page, competitionId: number): Promise<void> {
    await gotoHydrated(page, `/competition/${competitionId}/manage_registrations`);

    const firstRow = page.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]').first();
    await expect(firstRow).toBeVisible();

    // Capture the specific entry ID before clicking, so we can assert it after confirmation
    const entryTestId = await firstRow.getAttribute('data-testid');

    await firstRow.click();
    await page.getByTestId('confirm-registration').first().click();

    await expect(page.getByTestId('confirm-popover-action')).toBeVisible();
    await page.getByTestId('confirm-popover-action').click();

    const confirmedToggle = page.getByTestId('toggle-section-confirmed');
    await expect(confirmedToggle).toBeVisible();

    await confirmedToggle.click();
    // Use the captured ID to verify entry moved to the confirmed section
    await expect(page.locator(`[data-testid="section-confirmed"] [data-testid="${entryTestId}"]`)).toBeVisible();
}
