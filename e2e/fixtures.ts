import {
    test as base,
    type Browser,
    type BrowserContext,
    type Page,
} from '@playwright/test';
import { dirname, join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { loginViaUi } from './utils/auth';
import { disconnectSeedClients } from './seed_utils/database_seed_context';

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

/**
 * Storage-state files written by setup/auth.setup.ts for the three bootstrap
 * users. The single source for these paths — never inline the strings.
 */
export const AUTH_FILES = {
    participant: 'playwright/.auth/participant_user.json',
    organizer: 'playwright/.auth/organizer_user.json',
    admin: 'playwright/.auth/admin_user.json',
} as const;

export type Role = keyof typeof AUTH_FILES;

interface RoleFixtures {
    /** Page authenticated as the bootstrap participant, in its own context (auto-closed). */
    participantPage: Page;
    /** Page authenticated as the bootstrap organizer, in its own context (auto-closed). */
    organizerPage: Page;
    /** Page authenticated as the bootstrap admin, in its own context (auto-closed). */
    adminPage: Page;
    /**
     * Logs in through the UI as a seed-created user and returns a page in a
     * fresh context (auto-closed). Use for suite-private users so tests never
     * mutate the shared bootstrap users.
     */
    actor: (creds: { email: string; password: string }) => Promise<Page>;
}

async function withRolePage(browser: Browser, role: Role, use: (page: Page) => Promise<void>) {
    const context = await browser.newContext({ storageState: AUTH_FILES[role] });
    await use(await context.newPage());
    await context.close();
}

/**
 * Worker-scoped cache of storage state per actor email. The first `actor(creds)`
 * call for an email logs in through the UI once and captures its cookies; later
 * calls for the same email (same seed reused across tests in a worker) skip the
 * full-UI login and seed a fresh context from the saved state instead.
 */
const actorStateCache = new Map<string, StorageState>();

interface WorkerFixtures {
    /**
     * Auto worker fixture: disconnects the per-worker pooled Prisma/Better Auth
     * clients (see seed_utils/database_seed_context.ts) once, when the worker
     * tears down. globalTeardown can't do this — seeds run in the worker
     * process, not the main one.
     */
    seedClientCleanup: void;
}

/**
 * Project `test` with role-based page fixtures. Multi-actor workflows request
 * the pages they need instead of hand-building contexts:
 *
 * ```ts
 * test('participant registers, organizer confirms', async ({ participantPage, organizerPage }) => { … });
 * ```
 */
export const test = base.extend<RoleFixtures, WorkerFixtures>({
    seedClientCleanup: [async ({}, use) => {
        await use();
        await disconnectSeedClients();
    }, { scope: 'worker', auto: true }],

    participantPage: async ({ browser }, use) => withRolePage(browser, 'participant', use),
    organizerPage: async ({ browser }, use) => withRolePage(browser, 'organizer', use),
    adminPage: async ({ browser }, use) => withRolePage(browser, 'admin', use),
    actor: async ({ browser }, use) => {
        const contexts: BrowserContext[] = [];
        await use(async ({ email, password }) => {
            let state = actorStateCache.get(email);
            if (!state) {
                const loginContext = await browser.newContext();
                const loginPage = await loginContext.newPage();
                await loginViaUi(loginPage, email, password);
                state = await loginContext.storageState();
                actorStateCache.set(email, state);
                await loginContext.close();
            }
            const context = await browser.newContext({ storageState: state });
            contexts.push(context);
            return await context.newPage();
        });
        await Promise.all(contexts.map((context) => context.close()));
    },
});

export { expect } from '@playwright/test';

/**
 * Runs a `seed.ts` file co-located with the calling test and returns the data
 * it produces.
 *
 * Seeds run **in-process** (a dynamic `import()` of the seed module), so there
 * is no subprocess spawn and no intermediate `test-data.json` artifact — the
 * seed's return value is handed straight to the test.
 *
 * Convention:
 *  - Place a `seed.ts` next to your `*.test.ts` file.
 *  - The seed module `export default`s an async function that seeds the DB and
 *    returns its typed data. It must have no top-level side effects (importing
 *    it must not seed; only calling the default export does).
 *  - Call `runSeed<T>(import.meta.url)` in `test.beforeAll` (or at the start
 *    of a journey test that needs a fresh state per run).
 *
 * Seeded data is unique per invocation (see SeedContext.runId), so re-running
 * a seed never collides with earlier runs or with other suites.
 */
export interface SeedOptions {
    /** Override the seed module file name (default: `seed.ts` in the test's dir). */
    seedFile?: string;
}

/**
 * Imports the co-located seed module for a test file and invokes its default
 * export, returning the produced data.
 *
 * Pass `import.meta.url` from your test file — the seed module in the same
 * directory is resolved automatically.
 *
 * @param callerUrl - `import.meta.url` of the calling test file
 * @param options   - Optional override for the seed file name
 */
export async function runSeed<T = unknown>(callerUrl: string, options?: SeedOptions): Promise<T> {
    const testDir = dirname(fileURLToPath(callerUrl));
    const seedFile = options?.seedFile ?? 'seed.ts';
    const seedPath = join(testDir, seedFile);

    const mod = await import(pathToFileURL(seedPath).href);
    if (typeof mod.default !== 'function') {
        throw new Error(
            `Seed module must export a default async function returning its data: ${seedPath}`,
        );
    }

    return (await mod.default()) as T;
}
