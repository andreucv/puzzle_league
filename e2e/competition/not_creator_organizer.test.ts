import { expect, test, runSeed } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';
import type { SeededAuthUser } from '../seed_utils';

interface TestData {
    competition: { id: number; name: string };
    secondOrganizer: SeededAuthUser;
    defaultOrganizer: { id: string; email: string };
}

let data: TestData;

test.beforeAll(async () => {
    data = await runSeed<TestData>(import.meta.url, { seedFile: 'seed-not-creator.ts' });
});

test.describe('Non-creator organizer access', () => {
    test('Given a second organizer who is not the creator — When they navigate to the edit route — Then they see a 403 error', async ({ actor }) => {
        const page = await actor(data.secondOrganizer);

        // Navigate to the edit route for the competition owned by the default organizer
        const response = await gotoHydrated(page, `/competition/edit/${data.competition.id}`);

        // The page should show a 403 error — the second organizer is not the creator,
        // not a scoped competition organizer, and not an admin
        expect(response?.status()).toBe(403);
    });

    test('Given the competition creator — When they navigate to the edit route — Then they can access the page', async ({ organizerPage }) => {
        await gotoHydrated(organizerPage, `/competition/edit/${data.competition.id}`);

        // The creator should see the edit form
        await expect(organizerPage.getByTestId('edit-competition-heading')).toBeVisible();
    });
});
