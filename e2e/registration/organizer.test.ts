import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import { runSeed } from '../fixtures';
import { openRegistration, signUpIndividualAndSubmit, signUpIndividualWithExternalAndSubmit, confirmFirstRegistration } from './helpers';

// ── Config: sequential execution ──
test.describe.configure({ mode: 'serial' });
test.use({ storageState: 'playwright/.auth/organizer_user.json' });

// ── Types ──
interface OrganizerTestData {
    happyPath: { competitionId: number; name: string };
    refuseRegistration: { competitionId: number };
    waitlist: { competitionId: number };
}

// ── Seed & restore ──
let testData: OrganizerTestData;

test.beforeAll(async () => {
    testData = await runSeed<OrganizerTestData>(import.meta.url, {
        seedFile: 'seed-organizer.ts',
        dataFile: 'test-data-organizer.json',
    });
});

test.afterAll(async () => {
    await runSeed(import.meta.url, {
        seedFile: 'restore-organizer.ts',
        dataFile: 'test-data-organizer.json',
    });
});

/** Navigates to the given URL (defaults to the onboarding page) and waits for Svelte hydration to complete. */
async function gotoExplore(page: import('@playwright/test').Page, url: string = '') {
    await page.goto(url, { waitUntil: 'networkidle' });
}

// ==================== Registration Happy Path ====================

