---
slug: live-competition-loadtest
stage: ideas
feature: Live-competition load test module
issue: null
status: draft
created: 2026-06-19
updated: 2026-06-19
related:
  - docs/features/live-competition-loadtest/01-problem.md
  - docs/features/live-competition-loadtest/03-design.md
  - docs/features/live-competition-loadtest/04-plan.md
---

# Live-competition load test module — Ideas

Problem: [01-problem.md](./01-problem.md)

## Decisions carried in from Stage 1 (shape the options)

- **Viewers = lightweight clients**, not real browsers. Each viewer opens a real Ably WebSocket
  subscription (same token endpoints the page uses: `/api/ably-token` for authenticated,
  `/api/ably-token/public` for external) and **re-fetches the results-page data on each event** —
  reproducing the exact server fanout + invalidation re-query storm without ~150 Chromium
  instances. (Supersedes the earlier "real browser" intent.)
- **Authenticated actors** (judges + the platform-user half of viewers) get real sessions via
  **programmatic better-auth sign-in** (`POST /api/auth/sign-in/email`), cookie reused for token,
  page fetch, and judge writes. No test-only auth bypass added to the app.
- **Target = configurable base URL** (preview/staging, not prod); **run WITH `apiRateLimiter`**, so
  actors use realistic think-times / finish cadence and back off on 429s.
- **Seeding + teardown** of 3 competitions × ~50 entries (incl. `ExternalParticipant` rows) must be
  idempotent and reusable, ideally reusing `e2e/seed_utils/` composable steps.

This shape is essentially a **persistent-actor simulation** (long-lived WS subscribers + timed
writers), not a request-throughput benchmark. That distinction is what separates the options below.

## Candidate directions

### Option A — Bespoke Node/TS orchestrator (reuse the repo stack) — RECOMMENDED
**What:** A small TypeScript program under `loadtest/` that spawns three kinds of async "actors"
inside one Node process: **judges** (sign in, then POST finishes on a realistic cadence per live
category), **authenticated viewers** (sign in, get `/api/ably-token`, subscribe to
`competition:{id}`, re-fetch results data on each event with think-time), and **external viewers**
(get `/api/ably-token/public`, subscribe, re-fetch). A config object sets base URL, per-competition
counts, durations, and cadence. Seeding/teardown call the existing `e2e/seed_utils/` steps
(`upsertUsers`, `createCompetition`, `createEntries`, plus `ExternalParticipant`). The harness
collects its own metrics (latency histograms, error/429 counts, events received) and prints a
summary.
**Data/powered by:** the real `ably` SDK already in the repo, `e2e/seed_utils/` steps, better-auth
`sign-in/email`, the live endpoints (`/api/entries/[id]/result`, `/api/ably-token[/public]`, the
results route data load). Entry fields `finishTime`/`tableNumber`; `Category` LIVE state.
**Effort:** Medium.
**Trade-off:** We hand-roll metrics/ramping (no built-in dashboard). But everything else fits: real
Ably subscriptions, real auth, repo seed reuse, full control of think-times and 429 backoff, runs as
one IO-bound process. ~300 concurrent WS+timer actors is comfortable on a single Node event loop.

### Option B — k6 scripts
**What:** Drive load with Grafana k6, getting built-in VU ramping, thresholds (good for SLO
pass/fail), and metrics out of the box.
**Data/powered by:** k6's HTTP + experimental WS; custom JS for the flows.
**Effort:** High (and high risk).
**Trade-off:** k6 runs its own Go-hosted JS runtime — **the Ably SDK won't run in it**, so the
realtime subscription + JWT-token handshake (the crux of the read-side load) would have to be
re-implemented by hand against Ably's protocol. No reuse of `e2e/seed_utils/`; better-auth login is
awkward. Great metrics, wrong fit for persistent SDK subscribers.

### Option C — Artillery with custom Node engine
**What:** Use Artillery (Node-based) for phases/ramping and reporting, calling the real Ably npm SDK
and better-auth flows from processor functions.
**Data/powered by:** Artillery scenarios + `ably` SDK + better-auth in custom JS hooks.
**Effort:** Medium-High.
**Trade-off:** Artillery's request/scenario model fights the "stay connected as a subscriber and
re-fetch on event" pattern; seeding/teardown lifecycle and long-lived WS sit awkwardly inside it.
You'd get reporting but spend the effort bending the tool — most of Option A's code anyway, wrapped
in Artillery's harness.

### Option D — Real-browser (Playwright) grid — CONSIDERED, DROPPED
**What:** All ~150 viewers as real Playwright/Chromium sessions for true client-render fidelity.
**Why dropped:** Stage-2 decision chose lightweight clients; ~150 Chromium instances need a browser
grid / distributed runners, far heavier than the server-side load we actually want to measure.
Noted here so the rejection is on record.

## Recommendation

**Option A — bespoke Node/TS orchestrator.** The defining requirements (real Ably SDK subscriptions,
better-auth sessions, reuse of `e2e/seed_utils/`, rate-limit-aware think-times, idempotent
seed/teardown) all pull toward the project's own stack. The only thing the off-the-shelf tools (B/C)
add is metrics/ramping, which we can cover with a lightweight in-harness summary — far cheaper than
fighting k6's runtime or Artillery's request model to host persistent Ably subscribers.

**Out of scope for this direction:** client-side render benchmarking; distributed/multi-machine load
generation; a metrics dashboard (a printed/JSON summary is enough to start).

## Open questions for design

1. **Concurrency ceiling on one process:** is ~300 actors (3×50 viewers + judges) fine in a single
   Node process, or do we want a worker-thread / multi-process split for headroom?
2. **Invalidation re-fetch mechanics:** what exact request reproduces the SvelteKit `invalidate`
   re-query of the results `load` (e.g. the route's `__data.json` endpoint vs a plain GET)? Design
   must pin this so the re-query storm is faithfully reproduced.
3. **Cadence model & SLO thresholds:** concrete think-time distribution, finishes/min per category,
   and the pass/fail SLOs (p95 read/write latency, error/429 rate) — left open from Stage 1.
4. **Metrics output:** what the summary reports and in what form (stdout table, JSON artifact) for
   comparing runs across preview/staging.
5. **Seeding extent & teardown safety:** confirming `ExternalParticipant` seeding via `seed_utils`,
   and a teardown keyed to a run/tag so repeated runs don't accumulate data in the shared remote DB.
