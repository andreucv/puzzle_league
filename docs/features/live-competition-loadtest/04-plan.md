---
slug: live-competition-loadtest
stage: plan
feature: Live-competition load test module
issue: null
status: approved
created: 2026-06-19
updated: 2026-06-19
title: Live-competition load test module
date_created: 2026-06-19
last_updated: 2026-06-19
related:
  - docs/features/live-competition-loadtest/01-problem.md
  - docs/features/live-competition-loadtest/02-ideas.md
  - docs/features/live-competition-loadtest/03-design.md
---

# Implementation Plan: Live-competition load test module

Build a bespoke Node/TS load-test harness under `loadtest/` that drives ≥3 simultaneously-live
competitions (~50 participants each, half platform users / half external) against a configurable
remote target (preview/staging). Judges mark finishes then piece-counts in a realistic two-phase
cadence while authenticated and external viewers hold real Ably subscriptions and re-query the
results page on each event. Plus a one-line app bug fix so anonymous viewers can actually subscribe.

Design: [03-design.md](./03-design.md) · Problem: [01-problem.md](./01-problem.md) · Issue: _none_.
Relevant docs: `docs/ARCHITECTURE.md` §Realtime And Notifications (L58-60), §Authorization (L46-48).

## Architecture and design

**Runtime.** A single Node process run via `npx tsx loadtest/run.ts` (tsx is already the repo's
script runner — `e2e/global-setup.ts:68`). All actors are async tasks on one IO-bound event loop.
Two connection points: `DATABASE_URL` (remote DB, for seed/teardown via Prisma) and
`LOADTEST_BASE_URL` (HTTP load). `ably` and `better-auth` are already dependencies.

**Reuse (do not reinvent).**
- Seeding: `e2e/seed_utils/` — `createSeedContext` (Prisma client + `runId` + `unique()`),
  `createCompetition`, `createEntries`, `createAuthUser` ([index.ts](../../../e2e/seed_utils/index.ts)).
- Ably client pattern mirrors [`use-ably-invalidation.svelte.ts`](../../../src/lib/events/client/use-ably-invalidation.svelte.ts):
  subscribe to `competition:{id}`, act on every message. In Node, `new Ably.Realtime({ authUrl,
  authMethod: 'GET', authHeaders })` — `authHeaders` carries the session cookie for authenticated
  viewers; external viewers omit it and hit `/api/ably-token/public`.

**New, loadtest-local helpers** (kept in `loadtest/`, not core):
- `assignJudge(ctx, { userId, categoryId })` → `CategoryJudgeAssignment` create (join is
  `{userId, categoryId}`, [schema.prisma:346](../../../prisma/schema.prisma)).
- `createExternalParticipantEntries(ctx, …)` → `ExternalParticipant` rows linked to `CONFIRMED`
  entries via the `EntryExternalParticipants` relation ([schema.prisma:274](../../../prisma/schema.prisma))
  — `createEntries` only connects platform users today.
- `setCategoryLive(ctx, categoryId)` → `prisma.category.update({ status: 'LIVE' })` (finishes need
  LIVE — [db_entry.ts:207](../../../src/lib/database/db_entry.ts)).

**App change (bug fix).** Add `'/api/ably-token/public'` to `PUBLIC_API_PREFIXES` in
[`api_whitelist.ts`](../../../src/lib/api_utils/api_whitelist.ts) so the auth gate
([hooks.server.ts:92](../../../src/hooks.server.ts)) stops 401-ing anonymous token requests.

**Endpoints driven** (all with `Origin: <baseUrl-origin>` on mutating `/api/` calls for CSRF —
[hooks.server.ts:88](../../../src/hooks.server.ts)):
finish `POST /api/entries/[id]/result`; pieces `POST /api/entries/[id]/pieces`; stop `POST
/api/categories/[id]/stop`; tokens `GET /api/ably-token[/public]`; sign-in `POST
/api/auth/sign-in/email` (allowlisted); read re-query `GET
/competitions/competition_details/{id}/results/__data.json` (non-`/api/`, unthrottled).

**Two-phase cadence** (per category, 3 judges): Phase 1 LIVE — finishes on ~75% of entries,
interval ramps `finishRampStartMs → finishRampEndMs` (accelerating), round-robin; organizer stops
the category; Phase 2 STOPPED — pieces on the remaining ~25% DNF entries at `piecesPerMinute`.
Rate-limit safe: each judge is its own identity, peak ≈20-25/min < 60/min
([rate-limit.ts:133](../../../src/lib/api_utils/rate-limit.ts)).

**No schema changes. No i18n changes** (no user-facing UI). Backend impact limited to the one
allowlist entry.

## Tasks

