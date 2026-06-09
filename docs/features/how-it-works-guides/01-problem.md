---
slug: how-it-works-guides
stage: problem
feature: How It Works — Participant and Organizer Guides
issue: null
status: draft
created: 2026-06-09
updated: 2026-06-09
related:
  - docs/features/how-it-works-guides/02-ideas.md
  - docs/features/how-it-works-guides/03-design.md
  - docs/features/how-it-works-guides/04-plan.md
---

# How It Works — Participant and Organizer Guides — Problem

## Context

The platform is preparing for its first public launch. All authenticated routes live under
`src/routes/(internal)/`, with role-gated sections for organizers
(`(auth)/(organizer)/`) and a public-facing landing page at `src/routes/+page.svelte`.

There is one existing guide-like page, `src/routes/(internal)/for-organizers/+page.svelte`,
which presents a card-based feature overview aimed at converting prospective organizers. It lists
capabilities (setup, registration management, competition day, results) but does not walk through
how to execute any of them. No equivalent page exists for participants.

The platform carries meaningful workflow complexity that first-time users are expected to navigate
without any in-product guidance:

- **Participants** must understand how to browse competitions, register for categories, interpret
  their entry status (CONFIRMED / PENDING_CONFIRMATION / WAITLISTED), unregister, and read results.
- **Organizers** must understand how to request the organizer role, build a competition, configure
  categories and pricing, open registration, work through the full entry management lifecycle
  (confirm / refuse / waitlist / payment reminders / table assignments), assign judges, run
  competition day (start / stop / record finish times / piece counts / complete), and access results.

## Problem

1. **No participant guide exists.** There is no public page that explains the participant journey
   end-to-end. A first-time user landing on the explore page has no reference for what "WAITLISTED"
   means, why their entry might need payment confirmation, or how results are ranked.

2. **The existing `/for-organizers` page teaches nothing procedural.** It markets the feature set
   but provides no step-by-step path. A new organizer reading it still does not know they must first
   submit a Role Request (`src/routes/(internal)/(auth)/request_permissions/+page.svelte`) and
   wait for admin approval before they can create a competition.

3. **No public entry point for guide content.** Both gaps affect anonymous visitors — people
   deciding whether to sign up — as well as freshly registered users. The missing pages leave a
   high-friction gap right at the activation moment.

4. **Workflow-specific concepts are not explained anywhere user-facing.** Off-platform payment
   confirmation, the `showPaymentWarning` flow, waitlist promotion rules, and the category
   lifecycle (NOT_STARTED → LIVE → STOPPED → COMPLETE) have no plain-language explanation outside
   of internal developer docs.

## Who It Affects & Why It Matters

| Role | Impact |
|---|---|
| **Participant (new user)** | Cannot self-serve their first registration without confusion about entry statuses or payment steps. Drop-off risk is high. |
| **Organizer (new)** | Does not know the role-request prerequisite and cannot proceed without contacting support or guessing. |
| **Organizer (experienced)** | Has no shareable reference to onboard co-organizers or judges. |
| **Anonymous visitor** | Cannot evaluate the platform workflow before signing up — conversion barrier. |

The cost of leaving this as-is is real-time confusion at first public launch with no recovery
mechanism for users who get stuck.

## Constraints / Prior Ideas

- **Two new routes** under a shared layout group: `/how-it-works/participant` and
  `/how-it-works/organizer`. These are siblings, not nested tabs.
- **Public / pre-login** — pages must be accessible without authentication (outside the `(auth)`
  layout guard).
- **Step-by-step numbered walkthroughs** are the primary format, reusing existing Svelte
  components (cards, status chips, icons) to mirror the real UI. FAQ section at the bottom of
  each page.
- **Keep `/for-organizers` as-is.** That page serves as a marketing/conversion entry point and
  is not replaced by the new guide.
- **i18n required** — all three locales (en / es / ca), consistent with the rest of the product.

## Open Questions

1. **Navigation entry point** — Where do these pages surface? Footer links? A "How it works" item
   in the main nav? A prompt inside the onboarding flow? A CTA on the landing page or the
   `/for-organizers` page? This determines discoverability for both audiences.

2. **In-guide links to authenticated routes** — When a step says "go to your dashboard" or
   "open the registration page," the target is behind auth. Do we link directly (relying on the
   auth redirect) or show a contextual "Sign in first" CTA inline?

3. **Scope of the organizer guide** — Does it cover judge assignment and the judge's
   competition-day workflow, or is the judge persona out of scope for the first version?

4. **External participant registration** — The participant guide could cover registering on behalf
   of a minor or teammate (External Participant flow). Is this in scope for the first version?

5. **Shared layout** — Should `/how-it-works/` have its own `+layout.svelte` (e.g. a tab bar
   switching between the two guides), or are the two pages fully standalone?
