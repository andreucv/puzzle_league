---
slug: pay-per-competition
stage: plan
feature: Pay-per-competition organizer billing
issue: null
status: draft
created: 2026-06-26
updated: 2026-06-26
related:
  - docs/features/pay-per-competition/01-problem.md
  - docs/features/pay-per-competition/02-ideas.md
  - docs/features/pay-per-competition/02b-gtm.md
  - docs/features/pay-per-competition/03-design.md
  - docs/features/pay-per-competition/07-free-tier-policy.md
  - docs/features/pay-per-competition/00-roadmap.md
---

# Implementation Plan: Pay-per-competition organizer billing

Charge organizers a capacity-priced fee to publish a competition, paid upfront through Lemon
Squeezy (Merchant of Record). Built in phases per the [program roadmap](./00-roadmap.md): a
**concierge** flow in 2026 (no schema, manual publish) then the **automated** `DRAFT → webhook →
publish` flow in Q1 2027. Behavior is fully specified in [03-design.md](./03-design.md); this plan
is the task breakdown. Block IDs (P1…P16) are defined in the [roadmap](./00-roadmap.md).

**Free-tier policy folded in (F1…F6, [07-free-tier-policy.md](./07-free-tier-policy.md)).** The free
trial is **one ≤10-slot sandbox per account, claimable anytime** — real events (`Σ maxParties > 10`)
pay from edition 1. This reshape closes the account-hopping vector at the source, so the
organizer-retention moat is descoped as a defense ([organizer-retention/04-plan.md](../organizer-retention/04-plan.md)).
Its concierge bits are **wording + a manual record** (woven into P2/P5/P7); its real machinery
(counter, checkout bypass, sandbox listability, waitlist-obscuring) is **Q1 2027 automation**, since
at concierge volume (n≈1–3, manual publish) the harvest/listing risks can't fire and the roadmap
keeps concierge schema-free.

## Architecture and design

- **Scope surfaces:** the organizer create/edit flow
  [`src/routes/(internal)/(auth)/(organizer)/competition/edit/`](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/),
  competition status + queries in
  [`src/lib/database/db_competition.ts`](../../../src/lib/database/db_competition.ts), a new LS
  webhook under [`src/routes/(internal)/api/`](../../../src/routes/(internal)/api/), and the
  organizer guide [`how-it-works/organizer/+page.svelte`](../../../src/routes/(internal)/how-it-works/organizer/+page.svelte).
- **Two-phase strategy:** concierge (Phases 0–1) is pure application code + an external LS Payment
  Link + an admin toggle — **no schema, no DRAFT, no webhook**. Automation (Phases 4–5) adds the
  `DRAFT` state model, `CompetitionOrder`, the webhook, refund, and field-locking. See the
  [roadmap MVP analysis](./00-roadmap.md) for why DRAFT must not leak into the concierge phase.
- **Money direction:** this is organizer → platform, on-platform, taxed by LS. It must not be
  conflated with the existing participant → organizer entry fees (`Category.price`,
  `paymentMethod`, `PAYMENT_REMINDER`) tracked off-platform ([01-problem.md](./01-problem.md)).
- **Free-tier surfaces (F1…F6):** the `≤10` gate reuses P1's capacity sum (no new calc). The 2027
  machinery touches: a new `User.freeCompetitionUsedAt` counter; the checkout action (P11) which the
  free path **bypasses** (publish directly, no `CompetitionOrder`); a new `Competition.listed`
  boolean filtered into the discovery feeds (the same query set as P9, plus the status-filtered
  upcoming/near feeds — an unlisted sandbox is `NOT_STARTED` so it would otherwise show); and the
  **organizer entries data source** — gate it once so the `manage_registrations` UI
  ([`RegistrationList.svelte`](../../../src/lib/components/manage_registrations/RegistrationList.svelte)),
  the entries APIs ([`/api/competitions/[id]/entries`](../../../src/routes/(internal)/api/competitions/[id]/entries/+server.ts),
  [`/api/categories/[id]/entries`](../../../src/routes/(internal)/api/categories/[id]/entries/+server.ts)),
  `getWaitlistPositions` ([`db_entry.ts:121`](../../../src/lib/database/db_entry.ts)), and the PDF
  export ([`pdf_registrations.ts`](../../../src/lib/utils/pdf_registrations.ts)) all inherit the
  waitlist-obscuring (F6) rather than patching each view.

## Tasks

### Phase 0 — Priming (P1 · P2 · P3) — no schema, ship first

