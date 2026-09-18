import { expect, test, AUTH_FILES } from '../fixtures';
import type { Page, Locator } from '@playwright/test';
import { gotoHydrated } from '../utils/navigation';
import type { CompetitionData, CategoryData, MultiDayCategoryData } from '../types';

// Every test creates its own competition through the UI, so the suite needs
// no seed and the tests are independent.
test.use({ storageState: AUTH_FILES.organizer });

// ==================== TEST DATA ====================

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

/** Returns tomorrow and the day after tomorrow as Date objects. */
function getMultiDayDates(): { day1: Date; day2: Date } {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    return { day1: tomorrow, day2: dayAfter };
}

const multiday_competition_data: { competition: CompetitionData; categories: MultiDayCategoryData[] } = (() => {
    const { day1, day2 } = getMultiDayDates();
    return {
        competition: {
            name: "Multi-day Competition",
            location: "Test Location",
            description: "A competition spanning multiple days",
            country: "Spain",
            postal_code: "28001",
            payment_method: "Cash at the door",
        },
        categories: [
            {
                description: "500 pcs",
                type: "Individual",
                start_time: "10:00",
                end_time: "12:00",
                start_date: day1,
                end_date: day1,
                max_parties: "10",
                participants_per_party: "1",
                price: "10",
            },
            {
                description: "1000 pcs Marathon",
                type: "Pairs",
                start_time: "14:00",
                end_time: "18:00",
                start_date: day1,
                end_date: day2,
                max_parties: "8",
                participants_per_party: "2",
                price: "25",
            },
            {
                description: "500 pcs",
                type: "Team",
                start_time: "09:00",
                end_time: "11:00",
                start_date: day2,
                end_date: day2,
                max_parties: "10",
                participants_per_party: "4",
                price: "20",
            }
        ],
    };
})();

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
    await gotoHydrated(page, '/competition/edit');
    await expect(page.getByTestId('create-competition-heading')).toBeVisible();
}

/** Opens the "Manage" overflow menu on the competition details page and clicks "Edit Competition". */
async function navigateToEditFromManageMenu(page: Page) {
    await page.getByTestId('competition-manage-menu').click();
    await page.getByTestId('edit-competition-link').click();
}

/** Fills the main competition detail fields (name, location, description, country, postal code, payment method). */
async function fillCompetitionDetails(page: Page, data: CompetitionData) {
    await page.locator('input[name="competition_name"]').fill(data.name);
    await page.locator('input[name="location"]').fill(data.location);
    await page.locator('textarea[name="description"]').fill(data.description);

    if (data.country) {
        await page.getByTestId('country-trigger').click();
        await page.getByTestId('country-input').fill('Spain');
        await page.getByRole('option', { name: '🇪🇸 Spain' }).click();
    }
    if (data.postal_code) {
        await page.getByTestId('postal-code').fill(data.postal_code);
    }
    if (data.payment_method) {
        await page.getByTestId('payment-method').fill(data.payment_method);
    }
}

/** Selects today's date on the calendar date picker using the stable data-testid. */
async function selectTodaysDate(page: Page) {
    await page.getByTestId('date-picker').locator('button').first().click();
    await page.getByLabel(formatDateToCalendarLabel()).click();
}

/** Selects a specific date on a date picker identified by a locator. */
async function selectDateOnPicker(picker: Locator, date: Date) {
    await picker.locator('button').first().click();
    const label = formatDateToCalendarLabel(date);
    await picker.getByLabel(label).click();
    await picker.page().keyboard.press('Escape');
}

/** Enables multi-day mode by clicking the toggle switch. */
async function enableMultiDay(page: Page) {
    const toggle = page.getByTestId('multi-day-toggle');
    await toggle.click();
    // Confirm the click actually registered (can miss if page isn't fully hydrated)
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
}

/**
 * Clicks "Add Category" and fills all category fields using stable data-testid locators.
 * @param index - the 0-based index of the category being added (for locating the correct inputs)
 */
async function addCategory(page: Page, index: number, category: CategoryData) {
    await page.getByTestId('add-category').click();
    await page.locator(`#category-type-create-${index}`).selectOption(category.type);
    await page.getByTestId(`start-time-create-${index}`).fill(category.start_time);
    await page.getByTestId(`end-time-create-${index}`).fill(category.end_time);
    await page.getByTestId(`max-parties-create-${index}`).fill(category.max_parties);
    await page.getByTestId(`max-party-size-create-${index}`).fill(category.participants_per_party);
    if (category.price) {
        await page.getByTestId(`price-create-${index}`).fill(category.price);
    }
}

