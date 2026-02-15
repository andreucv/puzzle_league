import { expect, test } from '@playwright/test';

test.use({ storageState: "playwright/.auth/organizer_user.json" });

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

const competition_data = {
    "competition" : {
        "name": "Test Competition",
        "location": "Test Location",
        "description": "Test Description",
        "start_date": "2025-10-12",
        "end_date": "2025-10-12",
    },
    "categories": [
        {
            "description": "500 pcs",
            "type": "Individual",
            "start_time": "10:00",
            "end_time": "12:00",
            "max_parties": "10",
            "participants_per_party": "1",
        },
        {
            "description": "500 pcs",
            "type": "Pairs",
            "start_time": "14:00",
            "end_time": "16:00",
            "max_parties": "10",
            "participants_per_party": "2",
        },
        {
            "description": "1000 pcs",
            "type": "Team",
            "start_time": "18:00",
            "end_time": "20:00",
            "max_parties": "10",
            "participants_per_party": "4",
        }
    ]
}

const updated_competition_data = {
    "competition" : {
        "name": "Test Competition Updated",
        "location": "Test Location Updated",
        "description": "Test Description Updated",
        "start_date": "2025-10-13",
        "end_date": "2025-10-13",
    },
    "categories": [
        {
            "description": "500 pcs Updated",
            "type": "Individual",
            "start_time": "11:00",
            "end_time": "13:00",
            "max_parties": "10",
            "participants_per_party": "1",
        },
        {
            "description": "1000 pcs Updated",
            "type": "Team",
            "start_time": "18:00",
            "end_time": "20:00",
            "max_parties": "10",
            "participants_per_party": "4",
        }
    ]
}

test('GivenCreateCompetitionPage_WhenOrganizerCreatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {

    await page.goto('/competition/edit');
    await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();
    await page.locator('input[name="competition_name"]').fill(competition_data.competition.name);
    await page.locator('input[name="location"]').fill(competition_data.competition.location);
    await page.locator('textarea[name="description"]').fill(competition_data.competition.description);
    await page.locator('#bits-s17').click();
    await page.getByLabel(formatDateToCalendarLabel()).click();
    await page.getByLabel(formatDateToCalendarLabel()).click();

    for (let index = 0; index < competition_data.categories.length; index++) {
        const element = competition_data.categories[index];
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByPlaceholder('Enter category description').nth(index).fill(element.description);
        await page.getByRole('combobox').nth(index).selectOption(element.type);
        await page.locator('input[type="time"]').nth(index*2).fill(element.start_time);
        await page.locator('input[type="time"]').nth(index*2+1).fill(element.end_time);
        await page.getByPlaceholder('Maximum number of parties').nth(index).fill(element.max_parties);
        await page.locator('input[type="number"]').nth(index).fill(element.participants_per_party);
    }

    await page.getByRole('button', { name: 'Save Competition' }).first().click();

    await expect(page.getByText(competition_data.competition.name).first()).toBeVisible();
    await expect(page.getByText(competition_data.competition.description).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: competition_data.competition.location }).first()).toBeVisible();

    await expect(page.getByText(`${competition_data.categories[0].type} ${competition_data.categories[0].description} Start: ${competition_data.categories[0].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[1].type} ${competition_data.categories[1].description} Start: ${competition_data.categories[1].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[2].type} ${competition_data.categories[2].description} Start: ${competition_data.categories[2].start_time.split(':')[0]}`)).toBeVisible();
});

