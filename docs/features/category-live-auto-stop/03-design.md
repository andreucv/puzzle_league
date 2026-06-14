---
slug: category-live-auto-stop
stage: design
feature: Category live auto-stop control
issue: null
status: approved
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/category-live-auto-stop/01-problem.md
  - docs/features/category-live-auto-stop/02-ideas.md
  - docs/features/category-live-auto-stop/04-plan.md
---

# Design: Category live auto-stop control

Scope: lifecycle service [`category-lifecycle.ts`](../../../src/lib/services/category-lifecycle.ts),
scheduler [`auto-stop-scheduler.ts`](../../../src/lib/services/auto-stop-scheduler.ts), webhook
[`auto-stop-webhook.ts`](../../../src/lib/services/auto-stop-webhook.ts), category endpoints under
[`src/routes/(internal)/api/categories/[id]/`](../../../src/routes/(internal)/api/categories/)
(`start`, `stop`, `resume`, `add-time`, **new** `auto-stop`), route guards
[`api_route_guards.ts`](../../../src/lib/api_utils/api_route_guards.ts), realtime
[`events/types.ts`](../../../src/lib/events/types.ts) + [`events/channels/competition.ts`](../../../src/lib/events/channels/competition.ts),
read model [`db_competition.ts`](../../../src/lib/database/db_competition.ts) + [`types/category.ts`](../../../src/lib/types/category.ts),
UI [`CategoryCard.svelte`](../../../src/lib/components/during-competition/CategoryCard.svelte) + page
[`during_competition/+page.svelte`](../../../src/routes/(internal)/(auth)/competition/[id=integer]/during_competition/+page.svelte).
Refs: [ARCHITECTURE.md](../../ARCHITECTURE.md) (authorization, realtime), [qstash-cron-scheduling](../qstash-cron-scheduling/).
Problem: [01-problem.md](01-problem.md) · Chosen direction: [02-ideas.md](02-ideas.md) Option A.

## Problem

Auto-stop can only be chosen once, at start, is enforced only in the UI, and its `autoStop`
boolean conflates *intent* with *is-scheduled* (and is never reset), producing a stale badge after
stop → resume. We need it organizer-only (server-side), toggleable while LIVE, and correctly
rescheduled on add-time.

**Guiding principle — single source of truth:** a category is *armed* iff
`autoStopMessageId != null`. There is no separate persisted intent flag. Every server read derives
the client-facing `autoStop` boolean from `autoStopMessageId != null`; the raw id never reaches the
client.

## Design

### 1. State model

- **Drop** the `Category.autoStop` column. Keep `Category.autoStopMessageId String?` as the sole
  persisted state. `armed = autoStopMessageId != null`.
- Server reads that build the client model derive the boolean and **omit** the id:
  - [`db_competition.ts:248-258`](../../../src/lib/database/db_competition.ts) `getCompetitionCategories`
    — replace the blanket `...category` spread so the result carries `autoStop: category.autoStopMessageId != null`
    and never includes `autoStopMessageId`.
  - [`competition.ts:39-89`](../../../src/lib/events/channels/competition.ts) `resolveCompetitionState`
    — select `autoStopMessageId` instead of `autoStop`; map `autoStop: cat.autoStopMessageId != null`.
  - `buildEventStateFromCategories` keeps its `autoStop` input field (now fed the derived value).
- [`types/category.ts`](../../../src/lib/types/category.ts) `CategoryData.autoStop` and
  [`events/types.ts`](../../../src/lib/events/types.ts) `CompetitionEventState.categories[].autoStop`
  stay as booleans — client churn is therefore minimal.

### 2. Authorization (Req 1)

- **New endpoint** `POST /api/categories/[id]/auto-stop` is registered as `categoryOrganizer` in
  [`api_route_guards.ts`](../../../src/lib/api_utils/api_route_guards.ts) (organizer of the parent
  competition only) — place it with the other category-organizer routes (L78-84).
