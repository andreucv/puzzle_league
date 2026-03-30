import { expect, test, type Page, type BrowserContext } from '@playwright/test';
import type { CompetitionData, CategoryData } from '../types';

// ==================== HELPER FUNCTIONS ====================

function formatDateToCalendarLabel(date: Date = new Date()): string {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    return `${weekday}, ${month} ${day},`;
}

/** Creates a competition with the given categories and returns the competition detail page URL. */
async function createCompetition(
    page: Page,
    competition: CompetitionData,
    categories: CategoryData[]
): Promise<string> {
    await page.goto('/competition/edit');
    await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

    await page.locator('input[name="competition_name"]').fill(competition.name);
    await page.locator('input[name="location"]').fill(competition.location);
    await page.locator('textarea[name="description"]').fill(competition.description);

    // Select today's date
    await page.getByTestId('date-picker').locator('button').first().click();
    await page.getByLabel(formatDateToCalendarLabel()).click();

    for (let i = 0; i < categories.length; i++) {
        const cat = categories[i];
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.locator(`#category-type-create-${i}`).selectOption(cat.type);
        await page.getByTestId(`description-create-${i}`).fill(cat.description);
        await page.getByTestId(`start-time-create-${i}`).fill(cat.start_time);
        await page.getByTestId(`end-time-create-${i}`).fill(cat.end_time);
        await page.getByTestId(`max-parties-create-${i}`).fill(cat.max_parties);
        await page.getByTestId(`max-party-size-create-${i}`).fill(cat.participants_per_party);
    }

    await page.getByTestId('submit-competition').click();
    await expect(page.getByText(competition.name).first()).toBeVisible();

    return page.url();
}

/** Extracts the competition ID from a competition detail URL. */
function extractCompetitionId(url: string): string {
    const match = url.match(/competition_details\/(\d+)/);
    if (!match) throw new Error(`Could not extract competition ID from URL: ${url}`);
    return match[1];
}

/** Opens registration for a competition from the manage inscriptions page. */
async function openRegistration(page: Page, competitionId: string): Promise<void> {
    await page.goto(`/competition/${competitionId}/manage_inscriptions`);
    await expect(page.getByText('closed')).toBeVisible();
    await page.getByTestId('toggle-registration').click();
    await expect(page.getByText('open')).toBeVisible({ timeout: 5000 });
}

/** Signs up the current user for the first individual category and submits. */
async function signUpIndividualAndSubmit(page: Page, competitionId: string): Promise<void> {
    await page.goto(`/competitions/competition_details/${competitionId}/inscription`);
    await page.getByText('Sign Up', { exact: true }).first().click();
    await page.getByTestId('submit-all-registrations').click();
    await expect(page.getByTestId('inscription-status-badge')).toBeVisible({ timeout: 10000 });
}

/** Accepts the first pending inscription on the manage inscriptions page. */
async function acceptFirstInscription(page: Page, competitionId: string): Promise<void> {
    await page.goto(`/competition/${competitionId}/manage_inscriptions`);
    await expect(page.getByTestId('accept-inscription').first()).toBeVisible();
    await page.getByTestId('accept-inscription').first().click();
    await expect(page.getByText('Inscription accepted successfully')).toBeVisible({ timeout: 5000 });
}

// ==================== TESTS ====================