- [ ] **App fix:** add `'/api/ably-token/public'` to `PUBLIC_API_PREFIXES`
  ([api_whitelist.ts](../../../src/lib/api_utils/api_whitelist.ts)); add/extend a unit test for
  `isPublicApiRoute` covering the public token path. (Independently shippable.)
- [ ] **Scaffold `loadtest/`:** `config.ts` (env parsing with the §2 defaults + **prod guard** that
  refuses non-allowlisted `baseUrl`/`databaseUrl`), a `loadtest/README.md` (required env vars,
  bootstrap-user prerequisite, how to run), and a `pnpm loadtest` script entry → `tsx
  loadtest/run.ts`.
- [ ] **Seed helpers + `loadtest/seed.ts`:** add `assignJudge`, `createExternalParticipantEntries`,
  `setCategoryLive`; compose per competition: competition + 1 INDIVIDUAL category (`createCompetition`,
  set LIVE), ~25 platform-user `CONFIRMED` entries (`createAuthUser` + `createEntries`), ~25
  external-participant `CONFIRMED` entries, 3 judge users + `CategoryJudgeAssignment`. **Seed a
  dedicated `runId`-scoped organizer** via `createAuthUser({ role: 'ORGANIZER' })` as the
  competition creator + stop-caller (known password for HTTP sign-in); still call
  `createSeedContext` for the Prisma client/`runId`. Return a manifest (ids + credentials + `runId`).
- [ ] **HTTP/auth client (`loadtest/http.ts`):** programmatic `signIn(email, password)` →
  session cookie; `fetchAblyToken` helper; `recordFinish`, `recordPieces`, `stopCategory`,
  `refetchResults` (the `__data.json` GET). All attach `Origin`; all parse `429` + back off per
  `Retry-After`.
- [ ] **Actors (`loadtest/actors/`):** `judge` (two-phase: accelerating finishes then pieces),
  `organizer` (stop-controller), `auth-viewer` (sign in → Ably subscribe w/ cookie → re-fetch on
  event), `external-viewer` (public token → subscribe → re-fetch). Ably wiring per §architecture.
- [ ] **Metrics (`loadtest/metrics.ts`):** record per actor-type/per-phase request counts, latency
  p50/p95/p99 (finish, pieces, token, re-fetch), errors by status, Ably events received,
  connection failures. Emit a stdout summary table **and** a JSON artifact under
  `loadtest/results/<timestamp>.json`.
- [ ] **Orchestrator (`loadtest/run.ts`):** seed → spawn actors → drive phase 1 → trigger stop →
  drive phase 2 → drain → print/persist metrics → **teardown** → exit non-zero if SLOs breached
  (p95 read <800 ms, p95 write <1 s, error <1%, 0 unexpected 429s).
- [ ] **Teardown (`loadtest/teardown.ts`):** delete strictly by `runId` (competitions cascade →
  categories → entries; then seeded users cascade → their `ExternalParticipant` rows); refuse
  without a `runId`; same prod guard. Also runnable standalone for cleanup.
- [ ] **Manual verification (`/run` then `/verify`):** first run against **local dev**
  (`LOADTEST_BASE_URL=http://localhost:5173`) at small scale — confirm: external viewers get `200`
  (bug fix works) and subscribe; no unexpected `429`s; metrics + JSON artifact produced; teardown
  leaves the DB clean. **Empirically confirm the two deferred items**: the exact `__data.json`
  URL/query the target serves, and that a `CategoryJudgeAssignment` judge passes the guard on
  `result`/`pieces` (and whether it can also call `stop` — if so, drop the organizer actor). Then a
  scaled run against a preview/staging deploy.
- [ ] **`graphify update .`** to refresh the knowledge graph after code changes.
- [ ] **Close-out:** once merged, run **`/feature-doc`** to write `05-workflow.md` (the completion
  gate).

## Resolved decisions

1. **Organizer-of-record** — seed a dedicated `runId`-scoped organizer via `createAuthUser({ role:
   'ORGANIZER' })` (known password; no dependence on bootstrap-user passwords). Reflected in the
   seed task. *(Note: `createSeedContext` still fetches the three `TEST_*_USER_EMAIL` bootstrap
   users, so they must exist on the target DB — documented as a prerequisite in `loadtest/README.md`.)*
2. **Ably limits** — confirmed the target Ably plan can absorb ~150 connections + the message
   fan-out; no dedicated load key required.
3. **Execution model** — the load-test program runs **locally** (here) and connects to the chosen
   target via `LOADTEST_BASE_URL` (local dev *or* the remote testing server) with the matching
   `DATABASE_URL`. No CI/distributed runner in scope.

## Open questions

_None remaining — plan is ready to implement on approval._
