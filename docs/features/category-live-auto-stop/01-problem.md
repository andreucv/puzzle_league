---
slug: category-live-auto-stop
stage: problem
feature: Category live auto-stop control
issue: null
status: draft
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/category-live-auto-stop/02-ideas.md
  - docs/features/category-live-auto-stop/03-design.md
  - docs/features/category-live-auto-stop/04-plan.md
---

# Category live auto-stop control — Problem

## Context

A category can auto-stop itself when its countdown reaches zero. The organizer can opt in
*before* starting the category; on start a delayed [QStash](../qstash-cron-scheduling/) message is
published with `notBefore` = the computed deadline. When it fires, the webhook stops the category
and notifies the organizer.

Code touched by this feature:

- Scheduler — [`src/lib/services/auto-stop-scheduler.ts`](../../../src/lib/services/auto-stop-scheduler.ts)
- Singleton/graceful-degrade — [`src/lib/services/auto-stop-singleton.ts`](../../../src/lib/services/auto-stop-singleton.ts)
- Lifecycle integration — [`src/lib/services/category-lifecycle.ts`](../../../src/lib/services/category-lifecycle.ts)
- Webhook handler — [`src/lib/services/auto-stop-webhook.ts`](../../../src/lib/services/auto-stop-webhook.ts) and route [`src/routes/(internal)/api/webhooks/qstash/auto-stop/+server.ts`](../../../src/routes/(internal)/api/webhooks/qstash/auto-stop/+server.ts)
- Endpoints — `start`, `stop`, `add-time` under [`src/routes/(internal)/api/categories/[id]/`](../../../src/routes/(internal)/api/categories/)
- UI — [`src/lib/components/during-competition/CategoryCard.svelte`](../../../src/lib/components/during-competition/CategoryCard.svelte)
- Route guards — [`src/lib/api_utils/api_route_guards.ts`](../../../src/lib/api_utils/api_route_guards.ts)
- Schema — `Category.autoStop`, `Category.autoStopMessageId` in [`prisma/schema.prisma`](../../../prisma/schema.prisma) (L242–243)

## Requirements

1. **Organizer-only.** Auto-stop may be selected only by the *organizer* of the category.
2. **Toggleable while LIVE.** The switch must be reachable **before** start *and* **while the
   category is running**; toggling on/off must schedule/unschedule the QStash message accordingly.
3. **Reschedule on add-time.** When the organizer adds time to a LIVE category's countdown, the
   scheduled message must be rescheduled to the new deadline.

## What's wrong today

- **Req 1 — only UI-enforced.** The toggle is gated by `{#if isOrganizer}` in the card, but it
  rides on the `/start` endpoint, which is guarded as `categoryJudge` (JUDGE *or* ORGANIZER) in
  [`api_route_guards.ts:76`](../../../src/lib/api_utils/api_route_guards.ts). A judge can start a
  category with `autoStop: true`. Not enforced server-side.
- **Req 2 — missing.** While LIVE the card renders only a read-only badge
  ([`CategoryCard.svelte:578`](../../../src/lib/components/during-competition/CategoryCard.svelte)).
  There is no LIVE toggle and no endpoint to schedule/cancel auto-stop on a running category.
- **Req 3 — already met.** `addTimeToCategory` reschedules when armed
  ([`category-lifecycle.ts:384-391`](../../../src/lib/services/category-lifecycle.ts)).

## Structural defects to fix during the refactor

- **Overloaded `autoStop` flag.** Only `scheduleAutoStop` sets it `true`; nothing sets it back.
  `cancelAutoStop` nulls `autoStopMessageId` but leaves `autoStop = true`. The flag conflates
  *intent* with *is-scheduled*, and after **stop → resume** the badge claims auto-stop while no
  message is scheduled (`resumeCategory` does not reschedule).
- **Non-atomic reschedule.** `rescheduleAutoStop` = cancel + schedule; a failure between the two
  leaves a category that believes it is armed but has no scheduled message.
- **Silent no-op** when QStash is unconfigured (`getAutoStopScheduler()` returns `null`): the
  toggle can read "on" while nothing is scheduled, with no user feedback.
- **Leftover debug logs** in [`start/+server.ts`](../../../src/routes/(internal)/api/categories/) (`=== START ENDPOINT HIT ===`, body dumps).
- **Notification-type hack.** `auto_stop_success`/`failed` reuse `NotificationType.COMPETITION_STARTED`
  ([`auto-stop-webhook.ts:79,91`](../../../src/lib/services/auto-stop-webhook.ts)).

## Out of scope

Changing the underlying delayed-delivery mechanism (QStash) or the countdown/add-time UX itself.
