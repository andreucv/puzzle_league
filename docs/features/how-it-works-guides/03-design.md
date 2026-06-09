---
slug: how-it-works-guides
stage: design
feature: How It Works — Participant and Organizer Guides
issue: null
status: approved
created: 2026-06-09
updated: 2026-06-09
related:
  - docs/features/how-it-works-guides/01-problem.md
  - docs/features/how-it-works-guides/02-ideas.md
  - docs/features/how-it-works-guides/04-plan.md
---

# Design: How It Works — Participant and Organizer Guides

Scope: two new public pages under
[`src/routes/(internal)/how-it-works/`](../../../src/routes/(internal)/) —
`participant/+page.svelte` and `organizer/+page.svelte` — sharing a `+layout.svelte` shell, plus
three small presentational primitives in a new `src/lib/components/guide/`, copy added to the
single `common.json` per locale, and CTA/link touchpoints on the landing page,
[`/for-organizers`](../../../src/routes/(internal)/for-organizers/+page.svelte),
[onboarding](../../../src/routes/(internal)/(auth)/onboarding/+page.svelte), and
[`Footer.svelte`](../../../src/lib/components/common/layout/Footer.svelte).

Refs: `docs/ARCHITECTURE.md` (route groups, auth guard), `docs/PRODUCT.md` (participant/organizer
workflows, entry statuses, category lifecycle), `docs/GLOSSARY.md`.
Problem: [docs/features/how-it-works-guides/01-problem.md](01-problem.md) ·
Ideas (Option B): [02-ideas.md](02-ideas.md)

## Problem

First-time participants and organizers get no in-product guidance for workflows that carry real
complexity (entry statuses, off-platform payment confirmation, the organizer role-request
prerequisite, the category day-of lifecycle). We add two public, step-by-step **component-showcase**
guides — embedding the *real* product components in a non-interactive demo state so the guide
always matches the live UI. **Guiding principle:** the guide mirrors the product visually and is
purely presentational — no new backend, no session branching.

## Design

### 1. Routing & access

```
src/routes/(internal)/how-it-works/
  +layout.svelte            shared chrome + end-of-page cross-link (NO tab bar)
  participant/+page.svelte  participant guide
  organizer/+page.svelte    organizer guide
```

Both pages sit directly under `(internal)/` — the auth guard only wraps `(internal)/(auth)/`, so
they are reachable **pre-login**, exactly like `/for-organizers`. No `+layout.server.ts` /
`+page.server.ts` is added: there is no data to load. Each page sets its own `<svelte:head><title>`
and meta description for SEO/shareability.

### 2. Layout shell — invisible chrome + inline cross-link (resolved Q5)

`+layout.svelte` provides only the shared shell, **not** a switcher (the pages are siblings, not
nested tabs):

- Centered container matching the established idiom from `/for-organizers`
  (`container mx-auto px-4 py-10 max-w-2xl space-y-8`).
- `<slot />` for the page body.
- A single end-of-page **cross-link card**: on the participant guide → "Organizing a competition?
  See the organizer guide →"; on the organizer guide → the reverse. The layout reads the current
  pathname to decide which direction to show, or each page passes a small prop — implementation
  detail for the plan.

```
┌───────────────────────────────────────────┐
│  (page hero: title + subtitle)            │  ← per page
│                                           │
│  [ Account CTA banner ]                   │  ← per page, §4
│                                           │
│  1 ─ Step title                           │
│      prose …                              │
│      ┌ ComponentDemo ─────────────┐       │  ← §5
│      │ [real StatusChip] [Card]   │       │
│      └────────────────────────────┘       │
│  2 ─ …                                     │
│  …                                         │
│  FAQ (accordion)                           │  ← §6
│                                           │
│  ── cross-link card (from +layout) ──      │  ← §2
└───────────────────────────────────────────┘
```

### 3. Guide primitives (`src/lib/components/guide/`)

