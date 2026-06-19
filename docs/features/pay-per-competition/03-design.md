---
slug: pay-per-competition
stage: design
feature: Pay-per-competition organizer billing
issue: null
status: draft
created: 2026-06-19
updated: 2026-06-19
related:
  - docs/features/pay-per-competition/01-problem.md
  - docs/features/pay-per-competition/02-ideas.md
---

# Design: Pay-per-competition organizer billing

Scope: the organizer create/edit flow
[`src/routes/(internal)/(auth)/(organizer)/competition/edit/`](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/),
the competition status model + queries in
[`src/lib/database/db_competition.ts`](../../../src/lib/database/db_competition.ts), and a new
Lemon Squeezy webhook endpoint under
[`src/routes/(internal)/api/`](../../../src/routes/(internal)/api/).
Refs: [docs/ARCHITECTURE.md](../../ARCHITECTURE.md) (request flow, realtime, deployment),
[docs/workflows/registration-workflow.md](../../workflows/registration-workflow.md) (publish vs.
registration), [local QStash cron testing] memory (existing webhook-signature pattern).
Problem: [./01-problem.md](./01-problem.md) · Chosen direction: [./02-ideas.md](./02-ideas.md)

## Problem

Organizers create competitions for free; the platform absorbs every competition's running cost
with no revenue. We want a **pay-per-competition** charge: the organizer configures categories
and per-category capacity, a price is computed from total capacity, they pay **upfront** through
**Lemon Squeezy (Merchant of Record)**, and only on payment success does the competition become
visible and joinable to participants. **Guiding principle:** the smallest change that (a) gates
publication on payment and (b) never lets an unpaid competition leak to participants — leaning on
existing status + query patterns, with Lemon Squeezy owning all tax and invoicing.

## Design

### 1. State model — add `DRAFT`

Add one value to `CompetitionStatus`
([`prisma/schema.prisma:120-125`](../../../prisma/schema.prisma)):

```
DRAFT | NOT_STARTED | STARTED | FINISHED | CANCELLED
```

`DRAFT` = *configured, unpaid, not participant-visible*. Lifecycle:

```
create (organizer)            payment success (LS webhook)
        │                              │
        ▼                              ▼
     DRAFT ───────── pay ──────► NOT_STARTED ──► STARTED ──► FINISHED
        │                              │
        └─ cancel ─► CANCELLED         └─ cancel before startDate ─► CANCELLED (+ LS refund)
```

- A newly created competition is written with `status: DRAFT` (today it relies on the schema
  default `NOT_STARTED`; the organizer create path sets `DRAFT` explicitly instead).
- Existing competitions are unaffected — no backfill; `DRAFT` only applies to ones created after
  this ships.
- `DRAFT` is **upstream of** the existing `registrationOpen` toggle
  ([`:211`](../../../prisma/schema.prisma)): publication (visibility) is gated by leaving `DRAFT`;
  once `NOT_STARTED`, the existing registration-open flow governs joining. The two stay
  orthogonal.
- `updateCompetitionStatus` ([`db_competition.ts:840`](../../../src/lib/database/db_competition.ts))
  signature gains `'DRAFT'`.

### 2. Price computation (capacity-driven)

