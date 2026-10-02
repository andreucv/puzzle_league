---
slug: per-category-registration-90
stage: plan
feature: Split registration open/close per category instead of per competition
issue: "#90"
status: approved
created: 2026-06-17
updated: 2026-06-17
related:
  - docs/features/per-category-registration-90/01-problem.md
  - docs/features/per-category-registration-90/02-ideas.md
  - docs/features/per-category-registration-90/03-design.md
---

# Implementation Plan: Split registration open/close per category

Resolves issue **#90**. Adds a per-category `registrationOpen` flag that is AND-ed with the
existing competition-wide master switch, so organizers can open a newly added category without
re-exposing the others and can hard-close a category that fills up early.

Design: [03-design.md](./03-design.md) (approved). Problem: [01-problem.md](./01-problem.md).
Refs: [registration-workflow.md](../../workflows/registration-workflow.md).

## Architecture and design

**Effective gate** (participant): `competition.registrationOpen && category.registrationOpen &&
category.status === NOT_STARTED`. Organizer mode bypasses both flags (still `NOT_STARTED`-gated).
"Closed" is independent from "full" — capacity/waitlist behavior is unchanged.

**Reuse over new:**
- The server gate reuses the existing `REGISTRATION_CLOSED` error code and the category already
  loaded with its competition in `submitRegistration` (`registration-workflow.ts:286-289`,
  `:400-402`) — no query change.
- The toggle reuses `ensureCanManageCompetition` (`registration-workflow.ts:202-228`) for
  authorization.
- Read surfaces need **no loader changes**: `getRegistrationsForCompetition` (`db_entry.ts:60`),
  `getCompetitionCategories` (`db_competition.ts:214`, forwards via `...rest`), and
  `getCompetitionWithCategories` (registration page loader) all use Prisma `include`/spread and
  return the new scalar automatically.
- The manage per-category toggle mirrors the existing `ManageRegistrationStatus.svelte` styling
  (lock-open/lock icon, success/error color).

**New:** one column, one seam function (`toggleCategoryRegistration`), one API route, one small
Svelte toggle control, and i18n keys.

**Backend impact:** additive migration only (`Category.registrationOpen Boolean @default(true)`;
Postgres backfills existing rows to `true`, so behavior is unchanged until an organizer acts).
Regenerate Prisma client + Zod types.

**i18n** (`src/lib/translations/{en,es,ca}/common.json`):
- `manage_registrations.category_registration_open` / `…_closed` / `…_toggle_label` — per-category
  toggle status + action; reuse existing `manage_registrations.toggle_error` for failures.
- `registration.category_registration_closed` — per-category closed message on the registration
  card (the closed case currently falls through to `registration.registration_not_available`,
  `common.json` en:523).

**Also in scope (resolved Q3):** retrofit `ensureCanManageCompetition` (or equivalent locals-based
access check) onto the existing `api/competitions/[id]/toggle_registration/+server.ts`, which today
performs no authorization.

## Tasks

- [x] **Schema + migration.** Add `registrationOpen Boolean @default(true)` to `Category`
  (`prisma/schema.prisma:244`). Migration `20260617073533_category_registration_open` applied;
  Prisma client + Zod types regenerated.
- [x] **Server gate.** In `submitRegistration` (`registration-workflow.ts`), after the
  `NOT_STARTED` check, throw `REGISTRATION_CLOSED` when
  `!category.registrationOpen && !actor.isOrganizer`.
- [x] **Toggle seam function.** Added `toggleCategoryRegistration({ categoryId, actor })` to
  `registration-workflow.ts`: loads the category's `competitionId`, calls
  `ensureCanManageCompetition`, flips `registrationOpen`, returns the new value.
- [x] **Per-category toggle endpoint.** Added
  `src/routes/(internal)/api/categories/[id]/toggle_registration/+server.ts` (POST): builds the
  actor from `event.locals.user`, calls the seam, captures PostHog `category_registration_toggled`,
  returns `{ id, registrationOpen }`.
- [x] **Retrofit competition-endpoint auth (Q3).** Added a `getCompetitionAccess` /
  `canManageCompetition` check to `api/competitions/[id]/toggle_registration/+server.ts` before
  toggling.
- [x] **Manage UI toggle.** Added a compact open/closed toggle in the `categoryCard` header for
  active (`NOT_STARTED`) categories only, styled like `ManageRegistrationStatus`; on success
  `invalidate('data:manage-registrations')`.
- [x] **Registration page gate + copy.** `canRegisterForCategory` now requires
  `category.registrationOpen` (organizer mode still bypasses both flags); a closed `NOT_STARTED`
  category shows `registration.category_registration_closed`.
