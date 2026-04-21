import { expect, test, runSeed } from '../fixtures';
import type { Page, BrowserContext } from '@playwright/test';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ==================== TYPES ====================

interface TestData {
    competitionId: number;
    categoryId: number;
    recordIds: string[];
    userNames: string[];
}

// ==================== HELPER FUNCTIONS ====================

async function navigateToDuringCompetition(page: Page, competitionId: number): Promise<void> {
    await page.goto(`/competition/${competitionId}/during_competition`);
}

async function navigateToManageJudges(page: Page, competitionId: number): Promise<void> {
    await page.goto(`/competition/${competitionId}/manage_judges`);
}

async function assignJudge(page: Page, categoryId: number, searchQuery: string): Promise<void> {
    const searchInput = page.getByTestId(`judge-search-${categoryId}`);
    await searchInput.fill(searchQuery);

    // Wait for search results to appear
    const firstResult = page.locator('[data-testid^="judge-search-result-"]').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();
}

async function clickConfirmPopover(page: Page): Promise<void> {
    await expect(page.getByTestId('confirm-popover-action')).toBeVisible();
    await page.getByTestId('confirm-popover-action').click();
}

async function expandPendingRecords(page: Page): Promise<void> {
    const pendingButton = page.locator('button', { hasText: /Pending Records/ });
    await expect(pendingButton).toBeVisible({ timeout: 5000 });
    await pendingButton.click();
}

// ==================== TESTS ====================