Three small, purely presentational Svelte components, styled to match `/for-organizers`:

- **`GuideStep.svelte`** — one numbered step. Props: `number: number`, `title: string`; default
  slot for the body (prose + any `ComponentDemo`). Renders the number badge + title + content
  block, reusing the `Card`/list aesthetic already in `/for-organizers`.
- **`ComponentDemo.svelte`** — a labelled frame that showcases a real product component in a
  non-interactive state. Props: optional `caption: string`; default slot for the live component(s).
  Renders a bordered/`preset-tonal` frame with the caption, and **guards interactivity**:
  applies `pointer-events-none` to the slot wrapper so embedded buttons/links can't be clicked
  (the three audited showcase components are already inert `<span>`s, but the guard makes the
  contract explicit and safe for any future demo). No "presentational prop path" is needed — see
  §5.
- **`FaqAccordion.svelte`** — renders an array of `{ q, a }` (translation keys) as collapsible
  items. Default to native `<details>`/`<summary>` for zero-dependency simplicity; the plan may
  swap in the `bits_ui` accordion if a richer interaction is wanted.

### 4. Account CTA banner — top of each guide (resolved Q2)

Each page renders one **static, role-agnostic** banner near the top: "You'll need an account to
take part — sign in or create one," with two anchors to the existing deep links
`/login` and `/login?action=register` (the same targets the landing hero already uses). It does
**not** read session state. In-step links to product routes are plain anchors that **deep-link
directly**; auth-gated targets rely on the existing `(auth)` guard → `/login` redirect, public
targets (e.g. `/competitions/explore_competitions`) go straight through. No per-step "sign in
first" branching.

### 5. Showcased components & demo-state contract (resolved)

Audit of the components confirms they are **pure-prop presentational** and render correctly from
literal props with no server/page data:

| Component | Prop(s) for demo | Used in step |
|---|---|---|
| [`EntryRegistrationStatusBadge`](../../../src/lib/components/registration/EntryRegistrationStatusBadge.svelte) | `status="CONFIRMED" \| "PENDING_CONFIRMATION" \| "WAITLISTED"` | Participant §"your entry status"; Organizer §"manage entries" |
| [`CompetitionStatusChip`](../../../src/lib/components/common/status/CompetitionStatusChip.svelte) | `competitionStatus="NOT_STARTED" \| "STARTED" \| "FINISHED" \| "CANCELLED"` | Participant §"browse"; Organizer §"competition day" |
| [`CategoryRegistrationChip`](../../../src/lib/components/category/CategoryRegistrationChip.svelte) | `categoryType`, optional `registrationStatus` | Participant §"register" |
| [`Card`](../../../src/lib/components/common/card/Card.svelte) | slot only | layout of demo blocks |

Each live component is wrapped in one `ComponentDemo`. Because they render from plain props, the
contract is simply: pass literal props, wrap in `ComponentDemo`, the frame disables pointer events.

### 6. Participant guide — content spine

Numbered `GuideStep`s, each with prose + a `ComponentDemo` where it adds clarity, then a
`FaqAccordion`:

1. **Browse competitions** → links to `/competitions/explore_competitions` (public). Demo:
   `CompetitionStatusChip` showing *upcoming / live / finished*; `CategoryRegistrationChip`.
2. **Register for a category** → demo: category chips + the register action (shown inert).
3. **Understand your entry status** → demo: all three `EntryRegistrationStatusBadge` states side
   by side, with plain-language meaning of **CONFIRMED**, **PENDING_CONFIRMATION** (incl. the
   off-platform payment-confirmation / `showPaymentWarning` concept), and **WAITLISTED** (incl.
   promotion-when-a-spot-frees).
4. **Manage or cancel your entry** → how to unregister.
5. **Read the results** → links to a competition's results page; plain-language ranking explanation.

**FAQ:** "What does WAITLISTED mean?", "Why does my entry say payment pending?", "How is the
ranking decided?", etc.