- **`/start` stays `categoryJudge`** (judges may start), but the **auto-stop portion becomes
  organizer-only**: when the start body carries `autoStop: true`, the handler resolves the
  category's `competitionId` and calls `requireCompetitionRole(event, competitionId, [ORGANIZER])`
  (from [`api_auth`](../../../src/lib/api_utils/api_auth.ts)). A judge starting with `autoStop:true`
  gets `403`; the category is **not** started silently with auto-stop off — return the 403 so the
  client can surface it. (A judge starting *without* auto-stop is unaffected.)

### 3. Pre-start selection (UPCOMING)

Unchanged in shape. The checkbox in the UPCOMING strip
([`CategoryCard.svelte:513-519`](../../../src/lib/components/during-competition/CategoryCard.svelte))
remains **local component state** (`autoStopEnabled`) and is passed in the `/start` body; the
schedule is created in `startCategory` at start time (when `realStartTime` first exists). No
persistence before start.

### 4. LIVE toggle + new endpoint (Req 2)

Replace the read-only LIVE badge
([`CategoryCard.svelte:578-583`](../../../src/lib/components/during-competition/CategoryCard.svelte))
with an **organizer-only interactive toggle** reflecting `category.autoStop` (derived). Judges/non-
organizers keep seeing a read-only badge.

```
LIVE strip (organizer):
  [⏳ 12:34 +] [🏁 3/8] [ (•) Auto-stop ]   ← toggle; on=armed, off=disarmed
LIVE strip (judge / viewer):
  [⏳ 12:34]   [🏁 3/8] [ ⏱ Auto-stop ]     ← badge only when armed
```

`POST /api/categories/[id]/auto-stop` body `{ enabled: boolean }`, organizer-guarded, LIVE only:

- **enable:** compute `deadline = realStartTime + (endTime − startTime) + extraMinutes·60_000`.
  - if `deadline > now` → `scheduler.scheduleAutoStop(id, competitionId, deadline)` (sets messageId).
  - if `deadline <= now` (running past nominal end) → reject `409` (“no time remaining; add time
    first”), mirroring the resume rule in §6. **(Decided.)**
- **disable:** `scheduler.cancelAutoStop(id)` (deletes message, nulls id).
- On success emit the realtime event (§7) and return the updated derived `autoStop`.
- New endpoint is idempotent: enabling when already armed reschedules; disabling when not armed
  is a no-op.

A new service function `setAutoStop(categoryId, enabled, { scheduler })` in `category-lifecycle.ts`
holds this logic (status guard + deadline math + schedule/cancel + event), keeping the route thin.

### 5. Add-time reschedule (Req 3)

Already implemented in `addTimeToCategory`
([`category-lifecycle.ts:384-391`](../../../src/lib/services/category-lifecycle.ts)). Only change:
the guard condition switches from `category.autoStop` to `category.autoStopMessageId != null`
(reschedule only when currently armed). Deadline math is unchanged.

### 6. Lifecycle behavior matrix

The key change: **`stop` no longer cancels the QStash message.** The webhook is already idempotent
for non-LIVE categories ([`auto-stop-webhook.ts:27-31,67-70`](../../../src/lib/services/auto-stop-webhook.ts)),
so a message that fires during a pause harmlessly no-ops. This keeps `messageId` (intent) alive
across the pause without a separate flag.

| Transition | Auto-stop action |
|---|---|
| `start` (autoStop chosen) | schedule at deadline → messageId set |
| `add-time` (LIVE) | if armed, reschedule to new deadline |
| `setAutoStop(true)` (LIVE) | schedule (or 409 if no time left) |
| `setAutoStop(false)` (LIVE) | cancel → messageId null |
| **`stop`** | **no-op** (leave messageId as-is; webhook no-ops if it fires) |
| `resume` | if `messageId != null` **and** `remaining > 0` → reschedule to `now + remaining`; else cancel/ensure null |
| `cancel` / `complete` | cancel → messageId null |
| `restart` | cancel old; reschedule iff was armed (existing behavior, keyed on `messageId != null`) |

- **`resume` remaining math:** `remaining = (realStartTime + duration + extraMinutes·60_000) − realEndTime`
  (the frozen-at-stop remainder). New deadline = `now + remaining`. This *adds the paused time*,
  per the organizer's requirement.