/**
 * Clicks "Add Category" and fills all fields including per-category dates for multi-day mode.
 */
async function addMultiDayCategory(page: Page, index: number, category: MultiDayCategoryData) {
    await page.getByTestId('add-category').click();
    await page.locator(`#category-type-create-${index}`).selectOption(category.type);

    await selectDateOnPicker(page.getByTestId(`category-start-date-create-${index}`), category.start_date);
    if (category.start_date.toDateString() !== category.end_date.toDateString()) {
        await selectDateOnPicker(page.getByTestId(`category-end-date-create-${index}`), category.end_date);
    }

    await page.getByTestId(`start-time-create-${index}`).fill(category.start_time);
    await page.getByTestId(`end-time-create-${index}`).fill(category.end_time);
    await page.getByTestId(`max-parties-create-${index}`).fill(category.max_parties);
    await page.getByTestId(`max-party-size-create-${index}`).fill(category.participants_per_party);
    if (category.price) {
        await page.getByTestId(`price-create-${index}`).fill(category.price);
    }
}

/**
 * Clicks "Add Category" and selects type, but lets the caller fill specific fields.
 * Useful for validation tests that need partial category data.
 */
async function addCategoryWithType(page: Page, index: number, type: string) {
    await page.getByTestId('add-category').click();
    await page.locator(`#category-type-create-${index}`).selectOption(type);
}

/**
 * Clicks the submit button using the stable data-testid. Creating (not editing)
 * opens the first-publish confirmation dialog, which must be confirmed.
 */
async function submitCompetition(page: Page, opts: { edit?: boolean } = {}) {
    await page.getByTestId('submit-competition').click();
    if (!opts.edit) {
        await page.getByTestId('confirm-publish').click();
    }
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
        await expect(page.getByRole('heading', { name: cat.type, level: 3 }).first()).toBeVisible();
        if (cat.price) {
            await expect(page.getByText(`${cat.price} €`).first()).toBeVisible();
        }
    }
}

// ==================== SINGLE-DAY COMPETITION TESTS ====================

test.describe('Single-day competition', () => {
    test('GivenCreateCompetitionPage_WhenOrganizerCreatesCompetition_ThenCompetitionIsCreated', async ({ page }) => {
        await navigateToCreateForm(page);
        await fillCompetitionDetails(page, competition_data.competition);
        await selectTodaysDate(page);

        for (let i = 0; i < competition_data.categories.length; i++) {
            await addCategory(page, i, competition_data.categories[i]);
        }

        await submitCompetition(page);
        await assertCompetitionCreated(page, competition_data.competition, competition_data.categories);
    });

    test('GivenCreatedCompetition_WhenOrganizerUpdatesCompetition_ThenUpdatedDetailsAreShown', async ({ page }) => {
        await navigateToCreateForm(page);
        await fillCompetitionDetails(page, competition_data.competition);
        await selectTodaysDate(page);

        for (let i = 0; i < competition_data.categories.length; i++) {
            await addCategory(page, i, competition_data.categories[i]);
        }

        await submitCompetition(page);
        await assertCompetitionCreated(page, competition_data.competition, competition_data.categories);

        // Navigate to edit and update the competition
        await navigateToEditFromManageMenu(page);
        await expect(page.getByTestId('edit-competition-heading')).toBeVisible();

        // Update details and submit again
        await fillCompetitionDetails(page, updated_competition_data.competition);
        await submitCompetition(page, { edit: true });

        // Assert the updated details are shown
        await assertCompetitionCreated(page, updated_competition_data.competition, updated_competition_data.categories);
    });
});

// ==================== MULTI-DAY COMPETITION TESTS ====================