- [ ] **P1 — Capacity price calc.** Add `enablementPrice = UNIT_RATE × Σ Category.maxParties` over
  a competition's categories ([`maxParties` `prisma/schema.prisma:248`](../../../prisma/schema.prisma)).
  One flat unit rate, no tiers, no free allowance. Put `UNIT_RATE` + currency (EUR) in server env
  config. Treat a category with null `maxParties` as a pricing error (capacity is the billing base).
  - [ ] Co-locate as a pure function (testable, reused by Phases 1 & 4); leave one runnable assert
    check (e.g. 3 categories × known capacities → expected total).
  - [ ] **F1 — free-eligibility helper.** From the same sum expose `isFreeEligible = Σ maxParties ≤
    10` (the free-sandbox gate, [07](./07-free-tier-policy.md)). One comparison; assert both sides of
    the boundary (10 → true, 11 → false).
- [ ] **P2 — Show price (free priming).** At the end of the create/edit flow render the price
  summary from the organizer's categories with launch wording (design §3). Display only — no charge,
  no gate. **Free-tier wording ([07](./07-free-tier-policy.md)):** a `≤10` competition shows *free
  (test sandbox)*; a `>10` competition shows its **real price from edition 1** (not "first one
  free"). The priming copy is value-based, not "1 free real competition."
  - [ ] **Launch-grace framing (MVP decision, 2026-06-28).** Phase 0 ships before any charge exists
    (P5 is Phase 1), so the `>10` card states the estimated fee plus an explicit free window —
    *"Free to organize competitions until November 2026. After that, real competitions are charged
    from the first one."* This replaced an earlier contradictory "Free during launch." next to
    "charged from your first one." Final card copy: a maintenance-cost `explainer` under the title,
    and a *"Limited-time offer"* badge (`offer_label`) over the dated free window (`launch_free`) +
    `after_offer` ("After that, this fee applies."). The date lives in the `pricing.launch_free`
    i18n key; if the payment-platform date slips, update those three locale strings.
- [ ] **P3 — Funnel instrumentation.** Emit PostHog events for `competition created → price shown →
  reaction` to baseline behavior (GTM Phase 0). Reuse the existing PostHog server/client setup.

### Phase 1 — Concierge charging (P4 · P5 · P6 · P7) — no schema

- [ ] **P4 — Lemon Squeezy setup (external, do first).** Create the LS store + a single
  "Competition enablement" product priced via per-checkout `custom_price`. **Confirm the live
  account supports `custom_price`** ([roadmap "to verify"](./00-roadmap.md); design §resolved-q2).
  Record store/variant id + API key in server env.
- [ ] **P5 — Payment Link generation.** From the price summary, generate an LS Payment Link for the
  computed amount (concierge: link is sent to the organizer, not an automated checkout redirect —
  that is Phase 4's P11).
  - [ ] **F2 — free-sandbox decision + manual record.** A competition gets **no link** only when it
    is `isFreeEligible` (`≤10`) **and** the organizer's free sandbox is unused. Everything else
    (`>10`, or `≤10` after the freebie is spent) gets a link. In concierge there is **no schema** —
    track the freebie in the manual `free_sandbox_used` record (one sheet keyed by organizer email)
    per the [07 concierge procedure](./07-free-tier-policy.md#concierge-manual-procedure-2026);
    on cancel of an unused sandbox, delete the row (freebie returns).
- [ ] **P6 — Admin manual-publish toggle.** Admin-only control to publish a configured competition
  once payment is observed. This is the concierge publication gate (replaces the automated webhook).
  Reuse existing admin authorization.
- [ ] **P7 — Organizer docs page (concierge wording).** Add a "Publishing your competition" section
  to [`how-it-works/organizer/+page.svelte`](../../../src/routes/(internal)/how-it-works/organizer/+page.svelte)
  with four `level={3}` `GuideStep`s + 2–3 FAQ items, exactly per design §9. **Concierge copy only**
  — no DRAFT/instant-publish promises. New `how_it_works_guides.organizer.publishing.*` + `faq.*`
  keys in all three locales (`en`/`es`/`ca`). i18n + markup only.
  - [ ] **Free-tier wording ([07](./07-free-tier-policy.md)):** the "free" step describes a **≤10-slot
    test sandbox to try the product**, and states real competitions pay **from the first one** — not
    "your first competition is free." Mirror the correction flagged in [design §9](./03-design.md).
    Add an FAQ item *"Is there a free option?"* → the sandbox.

### Phase 3 — Prep refactor (P15) — schema; before Phase 4

- [ ] **P15 — Rename `Category.price → participationFee`**
  ([`prisma/schema.prisma:249`](../../../prisma/schema.prisma)). Independent refactor that removes
  the money-word collision before automation lands. Touches the generated zod + all usages; ships
  on its own. Migration is a column rename (no data change).

### Phase 4 — Automation core (P8 · P10 · P9 · P11 · P12) — schema; Q1 2027

- [ ] **P8 — `DRAFT` state model (design §1).** Add `DRAFT` to `CompetitionStatus`
  ([`prisma/schema.prisma:120-125`](../../../prisma/schema.prisma)). Organizer create path writes
  `status: DRAFT` explicitly. No backfill — existing competitions unaffected. Extend
  `updateCompetitionStatus` ([`db_competition.ts:840`](../../../src/lib/database/db_competition.ts))
  to accept `'DRAFT'`. `DRAFT` is upstream of and orthogonal to `registrationOpen`.
- [ ] **P10 — `CompetitionOrder` model (design §5).** New model: `id`, `competitionId`,
  `lemonSqueezyOrderId` (**unique** — idempotency key), `status` (`PENDING|PAID|REFUNDED`),
  `amount`, `currency`, timestamps.
- [ ] **P9 — Participant-visibility leak fixes (design §4 — critical).**
  - [ ] Add `where: { status: { not: DRAFT } }` to `getExploreCompetitionsData`
    ([`db_competition.ts:884`](../../../src/lib/database/db_competition.ts)) and
    `getMonthCompetitions` ([`:305`](../../../src/lib/database/db_competition.ts)).
  - [ ] Leave `getAllCompetitions` ([`:273`](../../../src/lib/database/db_competition.ts))
    **unfiltered** (intentional — not a discovery feed; design §4.3).
  - [ ] Add a `DRAFT` authorization guard at the **single-competition detail route load**: if
    `DRAFT` and viewer is not `creator` (or admin) → **404**. Covers `getCompetition`,
    `getCompetitionWithCategories`, `getCompetitionWithCategoriesAndEntries`,
    `getCompetitionResults`.
  - [ ] Confirm `getOrganisedCompetitions` ([`:345`](../../../src/lib/database/db_competition.ts))
    still returns the organizer's own `DRAFT`s (resume payment).
- [ ] **P11 — Checkout-creation action (design §3).** "Pay & publish" creates a `PENDING`
  `CompetitionOrder`, requests an LS checkout for `custom_price` (cents) with
  `custom_data = { competitionId, orderId }`, saves the competition as `DRAFT`, then redirects to
  LS hosted checkout. **First version: only `creator` can pay/publish** (design §resolved-q1).
- [ ] **P12 — LS webhook (design §6).** New
  `src/routes/(internal)/api/webhooks/lemonsqueezy/+server.ts` mirroring the QStash
  signature-verified pattern ([local QStash cron testing] memory). Verify `X-Signature` HMAC-SHA256
  against the raw body; add the route to the public/whitelist + CSRF-exempt set. On `order_created`:
  in one transaction mark the order `PAID` and transition the competition `DRAFT → NOT_STARTED`;
  no-op if already `PAID`/non-`DRAFT`. **Publication happens only here** — never trust the browser
  redirect.

### Phase 5 — Automation completion (P13 · P14 · P16) — Q1 2027

- [ ] **P13 — Cancellation + refund (design §7).** Cancel **before `startDate`** → `CANCELLED` +
  call the LS refund API for the correlated order; `order_refunded` webhook marks the order
  `REFUNDED`. Cancel **on/after `startDate`** → `CANCELLED`, no refund. Reuse the existing
  `COMPETITION_CANCELLED` notification ([`prisma/schema.prisma:155`](../../../prisma/schema.prisma)).
- [ ] **P14 — Lock priced fields after publish (design §8).** When `status != DRAFT`, reject changes
  to the category set and each `maxParties` server-side in the edit action / `updateCompetition`
  ([`db_competition.ts:789`](../../../src/lib/database/db_competition.ts)); disable those controls in
  the UI. Non-priced fields (name, description, location, dates, image) stay editable.
- [ ] **P16 — `DRAFT` chip + docs rewrite (design §9 deferred).** Add a `DRAFT` case to
  [`CompetitionStatusChip.svelte`](../../../src/lib/components/common/status/CompetitionStatusChip.svelte)
  (today an unknown status falls through to the "upcoming" default, `:19-22`). Rewrite the §9 docs
  section from concierge wording to the automated `DRAFT → webhook → publish` lifecycle; add the
  `ComponentDemo` of the `DRAFT → NOT_STARTED` transition; add refund/cancel + field-locking FAQ.

### Free-tier automation (F3 · F4 · F5 · F6) — schema; Q1 2027

Replaces the manual `free_sandbox_used` record with code once self-serve drafts exist. Depends on
P8 (`DRAFT`) and P11 (checkout action). See [07-free-tier-policy.md](./07-free-tier-policy.md).

- [ ] **F3 — `User.freeCompetitionUsedAt` counter.** Add the nullable column
  ([`prisma/schema.prisma`](../../../prisma/schema.prisma)); no backfill. Set when a `≤10` competition
  publishes under the grant; **null ⇒ freebie available**. Cancelling/deleting an *unused* sandbox
  clears it back to null (returns the freebie — [07](./07-free-tier-policy.md) resolved-Q2).
- [ ] **F4 — Free path bypasses checkout.** In the P11 "Pay & publish" action, when `isFreeEligible`
  (F1) **and** `freeCompetitionUsedAt == null`: skip LS entirely — no `CompetitionOrder`, publish
  directly (`DRAFT → NOT_STARTED`) and stamp `freeCompetitionUsedAt`. Otherwise the normal P11/P12
  paid flow. A `>10` sandbox or a spent freebie always pays.
- [ ] **F5 — Sandbox listability flag.** Add `Competition.listed` boolean (default `true`; free
  sandbox written `false`, organizer can toggle). Filter `listed: true` into the discovery feeds —
  **the P9 query set plus the status-filtered upcoming/near feeds** (`getUpcomingCompetitions`,
  `getNearCompetitions`, `getOtherUpcomingCompetitions`), because an unlisted sandbox is
  `NOT_STARTED` and would otherwise surface there. Direct-link/detail access is unaffected. (Schema +
  query filter — independent of billing; could ship earlier if wanted, see open-Q3.)
- [ ] **F6 — Obscure waitlist on free competitions.** Gate the **organizer entries data source** so
  `WAITLISTED` entries (and their identities/positions) are not returned for a free sandbox — one
  guard inherited by `manage_registrations`
  ([`RegistrationList.svelte`](../../../src/lib/components/manage_registrations/RegistrationList.svelte)),
  the entries APIs ([`competitions/[id]/entries`](../../../src/routes/(internal)/api/competitions/[id]/entries/+server.ts),
  [`categories/[id]/entries`](../../../src/routes/(internal)/api/categories/[id]/entries/+server.ts)),
  `getWaitlistPositions` ([`db_entry.ts:121`](../../../src/lib/database/db_entry.ts)), and the PDF
  export ([`pdf_registrations.ts`](../../../src/lib/utils/pdf_registrations.ts)). Organizer may still
  see a waitlist count, never the names. Paid competitions unchanged. (Closure is identity-hiding,
  **not** purging — [07](./07-free-tier-policy.md) resolved-Q1.)

### Manual verification & close-out

- [ ] **Verify (per phase).** Use `/run` or `/verify`: Phase 0 — price + free-sandbox/real-price
  wording shows correctly for a `≤10` vs `>10` config; Phase 1 — a `≤10`-first organizer gets no
  link, a `>10` (or second `≤10`) organizer gets a link; Phase 4 — free path publishes with no
  `CompetitionOrder`, an unlisted sandbox is absent from Explore/calendar/upcoming but reachable by
  link, and its waitlist names are hidden in `manage_registrations` + PDF.
- [ ] **`graphify update .`** after each code-changing phase to keep the graph current.
- [ ] **Close-out:** run **`/feature-doc` (Stage 5)** once merged → `05-workflow.md`.

## Open questions

1. **`UNIT_RATE` value** — €0.3 vs €0.5/slot still open (GTM). Phase 0 can ship a placeholder; must
   be fixed before Phase 1 charges.
2. **Concurrent admin publish (Phase 1)** — does the concierge manual-publish need any guard against
   double-publish, or is admin-only + low volume enough until the webhook idempotency lands in P12?
3. **Pull F5 listability forward?** The sandbox `listed` flag is schema but billing-independent
   (like P15). Ship it with Phase 4 automation (lean — that's when self-serve sandboxes exist), or
   earlier so even concierge sandboxes can be hidden from discovery?
4. **Concierge `free_sandbox_used` home** — a plain shared sheet (07's lean), or worth an admin
   notes field on the user so it lives in-product before F3 lands?
