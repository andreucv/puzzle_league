import { expect, test, type Page } from '@playwright/test';

test.use({ storageState: "playwright/.auth/organizer_user.json" });

// ==================== TEST DATA ====================

interface CompetitionData {
    name: string;
    location: string;
    description: string;
    country?: string;
    postal_code?: string;
    payment_method?: string;
}

interface CategoryData {
    description: string;
    type: string;
    start_time: string;
    end_time: string;
    max_parties: string;
    participants_per_party: string;
    price: string;
}

const competition_data: { competition: CompetitionData; categories: CategoryData[] } = {
    competition: {
        name: "Test Competition",
        location: "Test Location",
        description: "Test Description",
        country: "Spain",
        postal_code: "28001",
        payment_method: "Cash at the door or bank transfer",
    },
    categories: [
        {
            description: "500 pcs",
            type: "Individual",
            start_time: "10:00",
            end_time: "12:00",
            max_parties: "10",
            participants_per_party: "1",
            price: "10",
        },
        {
            description: "500 pcs",
            type: "Pairs",
            start_time: "14:00",
            end_time: "16:00",
            max_parties: "10",
            participants_per_party: "2",
            price: "15",
        },
        {
            description: "1000 pcs",
            type: "Team",
            start_time: "18:00",
            end_time: "20:00",
            max_parties: "10",
            participants_per_party: "4",
            price: "20",
        }
    ]
};

const updated_competition_data: { competition: CompetitionData; categories: CategoryData[] } = {
    competition: {
        name: "Test Competition Updated",
        location: "Test Location Updated",
        description: "Test Description Updated",
        country: "Spain",
        postal_code: "28001",
        payment_method: "Bank transfer only",
    },
    categories: []
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Formats a date to match the calendar label format: "Weekday, Month Day,"
 * Example: "Tuesday, February 3," for February 3, 2026
 */
function formatDateToCalendarLabel(date: Date = new Date()): string {
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const day = date.getDate();
    return `${weekday}, ${month} ${day},`;
}

/** Navigates to the create competition page and asserts the heading is visible. */
async function navigateToCreateForm(page: Page) {
    await page.goto('/competition/edit');
    await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();
}

/** Fills the main competition detail fields (name, location, description, country, postal code, payment method). */
async function fillCompetitionDetails(page: Page, data: CompetitionData) {
    await page.locator('input[name="competition_name"]').fill(data.name);
    await page.locator('input[name="location"]').fill(data.location);
    await page.locator('textarea[name="description"]').fill(data.description);

    if (data.country) {
        await page.getByLabel('Toggle suggestions').click();
        await page.getByPlaceholder('Select a country...').fill('Spain');
        await page.getByRole('option', { name: '🇪🇸 Spain' }).click();
    }
    if (data.postal_code) {
        await page.getByRole('textbox', { name: 'e.g. 08001' }).fill(data.postal_code);
    }
    if (data.payment_method) {
        await page.getByTestId('payment-method').fill(data.payment_method);
    }
}

/** Selects today's date on the calendar date picker using the stable data-testid. */
async function selectTodaysDate(page: Page) {
    await page.getByTestId('date-picker').locator('button').first().click();
    await page.getByLabel(formatDateToCalendarLabel()).click();
    await page.getByLabel(formatDateToCalendarLabel()).click();
}

/**
 * Clicks "Add Category" and fills all category fields using stable data-testid locators.
 * @param index - the 0-based index of the category being added (for locating the correct inputs)
 */
async function addCategory(page: Page, index: number, category: CategoryData) {
    await page.getByRole('button', { name: 'Add Category' }).first().click();
    await page.locator(`#category-type-create-${index}`).selectOption(category.type);
    await page.getByTestId(`description-create-${index}`).fill(category.description);
    await page.getByTestId(`start-time-create-${index}`).fill(category.start_time);
    await page.getByTestId(`end-time-create-${index}`).fill(category.end_time);
    await page.getByTestId(`max-parties-create-${index}`).fill(category.max_parties);
    await page.getByTestId(`max-party-size-create-${index}`).fill(category.participants_per_party);
    await page.getByTestId(`price-create-${index}`).fill(category.price);
}

/**
 * Clicks "Add Category" and selects type, but lets the caller fill specific fields.
 * Useful for validation tests that need partial category data.
 */
async function addCategoryWithType(page: Page, index: number, type: string) {
    await page.getByRole('button', { name: 'Add Category' }).first().click();
    await page.locator(`#category-type-create-${index}`).selectOption(type);
}

/** Clicks the submit button using the stable data-testid. */
async function submitCompetition(page: Page) {
    await page.getByTestId('submit-competition').click();
}

/** Asserts the competition details page shows the expected competition and category data. */
async function assertCompetitionCreated(page: Page, competition: CompetitionData, categories: CategoryData[]) {
    await expect(page.getByText(competition.name).first()).toBeVisible();
    await expect(page.getByText(competition.description).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: competition.location }).first()).toBeVisible();

    if (competition.payment_method) {
        await expect(page.getByText(competition.payment_method).first()).toBeVisible();
    }

    for (const cat of categories) {
        // CategoryCard renders: "{type}" as h3 heading, "{description}" as paragraph, and "{startTime} – {endTime}" in a time block
        await expect(page.getByRole('heading', { name: cat.type, level: 3 }).first()).toBeVisible();
        // Verify price is displayed
        await expect(page.getByText(`${cat.price} €`).first()).toBeVisible();
    }
}

