import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import { runSeed } from '../fixtures';
import { signUpIndividualAndSubmit, signUpIndividualWithExternalAndSubmit, confirmFirstRegistration, submitAndConfirmPaymentIfNeeded } from './helpers';

// ── Config: sequential execution ──
test.describe.configure({ mode: 'serial' });
test.use({ storageState: 'playwright/.auth/participant_user.json' });

// ── Types ──
interface ParticipantTestData {
    externalParticipant: { competitionId: number };
    groupTeam: { competitionId: number };
    unregister: { competitionId: number };
    removeQueued: { competitionId: number };
    multiCategory: { competitionId: number; individualCategoryId: number; pairsCategoryId: number };
    freeWithWarning: { competitionId: number };
}

// ── Seed & restore ──
let testData: ParticipantTestData;

test.beforeAll(async () => {
    testData = await runSeed<ParticipantTestData>(import.meta.url, {
        seedFile: 'seed-participant.ts',
        dataFile: 'test-data-participant.json',
    });
});

test.afterAll(async () => {
    await runSeed(import.meta.url, {
        seedFile: 'restore-participant.ts',
        dataFile: 'test-data-participant.json',
    });
});

// ==================== External Participant ====================

test.describe('Register Non-Platform User (External Participant)', () => {
    test.describe.configure({ mode: 'serial' });

    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;

    const externalParticipantName = 'Alice NonPlatform';

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

    test('GivenRegistrationOpen_WhenParticipantSignsUpAndAddsExternalParticipant_ThenBothRegistrationsSubmitted', async () => {
        const { competitionId } = testData.externalParticipant;
        await signUpIndividualWithExternalAndSubmit(participantPage, competitionId, externalParticipantName);
    });

    test('GivenBothRegistrations_WhenOrganizerChecksManagePage_ThenBothEntriesVisible', async () => {
        const { competitionId } = testData.externalParticipant;
        await organizerPage.goto(`/competition/${competitionId}/manage_registrations`);

        await expect(organizerPage.getByText(externalParticipantName, { exact: true })).toBeVisible();
        await expect(organizerPage.locator('[data-testid^="registration-row-entry-"]')).toHaveCount(2);
    });
});

// ==================== Group Category Build Team ====================

test.describe('Build Team with External Participant', () => {
    test.describe.configure({ mode: 'serial' });

    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;

    const teammateIntentName = 'Bob NonPlatform';

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

    test('GivenPairsCategory_WhenParticipantBuildsTeamWithExternalParticipant_ThenEntrySubmitted', async () => {
        const { competitionId } = testData.groupTeam;
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`, { waitUntil: 'networkidle' });

        await participantPage.getByRole('button', { name: 'Build Pair' }).first().click();
        await expect(participantPage.getByText('Team').first()).toBeVisible();

        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill(teammateIntentName);

        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        await expect(participantPage.getByText(teammateIntentName, { exact: true })).toBeVisible();

        await submitAndConfirmPaymentIfNeeded(participantPage);

        await expect(participantPage.getByTestId('registration-status-badge').first()).toBeVisible({ timeout: 10000 });
        await expect(participantPage.getByTestId('registration-status-badge').first()).toHaveText('Pending Confirmation');
        await expect(participantPage.getByText(teammateIntentName)).toBeVisible();
    });

    test('GivenTeamEntry_WhenOrganizerConfirms_ThenTeamIsConfirmed', async () => {
        await confirmFirstRegistration(organizerPage, testData.groupTeam.competitionId);
    });

    test('GivenConfirmedTeam_WhenParticipantChecksNotifications_ThenConfirmationNotificationShown', async () => {
        await participantPage.goto('/notifications');
        await expect(participantPage.getByText('Registration confirmed').first()).toBeVisible({ timeout: 5000 });
    });
});

// ==================== Unregister ====================

test.describe('Unregister from Existing Entry', () => {
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

    test('GivenRegisteredParticipant_WhenParticipantUnregisters_ThenEntryIsRemoved', async () => {
        const { competitionId } = testData.unregister;

        // Register
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveText('Pending Confirmation');

        // Click the X button to open unregister confirmation popover
        // Retry — the button may be SSR-rendered before Svelte hydrates the onclick handler
        await expect(async () => {
            await participantPage.locator('[data-testid^="unregister-toggle-"]').first().click();
            await expect(participantPage.getByTestId('confirm-unregister')).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });

        // Confirm unregister in the popover
        await participantPage.getByTestId('confirm-unregister').click();

        await expect(participantPage.getByTestId('registration-status-badge')).toHaveCount(0, { timeout: 5000 });
    });

    test('GivenUnregistered_WhenOrganizerChecksManagePage_ThenNoRegistrationsVisible', async () => {
        const { competitionId } = testData.unregister;
        await organizerPage.goto(`/competition/${competitionId}/manage_registrations`);
        await expect(organizerPage.getByText('No registrations for this category')).toBeVisible();
    });
});

// ==================== Remove Queued Signup ====================

test.describe('Remove Queued Signup Before Submitting', () => {
    // This test only needs the participant role
    let participantContext: BrowserContext;
    let participantPage: Page;

    test.beforeAll(async ({ browser }) => {
        participantContext = await browser.newContext({ storageState: 'playwright/.auth/participant_user.json' });
        participantPage = await participantContext.newPage();
    });

    test.afterAll(async () => {
        await participantPage.close();
        await participantContext.close();
    });

    test('GivenQueuedSignup_WhenParticipantRemovesIt_ThenSubmitBarDisappearsAndSignUpReturns', async () => {
        const { competitionId } = testData.removeQueued;
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`, { waitUntil: 'networkidle' });

        await participantPage.getByText('Sign Up', { exact: true }).first().click();
        await expect(participantPage.getByTestId('submit-all-registrations')).toBeVisible();

        const queuedSlotRemoveButton = participantPage.locator('.border-dashed button.preset-filled-error-500');
        await expect(queuedSlotRemoveButton).toBeVisible();
        await queuedSlotRemoveButton.click();

        await expect(participantPage.getByTestId('submit-all-registrations')).not.toBeVisible();
        await expect(participantPage.getByText('Sign Up', { exact: true }).first()).toBeVisible();
    });
});

