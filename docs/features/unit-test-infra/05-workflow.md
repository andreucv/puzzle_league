---
slug: unit-test-infra
stage: workflow
feature: Unit testing infrastructure overhaul — env split, shared factories, typed Prisma mocks
issue: null
status: implemented
created: 2026-06-16
updated: 2026-06-16
related:
  - docs/features/unit-test-infra/04-plan.md
  - docs/features/unit-test-ci-gate/04-plan.md
  - docs/features/unit-test-ci-gate/05-workflow.md
---

# Workflow: Unit testing infrastructure

How the shipped Vitest unit-test infrastructure behaves today. This is **test infrastructure**, not a
user-facing feature — no route, UI, or persisted state. The "behavior" documented here is how a suite
is discovered, which environment it runs in, and how it mocks Prisma / the framework / `$app`.

Source of truth is the merged code. Where this doc and [04-plan.md](./04-plan.md) disagree, the code
wins (the plan's P3 factory-consolidation premise was corrected during implementation — see Caveats).
The complementary [unit-test-ci-gate](../unit-test-ci-gate/05-workflow.md) doc covers the CI gate,
coverage, and format gate that enforce this suite.

## Source files inspected

- [vite.config.ts](../../../vite.config.ts) — the two-project (`server`/`client`) Vitest config,
  `$tests` alias, `$app/*` aliases, `clearMocks`, coverage.
- [svelte.config.js](../../../svelte.config.js) — `kit.alias.$tests` (so `pnpm check` resolves it).
- [src/tests/setup.client.ts](../../../src/tests/setup.client.ts) /
  [src/tests/setup.server.ts](../../../src/tests/setup.server.ts) — per-project setup.
- [src/tests/mocks/prisma.ts](../../../src/tests/mocks/prisma.ts) — typed deep Prisma mock + helpers.
- [src/tests/factories.ts](../../../src/tests/factories.ts) — shared fixtures.
- Existing mocks: [src/tests/mocks/](../../../src/tests/mocks/) (`translations`, `app_stores`,
  `app_navigation`, `app_environment`, `auth_client`, `StubIcon.svelte`).
- Reference migrations: server
  [registration-workflow.test.ts](../../../src/lib/services/registration-workflow.test.ts), client
  [EntryRow.svelte.test.ts](../../../src/lib/components/during-competition/EntryRow.svelte.test.ts).

## What shipped

Four structural changes to the unit layer, no change to *what* is tested:

1. **Environment split** — server code runs in node, components in jsdom, browser resolve conditions
   scoped to the client project (was global and backwards).
2. **`$tests` alias** — shared scaffolding imported as `$tests/...` instead of `../../../tests/...`.
3. **Typed Prisma mock** — one `prismaMock` deep mock replaces 8 suites' hand-rolled `makeTx()`.
4. **Real framework, shared fixtures** — `@sveltejs/kit` no longer mocked (real `Response`); the
   truly-duplicated entry/competition fixtures live in one `factories.ts`.

## The environment split (the core mechanism)

`vite.config.ts` defines `test.projects`; the discriminator is **filename**:

| Suite filename | Project | Environment | setup file | Browser resolve conditions |
|---|---|---|---|---|
| `*.svelte.test.ts` | `client` | `jsdom` | `setup.client.ts` | **yes** (scoped here) |
| `*.test.ts` (all others) | `server` | `node` | `setup.server.ts` | no |

Current split: **server 23 files / 208 tests**, **client 11 files / 110 tests** (34 / 318 total).

Shared config lives at the root `test` block (inherited via `extends: true`): `clearMocks: true`, the
`coverage` block + thresholds (owned by [unit-test-ci-gate](../unit-test-ci-gate/05-workflow.md)), and
the alias map (`$app/navigation|environment|stores` → mocks, `$tests` → `/src/tests`). `$tests` is
also registered in `svelte.config.js` `kit.alias` so `svelte-kit sync` propagates it into
`.svelte-kit/tsconfig.json` and `pnpm check` resolves it.

**Rule for new tests:** name a component/Svelte-rendering suite `Foo.svelte.test.ts` (jsdom);
everything else is `Foo.test.ts` (node).

## Setup files

- **[setup.client.ts](../../../src/tests/setup.client.ts)** (client project): registers jest-dom
  matchers, polyfills the Web Animations API (`Element.prototype.animate` / `getAnimations`) jsdom
  lacks, and runs `afterEach(cleanup)`. Because cleanup is global, suites no longer call `cleanup()`
  themselves and no longer inline the WAAPI polyfills.
- **[setup.server.ts](../../../src/tests/setup.server.ts)** (server project): intentionally minimal
  (an `export {}`), a home for future node-env hooks.

## Mocking Prisma — `$tests/mocks/prisma.ts`

A typed deep mock replaces every hand-rolled `makeTx()`:

```ts
import { prismaMock } from '$tests/mocks/prisma';
vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }));
```

- `prismaMock = mockDeep<PrismaClient>()` — fully typed; a method-name typo
  (`prismaMock.entry.craete`) fails compilation.
- A module-scoped `beforeEach(mockReset(prismaMock))` resets call history **and** configured returns
  before every test (runs in the importing suite's context).
- **`mockFn(prismaMock.x.y)`** — narrows a method to vitest's `Mock` so `.mockResolvedValue(partial)`
  type-checks against partial fixtures (the method name stays validated; full payload typing is the
  factories' job, not done for every fixture — see Caveats).
- **`vi.mocked(prismaMock.x.groupBy)`** — used for Prisma's heavily-overloaded methods
  (`groupBy`/`aggregate`) whose mock API the deep-mock type doesn't expose directly.
- **`mockPrismaTransaction()`** — wires `prisma.$transaction` so the interactive `(tx) => …` callback
  receives `prismaMock` as `tx`, and the array form resolves all promises. (Suites that mock
  `$transaction` with a fixed return value — e.g. `category-lifecycle-autostop` — just set
  `mockResolvedValue` instead.)

8 suites use this: `db_competition_categories`, `db_competition_other_upcoming`, `dispatcher`,
`auto-cancel` (service), `category-lifecycle-autostop`, `competition-access`, `registration-workflow`,
and the `cron/auto-cancel` route.

## Other conventions enforced

- **`$app/*` is mocked globally** via the config alias — suites do **not** re-`vi.mock('$app/stores')`.
  (`$app/state` is the exception: not aliased, so `Header.svelte.test.ts` keeps its own inline mock.)
- **API routes assert a real `Response`** — `@sveltejs/kit` is not mocked; tests read
  `await response.json()` and `response.status` (3 suites: `confirm`, `refuse`, `cron/auto-cancel`).
- **Shared fixtures** in [factories.ts](../../../src/tests/factories.ts): `makeEntryData` (entry +
  participants + category→competition; used by `confirm`, `refuse`, `registration_notifications`) and
  `makeUpcomingCompetition` (discovery competition; used by `db_competition_other_upcoming` and the
  `other-upcoming` API suite).
- **No per-file `vi.clearAllMocks()`** — `clearMocks: true` is global.

## Caveats

- **P3 was narrower than the plan, by design.** The plan assumed `makeCompetition`/`makeCategory`/
  `makeEntry` were duplicated across ~10 suites. Only two shapes were *truly* duplicated
  (`makeEntryData`, `makeUpcomingCompetition`) and were centralised. The rest are **single-use with
  divergent, test-meaningful shapes** (component-render category in `CategoryCard` /
  `CategoryCapacityRow`, presentation competition in `home-page`, the auto-cancel competition, the
  registration-workflow domain trio) and stay colocated — centralising a one-consumer fixture adds
  coupling without removing duplication.
- **`mockFn` trades payload-type-safety for low churn.** It casts a method to `Mock` so partial
  fixtures pass `mockResolvedValue`. Method names stay typed; payloads do not. Tightening payloads to
  full typed fixtures is deferred (would need richer factories).
- **Residual `as never` / `as any` casts remain outside the Prisma seam.** The typed mock removed the
  `makeTx`/`(prisma.x as any)` casts in the 8 Prisma suites, but casts in
  [auto-stop-scheduler.test.ts](../../../src/lib/services/auto-stop-scheduler.test.ts),
  [auto-stop-webhook.test.ts](../../../src/lib/services/auto-stop-webhook.test.ts), and the
  `as never` on notification-function args in
  [registration_notifications.test.ts](../../../src/lib/notifications/registration_notifications.test.ts)
  are out of scope (they mock schedulers/enums, not Prisma) — captured as a follow-up in
  [04-plan.md](./04-plan.md).
- **`registration_notifications` migration was safe only because every call overrides `creatorId`.**
  Its old local default (`creator-1`) differed from the shared `makeEntryData` default (`user-1`) in
  a notification-recipient-meaningful way; all 9 call sites pass `creatorId` explicitly, so the
  default is never used.
- **`*.svelte.test.ts` also captures rune/store suites.** `notifications.svelte.test.ts` (a `.svelte.ts`
  store test) matches the client glob and runs in jsdom — correct, but it's not a component-render
  test.

## Verification (2026-06-16)

- `pnpm test:unit` → 34 files / 318 tests (server 23/208, client 11/110).
- `pnpm check` → 0 errors.
- `pnpm test:unit:coverage` → above the ci-gate floor (Stmts 21.02 / Branch 22.96 / Funcs 19.2 /
  Lines 21.47).
