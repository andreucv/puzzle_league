---
slug: unit-test-infra
stage: plan
feature: Unit testing infrastructure overhaul — env split, shared factories, typed Prisma mocks
issue: null
status: draft
created: 2026-06-13
updated: 2026-06-16
related:
  - docs/features/unit-test-infra/05-workflow.md
  - docs/features/unit-test-ci-gate/04-plan.md
  - docs/features/unit-test-ci-gate/05-workflow.md
  - docs/features/e2e-infra-overhaul/04-plan.md
  - docs/features/e2e-testid-stabilization/04-plan.md
---

# Implementation Plan: Unit testing infrastructure overhaul

Restructure the Vitest unit-test infrastructure so that **server code runs in Node, components run
in jsdom, domain fixtures live in one place, and Prisma mocks become type-safe** — without changing
what is being tested. Tests stay **colocated** (`X.test.ts` next to `X.ts`); only the shared
scaffolding is centralized in `src/tests/`.

Stages 1–3 were skipped: the problem framing and direction come from a testing-infrastructure
review (summarized below). No GitHub issue exists yet.

Current pain points this plan resolves (from the review):

- **One environment for everything.** [vite.config.ts](../../../vite.config.ts) sets
  `environment: 'jsdom'` for `src/**/*.test.ts`, so ~22 pure-server suites (services, database, API
  routes, notifications, emails) boot a fake browser. `resolve.conditions: ['browser']` is applied
  globally under VITEST, so **server** tests even resolve the *browser* build of dependencies —
  exactly backwards, and it masks server/browser boundary bugs.
- **Hand-rolled Prisma mocks, untyped.** 8 suites `vi.mock('$lib/database/create_prisma_client')`
  with bespoke `makeTx()` objects of `vi.fn()`s (e.g.
  [registration-workflow.test.ts:33-64](../../../src/lib/services/registration-workflow.test.ts)),
  cast through `as any`. No type-safety; tests assert on query call shapes
  (`expect(tx.entry.create).toHaveBeenCalledWith(...)`) — change-detector tests.
- **Duplicated fixture factories.** `makeEntry` / `makeCategory` / `makeCompetition` /
  `makeEntryData` are re-declared across 10 suites with drifting shapes (the `makeEntryData` in
  [confirm.test.ts:31](../../../src/routes/(internal)/api/registrations/[id]/confirm/confirm.test.ts)
  differs from `makeEntry` in registration-workflow). N sources of truth for one domain model.
- **The framework is mocked.** 3 API-route suites `vi.mock('@sveltejs/kit')` to stub `json()`,
  asserting against a re-implementation of SvelteKit rather than a real `Response`.