test('GivenCreateCompetitionPage_WhenOrganizerCreatesAndUpdatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {

    await page.goto('/competition/edit');
    await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();
    await page.locator('input[name="competition_name"]').fill(competition_data.competition.name);
    await page.locator('input[name="location"]').fill(competition_data.competition.location);
    await page.locator('textarea[name="description"]').fill(competition_data.competition.description);
    await page.locator('#bits-s17').click();
    await page.getByLabel(formatDateToCalendarLabel()).click();
    await page.getByLabel(formatDateToCalendarLabel()).click();

    for (let index = 0; index < competition_data.categories.length; index++) {
        const element = competition_data.categories[index];
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByPlaceholder('Enter category description').nth(index).fill(element.description);
        await page.getByRole('combobox').nth(index).selectOption(element.type);
        await page.locator('input[type="time"]').nth(index*2).fill(element.start_time);
        await page.locator('input[type="time"]').nth(index*2+1).fill(element.end_time);
        await page.getByPlaceholder('Maximum number of parties').nth(index).fill(element.max_parties);
        await page.locator('input[type="number"]').nth(index).fill(element.participants_per_party);
    }

    await page.getByRole('button', { name: 'Save Competition' }).first().click();

    await expect(page.getByText(competition_data.competition.name).first()).toBeVisible();
    await expect(page.getByText(competition_data.competition.description).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: competition_data.competition.location }).first()).toBeVisible();

    await expect(page.getByText(`${competition_data.categories[0].type} ${competition_data.categories[0].description} Start: ${competition_data.categories[0].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[1].type} ${competition_data.categories[1].description} Start: ${competition_data.categories[1].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[2].type} ${competition_data.categories[2].description} Start: ${competition_data.categories[2].start_time.split(':')[0]}`)).toBeVisible();

    // Competition created, lets update it
    await page.getByRole('link', { name: 'Edit Competition' }).click();
    await expect(page.getByRole('heading', { name: 'Edit competition' }).first()).toBeVisible();
    await page.locator('input[name="competition_name"]').fill(updated_competition_data.competition.name);
    await page.locator('input[name="location"]').fill(updated_competition_data.competition.location);
    await page.locator('textarea[name="description"]').fill(updated_competition_data.competition.description);

    await page.getByRole('button', { name: 'Update Competition' }).first().click();
});

// ==================== VALIDATION ERROR TESTS (Unhappy Paths) ====================

