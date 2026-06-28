---
slug: pay-per-competition
stage: plan
feature: Monetization + organizer moat — program roadmap
issue: null
status: draft
created: 2026-06-26
updated: 2026-06-26
related:
  - docs/features/pay-per-competition/03-design.md
  - docs/features/pay-per-competition/02b-gtm.md
  - docs/features/pay-per-competition/04-plan.md
  - docs/features/pay-per-competition/06-risk-assessment.md
  - docs/features/organizer-retention/02-ideas.md
  - docs/features/organizer-retention/04-plan.md
---

# Program roadmap — Monetization + organizer moat

This is the **cross-feature index** for two features that ship together as one program:

- **Pay-per-competition** ([design](./03-design.md), [GTM](./02b-gtm.md), [plan](./04-plan.md))
- **Organizer-retention** ([ideas](../organizer-retention/02-ideas.md),
  [plan](../organizer-retention/04-plan.md))

It holds the MVP analysis, the dependency map, and the phase ordering. The concrete task
checklists live in each feature's `04-plan.md`; this doc only sequences them and owns the one
cross-feature dependency.

## Why a combined roadmap

The feature is too big to build at once. Both features are already pre-sliced by their own docs
(concierge → automation for billing; moat → discount for retention), and the slices interleave.
There is exactly **one hard cross-feature dependency** — the renewal discount needs the automated
enablement-price flow — so almost everything else parallelizes. The risk this roadmap exists to
prevent: building the automated billing machinery (DRAFT state, webhook) for the 2026 concierge
phase that does not need it.

## Building blocks

Atomic, independently reviewable units. IDs are referenced by both `04-plan.md` files.

### Pay-per-competition (P)

| # | Block | Schema? | Phase |
|---|---|---|---|
| P1 | Capacity price calc `RATE × Σ Category.maxParties` + env config | no | 0 |
| P2 | Show price in create/edit flow (priming, free) | no | 0 |
| P3 | PostHog funnel instrumentation (created → price shown → reaction) | no | 0 |
| P4 | Lemon Squeezy account + product (`custom_price`) setup | no | 1 |
| P5 | Payment Link generation (concierge) | no | 1 |
| P6 | Admin manual-publish toggle | no | 1 |
| P7 | Organizer docs page — concierge wording (design §9) | i18n only | 1 |
| P15 | Rename `Category.price → participationFee` (prep refactor) | **yes** | 3 |
| P8 | `DRAFT` status enum + state model (design §1) | **yes** | 4 |
| P10 | `CompetitionOrder` correlation model (design §5) | **yes** | 4 |
| P9 | Participant-visibility leak fixes (design §4) | no | 4 |
| P11 | Checkout-creation server action → LS redirect (design §3) | no | 4 |
| P12 | LS webhook — verify + `order_created` → publish (design §6) | no | 4 |
| P13 | Cancellation + LS refund (design §7) | no | 5 |
| P14 | Lock priced fields after publish (design §8) | no | 5 |
| P16 | `DRAFT` chip case + docs rewrite to automated flow (design §9) | no | 5 |

### Organizer-retention (R)

| # | Block | Schema? | Phase |
|---|---|---|---|
| R1 | `Competition.previousEditionId` self-FK (ideas — schema shape) | **yes** | 2 |
| R2 | "Start next edition" clone (config → new competition, sets FK) | no | 2 |
| R3 | `NEW_EDITION` notification type + send on edition open | **yes** (enum) | 2 |
| R4 | Opt-out for `NEW_EDITION` | maybe | 2 |
| R5 | Public edition history + "running since YYYY" badge | no | 6 |
| R6 | Renewal discount (`previousEditionId != null ⇒ X% off`) | no | 6 |

> **R1–R6 descoped as abuse defense (2026-06-26).** The account-hopping vector is now closed at the
> source by the free-tier reshape (Track D / [07-free-tier-policy.md](./07-free-tier-policy.md)), so
> the moat is no longer monetization-critical — kept only as optional growth. See
> [organizer-retention/04-plan.md](../organizer-retention/04-plan.md).

### Free-tier policy (F) — [07-free-tier-policy.md](./07-free-tier-policy.md)

One free `≤10`-slot sandbox per account; real events pay from edition 1. Folds into Tracks A & B.

| # | Block | Schema? | Phase |
|---|---|---|---|
| F1 | Free-eligibility helper `isFreeEligible = Σ maxParties ≤ 10` (reuses P1 sum) | no | 0 |
| F2 | Concierge free-sandbox decision (no-link if `≤10` & freebie unused) + manual `free_sandbox_used` record + P2/P5/P7 wording | no | 1 |
| F3 | `User.freeCompetitionUsedAt` counter (cancel of unused sandbox returns freebie) | **yes** | 4 |
| F4 | Free path bypasses checkout — publish direct, no `CompetitionOrder` | no | 4 |
| F5 | `Competition.listed` flag + discovery-feed filter | **yes** | 4 |
| F6 | Obscure waitlist on free competitions (organizer entries data source) | no | 4 |