test.describe('Registration Happy Path', () => {
    test.describe.configure({ mode: 'serial' });

    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({ storageState: 'playwright/.auth/organizer_user.json' });
        participantContext = await browser.newContext({ storageState: 'playwright/.auth/participant_user.json' });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('GivenCompetition_WhenOrganizerChecksDetails_ThenCompetitionIsVisible', async () => {
        const { competitionId } = testData.happyPath;
        await organizerPage.goto(`/competitions/competition_details/${competitionId}`);
        await expect(organizerPage.getByText(testData.happyPath.name).first()).toBeVisible();
    });

    test('GivenRegistrationClosed_WhenParticipantTriesToRegister_ThenClosedWarningShown', async () => {
        const { competitionId } = testData.happyPath;
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`);
        await expect(participantPage.getByTestId('registration-closed-warning')).toBeVisible();
        await expect(participantPage.getByText('Registration is currently closed')).toBeVisible();
    });

    test('GivenRegistrationClosed_WhenOrganizerOpensRegistration_ThenStatusChangesToOpen', async () => {
        await openRegistration(organizerPage, testData.happyPath.competitionId);
    });

    test('GivenRegistrationOpen_WhenParticipantRegisters_ThenStatusIsPendingConfirmation', async () => {
        const { competitionId } = testData.happyPath;
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveText('Pending Confirmation');
    });

    test('GivenPendingRegistration_WhenOrganizerConfirms_ThenRegistrationIsConfirmed', async () => {
        await confirmFirstRegistration(organizerPage, testData.happyPath.competitionId);
    });

    test('GivenConfirmedRegistration_WhenParticipantChecksRegistrationPage_ThenStatusIsConfirmed', async () => {
        const { competitionId } = testData.happyPath;
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`);
        await expect(participantPage.getByTestId('registration-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveText('Confirmed');
    });

    test('GivenConfirmedRegistration_WhenParticipantChecksDetailsPage_ThenStatusIsConfirmed', async () => {
        const { competitionId } = testData.happyPath;
        await participantPage.goto(`/competitions/competition_details/${competitionId}`);
        await expect(participantPage.getByTestId('registration-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveText(/Confirmed/);
    });
});

// ==================== Organizer Refuses Registration ====================

test.describe('Organizer Refuses Registration', () => {
    test.describe.configure({ mode: 'serial' });

    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({ storageState: 'playwright/.auth/organizer_user.json' });
        participantContext = await browser.newContext({ storageState: 'playwright/.auth/participant_user.json' });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('GivenRegistrationOpen_WhenParticipantRegisters_ThenStatusIsPendingConfirmation', async () => {
        const { competitionId } = testData.refuseRegistration;
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveText('Pending Confirmation');
    });

    test('GivenPendingRegistration_WhenOrganizerRefuses_ThenRegistrationIsRemoved', async () => {
        const { competitionId } = testData.refuseRegistration;
        await organizerPage.goto(`/competition/${competitionId}/manage_registrations`);

        const firstRow = organizerPage.locator('[data-testid^="registration-row-entry-"]').first();
        await expect(firstRow).toBeVisible();
        // Retry click — the row may be SSR-rendered before Svelte hydrates the onclick handler
        await expect(async () => {
            await firstRow.click();
            await expect(organizerPage.getByTestId('refuse-registration').first()).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await organizerPage.getByTestId('refuse-registration').first().click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        await expect(organizerPage.locator('[data-testid^="registration-row-entry-"]')).toHaveCount(0, { timeout: 5000 });
    });

    test('GivenRefusedRegistration_WhenParticipantChecksNotifications_ThenRefusalNotificationShown', async () => {
        await participantPage.goto('/notifications');
        await expect(participantPage.getByText('Registration refused').first()).toBeVisible({ timeout: 5000 });
    });

    test('GivenRefusedRegistration_WhenParticipantChecksRegistrationPage_ThenNoRegistrationVisible', async () => {
        const { competitionId } = testData.refuseRegistration;
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`);
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveCount(0);
    });
});

// ==================== Waitlisting ====================

// What this test should cover:
// 1. The category has a max capacity of 2.
// 2. Participant registers himself and other non-platform user, filling up the category.
// 3. Organizer registers himself and other non-platform user, getting waitlisted both registrations.
// 4. Organizer sees waitlist notification.
// 5. Organizer confirms registers both registers from participant in pending status.
// 6. Organizer sees their waitlisted registrations still in waitlist.
// 7. Organizer refuses one of the confirmed registrations from participant.
// 8. The refused registration is removed from the list and the first waitlisted registration from the organizer is promoted to pending status, while the second one remains waitlisted.
// 9. Organizer sees the updated status in the UI.
// 10. Organizer refuses the pending registration from the organizer in pending status.
// 11. The refused registration is removed from the list and the second waitlisted registration from the organizer is promoted to pending status.
// 12. Organizer sees the updated status in the UI.
// 13. Organizer confirms the pending registration from the organizer in pending status.
// 14. Organizer sees the updated status in the UI.

// TODO: Confirmation popover in users competition_details/registration page when user tries to remove their registration.
test.describe('Waitlisting', () => {
    test.describe.configure({ mode: 'serial' });

    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({ storageState: 'playwright/.auth/organizer_user.json' });
        participantContext = await browser.newContext({ storageState: 'playwright/.auth/participant_user.json' });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    // Steps 1-2: Participant registers self + external, filling the category (maxParties=2)
    test('GivenOpenCategory_WhenParticipantRegistersSelfAndExternal_ThenCategoryIsFull', async () => {
        const { competitionId } = testData.waitlist;
        await signUpIndividualWithExternalAndSubmit(participantPage, competitionId, 'External Participant A');
        const badges = participantPage.getByTestId('registration-status-badge');
        await expect(badges).toHaveCount(2);
        await expect(badges.first()).toHaveText('Pending Confirmation');
        await expect(badges.last()).toHaveText('Pending Confirmation');
    });

    // Step 3: Organizer registers self + external → both waitlisted (category full)
    test('GivenFullCategory_WhenOrganizerRegistersSelfAndExternal_ThenBothAutoWaitlisted', async () => {
        const { competitionId } = testData.waitlist;
        await signUpIndividualWithExternalAndSubmit(organizerPage, competitionId, 'External Organizer B');
        const badges = organizerPage.getByTestId('registration-status-badge');
        await expect(badges).toHaveCount(2);
        await expect(badges.first()).toHaveText('Waitlisted');
        await expect(badges.last()).toHaveText('Waitlisted');
    });

    // Step 4: Organizer sees waitlist notification
    test('GivenWaitlistedRegistrations_WhenOrganizerChecksNotifications_ThenWaitlistNotificationShown', async () => {
        await organizerPage.goto('/notifications');
        await expect(organizerPage.getByText('Registration waitlisted').first()).toBeVisible({ timeout: 5000 });
    });

    // Steps 5-6: Organizer confirms both participant pending entries → 2 confirmed + 2 waitlisted
    test('GivenPendingAndWaitlisted_WhenOrganizerConfirmsBothPending_ThenConfirmedAndStillWaitlisted', async () => {
        const { competitionId } = testData.waitlist;

        // Confirm first pending entry
        await confirmFirstRegistration(organizerPage, competitionId);
        // Confirm second pending entry
        await confirmFirstRegistration(organizerPage, competitionId);

        // Navigate fresh to verify final state
        await gotoExplore(organizerPage, `/competition/${competitionId}/manage_registrations`);

        // Confirmed section should have 2 entries
        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible();
        await confirmedToggle.click();
        const confirmedRows = organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]');
        await expect(confirmedRows).toHaveCount(2, { timeout: 5000 });

        // Waitlisted section should have 2 entries
        const waitlistedToggle = organizerPage.getByTestId('toggle-section-waitlisted');
        await expect(waitlistedToggle).toBeVisible();
        await waitlistedToggle.click();
        // After expanding both sections, verify each section independently
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(2, { timeout: 5000 });
        await expect(organizerPage.locator('[data-testid="section-waitlisted"] [data-testid^="registration-row-entry-"]')).toHaveCount(2, { timeout: 5000 });

        // No pending entries should be visible (pending section is empty / not rendered)
        await expect(organizerPage.getByText('Pending Confirmation')).toHaveCount(0);
    });

    // Steps 7-9: Refuse one confirmed entry → first waitlisted promoted to pending, second still waitlisted
    test('GivenConfirmedAndWaitlisted_WhenOrganizerRefusesOneConfirmed_ThenFirstWaitlistedPromotedToPending', async () => {
        const { competitionId } = testData.waitlist;
        await gotoExplore(organizerPage, `/competition/${competitionId}/manage_registrations`);

        // Expand the Waitlisted section and capture both waitlisted entry IDs
        const waitlistedToggle = organizerPage.getByTestId('toggle-section-waitlisted');
        await expect(waitlistedToggle).toBeVisible();
        await waitlistedToggle.click();

        const waitlistedRows = organizerPage.locator('[data-testid="section-waitlisted"] [data-testid^="registration-row-entry-"]');
        await expect(waitlistedRows).toHaveCount(2);
        const waitlistedEntryId1 = (await waitlistedRows.nth(0).getAttribute('data-testid'))!.replace('registration-row-entry-', '');
        const waitlistedEntryId2 = (await waitlistedRows.nth(1).getAttribute('data-testid'))!.replace('registration-row-entry-', '');

        // Expand the Confirmed section to access confirmed entries
        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible();
        await confirmedToggle.click();

        // Select a confirmed entry (one that is NOT waitlisted)
        const confirmedRow = organizerPage.locator(
            `[data-testid^="registration-row-entry-"]:not([data-testid="registration-row-entry-${waitlistedEntryId1}"]):not([data-testid="registration-row-entry-${waitlistedEntryId2}"])`
        ).first();
        await expect(confirmedRow).toBeVisible();

        // Click the confirmed entry row to show the action menu, then refuse it
        // Retry — the row may be SSR-rendered before Svelte hydrates the onclick handler
        await expect(async () => {
            await confirmedRow.click();
            await expect(confirmedRow.getByTestId('refuse-registration')).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await confirmedRow.getByTestId('refuse-registration').click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // After refusal, the first waitlisted entry should be promoted to pending.
        // Expected state: 1 pending, 1 confirmed, 1 waitlisted

        // No error banner should appear — the refusal succeeded
        await expect(organizerPage.locator('.preset-filled-error-500')).toHaveCount(0);

        // Pending section should have 1 entry (promoted from waitlist)
        await expect(organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]')).toHaveCount(1, { timeout: 5000 });

        // Confirmed section should still have 1 entry
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(1, { timeout: 5000 });

        // Waitlisted section should still have 1 entry (second waitlisted not yet promoted)
        await expect(organizerPage.locator('[data-testid="section-waitlisted"] [data-testid^="registration-row-entry-"]')).toHaveCount(1, { timeout: 5000 });
    });

    // Steps 10-12: Refuse the promoted pending entry → second waitlisted promoted to pending
    test('GivenPromotedPendingAndWaitlisted_WhenOrganizerRefusesPending_ThenSecondWaitlistedPromotedToPending', async () => {
        const { competitionId } = testData.waitlist;
        await gotoExplore(organizerPage, `/competition/${competitionId}/manage_registrations`);

        // The pending entry (promoted from waitlist) should be visible by default
        const pendingRow = organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]').first();
        await expect(pendingRow).toBeVisible();

        // Refuse the pending entry
        await expect(async () => {
            await pendingRow.click();
            await expect(pendingRow.getByTestId('refuse-registration')).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await pendingRow.getByTestId('refuse-registration').click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // After refusal, the second waitlisted entry should be promoted to pending.
        // Expected state: 1 pending (newly promoted), 1 confirmed, 0 waitlisted

        // A pending entry should still be visible (the second waitlisted, now promoted)
        await expect(organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]')).toHaveCount(1, { timeout: 5000 });

        // Confirmed section should still have 1 entry
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(1, { timeout: 5000 });

        // Waitlisted section should be gone (both waitlisted entries have been promoted)
        await expect(organizerPage.getByTestId('toggle-section-waitlisted')).toHaveCount(0, { timeout: 5000 });
    });

    // Steps 13-14: Confirm the promoted pending entry → all done (2 confirmed total)
    test('GivenPromotedPending_WhenOrganizerConfirms_ThenTwoConfirmed', async () => {
        const { competitionId } = testData.waitlist;
        await gotoExplore(organizerPage, `/competition/${competitionId}/manage_registrations`);

        // The pending entry should be visible by default
        const pendingRow = organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]').first();
        await expect(pendingRow).toBeVisible();

        // Confirm the pending entry
        await expect(async () => {
            await pendingRow.click();
            await expect(pendingRow.getByTestId('confirm-registration')).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });
        await pendingRow.getByTestId('confirm-registration').click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // Expected final state: 2 confirmed, 0 pending, 0 waitlisted

        // Confirmed section should have 2 entries
        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible({ timeout: 5000 });
        await confirmedToggle.click();
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(2, { timeout: 5000 });

        // No waitlisted section
        await expect(organizerPage.getByTestId('toggle-section-waitlisted')).toHaveCount(0);
    });
});