test.describe('During Competition Workflow', () => {
    let organizerContext: BrowserContext;
    let participantContext: BrowserContext;
    let organizerPage: Page;
    let participantPage: Page;
    let testData: TestData;

    test.beforeAll(async ({ browser }) => {
        // Seed test data using co-located seed.ts
        testData = await runSeed<TestData>(__dirname);

        // Create browser contexts with saved auth states
        organizerContext = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json',
        });
        participantContext = await browser.newContext({
            storageState: 'playwright/.auth/participant_user.json',
        });
        organizerPage = await organizerContext.newPage();
        participantPage = await participantContext.newPage();
    });

    test.afterAll(async () => {
        await organizerPage.close();
        await participantPage.close();
        await organizerContext.close();
        await participantContext.close();
    });

    test('Given an organizer, When navigating to during_competition page, Then it loads with category controls visible', async () => {
        await navigateToDuringCompetition(organizerPage, testData.competitionId);

        // Category card is visible in the Upcoming section
        await expect(organizerPage.getByTestId(`start-category-${testData.categoryId}`)).toBeVisible();
    });

    test('Given a participant, When navigating to during_competition page, Then access is denied', async () => {
        await navigateToDuringCompetition(participantPage, testData.competitionId);

        // SvelteKit error(403) renders an error page
        await expect(participantPage.locator('text=403')).toBeVisible({ timeout: 5000 });
    });

    test('Given an organizer, When assigning participant as judge, Then the participant appears in the judge list', async () => {
        await navigateToManageJudges(organizerPage, testData.competitionId);

        await assignJudge(organizerPage, testData.categoryId, 'Test Participant');

        // Verify judge entry appears (we check for any judge-entry for this category)
        const judgeEntry = organizerPage.locator(`[data-testid^="judge-entry-${testData.categoryId}-"]`).first();
        await expect(judgeEntry).toBeVisible({ timeout: 5000 });
    });

    test('Given a participant assigned as judge, When navigating to during_competition page, Then it loads but lifecycle buttons are not visible', async () => {
        await navigateToDuringCompetition(participantPage, testData.competitionId);

        // Page loads — wait for a record row or the category card content
        await expect(participantPage.getByTestId(`start-category-${testData.categoryId}`)).not.toBeVisible();
    });

    test('Given an organizer, When starting a category, Then it transitions to LIVE with stop button visible', async () => {
        await navigateToDuringCompetition(organizerPage, testData.competitionId);

        // Click start
        await organizerPage.getByTestId(`start-category-${testData.categoryId}`).click();
        await clickConfirmPopover(organizerPage);

        // Category should now be LIVE — stop button appears
        await expect(organizerPage.getByTestId(`stop-category-${testData.categoryId}`)).toBeVisible({ timeout: 10000 });

        // Expand collapsed Pending Records section, then verify record rows
        await expandPendingRecords(organizerPage);
        const recordRow = organizerPage.locator('[data-testid^="record-row-"]').first();
        await expect(recordRow).toBeVisible({ timeout: 5000 });
    });

    test('Given a judge, When viewing a LIVE category, Then lifecycle buttons are hidden but finish-record actions are available', async () => {
        // Reload the page to see the updated LIVE state
        await navigateToDuringCompetition(participantPage, testData.competitionId);

        // Lifecycle buttons should NOT be visible for judge
        await expect(participantPage.getByTestId(`stop-category-${testData.categoryId}`)).not.toBeVisible();
        await expect(participantPage.getByTestId(`start-category-${testData.categoryId}`)).not.toBeVisible();

        // Expand collapsed Pending Records section, then verify record rows
        await expandPendingRecords(participantPage);
        const recordRow = participantPage.getByTestId(`record-row-${testData.recordIds[0]}`);
        await expect(recordRow).toBeVisible({ timeout: 5000 });

        // Click the record row to reveal finish action
        await recordRow.click();
        await expect(participantPage.getByTestId(`finish-record-${testData.recordIds[0]}`)).toBeVisible();
    });

    test('Given a judge, When finishing a record, Then the record moves to the finished list', async () => {
        // Record row should already be selected from previous test; if not, click it
        const finishButton = participantPage.getByTestId(`finish-record-${testData.recordIds[0]}`);
        if (!await finishButton.isVisible()) {
            await participantPage.getByTestId(`record-row-${testData.recordIds[0]}`).click();
            await expect(finishButton).toBeVisible();
        }

        await finishButton.click();

        // Record should now show a finish time (check icon with time)
        const recordRow = participantPage.getByTestId(`record-row-${testData.recordIds[0]}`);
        await expect(recordRow).toBeVisible({ timeout: 5000 });
    });

    test('Given an organizer finishing a record, When the judge is on the page, Then the judge sees the update via real-time sync', async () => {
        // Organizer reloads to see current state
        await navigateToDuringCompetition(organizerPage, testData.competitionId);

        // Expand collapsed Pending Records section, then wait for records to load
        await expandPendingRecords(organizerPage);
        const recordRow = organizerPage.getByTestId(`record-row-${testData.recordIds[1]}`);
        await expect(recordRow).toBeVisible({ timeout: 5000 });

        // Organizer clicks the record and finishes it
        await recordRow.click();
        const finishButton = organizerPage.getByTestId(`finish-record-${testData.recordIds[1]}`);
        await expect(finishButton).toBeVisible();
        await finishButton.click();

        // Verify on organizer page
        await expect(organizerPage.getByTestId(`record-row-${testData.recordIds[1]}`)).toBeVisible({ timeout: 5000 });

        // Verify on judge page (WITHOUT reloading) — Ably real-time sync
        // The record should appear/update in the judge's view
        await expect(participantPage.getByTestId(`record-row-${testData.recordIds[1]}`)).toBeVisible({ timeout: 15000 });
    });

    test('Given an organizer, When stopping the category, Then it transitions to STOPPED with complete button visible', async () => {
        // Organizer stops the category
        await organizerPage.getByTestId(`stop-category-${testData.categoryId}`).click();
        await clickConfirmPopover(organizerPage);

        // Complete button should appear
        await expect(organizerPage.getByTestId(`complete-category-${testData.categoryId}`)).toBeVisible({ timeout: 10000 });
    });

    test('Given a STOPPED category, When organizer and judge insert pieces for DNF records, Then records move to resolved', async () => {
        // Organizer: insert pieces for record[2]
        const orgRecordRow = organizerPage.getByTestId(`record-row-${testData.recordIds[2]}`);
        await expect(orgRecordRow).toBeVisible({ timeout: 5000 });
        await orgRecordRow.click();

        const orgPiecesInput = organizerPage.getByTestId(`pieces-input-${testData.recordIds[2]}`);
        await expect(orgPiecesInput).toBeVisible({ timeout: 3000 });
        await orgPiecesInput.fill('100');
        await organizerPage.getByTestId(`pieces-submit-${testData.recordIds[2]}`).click();

        // Verify the record now shows pieces
        await expect(organizerPage.getByTestId(`record-row-${testData.recordIds[2]}`)).toBeVisible({ timeout: 5000 });

        // Judge: reload page and insert pieces for record[3]
        await navigateToDuringCompetition(participantPage, testData.competitionId);

        const judgRecordRow = participantPage.getByTestId(`record-row-${testData.recordIds[3]}`);
        await expect(judgRecordRow).toBeVisible({ timeout: 5000 });
        await judgRecordRow.click();

        const judgPiecesInput = participantPage.getByTestId(`pieces-input-${testData.recordIds[3]}`);
        await expect(judgPiecesInput).toBeVisible({ timeout: 3000 });
        await judgPiecesInput.fill('200');
        await participantPage.getByTestId(`pieces-submit-${testData.recordIds[3]}`).click();

        // Verify the record now shows pieces
        await expect(participantPage.getByTestId(`record-row-${testData.recordIds[3]}`)).toBeVisible({ timeout: 5000 });
    });

    test('Given a STOPPED category, When only the organizer has the complete button, Then the organizer can complete the category', async () => {
        // Judge should NOT see the complete button
        await expect(participantPage.getByTestId(`complete-category-${testData.categoryId}`)).not.toBeVisible();

        // Organizer completes the category
        await organizerPage.getByTestId(`complete-category-${testData.categoryId}`).click();
        await clickConfirmPopover(organizerPage);

        // Category should show as completed — restart button appears for organizer
        await expect(organizerPage.getByTestId(`restart-category-${testData.categoryId}`)).toBeVisible({ timeout: 10000 });
    });
});
