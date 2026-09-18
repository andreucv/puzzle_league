---
slug: per-category-registration-90
stage: problem
feature: Split registration open/close per category instead of per competition
issue: "#90"
status: draft
created: 2026-06-17
updated: 2026-06-17
related:
  - docs/features/per-category-registration-90/02-ideas.md
  - docs/features/per-category-registration-90/03-design.md
  - docs/features/per-category-registration-90/04-plan.md
---

# Split registration open/close per category — Problem

## Context

Registration "open/closed" is currently a **competition-wide** control, not a
per-category one.

- The toggle is a single boolean on the Competition:
  [`Competition.registrationOpen`](../../../prisma/schema.prisma) (`prisma/schema.prisma:211`),
  `@default(false)`.
- Organizers flip it from the manage-registrations page
  (`src/routes/(internal)/(auth)/(organizer)/competition/[id=integer]/manage_registrations/`),
  documented in [registration-workflow.md › `registrationOpen`](../../workflows/registration-workflow.md).
- The Category model has **no** registration switch of its own
  ([`Category`](../../../prisma/schema.prisma), `prisma/schema.prisma:232`). It exposes
  `status` (`NOT_STARTED`, started, …) and `maxParties`, but nothing an organizer can use to
  stop new sign-ups for *one* category while leaving the rest open.
- `submitRegistration` enforces two independent gates server-side
  ([registration-workflow.md › Entry Creation](../../workflows/registration-workflow.md)):
  the competition-wide `registrationOpen`, **and** each submitted Category being `NOT_STARTED`.

So today there are only two ways a category stops accepting *new reserved* sign-ups:
auto-waitlisting once `maxParties` is reached (entries still get created as `WAITLISTED`), or
starting the category (`status` leaves `NOT_STARTED`). Neither is a deliberate "close this
category's registration" action.

## Problem

1. **Open/close is all-or-nothing across categories.** To open registration for a newly added
   category, the organizer must flip `Competition.registrationOpen`, which simultaneously
   (re)opens registration for *every* `NOT_STARTED` category in the competition
   (`prisma/schema.prisma:211`; enforced in `submitRegistration`).
2. **No way to close one category that fills up early.** When a single category reaches
   capacity, organizers want to stop new sign-ups for it while keeping the others open. The
   only competition-wide toggle can't express this — they currently must wait until they're
   willing to close the whole competition.
3. **Filling up ≠ being closed.** Hitting `maxParties` only diverts new entries to
   `WAITLISTED` ([registration-workflow.md › Waitlist](../../workflows/registration-workflow.md));
   it does not stop registration. There is no organizer-controlled "closed" state at the
   category level, so a full category keeps collecting waitlist entries with no way to turn
   that off short of starting the category.

## Who it affects & why it matters

- **Organizers** — the primary pain. They can't stage category openings (add/open a category
  later without re-exposing others) or hard-close a full category. The workaround is to delay
  opening the whole competition or to leave a full category collecting waitlist entries it may
  never honor.
- **Participants** — secondary. They may keep sign up / land on a waitlist for a category the
  organizer already considers closed, then get refused later; or they can't register for a
  newly opened category because the organizer is holding the competition-wide switch closed to
  protect the others.

## Constraints / prior ideas

- The issue already floats the direction: *"split registration open/close per category."*
  Recorded here as the requester's framing — concrete solution options are Stage 2.
- A per-category control must coexist with the two existing gates (`Category.status` must be
  `NOT_STARTED`, and capacity/waitlist behavior via `maxParties`); it should not duplicate or
  contradict them.
- Per project conventions: keep the registration write-side decisions inside the
  `registration-workflow` service seam — routes/API handlers should not make their own
  open/closed decisions ([registration-workflow.md › Module](../../workflows/registration-workflow.md)).

## Open questions

1. Does `Competition.registrationOpen` stay as a master switch (AND-ed with a new per-category
   flag), get replaced entirely by per-category flags, or become a convenience that fans out to
   the categories?
2. What is the new state's data shape — a `Boolean registrationOpen` on `Category`, or is
   "closed" derived (e.g. from `maxParties` reached / a manual close timestamp)?
3. What's the default for a newly created category, and what happens to existing competitions on
   migration (preserve today's behavior)?
4. Should organizer-mode registration still bypass a *closed* category the way it currently
   bypasses `registrationOpen` (creator/Admin can register while closed, as long as
   `NOT_STARTED`)?
5. How does this surface in the UI — a per-category toggle on the manage-registrations card, and
   how is "closed" vs "full" vs "started" communicated to participants on the public details /
   registration pages?
