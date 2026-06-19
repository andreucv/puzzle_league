---
slug: pay-per-competition
stage: ideas
feature: Pay-per-competition organizer billing
issue: null
status: draft
created: 2026-06-19
updated: 2026-06-19
related:
  - docs/features/pay-per-competition/01-problem.md
  - docs/features/pay-per-competition/03-design.md
---

# Pay-per-competition organizer billing — Ideas

Problem: [docs/features/pay-per-competition/01-problem.md](./01-problem.md)

## Settled parameters (decided during ideation — not up for re-litigation)

These came out of the Stage-2 dialogue and constrain every candidate below:

- **Model:** pay-per-competition (one direct sale per competition), not a prepaid entry pool.
- **Billing base:** **capacity** = Σ `Category.maxParties` across the competition's categories
  ([`prisma/schema.prisma:248`](../../../prisma/schema.prisma)). This is the *competition
  enablement price*.
- **Pricing function:** **flat unit rate × total capacity** (e.g. `UNIT_RATE × Σ maxParties`).
  No per-type rates, no tiers — one tunable number.
- **Free tier:** **none.** Every published competition is charged from the first slot.
- **Capture timing:** **upfront at creation.** Full charge when the form is completed; the
  competition publishes only on payment success.
- **Payment provider:** **Lemon Squeezy as Merchant of Record (MoR).** *Decided by the user.*
  This is the initial setup that unblocks taking payments when implementation begins.
- **Invoicing:** **handled by Lemon Squeezy, not by us** (see tax section below). We do **not**
  build a self-generated `factura` feature — the MoR issues the buyer's tax-compliant invoice.

### Terminology decisions (schema change DEFERRED to Stage 4 — do **not** touch code yet)

- The organizer→platform charge is the **competition enablement price** (a new concept).
- **Rename `Category.price` → `participationFee`** ([`prisma/schema.prisma:249`](../../../prisma/schema.prisma))
  to free the word "price" and make clear it is the *participant* fee, distinct from enablement.
- A **new `CompetitionStatus` value** is required for the configured-but-unpaid state
  (current enum lacks it: `NOT_STARTED | STARTED | FINISHED | CANCELLED`,
  [`prisma/schema.prisma:120-125`](../../../prisma/schema.prisma)).

> The rename, the new status, and any new models are recorded here as agreed decisions only.
> Per the user's instruction ("I don't want to drive this to code still"), the actual schema
> and code changes happen in **Stage 4 (plan/implementation)**, not now.

## Tax & invoicing environment (Spain, with Lemon Squeezy as MoR)

Choosing a **Merchant of Record** changes who is legally the seller, and it removes most of the
Spanish tax/invoicing burden this feature was going to carry. How it works:

- **Lemon Squeezy is the reseller of record.** When an organizer pays, they are legally buying
  from Lemon Squeezy, who then pays us a **payout**. We are not the seller to the organizer.
- **LS collects, files, and remits VAT/IVA** in 100+ jurisdictions, determining the rate from
  the buyer's billing address/IP. For a Spanish organizer that means LS charges and remits the
  **21% IVA**; for EU-business buyers LS handles VAT-ID validation and reverse charge. *We do no
  per-sale tax procedures*, and "if a tax authority has an issue, they're on the hook, not us."
- **LS issues the buyer's tax-compliant invoice.** During onboarding we provide our business
  details and tax ID so the invoices LS issues are valid. → **This deletes the self-generated
  `factura` sub-feature** that Stage-1/2 had flagged as legally load-bearing.
- **Our side of the money is the payout, not the end sale.** LS deducts any sales tax (and its
  fee) from each payout. For every payout LS auto-generates a **"reverse invoice"** (a
  recipient-created/self-billed record), so **we do not invoice LS per payout**; we can stamp our
  business name/address/tax number via LS's "Payout invoice info" field.

What this still requires of us (carry to design, and connects to the earlier juridical-figure
discussion):

1. **A registered Spanish entity to receive payouts.** Payouts from LS are **business income** we
   must declare in Spain — IRPF via *modelo 130* (autónomo) or Impuesto sobre Sociedades (SL).
   The MoR removes IVA-charging duties, **not** the need to be a legally registered business and
   to declare the income. This reinforces the SL-vs-autónomo decision from the opening chat.

   > **Note:** registering as autónomo is **not needed if the payments are not regular and they
   > do not reach the *Salario Mínimo Interprofesional* (SMI).** Under the established
   > interpretation, sporadic, non-habitual income below the SMI does not trigger the obligation
   > to register in RETA (income must still be declared in IRPF). Once payouts become
   > regular/habitual or exceed the SMI, registration is required — confirm the threshold and
   > your situation with the asesor fiscal.
2. **Confirm the developer→LS leg with an asesor.** LS is a US entity (now part of Stripe); the
   payout is foreign-sourced income. The exact reporting (and whether the "reverse invoice"
   suffices as our income record) should be confirmed with the asesor fiscal — but it is an
   **accounting** matter, not something this feature builds.

