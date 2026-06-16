---
slug: unit-test-ci-gate
stage: workflow
feature: Unit test health & CI gate — green suite, enforced on PRs, with coverage and a static gate
issue: null
status: implemented
created: 2026-06-16
updated: 2026-06-16
related:
  - docs/features/unit-test-ci-gate/04-plan.md
  - docs/features/unit-test-infra/04-plan.md
---

# Workflow: Unit test health & CI gate

How the shipped unit-test gate behaves today. This is **infrastructure**, not a user-facing
feature, so it has no route, UI, or persisted state — the "state machine" is the CI job's
pass/fail outcome and the local developer commands that mirror it. Scope is the **Vitest unit
layer only**; e2e / Playwright is deliberately untouched.

Source of truth is the merged code, not the plan. Where this doc and
[04-plan.md](./04-plan.md) disagree, the code below wins.

## Source files inspected

- [vite.config.ts](../../../vite.config.ts) — Vitest config: `clearMocks`, coverage block,
  regression-only thresholds, `$app/*` aliases.
- [package.json](../../../package.json) — `test:unit`, `test:unit:coverage`, `format`,
  `format:check`, `check` scripts; `@vitest/coverage-v8`, `prettier`, `prettier-plugin-svelte`
  devDeps.
- [.github/workflows/unit-tests.yaml](../../../.github/workflows/unit-tests.yaml) — the CI job.
- [.prettierrc](../../../.prettierrc) / [.prettierignore](../../../.prettierignore) — format
  config and exclusions.
- [.gitignore](../../../.gitignore) — ignores `/coverage`.
- [docs/CONTRIBUTING.md](../../CONTRIBUTING.md) — the documented developer contract.
- Phase-0 test reconciliations:
  [src/tests/mocks/auth_client.ts](../../../src/tests/mocks/auth_client.ts),
  [src/routes/(internal)/login/login.test.ts](../../../src/routes/(internal)/login/login.test.ts),
  [src/lib/emails/send_password_reset_email.test.ts](../../../src/lib/emails/send_password_reset_email.test.ts),
  [src/lib/components/competition/CategoryCapacityRow.test.ts](../../../src/lib/components/competition/CategoryCapacityRow.test.ts).

## What shipped

A green, enforced unit layer with four moving parts:

1. **Green suite** — 34 files / 318 tests pass on a clean checkout (Phase 0 reconciled three rotted
   suites; test-side only, no production code changed).
2. **Global mock hygiene** — `clearMocks: true` clears call history between every test
   ([vite.config.ts:27](../../../vite.config.ts)); no per-file `vi.clearAllMocks()` needed.
3. **Coverage with a regression-only floor** — v8 provider, `text`/`html`/`lcov` reporters,
   thresholds pinned a couple points below the measured baseline.
4. **CI gate** — `unit-tests` workflow runs type-check + format (changed files) + coverage'd tests
   on PRs into `main`/`test` and pushes to those branches.

## Commands (the developer-facing surface)

| Command | What it runs | Mirrors CI step |
|---|---|---|
| `pnpm test:unit` | `vitest run` — the suite, no coverage | — |
| `pnpm test:unit:coverage` | `vitest run --coverage` — suite + thresholds | "Unit tests with coverage" |
| `pnpm test:unit:watch` | `vitest` — local watch mode | — |
| `pnpm check` | `svelte-kit sync && svelte-check` — type gate | "Type-check" |
| `pnpm format` | `prettier --write .` — fix formatting | — |
| `pnpm format:check` | `prettier --check .` — verify formatting | (CI uses a changed-files variant) |

## CI workflow — `unit-tests`

Defined in [.github/workflows/unit-tests.yaml](../../../.github/workflows/unit-tests.yaml).

**Triggers:** `pull_request` into `main` or `test`; `push` to `main` or `test`.
**Runner:** single `ubuntu-latest` job, `permissions: contents: read`.
**Toolchain:** pnpm v10 (`pnpm/action-setup@v4`) + Node 20 with `cache: pnpm`.

**Steps, in order:**

1. **Seed dummy env** — writes a non-secret `.env` (`RESEND_*`, `ABLY_API_KEY`, `CLOUDINARY_*`,
   `PUBLIC_POSTHOG_*`) *before* install. `$env/static/*` only exports vars present when
   `svelte-kit sync` runs (in `postinstall`), so the type-check needs them **declared**. Nothing
   here is executed or contacted — the values are dummies.
2. **Install** — `pnpm install --frozen-lockfile`; its `postinstall` runs
   `svelte-kit sync && prisma generate`, which the type-check depends on.
3. **Type-check** — `pnpm check`.
4. **Prettier (changed src files)** — *PR events only*. Fetches the base branch, diffs
   `--diff-filter=ACMR origin/$BASE_REF HEAD -- src`, keeps `.ts`/`.js`, and Prettier-checks just
   those. Empty diff → passes.
5. **Unit tests with coverage** — `pnpm test:unit:coverage`; coverage thresholds fail the job on a
   regression.

**Outcome model:** the job is the gate. Green ⇒ all four steps passed. Red ⇒ a type error, an
unformatted changed `.ts`/`.js` file, a failing test, or a coverage drop below the floor.

## Coverage thresholds (regression-only floor)

