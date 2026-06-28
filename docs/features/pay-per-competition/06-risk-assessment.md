---
slug: pay-per-competition
stage: review
feature: Monetization + organizer moat — risk assessment & red-team
issue: null
status: draft
created: 2026-06-26
updated: 2026-06-26
related:
  - docs/features/pay-per-competition/00-roadmap.md
  - docs/features/pay-per-competition/03-design.md
  - docs/features/pay-per-competition/02b-gtm.md
  - docs/features/pay-per-competition/04-plan.md
  - docs/features/organizer-retention/02-ideas.md
  - docs/features/organizer-retention/04-plan.md
---

# Risk assessment & red-team — Monetization + organizer moat

A deliberately critical review of the pay-per-competition + organizer-retention plan: where the
economics don't hold, how organizers can avoid the fee, and where the plan leaks. Pairs with the
[program roadmap](./00-roadmap.md) and the two `04-plan.md` files. **This is a critique, not a
decision** — it exists to be argued with before Phases 4–6 are committed.

## Facts verified against code (not assumed)

Three findings change the severity of the critique and are grounded in the schema, not the docs:

- **`Competition.id` is `Int @default(autoincrement())`** ([`prisma/schema.prisma:191`](../../../prisma/schema.prisma))
  → unpaid `DRAFT`s sit at sequential, trivially enumerable URLs.
- **`ExternalParticipant` stores only `name`** ([`:308-319`](../../../prisma/schema.prisma)), no
  email/phone → the platform is **not** the contact-of-record for participants.
- **`getAllCompetitions` has zero consumers today** → the design §4.3 decision to leave it
  returning `DRAFT`s is a *latent* landmine, not a live leak.

## Verdict

The **concierge MVP (Phases 0–1) is the right call** — cheapest possible test, reversible, MoR
removes non-payment risk. **Almost everything scoped after it (Phases 4–6) is premature.** Stripped
of narrative, the plan reads: *spend a quarter of engineering to defend ~€31/organizer/year against
attacks the docs themselves cannot close, with a moat that leaks through a channel the platform does
not control.*

## 1. The economics don't justify the build

By the [GTM](./02b-gtm.md)'s own numbers: burn **~€50/mo flat**, ~3 competitions/mo, median fee
~€31, explicit goal **"no 2026 break-even."** Combined with the **1-free-forever** trial and the
**~1 competition/year** organizer cadence, the typical organizer pays once, in *year 2*. So:

- 2026 revenue ≈ €0; the GTM's own validation sample is **"1–3 organizers."** You cannot validate
  willingness-to-pay at n≤3 — that is an anecdote, not data.
- The success criteria ("one real payment, one invoice") prove *the plumbing works*, not *that
  anyone wants to pay*.
- The unanswered question is **lifetime fee revenue vs build + maintenance cost** of DRAFT-state +
  webhook + `CompetitionOrder` + refund + leak-guards + the whole moat. The napkin math says it
  doesn't clear for years. Phases 4–6 are scoped on faith.

## 2. Fee-avoidance playbook (ranked by impact)

### A. Capacity under-declaration — structural
Price = `RATE × Σ maxParties`, but real marginal cost is participant-driven (Resend, Ably, rows),
and entry fees are off-platform — so the organizer needn't have the platform enforce true capacity.
Declare 40 slots, pay for 40, run 150 via waitlist churn or an off-platform overflow sheet. Then
`maxParties` is **locked after publish** (P14), punishing the honest under-provisioner while the
gamer pays less. **The billing base is a self-reported number the organizer is incentivized to
minimize.**

### B. Account-hopping — "defended" by a possibly-hollow moat
Free, minutes of effort. The free-trial counter is **per-account on `creatorId`** — i.e. the reset
button *is* "new account"; defense and exploit are the same primitive. Worse, **R2 "start next
edition" (clone) deletes the one organic switching cost** the problem doc identified ("the only
friction to hopping is re-typing the config") and only helps *within* an account, so it does nothing
to a hopper.

### C. "Free for free events" grant — acknowledged, unfixable
Participant fees are off-platform and **unverifiable**. Declare the event "free," collect entry fees
off-platform, claim the waiver. The GTM says "manual concierge grants sidestep this" — they don't: a
human granting the waiver cannot see off-platform cash. The only defense is the founder personally
knowing every organizer, which dies past the founder's address book. Permanent hole in the pricing
policy, not a v1-acceptable risk.

### D. Refund-and-run — negative-margin attack
Cancel before `startDate` → full refund (P13). Lemon Squeezy is MoR; **processing fees on refunds
are typically not returned to the merchant.** Pay → open registration to assemble the roster →
cancel at T-minus-1-minute → refunded → run off-platform. You eat the LS fee *and* gave the product
away. No cancellation fee is modeled, so the attack is free to the attacker and costs you money each
cycle.

