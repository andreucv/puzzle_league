---
slug: per-category-registration-90
stage: ideas
feature: Split registration open/close per category instead of per competition
issue: "#90"
status: draft
created: 2026-06-17
updated: 2026-06-17
related:
  - docs/features/per-category-registration-90/01-problem.md
  - docs/features/per-category-registration-90/03-design.md
  - docs/features/per-category-registration-90/04-plan.md
---

# Split registration open/close per category — Ideas

Problem: [01-problem.md](./01-problem.md)

## Decisions taken in ideation

These were settled in the brainstorming dialogue and bound the design space for Stage 3:

- **Switch model: master AND per-category.** Keep `Competition.registrationOpen` as a master
  gate and add a per-category flag. Registration is open only when **both** are open.
- **Default open / non-breaking migration.** New per-category flag defaults to `true`; backfill
  all existing categories to `true`. With the master AND gate this means **today's behavior is
  unchanged** until an organizer deliberately closes a category.
- **"Closed" is independent from "full."** Reaching `maxParties` keeps its current behavior
  (new entries become `WAITLISTED`); it does **not** auto-close. Closing is a manual organizer
  action only.
- **Organizer-mode bypass preserved.** Competition creator / Admin can still register entries
  into a closed category as long as the Category is `NOT_STARTED`, exactly as organizer mode
  bypasses `registrationOpen` today.

## Candidate directions

### Option A — Boolean `Category.registrationOpen`, AND-ed with the competition flag (recommended)
**What:** Add `registrationOpen Boolean @default(true)` to `Category`
([`prisma/schema.prisma:232`](../../../prisma/schema.prisma)). The effective gate in
`submitRegistration` becomes `competition.registrationOpen && category.registrationOpen` (plus
the unchanged `NOT_STARTED` requirement and organizer-mode bypass). Manage-registrations gets a
per-category open/closed toggle alongside the existing competition-wide one.
**Data/powered by:** new `Category.registrationOpen`; existing `Competition.registrationOpen`
(`schema:211`) stays as master; existing `Category.status` / `maxParties` unchanged.
**Effort:** Medium — one nullable-free column + backfill migration, one service-seam gate change
in `registration-workflow`, one toggle endpoint, manage UI, and public-page "closed" messaging.
**Trade-off:** Two booleans to reason about (master + per-category), but each has a clear role
and the AND rule keeps the mental model simple.

### Option B — Per-category flag *replaces* the competition switch
**What:** Drop `Competition.registrationOpen`; each category owns its open/closed state.
**Data/powered by:** new `Category.registrationOpen`; remove `Competition.registrationOpen` and
every read of it.
**Effort:** High — larger migration, touches every site that reads the competition flag, and we
lose the one-click "open/close everything" affordance organizers rely on.
**Trade-off:** Cleanest single source of truth, but removes the master kill-switch and is the
most invasive change. **Rejected** in ideation (we chose to keep the master gate).

### Option C — Derive "closed" instead of storing it
**What:** No new column; treat a category as closed when some existing signal says so (e.g.
`maxParties` reached, or `status != NOT_STARTED`).
**Data/powered by:** existing `Category.maxParties` / `status` only.
**Effort:** Quick (no migration).
**Trade-off:** Conflates "full" and "started" with "deliberately closed" — exactly the
distinction the issue asks for. Can't close a not-yet-full category, and can't keep a full
category open for waitlisting. **Rejected** — fails the core requirement.

## Recommendation

**Option A.** It directly satisfies issue #90 (open a new category without re-exposing others;
close a category that fills up early) while honoring every ideation decision: master AND
per-category, default-open/non-breaking, closed-independent-from-full, and preserved organizer
bypass. It keeps all registration write-side decisions inside the `registration-workflow` service
seam per project convention.

**Out of scope:** auto-closing on capacity, bulk "close all categories" UX beyond the existing
master toggle, and any change to waitlist promotion logic.

## Open questions for design

1. Exact UI for the per-category toggle on the manage-registrations card, and how "closed" is
   visually distinguished from "full" and "started" on the public details / registration pages.
2. Endpoint shape for toggling a single category's `registrationOpen` (new API route vs. form
   action) and its authorization (manage-registrations access list).
3. Precise effective-gate expression and where it lives in `registration-workflow.ts`
   (`submitRegistration`), including the organizer-mode bypass interaction.
4. Whether a participant landing on a closed category's registration page sees a blocked state
   vs. the button merely disabled, and the i18n strings (`en`/`es`/`ca`) needed.
5. Notification implications, if any, when a category is closed/opened (likely none — confirm).
