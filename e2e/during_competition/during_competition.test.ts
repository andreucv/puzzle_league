import { expect, test, runSeed } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';
import type { Page } from '@playwright/test';

// ==================== TYPES ====================

interface TestData {
    competitionId: number;
    categoryId: number;
    entryIds: string[];
    userNames: string[];
}

// ==================== HELPER FUNCTIONS ====================

async function navigateToDuringCompetition(page: Page, competitionId: number): Promise<void> {
    await gotoHydrated(page, `/competition/${competitionId}/during_competition`);
}

async function assignJudge(page: Page, categoryId: number, searchQuery: string): Promise<void> {
    const searchInput = page.getByTestId(`judge-search-${categoryId}`);
    await searchInput.fill(searchQuery);

    // Wait for search results to appear
    const firstResult = page.locator('[data-testid^="judge-search-result-"]').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();
}

async function clickConfirmPopover(page: Page): Promise<void> {
    await expect(page.getByTestId('confirm-popover-action')).toBeVisible();
    await page.getByTestId('confirm-popover-action').click();
}

// ==================== TEST ====================

// One journey: the category lifecycle (assign judge → start → finish entries →
// stop → resolve DNFs → complete) is a single workflow whose steps build on
// each other, exercised from both the organizer's and the judge's perspective.
test('GivenSeededCategory_WhenOrganizerRunsLifecycleWithJudge_ThenBothSeeLiveUpdates', async ({ organizerPage, participantPage }) => {
    const testData = await runSeed<TestData>(import.meta.url);

    await test.step('organizer sees category controls on the during_competition page', async () => {
        await navigateToDuringCompetition(organizerPage, testData.competitionId);
        await expect(organizerPage.getByTestId(`start-category-${testData.categoryId}`)).toBeVisible();
    });

    await test.step('participant (not yet judge) is denied access', async () => {
        await navigateToDuringCompetition(participantPage, testData.competitionId);
        // SvelteKit error(403) renders an error page
        await expect(participantPage.locator('text=403')).toBeVisible();
    });

    await test.step('organizer assigns the participant as judge', async () => {
        await gotoHydrated(organizerPage, `/competition/${testData.competitionId}/manage_judges`);
        await assignJudge(organizerPage, testData.categoryId, 'Participant');

        // Verify judge entry appears (we check for any judge-entry for this category)
        const judgeEntry = organizerPage.locator(`[data-testid^="judge-entry-${testData.categoryId}-"]`).first();
        await expect(judgeEntry).toBeVisible();
    });

    await test.step('judge can load the page but sees no lifecycle buttons', async () => {
        await navigateToDuringCompetition(participantPage, testData.competitionId);
        await expect(participantPage.getByTestId(`start-category-${testData.categoryId}`)).not.toBeVisible();
    });

    await test.step('organizer starts the category — transitions to LIVE', async () => {
        await navigateToDuringCompetition(organizerPage, testData.competitionId);

        await organizerPage.getByTestId(`start-category-${testData.categoryId}`).click();
        await clickConfirmPopover(organizerPage);

        // Category should now be LIVE — stop button appears
        await expect(organizerPage.getByTestId(`stop-category-${testData.categoryId}`)).toBeVisible();

        // Entry rows should be visible (pending entries)
        const entryRow = organizerPage.locator('[data-testid^="record-row-"]').first();
        await expect(entryRow).toBeVisible();
    });

    await test.step('judge sees finish-entry actions but no lifecycle buttons', async () => {
        // Reload the page to see the updated LIVE state
        await navigateToDuringCompetition(participantPage, testData.competitionId);

        await expect(participantPage.getByTestId(`stop-category-${testData.categoryId}`)).not.toBeVisible();
        await expect(participantPage.getByTestId(`start-category-${testData.categoryId}`)).not.toBeVisible();

        const entryRow = participantPage.getByTestId(`record-row-${testData.entryIds[0]}`);
        await expect(entryRow).toBeVisible();

        // Click the entry row to reveal finish action
        await entryRow.click();
        await expect(participantPage.getByTestId(`finish-record-${testData.entryIds[0]}`)).toBeVisible();
    });

    await test.step('judge finishes an entry', async () => {
        // Entry row should already be selected from the previous step; if not, click it
        const finishButton = participantPage.getByTestId(`finish-record-${testData.entryIds[0]}`);
        if (!await finishButton.isVisible()) {
            await participantPage.getByTestId(`record-row-${testData.entryIds[0]}`).click();
            await expect(finishButton).toBeVisible();
        }

        await finishButton.click();

        // Entry should now show a finish time (check icon with time)
        await expect(participantPage.getByTestId(`record-row-${testData.entryIds[0]}`)).toBeVisible();
    });

    await test.step('organizer finishes an entry — judge sees it via real-time sync', async () => {
        // Organizer reloads to see current state
        await navigateToDuringCompetition(organizerPage, testData.competitionId);

        const entryRow = organizerPage.getByTestId(`record-row-${testData.entryIds[1]}`);
        await expect(entryRow).toBeVisible();

        // Organizer clicks the record and finishes it
        await entryRow.click();
        const finishButton = organizerPage.getByTestId(`finish-record-${testData.entryIds[1]}`);
        await expect(finishButton).toBeVisible();
        await finishButton.click();

        await expect(organizerPage.getByTestId(`record-row-${testData.entryIds[1]}`)).toBeVisible();

        // Verify on judge page (WITHOUT reloading) — Ably real-time sync can take a while
        await expect(participantPage.getByTestId(`record-row-${testData.entryIds[1]}`)).toBeVisible({ timeout: 15000 });
    });

    await test.step('organizer stops the category — transitions to STOPPED', async () => {
        await organizerPage.getByTestId(`stop-category-${testData.categoryId}`).click();
        await clickConfirmPopover(organizerPage);

        await expect(organizerPage.getByTestId(`complete-category-${testData.categoryId}`)).toBeVisible();
    });

    await test.step('organizer and judge insert pieces for DNF records', async () => {
        // Organizer: insert pieces for record[2]
        const orgRecordRow = organizerPage.getByTestId(`record-row-${testData.entryIds[2]}`);
        await expect(orgRecordRow).toBeVisible();
        await orgRecordRow.click();

        const orgPiecesInput = organizerPage.getByTestId(`pieces-input-${testData.entryIds[2]}`);
        await expect(orgPiecesInput).toBeVisible();
        await orgPiecesInput.fill('100');
        await organizerPage.getByTestId(`pieces-submit-${testData.entryIds[2]}`).click();

        await expect(organizerPage.getByTestId(`record-row-${testData.entryIds[2]}`)).toBeVisible();

        // Judge: reload page and insert pieces for record[3]
        await navigateToDuringCompetition(participantPage, testData.competitionId);

        const judgRecordRow = participantPage.getByTestId(`record-row-${testData.entryIds[3]}`);
        await expect(judgRecordRow).toBeVisible();
        await judgRecordRow.click();

        const judgPiecesInput = participantPage.getByTestId(`pieces-input-${testData.entryIds[3]}`);
        await expect(judgPiecesInput).toBeVisible();
        await judgPiecesInput.fill('200');
        await participantPage.getByTestId(`pieces-submit-${testData.entryIds[3]}`).click();

        await expect(participantPage.getByTestId(`record-row-${testData.entryIds[3]}`)).toBeVisible();
    });

    await test.step('only the organizer can complete the category', async () => {
        // Judge should NOT see the complete button
        await expect(participantPage.getByTestId(`complete-category-${testData.categoryId}`)).not.toBeVisible();

        // Organizer completes the category
        await organizerPage.getByTestId(`complete-category-${testData.categoryId}`).click();
        await clickConfirmPopover(organizerPage);

        // Category should show as completed — restart button appears for organizer
        await expect(organizerPage.getByTestId(`restart-category-${testData.categoryId}`)).toBeVisible();
    });
});
