import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const PREVIEW_PORT = 4173;

/* Read-only suites that need no auth state and no seeded data — safe to run
 * on every browser. */
const SMOKE_TESTS = [/landing\/anonymous\.test\.ts/, /auth\/anonymous\.test\.ts/];

/**
 * See https://playwright.dev/docs/test-configuration.
 *
 * Roles are provided by fixtures (e2e/fixtures.ts), not by projects: any test
 * can request participantPage / organizerPage / adminPage / actor regardless
 * of which file it lives in. Seeded data is unique per seed invocation, so
 * suites are isolated and run fully in parallel.
 */
export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* The `process.env.CI` branches below are aspirational: there is not yet a
     * GitHub Actions workflow running this suite. They are kept (not deleted) so
     * the config is ready to wire up the moment the suite is stable enough to
     * gate merges on CI. */
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 4 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    timeout: 30_000,
    /* Default assertion timeout. Kept generous so a loaded machine (or future
     * CI) doesn't flake on assertions that wait on a server action / popover;
     * fast static checks still resolve well under this. Slow realtime waits
     * (e.g. Ably sync) override per-assertion with an explicit timeout. */
    expect: { timeout: 5_000 },
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: `http://localhost:${PREVIEW_PORT}`,

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        locale: 'en-GB',
    },

    /* Prepares the test DB, builds the app (hash-cached), and serves it.
     * Run `npx tsx e2e/e2e-server.ts` manually to keep a warm server
     * across local runs. global-setup.ts guards against a stale warm server. */
    webServer: {
        command: 'npx tsx e2e/e2e-server.ts',
        port: PREVIEW_PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
        stdout: 'pipe',
        stderr: 'pipe',
    },

    projects: [
        {
            name: 'setup',
            testMatch: /setup\/auth\.setup\.ts/,
        },
        {
            name: 'chromium',
            testMatch: /.*\.test\.ts/,
            /* responsive/ runs only on the mobile projects below */
            testIgnore: /responsive\//,
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
        },

        /* Non-Chromium browsers run a read-only, seed-less smoke pack only. */
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            testMatch: SMOKE_TESTS,
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            testMatch: SMOKE_TESTS,
        },

        /* Test against mobile viewports. */
        {
            name: 'mobile_chrome',
            use: { ...devices['Pixel 7'] },
            dependencies: ['setup'],
            testMatch: [/responsive\/mobile_navigation\.test\.ts/, /landing\/anonymous\.test\.ts/],
        },
        {
            name: 'mobile_safari',
            use: { ...devices['iPhone 14'] },
            dependencies: ['setup'],
            testMatch: [/responsive\/mobile_navigation\.test\.ts/, /landing\/anonymous\.test\.ts/],
        },
    ],
});