### 7. Organizer guide — content spine + judge section

Main numbered spine:

1. **Request the organizer role** → emphasise the **prerequisite**: submit a Role Request at
   [`/request_permissions`](../../../src/routes/(internal)/(auth)/request_permissions/) and wait
   for admin approval before any competition can be created.
2. **Build your competition.**
3. **Configure categories & pricing.**
4. **Open registration.**
5. **Manage entries** → confirm / refuse / waitlist / payment reminders / table assignments. Demo:
   `EntryRegistrationStatusBadge` states as the organizer sees them.
6. **Competition day** → start / stop / record finish times & piece counts / complete. Explain the
   category lifecycle **NOT_STARTED → LIVE → STOPPED → COMPLETE**. Demo: `CompetitionStatusChip`.
7. **Access results.**

Then a **distinct trailing section "Working with judges"** (resolved Q3) — peer to the spine, built
from the same `GuideStep` primitive, **not** a collapsible aside and **not** interleaved into the
day-of steps (the audit shows judge assignment is a separate organizer surface,
[`manage_judges`](../../../src/routes/(internal)/(auth)/competition/), per-category via
`api/categories/[id]/judges`, decoupled from competition-day setup):

- a. **Assign judges** per category via `manage_judges` (incl. the copy-judges shortcut).
- b. **What the judge does on competition day** (the judge persona's day-of actions).

**FAQ:** "Why can't I create a competition yet?", "How do payment reminders work?", "How do I add
a judge?", etc.

### 8. Discovery touchpoints (resolved — contextual, no main-nav item)

- **Landing page** → participant-guide CTA, placed with the existing
  [`HowItWorks.svelte`](../../../src/lib/components/landing_page/HowItWorks.svelte) section.
- **`/for-organizers`** → organizer-guide link added near its existing CTA (the marketing page
  hands off to the procedural guide). `OrganizerCTA.svelte` continues to point at `/for-organizers`.
- **Onboarding** → a light "New here? See how it works" link in the onboarding welcome header
  ([`onboarding/+page.svelte`](../../../src/routes/(internal)/(auth)/onboarding/+page.svelte),
  step 0) pointing to the participant guide.
- **Footer** → add the two guide links to
  [`Footer.svelte`](../../../src/lib/components/common/layout/Footer.svelte).

### 9. i18n (resolved)

All copy lives under a new `how_it_works` namespace in the single
`src/lib/translations/{en,es,ca}/common.json` per locale (same file/convention as
`for_organizers`). Keys grouped `how_it_works.participant.*`, `how_it_works.organizer.*`,
`how_it_works.judges.*`, `how_it_works.account_cta.*`, `how_it_works.cross_link.*`, plus the
discovery-CTA strings. All three locales required.

## Data / model impact

**None.** No Prisma schema change, no migration, no new query, no loader. The pages are static
presentational routes that import existing pure-prop components and render them with literal props.
The only persisted additions are translation strings in `common.json`. This is provable from §5:
every showcased component already renders from props alone.

## Out of scope

- **External Participant** (register-on-behalf-of-a-minor/teammate) flow — deferred to a later
  version.
- Interactive product tour / coachmarks and static screenshots (both rejected in ideation).
- A top-level nav "How it works" item (discovery is contextual only).
- Per-step session-aware "sign in first" affordances.
- Replacing `/for-organizers` (it stays as the marketing entry point).
- Any change to the underlying workflows or to the results ranking algorithm (guide explains, does
  not change, behavior).

## Open questions

All blocking questions are resolved. Remaining items are plan-level implementation details, not
design decisions:

1. `FaqAccordion` implementation — native `<details>` (default) vs `bits_ui` accordion.
2. Exact cross-link mechanism in `+layout.svelte` — derive from `$page.url.pathname` vs a per-page
   prop.
3. Final copy and icon choices per step (content task during the plan).