`enablementPrice = UNIT_RATE × Σ Category.maxParties` over the competition's categories
([`maxParties` at `prisma/schema.prisma:248`](../../../prisma/schema.prisma)). One flat unit rate,
no tiers, no free allowance (per ideation). `UNIT_RATE` and currency (EUR) live in server config
(env). The figure is our **net** price; Lemon Squeezy adds and remits IVA on top at checkout, so
this layer never computes tax. A category with null `maxParties` must be disallowed/treated as
required at the pricing step (capacity is the billing base, so it can't be open-ended).

### 3. Create/edit form → pay → publish

At the end of the create/edit flow the organizer sees a price summary derived from their
categories, then a **Pay & publish** action:

```
┌─ Competition summary ───────────────────────┐
│ 3 categories · total capacity 200 slots     │
│ Enablement price:  200 × €0.50 = €100.00    │
│ (+ IVA handled at checkout by Lemon Squeezy)│
│                          [ Pay & publish ▸ ]│
└─────────────────────────────────────────────┘
```

- **Pay & publish** creates a correlation record (§5), requests a Lemon Squeezy checkout for the
  computed `custom_price` (in cents) with passthrough `custom_data = { competitionId, orderId }`,
  and redirects the organizer to LS's hosted checkout.
- The competition is saved as `DRAFT` *before* redirect, so a closed tab / abandoned checkout
  simply leaves a `DRAFT` the organizer can resume.
- On the organizer's own competition view, a `DRAFT` shows a **Resume payment** affordance; it is
  not yet visible to anyone else.
- **First version: only the `creator` can pay/publish** (resolved open question #1). Co-organizers
  paying is out of scope for v1; the detail-guard allow-list (§4) is therefore `creator` + admin
  only.

### 4. Participant-visibility — the leak surface (critical)

Discovery queries in
[`db_competition.ts`](../../../src/lib/database/db_competition.ts) split in two:

- **Already safe** (explicit status inclusion list — `DRAFT` excluded for free):
  `getUpcomingCompetitions` ([:361](../../../src/lib/database/db_competition.ts)),
  `getNearCompetitions` ([:413](../../../src/lib/database/db_competition.ts)),
  `getOtherUpcomingCompetitions` ([:481](../../../src/lib/database/db_competition.ts)),
  `getPastCompetitions`, and the user-registered/dashboard queries (all status-filtered).
- **Leaking** (no status filter — must exclude `DRAFT`):
  1. `getExploreCompetitionsData` ([:884](../../../src/lib/database/db_competition.ts)) — Explore
     page, `findMany` with no `where`. Add `where: { status: { not: DRAFT } }`.
  2. `getMonthCompetitions` ([:305](../../../src/lib/database/db_competition.ts)) — calendar, only
     a date filter. Add the same exclusion.
  3. `getAllCompetitions` ([:273](../../../src/lib/database/db_competition.ts)) — **intentionally
     returns ALL competitions, including `DRAFT`** (resolved open question #4). It is not a
     participant discovery feed; leave it unfiltered. Any participant-facing surface that happens
     to consume it must do its own `DRAFT` exclusion.
  4. **Single-competition detail** (`getCompetition`, `getCompetitionWithCategories`,
     `getCompetitionWithCategoriesAndEntries`, `getCompetitionResults`) are reached by ID via URL.
     Guard at the **route load**: if the competition is `DRAFT` and the viewer is not its
     `creator` (or an admin), return **404**. (Query stays; authorization is the gate.)
- **Organizer-facing must still show drafts:** `getOrganisedCompetitions`
  ([:345](../../../src/lib/database/db_competition.ts)) is filtered by `creatorId` and must keep
  returning the organizer's own `DRAFT`s so they can resume payment.

### 5. Order correlation record (idempotency + webhook join)

A new lightweight model (named e.g. `CompetitionOrder`; schema work deferred to Stage 4) links a
competition to its Lemon Squeezy order:

| field | purpose |
|---|---|
| `id` | passthrough id sent to LS and returned in the webhook |
| `competitionId` | which competition this payment publishes |
| `lemonSqueezyOrderId` (unique) | idempotency key — a replayed webhook is a no-op |
| `status` (`PENDING`/`PAID`/`REFUNDED`) | order state |
| `amount`, `currency` | audit of what was charged (net) |
| `createdAt`/`updatedAt` | timestamps |

The unique constraint on `lemonSqueezyOrderId` (and the `DRAFT→NOT_STARTED` transition being a
no-op when already published) makes webhook processing idempotent.

### 6. Lemon Squeezy webhook

New endpoint `src/routes/(internal)/api/webhooks/lemonsqueezy/+server.ts` (mirroring the existing
signature-verified webhook pattern used for QStash crons):

- **Verify** the `X-Signature` HMAC-SHA256 against the raw body using the LS signing secret;
  reject otherwise. Add the route to the public/whitelist + CSRF-exempt set as the QStash routes
  are.
- On `order_created` (paid): read `meta.custom_data.{competitionId, orderId}`, look up the
  `CompetitionOrder`, and in one transaction mark it `PAID` and transition the competition
  `DRAFT → NOT_STARTED`. No-op if already `PAID`/non-`DRAFT`.
- On `order_refunded`: mark the order `REFUNDED` (used by §7).
- Publication happens **only** here — never trust the browser redirect back from checkout.

### 7. Cancellation & refund

- Organizer cancels a competition **before `startDate`** → transition to `CANCELLED` and call the
  **Lemon Squeezy refund API** for the correlated order; the `order_refunded` webhook then marks
  the order `REFUNDED`. LS recomputes/returns the IVA.
- Cancel **on/after `startDate`** → `CANCELLED`, **no refund**.
- Reuses the existing `COMPETITION_CANCELLED` notification
  ([`prisma/schema.prisma:155`](../../../prisma/schema.prisma)) to inform participants.
- Edge to handle: participants already joined when refunding a pre-start cancel — they are
  notified via the existing cancellation path; the refund is to the organizer only.

### 8. Editing after publish — lock priced fields

Once `status != DRAFT`, the priced inputs are frozen:

- **Frozen:** the set of categories and each `maxParties` (the billing base).
- **Editable:** non-priced fields — name, description, location, dates, image.
- Enforced **server-side** in the edit action / `updateCompetition`
  ([:789](../../../src/lib/database/db_competition.ts)): reject changes to categories/`maxParties`
  when the competition is not `DRAFT` (the UI also disables those controls). While still `DRAFT`,
  everything is freely editable and the price recomputes.

## Data / model impact

**Deferred to Stage 4 (described, not implemented now):**

- `CompetitionStatus` + `DRAFT` value ([`prisma/schema.prisma:120`](../../../prisma/schema.prisma)).
- New `CompetitionOrder` model (§5).
- **Rename `Category.price` → `participationFee`**
  ([`:249`](../../../prisma/schema.prisma)) — independent prep refactor (touches generated zod +
  all usages); may ship separately from this feature.
- `updateCompetitionStatus` signature gains `'DRAFT'` ([:840](../../../src/lib/database/db_competition.ts)).

**Query/route changes:** add `status: { not: DRAFT }` to `getExploreCompetitionsData`,
`getMonthCompetitions`, and (conditionally) `getAllCompetitions`; add a `DRAFT` authorization
guard to the competition-detail route load. New checkout-creation server action and new LS webhook
route.

**Config:** `UNIT_RATE` (+ currency), LS API key, store/variant id, and webhook signing secret
(server env). `participant` entry fees and `paymentMethod`/`showPaymentWarning` are untouched.

## Out of scope

- Participant entry-fee payments (remain off-platform — [`PRODUCT.md:47`](../../PRODUCT.md)).
- Self-generated `factura`/invoicing (Lemon Squeezy issues it as MoR).
- Delta-billing for capacity increases after publish (locked instead).
- Partial/after-start refunds and proration.
- Auto-expiry/cleanup of abandoned `DRAFT` competitions (possible later cron).
- Subscriptions / capacity plans (explicitly rejected in ideation).

## Resolved questions

All four open questions are resolved (2026-06-19):

1. **Co-organizer payment — NO in v1.** Only the `creator` can pay/publish. The `DRAFT`
   detail-guard allow-list is `creator` + admin. (Folded into §3/§4.)
2. **LS product setup — use dynamic `custom_price`.** The Lemon Squeezy API is expected to
   support a custom price per checkout, so a single "Competition enablement" product is priced
   dynamically per competition. To be confirmed against the live account at setup, but the design
   assumes it.
3. **Abandoned drafts — leave them resumable.** A `DRAFT` persists indefinitely until the
   organizer pays (or deletes it). No cleanup cron in this version; noted as possible future work
   in *Out of scope*.
4. **`getAllCompetitions` — intentionally returns ALL, including `DRAFT`.** It is not a
   participant discovery feed, so it stays unfiltered; consumers that are participant-facing must
   exclude `DRAFT` themselves. (Folded into §4.)

> Design questions are settled. Status remains `draft` until you explicitly approve — say the word
> and I'll set `status: approved` (the gate to Stage 4 / `/feature-plan`).
