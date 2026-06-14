---
slug: category-live-auto-stop
stage: plan
feature: Category live auto-stop control
issue: null
status: approved
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/category-live-auto-stop/01-problem.md
  - docs/features/category-live-auto-stop/02-ideas.md
  - docs/features/category-live-auto-stop/03-design.md
---

# Implementation Plan: Category live auto-stop control

Make auto-stop **(1)** organizer-only (server-enforced), **(2)** toggleable while LIVE with the
QStash message scheduled/cancelled accordingly, and **(3)** correctly rescheduled on add-time.
Design: [03-design.md](03-design.md). Refs: [ARCHITECTURE.md](../../ARCHITECTURE.md),
[qstash-cron-scheduling](../qstash-cron-scheduling/). Local QStash testing uses ngrok (see project
memory `local-qstash-cron-testing`). No GitHub issue.

## Architecture and design

**Single source of truth:** `armed = autoStopMessageId != null`. The `Category.autoStop` column is
dropped; every server read derives the client-facing boolean and never leaks the raw id.

**Files changed / reused:**

- *Service* [`category-lifecycle.ts`](../../../src/lib/services/category-lifecycle.ts) — add
  `setAutoStop(categoryId, enabled, { scheduler })`; `stopCategory` stops cancelling; `resumeCategory`
  gains `{ scheduler }` + reschedule-or-clear; `addTimeToCategory` & `restartCategory` re-keyed to
  `autoStopMessageId != null`; `findCategoryOrThrow` selects `autoStopMessageId`.
- *Scheduler* [`auto-stop-scheduler.ts`](../../../src/lib/services/auto-stop-scheduler.ts) —
  `scheduleAutoStop` stops writing `autoStop: true` (column gone), writes only `autoStopMessageId`.
- *Singleton* [`auto-stop-singleton.ts`](../../../src/lib/services/auto-stop-singleton.ts) — add
  `isAutoStopAvailable(): boolean` (same env check) for the UI flag.
- *Webhook* [`auto-stop-webhook.ts`](../../../src/lib/services/auto-stop-webhook.ts) — use new enum
  values instead of `COMPETITION_STARTED`.
- *Endpoints* under [`api/categories/[id]/`](../../../src/routes/(internal)/api/categories/) —
  **new** `auto-stop/+server.ts`; `start` gets organizer guard for the autoStop branch + debug-log
  removal; `resume` passes the scheduler.
- *Guards* [`api_route_guards.ts`](../../../src/lib/api_utils/api_route_guards.ts) — register
  `auto-stop` as `categoryOrganizer`. Reuse `requireCompetitionRole(event, id, [Role.ORGANIZER])`
  in `start`.
- *Realtime* [`events/types.ts`](../../../src/lib/events/types.ts) — add
  `CategoryAutoStopChangedEvent { armed }` to the union + `applyCompetitionEvent`. Reuse
  `publishCompetitionEvent` ([`events/server/ably.ts`](../../../src/lib/events/server/ably.ts)).
- *Reads* [`db_competition.ts`](../../../src/lib/database/db_competition.ts) `getCompetitionCategories`
  & [`events/channels/competition.ts`](../../../src/lib/events/channels/competition.ts)
  `resolveCompetitionState` — derive `autoStop`, drop `autoStopMessageId` from output.
- *UI* [`CategoryCard.svelte`](../../../src/lib/components/during-competition/CategoryCard.svelte) —
  LIVE organizer toggle (replaces badge), read-only badge for judges, disabled+tooltip when
  unavailable; page loader [`during_competition/+page.server.ts`](../../../src/routes/(internal)/(auth)/competition/[id=integer]/during_competition/+page.server.ts)
  passes `autoStopAvailable`.
- *Schema* [`schema.prisma`](../../../prisma/schema.prisma) — add `AUTO_STOP_SUCCESS`,
  `AUTO_STOP_FAILED` to `NotificationType`; drop `Category.autoStop`.
- *i18n* `during_competition.auto_stop_unavailable` + enable-error key in `en`/`es`/`ca`
  `common.json` (notification copy already exists).

**Migration ordering** (each step shippable): enum add (additive) → code derive/refactor (column
still present, harmless) → new endpoint/UI → finally drop the `autoStop` column once nothing
reads/writes it.

## Tasks

### Backend — schema & service
- [x] Add `AUTO_STOP_SUCCESS`, `AUTO_STOP_FAILED` to `NotificationType` in `schema.prisma`;
  regenerate client + zod. _(Schema edited + `prisma generate` done; `prisma migrate dev` is run by the user — see below.)_
- [x] `auto-stop-webhook.ts`: replace the two `COMPETITION_STARTED` reuses with the new enum values.
- [x] `auto-stop-scheduler.ts`: in `scheduleAutoStop`, write only `autoStopMessageId` (remove the
  `autoStop: true` write).
