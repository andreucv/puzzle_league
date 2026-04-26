import { test as base } from '@playwright/test';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

/**
 * Runs a `seed.ts` file co-located with the calling test and returns
 * the parsed contents of the `test-data.json` it produces.
 *
 * Convention:
 *  - Place a `seed.ts` next to your `*.test.ts` file.
 *  - The seed script composes steps from `e2e/seed_utils` and writes
 *    `test-data.json` via `writeSeedOutput(import.meta.url, data)`.
 *  - Call `runSeed<T>(import.meta.url)` in `test.beforeAll`.
 *
 * The generic parameter `T` lets each test define its own data shape:
 *
 * ```ts
 * test.beforeAll(async () => {
 *     data = await runSeed<MyTestData>(import.meta.url);
 * });
 * ```
 */
export interface SeedOptions {
    /** Override the seed script path (default: `seed.ts` in `testDir`). */
    seedFile?: string;
    /** Override the output JSON path (default: `test-data.json` in `testDir`). */
    dataFile?: string;
}

/**
 * Internal: runs a seed script from the given test directory.
 */
async function executeSeed<T = unknown>(testDir: string, options?: SeedOptions): Promise<T> {
    const seedFile = options?.seedFile ?? 'seed.ts';
    const dataFile = options?.dataFile ?? 'test-data.json';

    const seedPath = join(testDir, seedFile);
    const dataPath = join(testDir, dataFile);

    if (!existsSync(seedPath)) {
        throw new Error(`Seed file not found: ${seedPath}`);
    }

    execSync(`npx tsx "${seedPath}"`, {
        cwd: ROOT,
        env: { ...process.env },
        stdio: 'pipe',
    });

    if (!existsSync(dataPath)) {
        throw new Error(
            `Seed script ran but did not produce output file: ${dataPath}\n` +
            `Make sure your seed.ts calls writeSeedOutput(import.meta.url, data).`,
        );
    }

    return JSON.parse(readFileSync(dataPath, 'utf-8')) as T;
}

/**
 * Runs the co-located `seed.ts` for a test file and returns the parsed JSON output.
 *
 * Pass `import.meta.url` from your test file — the seed.ts in the same
 * directory will be resolved automatically.
 *
 * @param callerUrl - `import.meta.url` of the calling test file
 * @param options   - Optional overrides for file names
 */
export async function runSeed<T = unknown>(callerUrl: string, options?: SeedOptions): Promise<T> {
    const testDir = dirname(fileURLToPath(callerUrl));
    return executeSeed<T>(testDir, options);
}

/**
 * Extended Playwright `test` that provides a `seed` fixture.
 *
 * The fixture automatically resolves the calling test's directory.
 *
 * Usage:
 * ```ts
 * import { test, expect } from '../fixtures';
 *
 * test('my test', async ({ seed }) => {
 *     const data = await seed<MyTestData>();
 * });
 * ```
 */
export const test = base.extend<{
    seed: <T = unknown>(options?: SeedOptions) => Promise<T>;
}>({
    seed: async ({}, use, testInfo) => {
        const testDir = dirname(testInfo.file);
        await use(<T = unknown>(options?: SeedOptions) => executeSeed<T>(testDir, options));
    },
});

export { expect } from '@playwright/test';
