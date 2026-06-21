# Live-competition load test

A bespoke Node/TS harness that drives ≥3 simultaneously-live competitions against a target app,
simulating judges marking finishes and piece-counts while authenticated and external viewers hold
real Ably subscriptions and re-query the results page on each event.

Design & rationale: [`docs/features/live-competition-loadtest/`](../docs/features/live-competition-loadtest/).

## What it does

Per competition (defaults): 1 `INDIVIDUAL` category set `LIVE`, ~50 `CONFIRMED` entries (half
platform users, half external participants), 3 judges, 1 organizer. Then, as a two-phase scenario:

1. **Phase 1 (LIVE):** judges record finishes on ~75% of entries on an *accelerating* schedule.
2. **Transition:** the organizer stops the category (`LIVE → STOPPED`).
3. **Phase 2 (STOPPED):** judges record piece counts on the remaining ~25% DNF entries (~5/min).

Every finish / piece / stop publishes an Ably event to `competition:{id}`; each viewer re-fetches
the results-page data (`.../results/__data.json`) on every event — reproducing the real
fanout + invalidation re-query storm.

## Prerequisites

- The target app is running and reachable at `LOADTEST_BASE_URL`.
- `DATABASE_URL` points at the **same** database that target uses. `DATABASE_ACCELERATE_URL` must
  also be set (the app's Prisma singleton reads it at import time — set it equal to `DATABASE_URL`
  if you are not using Accelerate).
- The three bootstrap users exist in that DB (created by the standard local-users seed):
  `TEST_ORGANIZER_USER_EMAIL`, `TEST_PARTICIPANT_USER_EMAIL`, `TEST_ADMIN_USER_EMAIL`.
  (`createSeedContext` fetches them; the load test seeds its own `runId`-scoped organizer for the
  competitions it creates.)
- `BETTER_AUTH_SECRET` and `ABLY_API_KEY` are set (already required by the app).

## Run

```bash
LOADTEST_BASE_URL=http://localhost:5173 pnpm loadtest
```

The run seeds, executes both phases, prints a metrics summary, writes a JSON artifact under
`loadtest/results/<timestamp>.json`, tears down its own data, and exits non-zero if any SLO is
breached (p95 read < 800 ms, p95 write < 1 s, error rate < 1 %, zero unexpected 429s).

Orphaned data from an interrupted run can be removed with:

```bash
LOADTEST_RUN_ID=<runId> pnpm loadtest:teardown
```

## Configuration (env vars)

| Var | Default | Meaning |
| --- | --- | --- |
| `LOADTEST_BASE_URL` | — (required) | Target app origin |
| `DATABASE_URL` | — (required) | Target's database |
| `LOADTEST_COMPETITIONS` | `3` | Simultaneous live competitions |
| `LOADTEST_PARTICIPANTS` | `50` | Participants per competition (50/50 platform/external) |
| `LOADTEST_JUDGES` | `3` | Judges per competition |
| `LOADTEST_FINISH_SHARE` | `0.75` | Fraction of entries finished in phase 1 |
| `LOADTEST_FINISH_RAMP_START_MS` / `_END_MS` | `8000` / `800` | Accelerating finish interval |
| `LOADTEST_PIECES_PER_MINUTE` | `5` | Phase-2 piece-marking rate per category |
| `LOADTEST_SIGNIN_SPACING_MS` | `800` | Min spacing between sign-ins (all share one IP under Better Auth's limiter) |
| `LOADTEST_MAX_RUN_SECONDS` | `600` | Drain safety ceiling |
| `LOADTEST_SLO_READ_P95_MS` / `_WRITE_P95_MS` / `_ERROR_RATE` | `800` / `1000` / `0.01` | SLOs |
| `LOADTEST_ALLOW_PROD` | `false` | Required to target a production-looking URL/DB |

## Safety

The harness refuses to run against a URL/DB that looks like production unless
`LOADTEST_ALLOW_PROD=true`. All writes are `runId`-tagged; teardown deletes strictly by `runId`.
