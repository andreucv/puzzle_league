import { expect, test, runSeed, AUTH_FILES } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';

// ==================== TYPES ====================

interface PublicProfileTestData {
    competitionId: number;
    categoryId: number;
    participantId: string;
    participantName: string;
}

// ==================== SEED ====================

let testData: PublicProfileTestData;

test.beforeAll(async () => {
    testData = await runSeed<PublicProfileTestData>(import.meta.url);
});

// ==================== HELPERS ====================

function resultsUrl(competitionId: number) {
    return `/competitions/competition_details/${competitionId}/results`;
}

test.describe('Authenticated user on results page', () => {
    test.use({ storageState: AUTH_FILES.participant });

    test('Given a finished competition with results, when an authenticated user views the results page, then the participant name is a clickable profile link', async ({ page }) => {
        await gotoHydrated(page, resultsUrl(testData.competitionId));

        // The profile link should be visible
        const profileLink = page.getByTestId(`profile-link-${testData.participantId}`);
        await expect(profileLink).toBeVisible();
        await expect(profileLink).toHaveText(testData.participantName);

        // Clicking the link should navigate to the public profile
        await profileLink.click();
        await expect(page).toHaveURL(`/public_profile/${testData.participantId}`);
    });
});
