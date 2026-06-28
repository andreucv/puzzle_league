---
slug: pay-per-competition
stage: design
feature: Free-tier policy — capacity-gated sandbox trial
issue: null
status: draft
created: 2026-06-26
updated: 2026-06-26
related:
  - docs/features/pay-per-competition/03-design.md
  - docs/features/pay-per-competition/04-plan.md
  - docs/features/pay-per-competition/02b-gtm.md
  - docs/features/pay-per-competition/00-roadmap.md
  - docs/features/pay-per-competition/06-risk-assessment.md
  - docs/features/organizer-retention/01-problem.md
  - docs/features/organizer-retention/04-plan.md
---

# Free-tier policy — capacity-gated sandbox trial

A decision record from a brainstorm/grill on **organizer account-hopping**
([organizer-retention/01-problem.md](../organizer-retention/01-problem.md)). It **reshapes the free
trial** and, in doing so, **descopes the organizer-retention moat as an abuse defense**. This doc is
authoritative for the free-tier policy and **supersedes** the "no free allowance" framing in
[`03-design.md`](./03-design.md) §2 and the "1 free competition, forever (full)" trial rows in
[`02b-gtm.md`](./02b-gtm.md).

## The problem this closes

The original trial — *1 free **full-featured** competition per account, forever* — combined with the
~1-competition/year organizer cadence, made **account-hopping free money**: spin up a new account
each year, re-claim a complete real event for €0. The planned defense (the organizer-retention moat:
edition lineage, returning-audience `NEW_EDITION`, history badge, renewal discount) was red-teamed as
leaky — the discount "can't beat free," and the audience moat ships through an in-app channel its
yearly targets never open ([`06-risk-assessment.md`](./06-risk-assessment.md) §2B, §4).

**Root cause:** the free thing was a *per-account grant of a real event*. Stacking carrots against
"€0 on a fresh account" is a losing game. The fix is to make the free thing **worthless for a real
event**, so hopping yields nothing worth hopping for.

## Decision

| Piece | Decision |
|---|---|
| **Free unit** | One free competition **per account, ever** — capped at **`Σ Category.maxParties ≤ 10` slots** (a test sandbox, not a real event). |
| **Grant semantics** | The freebie is *"one free ≤10-slot competition, claimable anytime"* — **not** "whatever you create first". Creating a real (>10) event first charges for it and **leaves the free sandbox still available**. |
| **Real events** | **Always pay, from edition 1** (the first real competition included). There is no free real event anymore. |
| **Identity-gating** | **Dropped.** It only earns its keep if the free prize stays valuable; once the prize is a ~€3 sandbox, signup friction (or dragging Stripe card-on-file into 2026) is negative ROI. Considered and rejected. |
| **Moat (R1–R6)** | **Descoped as abuse defense** (see below). Optional later as pure growth, not as monetization protection. |

### Why "capped per-account grant" over "pure capacity freemium"

A *pure* freemium rule (any ≤10 event always free, no counter) is simpler but opens a **splitting
attack**: run a 150-person event as 15×10-slot free competitions. Keeping a per-account counter
("only your one freebie is free") blocks splitting. The counter survives because it earns its keep;
the *full-size* free real event does not.

## Mechanism

- **Gate:** reuse the `P1` capacity sum already specified for pricing
  (`Σ Category.maxParties`, [`03-design.md`](./03-design.md) §2). `≤ 10` ⇒ eligible to be the free
  competition; `> 10` ⇒ priced normally.
- **Counter:** one nullable per-account marker (e.g. `User.freeCompetitionUsedAt`, schema work
  deferred to the plan stage) set when a ≤10 competition is published under the free grant. Absent ⇒
  the freebie is still available.
- **Payment bypass:** a free competition has price 0 — it **skips the Lemon Squeezy checkout** and
  publishes directly (in the automated flow, `DRAFT → NOT_STARTED` with no webhook; in the 2026
  concierge flow, the team simply publishes it with no payment link). The free path never creates a
  `CompetitionOrder`.

## Sandbox listability (new)

A free ≤10 competition is, by intent, a **private test** — the organizer is checking the product
before running the real thing. A test must not pollute public discovery feeds and dashboards.

There is **no competition-level listability flag today** (only organizer-level
`publicProfileVisibility` / `publicResultsVisibility` and the per-competition `registrationOpen`).
So this needs a **new boolean on `Competition`** — e.g. `listed` / `unlisted` (exact name + default
deferred to the plan stage) — that controls whether the competition appears in discovery/dashboard
listings, **orthogonal to `DRAFT`** (which is about *unpaid/not-visible-at-all*; an unlisted
competition is published and reachable by direct link, just not surfaced in feeds).

