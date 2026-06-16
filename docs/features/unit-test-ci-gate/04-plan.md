---
slug: unit-test-ci-gate
stage: plan
feature: Unit test health & CI gate — green suite, enforced on PRs, with coverage and a static gate
issue: null
status: draft
created: 2026-06-15
updated: 2026-06-15
related:
  - docs/features/unit-test-ci-gate/05-workflow.md
  - docs/features/unit-test-infra/04-plan.md
---

# Implementation Plan: Unit test health & CI gate

Make the Vitest **unit** layer trustworthy and *enforced*: get the suite green, keep it green
automatically on every PR, measure coverage, and add a static (lint/typecheck) gate. **Scope is unit
testing only — e2e / Playwright is explicitly out of scope** and untouched here.

Stages 1–3 were skipped: the problem framing and direction come directly from a testing-infrastructure
review (the "roast"). No GitHub issue exists yet.

## Relationship to the sibling plan (no duplication)

[docs/features/unit-test-infra/04-plan.md](../unit-test-infra/04-plan.md) already owns the **internal
restructuring** of the unit suite — the jsdom→node environment split (audit item 7), shared
factories, and typed Prisma mocks that remove the `as never` / `as any` casts (audit item 6). That
plan **assumes the suite is already green and run regularly** — neither is true today.

This plan owns the **health & enforcement** layer the sibling plan depends on but does not cover:

| Audit finding | Owner |
|---|---|
| 1. Suite is **red** on a clean branch (7 failures) | **this plan** (Phase 0) |
| 2. **No CI** runs unit tests | **this plan** (Phase 3) |
| 3. **No coverage** tooling / thresholds | **this plan** (Phase 2) |
| 4. **No lint/format** gate (only commitlint) | **this plan** (Phase 4) |
| 5. Inconsistent mock cleanup / no global reset | **this plan** (Phase 1) |
| 6. Cast-heavy `as never` / `as any` in tests | sibling: `unit-test-infra` (Phase 3) |
| 7. jsdom + browser conditions for server suites | sibling: `unit-test-infra` (Phase 1) |

**Ordering across the two plans:** land **this plan's Phase 0–3 first**. A green suite gated by CI is
the safety net that makes the sibling restructure ("each phase leaves `pnpm test:unit` green") an
*enforced* guarantee rather than an aspiration. The restructure should follow once CI is live.

Relevant docs: [docs/CONTRIBUTING.md](../../CONTRIBUTING.md) (testing expectations — update in Phase 5),
[docs/ARCHITECTURE.md](../../ARCHITECTURE.md) (deployment / Vercel / Node 20).

## Architecture and design

Five phases ordered by dependency. The keystone is **Phase 3 (CI)** — everything before it makes the
suite worth gating; everything after rides on the gate.

### Phase 0 — Make the suite green (prerequisite)

Three suites rotted after refactors changed source without updating tests. Root causes confirmed
against current code; each fix is a **test-side** reconciliation (no production code changes):

- **[login.test.ts](../../../src/routes/(internal)/login/login.test.ts)** — `+page.svelte` now maps
  `error.code` through `getAuthErrorKey()`
  ([+page.svelte:97-104](../../../src/routes/(internal)/login/+page.svelte)) to an i18n key, but the
  shared mock [auth_client.ts](../../../src/tests/mocks/auth_client.ts) returns
  `{ error: { message: 'Invalid credentials' } }` with **no `code`**, so the component renders the
  fallback `auth.errors.unexpected`. Fix: give the mock's `signIn.email` rejection a
  `code: 'INVALID_EMAIL_OR_PASSWORD'`, and assert the rendered text is `auth.errors.invalid_credentials`
  (the translations mock is an identity function, so the key *is* the text). Verify the shared mock
  change doesn't disturb other suites that import it.
- **[send_password_reset_email.test.ts](../../../src/lib/emails/send_password_reset_email.test.ts)** —
  the source signature drifted: the 3rd argument is now `providerIds: string[]`
  ([send_password_reset_email.ts:84-92](../../../src/lib/emails/send_password_reset_email.ts)), not a
  boolean, and the notice wording changed to `"...is linked to ${providerNames}"`. Fix the
  "social provider notice" test to pass e.g. `['google']` and match the current wording (e.g.
  `is linked to`). Re-reconcile the "Resend throws → returns failure" assertion against the current
  return shape / `console.error` prefix while in the file.
