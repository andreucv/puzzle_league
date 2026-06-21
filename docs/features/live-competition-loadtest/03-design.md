---
slug: live-competition-loadtest
stage: design
feature: Live-competition load test module
issue: null
status: approved
created: 2026-06-19
updated: 2026-06-19
related:
  - docs/features/live-competition-loadtest/01-problem.md
  - docs/features/live-competition-loadtest/02-ideas.md
  - docs/features/live-competition-loadtest/04-plan.md
---

# Design: Live-competition load test module

Scope: new `loadtest/` module (bespoke Node/TS orchestrator) that drives the live-competition path
of the deployed app over HTTP, plus a one-line app fix to
[`src/lib/api_utils/api_whitelist.ts`](../../../src/lib/api_utils/api_whitelist.ts). It exercises:
the judge finish endpoint
[`/api/entries/[id]/result`](<../../../src/routes/(internal)/api/entries/[id]/result/+server.ts>),
the piece-count endpoint
[`/api/entries/[id]/pieces`](<../../../src/routes/(internal)/api/entries/[id]/pieces/+server.ts>),
the category stop transition
[`/api/categories/[id]/stop`](<../../../src/routes/(internal)/api/categories/[id]/stop/+server.ts>),
the Ably token endpoints
[`/api/ably-token`](<../../../src/routes/(internal)/api/ably-token/+server.ts>) /
[`/api/ably-token/public`](<../../../src/routes/(internal)/api/ably-token/public/+server.ts>), and
the public results route
[`competitions/competition_details/[id=integer]/results`](<../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.server.ts>)
(`getCompetitionResults`). Seeding/teardown reuse [`e2e/seed_utils/`](../../../e2e/seed_utils/index.ts).

Refs: `docs/ARCHITECTURE.md` §Realtime And Notifications (L58-60), §Authorization (L46-48).
Problem: [01-problem.md](./01-problem.md). Direction: [02-ideas.md](./02-ideas.md) (Option A).

## Problem

We cannot observe how the live path behaves under concurrent realistic load: many judges writing
finishes while many participants read results. Each judge finish publishes to `competition:{id}`;
every subscriber's client calls `invalidateAll()`
([use-ably-invalidation.svelte.ts:32](../../../src/lib/events/client/use-ably-invalidation.svelte.ts)),
re-running the results `load` and its DB query — a read-amplification storm that is currently
unmeasured. **Guiding principle:** reproduce the *server-side* load faithfully and cheaply (real
Ably subscriptions + real re-query requests), within the real rate-limit ceiling, against a remote
target — without 150 real browsers.

## Design

### 1. Runtime & module layout
A single Node/TS process under `loadtest/`, run via a pnpm script (e.g. `pnpm loadtest`). All actors
are async tasks on one event loop — the work is IO-bound (WebSocket frames + HTTP), so ~150 viewers
+ judges per process is comfortable. Headroom, if ever needed, comes from running multiple
instances each scoped to a subset of competitions (config-sharded), not from threads.

Two connection points (the operator sets both):
- **`DATABASE_URL`** → the *same* DB the remote target uses, for **seeding/teardown** via Prisma
  (`e2e/seed_utils/` needs it).
- **`LOADTEST_BASE_URL`** → the remote app origin (preview/staging) for all **load** traffic
  (sign-in, token, finishes, page re-fetch).

Suggested files: `loadtest/config.ts`, `loadtest/seed.ts`, `loadtest/teardown.ts`,
`loadtest/actors/{judge,auth-viewer,external-viewer}.ts`, `loadtest/metrics.ts`, `loadtest/run.ts`.

### 2. Configuration (`loadtest/config.ts`)
Env-driven, with defaults: `baseUrl`, `databaseUrl`, `competitions` (default 3),
`participantsPerCompetition` (default 50, split 50/50 platform/external), `judgesPerCompetition`
(default **3**). Two-phase write cadence (see §5/§7):
- `finishShare` (default **0.75**) — fraction of entries that get a finish time in phase 1; the
  rest (~25%) are DNF and get piece counts in phase 2.
- `finishRampStartMs` / `finishRampEndMs` (default 8000 → 800) — phase-1 cadence **accelerates**:
  the interval between finishes across the field shrinks from start to end (finishes cluster near
  the end, like a real competition). Distributed round-robin across the 3 judges; per-judge rate
  stays under the 60/min limit.
- `piecesPerMinute` (default **5**) — phase-2 piece-marking rate per category ("very fast").
`viewerThinkMode` is `event-driven` (matching the real page — re-fetch on each Ably message). A
**prod guard**: refuse to run if `baseUrl`/`databaseUrl` look like production (explicit allow flag
required).

