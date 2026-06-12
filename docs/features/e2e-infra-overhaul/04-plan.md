---
slug: e2e-infra-overhaul
stage: plan
feature: E2E testing infrastructure overhaul — role fixtures, data isolation, real parallelism
issue: null
status: approved
created: 2026-06-12
updated: 2026-06-12
related: []
---

# Implementation Plan: E2E testing infrastructure overhaul

Restructure the Playwright e2e infrastructure so that **roles become fixtures, test data becomes
per-suite-unique, and parallelism falls out for free** — while keeping (and strengthening) the
ability to test multi-actor role-based workflows (participant registers → organizer confirms).

Stages 1–3 were skipped: the problem framing and design direction come from an infrastructure
review (this plan's intro summarizes it). No GitHub issue exists yet.

Current pain points this plan resolves:

- `fullyParallel: true` in [playwright.config.ts](../../../playwright.config.ts) is defeated by
  9 of 11 test files forcing `mode: 'serial'` and CI `workers: 1`; root cause is three shared
  mutable bootstrap users + cleanup-by-name in one shared DB (admitted at
  `playwright.config.ts:74-80`).
- [e2e/fixtures.ts](../../../e2e/fixtures.ts) defines no Playwright fixtures; 23
  `browser.newContext({ storageState: 'playwright/.auth/…' })` call sites across 13 files
  hand-roll multi-role contexts with ~20 lines of beforeAll/afterAll boilerplate each.
- Roles are assigned by filename regex (`testMatch: /.*\/participant\.test\.ts/`), but
  multi-actor tests override the project identity manually — two competing role systems.
- Cleanup deletes competitions by hard-coded name arrays addressed by magic index
  ([e2e/registration/seed-helpers.ts](../../../e2e/registration/seed-helpers.ts:97-116));
  restore scripts run through the seed contract (`runSeed(…, { seedFile: 'restore-*.ts' })`).
- 24 `networkidle` waits and an `expect(...).toPass()` click-retry hack
  ([e2e/registration/participant.test.ts:164](../../../e2e/registration/participant.test.ts))
  stand in for a Svelte hydration signal; 88 inline magic timeouts.
- Selectors coupled to Skeleton CSS classes (`.preset-filled-error-500`,
  `input.input[placeholder*="Search"]`).
- [e2e/global-setup.ts](../../../e2e/global-setup.ts) (~280 lines) hand-rolls process
  management (lsof/SIGKILL, PID state file, detached spawn) that Playwright's `webServer`
  provides.

Relevant docs: [docs/CONTRIBUTING.md](../../CONTRIBUTING.md) (testing expectations — update after
this change), [docs/ARCHITECTURE.md](../../ARCHITECTURE.md) (auth/roles).

## Architecture and design

Three independently-shippable phases, ordered by leverage. Each phase leaves the suite green.

### Phase 1 — Hydration signal + real fixtures + central timeouts (enabler)

**Hydration marker.** Add `onMount(() => { document.body.dataset.hydrated = 'true' })` to the
root [src/routes/+layout.svelte](../../../src/routes/+layout.svelte) (only `import { onMount }`
and one statement — no behavior change for users). Add `gotoHydrated(page, url)` to
`e2e/utils/navigation.ts`: `goto(url)` + `waitForSelector('body[data-hydrated]')`. Replace all
24 `networkidle` waits (tests, [e2e/utils/auth.ts](../../../e2e/utils/auth.ts), the three
`e2e/setup/auth-*.setup.ts` files, [e2e/registration/helpers.ts](../../../e2e/registration/helpers.ts))
and delete the `toPass` click-retry hack.

**Role fixtures.** Rewrite [e2e/fixtures.ts](../../../e2e/fixtures.ts) to actually extend `test`:

```ts
export const test = base.extend<{
    participantPage: Page;  // lazily-created context from AUTH_FILES.participant, auto-closed
    organizerPage: Page;
    adminPage: Page;
    actor: (creds: { email: string; password: string }) => Promise<Page>; // suite-seeded users
}>({ /* … */ });
```

- One `AUTH_FILES` map replaces the 13 files' literal `'playwright/.auth/…'` strings.
- `actor()` wraps the existing [loginAndSaveState](../../../e2e/utils/auth.ts) flow for
  suite-private seeded users (used today by onboarding and profile suites), caching per worker.
- `runSeed` stays as-is (the co-located-seed contract is good); it just lives next to real
  fixtures now.
- Refactor all 23 manual `newContext` sites to fixture parameters. Multi-actor tests become
  `async ({ participantPage, organizerPage }) => { … }`.

**Central timeouts.** Add `expect: { timeout: 10_000 }` to the config; delete the 88 inline
timeouts except those that document a real constraint (the 60s cold-start login wait).

### Phase 2 — Data isolation → actual parallelism

**Run-unique data.** `createSeedContext` ([e2e/seed_utils/database_seed_context.ts](../../../e2e/seed_utils/database_seed_context.ts))
gains a `runId` (e.g. `Date.now().toString(36)`); `createCompetition` suffixes names with it.
Tests never look up data by name (seeds already return IDs), so no test logic changes — only
assertions that assert exact competition names, if any, switch to the returned value.

**Per-suite users.** New seed step `createAuthUser(ctx, input)` in `e2e/seed_utils/steps/`,
reusing the better-auth `auth.api.signUpEmail` pattern from
[scripts/db_migration/action_seed_local_users.ts](../../../scripts/db_migration/action_seed_local_users.ts)
(extract the betterAuth-instance construction into a small shared helper so password hashing and
account rows stay consistent). Suites that mutate user or competition state seed their own users
with `runId`-unique emails and authenticate via the `actor()` fixture. The three bootstrap users
remain only for the auth smoke tests and the `setup_*` storage-state projects.

**Delete the restore layer.** With unique names/users and the global-setup TRUNCATE between
runs, suites cannot see each other's data. Remove `restore-participant.ts`,
`restore-organizer.ts`, `competition/restore*.ts`, `restoreCompetitions`, the
`*_COMPETITION_NAMES` constants, and all `afterAll` restore calls; drop the `seedFile`-override
restore idiom.

**Real parallelism.** Convert genuine user journeys (onboarding chains in
[e2e/onboarding/participant.test.ts](../../../e2e/onboarding/participant.test.ts),
register-then-confirm flows in registration suites) into single tests using `test.step()` —
honest representation, correct retries, readable reports. Remove `mode: 'serial'` where tests
are actually independent. Raise CI `workers` to 2–4.

### Phase 3 — Structural cleanup

**One auth setup.** Collapse the three near-identical `e2e/setup/auth-*.setup.ts` files into one
`auth.setup.ts` that loops the three roles; one `setup` project replaces three.

**Projects by capability.** One `chromium` project matching all `*.test.ts` (identity now comes
from fixtures, not filename regexes); keep the firefox/webkit/mobile smoke projects, which may
widen now that data races are gone.

**`webServer` migration.** Slim global-setup keeps only DB prep (localhost guard, TRUNCATE,
`prisma db push`, bootstrap-user seed). The `webServer` config block owns build/serve/reuse with
`reuseExistingServer: !process.env.CI`; the build-hash caching from
[e2e/global-setup.ts:84-102](../../../e2e/global-setup.ts) moves into the `webServer` command
script (`scripts/e2e-server.ts`) if rebuild cost still warrants it. Delete the PID state file,
lsof/SIGKILL helpers, and [e2e/global-teardown.ts](../../../e2e/global-teardown.ts).

**Selector hygiene.** Add `data-testid` to the participant-search input, queued-slot remove
button, and confirm/success affordances in the registration Svelte components; replace the CSS
class selectors. Add `eslint-plugin-playwright` to keep them from coming back.

## Tasks

Phase 1 — enabler
- [x] Add hydration marker to root `+layout.svelte` (`data-hydrated` on `<body>` via `$effect`,
      matching the file's existing rune style)
- [x] Add `gotoHydrated` helper; replace all `networkidle` waits and the `toPass` click-retry hack
- [x] Rewrite `e2e/fixtures.ts` with `participantPage` / `organizerPage` / `adminPage` / `actor`
      fixtures and the single `AUTH_FILES` map
- [x] Refactor all 23 manual `browser.newContext` sites to fixture parameters (done jointly with
      the journey conversion — serial chains shared page state, so the two changes are one move)
- [x] Centralize `expect.timeout` in `playwright.config.ts`; remove inline timeouts (kept: 60s
      cold-start login, 15s Ably real-time sync, 2s payment-popover branch probe)
- [ ] Run full suite (`npx playwright test`) — green gate for Phase 1

Phase 2 — isolation and parallelism
- [x] Add `runId` to `createSeedContext`; suffix competition names in `createCompetition`
- [x] Add `createAuthUser` seed step (better-auth `signUpEmail`, runId-unique emails); onboarding,
      profile, and not-creator seeds now use it instead of hand-rolled betterAuth instances
- [x] Migrate state-mutating suites to suite-private users via `actor()`
- [x] Delete restore scripts, `restoreCompetitions`, name-constant arrays, and `afterAll` restores
- [x] Convert journey chains (onboarding, register-then-confirm, during-competition) to single
      tests with `test.step()`
- [ ] Remove unnecessary `mode: 'serial'`; raise CI `workers`; run suite repeatedly
      (`--repeat-each=2`, varying workers) — green gate for Phase 2 (serial removed and
      workers raised; repeat-run verification pending)

Phase 3 — structure
- [x] Collapse three auth setup files/projects into one `auth.setup.ts` + one `setup` project
- [x] Merge role-regex projects into one `chromium` functional project; keep smoke projects
- [x] Migrate server lifecycle to `webServer` (+ `scripts/e2e-server.ts` with build-hash cache);
      global-setup now only wires env + localhost guard; global-teardown and PID/lsof machinery
      deleted
- [x] Add `data-testid` to search input (`participant-search-input`), queued-slot remove
      (`remove-queued-slot`), and result banner (`action-result-success|error`); replaced
      CSS-class selectors. **Deviation:** `eslint-plugin-playwright` skipped — the repo has no
      ESLint setup at all; introducing the whole toolchain for one rule contradicts the
      simplicity rule. Convention documented in CONTRIBUTING instead.
- [x] Update `docs/CONTRIBUTING.md` testing section to describe the new conventions
      (fixtures, seeds, no restores, journey tests)
- [ ] Manual verification: `/verify` — full suite green locally at `workers=4`, plus one
      multi-actor flow traced end-to-end
- [ ] Run `graphify update .`
- [ ] Close-out: run `/feature-doc` once merged (Stage 5 — `05-workflow.md`)

## Open questions

1. **Where does CI run?** `workers: 1` + `retries: 2` suggests a constrained runner. What's the
   target worker count for CI after Phase 2 (2 or 4), and is there a CI config to update outside
   this repo?
2. **Keep the build-hash cache?** `webServer` with `reuseExistingServer` covers the warm-server
   workflow but rebuilds when the server is down. Is the `npm run build` cost (~tens of seconds?)
   worth keeping the custom hash-skip logic in `scripts/e2e-server.ts`, or should we accept
   rebuilds for simplicity?
3. **Journey-test granularity.** Folding serial chains into single `test.step()` tests changes
   report granularity (one row per journey instead of per step). Acceptable, or keep serial
   describes for the longest chains (onboarding happy path is 9 steps)?
