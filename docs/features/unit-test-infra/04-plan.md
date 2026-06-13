---
slug: unit-test-infra
stage: plan
feature: Unit testing infrastructure overhaul — env split, shared factories, typed Prisma mocks
issue: null
status: draft
created: 2026-06-13
updated: 2026-06-13
related:
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
- **Two competing `$app/*` mock mechanisms.** [vite.config.ts:23-27](../../../vite.config.ts)
  aliases `$app/navigation|environment|stores`, yet component suites *also*
  `vi.mock('$app/stores', …)` via fragile `../../../tests/mocks/...` relative imports.
- **Inlined jsdom polyfills.** [CategoryCard.test.ts:72-79](../../../src/lib/components/during-competition/CategoryCard.test.ts)
  patches `Element.prototype.animate` / `getAnimations` inline (copy-paste fodder); manual
  `cleanup()` in `beforeEach` instead of auto-cleanup in `afterEach`.
- **`src/tests/setup.ts` is one line** — only registers jest-dom matchers; no shared polyfills,
  cleanup, or mock registration.

Relevant docs: [docs/CONTRIBUTING.md](../../CONTRIBUTING.md) (testing expectations — update after
this change), [docs/ARCHITECTURE.md](../../ARCHITECTURE.md) (stack, services, data model).

## Architecture and design

Five independently-shippable phases, ordered by leverage. **Each phase leaves `pnpm test:unit`
green.** Tests remain colocated throughout; the only file moves are the component-test renames in
Phase 1.

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
  `resolve.conditions: ['browser']` scoped here only. (9 files renamed in Phase 1.)
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
factory copies are deleted as each suite is migrated (Phase 2).

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

## Tasks

### Phase 1 — Environment split + scaffolding (enabler; no assertion changes)
- [ ] Add `$tests` alias and split `test` into `server`/`client` `projects` in
      [vite.config.ts](../../../vite.config.ts); scope `conditions: ['browser']` to the client
      project; keep `$app/*` aliases global.
- [ ] Create `src/tests/setup.client.ts` (jest-dom matchers, WAAPI polyfills moved out of
      CategoryCard, `afterEach(cleanup)`) and `src/tests/setup.server.ts` (minimal). Delete the
      one-line `src/tests/setup.ts`.
- [ ] Rename the 9 component suites to `*.svelte.test.ts` (`DrawerNav`, `CategoryCapacityRow`,
      `CategoryCard`, `EntryActionButton`, `EntryList`, `EntryRow`, `OverflowMenu`, `login`,
      `home-page`); remove their inline `vi.mock('$app/stores', …)` and inline polyfills/`cleanup()`
      now covered by config alias + setup.
- [ ] Repoint mock imports to the `$tests` alias; run `pnpm test:unit` — both projects green.

### Phase 2 — Shared factories
- [ ] Create `src/tests/factories.ts` (`makeCompetition/Category/Entry/EntryData`, typed).
- [ ] Migrate the 10 suites with local factories onto `$tests/factories`; delete the per-file
      copies. Green after each.

### Phase 3 — Typed Prisma mock
- [ ] Add `vitest-mock-extended` (devDependency); create `src/tests/mocks/prisma.ts`.
- [ ] Migrate [registration-workflow.test.ts](../../../src/lib/services/registration-workflow.test.ts)
      as the reference (remove `makeTx()`), then the other 7 hand-mock suites.

### Phase 4 — Drop framework mocks
- [ ] Remove `vi.mock('@sveltejs/kit')` from the 3 API-route suites
      ([confirm](../../../src/routes/(internal)/api/registrations/[id]/confirm/confirm.test.ts),
      [refuse](../../../src/routes/(internal)/api/registrations/[id]/refuse/refuse.test.ts),
      [auto-cancel](../../../src/routes/(internal)/api/cron/auto-cancel/auto-cancel.test.ts)); adjust
      assertions to read the real `Response`.

### Phase 5 — Docs, verification, close-out
- [ ] Update [docs/CONTRIBUTING.md](../../CONTRIBUTING.md) testing section: env-split convention
      (`*.svelte.test.ts` = jsdom), where fixtures/mocks live, how to mock Prisma.
- [ ] **Verify:** run `pnpm test:unit` (and `pnpm check`) — full suite green across both projects;
      spot-run the reference pair in isolation.
- [ ] Run `graphify update .` to refresh the knowledge graph.
- [ ] **Run `/feature-doc` (Stage 5)** once merged to produce `05-workflow.md`.

## Open questions

1. **Real-DB integration tier?** Should the hairy workflow modules (waitlist promotion in
   `registration-workflow`, `auto-cancel`) get a `*.integration.test.ts` tier against the e2e
   Postgres DB, or is the typed mock enough for now? (Deferred by default — heavier, slower.)
2. **File-naming convention** — adopt `*.svelte.test.ts` for jsdom (recommended; matches SvelteKit
   docs and survives file moves), or keep `*.test.ts` everywhere and split by include-glob (more
   config, breaks when a component test moves under `src/routes`)?
3. **Enable Vitest `globals: true`?** Would let `@testing-library/svelte` auto-register cleanup and
   drop per-file `vitest` imports, but touches every file's import line. Default: **no** — keep
   explicit imports, put `afterEach(cleanup)` in `setup.client.ts`.
