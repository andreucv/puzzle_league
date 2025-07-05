import { expect, test } from '@playwright/test';
import { time } from 'console';

test.use({ storageState: "playwright/.auth/organizer_user.json" });

test('GivenCreateCompetitionPage_WhenOrganizerCreatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {
    const competitionData = {
        name: 'TestName',
        venue: 'TestVenue',
        description: 'TestDescription',
        startDate: '2025-10-15',
    }

    await page.goto('/create_competition');
    await expect(page.getByRole('heading', { name: 'Create Competition Form' }).first()).toBeVisible();
    await page.getByPlaceholder('Enter competition name').fill(competitionData.name);
    await page.getByPlaceholder('Enter venue location').fill(competitionData.venue);
    await page.getByPlaceholder('Describe your competition...').fill(competitionData.description);
    await page.getByLabel('Start Date *').fill(competitionData.startDate);
    await page.getByRole('button', { name: '➕ Add Category' }).click();
    await page.getByLabel('Category Type *').selectOption({ label: 'INDIVIDUAL' });
    await page.getByLabel('Start Time').fill('10:00');
    await page.getByLabel('End Time').fill('12:00');
    await page.getByLabel('Max Parties').fill('40');
    await page.getByRole('button', { name: '➕ Add Category' }).click();
    await page.getByLabel('Category Type * Select a').nth(1).selectOption({ label: 'TEAM' });
    await page.getByLabel('Start Time').nth(1).fill('15:00');
    await page.getByLabel('End Time').nth(1).fill('17:00');
    await page.getByLabel('Max Parties').nth(1).fill('10');
    await page.getByRole('button', { name: 'Create Competition' }).click();
    await expect(page.getByText('Competition created').first()).toBeVisible();

    await page.getByRole('link', { name: 'here' }).click();
    await expect(page.getByText(competitionData.name).first()).toBeVisible();
    await expect(page.getByText(competitionData.description).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: competitionData.venue }).first()).toBeVisible();
});
