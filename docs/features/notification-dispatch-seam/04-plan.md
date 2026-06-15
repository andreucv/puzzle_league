---
slug: notification-dispatch-seam
stage: plan
feature: Notification dispatch seam
issue: null
status: implemented
created: 2026-06-15
updated: 2026-06-15
title: Notification dispatch seam
date_created: 2026-06-15
last_updated: 2026-06-15
related:
  - docs/features/notification-dispatch-seam/03-design.md
---

# Implementation Plan: Notification dispatch seam

Introduce a single **Notification Dispatcher** (`dispatchNotifications`) that all services and
routes call, fed by pure **Notification Intent** builders (`notificationsForX`). Email becomes a
downstream `NotificationChannel` adapter. Behavior-preserving: same notifications, same emails,
same post-commit timing. Origin: architecture-review candidate #3.

Design: [03-design.md](03-design.md). Issue: none. Refs:
[ARCHITECTURE.md → Realtime And Notifications](../../ARCHITECTURE.md),
[GLOSSARY.md → Notification Intent / Notification Dispatcher](../../GLOSSARY.md),
[memory: PostHog server events use `event.locals.user?.id ?? 'server'`].

## Architecture and design

**New files (in `src/lib/notifications/`):**
- `dispatcher.ts` — exports `NotificationIntent`, `DispatchResult`, `NotificationChannel`,
  `EMAIL_ENABLED_TYPES` (moved here from `notifications.ts`), and `dispatchNotifications(intents)`.
  Persists rows (one `prisma.notification.createMany` per intent), routes email-enabled intents
  with a `link` to the email channel, emits the `notification_dispatch` PostHog capture, returns
  `DispatchResult`. Persistence failure logged, never rethrown into a domain rollback; email
  failures counted in `emailFailures`.
- `email_channel.ts` — `EmailChannel: NotificationChannel`, a thin wrapper over existing
  [`sendEmail`](../../../src/lib/emails/send_email_utils.ts) (locale/multi-language/Resend
  unchanged). Future `outbox_channel.ts` drops in beside it.

**Changed — builders become pure (rename functions in place, keep files):**
- [`registration_notifications.ts`](../../../src/lib/notifications/registration_notifications.ts):
  `notify*` → `notificationsForX` returning `NotificationIntent[]`; all recipient/teammate/`@:`-key
  logic preserved verbatim, just collected into an array instead of awaiting `createNotification`.
  `notificationsForPaymentReminder` returns intents; callers derive the notified-user count from
  `new Set(intents.flatMap(i => i.userIds)).size`.
- [`tag_notifications.ts`](../../../src/lib/notifications/tag_notifications.ts): `notifyTagRejected`
  → `notificationsForTagRejected`.

**Changed — call sites (build intents, one `dispatchNotifications` call, post-commit):**
- [`registration-workflow.ts`](../../../src/lib/services/registration-workflow.ts) — 6 sites;
  `runNotificationWork` stays as the catch-and-log wrapper around the dispatch call.
- [`category-lifecycle.ts`](../../../src/lib/services/category-lifecycle.ts) —
  `publishTableAssignments`, `remindPendingPayments` (preserve its `remindedCount` return), and the
  inline `createNotificationForUsers` for category status change.
- [`entry-tags.ts`](../../../src/lib/services/entry-tags.ts) — `rejectEntryTag`.
- [`auto-cancel.ts`](../../../src/lib/services/auto-cancel.ts) — inline intents.
- [`auto-stop-webhook.ts`](../../../src/lib/services/auto-stop-webhook.ts) — the injected
  `createNotification` dependency becomes an injected `dispatchNotifications`; the handler builds
  the two single-recipient AUTO_STOP_SUCCESS/FAILED intents inline. Updated at its caller
  [`api/webhooks/qstash/auto-stop/+server.ts`](../../../src/routes/(internal)/api/webhooks/qstash/auto-stop/+server.ts).
- Routes with inline create calls:
  [`api/registrations/[id]/remind`](../../../src/routes/(internal)/api/registrations/[id]/remind/+server.ts),
  [`api/competitions/[id]/cancel`](../../../src/routes/(internal)/api/competitions/[id]/cancel/+server.ts),
  [`admin/review_requests/+page.server.ts`](../../../src/routes/(internal)/admin/review_requests/+page.server.ts) (×2),
  [`api/external-participants/claim`](../../../src/routes/(internal)/api/external-participants/claim/+server.ts),
  [`(auth)/onboarding/+page.server.ts`](../../../src/routes/(internal)/(auth)/onboarding/+page.server.ts) (drop the dynamic import).