### 3. Prerequisite app fix — public token allowlist
**Decision:** add `'/api/ably-token/public'` to `PUBLIC_API_PREFIXES` in
[`api_whitelist.ts`](../../../src/lib/api_utils/api_whitelist.ts). Today any `/api/` route not on
that list is forced through the auth gate at
[`hooks.server.ts:92`](../../../src/hooks.server.ts) and returns **401** when there's no session —
so anonymous viewers can never reach the public token endpoint, even though the results page
deliberately calls it for logged-out viewers
([results/+page.svelte:64](<../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte>)).
This is a latent bug; the endpoint mints a subscribe-only token after confirming the competition
exists and leaks no PII, so it belongs on the public allowlist. After the fix, anonymous external
viewers can subscribe and generate the full re-query storm. (Prefix uses `startsWith`; it will not
collide with the authenticated `/api/ably-token`.)

### 4. Seeding (`loadtest/seed.ts`) — idempotent, runId-tagged
Reuse `e2e/seed_utils/` steps; everything is tagged by `ctx.runId` (competition names via
`ctx.unique()`, user emails suffixed with `runId` — see
[create-auth-user.ts:65](../../../e2e/seed_utils/steps/create-auth-user.ts)), which is also the
teardown key. Per competition:
1. **Competition + one `INDIVIDUAL` category** via `createCompetition` (`maxParties` ≥ 50).
2. **Set the category `status = LIVE` directly via Prisma** (decision) — `createCompetition` seeds
   `NOT_STARTED` ([create-competition.ts:35](../../../e2e/seed_utils/steps/create-competition.ts)),
   and finishes require `LIVE` ([db_entry.ts:207](../../../src/lib/database/db_entry.ts)). We don't
   load-test the start transition, so a direct update is enough.
3. **~25 platform-user participants** via `createAuthUser` (credentials returned for HTTP sign-in)
   + a `CONFIRMED` entry each connecting `userIds` ([create-entries.ts](../../../e2e/seed_utils/steps/create-entries.ts)).
4. **~25 external participants**: `ExternalParticipant` rows (created by the organizer) linked to
   `CONFIRMED` entries via the `EntryExternalParticipants` relation
   ([schema.prisma:274](../../../prisma/schema.prisma)). *(New seed helper — `createEntries` only
   connects platform users today.)*
5. **1 judge user + `CategoryJudgeAssignment`** per category so the judge passes the route guard on
   the result endpoint. *(New seed helper.)*

The seed step returns a manifest (competition ids, category ids, entry ids, judge + platform-user
credentials, runId) consumed by the run.

### 5. Actor model (`loadtest/actors/`)
All actors talk to `LOADTEST_BASE_URL`. Mutating `/api/` calls send an `Origin` header matching the
target so they pass CSRF (`validateOrigin`, [hooks.server.ts:88](../../../src/hooks.server.ts));
`/api/auth/*` and the public token endpoint are allowlisted and skip CSRF/auth/rate-limit.

The competition runs as a **two-phase scenario** per category, mirroring a real event (people
finish during LIVE; the clock stops; remaining DNFs are ranked by completed pieces):

- **Phase 1 — LIVE finishes:** the 3 judges sign in (`POST /api/auth/sign-in/email`) and, on an
  **accelerating** schedule (`finishRampStartMs → finishRampEndMs`), `POST
  /api/entries/{entryId}/result` with `{finishTime, tableNumber}` for the next un-finished entry —
  cookie + `Origin` attached. They cover `finishShare` (~75%) of the entries, round-robin. Each
  finish publishes `entry.finished` → all viewers re-query (§6).
- **Transition:** once phase-1 finishes are exhausted, the **organizer** actor (the seeded
  competition creator, signed in) calls `POST /api/categories/{id}/stop` → LIVE→STOPPED via the
  real lifecycle service, publishing its event. (Organizer is used because category lifecycle is
  organizer-guarded.)
- **Phase 2 — STOPPED piece counts:** the judges `POST /api/entries/{entryId}/pieces` with
  `{nPiecesCompleted}` for the remaining ~25% DNF entries (finishTime null) at `piecesPerMinute`
  (~5/min per category). Each publishes `entry.pieces_updated` → viewers re-query.

- **Authenticated viewer** (~25/competition): sign in → `GET /api/ably-token?competitionId=…` with
  cookie → open real Ably subscription to `competition:{id}` → on **each** message, re-fetch the
  results page data (§6) with cookie. Initial page-data fetch on connect.
- **External viewer** (~25/competition): `GET /api/ably-token/public?competitionId=…` (no cookie,
  now allowlisted) → subscribe → on each message, re-fetch results page data **without** cookie.

This matches the real page exactly: the page invalidates on every event, so we do **not** add
artificial think-time to event-driven re-fetches — the "think-time" requirement is satisfied by the
judge cadence that paces how often events fire.

