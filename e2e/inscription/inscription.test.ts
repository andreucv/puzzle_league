import { expect, test, type Page, type BrowserContext } from '@playwright/test';

// ==================== TEST DATA ====================

interface CompetitionData {
    name: string;
    location: string;
    description: string;
    country?: string;
    postal_code?: string;
}

interface CategoryData {
    description: string;
    type: string;
    start_time: string;
    end_time: string;
    max_parties: string;
    participants_per_party: string;
}

const competition: CompetitionData = {
    name: 'Inscription Test Competition',
    location: 'Test Location',
    description: 'Competition created for inscription E2E tests',
};

const category: CategoryData = {
    description: '500 pcs',
    type: 'Individual',
    start_time: '10:00',
    end_time: '12:00',
    max_parties: '10',
    participants_per_party: '1',
};

// ==================== HELPER FUNCTIONS ====================

function formatDateToCalendarLabel(date: Date = new Date()): string {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    return `${weekday}, ${month} ${day},`;
}

/** Creates a competition with one category and returns the competition detail page URL. */
async function createCompetitionWithCategory(page: Page): Promise<string> {
    await page.goto('/competition/edit');
    await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

    // Fill competition details
    await page.locator('input[name="competition_name"]').fill(competition.name);
    await page.locator('input[name="location"]').fill(competition.location);
    await page.locator('textarea[name="description"]').fill(competition.description);

    // Select today's date
    await page.getByTestId('date-picker').locator('button').first().click();
    await page.getByLabel(formatDateToCalendarLabel()).click();
    await page.getByLabel(formatDateToCalendarLabel()).click();

    // Add one category
    await page.getByRole('button', { name: 'Add Category' }).first().click();
    await page.locator('#category-type-create-0').selectOption(category.type);
    await page.getByTestId('description-create-0').fill(category.description);
    await page.getByTestId('start-time-create-0').fill(category.start_time);
    await page.getByTestId('end-time-create-0').fill(category.end_time);
    await page.getByTestId('max-parties-create-0').fill(category.max_parties);
    await page.getByTestId('max-party-size-create-0').fill(category.participants_per_party);

    // Submit
    await page.getByTestId('submit-competition').click();

    // Wait for competition details page to load
    await expect(page.getByText(competition.name).first()).toBeVisible();

    // Return the URL of the competition details page (contains the ID)
    return page.url();
}

/** Extracts the competition ID from a competition detail URL. */
function extractCompetitionId(url: string): string {
    const match = url.match(/competition_details\/(\d+)/);
    if (!match) throw new Error(`Could not extract competition ID from URL: ${url}`);
    return match[1];
}

// ==================== TESTS ====================

test.describe('Inscription Happy Path', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let competitionId: string;

    test.beforeAll(async ({ browser }) => {
        // Create contexts with stored auth states
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json'
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json'
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();

        // Step 1: Organizer creates competition with one category
        const competitionUrl = await createCompetitionWithCategory(organizerPage);
        competitionId = extractCompetitionId(competitionUrl);
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Step 1: Competition is created and visible', async () => {
        // Competition details should be visible after creation
        await expect(organizerPage.getByText(competition.name).first()).toBeVisible();
        await expect(organizerPage.getByText(competition.description).first()).toBeVisible();
        await expect(organizerPage.getByRole('heading', { name: category.type, level: 3 }).first()).toBeVisible();
    });

    test('Step 2a: Participant cannot register when registration is closed', async () => {
        // Navigate participant to the inscription page — registration is closed by default
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // Should see registration closed warning
        await expect(participantPage.getByTestId('registration-closed-warning')).toBeVisible();
        await expect(participantPage.getByText('Registration is currently closed')).toBeVisible();
    });

    test('Step 2b: Organizer opens registration', async () => {
        // Navigate to manage inscriptions page
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // Should see "Registration is closed"
        await expect(organizerPage.getByText('closed')).toBeVisible();

        // Click "Open" to open registration
        await organizerPage.getByTestId('toggle-registration').click();
        // Wait for the 2-second delay in ManageRegistrationStatus
        await expect(organizerPage.getByText('open')).toBeVisible({ timeout: 5000 });
    });

    test('Step 3: Participant registers and status is Pending', async () => {
        // Navigate participant to inscription page
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // Registration closed warning should NOT be visible now
        await expect(participantPage.getByTestId('registration-closed-warning')).not.toBeVisible();

        // Click "Sign Up" for the individual category
        await participantPage.getByText('Sign Up', { exact: true }).first().click();

        // Click "Submit All Registrations"
        await participantPage.getByTestId('submit-all-registrations').click();

        // Wait for the submission to complete (2 second artificial delay + processing)
        await expect(participantPage.getByTestId('inscription-status-badge')).toBeVisible({ timeout: 10000 });

        // Status should be Pending
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Pending');
    });

    test('Step 4: Organizer accepts the inscription', async () => {
        // Navigate organizer to manage inscriptions
        await organizerPage.goto(`/competition/${competitionId}/manage_inscriptions`);

        // Should see a pending inscription
        await expect(organizerPage.getByTestId('record-status-badge').first()).toBeVisible();
        await expect(organizerPage.getByTestId('record-status-badge').first()).toHaveText(/Pending/);

        // Click the accept button (green check)
        await organizerPage.getByTestId('accept-inscription').first().click();

        // Wait for the acceptance to process
        await expect(organizerPage.getByText('Inscription accepted successfully')).toBeVisible({ timeout: 5000 });

        // Status badge should now show Accepted
        await expect(organizerPage.getByTestId('record-status-badge').first()).toHaveText(/Accepted/);
    });

    test('Step 5a: Participant sees Accepted status on inscription page', async () => {
        // Reload inscription page
        await participantPage.goto(`/competitions/competition_details/${competitionId}/inscription`);

        // Status badge should show Accepted
        await expect(participantPage.getByTestId('inscription-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('inscription-status-badge')).toHaveText('Accepted');
    });

    test('Step 5b: Participant sees Accepted status on competition details page', async () => {
        // Navigate participant to competition details
        await participantPage.goto(`/competitions/competition_details/${competitionId}`);

        // CategoryCard should show the Accepted status badge
        await expect(participantPage.getByTestId('category-status-badge')).toBeVisible();
        await expect(participantPage.getByTestId('category-status-badge')).toHaveText(/Accepted/);
    });
});
