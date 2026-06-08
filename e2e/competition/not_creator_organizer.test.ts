import { expect, test } from '@playwright/test';
import { runSeed } from '../fixtures';

// ── Config: sequential execution ──
test.describe.configure({ mode: 'serial' });

interface TestData {
    competition: { id: number; name: string };
    secondOrganizer: { id: string; email: string; password: string; name: string };
    defaultOrganizer: { id: string; email: string };
}

let data: TestData;

test.beforeAll(async () => {
    data = await runSeed<TestData>(import.meta.url, { seedFile: 'seed-not-creator.ts' });
});

test.afterAll(async () => {
    await runSeed(import.meta.url, { seedFile: 'restore-not-creator.ts' });
});

test.describe('Non-creator organizer access', () => {
    test('Given a second organizer who is not the creator — When they navigate to the edit route — Then they see a 403 error', async ({ browser }) => {
        // Create a fresh browser context (no stored auth — we log in manually as the second organizer)
        const context = await browser.newContext();
        const page = await context.newPage();

        // Log in as the second organizer
        await page.goto('/login', { waitUntil: 'networkidle' });
        await page.locator('#input_email').fill(data.secondOrganizer.email);
        await page.locator('#input_password').fill(data.secondOrganizer.password);
        await page.locator('#login_submit').click();
        await page.waitForURL('/', { timeout: 60_000 });

        // Navigate to the edit route for the competition owned by the default organizer
        const editUrl = `/competition/edit/${data.competition.id}`;
        const response = await page.goto(editUrl, { waitUntil: 'networkidle' });

        // The page should show a 403 error — the second organizer is not the creator,
        // not a scoped competition organizer, and not an admin
        expect(response?.status()).toBe(403);

        await context.close();
    });

    test('Given the competition creator — When they navigate to the edit route — Then they can access the page', async ({ browser }) => {
        // Use the default organizer's stored auth session
        const context = await browser.newContext({
            storageState: 'playwright/.auth/organizer_user.json',
        });
        const page = await context.newPage();

        const editUrl = `/competition/edit/${data.competition.id}`;
        await page.goto(editUrl, { waitUntil: 'networkidle' });

        // The creator should see the edit form
        await expect(page.getByRole('heading', { name: 'Edit competition' }).first()).toBeVisible();

        await context.close();
    });
});
