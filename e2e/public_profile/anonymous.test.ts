import { expect, test, runSeed } from '../fixtures';

// ==================== TYPES ====================

interface PublicProfileTestData {
    competitionId: number;
    categoryId: number;
    participantId: string;
    participantName: string;
}

// ==================== CONFIG ====================

test.use({ storageState: { cookies: [], origins: [] } });

// ==================== SEED ====================

let testData: PublicProfileTestData;

test.beforeAll(async () => {
    testData = await runSeed<PublicProfileTestData>(import.meta.url);
});

// ==================== HELPERS ====================

function resultsUrl(competitionId: number) {
    return `/competitions/competition_details/${competitionId}/results`;
}

// ==================== TESTS ====================

test.describe('Anonymous user on results page', () => {
    test('Given a finished competition with results, when an anonymous user views the results page, then the participant name is visible but has no profile link', async ({ page }) => {
        await page.goto(resultsUrl(testData.competitionId));

        // The participant name should be visible as plain text
        const profileName = page.getByTestId(`profile-name-${testData.participantId}`);
        await expect(profileName).toBeVisible();
        await expect(profileName).toHaveText(testData.participantName);

        // There should be no link to the public profile
        const profileLink = page.getByTestId(`profile-link-${testData.participantId}`);
        await expect(profileLink).not.toBeVisible();
    });

    test('Given an anonymous user, when they navigate directly to a public profile URL, then they are redirected to login', async ({ page }) => {
        await page.goto(`/public_profile/${testData.participantId}`);

        // Should be redirected to login
        await expect(page).toHaveURL(/\/login/);
    });
});
