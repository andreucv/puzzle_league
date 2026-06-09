---
slug: how-it-works-guides
stage: plan
feature: How It Works — Participant and Organizer Guides
issue: null
status: approved
created: 2026-06-09
updated: 2026-06-09
related:
  - docs/features/how-it-works-guides/01-problem.md
  - docs/features/how-it-works-guides/02-ideas.md
  - docs/features/how-it-works-guides/03-design.md
---

# Implementation Plan: How It Works — Participant and Organizer Guides

Build two public, step-by-step **component-showcase** guides (`/how-it-works/participant` and
`/how-it-works/organizer`) that embed the real product components in a non-interactive demo state,
plus contextual discovery links. No GitHub issue. Pure presentational work — **no backend change**.

Design: [03-design.md](03-design.md) · Problem: [01-problem.md](01-problem.md) ·
Ideas: [02-ideas.md](02-ideas.md).
Relevant docs: `docs/ARCHITECTURE.md` (route groups / auth guard), `docs/PRODUCT.md`
(participant & organizer workflows, entry statuses, category lifecycle).

## Architecture and design

**Routes (public).** New group `src/routes/(internal)/how-it-works/` with `+layout.svelte`,
`participant/+page.svelte`, `organizer/+page.svelte`. Sits under `(internal)/` (not `(auth)/`), so
no guard applies — mirrors `/for-organizers`. **No `+layout.server.ts` / `+page.server.ts`** (no
data to load). Each page sets its own `<svelte:head>` title + meta.

**New presentational primitives** — `src/lib/components/guide/`:
- `GuideStep.svelte` — props `number: number`, `title: string`, default slot for body. Reuses the
  `Card` + numbered-list aesthetic already in
  [`/for-organizers/+page.svelte`](../../../src/routes/(internal)/for-organizers/+page.svelte).
- `ComponentDemo.svelte` — props optional `caption: string`, default slot. Bordered/`preset-tonal`
  frame; wraps the slot in a `pointer-events-none` container so embedded components are inert.
- `FaqAccordion.svelte` — props `items: { q: string; a: string }[]` (translation keys). Default to
  native `<details>`/`<summary>` (zero-dependency).

**Reused, not rebuilt** (all pure-prop — verified in design §5):
[`EntryRegistrationStatusBadge`](../../../src/lib/components/registration/EntryRegistrationStatusBadge.svelte)
(`status`), [`CompetitionStatusChip`](../../../src/lib/components/common/status/CompetitionStatusChip.svelte)
(`competitionStatus`), [`CategoryRegistrationChip`](../../../src/lib/components/category/CategoryRegistrationChip.svelte)
(`categoryType`, `registrationStatus`), [`Card`](../../../src/lib/components/common/card/Card.svelte).

**i18n.** New **top-level** namespace `how_it_works_guides` in
`src/lib/translations/{en,es,ca}/common.json` (named with the `_guides` suffix to avoid collision
with the existing nested `landing_page.how_it_works` section at en/common.json:83). Sub-groups:
`participant.*`, `organizer.*`, `judges.*`, `account_cta.*`, `cross_link.*`, `faq_participant.*`,
`faq_organizer.*`, plus discovery-CTA strings. All three locales required.

**Discovery touchpoints** (contextual, no main-nav item): landing
[`HowItWorks.svelte`](../../../src/lib/components/landing_page/HowItWorks.svelte) area →
participant guide; [`/for-organizers`](../../../src/routes/(internal)/for-organizers/+page.svelte)
near its CTA → organizer guide; onboarding welcome header
([`onboarding/+page.svelte`](../../../src/routes/(internal)/(auth)/onboarding/+page.svelte) step 0)
→ participant guide; [`Footer.svelte`](../../../src/lib/components/common/layout/Footer.svelte) →
both.

**Auth links.** Plain anchors; deep-link directly and rely on the existing `(auth)` guard redirect.
One static role-agnostic account CTA banner per page → `/login` and `/login?action=register`. No
session-aware branching.

## Tasks

- [ ] **1. i18n scaffolding.** Add the `how_it_works_guides` namespace to
  `src/lib/translations/en/common.json` with all keys (both guides' steps, judges section, FAQs,
  account CTA, cross-link, discovery CTAs). Mirror into `es/common.json` and `ca/common.json`.
- [ ] **2. Guide primitives.** Create `src/lib/components/guide/GuideStep.svelte`,
  `ComponentDemo.svelte`, `FaqAccordion.svelte` per the contracts above.
- [ ] **3. Layout shell.** Create `src/routes/(internal)/how-it-works/+layout.svelte`: centered
  container matching `/for-organizers`, `<slot/>`, and the end-of-page cross-link card (direction
  derived from `$page.url.pathname`).
- [ ] **4. Participant page.** `participant/+page.svelte` — hero, account CTA, 5 `GuideStep`s
  (browse → register → entry status → manage/cancel → results) with `ComponentDemo` blocks
  (all three `EntryRegistrationStatusBadge` states; `CompetitionStatusChip`;
  `CategoryRegistrationChip`), `FaqAccordion`, `<svelte:head>`.
- [ ] **5. Organizer page.** `organizer/+page.svelte` — hero, account CTA, 7-step spine
  (role request → build → categories/pricing → open registration → manage entries → competition
  day → results) emphasising the role-request prerequisite and the NOT_STARTED→LIVE→STOPPED→COMPLETE
  lifecycle, then the distinct **"Working with judges"** section (assign via `manage_judges` +
  judge day-of), `FaqAccordion`, `<svelte:head>`.
- [ ] **6. Discovery touchpoints.** Add the four CTA/links: landing (`HowItWorks.svelte` area),
  `/for-organizers`, onboarding welcome header, `Footer.svelte`.
- [ ] **7. Manual verification** (`/run` or `/verify`): visit both pages **logged out**; confirm
  components render in demo state and are non-interactive; click an auth-gated in-step link and
  confirm the login redirect; toggle `en`/`es`/`ca` and confirm no missing keys; check the four
  discovery entry points navigate correctly.
- [ ] **8. `graphify update .`** to refresh the knowledge graph (no commit).
- [ ] **9. Close-out:** after merge, run **`/feature-doc`** to produce
  `docs/features/how-it-works-guides/05-workflow.md` (completion gate).

## Open questions

1. **Naming the new i18n namespace** — confirm `how_it_works_guides` (vs reusing `how_it_works`
   top-level alongside the nested `landing_page.how_it_works`). Recommended: `how_it_works_guides`
   for clarity.
2. **`FaqAccordion`** — native `<details>` (recommended, zero-dep) vs the `bits_ui` accordion for a
   richer animated interaction.
3. **Copy ownership** — should step/FAQ copy be drafted in this implementation (placeholder-quality,
   refined later) or supplied by you per locale before page work starts?
