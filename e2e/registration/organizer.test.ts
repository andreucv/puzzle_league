import { expect, test, runSeed } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';
import {
    openRegistration,
    signUpIndividualAndSubmit,
    signUpIndividualWithExternalAndSubmit,
    confirmFirstRegistration,
} from './helpers';

// ── Types ──
interface OrganizerTestData {
    happyPath: { competitionId: number; name: string };
    refuseRegistration: { competitionId: number };
    waitlist: { competitionId: number };
    autoConfirm: { competitionId: number; name: string };
}

// ── Seed (per worker; every invocation creates its own unique competitions) ──
let testData: OrganizerTestData;

test.beforeAll(async () => {
    testData = await runSeed<OrganizerTestData>(import.meta.url, {
        seedFile: 'seed-organizer.ts',
    });
});

test('GivenClosedRegistration_WhenOrganizerOpensAndParticipantRegisters_ThenOrganizerConfirms', async ({ organizerPage, participantPage }) => {
    const { competitionId, name } = testData.happyPath;

    await test.step('organizer sees the competition details', async () => {
        await gotoHydrated(organizerPage, `/competitions/competition_details/${competitionId}`);
        await expect(organizerPage.getByText(name).first()).toBeVisible();
    });

    await test.step('participant sees the closed-registration warning', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);
        await expect(participantPage.getByTestId('registration-closed-warning')).toBeVisible();
    });

    await test.step('organizer opens registration', async () => {
        await openRegistration(organizerPage, competitionId);
    });

    await test.step('participant registers through the payment warning popover', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);

        // Queue a signup
        await participantPage.locator('[data-testid^="signup-category-"]').first().click();

        // Click submit — should open payment warning popover (showPaymentWarning=true + price>0)
        await participantPage.getByTestId('submit-all-registrations').click();

        // Verify the payment warning popover is visible with fee breakdown
        await expect(participantPage.getByTestId('payment-warning-confirm')).toBeVisible();
        await expect(participantPage.getByText('500€').first()).toBeVisible();

        // Confirm payment — actually submits the form
        await participantPage.getByTestId('payment-warning-confirm').click();

        await expect(participantPage.getByTestId('registration-status-badge')).toHaveAttribute('data-status', 'PENDING_CONFIRMATION');
    });

    await test.step('organizer confirms the pending registration', async () => {
        await confirmFirstRegistration(organizerPage, competitionId);
    });

    await test.step('participant sees Confirmed on the registration page', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);
        await expect(participantPage.getByTestId('registration-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveAttribute('data-status', 'CONFIRMED');
    });

    await test.step('participant sees Confirmed on the details page', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}`);
        await expect(participantPage.getByTestId('registration-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveAttribute('data-status', 'CONFIRMED');
    });
});

test('GivenPendingRegistration_WhenOrganizerRefuses_ThenParticipantIsNotifiedAndEntryRemoved', async ({ organizerPage, participantPage }) => {
    const { competitionId } = testData.refuseRegistration;

    await test.step('participant registers', async () => {
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveAttribute('data-status', 'PENDING_CONFIRMATION');
    });

    await test.step('organizer refuses the registration', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);

        const firstRow = organizerPage.locator('[data-testid^="registration-row-entry-"]').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();
        await organizerPage.getByTestId('refuse-registration').first().click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        await expect(organizerPage.locator('[data-testid^="registration-row-entry-"]')).toHaveCount(0);
    });

    await test.step('participant sees the refusal notification', async () => {
        await gotoHydrated(participantPage, '/notifications');
        await expect(participantPage.locator('[data-testid="notification-item"][data-notification-type="REGISTRATION_REFUSED"]').first()).toBeVisible();
    });

    await test.step('participant sees no registration on the registration page', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveCount(0);
    });
});

// Full waitlist lifecycle: category holds 2 parties; participant fills it,
// organizer's two signups land on the waitlist, and refusals promote
// waitlisted entries one at a time.
test('GivenFullCategory_WhenEntriesAreRefused_ThenWaitlistedEntriesArePromotedInOrder', async ({ organizerPage, participantPage }) => {
    const { competitionId } = testData.waitlist;

    await test.step('participant fills the category (self + external)', async () => {
        await signUpIndividualWithExternalAndSubmit(participantPage, competitionId, 'External Participant A');
        const badges = participantPage.getByTestId('registration-status-badge');
        await expect(badges).toHaveCount(2);
        await expect(badges.first()).toHaveAttribute('data-status', 'PENDING_CONFIRMATION');
        await expect(badges.last()).toHaveAttribute('data-status', 'PENDING_CONFIRMATION');
    });

    await test.step('organizer registers self + external — both auto-waitlisted', async () => {
        await signUpIndividualWithExternalAndSubmit(organizerPage, competitionId, 'External Organizer B');
        const badges = organizerPage.getByTestId('registration-status-badge');
        await expect(badges).toHaveCount(2);
        await expect(badges.first()).toHaveAttribute('data-status', 'WAITLISTED');
        await expect(badges.last()).toHaveAttribute('data-status', 'WAITLISTED');
    });

    await test.step('organizer sees the waitlist notification', async () => {
        await gotoHydrated(organizerPage, '/notifications');
        await expect(organizerPage.locator('[data-testid="notification-item"][data-notification-type="REGISTRATION_WAITLISTED"]').first()).toBeVisible();
    });

    await test.step('organizer confirms both pending entries — waitlisted stay waitlisted', async () => {
        await confirmFirstRegistration(organizerPage, competitionId);
        await confirmFirstRegistration(organizerPage, competitionId);

        // Navigate fresh to verify final state
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);

        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible();
        await confirmedToggle.click();

        const waitlistedToggle = organizerPage.getByTestId('toggle-section-waitlisted');
        await expect(waitlistedToggle).toBeVisible();
        await waitlistedToggle.click();

        // After expanding both sections, verify each section independently
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(2);
        await expect(organizerPage.locator('[data-testid="section-waitlisted"] [data-testid^="registration-row-entry-"]')).toHaveCount(2);

        // No pending entries should be visible (pending section is empty / not rendered)
        await expect(organizerPage.getByTestId('section-pending')).toHaveCount(0);
    });

    await test.step('refusing a confirmed entry promotes the first waitlisted entry to pending', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);

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
        await confirmedRow.click();
        await confirmedRow.getByTestId('refuse-registration').click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // After refusal, the first waitlisted entry should be promoted to pending.
        // Expected state: 1 pending, 1 confirmed, 1 waitlisted

        // Success banner confirms the refusal was applied
        await expect(organizerPage.getByTestId('action-result-success')).toBeVisible();

        await expect(organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]')).toHaveCount(1);
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(1);
        await expect(organizerPage.locator('[data-testid="section-waitlisted"] [data-testid^="registration-row-entry-"]')).toHaveCount(1);
    });

    await test.step('refusing the promoted pending entry promotes the second waitlisted entry', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);

        // The pending entry (promoted from waitlist) should be visible by default
        const pendingRow = organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]').first();
        await expect(pendingRow).toBeVisible();

        await pendingRow.click();
        await pendingRow.getByTestId('refuse-registration').click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // After refusal, the second waitlisted entry should be promoted to pending.
        // Expected state: 1 pending (newly promoted), 1 confirmed, 0 waitlisted
        await expect(organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]')).toHaveCount(1);
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(1);

        // Waitlisted section should be gone (both waitlisted entries have been promoted)
        await expect(organizerPage.getByTestId('toggle-section-waitlisted')).toHaveCount(0);
    });

    await test.step('confirming the promoted entry leaves two confirmed and an empty waitlist', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);

        const pendingRow = organizerPage.locator('[data-testid="section-pending"] [data-testid^="registration-row-entry-"]').first();
        await expect(pendingRow).toBeVisible();

        await pendingRow.click();
        await pendingRow.getByTestId('confirm-registration').click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // Expected final state: 2 confirmed, 0 pending, 0 waitlisted
        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible();
        await confirmedToggle.click();
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(2);

        await expect(organizerPage.getByTestId('toggle-section-waitlisted')).toHaveCount(0);
    });
});

// Verifies that when showPaymentWarning=false (free category), participant
// signups are auto-confirmed without requiring organizer confirmation.
test('GivenFreeCategory_WhenParticipantRegisters_ThenEntryIsAutoConfirmed', async ({ organizerPage, participantPage }) => {
    const { competitionId } = testData.autoConfirm;

    await test.step('organizer opens registration', async () => {
        await openRegistration(organizerPage, competitionId);
    });

    await test.step('participant submits without a payment warning and is auto-confirmed', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);

        // Queue a signup
        await participantPage.locator('[data-testid^="signup-category-"]').first().click();

        // Click submit — should NOT show payment warning popover (free category)
        await participantPage.getByTestId('submit-all-registrations').click();
        await expect(participantPage.getByTestId('payment-warning-confirm')).toHaveCount(0);

        // Status should be auto-confirmed immediately
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveAttribute('data-status', 'CONFIRMED');
    });

    await test.step('organizer finds the entry in the confirmed section', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);

        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible();
        await confirmedToggle.click();
        await expect(organizerPage.locator('[data-testid="section-confirmed"] [data-testid^="registration-row-entry-"]')).toHaveCount(1);
    });
});
