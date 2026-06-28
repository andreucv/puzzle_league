---
slug: organizer-retention
stage: ideas
feature: Organizer year-over-year account retention
issue: null
status: draft
created: 2026-06-25
updated: 2026-06-25
related:
  - docs/features/organizer-retention/01-problem.md
  - docs/features/organizer-retention/04-plan.md
  - docs/features/pay-per-competition/02b-gtm.md
  - docs/features/pay-per-competition/00-roadmap.md
---

# Organizer year-over-year account retention — Ideas

> **⚠️ Superseded as abuse defense (2026-06-26).** The economic argument below ("why the blend beats
> account-hopping") is moot: the hopping vector is now closed at the source by reshaping the free
> trial into a ≤10-slot sandbox, so a fresh account gains nothing worth re-claiming. See
> [pay-per-competition/07-free-tier-policy.md](../pay-per-competition/07-free-tier-policy.md). These
> ideas survive only as optional growth features, not monetization protection.

Problem: [./01-problem.md](./01-problem.md)

## Settled parameters (decided during ideation — not up for re-litigation)

- **Lever: blend equity + pricing.** A non-gameable *account-equity* moat (the durable lever),
  topped with a *renewal discount* (the secondary lever). Carrots only, no restrictions — per
  [`01-problem.md`](./01-problem.md).
- **The moat is a returning audience.** The strongest, non-gameable carrot: participants of a past
  edition are auto-linked and re-invited to the next one. The audience lives on the account, so a
  new account starts from zero — that is the switching cost.
- **Consent model: auto-link, in-app notification, easy opt-out.** Anyone who joined a past edition
  is linked and gets an **in-app** `NEW_EDITION` notification when the next edition opens, with a
  one-click opt-out. Chosen over explicit opt-in (too few would opt in → weak moat) and
  organizer-triggered one-time invites (replicable from a fresh account). Low-risk: the participant
  already joined that event and it is in-app, not cold email — carry a GDPR/legitimate-interest note
  to design.
- **Unifying concept: a competition *edition lineage*.** Every carrot hangs off the idea that this
  year's competition is "the next edition of" last year's. One concept powers clone, audience,
  history, badge, and discount.

### Schema shape (DEFERRED to design/Stage 4 — do **not** touch code yet)

- **Self-referential FK, not a new `Series` table:** add nullable
  `Competition.previousEditionId → Competition.id` ([`prisma/schema.prisma`](../../../prisma/schema.prisma)).
  The "series" is just the chain of editions linked through it. Lineage walk gives history; the
  previous edition gives the audience; presence of the FK gates the discount. Add a real `Series`
  table later *only* if a stable public series URL independent of editions is ever needed (YAGNI now).
- **New notification type `NEW_EDITION`** in the existing notification enum
  (alongside `PAYMENT_REMINDER` / `COMPETITION_CANCELLED`,
  [`prisma/schema.prisma:155-162`](../../../prisma/schema.prisma)) — reuses the notification system,
  no new delivery machinery.

## Why the blend beats account-hopping (the economic proof)

A dodger who creates a new account to save ~€31 still gets that account's free trial — **but loses
the returning audience.** Per the GTM, the platform fee is **<3% of an organizer's entry-fee take**
([`02b-gtm.md`](../pay-per-competition/02b-gtm.md)), so last year's puzzlers being auto-invited is
worth *far more than €31* in extra signups to the organizer. The renewal discount then shrinks the
€31 itself. Net: the only organizer who still hops is one who values their own returning audience at
zero. Nothing is forbidden — they *can* hop, they simply won't want to.

## Candidate directions

### A — Edition lineage as the spine (RECOMMENDED)

**What:** Add `Competition.previousEditionId` and hang four thin features off it:
- **Start next edition** — from a finished competition, clone its config into a new draft and set
  `previousEditionId` (removes all re-entry friction).
- **Returning audience** — on opening the new edition, send the `NEW_EDITION` in-app notification to
  previous-edition participants (opt-out). The moat.
- **Public history + "running since YYYY" badge** — walk the chain to show past editions, results,
  and edition count on the competition/organizer page. Credibility a fresh account can't fake.
- **Renewal discount** — `previousEditionId != null` ⇒ X% off the enablement price. Non-gameable: a
  new account has no chain, so no discount.
**Powered by:** one nullable FK + one notification type; existing notification system; existing
competition config + results.
**Effort:** Medium (one model change + relation; the four features are thin layers).
**Trade-off:** Requires the lineage FK and an auto-notify consent note. Most coherent; the discount
is inherently non-gameable.

### B — Loose bolt-ons, no new model

**What:** Ship each carrot standalone — a "follow organizer" toggle, an organizer profile page, a
manual "clone" button, a returning-organizer discount code.
**Effort:** Low per piece.
**Trade-off:** With no lineage, the discount is manual and gameable, history is scattered, and the
audience link is a weaker generic "follow". You end up rebuilding the lineage later anyway. Recorded
as the inferior alternative.

### C — Audience-only MVP

**What:** Just `previousEditionId` + "start next edition" clone + `NEW_EDITION` notification +
opt-out. Skip history, badge, and pricing.
**Effort:** Low.
**Trade-off:** Smallest test of whether the *moat alone* changes behavior. Not a competitor to A —
it **is** the first slice of A.

## Recommendation

**Direction A as the north star, shipped in slices, starting with C.** The audience moat is what
actually stops account-hopping and doubles as growth; the discount can wait (it needs the rate fixed
and the automated billing flow, Q1 2027, anyway).

### Phasing

1. **Slice 1 — the moat (= direction C):** `previousEditionId` + "start next edition" clone +
   `NEW_EDITION` notification + opt-out. Stops hopping; ships independent of billing.
2. **Slice 2 — credibility:** public edition history + "running since YYYY" badge.
3. **Slice 3 — pricing:** renewal discount, once the rate is fixed and the automated enablement-price
   flow exists ([`pay-per-competition/03-design.md`](../pay-per-competition/03-design.md)).

## Sub-decisions to resolve in design (Stage 3)

1. **How a lineage is created** — only via "start next edition" (clone sets the FK), or can an
   organizer also retro-link an existing competition to a past one? Lean: clone-only for v1.
2. **Audience scope** — notify only the immediately previous edition's participants, or the whole
   chain? Lean: immediately previous (last year's puzzlers) for v1; chain walk is cheap to add.
3. **Opt-out granularity** — per-series, per-organizer, or a global "new edition" notification
   preference? Lean: reuse existing notification preferences if present.
4. **Discount shape** — flat % off, or scaling with edition count / loyalty? Lean: flat %, one
   tunable number (mirrors the enablement `UNIT_RATE` simplicity).
5. **Badge threshold** — from the 2nd edition, or only after N? Lean: show "running since YYYY" from
   the 2nd edition.

## Open questions for design

- GDPR/legitimate-interest wording for auto-notifying past participants (Spain/EU) — confirm in-app
  notification of "the event you joined has a new edition" is covered, and surface the opt-out.
- Whether the discount interacts with the 1-free trial (e.g. a returning organizer who never used
  their free competition) — define precedence.
- Where "start next edition" lives in the UI (finished-competition view vs organizer dashboard).
</content>
