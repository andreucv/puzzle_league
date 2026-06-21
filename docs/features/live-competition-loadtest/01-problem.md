---
slug: live-competition-loadtest
stage: problem
feature: Live-competition load test module
issue: null
status: draft
created: 2026-06-19
updated: 2026-06-19
related:
  - docs/features/live-competition-loadtest/02-ideas.md
  - docs/features/live-competition-loadtest/03-design.md
  - docs/features/live-competition-loadtest/04-plan.md
---

# Live-competition load test module — Problem

## Context

The most write-and-fanout-heavy moment in the product is a **live competition**. The relevant
machinery:

- **Judges record finishes** via `POST /api/entries/[id]/result`
  ([+server.ts](../../../src/routes/(internal)/api/entries/[id]/result/+server.ts)), which mutates
  the `Entry` (`finishTime`, `tableNumber`) through `recordFinishTime` and then publishes an
  `entry.finished` Ably event to the `competition:{id}` channel. Finishes require a `LIVE`
  category (`docs/ARCHITECTURE.md:54`).
- **Participants read results** on the public page
  `competitions/competition_details/[id]/results`
  ([+page.svelte](<../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte>)).
  When a category is `LIVE`/`STOPPED` the page opens an Ably subscription and, on each event,
  invalidates SvelteKit data — re-running the server `load` (`getCompetitionResults`) and its DB
  query ([+page.server.ts](<../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.server.ts>)).
- The page distinguishes **authenticated viewers** (token from `/api/ably-token`, auth-required)
  from **non-authenticated external viewers** (token from `/api/ably-token/public`). Both subscribe;
  the public endpoint is the path for external participants who have no account.
- Ably is the realtime transport (`docs/ARCHITECTURE.md:58-60`); API routes are rate-limited in
  [hooks.server.ts](../../../src/hooks.server.ts) via `apiRateLimiter`.

There is an empty, untracked `loadtest/` directory and no load-testing harness in the repo today.
The existing seed infrastructure (`e2e/seed_utils/` with composable `upsertUsers`,
`createCompetition`, `createEntries`, `createAuthUser` steps) only seeds **one** competition with
**5** users for the `during_competition` e2e suite — not a concurrent multi-competition load.

## Problem

1. **We cannot observe how the live path behaves under concurrent realistic load.** Nothing in the
   repo drives multiple simultaneous live competitions, so the system's behavior when many judges
   write and many participants read at once is unmeasured.
2. **The read side is an amplification point we are not exercising.** Every judge finish fans out to
   every subscriber on `competition:{id}`, and each delivered event triggers a SvelteKit
   `invalidate` → a fresh `getCompetitionResults` DB query. With ~50 viewers per competition × 3
   competitions, a single finish can trigger up to ~150 re-queries. This thundering-herd pattern is
   untested.
3. **The authenticated vs. external read paths differ but are never load-compared.** Authenticated
   viewers and non-authenticated external viewers take different token endpoints
   (`/api/ably-token` vs `/api/ably-token/public`); we don't know whether either becomes a
   bottleneck (auth/session lookups, Ably token issuance) under load.
4. **Rate limiting may distort or cap the test.** `apiRateLimiter` guards API routes, so a burst of
   judge `result` writes (and token requests) could be throttled — we don't know the realistic
   ceiling or whether the load tool needs to account for it.

## Who it affects & why it matters

- **Participants & external spectators** are the largest group present during a live event; if reads
  degrade (stale results, slow loads, dropped realtime) the core live experience breaks for exactly
  the people the product serves at its peak moment.
- **Judges/organizers** running the event need their finish-recording to stay responsive; write
  latency or errors under load directly disrupt running a competition.
- **Engineering/ops**: without a repeatable load test there's no way to set capacity expectations,
  catch regressions, or size the DB / Ably / Vercel functions before a real multi-competition day
  exposes the limits in production.

## Constraints / prior ideas

- The user already framed the **shape** of the simulation (treat as a requirement, not a solution
  choice): **≥3 competitions live simultaneously**; **~50 participants per competition**; **half
  authenticated platform users, half non-authenticated external participants**; **judges marking
  finishes** while **participants read their results**.
- Reuse the existing `e2e/seed_utils/` composable steps for seeding rather than inventing a parallel
  seeding path, where practical.
- Honor `CLAUDE.md`: simple over complex, surgical changes, never commit.
- The new module lives under the existing `loadtest/` directory.

## Resolved decisions (from Stage 1)

1. **Target environment** — configurable, but the focus is **remote test environments**: Vercel
   **preview** and **staging**. Not production. The harness must target a configurable base URL.
2. **What we measure** — **both** the realtime fanout + invalidation re-query storm **and** raw
   page-load throughput: the scenario is users navigating *en masse* to the results page while the
   realtime updates flow. (Concrete SLO thresholds — p95 read/write latency, error rate, sustained
   finishes/min — still to be set in design.)
3. **Viewer load fidelity** — *(revised in Stage 2)* generated with **lightweight clients**, not
   real browsers: each viewer opens a real Ably WebSocket subscription (via the same token
   endpoints the page uses) and re-fetches the results-page data on each event, reproducing the
   identical server-side fanout + invalidation re-query storm at a fraction of the cost. The
   earlier "real browser sessions" intent is superseded — full-browser client-render fidelity is
   out of scope. Authenticated actors (judges + the platform-user half of viewers) obtain real
   sessions via **programmatic better-auth sign-in** (no test-only auth bypass in the app).
4. **Seeding & teardown** — required: idempotent re-seeding and cleanup of 3 competitions × ~50
   entries (plus `ExternalParticipant` rows) so the load test runs repeatably without manual DB
   surgery.
5. **Rate limiting** — test **with** `apiRateLimiter` active. The harness must therefore **mimic
   normal user navigation/timing** (realistic think-times and finish cadence) rather than
   unbounded bursts, so it operates within the real rate-limit ceiling.

## Open questions

(Carried into design.) Concrete SLO thresholds for pass/fail, and the exact think-time / finish
cadence model that keeps the simulation under the rate limiter while still being a meaningful load.