// ==================== Multi-Category Batch ====================

test.describe('Multi-Category Batch Submission', () => {
    test.describe.configure({ mode: 'serial' });

    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;

    const pairsIntentName = 'Charlie NonPlatform';

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

    test('GivenMultipleCategories_WhenParticipantRegistersForBothAndSubmits_ThenBothEntriesCreated', async () => {
        const { competitionId, individualCategoryId, pairsCategoryId } = testData.multiCategory;
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`, { waitUntil: 'networkidle' });

        // Sign up for individual category
        await participantPage.getByTestId(`signup-category-${individualCategoryId}`).click();

        // Build a team for pairs category
        await participantPage.getByTestId(`signup-category-${pairsCategoryId}`).click();

        // Add an external participant as teammate
        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await searchInput.fill(pairsIntentName);
        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        await expect(participantPage.getByText('2 new registration(s)')).toBeVisible();

        await submitAndConfirmPaymentIfNeeded(participantPage);

        await expect(participantPage.getByTestId('registration-status-badge').first()).toBeVisible({ timeout: 10000 });
        const badges = participantPage.getByTestId('registration-status-badge');
        await expect(badges).toHaveCount(2);
    });

    test('GivenBatchSubmission_WhenOrganizerChecksManagePage_ThenBothEntriesVisible', async () => {
        const { competitionId } = testData.multiCategory;
        await organizerPage.goto(`/competition/${competitionId}/manage_registrations`);

        await expect(organizerPage.getByText(pairsIntentName)).toBeVisible();
        await expect(organizerPage.locator('[data-testid^="registration-entry-"]')).toHaveCount(2);
    });
});

// ==================== Free Category With Payment Warning (Edge Case) ====================
// Verifies that when showPaymentWarning=true but price=0, participant signups
// are still auto-confirmed (isFreeRegistration returns true when price === 0).

test.describe('Free Category With Payment Warning (Edge Case)', () => {
    let participantContext: BrowserContext;
    let participantPage: Page;

    test.beforeAll(async ({ browser }) => {
        participantContext = await browser.newContext({ storageState: 'playwright/.auth/participant_user.json' });
        participantPage = await participantContext.newPage();
    });

    test.afterAll(async () => {
        await participantPage.close();
        await participantContext.close();
    });

    test('GivenShowPaymentWarningTrueButPriceZero_WhenParticipantClicksSubmit_ThenNoPopoverAndAutoConfirmed', async () => {
        const { competitionId } = testData.freeWithWarning;
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`, { waitUntil: 'networkidle' });

        // Queue a signup
        await participantPage.getByRole('button', { name: 'Sign Up' }).first().click();

        // Click submit — should NOT show payment popover (price=0, despite showPaymentWarning=true)
        await participantPage.getByTestId('submit-all-registrations').click();
        await expect(participantPage.getByTestId('payment-warning-confirm')).toHaveCount(0);

        // Status should be auto-confirmed (isFreeRegistration returns true when price === 0)
        await expect(participantPage.getByTestId('registration-status-badge')).toHaveText('Confirmed');
    });
});