- **[CategoryCapacityRow.test.ts](../../../src/lib/components/competition/CategoryCapacityRow.test.ts)** —
  the component no longer emits `title="registration.status_*"` indicators nor a
  `competition_card.registered_count` text node (markup refactor; current titles are
  `categoryStatusVisual.labelKey` and `competition_card.capacity_title`). Fix the 4 failing
  assertions to query the markup the component renders today, preserving each test's intent (capped
  bar vs. plain count, registered indicator present/absent).

Exit: `pnpm test:unit` exits 0 locally (34 files / 318 tests green).

### Phase 1 — Mock-reset hygiene (global, in config)

Set `test.clearMocks: true` in [vite.config.ts](../../../vite.config.ts) so call history is cleared
between every test — removing the need for the per-file `vi.clearAllMocks()` that only 15 of 34
suites remember. **Deliberately do not** set `mockReset` / `restoreMocks`: those reset mock
*implementations*, which would wipe the `mockResolvedValue` defaults defined inside `vi.mock`
factories (e.g. [auth_client.ts](../../../src/tests/mocks/auth_client.ts)) and break suites that rely
on them. After enabling, optionally drop now-redundant `vi.clearAllMocks()` calls (cosmetic; can be
deferred). Re-run the suite to confirm no order-dependence was being masked.

### Phase 2 — Coverage tooling + ratchet baseline

Add `@vitest/coverage-v8` (devDependency) and a `test.coverage` block: `provider: 'v8'`,
`reporter: ['text', 'html', 'lcov']`, `include: ['src/**']`, and sensible `exclude` (test files,
`src/tests/**`, generated Prisma, `*.svelte` markup-only, type-only files). Add a
`test:unit:coverage` script (`vitest run --coverage`).

Set **thresholds to the current measured floor**, not an aspirational 80% — measure once, set
`thresholds` (lines/functions/statements/branches) a point or two below measured so CI fails only on
*regression*. Ratcheting upward is a follow-up, not this plan. The point is to stop the bleed, not
to retro-fit coverage.

### Phase 3 — CI workflow (the keystone)

Add `.github/workflows/unit-tests.yaml`, separate from the release workflow
([github-release.yaml](../../../.github/workflows/github-release.yaml)). Triggers: `pull_request`
(into `main` and `test`) and `push` to `test` / `main`. Single Ubuntu job, Node 20 + pnpm (matching
[CONTRIBUTING.md](../../CONTRIBUTING.md) and adapter-vercel), with pnpm-store caching:

1. `pnpm install --frozen-lockfile` (its `postinstall` runs `svelte-kit sync && prisma generate`,
   which the type-check needs).
2. `pnpm check` — `svelte-check` (typecheck/gate).
3. `pnpm test:unit:coverage` — Vitest with coverage thresholds.

No Postgres service is needed: the unit layer is fully mocked, so CI stays fast (single job, seconds
not minutes). **Branch protection** that *requires* this check is a GitHub repo setting, not a file —
called out as a manual step (and an open question on which branches to protect).

> Risk: `svelte-kit sync` / `svelte-check` may need a `.env` for `$env/static/private` declarations.
> If `pnpm check` fails in CI for missing env, add a CI-only `.env` seeded from `.env.example` with
> dummy values (no secrets) before the check step.

### Phase 4 — Static lint/format gate

Today the only gate is the commitlint `commit-msg` hook — nothing checks code style or formatting.
Add a lightweight `format`/`lint` check (Prettier `--check` over `src/`, plus the existing
`svelte-check`) wired as a step in the Phase 3 workflow. Confirm Prettier is already a transitive dep
(`prettier-plugin-svelte` is conventional in SvelteKit repos) before adding scripts; add it as a
devDependency if missing. A full **ESLint flat-config** is a larger lift and is deferred to an open
question rather than bundled here (simplicity per CLAUDE.md).

