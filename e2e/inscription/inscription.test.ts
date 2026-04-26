import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import { runSeed } from '../fixtures';

// ==================== HELPER FUNCTIONS ====================

/** Opens registration for a competition from the manage inscriptions page. */
async function openRegistration(page: Page, competitionId: number): Promise<void> {
    await page.goto(`/competition/${competitionId}/manage_inscriptions`);
    await expect(page.getByText('closed')).toBeVisible();
    await page.getByTestId('toggle-registration').click();
    await expect(page.getByTestId('registration-status')).toHaveText('open', { timeout: 10000 });
}

/** Signs up the current user for the first individual category and submits. */
async function signUpIndividualAndSubmit(page: Page, competitionId: number): Promise<void> {
    await page.goto(`/competitions/competition_details/${competitionId}/inscription`);
    await page.getByText('Sign Up', { exact: true }).first().click();
    await page.getByTestId('submit-all-registrations').click();
    await expect(page.getByTestId('inscription-status-badge')).toBeVisible({ timeout: 10000 });
}

/** Confirms the first pending inscription on the manage inscriptions page. */
async function confirmFirstInscription(page: Page, competitionId: number): Promise<void> {
    await page.goto(`/competition/${competitionId}/manage_inscriptions`);

    // Click the first inscription row to reveal action buttons
    const firstRow = page.locator('[data-testid^="inscription-record-"]').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // Click the accept button (now visible after selecting the row)
    await expect(page.getByTestId('confirm-inscription').first()).toBeVisible();
    await page.getByTestId('confirm-inscription').first().click();

    // Confirm in the popover
    await expect(page.getByTestId('confirm-popover-action')).toBeVisible();
    await page.getByTestId('confirm-popover-action').click();

    // Wait for the Confirmed section to appear (data reloaded after action)
    const confirmedToggle = page.getByTestId('toggle-section-confirmed');
    await expect(confirmedToggle).toBeVisible({ timeout: 5000 });

    // Expand the Confirmed section and verify a record is inside
    await confirmedToggle.click();
    await expect(page.locator('[data-testid^="inscription-record-"]')).toBeVisible({ timeout: 3000 });
}

// ==================== TYPES ====================

interface InscriptionTestData {
    happyPath: { competitionId: number; name: string };
    userIntent: { competitionId: number };
    groupTeam: { competitionId: number };
    unregister: { competitionId: number };
    refuseInscription: { competitionId: number };
    waitlist: { competitionId: number };
    removeQueued: { competitionId: number };
    multiCategory: { competitionId: number; individualCategoryId: number; pairsCategoryId: number };
}

// ==================== SEED ====================

let testData: InscriptionTestData;

test.beforeAll(async () => {
    testData = await runSeed<InscriptionTestData>(import.meta.url);
});

// ==================== TESTS ====================

