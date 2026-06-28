---
slug: pay-per-competition
stage: gtm
feature: Pay-per-competition organizer billing
issue: null
status: draft
created: 2026-06-21
updated: 2026-06-21
related:
  - docs/features/pay-per-competition/01-problem.md
  - docs/features/pay-per-competition/02-ideas.md
  - docs/features/pay-per-competition/03-design.md
  - docs/explorations/competitions_distribution_results.txt
---

# Go-to-market: Pay-per-competition monetization (Jun–Dec 2026)

This is the **commercial / go-to-market layer** on top of the technical design in
[`03-design.md`](./03-design.md). The design answers *how* organizer billing works; this doc
answers *when, at what price, to whom, and how we validate it*. It deliberately **simplifies the
Q4 build to a concierge MVP** rather than shipping the full automated system in 2026 — it does not
contradict the design, it sequences it.

> **⚠️ Trial reshaped 2026-06-26.** The "1 free competition, forever (full)" trial in the **Trial**
> row, the Phase 2 "1st competition free", and the priming message ("Free, normally €33") are
> **superseded** by [`07-free-tier-policy.md`](./07-free-tier-policy.md): the freebie is now a
> **≤10-slot sandbox**, and the **first real competition shows its real price**. Update priming copy
> and the comms to already-active organizers accordingly.

## Framing decision

**The 2026 goal is to validate willingness-to-pay and stand up the billing machinery — NOT to
break even in 2026.** Infra burn is ~€50/month and currently flat, so the monetary ROI of
charging in 2026 is symbolic. The real return is learning + a working paid model for when volume
scales past the free service tiers. Real revenue is expected in 2027 (organizers' 2nd editions),
not December 2026.

## Locked decisions

| Piece | Decision |
|---|---|
| **What you charge** | Pay-per-competition: `price = RATE × Σ Category.maxParties` (capacity), paid upfront |
| **Why capacity** | Forward proxy of marginal cost: more capacity → more concurrency → tier jumps in infra. Today's cost is flat, but pricing is set for the cost curve about to be hit. |
| **Collection** | Lemon Squeezy (Merchant of Record) — handles IVA + invoice; draft-until-paid removes non-payment risk |
| **Trial** | 1 free competition per organizer, **forever** (applies to both new and already-active organizers) |
| **Q4 build** | **Concierge MVP**: price calculation + Lemon Squeezy Payment Link + admin publishes manually. Full automated system (DRAFT state, webhook, idempotency, refund, auto-invoice, coupons) deferred to **Q1 2027**. |
| **Rate** | Not fixed yet — decided from priming feedback (€0.3 vs €0.5/slot is noise for break-even; choose for value communication / next-tier marginal cost) |
| **Objective** | Validate willingness-to-pay + stand up machinery. **No 2026 break-even.** |
| **Burn to cover** | ~€50/month, fixed (Vercel €20 + Prisma Postgres €10 + Resend €20; Ably/QStash/Cloudinary on free tier) |

## Pricing policy by event type

All grants are made **manually** under the concierge model, which makes them safe (a human judges
genuineness). When automated in 2027 they need a guard — see *Forward caveats*.

- **Standard** (participants pay an entry fee): full rate.
- **Solidarity event where participants still pay**: **reduced** rate (charge something symbolic).
- **Free-to-participants** (municipal / tourism / community): **platform is free** — you
  co-sponsor the event.

> Why not an automated `participantFee == 0 → free` rule: participant entry fees are tracked
> **off-platform** ([`PRODUCT.md:47`](../../PRODUCT.md)), so the platform cannot verify whether an
> event is genuinely free. An automated free rule is therefore trivially gameable (set price 0 in
> the app, collect off-platform). Manual concierge grants sidestep this entirely.

## Calendar

| Phase | When | What |
|---|---|---|
| 0 · Instrument + prime | Jun–Jul | Build only the **capacity price calculation** and show it for free in the create flow (*"Free during launch — normally €X"*). Instrument the funnel in PostHog (`competition created → price shown → reaction`) for a behavior baseline. **No charging.** |
| 1 · Prepare concierge | Aug–Oct | Lemon Squeezy Payment Link + admin **manual-publish** toggle. LS/MoR account ready (IVA + invoice). Communicate the change to organizers with a **value-based** message, not a cost-based one. |
| 2 · Flip | Nov | 1st competition free (publish with no link). From the 2nd on → send Payment Link → on observed payment, publish manually. |
| 3 · Measure | Dec | Read conversion of the few organizers who reach a 2nd event (qualitative — small sample). Collect objections. |

## Price priming (cheap retention lever)

Showing the price for free from July onward — *"Your competition: Free (normally €33)"* — anchors
the future price, measures sticker-shock months ahead, and turns November from a surprise cliff
into something organizers already expected. Near-zero cost (reuses the concierge price
calculation). **Decision: do it.**

## Q4 success criteria (not money)

1. Machinery proven end-to-end: **one real payment + one Lemon Squeezy invoice issued.**
2. **≥1 organizer pays their 2nd competition voluntarily** without churning.
3. A catalogue of **real objections** to iterate price/messaging in 2027.

> Statistical honesty: the Q4 sample is tiny (perhaps 1–3 organizers reach a 2nd event before
> December), so this is a qualitative read. Serious validation continues into 2027.

## Pros / cons (debate synthesis)

**For:** very low validation cost (concierge, days not weeks); zero non-payment risk
(draft-until-paid + MoR); 1-free trial lowers entry friction; capacity is a defensible cost proxy;
priming softens the cliff; price is trivial vs. organizer revenue (<3% of their entry-fee take).

**Against / live risks:** low per-organizer frequency pushes real revenue to 2027; Q4 validation
sample is tiny (qualitative, not statistical); `maxParties` locked after publish can frustrate
under-provisioners; the "free for free events" rule becomes gameable once automated; today's cost
is flat, so 2026 monetary ROI is symbolic — the value is learning and future optionality.

## Evidence base

Competition distribution baseline (lower bound — more events exist without accurate data) from
[`competitions_distribution_results.txt`](../../explorations/competitions_distribution_results.txt):
**~3 known competitions/month**, **average capacity ~110 slots** (range 18–235). At €0.3/slot a
median competition nets ~€31; ~2 paid competitions/month already cover the ~€50 burn. Pricing has
ample headroom — the constraint is volume × the 1-free-forever trial, not the rate.

## Forward caveats (Q1 2027 automation)

- Replace concierge manual-publish with the full [`03-design.md`](./03-design.md) flow
  (DRAFT → webhook → publish) once conversion is validated.
- The free/reduced policy needs an **admin-approval guard** when automated, since off-platform
  fees make a `participantFee == 0 → free` rule abusable.
- Calibrate the rate to the **next infra tier's marginal cost ÷ triggering capacity**, not to
  today's flat €50.
- Watch the 1-free-per-account abuse vector (new accounts to reset the free competition) — accepted
  risk for v1, revisit if it materializes.
