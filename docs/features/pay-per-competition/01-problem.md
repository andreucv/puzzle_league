---
slug: pay-per-competition
stage: problem
feature: Pay-per-competition organizer billing
issue: null
status: draft
created: 2026-06-19
updated: 2026-06-19
related:
  - docs/features/pay-per-competition/02-ideas.md
  - docs/features/pay-per-competition/03-design.md
---

# Pay-per-competition organizer billing — Problem

## Context

The application currently has **no way to charge organizers** for the competitions they
create. Organizers go through the create/edit competition flow under
[`src/routes/(internal)/(auth)/(organizer)/competition/edit/`](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/),
configure categories, and the competition becomes joinable for participants — all for free to
the organizer. The platform absorbs the running cost of every competition (managed Postgres,
Resend mailing, Ably realtime, hosting) with no revenue against it.

The intended business model is **pay-per-competition**: at the end of the create/edit flow a
price is computed from the competition's **capacity**, the organizer pays upfront, and only on
successful payment is the competition published for participants to join.

### Where money words already exist in the product (and what they mean)

This is the most important framing point, because the codebase already speaks about "payment"
and "price" — but for a **different actor and direction of money**:

- [`Category.price`](../../../prisma/schema.prisma) (`prisma/schema.prisma:249`),
  [`TagCategory.priceOverride`](../../../prisma/schema.prisma) (`:289`),
  `Competition.paymentMethod` (`:208`), `Competition.showPaymentWarning` (`:212`), the
  `PAYMENT_REMINDER` notification (`:162`), and `Entry.lastRemindedAt` (`:266`) are all about
  **participant → organizer entry fees**, which are explicitly **tracked off-platform**:
  > "Payments are tracked off-platform: the app stores prices and payment warnings, and
  > organizers manually confirm payment or acceptance." — [`docs/PRODUCT.md:47`](../../PRODUCT.md)

- The feature in this doc is the opposite flow: **organizer → platform billing**, charged
  **on-platform** through a real payment provider. It must not be conflated with, or built on
  top of, the existing participant-fee vocabulary.

## Problem

1. **No organizer-billing concept exists at all.** There is no `Order`/`Payment`/`Invoice`
   model in [`prisma/schema.prisma`](../../../prisma/schema.prisma) and no payment-provider
   integration. Organizer→platform billing is entirely greenfield.

2. **No state to represent "configured but unpaid".** `CompetitionStatus` is
   `NOT_STARTED | STARTED | FINISHED | CANCELLED` (`prisma/schema.prisma:120-125`). Publication
   today is governed by the `registrationOpen` boolean (`:211`) and status, with **no payment
   gate**. There is no `DRAFT` / `PENDING_PAYMENT` / `PUBLISHED` distinction, so "the
   competition stays in draft until payment succeeds" has nowhere to live yet.

3. **No price-from-capacity computation.** Capacity per category already exists as
   `Category.maxParties` (`prisma/schema.prisma:248`) — the natural base for a capacity price —
   but nothing sums it into an organizer-facing total or unit rate. (Note the naming collision:
   `Category.price` is the participant fee, not this.)

4. **No invoicing.** Organizers are businesses and will need a proper IVA `factura` for each
   purchase. Nothing in the system generates invoices today.

## Who it affects & why it matters

- **The platform / business owner** — primary. With no billing, every competition is pure cost
  and the product cannot be monetized. This blocks the entire revenue model discussed for the
  Spanish legal entity (capacity-priced, paid upfront, direct service sale → IVA at point of
  sale).
- **Organizers** — they gain a paid, self-serve publish flow and will need invoices for their
  own accounting/tax.
- **Participants** — indirectly: a competition only becomes joinable after the organizer pays,
  so the unpaid/draft state must not leak a half-published competition to them.

## Constraints / prior ideas

Decisions already taken by the user (carry into design, not up for re-litigation):

- **Pay-per-competition, not a prepaid entry pool.** A direct sale of one competition, not a
  balance of reusable credits. (Legally simpler: no single-purpose-voucher liability; IVA at
  point of sale; one invoice per competition.)
- **Price is computed from capacity, paid upfront.** Capacity is the billing base because it is
  what provisions platform service cost (DB, Resend, etc.) regardless of how many participants
  actually join. Deterministic at purchase time.
- **Draft until paid.** Competition is not published / not joinable until payment succeeds
  (problem #2 above). *Confirmed.*
- **Invoice generation is in scope** as part of (or alongside) this feature.

Prior solution sketch floated by the user (belongs in Stage 2, recorded here so it isn't lost):
*price computed at the end of the create/edit form → payment step → on success, publish.*

## Open questions

Deliberately left open to resolve in **Stage 2 (ideation)** and Stage 3 (design):

1. **Editing after payment.** Once paid and live, what happens when an organizer adds a category
   or raises `maxParties`? Charge the delta, lock priced fields, or allow only non-priced edits?
2. **Refunds & cancellation.** Refund on cancel, or charge at competition start instead of at
   creation? What is the policy when a competition under-fills or the organizer cancels?
3. **Pricing function.** Is it a flat unit rate × total capacity, per-category-type rates, or
   tiered? Is there a free tier / minimum?
4. **State model.** Add explicit `DRAFT`/`PENDING_PAYMENT`/`PUBLISHED` states vs. reuse
   `registrationOpen` + a payment flag — what is the minimal change that gates publication?
5. **Payment provider & invoicing.** Which provider (Stripe is the obvious candidate), and does
   it issue the IVA invoice or do we generate the `factura` ourselves?