### 6. Reproducing the invalidate re-query
`invalidateAll()` re-runs the results `load` by re-fetching the route's SvelteKit data endpoint. The
harness reproduces it with `GET {baseUrl}/competitions/competition_details/{id}/results/__data.json`
(the same server `load` → `getCompetitionResults` DB query). This path is **not** under `/api/`, so
it is **not** rate-limited — viewers can re-fetch on every event without 429s. *(Exact query-string
nuance — e.g. `?x-sveltekit-invalidated=…` — to be confirmed empirically against the target in the
plan; the bare `__data.json` GET already re-runs the load.)*

### 7. Rate-limit awareness
General API limit is **60 req/min**, keyed by **user-id when authenticated, IP when public**
([rate-limit.ts:82,133](../../../src/lib/api_utils/rate-limit.ts)). Implications:
- **Judges** are the main sustained `/api/` writers; each of the 3 per competition is its own
  identity, so the field's accelerating cadence is split three ways. The ramp's floor
  (`finishRampEndMs`) and the round-robin split must keep any single judge under 60/min — the
  config defaults do (peak per-judge ≈ 20-25/min). Phase-2 piece marks (~5/min/category across 3
  judges) are trivially under the limit.
- **Organizer** makes one `stop` call per category (3 total) → negligible.
- **Authenticated viewers** make ~1 token request each (distinct identities) → no pressure.
- **External token + page re-fetch** are unthrottled (allowlisted / non-`/api/`).
Actors still treat any `429` as a signal: record it and exponential-backoff per `Retry-After`. A
clean run should produce **zero** 429s; their presence means cadence is too aggressive.

### 8. Metrics & reporting (`loadtest/metrics.ts`)
In-harness collection, no external tooling. Per actor-type: request counts, latency p50/p95/p99
(judge write, token fetch, page-data re-fetch), error counts by HTTP status, Ably events received,
connection failures/reconnects. Output: a stdout summary table at the end **and** a JSON artifact
under `loadtest/results/<timestamp>.json` for run-to-run comparison.
**SLOs (confirmed):** p95 page-data re-fetch < 800 ms; p95 judge write (finish *and* pieces) < 1 s;
error rate < 1 %; 0 unexpected 429s. Run exits non-zero if SLOs are breached (useful for CI later).
Metrics are reported per phase so phase-1 (accelerating fan-out) and phase-2 are comparable.

### 9. Teardown safety (`loadtest/teardown.ts`)
Keyed strictly to `runId`: delete the run's competitions (cascade removes categories → entries),
then the seeded users (cascade removes their `ExternalParticipant` rows). **Never** a blanket
delete; refuse to run without a `runId`; honor the same prod guard as §2. Idempotent re-runs are
achieved by always tearing down the prior runId (or running with a fresh runId) so repeated runs
never accumulate rows in the shared remote DB.

## Data / model impact

- **No schema changes.** All entities exist: `Competition`, `Category` (`status` LIVE), `Entry`
  (`finishTime`, `tableNumber`), `ExternalParticipant` + `EntryExternalParticipants`,
  `CategoryJudgeAssignment`, `RoleAssignment`.
- **One app code change:** add `/api/ably-token/public` to `PUBLIC_API_PREFIXES` (§3) — a bug fix,
  not a schema/behavioral redesign.
- **New seed helpers** (in `loadtest/`, not core): external-participant entries and judge
  assignment. Reuse existing `seed_utils` steps everywhere else.
- Writes only seeded, runId-tagged rows to the target DB; teardown removes them.

## Out of scope

- Real-browser client-render benchmarking (chose lightweight clients in Stage 2).
- Distributed/multi-machine load generation (single process; optional config sharding only).
- A metrics dashboard (stdout + JSON artifact is enough to start).
- Load-testing the category *start* transition (seeded LIVE directly), registration, payments, or
  notifications. The single `stop` call per category *is* exercised, as the phase-1→phase-2
  boundary, but it is not itself a load target (3 calls total).
- Production targets.

## Resolved decisions

1. **SLOs** — confirmed (§8 defaults).
4. **Cadence** — confirmed: **3 judges per competition**; phase 1 marks ~75% of entries as finishes
   on an **accelerating** schedule; the category is then **stopped**; phase 2 marks pieces on the
   remaining ~25% DNF entries at ~5/min (§5, §2).

## To verify during implementation (approach settled, empirical check needed)

- **Judge route guard** — confirm `enforceRouteGuard` on `/api/entries/[id]/result` **and**
  `/api/entries/[id]/pieces` accepts a judge assigned via `CategoryJudgeAssignment`, and that
  `/api/categories/[id]/stop` is organizer-only (drives who calls stop). If a judge can also stop,
  the organizer actor can be dropped.
- **`__data.json` request shape** — confirm the exact data-endpoint URL/query the target expects so
  the re-query is byte-faithful (§6).