**Removed:** `createNotification` and `createNotificationForUsers` (plus `shouldSendMail`,
`EMAIL_ENABLED_TYPES`) from [`notifications.ts`](../../../src/lib/notifications/notifications.ts).
The read helpers (`getNotificationsForUser`, `hasUnreadForUser`, `markNotificationAsRead`,
`markAllNotificationsAsRead`) stay.

**Backend / i18n:** No schema change, no migration. **No new translation keys** — every
title/message/translationKey is reused as-is. The `Notification` model, `data` JSON column, and
`sendEmail` reads are unchanged.

**Telemetry:** `notification_dispatch` capture via `getPostHogClient()`
([posthog.ts](../../../src/lib/server/posthog.ts)), `distinctId: 'server'`, properties
`{ persisted, emailed, emailFailures, types }`.

**Sequencing rationale:** Phase 1 is purely additive (seam + channel, nothing calls it yet), so it
ships green. Phases 2–3 migrate behind it. Phase 4 deletes the old API only once nothing imports
it. Each task compiles and keeps the suite green on its own.

## Tasks

**Phase 1 — Introduce the seam (additive)**
- [x] Add `email_channel.ts`: `NotificationChannel` interface + `EmailChannel` wrapping `sendEmail`.
- [x] Add `dispatcher.ts`: types, `EMAIL_ENABLED_TYPES` (moved), `dispatchNotifications` (persist
      → route email-enabled+`link` intents to `EmailChannel` → PostHog capture → `DispatchResult`).
- [x] Add `dispatcher.test.ts`: persistence count, email routing only for email-enabled types with
      a link, email failure is non-fatal and counted, PostHog capture fires. (6 tests)

**Phase 2 — Pure builders**
- [x] Convert `registration_notifications.ts` `notify*` → `notificationsForX` (return intents);
      preserve all recipient logic.
- [x] Convert `tag_notifications.ts` → `notificationsForTagRejected`.
- [x] Rewrite `registration_notifications.test.ts` as table-driven pure-builder tests (assert
      intent arrays — recipients, types, keys, data); no Prisma/Resend mocks.

**Phase 3 — Migrate call sites onto the seam**
- [x] `registration-workflow.ts` (6 sites) via `dispatchNotifications(notificationsForX(...))`,
      keeping `runNotificationWork`. Update `registration-workflow.test.ts`.
- [x] `category-lifecycle.ts` (table assignments, payment reminder w/ count, status-change intents).
      Update `category-lifecycle-autostop.test.ts`.
- [x] `entry-tags.ts` `rejectEntryTag`.
- [x] `auto-cancel.ts` inline intents. Update `auto-cancel.test.ts`.
- [x] `auto-stop-webhook.ts`: injected dep `createNotification` → `dispatchNotifications`; build
      intents inline; update `+server.ts` wiring and `auto-stop-webhook.test.ts`.
- [x] Route call sites: `remind`, `cancel`, `admin/review_requests` (×2),
      `external-participants/claim`, `onboarding` (dropped the dynamic import).

**Phase 4 — Remove old API & verify**
- [x] Delete `createNotification` / `createNotificationForUsers` / `shouldSendMail` /
      `EMAIL_ENABLED_TYPES` from `notifications.ts`; retire `notifications.test.ts` (email-coupling
      cases now covered by `dispatcher.test.ts`). Confirmed no remaining imports.
- [x] `pnpm check` (0 errors) + `pnpm test` green for this scope (the 7 remaining failures —
      `CategoryCapacityRow`, `send_password_reset_email`, `login` — are pre-existing and unrelated;
      verified identical on a clean tree).
- [ ] Manual verification (`/verify`): confirm a registration (paid category) → assert a
      `Notification` row written, a Resend email sent, and a `notification_dispatch` PostHog event;
      trigger an auto-cancel/auto-stop path → DB-only notification, no email, event fired.
- [x] `graphify update .` to refresh the knowledge graph (no API cost).
- [ ] **After merge: run `/feature-doc` (Stage 5)** to write `05-workflow.md` — the completion gate.

## Open questions

1. **`DispatchResult` consumption.** Should any caller branch on `emailFailures` (e.g. the `remind`
   endpoint surfacing partial-email-failure to the organizer), or is logging + telemetry enough for
   now? Plan assumes the latter (behavior-preserving).
2. **`createMany` vs per-row create.** Intents with multiple `userIds` map cleanly to `createMany`,
   but if we ever need the created rows' IDs back (we don't today), per-row `create` would be
   required. Plan assumes `createMany` is fine.
