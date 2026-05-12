import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import { runSeed } from '../fixtures';
import { signUpIndividualAndSubmit } from './helpers';

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
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`);

        // Self-register
        await participantPage.getByRole('button', { name: 'Sign Up' }).first().click();

        // Add another registration for an external participant
        await participantPage.getByRole('button', { name: 'Add another registration' }).first().click();

        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill(externalParticipantName);

        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        await expect(participantPage.getByText(externalParticipantName, { exact: true })).toBeVisible();

        await participantPage.getByTestId('submit-all-registrations').click();

        await expect(participantPage.getByTestId('registration-status-badge').first()).toBeVisible({ timeout: 10000 });
        const badges = participantPage.getByTestId('registration-status-badge');
        await expect(badges).toHaveCount(2);
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
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`);

        await participantPage.getByRole('button', { name: 'Build Pair' }).first().click();
        await expect(participantPage.getByText('Team').first()).toBeVisible();
        await expect(participantPage.getByText('1/2 registrations you can')).toBeVisible();

        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill(teammateIntentName);

        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        await expect(participantPage.getByText(teammateIntentName, { exact: true })).toBeVisible();

        await participantPage.getByTestId('submit-all-registrations').click();

        await expect(participantPage.getByTestId('registration-status-badge').first()).toBeVisible({ timeout: 10000 });
        await expect(participantPage.getByTestId('registration-status-badge').first()).toHaveText('Pending Confirmation');
        await expect(participantPage.getByText(teammateIntentName)).toBeVisible();
    });

    test('GivenTeamEntry_WhenOrganizerConfirms_ThenTeamIsConfirmed', async () => {
        const { competitionId } = testData.groupTeam;
        await organizerPage.goto(`/competition/${competitionId}/manage_registrations`);

        await expect(organizerPage.getByText(teammateIntentName)).toBeVisible();

        const firstRow = organizerPage.locator('[data-testid^="registration-entry-"]').first();
        await firstRow.click();

        await expect(organizerPage.getByTestId('confirm-registration').first()).toBeVisible();
        await organizerPage.getByTestId('confirm-registration').first().click();

        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible({ timeout: 5000 });
        await confirmedToggle.click();
        await expect(organizerPage.getByText(teammateIntentName)).toBeVisible({ timeout: 3000 });
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

        // Unregister
        const unregisterButton = participantPage.locator('form[action="?/unregister"] button[type="submit"]');
        await expect(unregisterButton).toBeVisible();
        await unregisterButton.click();

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
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`);

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
        await participantPage.goto(`/competitions/competition_details/${competitionId}/registration`);

        // Sign up for individual category
        await participantPage.getByTestId(`signup-category-${individualCategoryId}`).click();

        // Build a team for pairs category
        await participantPage.getByTestId(`signup-category-${pairsCategoryId}`).click();

        await expect(participantPage.getByText('/2 registrations you can submit')).toBeVisible();

        // Add an external participant as teammate
        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await searchInput.fill(pairsIntentName);
        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        await expect(participantPage.getByText('2 new registration(s)')).toBeVisible();

        await participantPage.getByTestId('submit-all-registrations').click();

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
