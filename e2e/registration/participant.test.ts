import { expect, test, runSeed } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';
import {
    addExternalParticipant,
    signUpIndividualAndSubmit,
    signUpIndividualWithExternalAndSubmit,
    confirmFirstRegistration,
    submitAndConfirmPaymentIfNeeded,
} from './helpers';

// ── Types ──
interface ParticipantTestData {
    externalParticipant: { competitionId: number };
    groupTeam: { competitionId: number };
    unregister: { competitionId: number };
    removeQueued: { competitionId: number };
    multiCategory: { competitionId: number; individualCategoryId: number; pairsCategoryId: number };
    freeWithWarning: { competitionId: number };
}

// ── Seed (per worker; every invocation creates its own unique competitions) ──
let testData: ParticipantTestData;

test.beforeAll(async () => {
    testData = await runSeed<ParticipantTestData>(import.meta.url, {
        seedFile: 'seed-participant.ts',
    });
});

test('GivenRegistrationOpen_WhenParticipantAddsExternalParticipant_ThenOrganizerSeesBothEntries', async ({ participantPage, organizerPage }) => {
    const { competitionId } = testData.externalParticipant;
    const externalParticipantName = 'Alice NonPlatform';

    await test.step('participant signs up self and an external participant', async () => {
        await signUpIndividualWithExternalAndSubmit(participantPage, competitionId, externalParticipantName);
    });

    await test.step('organizer sees both entries on the manage page', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);
        await expect(organizerPage.getByText(externalParticipantName, { exact: true }).first()).toBeVisible();
        await expect(organizerPage.locator('[data-testid^="registration-row-entry-"]')).toHaveCount(2);
    });
});

test('GivenPairsCategory_WhenParticipantBuildsTeamAndOrganizerConfirms_ThenParticipantIsNotified', async ({ participantPage, organizerPage }) => {
    const { competitionId } = testData.groupTeam;
    const teammateIntentName = 'Bob NonPlatform';

    await test.step('participant builds a pair with an external teammate', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);

        await participantPage.locator('[data-testid^="signup-category-"]').first().click();
        await expect(participantPage.getByTestId('team-builder').first()).toBeVisible();

        await addExternalParticipant(participantPage, teammateIntentName);
        await submitAndConfirmPaymentIfNeeded(participantPage);

        await expect(participantPage.getByTestId('registration-status-badge').first()).toBeVisible();
        await expect(participantPage.getByTestId('registration-status-badge').first()).toHaveAttribute('data-status', 'PENDING_CONFIRMATION');
        await expect(participantPage.getByText(teammateIntentName)).toBeVisible();
    });

    await test.step('organizer confirms the team entry', async () => {
        await confirmFirstRegistration(organizerPage, competitionId);
    });

    await test.step('participant sees the confirmation notification', async () => {
        await gotoHydrated(participantPage, '/notifications');
        await expect(participantPage.locator('[data-testid="notification-item"][data-notification-type="REGISTRATION_CONFIRMED"]').first()).toBeVisible();
    });
});

test('GivenRegisteredParticipant_WhenParticipantUnregisters_ThenOrganizerSeesNoRegistrations', async ({ participantPage, organizerPage }) => {
    const { competitionId } = testData.unregister;

    await test.step('participant registers', async () => {
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveAttribute('data-status', 'PENDING_CONFIRMATION');
    });

    await test.step('participant unregisters via the confirmation popover', async () => {
        await participantPage.locator('[data-testid^="unregister-toggle-"]').first().click();
        await expect(participantPage.getByTestId('confirm-unregister')).toBeVisible();
        await participantPage.getByTestId('confirm-unregister').click();

        await expect(participantPage.getByTestId('registration-status-badge')).toHaveCount(0);
    });

    await test.step('organizer sees no registrations on the manage page', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);
        await expect(organizerPage.getByTestId('no-registrations')).toBeVisible();
    });
});

test('GivenQueuedSignup_WhenParticipantRemovesIt_ThenSubmitBarDisappearsAndSignUpReturns', async ({ participantPage }) => {
    const { competitionId } = testData.removeQueued;
    await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);

    await participantPage.locator('[data-testid^="signup-category-"]').first().click();
    await expect(participantPage.getByTestId('submit-all-registrations')).toBeVisible();

    await participantPage.getByTestId('remove-queued-slot').click();

    await expect(participantPage.getByTestId('submit-all-registrations')).not.toBeVisible();
    await expect(participantPage.locator('[data-testid^="signup-category-"]').first()).toBeVisible();
});

test('GivenMultipleCategories_WhenParticipantSubmitsBatch_ThenOrganizerSeesBothEntries', async ({ participantPage, organizerPage }) => {
    const { competitionId, individualCategoryId, pairsCategoryId } = testData.multiCategory;
    const pairsIntentName = 'Charlie NonPlatform';

    await test.step('participant queues an individual signup and a pairs team, then submits', async () => {
        await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);

        // Sign up for individual category
        await participantPage.getByTestId(`signup-category-${individualCategoryId}`).click();

        // Build a team for pairs category with an external teammate
        await participantPage.getByTestId(`signup-category-${pairsCategoryId}`).click();
        await addExternalParticipant(participantPage, pairsIntentName);

        await expect(participantPage.getByTestId('new-registrations-summary')).toContainText('2');

        await submitAndConfirmPaymentIfNeeded(participantPage);

        await expect(participantPage.getByTestId('registration-status-badge').first()).toBeVisible();
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveCount(2);
    });

    await test.step('organizer sees both entries on the manage page', async () => {
        await gotoHydrated(organizerPage, `/competition/${competitionId}/manage_registrations`);
        await expect(organizerPage.locator('[data-testid^="registration-row-entry-"]').filter({hasText: pairsIntentName}))
        await expect(organizerPage.locator('[data-testid^="registration-row-entry-"]')).toHaveCount(2);
    });
});

// Verifies that when showPaymentWarning=true but price=0, participant signups
// are still auto-confirmed (isFreeRegistration returns true when price === 0).
test('GivenShowPaymentWarningTrueButPriceZero_WhenParticipantClicksSubmit_ThenNoPopoverAndAutoConfirmed', async ({ participantPage }) => {
    const { competitionId } = testData.freeWithWarning;
    await gotoHydrated(participantPage, `/competitions/competition_details/${competitionId}/registration`);

    // Queue a signup
    await participantPage.locator('[data-testid^="signup-category-"]').first().click();

    // Click submit — should NOT show payment popover (price=0, despite showPaymentWarning=true)
    await participantPage.getByTestId('submit-all-registrations').click();
    await expect(participantPage.getByTestId('payment-warning-confirm')).toHaveCount(0);

    // Status should be auto-confirmed (isFreeRegistration returns true when price === 0)
    await expect(participantPage.getByTestId('registration-status-badge')).toHaveAttribute('data-status', 'CONFIRMED');
});