- **Inlined jsdom polyfills.** [CategoryCard.test.ts:72-79](../../../src/lib/components/during-competition/CategoryCard.test.ts)
  patches `Element.prototype.animate` / `getAnimations` inline (this is now the **only** file with
  inline polyfills, but it's copy-paste fodder); manual `cleanup()` is called in **all 10** component
  suites instead of a single auto-cleanup in `afterEach`.
- **`src/tests/setup.ts` is one line** — only registers jest-dom matchers; no shared polyfills,
  cleanup, or mock registration.

> **Verified against the tree on 2026-06-16** (34 test files total). Two things changed since this
> plan was drafted: (a) the "two competing `$app/*` mock mechanisms" pain point is **resolved** — no
> suite mocks `$app/stores`/`$app/state` inline anymore; the config alias is now the sole mechanism,
> so it's dropped from the tasks below. (b) The component-suite count is **10, not 9** — the original
> rename list omitted [Header.test.ts](../../../src/lib/components/common/layout/Header.test.ts).

> **Prerequisite — now satisfied.** This plan assumed a green, CI-gated suite; that landed via
> [unit-test-ci-gate](../unit-test-ci-gate/04-plan.md) (suite green at 318/318, `unit-tests`
> workflow live). The restructure below is therefore **unblocked**, and every phase's "leaves
> `pnpm test:unit` green" requirement is now an *enforced* gate, not an aspiration.

Relevant docs: [docs/CONTRIBUTING.md](../../CONTRIBUTING.md) (testing expectations — update after
this change), [docs/ARCHITECTURE.md](../../ARCHITECTURE.md) (stack, services, data model).

## Architecture and design

Five prioritized, independently-shippable steps (**P0–P4**, see the prioritized-actions table
below), ordered by dependency then leverage. **Each step leaves `pnpm test:unit` green.** Tests
remain colocated throughout; the only file moves are the component-test renames in P0.

### Target layout (`src/tests/`)

```
src/tests/
  setup.client.ts     jest-dom matchers + WAAPI polyfills + afterEach(cleanup)   [jsdom project]
  setup.server.ts     minimal/empty for now (symmetry, future env hooks)         [node project]
  factories.ts        makeCompetition / makeCategory / makeEntry / makeEntryData (one source)
  mocks/
    prisma.ts         typed deep Prisma mock (vitest-mock-extended) + mock helper
    translations.ts   (existing) — imported via $tests alias
    app_stores.ts     (existing) — wired through config alias only
    app_environment.ts / app_navigation.ts / auth_client.ts / StubIcon.svelte  (existing)
```

### Environment split — Vitest projects by filename convention

Replace the single `test` block in [vite.config.ts](../../../vite.config.ts) with `test.projects`.
Discriminator is **filename**, not path, because route component tests
([login.test.ts](../../../src/routes/(internal)/login/login.test.ts),
[home-page.test.ts](../../../src/routes/home-page.test.ts)) sit under `src/routes/` next to API
route tests. Adopt the SvelteKit-official convention:

- **`*.svelte.test.ts` → `client` project** — `environment: 'jsdom'`, `setup.client.ts`,
  `resolve.conditions: ['browser']` scoped here only. (**10** files renamed in P0.)
- **`*.test.ts` (all others) → `server` project** — `environment: 'node'`, `setup.server.ts`,
  no browser conditions.

```ts
// vite.config.ts (sketch)
test: {
  projects: [
    { extends: true, test: { name: 'server', environment: 'node',
        include: ['src/**/*.test.ts'], exclude: ['src/**/*.svelte.test.ts'],
        setupFiles: ['src/tests/setup.server.ts'] } },
    { extends: true, test: { name: 'client', environment: 'jsdom',
        include: ['src/**/*.svelte.test.ts'],
        setupFiles: ['src/tests/setup.client.ts'] } },
  ],
}
// browser conditions move OUT of the global resolve into the client project only.
// $app/* aliases + a new $tests alias stay global (harmless for server suites).
```

`$tests` alias added to `resolve.alias` so mocks/factories import as `$tests/mocks/translations`,
`$tests/factories` — killing the `../../../tests/...` depth coupling.

### Shared factories (`src/tests/factories.ts`)

One typed module exporting `makeCompetition`, `makeCategory`, `makeEntry`, and the
API-route-shaped `makeEntryData`. Type the returns against the Prisma generated types
(`$lib/.prisma/generated/...`) where practical so model drift surfaces at compile time. Per-file
factory copies are deleted as each suite is migrated (P3).

### Typed Prisma mock (`src/tests/mocks/prisma.ts`)

Add `vitest-mock-extended`. Export a `prismaMock = mockDeep<PrismaClient>()` plus a helper that
wires `vi.mock('$lib/database/create_prisma_client', () => ({ prisma: prismaMock }))` and
`mockReset(prismaMock)` in `beforeEach`. Migrate the 8 hand-mock suites onto it; the gnarly
[registration-workflow.test.ts](../../../src/lib/services/registration-workflow.test.ts) is the
reference migration (its `$transaction` callback shape is wrapped by the helper). This removes
`makeTx()`, the `as any` casts, and gives type-safe `prismaMock.entry.create.mockResolvedValue(...)`.

> A real-test-DB integration tier (reusing the new e2e Postgres infra) for the 2–3 hairy workflow
> modules is **deferred** — see Open questions. This plan keeps the unit layer mock-based but typed.

### Drop the framework mock

Remove `vi.mock('@sveltejs/kit')` from the 3 API-route suites and let the real `json()` run (Node
20 has global `Response`). Tests switch from asserting `response.body`/`response.status` on a fake
object to `await response.json()` / `response.status` on a real `Response`. This is the only
behavioral change to assertions and is contained to those 3 files.

### Reference pair (delivered for review)

Per the request, one fully-migrated **server** suite
([registration-workflow.test.ts](../../../src/lib/services/registration-workflow.test.ts)) and one
**client** suite ([EntryRow.test.ts](../../../src/lib/components/during-competition/EntryRow.test.ts)
→ `EntryRow.svelte.test.ts`) land first as the pattern other migrations follow.

## Prioritized actions

Ordered by **dependency then leverage**. The env split (P0) is the keystone enabler — it must land
first because everything else assumes a `server`/`node` and `client`/`jsdom` project exist. After
that, the order maximises value-per-risk: type-safety (P1) before the DRY cleanup that feeds it (P2
is intentionally folded *under* the typed mock — see note), the small high-correctness framework-mock
removal (P2), then docs.

| Priority | Action | Files touched | Value | Effort | Risk | Independent of P0? |
|---|---|---|---|---|---|---|
| **P0** | Environment split + shared setup/scaffolding | `vite.config.ts`, 2 new setup files, **10** renames | **High** (fixes the backwards browser-build-for-server-code bug; enabler for all) | High | Med (10 renames + config) | — (is the enabler) |
| **P1** | Typed Prisma mock | 1 new mock module, **8** suite migrations | **High** (kills `makeTx()`, type-safety, removes ~28 casts in prisma suites) | Med | Med | Yes, but cleaner after split (these are node suites) |
| **P2** | Drop framework (`@sveltejs/kit`) mocks | **3** API-route suites | Med-High (assert a *real* `Response`) | Low | Low | Yes (quick win) |
| **P3** | Shared factories | 1 new module, **10** suite migrations | Med (one source of truth; ends fixture drift) | Med | Low | Yes |
| **P4** | Docs + verification + close-out | `CONTRIBUTING.md`, graphify, `/feature-doc` | Med (lifecycle gate) | Low | — | — |

**Overlap to sequence deliberately:** `cron/auto-cancel.test.ts` is in **both** the Prisma-mock set
(P1) and the framework-mock set (P2). Migrate it once — drop its `@sveltejs/kit` mock in the same
pass that moves it onto `prismaMock` — rather than touching it twice.

**Scope note on `as any` / `as never`:** the typed Prisma mock removes the casts in the **8
`create_prisma_client` suites** (heaviest: `category-lifecycle-autostop`, ~23). It does **not** touch
the casts in [auto-stop-scheduler.test.ts](../../../src/lib/services/auto-stop-scheduler.test.ts)
(~8), [auto-stop-webhook.test.ts](../../../src/lib/services/auto-stop-webhook.test.ts) (~2), or
[registration_notifications.test.ts](../../../src/lib/notifications/registration_notifications.test.ts)
(~9) — those mock other modules (schedulers/enums), and cleaning them is a separate follow-up, not
part of this plan.

## Tasks

### P0 — Environment split + scaffolding (enabler; no assertion changes) ✅
- [x] Add `$tests` alias and split the single `test` block into `server`/`client` `projects` in
      [vite.config.ts](../../../vite.config.ts); `conditions: ['browser']` scoped to the **client**
      project only; `$app/*` + `$tests` aliases global; `coverage`/`clearMocks`/thresholds kept at the
      shared root `test` level (both projects inherit via `extends: true`). `$tests` also added to
      `svelte.config.js` `kit.alias` so `pnpm check` resolves it.
- [x] Create [src/tests/setup.client.ts](../../../src/tests/setup.client.ts) (jest-dom matchers +
      WAAPI polyfills lifted out of CategoryCard + `afterEach(cleanup)`) and
      [src/tests/setup.server.ts](../../../src/tests/setup.server.ts) (minimal). Deleted the one-line
      `src/tests/setup.ts`.
- [x] Renamed the **10** component suites to `*.svelte.test.ts` (incl. `Header`), deleted redundant
      manual `cleanup()`, lifted CategoryCard's inline polyfills, and dropped the now-redundant inline
      `vi.mock('$app/stores'|'$app/navigation')` (config alias covers them; `Header`'s `$app/state`
      mock is kept — not aliased).
- [x] Repointed mock/factory imports to the `$tests` alias.
- [x] Reference pair landed: server `registration-workflow.test.ts` (already `create_prisma_client`
      based) and client `EntryRow.svelte.test.ts`.
- [x] `pnpm test:unit` (server 23f/208t, client 11f/110t) + `pnpm check` (0 errors) green.

### P1 — Typed Prisma mock ✅
- [x] Added `vitest-mock-extended`; created [src/tests/mocks/prisma.ts](../../../src/tests/mocks/prisma.ts)
      exporting `prismaMock = mockDeep<PrismaClient>()`, a module-scoped `beforeEach(mockReset)`, a
      `mockPrismaTransaction()` helper for the interactive `$transaction` callback, and a `mockFn()`
      helper that narrows a deep-mocked method to vitest's `Mock` so partial fixtures type-check
      (method NAME stays validated; full payload typing is P3's job). Overloaded methods
      (`groupBy`/`aggregate`) use `vi.mocked(...)`.
- [x] Migrated [registration-workflow.test.ts](../../../src/lib/services/registration-workflow.test.ts):
      `makeTx()` now exposes the deep mock's methods (same test API), `$transaction` driven by the
      same mock; removed the hand-rolled `vi.fn()` tx and `vi.clearAllMocks()`.
- [x] Migrated the other **7** `create_prisma_client` suites onto `prismaMock` (green after each):
      [db_competition_categories](../../../src/lib/database/db_competition_categories.test.ts),
      [db_competition_other_upcoming](../../../src/lib/database/db_competition_other_upcoming.test.ts),
      [dispatcher](../../../src/lib/notifications/dispatcher.test.ts),
      [auto-cancel (service)](../../../src/lib/services/auto-cancel.test.ts),
      [category-lifecycle-autostop](../../../src/lib/services/category-lifecycle-autostop.test.ts),
      [competition-access](../../../src/lib/services/competition-access.test.ts),
      [cron/auto-cancel](../../../src/routes/(internal)/api/cron/auto-cancel/auto-cancel.test.ts)
      *(do P2's framework-mock removal in this same pass — see overlap note)*.

### P2 — Drop framework mocks ✅
- [x] Removed `vi.mock('@sveltejs/kit')` from all 3 API-route suites; assertions now read a real
      `Response` (`await response.json()` + `response.status`):
      [confirm](../../../src/routes/(internal)/api/registrations/[id]/confirm/confirm.test.ts),
      [refuse](../../../src/routes/(internal)/api/registrations/[id]/refuse/refuse.test.ts),
      [cron/auto-cancel](../../../src/routes/(internal)/api/cron/auto-cancel/auto-cancel.test.ts)
      (the last migrated in the same pass as its P1 Prisma migration).

### P3 — Shared factories ✅
- [x] Created [src/tests/factories.ts](../../../src/tests/factories.ts) with the two genuinely
      **duplicated** shapes: `makeEntryData` (entry + participants + category→competition relation)
      and `makeUpcomingCompetition` (discovery competition shape).
- [x] Migrated the **5** consumers of those shapes onto `$tests/factories` (green after each):
      `makeEntryData` →
      [confirm](../../../src/routes/(internal)/api/registrations/[id]/confirm/confirm.test.ts),
      [refuse](../../../src/routes/(internal)/api/registrations/[id]/refuse/refuse.test.ts),
      [registration_notifications](../../../src/lib/notifications/registration_notifications.test.ts);
      `makeUpcomingCompetition` →
      [db_competition_other_upcoming](../../../src/lib/database/db_competition_other_upcoming.test.ts),
      [other-upcoming (api)](../../../src/routes/(internal)/api/competitions/other-upcoming/other-upcoming.test.ts).

> **Scope correction (verified against the tree):** the plan assumed `makeCompetition`/`makeCategory`/
> `makeEntry` were re-declared across ~10 suites. In reality only the two shapes above were *truly
> duplicated*. The remaining local factories are **single-use with divergent, test-meaningful
> shapes**: the component-render `makeCategory` in
> [CategoryCard](../../../src/lib/components/during-competition/CategoryCard.svelte.test.ts) and
> [CategoryCapacityRow](../../../src/lib/components/competition/CategoryCapacityRow.svelte.test.ts),
> the presentation `makeCompetition` in
> [home-page](../../../src/routes/home-page.svelte.test.ts), the auto-cancel `makeCompetition`
> ([auto-cancel](../../../src/lib/services/auto-cancel.test.ts)), and the registration-workflow domain
> trio ([registration-workflow](../../../src/lib/services/registration-workflow.test.ts)). Each has a
> single consumer; centralising them would add coupling without removing duplication (CLAUDE.md
> simplicity), so they stay colocated.

### P4 — Docs, verification, close-out ✅
- [x] Updated [docs/CONTRIBUTING.md](../../CONTRIBUTING.md) with a "Unit test conventions" section:
      the `*.svelte.test.ts` = jsdom split, `$tests/*` scaffolding, the typed `prismaMock`, global
      `$app/*` aliasing, real-`Response` assertions, and global `clearMocks`.
- [x] **Verified:** `pnpm test:unit` 318/318 across both projects (server 23f/208t, client 11f/110t),
      `pnpm check` 0 errors, `pnpm test:unit:coverage` above the
      [ci-gate](../unit-test-ci-gate/04-plan.md) floor (Stmts 21.02 / Branch 22.96 / Funcs 19.2 /
      Lines 21.47).
- [x] Ran `graphify update .` to refresh the knowledge graph.
- [x] **Run `/feature-doc` (Stage 5)** → [05-workflow.md](./05-workflow.md).

## Open questions — resolved (2026-06-16)

1. **Real-DB integration tier?** → **No — the typed mock is enough for now.** The unit layer stays
   mock-based; no `*.integration.test.ts` tier against Postgres in this plan.
2. **File-naming convention?** → **Adopt `*.svelte.test.ts` for jsdom** (matches SvelteKit docs,
   survives file moves). This is the discriminator the P0 env split uses.
3. **Enable Vitest `globals: true`?** → **No (keep the default).** Keep explicit `vitest` imports and
   put `afterEach(cleanup)` in `setup.client.ts`. Captured as a **follow-up task** (see below), not
   done in this plan.

## Follow-up tasks (out of scope here)

- **`globals: true`** sweep — auto-register cleanup and drop per-file `vitest` imports across all
  suites (deferred per Q3).
- **Remaining `as any` / `as never` casts** not covered by the typed Prisma mock:
  [auto-stop-scheduler.test.ts](../../../src/lib/services/auto-stop-scheduler.test.ts) (~8),
  [auto-stop-webhook.test.ts](../../../src/lib/services/auto-stop-webhook.test.ts) (~2),
  [registration_notifications.test.ts](../../../src/lib/notifications/registration_notifications.test.ts) (~9).
