---
slug: organizer-retention
stage: problem
feature: Organizer year-over-year account retention
issue: null
status: draft
created: 2026-06-25
updated: 2026-06-25
related:
  - docs/features/organizer-retention/02-ideas.md
  - docs/features/pay-per-competition/02b-gtm.md
---

# Organizer year-over-year account retention — Problem

## Context

The pay-per-competition monetization (see
[`pay-per-competition/02b-gtm.md`](../pay-per-competition/02b-gtm.md)) grants **1 free competition
per organizer account, forever** — applied to both new and already-active organizers. It is the
entry carrot that lowers friction to the first paid edition.

Most organizers run **one competition per year** (the same event, a new edition annually); some run
2–3 yearly; few run 4+. So for the *typical* organizer the lifecycle is: year 1 free → year 2 owes
the enablement price (~€31 at the median competition, €0.3/slot ×
[~110-slot average](../../explorations/competitions_distribution_results.txt)) → year 3 again, and
so on.

## Problem

The free-forever trial, combined with the once-a-year cadence, **creates an incentive to abandon
the account and create a fresh one each year** to re-claim the free competition. The GTM already
flagged this as an accepted-for-v1 risk to revisit:

> "Watch the 1-free-per-account abuse vector (new accounts to reset the free competition) — accepted
> risk for v1, revisit if it materializes." — [`pay-per-competition/02b-gtm.md`](../pay-per-competition/02b-gtm.md)

The structural difficulty:

1. **A discount can never beat "free."** Any loyalty *price* offered to the returning account still
   loses to €0 on a brand-new account. Price alone can only narrow the gap, never close it.

2. **There is almost no switching cost today.** What would normally hold an organizer to an account
   — accumulated audience, history, reputation — **does not exist in the data model**:
   - No organizer↔participant relationship (no "follow", no returning-participant link). A new
     account loses no audience because no audience is tracked.
   - No competition lineage / series: `Competition` has no link to a previous edition
     ([`prisma/schema.prisma`](../../../prisma/schema.prisma)), so "this is last year's event again"
     is invisible to the system.
   - No organizer reputation, badges, or public history beyond a `publicProfileVisibility` toggle
     ([`prisma/schema.prisma:32`](../../../prisma/schema.prisma)).
   So the only friction to hopping accounts is **re-typing the competition config** — weak against a
   ~€31/year saving.

## Who it affects & why it matters

- **The platform / business owner** — primary. Account-hopping turns every yearly organizer into a
  permanently-free user, defeating the monetization the pay-per-competition feature was built for.
  Real revenue is expected from 2nd editions in 2027
  ([`02b-gtm.md`](../pay-per-competition/02b-gtm.md)); if those 2nd editions arrive on fresh
  accounts, the revenue never lands.
- **Organizers** — indirectly: with no account equity they also gain nothing by staying, so there
  is no reason *not* to hop. Building reasons to stay is value delivered to them, not just defense.
- **Participants** — indirectly: if organizers reset accounts yearly, participants lose any
  continuity (history, being re-invited to the event they did last year).

## Constraints / prior ideas

Decisions already taken by the user (carry into ideation, not up for re-litigation):

- **Carrots only, no restrictions.** Retention must come from *features or discounts that make the
  account worth keeping*, never from forbidding multiple accounts or gating the free trial.
- **The 1-free-forever trial stays.** This problem is about retaining the account around it, not
  removing it.

## Open questions

Deliberately left for **Stage 2 (ideation)**:

1. **Which lever** — account equity (switching cost), loyalty pricing, reframing the trial, or a
   blend?
2. **How participants link to an organizer/edition** so a returning audience can be re-invited
   (consent model, given Spain/EU).
3. **Schema shape** for representing "the same competition, a new edition" with the smallest change.
4. **What ships first** — does the retention moat depend on the automated billing flow, or can it
   ship independently?
</content>
</invoke>