### Phase 5 — Docs, verification, close-out

Update [CONTRIBUTING.md](../../CONTRIBUTING.md): how to run unit tests + coverage, what the PR gate
runs, and the "green-before-merge" expectation. Document the branch-protection setting. Then verify,
refresh graphify, and run `/feature-doc`.

## Tasks

### Phase 0 — Green the suite (prerequisite; test-only changes)
- [x] Fix [login.test.ts](../../../src/routes/(internal)/login/login.test.ts): add `code` to the
      [auth_client mock](../../../src/tests/mocks/auth_client.ts) rejection and assert
      `auth.errors.invalid_credentials`; confirm no other importer of the mock regresses.
- [x] Fix [send_password_reset_email.test.ts](../../../src/lib/emails/send_password_reset_email.test.ts):
      pass `providerIds: string[]` and match current notice wording; reconcile the "Resend throws"
      assertion against the current return shape / log prefix.
- [x] Fix the 4 failing assertions in
      [CategoryCapacityRow.test.ts](../../../src/lib/components/competition/CategoryCapacityRow.test.ts)
      against the component's current markup, preserving each test's intent.
- [x] `pnpm test:unit` green locally (318/318).

### Phase 1 — Mock hygiene
- [x] Set `test.clearMocks: true` in [vite.config.ts](../../../vite.config.ts) (leave
      `mockReset`/`restoreMocks` off); re-run suite to confirm no masked order-dependence.
- [ ] (Optional) remove now-redundant per-file `vi.clearAllMocks()` calls. (deferred — cosmetic)

### Phase 2 — Coverage
- [x] Add `@vitest/coverage-v8`; configure `test.coverage` (v8, text/html/lcov, include/exclude);
      add `test:unit:coverage` script.
- [x] Measure current coverage; set `thresholds` to the measured floor (regression-only gate).

### Phase 3 — CI gate (keystone)
- [x] Add `.github/workflows/unit-tests.yaml`: Node 20 + pnpm (cached), `frozen-lockfile` install,
      `pnpm check`, `pnpm test:unit:coverage`; triggers on PRs to `main`/`test` and pushes to those.
- [x] If `pnpm check` needs env, seed a dummy CI `.env` (workflow seeds dummy `$env/static/*`; no secrets).
- [ ] Confirm a PR runs the workflow and a deliberate red test fails the check. (requires an actual PR)
- [ ] **Manual:** enable branch protection requiring this check (document, can't be done in code).

### Phase 4 — Static gate
- [x] Add `format`/`format:check` scripts (Prettier over `src/`); Prettier already a devDep
      (`prettier` + `prettier-plugin-svelte`). Added `.prettierrc` + `.prettierignore`.
- [x] Add the format step to `unit-tests.yaml` (changed-`.ts`/`.js`-files-only on PRs).

### Phase 5 — Docs, verification, close-out
- [x] Update [CONTRIBUTING.md](../../CONTRIBUTING.md): running unit tests + coverage, the PR gate,
      green-before-merge, branch-protection note.
- [x] **Verify:** `pnpm check` + `pnpm test:unit:coverage` green locally (318/318, 0 type errors,
      coverage above floor). CI green on a scratch PR still pending the first PR.
- [x] Run `graphify update .` to refresh the knowledge graph.
- [x] **Run `/feature-doc` (Stage 5)** to produce [05-workflow.md](./05-workflow.md).

## Open questions

1. **Plan boundary** — keep this as a sibling plan to `unit-test-infra` (health/enforcement vs.
   restructuring, as written), or fold these phases into that plan as a "Phase 0 + gating" prefix?
   Default: keep separate; land this first.
2. **Coverage strictness** — regression-only floor at the current measured number (recommended,
   low-friction), or commit to a target (e.g. 70/80%) and backfill tests to reach it as part of this
   work?
3. **Lint depth** — Prettier `--check` + `svelte-check` only (recommended for this plan), or stand up
   a full ESLint flat-config (typescript-eslint + eslint-plugin-svelte) as a follow-up feature?
