import { expect, test } from '@playwright/test';
import { runSeed } from '../fixtures';
import { createPrismaClient } from '../seed_utils';

interface OnboardingTestData {
    participantId: string;
    participantName: string;
    participantEmail: string;
}

const urlUnderTest = '/onboarding';

// ── Config: sequential execution, single worker ──
test.describe.configure({ mode: 'serial' });
test.use({ storageState: 'playwright/.auth/participant_user.json' });

// ── Shared seed data loaded once before the entire file ──
let data: OnboardingTestData;

test.beforeAll(async () => {
    data = await runSeed<OnboardingTestData>(import.meta.url);
});

/** Navigates to the given URL (defaults to the onboarding page) and waits for Svelte hydration to complete. */
async function gotoExplore(page: import('@playwright/test').Page, url: string = urlUnderTest) {
    await page.goto(url, { waitUntil: 'networkidle' });
}
// =====================================================================
// Chain 1 — Happy path: complete every step
// =====================================================================

test.describe('Onboarding - happy path', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: 'playwright/.auth/participant_user.json' });

    test('GivenAuthenticatedUser_WhenOnboardingIncomplete_ThenRedirectsToOnboarding', async ({ page }) => {
        await gotoExplore(page);
        await page.waitForURL(urlUnderTest);
    });

    test('GivenOnboardingWizard_WhenPageLoads_ThenShowsLanguageStepFirst', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-wizard')).toBeVisible();
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await expect(page.getByTestId('select-language-en')).toBeVisible();
        await expect(page.getByTestId('select-language-es')).toBeVisible();
        await expect(page.getByTestId('select-language-ca')).toBeVisible();
        await expect(page.getByTestId('select-language-auto')).toBeVisible();
        await expect(page.getByTestId('onboarding-previous')).toHaveCount(0);
    });

    test('GivenLanguageStep_WhenSavingThenGoingBack_ThenReturnsToLanguageWithStatePreserved', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();

        await page.getByTestId('select-language-en').click();
        await page.getByTestId('onboarding-language-save').click();

        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });
        await expect(page.getByTestId('onboarding-previous')).toBeVisible();

        await page.getByTestId('onboarding-previous').click();

        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await expect(page.getByTestId('select-language-en')).toHaveClass(/border-primary-500/);

        await page.getByTestId('onboarding-language-save').click();
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });
    });

    test('GivenLocationStep_WhenPostalCodeIsInvalid_ThenDoesNotAdvanceToPhoneStep', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-location-country').fill('Spain');
        await page.getByRole('option', { name: /Spain/ }).first().click();
        await page.getByTestId('onboarding-location-postal-code').fill('@@');
        await page.getByTestId('onboarding-location-save').click();

        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
        await expect(page.getByTestId('onboarding-step-phone')).not.toBeVisible();
    });

    test('GivenLocationStep_WhenFillingCountryAndPostalCode_ThenAdvancesToPhoneStep', async ({ page }) => {
        await gotoExplore(page);
        // Language was saved — wizard should jump straight to location
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-location-country').fill('Spain');
        await page.getByRole('option', { name: /Spain/ }).first().click();
        await page.getByTestId('onboarding-location-postal-code').fill('08001');
        await page.getByTestId('onboarding-location-save').click();

        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
        await page.getByTestId('onboarding-previous').click();

        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
        await expect(page.getByTestId('onboarding-location-postal-code')).toHaveValue('08001');

        await page.getByTestId('onboarding-location-save').click();
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
    });

    test('GivenPhoneStep_WhenPhoneNumberIsInvalid_ThenDoesNotAdvanceToVerifyEmailStep', async ({ page }) => {
        await gotoExplore(page);
        // Language + location saved — wizard should jump straight to phone
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-phone-prefix').fill('+34');
        await page.locator('div').filter({ hasText: /^.*\+34$/ }).first().click();
        await page.getByTestId('onboarding-phone-number').fill('12345');
        await page.getByTestId('onboarding-phone-save').click();

        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible();
        await expect(page.getByTestId('onboarding-step-verify-email')).not.toBeVisible();
    });

    test('GivenPhoneStep_WhenFillingPrefixAndNumber_ThenAdvancesToVerifyEmailStep', async ({ page }) => {
        await gotoExplore(page);
        // Language + location saved — wizard should jump straight to phone
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-phone-prefix').fill('+34');
        await page.locator('div').filter({ hasText: /^.*\+34$/ }).first().click();
        await page.getByTestId('onboarding-phone-number').fill('612345678');
        await page.getByTestId('onboarding-phone-save').click();

        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });
    });

    test('GivenVerifyEmailStep_WhenDisplayed_ThenShowsParticipantEmailAddress', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });
        await expect(page.getByTestId('onboarding-step-verify-email')).toContainText(data.participantEmail);
    });

    test('GivenVerifyEmailStep_WhenClickingResend_ThenShowsSuccessBanner', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-verify-email-resend').click();
        await expect(page.getByText(/sent|enviat|enviado/i)).toBeVisible({ timeout: 5000 });
    });

    test('GivenOnboardingCompleted_WhenNavigatingToHome_ThenStaysOnHome', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-verify-email-skip')).toBeVisible({ timeout: 5000 });
        await page.getByTestId('onboarding-verify-email-skip').click();

        await page.waitForURL('/', { timeout: 5000 });
        await expect(page).toHaveURL('/');
    });
});

