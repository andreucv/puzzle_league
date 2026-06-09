---
slug: how-it-works-guides
stage: ideas
feature: How It Works — Participant and Organizer Guides
issue: null
status: draft
created: 2026-06-09
updated: 2026-06-09
related:
  - docs/features/how-it-works-guides/01-problem.md
  - docs/features/how-it-works-guides/03-design.md
  - docs/features/how-it-works-guides/04-plan.md
---

# How It Works — Participant and Organizer Guides — Ideas

Problem: [docs/features/how-it-works-guides/01-problem.md](01-problem.md)

## Decisions taken in ideation

Captured from the brainstorming dialogue so design starts from a fixed footing:

- **Fidelity — component-showcase.** Steps embed the *real* Svelte components in a
  non-interactive demo state so the guide stays visually identical to the live product. The
  reusable building blocks already exist:
  [`EntryRegistrationStatusBadge.svelte`](../../../src/lib/components/registration/EntryRegistrationStatusBadge.svelte)
  (CONFIRMED / PENDING_CONFIRMATION / WAITLISTED),
  [`CompetitionStatusChip.svelte`](../../../src/lib/components/common/status/CompetitionStatusChip.svelte),
  [`CategoryRegistrationChip.svelte`](../../../src/lib/components/category/CategoryRegistrationChip.svelte),
  and the common [`Card`](../../../src/lib/components/common/card/Card.svelte) used by
  [`/for-organizers`](../../../src/routes/(internal)/for-organizers/+page.svelte).
- **Scope — core participant + organizer + judge.** Participant journey (browse → register →
  read status → results) and organizer journey (role request → build → manage entries →
  competition day → results), **plus** a judge sub-section inside the organizer guide.
  *Out of scope for v1:* the External Participant (register-on-behalf-of) flow.
- **Discovery — contextual, not main-nav.** Entry via CTAs on the landing page and the existing
  `/for-organizers` page, a prompt in the post-signup
  [onboarding](../../../src/routes/(internal)/(auth)/onboarding/) flow, and
  [footer](../../../src/lib/components/common/layout/Footer.svelte) links. No top-level nav item.
- **Routing — public sibling pages.** `/how-it-works/participant` and `/how-it-works/organizer`
  live directly under `src/routes/(internal)/` (the auth guard only wraps `(internal)/(auth)/`),
  so they are reachable pre-login, exactly like `/for-organizers`.

The directions below differ on **how the showcase content is structured and reused**, not on
the decisions above.

## Candidate directions

### Option A — Inline real components per page (lean)
**What:** Two standalone `+page.svelte` routes. Each imports the real product components and
renders them with literal demo props inline between numbered step blocks (same hand-rolled
`Card` + numbered-list markup that `/for-organizers` already uses). No shared layout, no new
abstractions.
**Data/powered by:** Existing status/badge/chip components rendered with hardcoded props; all
copy in `en`/`es`/`ca` translation namespaces.
**Effort:** Quick–Medium.
**Trade-off:** Step/FAQ scaffolding and the "demo frame" styling are duplicated across the two
(soon three-section) pages. Any product component that assumes server/page data won't render
cleanly, and each page solves that individually.

### Option B — Shared guide primitives under a layout group (recommended)
**What:** Add a small `src/lib/components/guide/` set — `GuideStep` (numbered step block),
`ComponentDemo` (a labelled, non-interactive frame that showcases a real product component),
and `FaqAccordion` — and a `src/routes/(internal)/how-it-works/+layout.svelte` providing shared
chrome (hero shell, consistent spacing, cross-link between the two guides). Both pages compose
the primitives; every live component appears wrapped in one `ComponentDemo`.
**Data/powered by:** Same real components as Option A, but the "render a product component safely
in demo state" concern is isolated in `ComponentDemo`; translation keys per guide namespace.
**Effort:** Medium.
**Trade-off:** A bit more upfront scaffolding than A. Pays off immediately: DRY across both
pages, consistent visuals, a single place to handle demo-state rendering, and clean room for the
judge sub-section to slot into the organizer page.

### Option C — Config-driven guide template
**What:** Represent each guide as a data array of steps (`{ icon, titleKey, bodyKey,
demoComponent? }`) rendered by one generic template — the natural evolution of the
`setupFeatures`/`registrationFeatures` arrays already in `/for-organizers`.
**Data/powered by:** Step metadata arrays + translation keys; a registry mapping step entries to
demo components.
**Effort:** Medium.
**Trade-off:** Very DRY for *uniform* steps, but the component-showcase requirement wants varied,
sometimes multi-component demos mid-step (e.g. three status badges side by side, or a Card next
to a chip). Expressing rich/variadic demos as flat config gets awkward fast and pushes logic
into a registry — fighting the very requirement we just committed to.

## Recommendation

**Option B — shared guide primitives under a `/how-it-works/` layout group.** It is the best fit
for the chosen component-showcase fidelity: `ComponentDemo` gives one home for the "show a real
product component without its live data" problem instead of re-solving it per page, while
`GuideStep`/`FaqAccordion` keep the two sibling pages and the judge sub-section visually
consistent without copy-paste. It stays simple (three small presentational components, no data
layer) and mirrors the existing `/for-organizers` aesthetic. Option A is the fallback if design
finds the product components render trivially with literal props and the duplication is small.
Option C is rejected: config-driven flattening conflicts with embedding arbitrary real
components mid-step.

**Explicitly discarded earlier:** static screenshots (loses the always-matches-live-UI benefit)
and an interactive product tour/coachmark overlay (over scope for first launch).

## Open questions for design

1. **Shared layout shape (problem Q5).** Option B introduces a `+layout.svelte` — should it carry
   a visible tab/segmented switcher between the two guides, or only invisible shared chrome plus
   an inline cross-link? The problem insists the pages are *siblings, not nested tabs*, so a tab
   bar that frames them as one thing needs a deliberate call.
2. **Demo-state rendering contract.** What does `ComponentDemo` guarantee — does it disable links
   and pointer events, and do the embedded components need a "presentational" prop path, or do
   they already render from plain props without server data? Design must audit each showcased
   component (`EntryRegistrationStatusBadge`, `CompetitionStatusChip`, `CategoryRegistrationChip`,
   `Card`).
3. **In-guide links to authenticated routes (problem Q2).** When a step points at a dashboard or
   registration page behind auth, do we deep-link (relying on the auth redirect) or show an inline
   "sign in first" affordance?
4. **Judge sub-section placement.** Is the judge workflow a distinct numbered section within the
   organizer page, or a collapsible aside? Affects the organizer page's information architecture.
5. **Translation namespace layout.** One namespace per guide (`how_it_works_participant` /
   `how_it_works_organizer`) vs a shared `how_it_works` tree — to be settled against the existing
   `for_organizers` convention.