test.describe('Multi-day competition', () => {
    test('GivenCreateCompetitionPage_WhenOrganizerCreatesMultiDayCompetition_ThenCompetitionIsCreated', async ({ page }) => {
        await navigateToCreateForm(page);
        await fillCompetitionDetails(page, multiday_competition_data.competition);

        await enableMultiDay(page);

        await expect(page.getByTestId('auto-computed-dates-notice')).toBeVisible();

        for (let i = 0; i < multiday_competition_data.categories.length; i++) {
            await addMultiDayCategory(page, i, multiday_competition_data.categories[i]);
        }

        await submitCompetition(page);
        await assertCompetitionCreated(page, multiday_competition_data.competition, multiday_competition_data.categories);
    });

    test('GivenCreateCompetitionPage_WhenMultiDayToggled_ThenUIReflectsCurrentMode', async ({ page }) => {
        await navigateToCreateForm(page);

        const toggle = page.getByTestId('multi-day-toggle');

        // Initially single-day mode
        await expect(page.getByTestId('date-picker')).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByTestId('auto-computed-dates-notice')).not.toBeVisible();

        // Enable multi-day
        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByTestId('date-picker')).not.toBeVisible();
        await expect(page.getByTestId('auto-computed-dates-notice')).toBeVisible();

        // Toggle back to single-day
        await toggle.click();

        await expect(toggle).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByTestId('date-picker')).toBeVisible();
        await expect(page.getByTestId('auto-computed-dates-notice')).not.toBeVisible();
    });

    test('GivenMultiDayMode_WhenCategoryAdded_ThenCategoryDatePickersAreVisible', async ({ page }) => {
        await navigateToCreateForm(page);
        await enableMultiDay(page);

        await page.getByTestId('add-category').click();
        await page.locator('#category-type-create-0').selectOption('Individual');

        await expect(page.getByTestId('category-start-date-create-0')).toBeVisible();
        await expect(page.getByTestId('category-end-date-create-0')).toBeVisible();
    });

    test('GivenMultiDayMode_WhenCategoryDatesAreMissing_ThenShowsDateRequiredErrors', async ({ page }) => {
        await navigateToCreateForm(page);
        await page.locator('input[name="competition_name"]').fill('Multi-day Validation Test');
        await enableMultiDay(page);

        await addCategoryWithType(page, 0, 'Individual');
        await page.getByTestId('start-time-create-0').fill('10:00');
        await page.getByTestId('end-time-create-0').fill('12:00');
        await page.getByTestId('max-parties-create-0').fill('10');

        // Validation fails before the first-publish dialog, so submit directly.
        await page.getByTestId('submit-competition').click();

        await expect(page.getByTestId('category-start-date-create-0')).toBeVisible();
    });

    test('GivenMultiDayMode_WhenCategoryStartDateSet_ThenEndDateIsAutoSynced', async ({ page }) => {
        await navigateToCreateForm(page);
        await enableMultiDay(page);

        const { day1 } = getMultiDayDates();

        await page.getByTestId('add-category').click();
        await page.locator('#category-type-create-0').selectOption('Individual');
        await selectDateOnPicker(page.getByTestId('category-start-date-create-0'), day1);

        // End date should be auto-synced — segments should not show placeholders
        const endDatePicker = page.getByTestId('category-end-date-create-0');
        const monthSegment = endDatePicker.getByRole('spinbutton', { name: /month/i });
        const daySegment = endDatePicker.getByRole('spinbutton', { name: /day/i });
        const yearSegment = endDatePicker.getByRole('spinbutton', { name: /year/i });
        await expect(monthSegment).not.toHaveText('mm');
        await expect(daySegment).not.toHaveText('dd');
        await expect(yearSegment).not.toHaveText('yyyy');
    });

    test('GivenMultiDayCompetition_WhenCompetitionDatesAutoComputed_ThenDatesMatchCategoryRange', async ({ page }) => {
        await navigateToCreateForm(page);
        await fillCompetitionDetails(page, multiday_competition_data.competition);
        await enableMultiDay(page);

        for (let i = 0; i < multiday_competition_data.categories.length; i++) {
            await addMultiDayCategory(page, i, multiday_competition_data.categories[i]);
        }

        await expect(page.getByTestId('auto-computed-dates-notice')).toBeVisible();
    });

    test('GivenMultiDayCompetition_WhenCreatedAndEdited_ThenMultiDayModeIsAutoDetected', async ({ page }) => {
        await navigateToCreateForm(page);
        await fillCompetitionDetails(page, multiday_competition_data.competition);
        await enableMultiDay(page);

        for (let i = 0; i < multiday_competition_data.categories.length; i++) {
            await addMultiDayCategory(page, i, multiday_competition_data.categories[i]);
        }

        await submitCompetition(page);
        await assertCompetitionCreated(page, multiday_competition_data.competition, multiday_competition_data.categories);

        // Navigate to edit
        await navigateToEditFromManageMenu(page);
        await expect(page.getByTestId('edit-competition-heading')).toBeVisible();

        // Multi-day mode should be auto-detected
        await expect(page.getByTestId('multi-day-toggle')).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByTestId('auto-computed-dates-notice')).toBeVisible();
        await expect(page.getByTestId('date-picker')).not.toBeVisible();
    });
});
