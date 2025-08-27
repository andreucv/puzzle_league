import { expect, test } from '@playwright/test';

test.use({ storageState: "playwright/.auth/organizer_user.json" });

const competition_data = {
    "competition" : {
        "name": "Test Competition",
        "location": "Test Location",
        "description": "Test Description",
        "start_date": "2025-10-12",
        "end_date": "2025-10-12",
    },
    "categories": [
        {
            "name": "500 pcs",
            "type": "Individual",
            "start_time": "10:00",
            "end_time": "12:00",
            "max_parties": "10",
            "participants_per_party": "1",
        },
        {
            "name": "500 pcs",
            "type": "Pairs",
            "start_time": "14:00",
            "end_time": "16:00",
            "max_parties": "10",
            "participants_per_party": "2",
        },
        {
            "name": "1000 pcs",
            "type": "Team",
            "start_time": "18:00",
            "end_time": "20:00",
            "max_parties": "10",
            "participants_per_party": "4",
        }
    ]
}

const updated_competition_data = {
    "competition" : {
        "name": "Test Competition Updated",
        "location": "Test Location Updated",
        "description": "Test Description Updated",
        "start_date": "2025-10-13",
        "end_date": "2025-10-13",
    },
    "categories": [
        {
            "name": "500 pcs Updated",
            "type": "Individual",
            "start_time": "11:00",
            "end_time": "13:00",
            "max_parties": "10",
            "participants_per_party": "1",
        },
        {
            "name": "1000 pcs Updated",
            "type": "Team",
            "start_time": "18:00",
            "end_time": "20:00",
            "max_parties": "10",
            "participants_per_party": "4",
        }
    ]
}

test('GivenCreateCompetitionPage_WhenOrganizerCreatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {

    await page.goto('/competition/create');
    await expect(page.getByRole('heading', { name: 'Create Competition' }).first()).toBeVisible();
    await page.getByLabel('Competition Name *').fill(competition_data.competition.name);
    await page.getByLabel('Location').fill(competition_data.competition.location);
    await page.getByLabel('Description').fill(competition_data.competition.description);
    await page.getByLabel('Date *').fill(competition_data.competition.start_date);

    for (let index = 0; index < competition_data.categories.length; index++) {
        const element = competition_data.categories[index];
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByLabel('Category Name *').nth(index).fill(element.name);
        await page.getByLabel('Category Type * Select a').nth(index).selectOption(element.type);
        await page.getByLabel('Start Time *').nth(index).fill(element.start_time);
        await page.getByLabel('End Time *').nth(index).fill(element.end_time);
        await page.getByLabel('Max Parties').nth(index).fill(element.max_parties);
        await page.getByLabel('Participants per Party *').nth(index).fill(element.participants_per_party);
    }

    await page.getByRole('button', { name: 'Save Competition' }).first().click();
    await expect(page.getByRole('heading', { name: 'Competition Created!' })).toBeVisible();

    await page.getByRole('link', { name: 'View created competition →' }).click();
    await expect(page.getByText(competition_data.competition.name).first()).toBeVisible();
    await expect(page.getByText(competition_data.competition.description).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: competition_data.competition.location }).first()).toBeVisible();

    await expect(page.getByText(`${competition_data.categories[0].type} ${competition_data.categories[0].name} Start: ${competition_data.categories[0].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[1].type} ${competition_data.categories[1].name} Start: ${competition_data.categories[1].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[2].type} ${competition_data.categories[2].name} Start: ${competition_data.categories[2].start_time.split(':')[0]}`)).toBeVisible();
});

test('GivenCreateCompetitionPage_WhenOrganizerCreatesAndUpdatesCompetition_ThenOrganizerIsAbleToCheckCompetition', async ({ page }) => {

    await page.goto('/competition/create');
    await expect(page.getByRole('heading', { name: 'Create Competition' }).first()).toBeVisible();
    await page.getByLabel('Competition Name *').fill(competition_data.competition.name);
    await page.getByLabel('Location').fill(competition_data.competition.location);
    await page.getByLabel('Description').fill(competition_data.competition.description);
    await page.getByLabel('Date *').fill(competition_data.competition.start_date);

    for (let index = 0; index < competition_data.categories.length; index++) {
        const element = competition_data.categories[index];
        await page.getByRole('button', { name: 'Add Category' }).first().click();
        await page.getByLabel('Category Name *').nth(index).fill(element.name);
        await page.getByLabel('Category Type * Select a').nth(index).selectOption(element.type);
        await page.getByLabel('Start Time *').nth(index).fill(element.start_time);
        await page.getByLabel('End Time *').nth(index).fill(element.end_time);
        await page.getByLabel('Max Parties').nth(index).fill(element.max_parties);
        await page.getByLabel('Participants per Party *').nth(index).fill(element.participants_per_party);
    }

    await page.getByRole('button', { name: 'Save Competition' }).first().click();
    await expect(page.getByRole('heading', { name: 'Competition Created!' })).toBeVisible();

    await page.getByRole('link', { name: 'View created competition →' }).click();
    await expect(page.getByText(competition_data.competition.name).first()).toBeVisible();
    await expect(page.getByText(competition_data.competition.description).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: competition_data.competition.location }).first()).toBeVisible();

    await expect(page.getByText(`${competition_data.categories[0].type} ${competition_data.categories[0].name} Start: ${competition_data.categories[0].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[1].type} ${competition_data.categories[1].name} Start: ${competition_data.categories[1].start_time.split(':')[0]}`)).toBeVisible();
    await expect(page.getByText(`${competition_data.categories[2].type} ${competition_data.categories[2].name} Start: ${competition_data.categories[2].start_time.split(':')[0]}`)).toBeVisible();

    // Competition created, lets update it
    await page.getByRole('link', { name: 'Edit Competition' }).click();
    await expect(page.getByRole('heading', { name: 'Edit Competition' }).first()).toBeVisible();
    await page.getByLabel('Competition Name *').fill(updated_competition_data.competition.name);
    await page.getByLabel('Location').fill(updated_competition_data.competition.location);
    await page.getByLabel('Description').fill(updated_competition_data.competition.description);
    await page.getByLabel('Date *').fill(updated_competition_data.competition.start_date);

    await page.getByRole('button', { name: 'Update Competition' }).first().click();
});
