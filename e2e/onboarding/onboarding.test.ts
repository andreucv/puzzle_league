import { expect, test } from '@playwright/test';
import { runSeed } from '../fixtures';

// ---------- Unauthenticated tests ----------

test.describe('Onboarding - unauthenticated', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('GivenOnboardingPage_WhenNotLoggedIn_ThenRedirectsToLoginPage', async ({ page }) => {
        await page.goto('/onboarding');
        await page.waitForURL(/\/login.*/);
    });
});

// ---------- Authenticated tests (participant) ----------

interface OnboardingTestData {
    participantId: string;
    participantName: string;
}

// Each test resets the user's onboarding state via the seed script.
// This ensures tests are independent despite sharing the same database.

test.describe('Onboarding - wizard flow', () => {
    test.use({ storageState: 'playwright/.auth/participant_user.json' });

    test('GivenAuthenticatedUser_WhenOnboardingIncomplete_ThenRedirectsToOnboarding', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/');
        await page.waitForURL('/onboarding');
    });

    test('GivenLanguageStep_WhenSelectingLanguageAndSaving_ThenAdvancesToNextStep', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Language step should be visible
        await expect(page.getByTestId('select-language-en')).toBeVisible();

        // Select English
        await page.getByTestId('select-language-en').click();

        // Save
        await page.getByTestId('onboarding-language-save').click();

        // Should advance to the phone step
        await expect(page.getByTestId('onboarding-phone-skip')).toBeVisible({ timeout: 5000 });
    });

    test('GivenLanguageStep_WhenSkipping_ThenAdvancesToNextStep', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Language step should be visible
        await expect(page.getByTestId('select-language-en')).toBeVisible();

        // Skip
        await page.getByTestId('onboarding-language-skip').click();

        // Should advance to the phone step
        await expect(page.getByTestId('onboarding-phone-skip')).toBeVisible({ timeout: 5000 });
    });

    test('GivenPhoneStep_WhenSkipping_ThenCompletesOnboarding', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Skip language first to get to phone
        await expect(page.getByTestId('onboarding-language-skip')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();

        // Phone step should be visible
        await expect(page.getByTestId('onboarding-phone-skip')).toBeVisible({ timeout: 5000 });

        // Skip phone
        await page.getByTestId('onboarding-phone-skip').click();

        // Should redirect to home
        await page.waitForURL('/', { timeout: 5000 });
    });

    test('GivenFullOnboardingFlow_WhenCompletingAllSteps_ThenRedirectsToHome', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Step 1: Select language
        await expect(page.getByTestId('select-language-es')).toBeVisible();
        await page.getByTestId('select-language-es').click();
        await page.getByTestId('onboarding-language-save').click();

        // Step 2: Phone — fill in prefix and number
        await expect(page.getByTestId('onboarding-phone-prefix')).toBeVisible({ timeout: 5000 });
        await page.getByTestId('onboarding-phone-prefix').fill('+34');
        await page.getByRole('option', { name: /\+34/ }).first().click();
        await page.getByTestId('onboarding-phone-number').fill('612345678');
        await page.getByTestId('onboarding-phone-save').click();

        // Should redirect to home after completing all steps
        await page.waitForURL('/', { timeout: 5000 });
    });
});
