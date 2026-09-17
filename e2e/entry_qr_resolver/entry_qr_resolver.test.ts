import { expect, test, runSeed } from '../fixtures';

// ==================== TYPES ====================

interface TestData {
    competitionId: number;
    categoryId: number;
    entryIds: string[];
    judge: { email: string; password: string };
}

// ==================== TEST ====================

// One journey: every role scans the same printed entry-card QR (/e/<entryId>)
// and the resolver routes each to its destination.
test('GivenPrintedCardQr_WhenScannedByEachRole_ThenResolverRoutesByRole', async ({ organizerPage, participantPage, actor, browser }) => {
    const data = await runSeed<TestData>(import.meta.url);
    const entryId = data.entryIds[0];
    const duringCompetitionUrl = new RegExp(
        `/competition/${data.competitionId}/during_competition\\?category=${data.categoryId}&entry=${entryId}`
    );
    const resultsUrl = new RegExp(
        `/competitions/competition_details/${data.competitionId}/results\\?category=${data.categoryId}`
    );

    await test.step('organizer lands on during_competition with the entry selected', async () => {
        await organizerPage.goto(`/e/${entryId}`);
        await expect(organizerPage).toHaveURL(duringCompetitionUrl);
        // Deep-link autoselect: the entry's finish action is visible without any click
        await expect(organizerPage.getByTestId(`finish-record-${entryId}`)).toBeVisible();
    });

    await test.step('category judge lands on during_competition with the entry selected', async () => {
        const judgePage = await actor(data.judge);
        await judgePage.goto(`/e/${entryId}`);
        await expect(judgePage).toHaveURL(duringCompetitionUrl);
        await expect(judgePage.getByTestId(`finish-record-${entryId}`)).toBeVisible();
    });

    await test.step('participant (not a judge) lands on the results page with the category preselected', async () => {
        await participantPage.goto(`/e/${entryId}`);
        await expect(participantPage).toHaveURL(resultsUrl);
    });

    await test.step('anonymous scan lands on the results page (no login wall)', async () => {
        const anonContext = await browser.newContext();
        const anonPage = await anonContext.newPage();
        await anonPage.goto(`/e/${entryId}`);
        await expect(anonPage).toHaveURL(resultsUrl);
        await anonContext.close();
    });

    await test.step('deleted entry returns 404', async () => {
        const response = await organizerPage.goto(`/e/entry-that-does-not-exist`);
        expect(response?.status()).toBe(404);
    });
});