**Net effect on scope:** invoicing/`factura` generation drops out of this feature entirely;
what remains for us to build is the *checkout + publish-gating + draft state* mechanics.

## Candidate directions

### A — Lemon Squeezy (MoR) checkout, capacity-priced, gating publish (RECOMMENDED)

**What:** At the end of the create/edit flow, compute `UNIT_RATE × Σ maxParties` and send the
organizer to a **Lemon Squeezy checkout** for that amount. The competition sits in a new
**`DRAFT`** status — configured, not visible/joinable to participants. On payment success (LS
`order_created` webhook) it transitions to `NOT_STARTED` (the existing "published, upcoming,
joinable" state). **No invoice generation on our side** — LS issues the buyer's IVA invoice.
**Data/powered by:** capacity from `Category.maxParties`; new `DRAFT` value on
`CompetitionStatus`; a lightweight `Order`/`Payment` record to correlate the LS order with the
competition and make the webhook idempotent; existing publish semantics (`status` +
`registrationOpen`, [`:200`,`:211`](../../../prisma/schema.prisma)).
**Effort:** Medium (MoR removes tax + invoicing; the work is checkout creation, the webhook, and
the draft/publish gate).
**Trade-off:** Higher per-sale fee than a raw PSP (MoR premium) in exchange for zero tax/invoice
liability and far less to build. Still need webhook idempotency and a defined refund path later.

### B — Manual / off-platform enablement (admin flips after bank transfer)

**What:** Reuse the existing "payments are off-platform" pattern
([`docs/PRODUCT.md:47`](../../PRODUCT.md)): organizer requests publish, pays by transfer, an
admin manually moves the competition out of `DRAFT`.
**Data/powered by:** just the new `DRAFT` status + an admin action; no provider integration.
**Effort:** Quick.
**Trade-off:** No self-serve, no automatic invoice, manual ops per competition — does not scale
and defeats the point of a productized billing flow. Useful only as a stopgap.

### C — Subscription / seat plan instead of per-competition

**What:** Organizers pay a recurring plan for a capacity allowance across many competitions.
**Effort:** High.
**Trade-off:** Explicitly **rejected** — the user chose pay-per-competition over a pool/plan.
Recorded only to mark it as considered and out of scope.

## Recommendation

**Direction A.** It is the only option consistent with the settled parameters (capacity-priced,
upfront, self-serve). B is worth keeping in mind as a manual fallback if the provider integration
slips, but it is not the target.

Provider: **Lemon Squeezy (MoR)** — decided. The MoR model is what makes A the *lower*-effort
option now: tax handling and the organizer's invoice come for free, leaving only checkout +
webhook + draft-gating to build.

## Sub-decisions to resolve in design (Stage 3)

1. **State model — recommended shape.** Add a single **`DRAFT`** value to `CompetitionStatus`
   meaning *configured, unpaid, not participant-visible*. Payment success: `DRAFT → NOT_STARTED`.
   YAGNI on a separate `PENDING_PAYMENT` state — the unpaid competition simply stays `DRAFT`
   until the Lemon Squeezy webhook confirms; failed/abandoned payment leaves it `DRAFT`. Design must
   confirm this minimal model vs. a separate payment-state field, and ensure `DRAFT` is excluded
   from every participant-facing query (discovery, details, registration).

2. **Invoicing — resolved by the MoR choice.** Lemon Squeezy issues the organizer's
   tax-compliant IVA invoice; we build no `factura` feature. Remaining design touchpoints are
   small: (a) surface/link the LS receipt to the organizer in our UI if desired, and (b) make
   sure our LS account onboarding carries our business tax ID so issued invoices are valid. The
   only *open* item is an accounting one (how we record LS payouts in Spain), out of scope for
   this feature.

3. **Editing after payment — open (user leans "lock priced fields").** Leading option: after
   publish, freeze categories + `maxParties`; allow only non-priced edits (description, location,
   image, dates). Alternatives (charge-delta on increase; full delta both ways) reintroduce
   billing/refund complexity and are deferred. Design picks one.

4. **Refunds / cancellation — open (deferred from problem).** With upfront capture, a
   `CANCELLED` competition implies a possible refund. Policy undecided: no refund, full refund,
   or time-boxed. Design must at least state the policy even if implementation is later.

5. **Pricing config.** Where `UNIT_RATE` lives (env/config/admin-editable). Note IVA is **not**
   our concern at this layer: `UNIT_RATE × Σ maxParties` is our net price, and Lemon Squeezy adds
   and remits the applicable IVA on top at checkout. Design only needs to decide how `UNIT_RATE`
   maps to a Lemon Squeezy product/variant (fixed variant vs. custom/dynamic price per checkout).

## Open questions for design

- Exact `DRAFT`-state query exclusions and how the edit form distinguishes "new draft" vs
  "editing a published competition".
- Webhook idempotency / what happens if the organizer closes the tab mid-payment.
- Whether `participationFee` rename ships in the same change set or as a separate prep refactor.
