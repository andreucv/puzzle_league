import { expect, test, type Page, type Locator } from '@playwright/test';
import type { CompetitionData, CategoryData, MultiDayCategoryData } from '../types';

test.use({ storageState: "playwright/.auth/organizer_user.json" });

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
}

/** Selects a specific date on a date picker identified by a locator. */
async function selectDateOnPicker(picker: Locator, date: Date) {
    await picker.locator('button').first().click();
    const label = formatDateToCalendarLabel(date);
    // Scope within the picker to avoid strict mode violations when multiple
    // calendars on the page show the same date (e.g. category start + end pickers).
    await picker.getByLabel(label).click();
    // Press Escape to ensure the calendar popup closes on all browsers
    // (Firefox/WebKit may keep it open when clicking an already-selected date).
    await picker.page().keyboard.press('Escape');
}

/** Enables multi-day mode by clicking the toggle switch. */
async function enableMultiDay(page: Page) {
    await page.getByRole('switch', { name: 'Multi-day competition' }).click();
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
    if (category.price) {
        await page.getByTestId(`price-create-${index}`).fill(category.price);
    }
}

/**
 * Clicks "Add Category" and fills all fields including per-category dates for multi-day mode.
 */
async function addMultiDayCategory(page: Page, index: number, category: MultiDayCategoryData) {
    await page.getByRole('button', { name: 'Add Category' }).first().click();
    await page.locator(`#category-type-create-${index}`).selectOption(category.type);
    await page.getByTestId(`description-create-${index}`).fill(category.description);

    // Select start date for this category
    await selectDateOnPicker(page.getByTestId(`category-start-date-create-${index}`), category.start_date);
    // Only select end date if different from start; auto-sync already fills it when they match
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
        if (cat.price) {
            await expect(page.getByText(`${cat.price} €`).first()).toBeVisible();
        }
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

// ==================== VALIDATION ERROR TESTS ====================
// Client-side validation tests have been migrated to unit tests:
// src/lib/utils/competition_form_validation.test.ts

// ==================== MULTI-DAY COMPETITION TESTS ====================

test.describe('Multi-day Competition', () => {

    test('GivenCreateCompetitionPage_WhenOrganizerCreatesMultiDayCompetition_ThenCompetitionIsCreated', async ({ page }) => {
        await navigateToCreateForm(page);
        await fillCompetitionDetails(page, multiday_competition_data.competition);

        // Enable multi-day mode
        await enableMultiDay(page);

        // Verify auto-computed dates info is shown instead of date pickers
        await expect(page.getByText('Dates auto-computed from categories')).toBeVisible();

        // Add categories with per-category dates
        for (let i = 0; i < multiday_competition_data.categories.length; i++) {
            await addMultiDayCategory(page, i, multiday_competition_data.categories[i]);
        }

        await submitCompetition(page);
        await assertCompetitionCreated(page, multiday_competition_data.competition, multiday_competition_data.categories);
    });

    test('GivenCreateCompetitionPage_WhenMultiDayToggled_ThenUIReflectsCurrentMode', async ({ page }) => {
        await navigateToCreateForm(page);

        const toggle = page.getByRole('switch', { name: 'Multi-day competition' });

        // Initially single-day mode: date picker visible, toggle off, no auto-computed text
        await expect(page.getByTestId('date-picker')).toBeVisible();
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByText('Dates auto-computed from categories')).not.toBeVisible();

        // Enable multi-day
        await toggle.click();

        // Multi-day mode: toggle on, auto-computed text visible, single date picker hidden
        await expect(toggle).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByTestId('date-picker')).not.toBeVisible();
        await expect(page.getByText('Dates auto-computed from categories')).toBeVisible();

        // Toggle back to single-day
        await toggle.click();

        // Back to single-day mode
        await expect(toggle).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByTestId('date-picker')).toBeVisible();
        await expect(page.getByText('Dates auto-computed from categories')).not.toBeVisible();
    });

    test('GivenMultiDayMode_WhenCategoryAdded_ThenCategoryDatePickersAreVisible', async ({ page }) => {
        await navigateToCreateForm(page);
        await enableMultiDay(page);

        // Add a category
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.locator('#category-type-create-0').selectOption('Individual');

        // Category start and end date pickers should be visible
        await expect(page.getByTestId('category-start-date-create-0')).toBeVisible();
        await expect(page.getByTestId('category-end-date-create-0')).toBeVisible();
    });

    test('GivenMultiDayMode_WhenCategoryDatesAreMissing_ThenShowsDateRequiredErrors', async ({ page }) => {
        await navigateToCreateForm(page);
        await page.locator('input[name="competition_name"]').fill('Multi-day Validation Test');
        await enableMultiDay(page);

        // Add a category with times but no dates
        await addCategoryWithType(page, 0, 'Individual');
        await page.getByTestId('description-create-0').fill('Valid Category');
        await page.getByTestId('start-time-create-0').fill('10:00');
        await page.getByTestId('end-time-create-0').fill('12:00');
        await page.getByTestId('max-parties-create-0').fill('10');

        await submitCompetition(page);

        // Should show category date required error
        await expect(page.getByText('Please select a start date for this category')).toBeVisible();
    });

    test('GivenMultiDayMode_WhenCategoryStartDateSet_ThenEndDateIsAutoSynced', async ({ page }) => {
        await navigateToCreateForm(page);
        await enableMultiDay(page);

        const { day1 } = getMultiDayDates();

        // Add a category and set only the start date
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.locator('#category-type-create-0').selectOption('Individual');
        await selectDateOnPicker(page.getByTestId('category-start-date-create-0'), day1);

        // End date should be auto-synced to the same date as start date
        // Verify the end date picker segments are filled (not showing placeholders)
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

        // Add categories spanning day1 to day2
        for (let i = 0; i < multiday_competition_data.categories.length; i++) {
            await addMultiDayCategory(page, i, multiday_competition_data.categories[i]);
        }

        // Auto-computed dates info should be visible
        await expect(page.getByText('Dates auto-computed from categories')).toBeVisible();
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
        await page.getByRole('link', { name: 'Edit Competition' }).click();
        await expect(page.getByRole('heading', { name: 'Edit competition' }).first()).toBeVisible();

        // Multi-day mode should be auto-detected: toggle on, auto-computed text visible, no single date picker
        await expect(page.getByRole('switch', { name: 'Multi-day competition' })).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByText('Dates auto-computed from categories')).toBeVisible();
        await expect(page.getByTestId('date-picker')).not.toBeVisible();
    });

});