test.describe('Inscription Happy Path', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.happyPath.competitionId;
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Step 1: Check competition visible', async () => {
        await organizerPage.goto(`/competitions/competition_details/${competitionId}`);
        await expect(organizerPage.getByText(testData.happyPath.name).first()).toBeVisible();
    });

    test('Step 2a: Participant cannot register when registration is closed', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);
        await expect(participantPage.getByTestId('registration-closed-warning')).toBeVisible();
        await expect(participantPage.getByText('Registration is currently closed')).toBeVisible();
    });

    test('Step 2b: Organizer opens registration', async () => {
        await openRegistration(organizerPage, competitionId);
    });

    test('Step 3: Participant registers and status is Pending Confirmation', async () => {
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending Confirmation');
    });

    test('Step 4: Organizer confirms the inscription', async () => {
        await confirmFirstInscription(organizerPage, competitionId);
    });

    test('Step 5a: Participant sees Confirmed status on inscription page', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);
        await expect(participantPage.getByTestId('inscription-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Confirmed');
    });

    test('Step 5b: Participant sees Confirmed status on competition details page', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}`);
        await expect(participantPage.getByTestId('category-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('category-status-badge')).toHaveText(/Confirmed/);
    });
});

// ==============================================================================
// Individual — Register a Non-Platform User (UserIntent)
// Workflow 3 + 5: Sign up yourself, then add another as UserIntent
// ==============================================================================

test.describe('Individual — Register Non-Platform User (UserIntent)', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    const userIntentName = 'Alice NonPlatform';

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.userIntent.competitionId;
    });

    // test.afterAll(async () => {
    //     await organizerPage.close();
    //     await participantPage.close();
    //     await organizerContext.close();
    //     await participantContext.close();
    // });

    test('Participant self-registers, then adds a UserIntent, and submits both', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // 1. Self-register (one-click individual signup)
        await participantPage.getByText('Sign Up', { exact: true }).first().click();

        // 2. Button should now say "Add another inscription" since user is already in category
        await participantPage.getByText('Add another inscription').first().click();

        // 3. Team builder opens with search input — type the UserIntent name
        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill(userIntentName);

        // 4. Wait for debounce (300ms) + dropdown to appear, click "Add as non-registered participant"
        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        // 5. The slot should be complete — the UserIntent name should be visible in the queued slot
        await expect(participantPage.getByText(userIntentName, { exact: true })).toBeVisible();

        // 6. Submit both registrations
        await participantPage.getByTestId('submit-all-registrations').click();

        // 7. Wait for submission and verify both records appear
        await expect(participantPage.getByTestId('inscription-status-badge').first()).toBeVisible({ timeout: 10000 });
        const badges = participantPage.getByTestId('inscription-status-badge');
        await expect(badges).toHaveCount(2);
    });

    test('Organizer sees both records including UserIntent on manage inscriptions', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // Should see the UserIntent name in the inscription list
        await expect(organizerPage.getByText(userIntentName, { exact: true })).toBeVisible();

        // Should see 2 pending inscription records
        await expect(organizerPage.locator('[data-testid^="inscription-record-"]')).toHaveCount(2);
    });
});

// ==============================================================================
// Group Category — Build a Team (Pairs) with UserIntent
// Workflow 4 + 5: Build a team with self + non-platform participant
// ==============================================================================

test.describe('Group Category — Build Team with UserIntent', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    const teammateIntentName = 'Bob NonPlatform';

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.groupTeam.competitionId;
    });

    // test.afterAll(async () => {
    //     await organizerPage.close();
    //     await participantPage.close();
    //     await organizerContext.close();
    //     await participantContext.close();
    // });

    test('Participant builds a pairs team with self + UserIntent and submits', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // 1. Click "Build Pair" (pairs category)
        await participantPage.locator('[data-testid^="signup-category-"]').first().click();

        // 2. Current user should be auto-added; team progress should show 1/2
        await expect(participantPage.getByText('Team').first()).toBeVisible();
        await expect(participantPage.getByText('/2 inscriptions you can submit')).toBeVisible();

        // 3. Search and add a UserIntent as the second team member
        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
        await searchInput.fill(teammateIntentName);

        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        // 4. Team should be complete (2/2) — queued slot should show both names
        await expect(participantPage.getByText(teammateIntentName, { exact : true })).toBeVisible();

        // 5. Submit
        await participantPage.getByTestId('submit-all-registrations').click();

        // 6. Verify the record appears with Pending Confirmation status
        await expect(participantPage.getByTestId('inscription-status-badge').first()).toBeVisible({ timeout: 10000 });
        await expect(participantPage.getByTestId('inscription-status-badge').first()).toHaveText('Pending Confirmation');

        // 7. Verify the UserIntent name is visible in the record
        await expect(participantPage.getByText(teammateIntentName)).toBeVisible();
    });

    test('Organizer sees the team record with UserIntent on manage inscriptions', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // The teammate UserIntent name should be visible
        await expect(organizerPage.getByText(teammateIntentName)).toBeVisible();

        // Click the row to reveal action buttons
        const firstRow = organizerPage.locator('[data-testid^="inscription-record-"]').first();
        await firstRow.click();

        // Accept the inscription
        await expect(organizerPage.getByTestId('confirm-inscription').first()).toBeVisible();
        await organizerPage.getByTestId('confirm-inscription').first().click();

        // Confirm in the popover
        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // Wait for the Confirmed section to appear and expand it
        const confirmedToggle = organizerPage.getByTestId('toggle-section-confirmed');
        await expect(confirmedToggle).toBeVisible({ timeout: 5000 });
        await confirmedToggle.click();
        await expect(organizerPage.getByText(teammateIntentName)).toBeVisible({ timeout: 3000 });
    });

    test('Participant receives confirmation notification', async () => {
        await participantPage.goto('/notifications');

        // Should see an "Inscription confirmed" notification
        await expect(participantPage.getByText('Inscription confirmed').first()).toBeVisible({ timeout: 5000 });
    });
});

// ==============================================================================
// Unregister from an Existing Record
// Workflow 10: Unregister after submitting
// ==============================================================================

test.describe('Unregister from Existing Record', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.unregister.competitionId;
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Participant registers, then unregisters', async () => {
        // Register
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending Confirmation');

        // Click the unregister button (red ✕ next to the record)
        const unregisterButton = participantPage.locator('form[action="?/unregister"] button[type="submit"]');
        await expect(unregisterButton).toBeVisible();
        await unregisterButton.click();

        // Record should disappear — no more status badges
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveCount(0, { timeout: 5000 });
    });

    test('Organizer sees no inscriptions after unregister', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);
        await expect(organizerPage.getByText('No inscriptions for this category')).toBeVisible();
    });
});

// ==============================================================================
// Organizer Refuses Inscription → Participant Gets Notification
// Workflow 9 (failure path): Organizer refuses instead of accepts
// ==============================================================================

test.describe('Organizer Refuses Inscription', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.refuseInscription.competitionId;
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Participant registers for the category', async () => {
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending Confirmation');
    });

    test('Organizer refuses the inscription', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // Click the first inscription row to reveal action buttons
        const firstRow = organizerPage.locator('[data-testid^="inscription-record-"]').first();
        await expect(firstRow).toBeVisible();
        await firstRow.click();

        // Click the refuse button
        await expect(organizerPage.getByTestId('refuse-inscription').first()).toBeVisible();
        await organizerPage.getByTestId('refuse-inscription').first().click();

        // Confirm in the popover
        await expect(organizerPage.getByTestId('confirm-popover-action')).toBeVisible();
        await organizerPage.getByTestId('confirm-popover-action').click();

        // After refusing, no more inscription records should be visible
        await expect(organizerPage.locator('[data-testid^="inscription-record-"]')).toHaveCount(0, { timeout: 5000 });
    });

    test('Participant sees refusal notification', async () => {
        await participantPage.goto('/notifications');
        await expect(participantPage.getByText('Inscription refused').first()).toBeVisible({ timeout: 5000 });
    });

    test('Participant no longer sees the inscription on the inscription page', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);
        // Refused records are not shown (only PENDING_CONFIRMATION, CONFIRMED, WAITLISTED)
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveCount(0);
    });
});

// ==============================================================================
// Waitlisting — Category Full → New Signup is Waitlisted
// Workflow 14: Automatic waitlisting when category is at capacity
// ==============================================================================

test.describe('Waitlisting', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.waitlist.competitionId;
    });

    test('Participant registers → Pending Confirmation, organizer confirms → fills the category', async () => {
        // Participant registers
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending Confirmation');

        // Organizer confirms → category now has 1/1 CONFIRMED = full
        await confirmFirstInscription(organizerPage, competitionId);
    });

    test('Organizer registers themselves → automatically Waitlisted', async () => {
        // Organizer goes to inscription page and signs up
        await signUpIndividualAndSubmit(organizerPage, competitionId);

        // Verify on manage inscriptions page that the new record is waitlisted
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // The Waitlisted section should appear with 1 record
        await expect(organizerPage.getByText('Waitlisted')).toBeVisible();

        // The Confirmed section should also be visible with the participant's record
        await expect(organizerPage.getByText('Confirmed')).toBeVisible();
    });

    test('Organizer sees waitlisted notification', async () => {
        await organizerPage.goto('/notifications');
        await expect(organizerPage.getByText('Inscription waitlisted').first()).toBeVisible({ timeout: 5000 });
    });
});

// ==============================================================================
// Remove Queued Signup Before Submitting
// Workflow 7: Queue a signup, remove it, verify submit bar disappears
// ==============================================================================

test.describe('Remove Queued Signup Before Submitting', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.removeQueued.competitionId;
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Queue a signup, remove it, verify submit bar disappears', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // Queue a signup
        await participantPage.getByText('Sign Up', { exact: true }).first().click();

        // Submit bar should appear
        await expect(participantPage.getByTestId('submit-all-registrations')).toBeVisible();

        // Remove the queued slot via the ✕ button on the dashed-border slot
        // The queued slot has a btn-icon with mdi:close inside a border-dashed container
        const queuedSlotRemoveButton = participantPage.locator('.border-dashed button.preset-filled-error-500');
        await expect(queuedSlotRemoveButton).toBeVisible();
        await queuedSlotRemoveButton.click();

        // Submit bar should disappear
        await expect(participantPage.getByTestId('submit-all-registrations')).not.toBeVisible();

        // Sign Up button should reappear
        await expect(participantPage.getByText('Sign Up', { exact: true }).first()).toBeVisible();
    });
});

// ==============================================================================
// Multi-Category Batch Submission
// Workflow 9: Register for multiple categories in a single submission
// ==============================================================================

test.describe('Multi-Category Batch Submission', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: number;

    const pairsIntentName = 'Charlie NonPlatform';
    let individualCategoryId: number;
    let pairsCategoryId: number;

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        competitionId = testData.multiCategory.competitionId;
        individualCategoryId = testData.multiCategory.individualCategoryId;
        pairsCategoryId = testData.multiCategory.pairsCategoryId;
    });

    test('Register for individual + build pairs team, submit all at once', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // 1. Sign up for the individual category
        await participantPage.getByTestId(`signup-category-${individualCategoryId}`).click();

        // 2. Build a team for the pairs category
        await participantPage.getByTestId(`signup-category-${pairsCategoryId}`).click();

        // 3. Should see team progress 1/2 (current user auto-added)
        await expect(participantPage.getByText('/2 inscriptions you can submit')).toBeVisible();

        // 4. Add a UserIntent as teammate
        const searchInput = participantPage.locator('input.input[placeholder*="Search"]');
        await searchInput.fill(pairsIntentName);
        await expect(participantPage.getByText('Add as non-registered participant')).toBeVisible({ timeout: 3000 });
        await participantPage.getByText('Add as non-registered participant').click();

        // 5. Both slots should be queued — submit bar should show 2 registrations
        await expect(participantPage.getByText('2 new registration(s)')).toBeVisible();

        // 6. Submit all at once
        await participantPage.getByTestId('submit-all-registrations').click();

        // 7. Verify both records appear with Pending Confirmation status
        await expect(participantPage.getByTestId('inscription-status-badge').first()).toBeVisible({ timeout: 10000 });
        const badges = participantPage.getByTestId('inscription-status-badge');
        await expect(badges).toHaveCount(2);
    });

    test('Organizer sees both records across categories', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // Should see the UserIntent name from the pairs registration
        await expect(organizerPage.getByText(pairsIntentName)).toBeVisible();

        // Should see 2 pending inscription records across categories
        await expect(organizerPage.locator('[data-testid^="inscription-record-"]')).toHaveCount(2);
    });
});
