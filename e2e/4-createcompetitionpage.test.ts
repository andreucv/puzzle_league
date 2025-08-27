import { expect, test } from '@playwright/test';

test.use({ storageState: "playwright/.auth/organizer_user.json" });

test('GivenCreateCompetitionPage_WhenOrganizerCreatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {
    const competitionData = {
        name: 'TestName',
        venue: 'TestVenue',
        description: 'TestDescription',
        startDate: '2025-10-15',
    }

    await page.goto('/competition/edit');
    await expect(page.getByRole('heading', { name: 'Create Competition' }).first()).toBeVisible();
    await page.getByLabel('Competition Name *').fill(competitionData.name);
    await page.getByLabel('Location').fill(competitionData.venue);
    await page.getByLabel('Description').fill(competitionData.description);
    await page.getByLabel('Date *').fill(competitionData.startDate);
    await page.getByRole('button', { name: 'Add Category' }).first().click();
    await page.getByLabel('Category Type *').selectOption({ label: 'Individual' });
    await page.getByLabel('Start Time').fill('10:00');
    await page.getByLabel('End Time').fill('12:00');
    await page.getByLabel('Max Parties').fill('40');
    await page.getByRole('button', { name: 'Add Category' }).first().click();
    await page.getByLabel('Category Type * Select a').nth(1).selectOption({ label: 'Team' });
    await page.getByLabel('Start Time').nth(1).fill('15:00');
    await page.getByLabel('End Time').nth(1).fill('17:00');
    await page.getByLabel('Max Parties').nth(1).fill('10');
    await page.getByRole('button', { name: 'Create Competition' }).click();
    await expect(page.getByRole('heading', { name: 'Competition Updated!' })).toBeVisible();

    await page.getByRole('link', { name: 'View updated competition →' }).click();
    await expect(page.getByText(competitionData.name).first()).toBeVisible();
    await expect(page.getByText(competitionData.description).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: competitionData.venue }).first()).toBeVisible();

    await expect(page.getByText('Individual Start: 10:00 End: 12:')).toBeVisible();
    await expect(page.getByText('Team Start: 15:00 End: 17:')).toBeVisible();
});