- [x] `category-lifecycle.ts`:
  - [x] `findCategoryOrThrow` — select `autoStopMessageId` (not `autoStop`); also `realEndTime`.
  - [x] Add `setAutoStop(categoryId, enabled, { scheduler })`: require LIVE; enable → compute
    `deadline`, throw `InvalidStatusTransitionError` when `deadline <= now` (→ 409), else
    `scheduleAutoStop`; disable → `cancelAutoStop`; publish `category.auto_stop_changed`.
  - [x] `stopCategory` — remove the `cancelAutoStop` call (stop leaves the message).
  - [x] `resumeCategory` — add `{ scheduler }`; if `autoStopMessageId != null` & `remaining > 0`
    reschedule to `now + remaining`, else `cancelAutoStop`; publish event if armed-state changed.
  - [x] `addTimeToCategory` & `restartCategory` — re-key the reschedule condition to
    `autoStopMessageId != null`.

### Backend — realtime & reads
- [x] `events/types.ts`: add `CategoryAutoStopChangedEvent` to `CompetitionEvent` + handle in
  `applyCompetitionEvent` (set `cat.autoStop = event.armed`, bump version).
- [x] `db_competition.ts` `getCompetitionCategories`: map `autoStop: c.autoStopMessageId != null`,
  omit `autoStopMessageId` from the returned object.
- [x] `competition.ts` `resolveCompetitionState`: select `autoStopMessageId`; map derived `autoStop`.

### Backend — endpoints & auth
- [x] New `api/categories/[id]/auto-stop/+server.ts` (POST `{ enabled }`): call `setAutoStop`;
  503 when scheduler null; 409 on `InvalidStatusTransitionError`; 404 on `CategoryNotFoundError`.
- [x] `api_route_guards.ts`: register `/auto-stop$` as `categoryOrganizer`.
- [x] `start/+server.ts`: when `autoStop === true`, `requireCompetitionRole(..., [ORGANIZER])` (403
  if not organizer); remove the `[auto-stop]` debug `console.log`s.
- [x] `resume/+server.ts`: pass the singleton scheduler to `resumeCategory`.

### Frontend & i18n
- [x] `during_competition/+page.server.ts`: add `autoStopAvailable: isAutoStopAvailable()` to props.
- [x] `CategoryCard.svelte`: LIVE strip — organizer interactive toggle bound to derived
  `category.autoStop`, POSTing to `/auto-stop`; optimistic update + error toast; disabled + tooltip
  when `!autoStopAvailable`; judges keep the read-only badge. Pre-start checkbox also disabled when
  unavailable. _(Also added `autoStop` to the page's Ably-merge + optimistic `handleAutoStopToggled`.)_
- [x] Add i18n keys `during_competition.auto_stop_unavailable`, `auto_stop_enabled`,
  `auto_stop_disabled`, `auto_stop_error` to `en`/`es`/`ca` `common.json`. _(409 detail uses the
  server message via the error toast, matching the add-time pattern — no separate copy key added.)_

### Schema drop (last)
- [x] Drop `Category.autoStop` column from `schema.prisma`; `prisma generate` done; `pnpm check`
  passes (0 errors) with the column gone. _Apply to DB via the user-run `prisma migrate dev` below._

### Tests & verification
- [x] Update existing tests for new semantics: `category-lifecycle-autostop.test.ts`,
  `auto-stop-scheduler.test.ts`.
- [x] Add tests: `setAutoStop` (enable/disable/409-no-time/non-LIVE), `resumeCategory` reschedule &
  no-re-arm-when-`remaining<=0`, `applyCompetitionEvent` for the new event (`apply-competition-event.test.ts`).
  76 auto-stop tests pass; the only suite failures are 3 pre-existing i18n-in-test files unrelated to this work.
- [ ] **User runs the migration:** `pnpm prisma migrate dev --name auto_stop_live_control`
  (creates one migration: add enum values + drop `autoStop` column; applies + regenerates).
- [ ] Manual verification (`/verify`): organizer toggles auto-stop on a LIVE category with QStash
  via ngrok; confirm schedule, add-time reschedule, disable cancels, resume re-arms with paused
  time, judge cannot enable; verify disabled toggle when QStash env unset.
- [x] `graphify update .`
- [ ] **After merge: run `/feature-doc` (Stage 5)** to write `05-workflow.md`.

## Open questions

1. **Column-drop deploy on Vercel:** single migration vs two-phase (in case an old serverless
   instance briefly reads the dropped column during rollout). Single migration is likely fine for
   this app — confirm acceptable.
2. **`setAutoStop` scope:** restrict strictly to LIVE (per design), returning 409 for UPCOMING/
   STOPPED? Pre-start uses the local checkbox + `/start`, so LIVE-only is intended — confirm.
3. **Enable-error copy:** reuse a generic add-time-first message, or a dedicated
   `auto_stop_no_time_left` key (proposed) for the 409 case?