// ==================== HAPPY PATH TESTS ====================

test('GivenCreateCompetitionPage_WhenOrganizerCreatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {
    await navigateToCreateForm(page);
    await fillCompetitionDetails(page, competition_data.competition);
    await selectTodaysDate(page);

    for (let i = 0; i < competition_data.categories.length; i++) {
        await addCategory(page, i, competition_data.categories[i]);
    }

    await submitCompetition(page);
    await assertCompetitionCreated(page, competition_data.competition, competition_data.categories);
});

test('GivenCreateCompetitionPage_WhenOrganizerCreatesAndUpdatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {
    await navigateToCreateForm(page);
    await fillCompetitionDetails(page, competition_data.competition);
    await selectTodaysDate(page);

    for (let i = 0; i < competition_data.categories.length; i++) {
        await addCategory(page, i, competition_data.categories[i]);
    }

    await submitCompetition(page);
    await assertCompetitionCreated(page, competition_data.competition, competition_data.categories);

    // Navigate to edit and update the competition
    await page.getByRole('link', { name: 'Edit Competition' }).click();
    await expect(page.getByRole('heading', { name: 'Edit competition' }).first()).toBeVisible();

    // Update details and submit again
    await fillCompetitionDetails(page, updated_competition_data.competition);
    await submitCompetition(page);

    // Assert the updated details are shown
    await assertCompetitionCreated(page, updated_competition_data.competition, updated_competition_data.categories);
});

// ==================== VALIDATION ERROR TESTS (Unhappy Paths) ====================

test.describe('Create Competition Form Validation', () => {

    test('GivenCreateCompetitionPage_WhenCompetitionNameIsEmpty_ThenShowsRequiredError', async ({ page }) => {
        await navigateToCreateForm(page);

        await submitCompetition(page);

        await expect(page.getByText('Competition name is required')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCompetitionNameIsTooShort_ThenShowsMinLengthError', async ({ page }) => {
        await navigateToCreateForm(page);

        await page.locator('input[name="competition_name"]').fill('AB');
        await submitCompetition(page);

        await expect(page.getByText('Competition name must be at least 3 characters')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenDateIsNotSelected_ThenShowsDateRequiredError', async ({ page }) => {
        await navigateToCreateForm(page);

        await page.locator('input[name="competition_name"]').fill('Valid Competition Name');
        await submitCompetition(page);

        await expect(page.getByText('Select a date')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryStartTimeIsMissing_ThenShowsStartTimeRequiredError', async ({ page }) => {
        await navigateToCreateForm(page);
        await page.locator('input[name="competition_name"]').fill('Valid Competition');
        await selectTodaysDate(page);

        await addCategoryWithType(page, 0, 'Individual');
        await page.getByTestId('description-create-0').fill('Valid Category');
        await page.getByTestId('end-time-create-0').fill('12:00');
        await page.getByTestId('max-parties-create-0').fill('10');

        await submitCompetition(page);

        await expect(page.getByText('Start time is required')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryEndTimeIsMissing_ThenShowsEndTimeRequiredError', async ({ page }) => {
        await navigateToCreateForm(page);
        await page.locator('input[name="competition_name"]').fill('Valid Competition');
        await selectTodaysDate(page);

        await addCategoryWithType(page, 0, 'Individual');
        await page.getByTestId('description-create-0').fill('Valid Category');
        await page.getByTestId('start-time-create-0').fill('10:00');
        await page.getByTestId('max-parties-create-0').fill('10');

        await submitCompetition(page);

        await expect(page.getByText('End time is required')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryMaxPartiesIsMissing_ThenShowsMaxPartiesRequiredError', async ({ page }) => {
        await navigateToCreateForm(page);
        await page.locator('input[name="competition_name"]').fill('Valid Competition');
        await selectTodaysDate(page);

        await addCategoryWithType(page, 0, 'Individual');
        await page.getByTestId('description-create-0').fill('Valid Category');
        await page.getByTestId('start-time-create-0').fill('10:00');
        await page.getByTestId('end-time-create-0').fill('12:00');

        await submitCompetition(page);

        await expect(page.getByText('Max parties must be at least 1')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenMultipleFieldsAreMissing_ThenShowsFirstErrorAndFocusesField', async ({ page }) => {
        await navigateToCreateForm(page);

        await submitCompetition(page);

        await expect(page.getByText('Competition name is required')).toBeVisible();
        await expect(page.locator('input[name="competition_name"]')).toBeFocused();
    });

    test('GivenCreateCompetitionPage_WhenErrorIsFixedAndResubmitted_ThenErrorDisappears', async ({ page }) => {
        await navigateToCreateForm(page);

        await submitCompetition(page);
        await expect(page.getByText('Competition name is required')).toBeVisible();

        await page.locator('input[name="competition_name"]').fill('Valid Competition Name');
        await expect(page.getByText('Competition name is required')).not.toBeVisible();
    });

});
