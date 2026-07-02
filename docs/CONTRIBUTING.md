# Contributing

## Setup

Use Node 20 and pnpm. Install dependencies with `pnpm install`; the repo rejects other package managers through `preinstall`.

Start from `.env.example`, then add any feature-specific keys required by the code you are running. Common local keys include database connection values, `BETTER_AUTH_SECRET`, OAuth keys, Cloudinary keys, Ably, Resend, PostHog, and QStash (the QStash signing keys also authenticate the scheduled cron endpoints). Playwright requires `LOCAL_DATABASE_TEST_DATABASE_URL` pointing to a local PostgreSQL database.

Useful commands:

- `pnpm dev` starts the Vite dev server. If you develop inside Docker (no native file-system
  events), set `VITE_POLLING=true` to enable watcher polling for HMR; leave it unset on native
  checkouts — polling makes cold starts drastically slower.
- `pnpm check` runs SvelteKit sync and `svelte-check`.
- `pnpm test:unit` runs Vitest tests under `src/**/*.test.ts`.
- `pnpm test:unit:coverage` runs the unit suite with v8 coverage (text + HTML in `coverage/`, plus `lcov`).
- `pnpm test:e2e` runs Playwright tests under `e2e/`.
- `pnpm test` runs unit tests and E2E tests.
- `pnpm format` / `pnpm format:check` write / check Prettier formatting.
- `pnpm build` creates the production build.

## Code Guidelines

Use the domain terms in `docs/glossary.md`: Competition, Category, Entry, Registration, Participant, Organizer, Judge, External Participant, and Notification. Avoid reintroducing older names such as Record or Inscription.

Keep business rules server-side. Page actions and API handlers should validate request shape, call shared services or database helpers, and return responses. Put cross-route workflows in `src/lib/services/`, read/write helpers in `src/lib/database/`, and reusable UI in `src/lib/components/`.

Do not duplicate authorization logic. Use the existing layouts, `getCompetitionAccess`, and API route guards. When adding an API route, register its guard in `src/lib/api_utils/api_route_guards.ts` unless it is intentionally public and belongs in `api_whitelist.ts`.

For user-visible UI, follow the existing Svelte 5, Tailwind, Skeleton UI, and translation patterns. Add translation keys for `en`, `es`, and `ca` when adding new copy. Prefer existing form helpers, Superforms/Zod validation, and contact/date utilities before adding new validation code.

When changing competition-day state, keep Prisma state, Ably events, notifications, and tests in sync. When changing notifications, use `src/lib/notifications/` and only add email side effects deliberately.

## Data And Tests

Edit `prisma/schema.prisma` and add migrations for data model changes. Do not edit generated Prisma files directly.

Add focused Vitest coverage for services, utilities, API guards, and reusable components. Add Playwright coverage for participant, organizer, admin, onboarding, registration, or competition-day workflows.

Unit test conventions (`src/**/*.test.ts`, colocated with the code):

- **Environment split by filename.** Vitest runs two projects (`vite.config.ts`). Component/Svelte suites are named `*.svelte.test.ts` and run in the **client** project (jsdom + browser resolve conditions); everything else (`*.test.ts`) runs in the **server** project (node, no browser conditions). Name a new component test `Foo.svelte.test.ts` so it lands in jsdom.
- **Shared scaffolding lives in `src/tests/`, imported via the `$tests` alias** (not `../../../tests/...`): `setup.client.ts` (jest-dom matchers, Web Animations polyfills, `afterEach(cleanup)` — no manual `cleanup()` needed), `setup.server.ts`, `factories.ts` (shared fixtures like `makeEntryData`), and `mocks/` (`prisma.ts`, `translations`, `app_stores`, `auth_client`, `StubIcon.svelte`).
- **Mock Prisma with the typed deep mock.** `import { prismaMock } from '$tests/mocks/prisma'` then `vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }))`. `prismaMock` auto-resets before each test. Use `mockFn(prismaMock.x.y)` to set partial-fixture return values, `vi.mocked(prismaMock.x.groupBy)` for overloaded methods, and `mockPrismaTransaction()` for interactive `$transaction` callbacks. Don't hand-roll `makeTx()` objects.
- **`$app/*` is mocked globally** through the `vite.config.ts` test alias — don't re-`vi.mock('$app/stores')` in a suite. Assert API routes against a **real** `Response` (`await response.json()` / `response.status`); don't mock `@sveltejs/kit`.
- **No per-file `vi.clearAllMocks()`** — `clearMocks: true` is global.

E2E conventions (`e2e/`):

- **Roles come from fixtures, not file names.** Import `test` from `e2e/fixtures.ts` and request `participantPage`, `organizerPage`, `adminPage`, or `actor` (UI login as a seed-created user). Never inline `playwright/.auth/...` paths; use the `AUTH_FILES` map for `test.use({ storageState })`.
- **Seeds are co-located and unique per invocation.** Put a `seed.ts` next to the test, call `runSeed<T>(import.meta.url)`, and assert on the returned IDs/names. `createCompetition` and `createAuthUser` suffix names/emails with a `runId`, so suites are isolated, run fully in parallel, and need no restore/cleanup scripts. Suites that mutate user state must seed their own user with `createAuthUser` — never mutate the shared bootstrap users.
- **Multi-step workflows are journey tests.** Model a flow that builds on previous actions as one `test()` with `test.step()` blocks, not a serial `describe` chain.
- **Navigation waits for hydration.** Use `gotoHydrated` (`e2e/utils/navigation.ts`) before interacting with a page; never `waitUntil: 'networkidle'`.
- **Selectors target `data-testid` or roles**, never CSS utility classes. Timeouts are centralized in `playwright.config.ts`; only add an inline timeout for a documented constraint (e.g. real-time sync).
- **Server lifecycle:** `scripts/e2e-server.ts` prepares the test DB, builds (hash-cached), and serves; Playwright launches it via `webServer`. Run it manually in a terminal to keep a warm server across local runs.

Before opening a PR, run the smallest relevant tests plus `pnpm check`; run `pnpm test` for broad workflow or schema changes. Keep PRs scoped, mention migrations/env changes, and include the commands you ran.

### CI gate (unit layer)

`.github/workflows/unit-tests.yaml` runs on every PR into `main`/`test` and on pushes to those branches. It installs with a frozen lockfile, then runs `pnpm check` (type-check) and `pnpm test:unit:coverage`. The unit layer is fully mocked, so no Postgres or secrets are needed — the workflow seeds dummy `$env/static/*` values only so the type-check resolves. e2e/Playwright is **not** part of this gate.

- **Green before merge.** Keep the unit suite green; the gate blocks a red suite.
- **Coverage is a regression-only floor.** `vite.config.ts` pins thresholds a couple points below the measured baseline, so CI fails on a coverage *drop*, not on missing tests. Raise the floor deliberately when you add coverage.
- **Format gate is changed-files-only.** The PR run Prettier-checks just the `.ts`/`.js` files your PR adds or modifies under `src/` (the legacy tree predates Prettier and is untouched; `.svelte` is excluded — no Svelte parser is configured). Run `pnpm format` to fix your files before pushing.
- **Branch protection is a repo setting, not a file.** To make this check required, enable branch protection on `main` (and `test`) in GitHub repo settings → Branches, and add `unit-tests / unit-tests` as a required status check.
