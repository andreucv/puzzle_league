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

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    globalTeardown: './e2e/global-teardown.ts',
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: process.env.CI ? 2 : 0,
    /* Opt out of parallel tests on CI. */
    workers: process.env.CI ? 1 : undefined,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: 'html',
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        baseURL: 'http://localhost:4173',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry',
        locale: 'en-GB',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'setup_participant',
            testMatch: /setup\/auth-participant\.setup\.ts/,
        },
        {
            name: 'setup_organizer',
            testMatch: /setup\/auth-organizer\.setup\.ts/,
        },
        {
            name: 'anonymous',
            testMatch: /.*\/anonymous\.test\.ts/,
            use: { ...devices['Desktop Chrome'] }
        },
        {
            name: 'participant',
            testMatch: /.*\/participant\.test\.ts/,
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup_participant', 'setup_organizer'],
        },
        {
            name: 'organizer',
            testMatch: /.*\/organizer\.test\.ts/,
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup_organizer', 'setup_participant'],
        },
        { name: 'setup', testMatch: /setup\/auth.*\.setup\.ts/ },
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            dependencies: ['setup'],
            testIgnore: [/responsive\/mobile_navigation\.test\.ts/, /anonymous\.test\.ts/, /participant\.test\.ts/, /organizer\.test\.ts/],
        },

        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
            dependencies: ['setup'],
            testIgnore: [/responsive\/mobile_navigation\.test\.ts/, /anonymous\.test\.ts/, /participant\.test\.ts/, /organizer\.test\.ts/],
        },

        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
            dependencies: ['setup'],
            testIgnore: [/responsive\/mobile_navigation\.test\.ts/, /anonymous\.test\.ts/, /participant\.test\.ts/, /organizer\.test\.ts/],
        },

        /* Test against mobile viewports. */
        {
            name: 'mobile_chrome',
            use: { ...devices['Pixel 7'] },
            dependencies: ['setup'],
            testIgnore: [/anonymous\.test\.ts/, /participant\.test\.ts/, /organizer\.test\.ts/],
        },
        {
            name: 'mobile_safari',
            use: { ...devices['iPhone 14'] },
            dependencies: ['setup'],
            testIgnore: [/anonymous\.test\.ts/, /participant\.test\.ts/, /organizer\.test\.ts/],
        },

        /* Test against branded browsers. */
        // {
        //   name: 'Microsoft Edge',
        //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
        // },
        // {
        //   name: 'Google Chrome',
        //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
        // },
    ],

    /* Run your local dev server before starting the tests */
    // webServer: {
    //   command: 'npm run build && npm run preview --host',
    //   port: 4173,
    //   reuseExistingServer: false,
    //   env: {
    //     ...process.env,
    //     BETTER_AUTH_URL: process.env.BETTER_AUTH_URL_TEST,
    //   },
    // },
});