test.describe('Inscription Happy Path', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'Happy Path Competition',
        location: 'Test Location',
        description: 'Competition for happy path inscription E2E tests',
    };

    const category: CategoryData = {
        description: '500 pcs',
        type: 'Individual',
        start_time: '10:00',
        end_time: '12:00',
        max_parties: '10',
        participants_per_party: '1',
    };

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        const competitionUrl = await createCompetition(organizerPage, competition, [category]);
        competitionId = extractCompetitionId(competitionUrl);
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Step 1: Competition is created and visible', async () => {
        await expect(organizerPage.getByText(competition.name).first()).toBeVisible();
        await expect(organizerPage.getByText(competition.description).first()).toBeVisible();
    });

    test('Step 2a: Participant cannot register when registration is closed', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);
        await expect(participantPage.getByTestId('registration-closed-warning')).toBeVisible();
        await expect(participantPage.getByText('Registration is currently closed')).toBeVisible();
    });

    test('Step 2b: Organizer opens registration', async () => {
        await openRegistration(organizerPage, competitionId);
    });

    test('Step 3: Participant registers and status is Pending', async () => {
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending');
    });

    test('Step 4: Organizer accepts the inscription', async () => {
        await acceptFirstInscription(organizerPage, competitionId);
    });

    test('Step 5a: Participant sees Accepted status on inscription page', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);
        await expect(participantPage.getByTestId('inscription-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Accepted');
    });

    test('Step 5b: Participant sees Accepted status on competition details page', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}`);
        await expect(participantPage.getByTestId('category-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('category-status-badge')).toHaveText(/Accepted/);
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
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'UserIntent Individual Competition',
        location: 'Test Location',
        description: 'Tests registering a non-platform participant',
    };

    const category: CategoryData = {
        description: '500 pcs solo',
        type: 'Individual',
        start_time: '10:00',
        end_time: '12:00',
        max_parties: '10',
        participants_per_party: '1',
    };

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

        const url = await createCompetition(organizerPage, competition, [category]);
        competitionId = extractCompetitionId(url);
        await openRegistration(organizerPage, competitionId);
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

        // Should see 2 pending records (the participant self + the UserIntent one)
        await expect(organizerPage.getByTestId('accept-inscription')).toHaveCount(2);
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
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'Pairs Team Build Competition',
        location: 'Test Location',
        description: 'Tests building a team for pairs category',
    };

    const category: CategoryData = {
        description: '500 pcs pairs',
        type: 'Pairs',
        start_time: '10:00',
        end_time: '12:00',
        max_parties: '10',
        participants_per_party: '2',
    };

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

        const url = await createCompetition(organizerPage, competition, [category]);
        competitionId = extractCompetitionId(url);
        await openRegistration(organizerPage, competitionId);
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

        // 6. Verify the record appears with Pending status
        await expect(participantPage.getByTestId('inscription-status-badge').first()).toBeVisible({ timeout: 10000 });
        await expect(participantPage.getByTestId('inscription-status-badge').first()).toHaveText('Pending');

        // 7. Verify the UserIntent name is visible in the record
        await expect(participantPage.getByText(teammateIntentName)).toBeVisible();
    });

    test('Organizer sees the team record with UserIntent on manage inscriptions', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // The teammate UserIntent name should be visible
        await expect(organizerPage.getByText(teammateIntentName)).toBeVisible();

        // Accept the inscription
        await organizerPage.getByTestId('accept-inscription').first().click();
        await expect(organizerPage.getByText('Inscription accepted successfully')).toBeVisible({ timeout: 5000 });
    });

    test('Participant receives acceptance notification', async () => {
        await participantPage.goto('/notifications');

        // Should see an "Inscription accepted" notification
        await expect(participantPage.getByText('Inscription accepted').first()).toBeVisible({ timeout: 5000 });
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
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'Unregister Test Competition',
        location: 'Test Location',
        description: 'Tests unregistering from a category',
    };

    const category: CategoryData = {
        description: '500 pcs unreg',
        type: 'Individual',
        start_time: '10:00',
        end_time: '12:00',
        max_parties: '10',
        participants_per_party: '1',
    };

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        const url = await createCompetition(organizerPage, competition, [category]);
        competitionId = extractCompetitionId(url);
        await openRegistration(organizerPage, competitionId);
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
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending');

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
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'Refuse Test Competition',
        location: 'Test Location',
        description: 'Tests organizer refusing an inscription',
    };

    const category: CategoryData = {
        description: '500 pcs refuse',
        type: 'Individual',
        start_time: '10:00',
        end_time: '12:00',
        max_parties: '10',
        participants_per_party: '1',
    };

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        const url = await createCompetition(organizerPage, competition, [category]);
        competitionId = extractCompetitionId(url);
        await openRegistration(organizerPage, competitionId);
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Participant registers for the category', async () => {
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending');
    });

    test('Organizer refuses the inscription', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        await expect(organizerPage.getByTestId('refuse-inscription').first()).toBeVisible();
        await organizerPage.getByTestId('refuse-inscription').first().click();
        await expect(organizerPage.getByText('Inscription refused successfully')).toBeVisible({ timeout: 5000 });
    });

    test('Participant sees refusal notification', async () => {
        await participantPage.goto('/notifications');
        await expect(participantPage.getByText('Inscription refused').first()).toBeVisible({ timeout: 5000 });
    });

    test('Participant no longer sees the inscription on the inscription page', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);
        // Refused records are not shown (only PENDING, ACCEPTED, WAITLISTED)
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
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'Waitlist Test Competition',
        location: 'Test Location',
        description: 'Tests waitlisting when category is full',
    };

    // Category with only 1 max party — first accepted fills it
    const category: CategoryData = {
        description: '500 pcs waitlist',
        type: 'Individual',
        start_time: '10:00',
        end_time: '12:00',
        max_parties: '1',
        participants_per_party: '1',
    };

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        const url = await createCompetition(organizerPage, competition, [category]);
        competitionId = extractCompetitionId(url);
        await openRegistration(organizerPage, competitionId);
    });

    test('Participant registers → Pending, organizer accepts → fills the category', async () => {
        // Participant registers
        await signUpIndividualAndSubmit(participantPage, competitionId);
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending');

        // Organizer accepts → category now has 1/1 ACCEPTED = full
        await acceptFirstInscription(organizerPage, competitionId);
    });

    test('Organizer registers themselves → automatically Waitlisted', async () => {
        // Organizer goes to inscription page and signs up
        await signUpIndividualAndSubmit(organizerPage, competitionId);

        // Verify on manage inscriptions page that the new record is waitlisted
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // The Waitlisted section should appear with 1 record
        await expect(organizerPage.getByText('Waitlisted')).toBeVisible();

        // The Accepted section should also be visible with the participant's record
        await expect(organizerPage.getByText('Accepted')).toBeVisible();
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
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'Remove Queued Competition',
        location: 'Test Location',
        description: 'Tests removing a queued signup',
    };

    const category: CategoryData = {
        description: '500 pcs remove',
        type: 'Individual',
        start_time: '10:00',
        end_time: '12:00',
        max_parties: '10',
        participants_per_party: '1',
    };

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        const url = await createCompetition(organizerPage, competition, [category]);
        competitionId = extractCompetitionId(url);
        await openRegistration(organizerPage, competitionId);
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
    let competitionId: string;

    const competition: CompetitionData = {
        name: 'Multi-Cat Batch Competition',
        location: 'Test Location',
        description: 'Tests registering for multiple categories at once',
    };

    const categories: CategoryData[] = [
        {
            description: '500 pcs individual',
            type: 'Individual',
            start_time: '10:00',
            end_time: '12:00',
            max_parties: '10',
            participants_per_party: '1',
        },
        {
            description: '500 pcs pairs',
            type: 'Pairs',
            start_time: '14:00',
            end_time: '16:00',
            max_parties: '10',
            participants_per_party: '2',
        },
    ];

    const pairsIntentName = 'Charlie NonPlatform';

    test.beforeAll(async ({ browser }) => {
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        const url = await createCompetition(organizerPage, competition, categories);
        competitionId = extractCompetitionId(url);
        await openRegistration(organizerPage, competitionId);
    });

    test('Register for individual + build pairs team, submit all at once', async () => {
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // 1. Sign up for the individual category
        await participantPage.locator('[data-testid^="signup-category-"]').first().click();

        // 2. Build a team for the pairs category
        await participantPage.locator('[data-testid^="signup-category-"]').first().click();

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

        // 7. Verify both records appear with Pending status
        await expect(participantPage.getByTestId('inscription-status-badge').first()).toBeVisible({ timeout: 10000 });
        const badges = participantPage.getByTestId('inscription-status-badge');
        await expect(badges).toHaveCount(2);
    });

    test('Organizer sees both records across categories', async () => {
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // Should see the UserIntent name from the pairs registration
        await expect(organizerPage.getByText(pairsIntentName)).toBeVisible();

        // Should see accept buttons for both categories' pending records
        await expect(organizerPage.getByTestId('accept-inscription')).toHaveCount(2);
    });
});