### E. Stale-price checkout
Checkout amount is fixed at creation, but a `DRAFT` stays editable. Create checkout at 40 slots →
edit capacity up to 200 → pay the old, cheaper link. The plan never invalidates prior `PENDING`
orders on edit, and multiple `PENDING` orders per competition leave the webhook ambiguous about
which one publishes.

### F. Free-trial laundering via co-organizers
"First free" is per account. Make the competition's `creator` whichever collaborator still has their
freebie. v1's "only creator pays" makes this trivial — hot-potato the freebie around a small org.

## 3. Technical loopholes in the plan

- **Sequential int IDs + route-load-only DRAFT guard = fragile.** Unpaid drafts are at predictable
  URLs, and competitions are fetched in many places (results, entries, embeds, OG/meta,
  notifications, Ably channels). **One unguarded fetch = leak.** Safe-by-default is query-level
  filtering with a separate explicit admin query; instead the plan keeps a query named
  `getAllCompetitions` that returns `DRAFT`s and documents that every future participant-facing
  caller must remember to filter. Zero consumers today = a tripwire nobody is standing on *yet*.
- **The concierge "system" is a human.** Phase 1 publication = admin reads the LS dashboard and
  flips a toggle — no idempotency, no audit trail, a "the organizer says they paid" race. Fine at
  n=3, but be honest that 2026 validates "can the founder do data entry," not "does the product
  convert."
- **First-free determination is underspecified** and entangled with refunds: did a
  cancelled-and-refunded first competition consume the freebie? (Plan open-Q3.) Interacts with both
  D and B.
- **P15 rename** (`Category.price → participationFee`) is the right cleanup and lowest-risk item —
  ship it separately as the doc says.

## 4. The moat: defending value that may not exist

- **Wrong delivery channel.** `NEW_EDITION` is **in-app only** (ideas doc). Its target did *one
  event a year ago* and hasn't opened the app since — the lowest-frequency user possible. In-app
  reach for that person is near zero. **The moat is delivered through the one channel its targets
  don't check.** If anything keeps, make it email.
- **The organizer can already reach the audience — off-platform.** `ExternalParticipant` has no
  email (verified), so the platform isn't the contact-of-record; but organizers demonstrably have an
  off-platform channel (that's how they collect entry fees and "manually confirm payment",
  [`PRODUCT.md:47`](../../PRODUCT.md)). The auto-invite's unique value is "in-app convenience," not
  "access to an audience otherwise lost." The moat raises friction; it doesn't lock anything.
- **It can't bite until year 2, so its urgency is manufactured.** The hop-to-dodge-the-2nd-year-fee
  vector also can't fire until year 2 (zero prior editions exist in 2026). **Phase 2 could defer
  entirely to 2027 with no downside** — and it's the most expensive non-billing chunk (schema +
  notifications + GDPR).
- **GDPR is a doc task, not a gate.** Auto-linking and notifying participants about a *different*
  (next-year) event on legitimate-interest-with-opt-out is defensible-not-certain, and shaky if any
  participants are **minors** (consent, not legitimate interest, is the norm). Failure mode is a
  fine, not a bug.
- **The renewal discount (R6) is lipstick** the docs concede can't beat free, gated on automation
  that may never pay for itself.

## 5. Credit where due

- **Draft-until-paid + MoR** is the correct risk posture (can't be stiffed; LS owns IVA/invoicing).
- **Webhook-only publication, never trusting the redirect** — correct, and commonly gotten wrong.
- **Concierge-first** is the right, reversible test. The sin is pre-scoping Phases 4–6 against it.
- Design §4 at least *enumerates* the leak surface — most plans don't.

## 6. Recommendations

1. **Stop the committed plan at Phase 1.** Ship priming + concierge. Re-derive Phases 4–6 *only if*
   concierge produces a real paying, non-churning organizer. Today they're speculative inventory.
2. **Defer the entire moat (Phase 2) to 2027.** It can't bite until year 2 and its channel is wrong.
   If you keep one piece, make `NEW_EDITION` an **email**.
3. **Re-examine the billing base.** Capacity is gameable downward and decoupled from real cost.
   Consider pricing on *actual confirmed entries at finish* (post-paid, harder to game). At minimum
   kill field-locking-as-punishment (P14): allow capacity raises and charge the delta.
4. **Add a cancellation fee** (or don't refund the LS processing fee) before building refunds, or
   the refund path is a money-loser (attack D).
5. **Filter `DRAFT` at the query layer**, not the route. Rename `getAllCompetitions →
   getAllCompetitionsIncludingDrafts` so the landmine has a warning label.
6. **Call 2026 qualitative.** Don't present n≤3 as validation in the success criteria.

## Open questions for the user

1. Is there a credible path where lifetime fee revenue exceeds the Phase 4–6 build + maintenance
   cost? If not, do those phases ever get committed?
2. Billing base: keep capacity (simple, gameable) or move to confirmed-entries-at-finish (cost-aligned,
   harder to game)?
3. Moat channel: accept that in-app `NEW_EDITION` under-reaches yearly participants, or switch to
   email (re-opens the GDPR question more sharply)?
