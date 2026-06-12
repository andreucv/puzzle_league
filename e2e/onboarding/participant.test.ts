import { expect, test, runSeed } from '../fixtures';
import { gotoHydrated } from '../utils/navigation';
import type { Page } from '@playwright/test';

interface OnboardingTestData {
    participantId: string;
    participantName: string;
    participantEmail: string;
    participantPassword: string;
}

const urlUnderTest = '/onboarding';

// Each journey seeds its own fresh, un-onboarded user (runId-unique email)
// and logs in via the actor fixture, so the journeys are fully independent
// and never touch the shared bootstrap participant.
async function freshOnboardingUser(
    actor: (creds: { email: string; password: string }) => Promise<Page>,
): Promise<{ page: Page; data: OnboardingTestData }> {
    const data = await runSeed<OnboardingTestData>(import.meta.url);
    const page = await actor({ email: data.participantEmail, password: data.participantPassword });
    return { page, data };
}

// =====================================================================
// Journey 1 — Happy path: complete every step
// =====================================================================

test('GivenIncompleteOnboarding_WhenCompletingEveryStep_ThenWizardAdvancesAndLandsOnHome', async ({ actor }) => {
    const { page, data } = await freshOnboardingUser(actor);

    await test.step('redirects to onboarding and shows the language step first', async () => {
        await gotoHydrated(page, urlUnderTest);
        await page.waitForURL(urlUnderTest);

        await expect(page.getByTestId('onboarding-wizard')).toBeVisible();
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await expect(page.getByTestId('select-language-en')).toBeVisible();
        await expect(page.getByTestId('select-language-es')).toBeVisible();
        await expect(page.getByTestId('select-language-ca')).toBeVisible();
        await expect(page.getByTestId('select-language-auto')).toBeVisible();
        await expect(page.getByTestId('onboarding-previous')).toHaveCount(0);
    });

    await test.step('saving language then going back preserves the selection', async () => {
        await page.getByTestId('select-language-en').click();
        await page.getByTestId('onboarding-language-save').click();

        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
        await expect(page.getByTestId('onboarding-previous')).toBeVisible();

        await page.getByTestId('onboarding-previous').click();

        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await expect(page.getByTestId('select-language-en')).toHaveClass(/border-primary-500/);

        await page.getByTestId('onboarding-language-save').click();
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
    });

    await test.step('invalid postal code does not advance past the location step', async () => {
        await page.getByTestId('onboarding-location-country').fill('Spain');
        await page.getByRole('option', { name: /Spain/ }).first().click();
        await page.getByTestId('onboarding-location-postal-code').fill('@@');
        await page.getByTestId('onboarding-location-save').click();

        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
        await expect(page.getByTestId('onboarding-step-phone')).not.toBeVisible();
    });

    await test.step('valid country and postal code advance to the phone step', async () => {
        await page.getByTestId('onboarding-location-postal-code').fill('08001');
        await page.getByTestId('onboarding-location-save').click();

        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible();
        await page.getByTestId('onboarding-previous').click();

        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
        await expect(page.getByTestId('onboarding-location-postal-code')).toHaveValue('08001');

        await page.getByTestId('onboarding-location-save').click();
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible();
    });

    await test.step('invalid phone number does not advance past the phone step', async () => {
        await page.getByTestId('onboarding-phone-prefix').fill('+34');
        await page.locator('div').filter({ hasText: /^.*\+34$/ }).first().click();
        await page.getByTestId('onboarding-phone-number').fill('12345');
        await page.getByTestId('onboarding-phone-save').click();

        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible();
        await expect(page.getByTestId('onboarding-step-verify-email')).not.toBeVisible();
    });

    await test.step('valid prefix and number advance to the verify-email step', async () => {
        await page.getByTestId('onboarding-phone-number').fill('612345678');
        await page.getByTestId('onboarding-phone-save').click();

        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible();
    });

    await test.step('verify-email step shows the participant email and resend works', async () => {
        await expect(page.getByTestId('onboarding-step-verify-email')).toContainText(data.participantEmail);

        await page.getByTestId('onboarding-verify-email-resend').click();
        await expect(page.getByTestId('onboarding-verify-email-resent-banner')).toBeVisible();
    });

    await test.step('skipping verification completes onboarding and lands on home', async () => {
        await page.getByTestId('onboarding-verify-email-skip').click();
        await page.waitForURL('/home');
        await expect(page).toHaveURL('/home');
    });
});

// =====================================================================
// Journey 2 — Skip-all path: skip every step
// =====================================================================

test('GivenIncompleteOnboarding_WhenSkippingEveryStep_ThenOnboardingCompletes', async ({ actor }) => {
    const { page } = await freshOnboardingUser(actor);

    await test.step('redirects to onboarding', async () => {
        // TODO: we are simulating the user going through onboarding now, but we should
        // test that the context does not contain the onboarding cookie and the redirect happens.
        await gotoHydrated(page, urlUnderTest);
        await page.waitForURL(urlUnderTest);
    });

    await test.step('skipping language advances to location', async () => {
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
    });

    await test.step('skipping location advances to phone', async () => {
        await page.getByTestId('onboarding-location-skip').click();
        await expect(page.getByTestId('onboarding-step-phone')).toBeVisible();
    });

    await test.step('skipping phone advances to verify email', async () => {
        await page.getByTestId('onboarding-phone-skip').click();
        await expect(page.getByTestId('onboarding-step-verify-email')).toBeVisible();
    });

    await test.step('skipping verify email completes onboarding and redirects home', async () => {
        await page.getByTestId('onboarding-verify-email-skip').click();
        await page.waitForURL('/home');
    });

    await test.step('home no longer redirects to onboarding', async () => {
        await page.goto('/home');
        await expect(page).toHaveURL('/home');
    });
});

// =====================================================================
// Journey 3 — Navigate out: redirect persists until onboarding completes
// =====================================================================

test('GivenPartialOnboarding_WhenNavigatingAway_ThenWizardResumesAtRemainingStep', async ({ actor }) => {
    const { page } = await freshOnboardingUser(actor);

    await test.step('redirects to onboarding while incomplete', async () => {
        // TODO: we are simulating the user going through onboarding now, but we should
        // test that the context does not contain the onboarding cookie and the redirect happens.
        await gotoHydrated(page, urlUnderTest);
        await page.waitForURL(urlUnderTest);
    });

    await test.step('partially complete onboarding (skip language only)', async () => {
        await expect(page.getByTestId('onboarding-step-language')).toBeVisible();
        await page.getByTestId('onboarding-language-skip').click();
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
    });

    await test.step('navigating to explore still works while partially onboarded', async () => {
        await gotoHydrated(page, '/competitions/explore_competitions');
        await page.waitForURL('/competitions/explore_competitions');
    });

    await test.step('returning to onboarding shows the correct remaining step', async () => {
        // Language was skipped previously — wizard should start at location
        await gotoHydrated(page, urlUnderTest);
        await expect(page.getByTestId('onboarding-step-location')).toBeVisible();
    });
});