- [x] **Details page predicate.** `hasRegistrableSpot` and its `CategoryCounts` type now require
  `registrationOpen` alongside `NOT_STARTED` + room; the button's `registrationOpen` prop stays at
  the competition master value.
- [x] **i18n.** Added the new keys to `en`, `es`, and `ca` `common.json`.
- [x] **Unit tests.** Extended `registration-workflow.test.ts` (now 14 passing): participant
  blocked when category closed but competition open; organizer bypasses a closed category;
  `toggleCategoryRegistration` authorizes via `ensureCanManageCompetition` (success + rejection).
  Full suite: 312 passing; `pnpm check`: 0 errors.
- [ ] **Manual verification** (`/run` or `/verify`): as organizer, close one category on the
  manage page and confirm the other stays open; as participant, confirm the closed category is
  blocked while the open one registers; confirm organizer can still register into the closed one.
  (Organizer→participant path now covered by e2e; organizer-bypass still manual.)
- [x] **Review follow-ups.** Closed-category error now names `subname || type` (was the unused
  `description`); categories added to an already-open competition from the edit form start
  closed (`edit/[[id=integer]]/+page.server.ts`); participant tag-claim edits/removals also require
  `Category.registrationOpen` (`entry-tags.ts`); e2e
  `GivenOpenCompetition_WhenOrganizerClosesOneCategory_…` in `e2e/registration/organizer.test.ts`.
- [x] **Manage-registrations declutter.** Replaced `ManageRegistrationStatus.svelte` and the
  full-width PDF / print / publish-tables buttons with `OverflowMenu`s (new `kind: 'button'` item
  with optional `hint`): a page-level Manage menu (competition toggle + master-switch hint, publish
  all table assignments, download PDF, print all entry cards) and a per-category Manage menu
  (category toggle, publish tables, print entry cards). Open/closed stays visible as a status line /
  badge. Bulk "remind all pending" stays inline.
- [x] **Category-only registration (supersedes the master-AND design).** Dropped
  `Competition.registrationOpen`; `Category.registrationOpen` (default `false`) is the single source
  of truth, and "competition open" is derived via `hasOpenRegistration()` (`registration_utils.ts`).
  Migration `20260918120000_category_only_registration_open` first closes the categories of closed
  competitions. The general menu's toggle became **Close registration for all categories**
  (`closeAllCategoryRegistrations` + `POST /api/competitions/[id]/close_registration`, replacing
  `toggle_registration`); no "open all". The create-form toggle opens every new category; it is
  hidden on edit. E2E seeds map `registrationOpen` onto categories; `openRegistration` helper opens
  each category via its menu.
- [x] **Scheduled opening (QStash, modelled on auto-stop).** `Category.registrationOpensAt` +
  `NotificationType.REGISTRATION_OPENED` (migration `20260918130000_category_registration_opens_at`).
  Seam: `scheduleCategoryRegistrationOpening`, `scheduleAllCategoryRegistrationOpenings`,
  `cancelCategoryRegistrationOpening`; toggle and close-all clear schedules. Publisher
  `registration-open-scheduler.ts` (6-day hops for QStash's plan delay cap), webhook
  `registration-open-webhook.ts` + `/api/webhooks/qstash/registration-open` (stale-`opensAt`
  guard, no message ids stored). UI: per-category and "all closed categories" schedule items with
  an inline `datetime-local` form; "Opens …" badge/status; participant "Registration opens on …".
  Unit-tested (webhook + seam); no e2e for publishing because e2e loads the real QStash env.
- [ ] **Manual QStash check** via ngrok (see memory `local-qstash-cron-testing`): schedule a
  category ~2 min ahead, confirm it opens and the organizer gets the notification.
- [x] **Docs.** Updated [registration-workflow.md](../../workflows/registration-workflow.md)
  `registrationOpen` section to describe category-only registration, close-all, and scheduled
  opening; `PRODUCT.md` and `ARCHITECTURE.md` (QStash webhooks) updated accordingly.
- [x] **`graphify update .`** — graph refreshed (3420 nodes, 4636 edges).
- [ ] **Close-out:** after merge, run **`/feature-doc` (Stage 5)** to write
  `05-workflow.md` — the feature is not done until it exists and matches the shipped code.

## Open questions

1. Toggle control placement — confirm it belongs in the category card **header** (next to the
   title) rather than the card footer near the bulk actions. (Plan assumes header.)
2. New i18n string wording — confirm `category_registration_closed` should read distinctly from
   the existing competition-wide `registration.registration_closed`, or reuse a shared phrase.
3. Migration file naming/conventions — confirm there's no separate seed/backfill step needed
   beyond the column default (plan assumes the Postgres `DEFAULT true` backfill is sufficient).
