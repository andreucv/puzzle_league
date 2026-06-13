import { expect, test, runSeed } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';

// ==================== TYPES ====================

interface ExploreCompetitionEntry {
    id: number;
    name: string;
}

interface ExploreCompetitionsTestData {
    in2Days: ExploreCompetitionEntry;
    in9Days: ExploreCompetitionEntry;
    in40Days: ExploreCompetitionEntry;
    ago10Days: ExploreCompetitionEntry;
}

// ==================== CONFIG ====================

test.use({ storageState: { cookies: [], origins: [] } });

// ==================== SEED ====================

let testData: ExploreCompetitionsTestData;

test.beforeAll(async () => {
    testData = await runSeed<ExploreCompetitionsTestData>(import.meta.url);
});

// ==================== HELPERS ====================

const urlUnderTest = '/competitions/explore_competitions';

/** Returns a locator for a competition card by its seeded ID. */
function competitionCard(page: import('@playwright/test').Page, id: number) {
    return page.getByTestId(`competition-card-${id}`);
}

/** Navigates to the explore page and waits for Svelte hydration to complete. */
async function gotoExplore(page: import('@playwright/test').Page) {
    await gotoHydrated(page, urlUnderTest);
}

/** Opens the preset filter panel if it is not already visible. */
async function openPresets(page: import('@playwright/test').Page) {
    const firstChip = page.getByTestId('preset-chip-this-week');
    const isVisible = await firstChip.isVisible();
    if (!isVisible) {
        await page.getByTestId('filter-toggle').click();
    }
}

// ==================== TESTS ====================

test('GivenList_WhenDefaultSoonFilter_OnlyShowFutureCompetitions', async ({ page }) => {
    await gotoExplore(page);

    // "Upcoming" (NOT_STARTED) tab is active by default
    const soonTab = page.getByTestId('filter-tab-NOT_STARTED');
    await expect(soonTab).toBeVisible();

    // Upcoming competitions should be visible
    await expect(competitionCard(page, testData.in2Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in9Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in40Days.id)).toBeVisible();

    // Finished competition should NOT be visible
    await expect(competitionCard(page, testData.ago10Days.id)).not.toBeVisible();
});

test('GivenList_WhenAllFilter_ShowAllCompetitions', async ({ page }) => {
    await gotoExplore(page);

    // Switch to ALL tab
    await page.getByTestId('filter-tab-ALL').click();

    // All 4 competitions should be visible
    await expect(competitionCard(page, testData.in2Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in9Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in40Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.ago10Days.id)).toBeVisible();
});

test('GivenList_WhenFinishedFilter_OnlyShowFinishedCompetitions', async ({ page }) => {
    await gotoExplore(page);

    // Switch to Past tab
    await page.getByTestId('filter-tab-FINISHED').click();

    // Only the finished competition should be visible
    await expect(competitionCard(page, testData.ago10Days.id)).toBeVisible();

    // Upcoming competitions should NOT be visible
    await expect(competitionCard(page, testData.in2Days.id)).not.toBeVisible();
    await expect(competitionCard(page, testData.in9Days.id)).not.toBeVisible();
    await expect(competitionCard(page, testData.in40Days.id)).not.toBeVisible();
});

test('GivenList_WhenAllFilterAnd7DaysPreset_ShowLessThan7DaysCompetitions', async ({ page }) => {
    await gotoExplore(page);

    // Switch to ALL tab first to avoid tab filter interference
    await page.getByTestId('filter-tab-ALL').click();

    // Open presets panel and activate "7 days" preset
    await openPresets(page);
    await page.getByTestId('preset-chip-this-week').click();

    // Only the competition in 2 days should be visible
    await expect(competitionCard(page, testData.in2Days.id)).toBeVisible();

    // Others should NOT be visible
    await expect(competitionCard(page, testData.in9Days.id)).not.toBeVisible();
    await expect(competitionCard(page, testData.in40Days.id)).not.toBeVisible();
    await expect(competitionCard(page, testData.ago10Days.id)).not.toBeVisible();
});

test('GivenList_WhenOpenRegistrationPreset_ShowOnlyOpenCompetitions', async ({ page }) => {
    await gotoExplore(page);

    // Stay on default NOT_STARTED tab
    // Open presets panel and activate "open registration" preset
    await openPresets(page);
    await page.getByTestId('preset-chip-open-registration').click();

    // Competitions with registrationOpen=true and NOT_STARTED should appear
    await expect(competitionCard(page, testData.in2Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in9Days.id)).toBeVisible();

    // Competition with registration closed should NOT appear
    await expect(competitionCard(page, testData.in40Days.id)).not.toBeVisible();
    await expect(competitionCard(page, testData.ago10Days.id)).not.toBeVisible();
});

test('GivenList_WhenFillingFilter_FilterShowsOnlyMatchingName', async ({ page }) => {
    await gotoExplore(page);

    // Switch to ALL tab so all competitions are in scope
    await page.getByTestId('filter-tab-ALL').click();

    // Type a search term that matches only one competition
    await page.getByTestId('competition-search-input').fill('In 2 days');

    // Only the matching competition should be visible
    await expect(competitionCard(page, testData.in2Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in9Days.id)).not.toBeVisible();
    await expect(competitionCard(page, testData.in40Days.id)).not.toBeVisible();
    await expect(competitionCard(page, testData.ago10Days.id)).not.toBeVisible();
});

test('GivenList_WhenNoFindCompetition_ClearFilterButtonWorks', async ({ page }) => {
    await gotoExplore(page);

    // Apply a search that returns 0 results
    await page.getByTestId('competition-search-input').fill('nonexistent-competition-xyz');

    // Verify no results and the clear button is visible
    await expect(page.getByTestId('competition-list').locator('[data-testid^="competition-card-"]')).toHaveCount(0);
    const clearButton = page.getByTestId('clear-filters');
    await expect(clearButton).toBeVisible();

    // Click clear all filters
    await clearButton.click();

    // After clearing, the ALL tab should be active and all competitions visible
    await expect(competitionCard(page, testData.in2Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in9Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.in40Days.id)).toBeVisible();
    await expect(competitionCard(page, testData.ago10Days.id)).toBeVisible();
});
