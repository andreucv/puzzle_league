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
 *  - The seed script writes a `test-data.json` in the same directory.
 *  - Call `const data = await seed()` in `test.beforeAll` to run it.
 *
 * The generic parameter `T` lets each test define its own data shape:
 *
 * ```ts
 * test.beforeAll(async () => {
 *     data = await seed<MyTestData>();
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
 * Runs a seed script from the given test directory and returns the parsed JSON output.
 *
 * @param testDir - Absolute path to the directory containing the seed.ts and test-data.json
 * @param options - Optional overrides for file names
 */
export async function runSeed<T = unknown>(testDir: string, options?: SeedOptions): Promise<T> {
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
            `Make sure your seed.ts writes a ${dataFile} in its own directory.`,
        );
    }

    return JSON.parse(readFileSync(dataPath, 'utf-8')) as T;
}

/**
 * Extended Playwright `test` that provides a `seed` fixture.
 *
 * Usage:
 * ```ts
 * import { test, expect } from '../fixtures';
 *
 * test.beforeAll(async ({ seed }) => {
 *     const data = await seed<MyTestData>();
 * });
 * ```
 */
export const test = base.extend<{
    seed: <T = unknown>(options?: SeedOptions) => Promise<T>;
}>({
    seed: async ({}, use, testInfo) => {
        const testDir = dirname(testInfo.file);
        await use(<T = unknown>(options?: SeedOptions) => runSeed<T>(testDir, options));
    },
});

export { expect } from '@playwright/test';