- **Decided:** a free sandbox defaults to **unlisted**; the organizer can flip it on. Paid
  competitions default to **listed**.
- This is a small, self-contained switch — but it is **net-new schema + a filter on the discovery
  queries** enumerated in [`03-design.md`](./03-design.md) §4, so it is called out here rather than
  buried.

## Exploit closure — obscure the waitlist on free competitions

Even a 10-slot free competition can be abused as a **roster harvester**: open a ≤10 event, let 150
people register (140 land on the waitlist), then read the waitlist = a 150-name roster collected for
free and run off-platform. `maxParties` is enforced — over-cap signups are forced to `WAITLISTED`
([`registration-workflow.ts:408-413`](../../../src/lib/services/registration-workflow.ts)) — so the
waitlist *is* the harvestable surface.

**Closure (free competitions only):** on a ≤10 free competition, **obscure the waitlist from the
organizer** — they cannot see *who* is waitlisted (no names, no list, no export). The organizer may
still see that a waitlist exists / a count, but not the identities, so there is no roster to harvest.
Paid competitions keep full waitlist visibility unchanged. (No purge needed — obscuring the
identities is sufficient and simpler.)

## What this descopes

- **Organizer-retention R1–R6** (edition lineage, `NEW_EDITION` returning-audience, history badge,
  renewal discount) is **no longer needed to defend monetization** — a fresh account only ever buys
  another worthless ≤10 sandbox. It may still be built later as a pure growth/retention feature, but
  it is off the monetization-critical path. See
  [organizer-retention/04-plan.md](../organizer-retention/04-plan.md).
- **[`06-risk-assessment.md`](./06-risk-assessment.md) attacks shrink:** B (account-hopping),
  E (stale-price on a big editable draft), and F (freebie-laundering across co-organizers) all now
  protect a ≤10 sandbox worth ~€3 instead of a full real event.

## Knock-on doc updates

- [`03-design.md`](./03-design.md) §2 ("no free allowance") and §9 ("first competition free",
  full-size) — superseded by this doc; pointers added there.
- [`02b-gtm.md`](./02b-gtm.md) trial row + Phase 2 ("1st competition free") and the price-priming
  message ("Free, normally €33") — the free thing is now a ≤10 sandbox; **the first real competition
  shows its real price**. Pointer added there.
- **Comms / grandfathering:** organizers previously told "your first competition is free" were
  promised a *full* free event. Reshaping to a ≤10 sandbox is effectively a price introduction for
  them — needs a migration/communication note before the concierge flip.

## Resolved (2026-06-26)

1. **Waitlist closure scope — free competitions only**, and the mechanism is **obscuring** the
   waitlist identities (above), not purging entries.
2. **Free-test cancellation returns the freebie** — cancelling/deleting an unused ≤10 sandbox frees
   the grant to be claimed again.
3. **Sandbox listability — free defaults to unlisted**, paid defaults to listed; flag name finalised
   at the plan stage with the §4 discovery-query filter.
4. **Concierge interim (2026) — tracked manually**, per the procedure below.

## Concierge manual procedure (2026)

In 2026 there is no `DRAFT` state and no counter column ([`02b-gtm.md`](./02b-gtm.md) concierge
model), so the free-sandbox grant is tracked **by hand**. Keep it dead simple and auditable:

**Record:** one shared sheet (or admin notes) — `free_sandbox_used` keyed by **organizer account
email**, with the competition id and date it was consumed. That single column is the whole counter.

**When a new competition is submitted, the team:**

1. **Compute capacity** — sum the categories' `maxParties` for the competition.
2. **If capacity > 10** → it is a real event. **Send the Lemon Squeezy payment link** and publish on
   payment (normal concierge flow). Do not touch the sandbox record.
3. **If capacity ≤ 10** → look up the organizer's email in the record:
   - **Not present** → this is their free sandbox. **Publish it for free** (no payment link), set the
     competition **unlisted** by default, and **add a row** to the record (email, competition id,
     date).
   - **Already present** → their freebie is spent. Treat as a paid competition: **send the payment
     link** even though it is ≤10 slots.
4. **On cancellation of a free sandbox** → **remove that organizer's row** from the record so the
   freebie is available again (resolved Q2).

> When the automated flow lands (Q1 2027), this record is replaced by the `User.freeCompetitionUsedAt`
> column and the capacity gate runs in code — the manual steps above map 1:1 onto it.
