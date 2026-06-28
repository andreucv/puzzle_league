---
slug: organizer-retention
stage: plan
feature: Organizer year-over-year account retention
issue: null
status: draft
created: 2026-06-26
updated: 2026-06-26
related:
  - docs/features/organizer-retention/01-problem.md
  - docs/features/organizer-retention/02-ideas.md
  - docs/features/pay-per-competition/00-roadmap.md
  - docs/features/pay-per-competition/03-design.md
---

# Implementation Plan: Organizer year-over-year account retention

> **⚠️ Descoped as abuse defense (2026-06-26).** The account-hopping vector this plan exists to stop
> is now closed at the source by reshaping the free trial into a ≤10-slot sandbox — see
> [pay-per-competition/07-free-tier-policy.md](../pay-per-competition/07-free-tier-policy.md). A
> fresh account only ever buys another worthless ≤10 sandbox, so R1–R6 are **no longer needed to
> protect monetization**. Keep this plan only if the moat is later pursued as a pure
> growth/retention feature; it is off the monetization-critical path.

Stop the account-hopping incentive the 1-free-forever trial creates, with **carrots only, no
restrictions** ([01-problem.md](./01-problem.md)). The moat is a **returning audience**:
participants of a past edition are auto-linked and re-invited to the next, so a fresh account starts
from zero. Built on one self-referential FK (edition lineage) per the chosen direction
([02-ideas.md](./02-ideas.md), Direction A, shipped in slices starting with C). Sequenced in the
[program roadmap](../pay-per-competition/00-roadmap.md); block IDs (R1…R6) are defined there.

## Architecture and design

- **Spine:** nullable self-FK `Competition.previousEditionId → Competition.id`
  ([`prisma/schema.prisma`](../../../prisma/schema.prisma)). The "series" is just the chain linked
  through it — no `Series` table (YAGNI per ideas). Lineage walk → history; previous edition →
  audience; presence of the FK → gates the discount.
- **Reuse:** the existing notification system for the new `NEW_EDITION` type (no new delivery
  machinery); existing competition config + results for clone, history, and badge.
- **Independence:** Phase 2 (the moat) depends on **no billing work** — it ships in parallel with
  the pay-per-competition concierge phases. Only Phase 6's renewal discount (R6) crosses over: it
  needs P1 (price calc) + the automated billing flow (PPC Phase 4). See the
  [dependency map](../pay-per-competition/00-roadmap.md).
- **Consent (GDPR/EU):** auto-link + **in-app** `NEW_EDITION` notification + one-click opt-out
  (ideas — chosen over opt-in). The participant already joined that event and it is in-app, not cold
  email → legitimate-interest basis. Confirm wording in the GDPR note below.

## Tasks

### Phase 2 — Retention moat (R1 · R2 · R3 · R4) — billing-independent

- [ ] **R1 — `previousEditionId` self-FK.** Add nullable `Competition.previousEditionId →
  Competition.id` ([`prisma/schema.prisma`](../../../prisma/schema.prisma)) + relation. Migration
  adds one nullable column; no backfill.
- [ ] **R2 — "Start next edition" clone.** From a **finished** competition, clone its config
  (categories, capacities, settings) into a new competition and set `previousEditionId` to the
  source. **Clone-only lineage for v1** (no retro-linking — ideas sub-decision 1). Decide UI home:
  finished-competition view vs organizer dashboard (open question below). Soft edge: once PPC `P8`
  (DRAFT) exists, the clone writes `status: DRAFT`; until then it writes the normal default.
- [ ] **R3 — `NEW_EDITION` notification.** Add `NEW_EDITION` to the notification enum
  ([`prisma/schema.prisma:155-162`](../../../prisma/schema.prisma)). When the new edition opens,
  send the in-app notification to **the immediately previous edition's** participants (v1 scope —
  ideas sub-decision 2; chain walk deferred). Reuse the existing notification send path — **verify
  a generic in-app send exists** ([roadmap "to verify"](../pay-per-competition/00-roadmap.md)).
- [ ] **R4 — Opt-out.** One-click opt-out from `NEW_EDITION`. **Reuse existing notification
  preferences if present** (ideas sub-decision 3); only add a preference field if there is no
  reusable toggle. Surface the opt-out in the notification itself.
- [ ] **GDPR note.** Document the legitimate-interest basis for auto-notifying past participants of
  a new edition (Spain/EU) and that the opt-out is one click — carry into the eventual
  `05-workflow.md`.

### Phase 6 — Credibility + discount (R5 · R6) — after PPC Phase 4

- [ ] **R5 — Public edition history + badge.** Walk the `previousEditionId` chain to show past
  editions, results, and edition count on the competition/organizer page, plus a "running since
  YYYY" badge. Show the badge **from the 2nd edition** (ideas sub-decision 5). Read-only; no schema
  change beyond R1.
- [ ] **R6 — Renewal discount.** `previousEditionId != null ⇒ X% off` the enablement price.
  **Flat %, one tunable number** (ideas sub-decision 4). Non-gameable: a fresh account has no chain.
  - [ ] **Depends on PPC:** plugs into `P1` (price calc) and the automated billing flow
    (`P8…P12`) — cannot ship before [PPC Phase 4](../pay-per-competition/04-plan.md).
  - [ ] Define precedence vs the 1-free trial when a returning organizer never used their free
    competition (ideas open question).

## Open questions

1. **Clone UI home** — finished-competition view or organizer dashboard for "Start next edition"?
   (ideas open question.)
2. **Notification send reuse** — does the notification system expose a generic in-app send R3 can
   call, or does R3 need a thin sender? Verify before Phase 2 build.
3. **Discount × free-trial precedence** — for R6, which wins when a returning organizer still has an
   unused free competition? (deferred with Phase 6.)
