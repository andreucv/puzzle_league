import { expect, test } from '@playwright/test';
import { runSeed } from '../fixtures';
import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

/**
 * Marks a user's email as verified in the database.
 * Used to simulate clicking the verification link from an email.
 */
function markEmailVerified(userId: string) {
    execSync(`npx tsx e2e/onboarding/mark_email_verified.ts "${userId}"`, {
        cwd: ROOT,
        env: { ...process.env },
        stdio: 'pipe',
    });
}

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
    participantEmail: string;
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

    test('GivenLanguageStep_WhenSelectingLanguageAndSaving_ThenAdvancesToPhoneStep', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Language step should be visible
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await expect(page.getByTestId('select-language-en')).toBeVisible();

        // Select English
        await page.getByTestId('select-language-en').click();

        // Save
        await page.getByTestId('onboarding-language-save').click();

        // Should advance to the phone step
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
    });

    test('GivenLanguageStep_WhenSkipping_ThenAdvancesToPhoneStep', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Language step should be visible
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();

        // Skip
        await page.getByTestId('onboarding-language-skip').click();

        // Should advance to the phone step
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
    });

    test('GivenPhoneStep_WhenSkipping_ThenAdvancesToVerifyEmailStep', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Skip language to get to phone
        await expect(page.getByTestId('onboarding-language-skip')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();

        // Phone step should be visible
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });

        // Skip phone
        await page.getByTestId('onboarding-phone-skip').click();

        // Should advance to verify-email step (since email is not verified)
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });
    });

    test('GivenVerifyEmailStep_WhenSkipping_ThenCompletesOnboardingAndRedirectsToHome', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Skip language
        await expect(page.getByTestId('onboarding-language-skip')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();

        // Skip phone
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
        await page.getByTestId('onboarding-phone-skip').click();

        // Verify-email step should be visible
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });
        await expect(page.getByTestId('onboarding-verify-email-resend')).toBeVisible();
        await expect(page.getByTestId('onboarding-verify-email-skip')).toBeVisible();

        // Skip email verification
        await page.getByTestId('onboarding-verify-email-skip').click();

        // Should redirect to home
        await page.waitForURL('/', { timeout: 5000 });
    });

    test('GivenFullOnboardingFlow_WhenCompletingAllStepsAndVerifyingEmail_ThenRedirectsToHomeWithVerifiedEmail', async ({ page }) => {
        const data = await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Step 1: Select language
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await page.getByTestId('select-language-es').click();
        await page.getByTestId('onboarding-language-save').click();

        // Step 2: Phone — fill in prefix and number
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
        await page.getByTestId('onboarding-phone-prefix').fill('+34');
        await page.getByRole('option', { name: /\+34/ }).first().click();
        await page.getByTestId('onboarding-phone-number').fill('612345678');
        await page.getByTestId('onboarding-phone-save').click();

        // Step 3: Verify email step should appear
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });

        // Simulate email verification by updating the database directly
        // (e2e tests cannot click real verification links from emails)
        markEmailVerified(data.participantId);

        // Skip the verification step (email is already verified in DB)
        await page.getByTestId('onboarding-verify-email-skip').click();

        // Should redirect to home — onboarding is complete
        await page.waitForURL('/', { timeout: 5000 });

        // Verify the user can access the home page without being redirected back to onboarding
        await page.goto('/');
        await expect(page).toHaveURL('/');
    });

    test('GivenVerifyEmailStep_WhenDisplayed_ThenShowsParticipantEmailAddress', async ({ page }) => {
        const data = await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Skip to verify-email step
        await expect(page.getByTestId('onboarding-language-skip')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
        await page.getByTestId('onboarding-phone-skip').click();

        // Verify-email step should show the participant's actual email address
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });
        await expect(page.getByTestId('onboarding-step-verify-email')).toContainText(data.participantEmail);
    });

    test('GivenVerifyEmailStep_WhenClickingResend_ThenShowsSuccessBanner', async ({ page }) => {
        await runSeed<OnboardingTestData>(import.meta.url);
        await page.goto('/onboarding');

        // Skip to verify-email step
        await expect(page.getByTestId('onboarding-language-skip')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
        await page.getByTestId('onboarding-phone-skip').click();

        // Verify-email step should be visible
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });

        // Click resend
        await page.getByTestId('onboarding-verify-email-resend').click();

        // Success banner should appear (the resend action fires the email via Better Auth)
        await expect(page.getByText(/sent|enviat|enviado/i)).toBeVisible({ timeout: 5000 });
    });
});