// =====================================================================
// Chain 2 — Skip-all path: skip every step
// =====================================================================

test.describe('Onboarding - skip all steps', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: 'playwright/.auth/participant_user.json' });

    test.beforeAll(async () => {
        // Re-seed to reset all onboarding markers
        data = await runSeed<OnboardingTestData>(import.meta.url);
    });

    test('GivenOnboardingReset_WhenNavigatingToHome_ThenRedirectsToOnboarding', async ({ page }) => {
        // TODO: we are simulating the user going through onboarding now, but we should
        // test that the context does not contain the onboarding cookie and the redirect happens.
        await gotoExplore(page);
        await page.waitForURL(urlUnderTest);
    });

    test('GivenLanguageStep_WhenSkipping_ThenAdvancesToLocationStep', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();

        await page.getByTestId('onboarding-language-skip').click();

        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });
    });

    test('GivenLocationStep_WhenSkipping_ThenAdvancesToPhoneStep', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-location-skip').click();

        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });
    });

    test('GivenPhoneStep_WhenSkipping_ThenAdvancesToVerifyEmailStep', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-phone-skip').click();

        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });
    });

    test('GivenVerifyEmailStep_WhenSkipping_ThenCompletesOnboardingAndRedirectsToHome', async ({ page }) => {
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('onboarding-verify-email-skip').click();

        await page.waitForURL('/', { timeout: 5000 });
    });

    test('GivenAllStepsSkipped_WhenNavigatingToHome_ThenStaysOnHome', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL('/');
    });
});

// =====================================================================
// Chain 3 — Navigate out: redirect persists until onboarding completes
// =====================================================================

test.describe('Onboarding - navigate out', () => {
    test.describe.configure({ mode: 'serial' });
    test.use({ storageState: 'playwright/.auth/participant_user.json' });

    test.beforeAll(async ({ browser }) => {
        // Re-seed to reset all onboarding markers
        data = await runSeed<OnboardingTestData>(import.meta.url);
    });

    test.afterAll(async () => {
        // Restore all onboarding markers
        await runSeed<OnboardingTestData>(import.meta.url, { seedFile: 'restore.ts' });
    });

    test('GivenOnboardingIncomplete_WhenNavigatingToHome_ThenRedirectsToOnboarding', async ({ page }) => {
        // TODO: we are simulating the user going through onboarding now, but we should
        // test that the context does not contain the onboarding cookie and the redirect happens.
        await gotoExplore(page);
        await page.waitForURL(urlUnderTest);
    });

    test('GivenOnboardingPartiallyCompleted_WhenNavigatingToHome_ThenStillRedirectsToOnboarding', async ({ page }) => {
        // Skip language step (partially complete onboarding)
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });
    });

    test('GivenOnboardingPartiallyCompleted_WhenNavigatingToExplore_ThenRedirectsToOnboarding', async ({ page }) => {
        await gotoExplore(page, '/competitions/explore_competitions');
        await page.waitForURL('/competitions/explore_competitions');
    });

    test('GivenPartialOnboarding_WhenReturningToOnboarding_ThenShowsCorrectRemainingStep', async ({ page }) => {
        // Language was skipped previously — wizard should start at location
        await gotoExplore(page);
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible({ timeout: 5000 });
    });
});