> **This roadmap is the index only.** Block IDs are registered here for sequencing, but the
> authoritative task breakdown we actually execute is [04-plan.md](./04-plan.md) (and
> [organizer-retention/04-plan.md](../organizer-retention/04-plan.md)) — **follow the plan, not this
> table.** Phasing notes here (e.g. F5/F6 in Phase 4) are the lean; the plan's open questions own any
> change.

## Dependency map

```
TRACK A — PPC CONCIERGE (2026, no schema)
  P1 ──┬─► P2 ──► P3            (priming — shippable on its own)
       └─► P5 ◄── P4            (P4 = LS setup, external)
            P5 + P6 + P7  ─────► concierge charging live

TRACK B — PPC AUTOMATION (Q1 2027, schema)
  P15 (independent prep — ship anytime, ideally before Track B)
  P8 (DRAFT) ──┬─► P9
               ├─► P14
               └─► P11 ─► P12 ─► P13
  P10 ─────────────► P11, P12
  P8 ──► P16
  (P4 reused)

TRACK C — OR MOAT (DESCOPED as defense; optional growth only)
  R1 ──┬─► R2
       ├─► R3 ──► R4
       └─► R5
  R6 (renewal discount) ◄── needs P1 + Track B  →  ship LAST

TRACK D — FREE TIER (folds into A & B; see 07-free-tier-policy.md)
  F1 (≤10 gate, reuses P1) ──► F2 (concierge: no-link decision + manual record)   [in Track A]
  F3 (counter) ──► F4 (free bypass) ◄── P11
  F5 (listed flag) ──► discovery filter (reuses P9 query set + upcoming/near feeds)
  F6 (obscure waitlist) — organizer entries data source
  (F3…F6 = Track B automation; need P8/P11)

CROSS-FEATURE EDGE (the only one): R6 → {P1, P8…P12}
SOFT EDGE: once P8 exists, R2 clone writes DRAFT; in concierge it writes the normal default status
FREE-TIER EDGE: F4 → P11; F5 → P9 query set; F1 → P1
```

## MVP analysis

North star from the [GTM](./02b-gtm.md): **2026 = validate willingness-to-pay + stand up the
machinery, not break even.** That makes the true MVP small.

- **MVP-0 — Priming** (`P1 P2 P3`): show the capacity price for free, instrument the funnel. No
  payment, no schema, no LS account. Lowest risk, ship first.
- **MVP-1 — Concierge charging** (`+ P4 P5 P6 P7`): Payment Link + admin manual-publish + docs.
  The full 2026 system; proves "one real payment + one invoice" with none of the DRAFT/webhook
  complexity.
- **Retention MVP — Slice C** (`R1 R2 R3 R4`): ~~the audience moat, before the Nov flip to cover
  account-hopping~~ — **superseded.** Account-hopping is now closed by the free-tier reshape
  (Track D, [07-free-tier-policy.md](./07-free-tier-policy.md)); the moat is optional growth, not a
  2026 defense.
- **Deferred to 2027, correctly out of MVP:** `P8–P14 P16` (automation) and `R5 R6` (credibility +
  discount). The design defers all of these itself.

**Over-build trap to avoid:** do not build `P8` (DRAFT) for concierge. Concierge publishes via the
admin toggle (`P6`), not a status gate. P8's whole subtree is 2027 work.

## Phase ordering

| Phase | Blocks | Feature plan | When |
|---|---|---|---|
| 0 · Priming | P1 P2 P3 **F1** | [PPC §Phase 0](./04-plan.md) | now |
| 1 · Concierge charging | P4 P5 P6 P7 **F2** | [PPC §Phase 1](./04-plan.md) | 2026 H2 |
| 2 · Retention moat | R1 R2 R3 R4 | [OR §Phase 2](../organizer-retention/04-plan.md) | **descoped** — optional growth |
| 3 · Prep refactor | P15 | [PPC §Phase 3](./04-plan.md) | before Phase 4 |
| 4 · Automation core | P8 P10 P9 P11 P12 **F3 F4 F5 F6** | [PPC §Phase 4](./04-plan.md) | Q1 2027 |
| 5 · Automation completion | P13 P14 P16 | [PPC §Phase 5](./04-plan.md) | Q1 2027 |
| 6 · Credibility + discount | R5 R6 | [OR §Phase 6](../organizer-retention/04-plan.md) | **descoped** (was: after Phase 4) |

Critical path for 2026: **Phase 0 → 1** (now including **F1, F2**). Phase 2 (moat) is descoped;
Phases 3–6 are 2027.

## Decisions still open for the user

1. **Moat timing:** ship Phase 2 *before* the Nov charging flip (recommended — it is the abuse
   defense and is billing-independent) or after?
2. **Rate (`UNIT_RATE`):** not fixed ([GTM](./02b-gtm.md) leaves €0.3 vs €0.5/slot open). Phase 0
   can ship with a placeholder; must be fixed before Phase 1 charges and before Phase 6's discount.

## To verify before planning Phase 4 (claimed in docs, unconfirmed in code)

- Lemon Squeezy API supports a per-checkout `custom_price` (design §resolved-q2).
- The notification system exposes a generic in-app send reusable for `NEW_EDITION` (ideas — "reuses
  the notification system, no new delivery machinery").