In [vite.config.ts:28-51](../../../vite.config.ts). Provider `v8`; reporters `text`, `html`
(written to `coverage/`, gitignored), `lcov`. `include: ['src/**']`; excludes test files,
`src/tests/**`, `*.svelte` (markup-only — the unit layer asserts behavior, not template lines),
`*.d.ts`, generated Prisma (`src/lib/.prisma/**`), `app.html`, and `.DS_Store`.

Measured baseline on 2026-06-15 → thresholds pinned just below so CI fails on a **drop**, not a
missing aspiration:

| Metric | Measured (2026-06-16) | Threshold |
|---|---|---|
| Statements | 21.01% | 20 |
| Branches | 22.96% | 21 |
| Functions | 19.2% | 18 |
| Lines | 21.47% | 20 |

Ratcheting the floor upward is deliberate follow-up work, not automatic.

## Mock-reset semantics (why `clearMocks` only)

`clearMocks: true` is set; `mockReset` / `restoreMocks` are deliberately **off**. The latter reset
mock *implementations*, which would wipe the `mockResolvedValue` defaults defined inside `vi.mock`
factories (e.g. [src/tests/mocks/auth_client.ts](../../../src/tests/mocks/auth_client.ts)) and
break suites that rely on them. Clearing only call history is safe and removes the need for
per-file cleanup.

## Phase 0 reconciliations (what was red, and why)

Test-only fixes; no production behavior changed:

- **login.test.ts** — `+page.svelte` maps `error.code` through `getAuthErrorKey()`. The shared
  auth-client mock returned an error with no `code`, so the component fell back to
  `auth.errors.unexpected`. Fix: the mock's `signIn.email` rejection now carries
  `code: 'INVALID_EMAIL_OR_PASSWORD'`, and the test asserts `auth.errors.invalid_credentials`
  (the translations mock is identity, so the key *is* the rendered text).
- **send_password_reset_email.test.ts** — the source's 3rd argument drifted to
  `providerIds: string[]` and the notice wording to `…is linked to ${providerNames}`. Test now
  passes `['google']` and matches current wording / return shape.
- **CategoryCapacityRow.test.ts** — markup refactor dropped the old
  `title="registration.status_*"` / `competition_card.registered_count` nodes. The 4 assertions
  now query the current markup (`categoryStatusVisual.labelKey`,
  `competition_card.capacity_title`), preserving each test's intent.

## Caveats

- **Branch protection is not in code.** The workflow *runs* on PRs but is not *required* until
  someone enables branch protection in GitHub repo settings → Branches and adds
  `unit-tests / unit-tests` as a required status check on `main` (and `test`). Until then the gate
  is advisory.
- **Format gate is changed-files-only and `.ts`/`.js`-only.** The legacy `src/` tree predates
  Prettier and is intentionally not reformatted; `.svelte` is excluded everywhere because no Svelte
  parser is configured in `.prettierrc` (the `prettier-plugin-svelte` dep exists but isn't wired
  into the config). A push event runs no format check at all (no base branch to diff against).
- **`*.md` and `pnpm-lock.yaml` are Prettier-ignored** ([.prettierignore](../../../.prettierignore)),
  so `pnpm format` won't touch docs or the lockfile.
- **Coverage thresholds reflect a point-in-time measurement.** A large source addition with no
  tests can still pass if overall percentages don't drop below the floor — the floor guards against
  regression, not against under-testing new code.
- **Env drift risk.** The CI dummy `.env` is hand-maintained, not seeded from `.env.example`. If a
  new `$env/static/private` var is added to source, the type-check step will fail in CI until the
  var is added to the workflow's seed block.

## Follow-up tasks (the unit-testing side)

Captured here as the documented backlog for the next iterations:

**Immediate close-out (this feature):**
- Enable branch protection on `main`/`test` requiring `unit-tests / unit-tests` (manual GitHub
  setting).
- Confirm on the first real PR that the workflow runs and that a deliberately red test fails the
  check.
- (Optional, cosmetic) drop the now-redundant per-file `vi.clearAllMocks()` calls.

**Sibling restructure — [unit-test-infra](../unit-test-infra/04-plan.md) (now unblocked):**
- jsdom → node environment split for server-only suites (audit item 7).
- Shared test factories.
- Typed Prisma mocks to remove the `as never` / `as any` casts (audit item 6).
- Each phase there should leave `pnpm test:unit` green — now an *enforced* guarantee, not an
  aspiration, because this gate is live.

**Open questions deferred from the plan:**
- **Coverage strictness** — keep the regression-only floor, or commit to a target (e.g. 70/80%) and
  backfill tests to reach it. A ratchet (bump the floor as coverage rises) is the low-friction path.
- **Lint depth** — currently Prettier `--check` + `svelte-check` only. A full ESLint flat-config
  (typescript-eslint + eslint-plugin-svelte) is a larger lift, deferred to a follow-up feature.
- **Wire `prettier-plugin-svelte`** into `.prettierrc` so `.svelte` files can be format-gated too,
  then widen the CI format step beyond `.ts`/`.js`.
- **Seed CI env from `.env.example`** instead of a hand-maintained block, to remove the env-drift
  risk noted above.

## Verification (2026-06-16)

- `pnpm test:unit` → 34 files / 318 tests passed.
- `pnpm check` → 0 errors, 0 warnings.
- `pnpm test:unit:coverage` → above all four thresholds (21.01 / 22.96 / 19.2 / 21.47).
