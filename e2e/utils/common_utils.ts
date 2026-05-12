import { expect, test } from '@playwright/test';

async function openMenu(page: Page) {
    await expect(page.locator('#states-button').first()).toBeVisible();
    await page.click('#states-button');
}