- **`resume` with `remaining <= 0`** (category had auto-stopped at its deadline): **do not re-arm**;
  come back LIVE with auto-stop off; cancel/clear any stale messageId. Organizer adds time + re-
  toggles. (Chosen in Stage 2 grilling.)
- **Disable-then-resume must not re-arm:** falls out for free — disabling nulls messageId before
  stop, so resume sees `messageId == null` and does nothing.
- `resumeCategory` gains an optional `{ scheduler }` param (like stop/cancel/restart), and the
  [`resume/+server.ts`](../../../src/routes/(internal)/api/categories/) route passes the singleton.

### 7. Realtime propagation

New Ably event so arm/disarm while LIVE updates judges'/co-organizers' badges without a records
refetch (chosen in Stage 2):

- `events/types.ts`: add `CategoryAutoStopChangedEvent { type: 'category.auto_stop_changed';
  categoryId; competitionId; armed: boolean }` to the `CompetitionEvent` union and handle it in
  `applyCompetitionEvent` (update `cat.autoStop = event.armed`, bump version).
- `setAutoStop` (and `resume`’s re-arm/clear) publish it via `publishCompetitionEvent`.
- The auto-stop-success toast on the page
  ([`during_competition/+page.svelte:112-121`](../../../src/routes/(internal)/(auth)/competition/[id=integer]/during_competition/+page.svelte))
  is unchanged (it keys off the `status_changed` event with `autoStop:true` from the webhook stop).

### 8. QStash-unavailable UX

When `getAutoStopScheduler()` returns `null` (env not set), the toggle/checkbox is **rendered
disabled with a tooltip** (chosen in Stage 2). The page loader exposes a boolean
`autoStopAvailable` (derived server-side from the same env check the singleton uses) in the
`during_competition` load props; `CategoryCard` disables the control and shows
`during_competition.auto_stop_unavailable` when false. The endpoints still defensively return `503`
if called while unconfigured.

### 9. Notifications cleanup

Add `AUTO_STOP_SUCCESS` and `AUTO_STOP_FAILED` to the `NotificationType` enum
([`schema.prisma:148-163`](../../../prisma/schema.prisma)) and use them in
[`auto-stop-webhook.ts:79,91`](../../../src/lib/services/auto-stop-webhook.ts), replacing the
`COMPETITION_STARTED` reuse. Locale keys already exist (`common.json` `notifications.titles.*` /
`messages.*` `auto_stop_success|failed`); no copy changes.

### 10. Webhook & hygiene

- Webhook handler/route logic is otherwise unchanged (idempotency already correct).
- Remove the debug `console.log`s from
  [`start/+server.ts`](../../../src/routes/(internal)/api/categories/) (`=== START ENDPOINT HIT ===`,
  body dumps).
- Robustness: best-effort schedule/cancel relying on the idempotent webhook; log failures; no
  reconciliation cron (chosen in Stage 2).

## Data / model impact

- **Migration:** drop column `Category.autoStop`; keep `Category.autoStopMessageId`. Add enum values
  `AUTO_STOP_SUCCESS`, `AUTO_STOP_FAILED` to `NotificationType`. Regenerate Prisma client + zod.
- **No new tables/columns** beyond the enum values.
- **Reads updated** to derive `autoStop` and stop leaking `autoStopMessageId`: `getCompetitionCategories`,
  `resolveCompetitionState`. `findCategoryOrThrow` already selects `autoStop` — switch to
  `autoStopMessageId`.
- **New realtime type** `category.auto_stop_changed`.
- **New route** `auto-stop` + guard entry.

## Out of scope

- Changing the delayed-delivery mechanism (QStash).
- A reconciliation cron for drift (deferred; best-effort chosen).
- Countdown / add-time UX itself (only the reschedule wiring).
- Persisting pre-start intent server-side (stays local UI state until start).

## Open questions

_All resolved._

- **LIVE enable with `remaining <= 0`** → reject `409` ("no time remaining; add time first"),
  consistent with the resume rule. **(Decided 2026-06-14.)**
- **Migration safety:** dropping `Category.autoStop` is irreversible; verify during implementation
  that no external consumer (analytics export, admin tooling) reads the column. PostHog
  `category_started` sends `auto_stop` from the request body, not the column — unaffected.