test.describe('Create Competition Form Validation', () => {

    test('GivenCreateCompetitionPage_WhenCompetitionNameIsEmpty_ThenShowsRequiredError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Leave name empty and try to submit
        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for name
        await expect(page.getByText('Competition name is required')).toBeVisible();

        // Form should not navigate away
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCompetitionNameIsTooShort_ThenShowsMinLengthError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Fill name with only 2 characters
        await page.locator('input[name="competition_name"]').fill('AB');
        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for minimum length
        await expect(page.getByText('Competition name must be at least 3 characters')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenDateIsNotSelected_ThenShowsDateRequiredError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Fill name but not date
        await page.locator('input[name="competition_name"]').fill('Valid Competition Name');
        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for date
        await expect(page.getByText('Please select a competition date')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryNameIsEmpty_ThenShowsCategoryNameRequiredError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Fill competition details
        await page.locator('input[name="competition_name"]').fill('Valid Competition');

        // Select a date first (required to enable Add Category button)
        await page.locator('#bits-s17').click();
        await page.getByLabel(formatDateToCalendarLabel()).click();
        await page.getByLabel(formatDateToCalendarLabel()).click();

        // Add a category but leave name empty
        await page.getByRole('button', { name: 'Add Category' }).first().click();

        // Select type but leave name empty
        await page.getByRole('combobox').first().selectOption('Individual');

        // Fill required time fields
        await page.locator('input[type="time"]').first().fill('10:00');
        await page.locator('input[type="time"]').nth(1).fill('12:00');
        await page.getByPlaceholder('Maximum number of parties').first().fill('10');

        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for category description
        await expect(page.getByText('Category description is required')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryNameIsTooShort_ThenShowsCategoryNameMinLengthError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Fill competition details
        await page.locator('input[name="competition_name"]').fill('Valid Competition');

        // Select a date
        await page.locator('#bits-s17').click();
        await page.getByLabel(formatDateToCalendarLabel()).click();
        await page.getByLabel(formatDateToCalendarLabel()).click();

        // Add a category with short name
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByPlaceholder('Enter category description').first().fill('AB');
        await page.getByRole('combobox').first().selectOption('Individual');

        await page.locator('input[type="time"]').first().fill('10:00');
        await page.locator('input[type="time"]').nth(1).fill('12:00');
        await page.getByPlaceholder('Maximum number of parties').first().fill('10');

        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for category description length
        await expect(page.getByText('Category description must be at least 3 characters')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryStartTimeIsMissing_ThenShowsStartTimeRequiredError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Fill competition details
        await page.locator('input[name="competition_name"]').fill('Valid Competition');

        // Select a date
        await page.locator('#bits-s17').click();
        await page.getByLabel(formatDateToCalendarLabel()).click();
        await page.getByLabel(formatDateToCalendarLabel()).click();

        // Add a category
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByPlaceholder('Enter category description').first().fill('Valid Category');
        await page.getByRole('combobox').first().selectOption('Individual');

        // Fill end time but not start time
        await page.locator('input[type="time"]').nth(1).fill('12:00');
        await page.getByPlaceholder('Maximum number of parties').first().fill('10');

        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for start time
        await expect(page.getByText('Start time is required')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryEndTimeIsMissing_ThenShowsEndTimeRequiredError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Fill competition details
        await page.locator('input[name="competition_name"]').fill('Valid Competition');

        // Select a date
        await page.locator('#bits-s17').click();
        await page.getByLabel(formatDateToCalendarLabel()).click();
        await page.getByLabel(formatDateToCalendarLabel()).click();

        // Add a category
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByPlaceholder('Enter category description').first().fill('Valid Category');
        await page.getByRole('combobox').first().selectOption('Individual');

        // Fill start time but not end time
        await page.locator('input[type="time"]').first().fill('10:00');
        await page.getByPlaceholder('Maximum number of parties').first().fill('10');

        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for end time
        await expect(page.getByText('End time is required')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenCategoryMaxPartiesIsMissing_ThenShowsMaxPartiesRequiredError', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Fill competition details
        await page.locator('input[name="competition_name"]').fill('Valid Competition');

        // Select a date
        await page.locator('#bits-s17').click();
        await page.getByLabel(formatDateToCalendarLabel()).click();
        await page.getByLabel(formatDateToCalendarLabel()).click();

        // Add a category
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByPlaceholder('Enter category description').first().fill('Valid Category');
        await page.getByRole('combobox').first().selectOption('Individual');

        // Fill times but not max parties
        await page.locator('input[type="time"]').first().fill('10:00');
        await page.locator('input[type="time"]').nth(1).fill('12:00');
        // Don't fill max parties

        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show validation error for max parties
        await expect(page.getByText('Max parties must be at least 1')).toBeVisible();
    });

    test('GivenCreateCompetitionPage_WhenMultipleFieldsAreMissing_ThenShowsFirstErrorAndFocusesField', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Submit without filling anything
        await page.getByRole('button', { name: 'Save Competition' }).first().click();

        // Should show competition name error (first field)
        await expect(page.getByText('Competition name is required')).toBeVisible();

        // Competition name field should be focused
        const nameInput = page.locator('input[name="competition_name"]');
        await expect(nameInput).toBeFocused();
    });

    test('GivenCreateCompetitionPage_WhenErrorIsFixedAndResubmitted_ThenErrorDisappears', async ({ page }) => {
        await page.goto('/competition/edit');
        await expect(page.getByRole('heading', { name: 'Create new competition' }).first()).toBeVisible();

        // Submit without name to trigger error
        await page.getByRole('button', { name: 'Save Competition' }).first().click();
        await expect(page.getByText('Competition name is required')).toBeVisible();

        // Fix the error by filling the name
        await page.locator('input[name="competition_name"]').fill('Valid Competition Name');

        // Error should disappear on input
        await expect(page.getByText('Competition name is required')).not.toBeVisible();
    });

});
