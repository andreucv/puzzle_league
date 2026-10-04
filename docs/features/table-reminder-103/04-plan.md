---
slug: table-reminder-103
stage: plan
feature: Send table assignments once, one hour before the Category starts
issue: "#103"
status: approved
created: 2026-10-04
updated: 2026-10-04
related:
  - docs/features/table-reminder-103/03-design.md
---

# Implementation Plan: Send table assignments once, one hour before the Category starts

Resolves **#103 — "[table assignments] When deleting one registered already accepted with a table
assigned, when asking to assign tables again, all changes"**.

Publishing tables keeps today's compact `1..N` assignment but stops notifying. Each participant
gets a single `TABLE_ASSIGNED` notification (email + in-app, existing wording) one hour before
`Category.startTime`, sent through a delayed QStash message per Category. It's sent at most once per
Category, never for late assignments, and never when there's no table data.

- Design: [03-design.md](03-design.md)
- Docs: [registration workflow](../../workflows/registration-workflow.md) (publish tables, notifications),
  [ARCHITECTURE.md](../../ARCHITECTURE.md) (QStash automation),
  [CONTRIBUTING.md](../../CONTRIBUTING.md) (testing, no manual migrations)

## Architecture and design

The new modules follow the registration-open pair
([`registration-open-scheduler.ts`](../../../src/lib/services/registration-open-scheduler.ts),
[`registration-open-webhook.ts`](../../../src/lib/services/registration-open-webhook.ts) and its
[route](../../../src/routes/(internal)/api/webhooks/qstash/registration-open/+server.ts)): a pure
handler with injected `receiver`/`db`/`scheduler`/`dispatchNotifications`/`now`, and a thin route.

**Schema** ([schema.prisma](../../../prisma/schema.prisma), `Category`)
- Add `tableReminderSentAt DateTime? // Set once when the 1h-before-start table reminder is sent (#103); never reset.`
- Only `schema.prisma` is edited; the user runs `prisma migrate dev`.
- Not exposed to the client: the edit/manage loaders select explicit fields. Check `db_competition.ts`
  `getCompetitionCategories` (it spreads the category) and strip the field there as is done for
  `autoStopMessageId` if needed.

**New `src/lib/services/table-reminder-scheduler.ts`**
- `TABLE_REMINDER_LEAD_MS = 60 * 60 * 1000`; `reminderTime(startTime) = startTime − lead`.
- `createTableReminderScheduler({ qstashClient, webhookUrl })` → `publish(categoryId, startTime)` with
  body `{ categoryId, startTime }` and `notBefore = nextDeliveryTime(reminderTime(startTime))`, reusing
  `nextDeliveryTime`/`MAX_HOP_MS` imported from `registration-open-scheduler.ts`.
- `getTableReminderScheduler()` singleton, `null` when QStash isn't configured (reuses
  `isRegistrationScheduleAvailable()`, since the env vars are the same). Webhook URL
  `${QSTASH_PUBLIC_APP_URL}/api/webhooks/qstash/table-reminder`.
- `scheduleTableReminder(categoryId, { db, scheduler, now })` is the single eligibility gate used by
  both triggers. It loads `{ status, startTime, tableReminderSentAt }` plus a count of `CONFIRMED`
  entries with `tableNumber != null`, and publishes only if: scheduler present, `NOT_STARTED`, not
  sent, has tables, `reminderTime(startTime) > now`. It **never throws**: QStash errors are logged
  (`console.error`) so publishing tables or saving a competition never fails because of the reminder
  (same stance as `triggerCategoryFollowersNotification`).

**New `src/lib/services/table-reminder-webhook.ts`**: `handleTableReminderWebhook`, steps exactly as
in design §4: signature → stale `startTime` → not `NOT_STARTED` / already sent → hop if early (1s skew
tolerance) → load `CONFIRMED` entries with `tableNumber != null` (same `select` as
`publishTableAssignments`; none → no-op, not marked) → claim with conditional `updateMany` on
`tableReminderSentAt: null` → `dispatchNotifications(notificationsForTableAssignment(entries, category))`.
It always returns 2xx except a bad signature (401).

**New route `src/routes/(internal)/api/webhooks/qstash/table-reminder/+server.ts`**: a copy of the
registration-open route (503 when QStash isn't configured). Already covered by the `/api/webhooks/`
prefix in [`api_whitelist.ts`](../../../src/lib/api_utils/api_whitelist.ts); no guard change.

**Changed: [`publishTableAssignments`](../../../src/lib/services/category-lifecycle.ts)**
- Keep the query, ordering and `$transaction` renumbering as they are.
- Remove the previous-table map, the changed-entries filter and `dispatchNotifications`. Drop the
  `notificationsForTableAssignment` import if unused (it's still used by the webhook).
- After renumbering, `await scheduleTableReminder(categoryId, …)`.
- Return `{ assignedCount }`; update the doc comment.
- [`publish-tables/+server.ts`](../../../src/routes/(internal)/api/categories/[id]/publish-tables/+server.ts):
  drop `notifiedCount` from the response (the UI only reads `success`/`assignedCount`).

**Changed: competition edit action**
([`+page.server.ts`](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.server.ts),
`create_update_competition`)
- On edit (`competitionId` set), before `updateCompetition`, read the existing
  `category.findMany({ where: { competitionId }, select: { id, startTime } })`.
- After a successful save, for each `categories.update` item whose new `startTime` differs from the
  stored one, call `scheduleTableReminder(id, …)`. New Categories are skipped (no tables yet). The
  helper's gate handles everything else.

**i18n**: `manage_registrations.publish_tables_confirm_message` in `en`/`es`/`ca` `common.json`.
Replace "send an in-app notification to all confirmed participants" with "participants will be
notified of their table one hour before the category starts". The `table_assigned*` notification and
email copy is unchanged.

**Tests (Vitest, mocked db as in `registration-open-webhook.test.ts`)**
- `table-reminder-webhook.test.ts`: bad signature 401; stale `startTime`; not `NOT_STARTED`; already
  sent; early → hop (publishes, no dispatch); no tables → no claim, no dispatch; claim `count 0` → no
  dispatch; happy path → claims then dispatches intents for all tabled `CONFIRMED` entries.
- `table-reminder-scheduler.test.ts`: `notBefore` = start − 1h (and capped by the hop limit);
  `scheduleTableReminder` publishes only when every condition holds; skips when the reminder time has
  passed (late assignment), no tables, already sent, not `NOT_STARTED`, or no scheduler; swallows a
  publish error.
- `publishTableAssignments`: assigns compact `1..N` in `confirmedAt, createdAt` order, dispatches
  nothing, and calls the reminder gate.

**Docs**: `docs/workflows/registration-workflow.md` line ~293 (the publish-tables notification rule
becomes the one-hour reminder; add `tableReminderSentAt`) and `docs/ARCHITECTURE.md` (list the
table-reminder webhook among the optional QStash automations).

## Tasks

- [ ] 1. Add `tableReminderSentAt DateTime?` to `Category` in `prisma/schema.prisma`; ask the user to
      run `pnpm prisma migrate dev --name add_category_table_reminder_sent_at`. Make sure the field
      isn't leaked by `getCompetitionCategories` (strip like `autoStopMessageId` if it spreads).
      _Schema edited and client generated; **migration pending (user)**. Not stripped: it's a
      harmless timestamp, like `registrationOpensAt`, which is also spread to the client._
- [x] 2. Create `table-reminder-scheduler.ts` (lead constant, scheduler factory + singleton,
      `scheduleTableReminder` gate) with `table-reminder-scheduler.test.ts`.
- [x] 3. Create `table-reminder-webhook.ts` (`handleTableReminderWebhook`) with
      `table-reminder-webhook.test.ts`.
- [x] 4. Add route `api/webhooks/qstash/table-reminder/+server.ts`.
- [x] 5. Change `publishTableAssignments`: remove the dispatch and change detection, call
      `scheduleTableReminder`, return `{ assignedCount }`; update the publish-tables route response; add
      a unit test (`category-lifecycle-tables.test.ts`).
- [x] 6. Competition edit action: snapshot existing `startTime`s and reschedule the reminder for updated
      Categories whose `startTime` changed.
- [x] 7. Update `publish_tables_confirm_message` in `en`/`es`/`ca` `common.json`.
- [x] 8. `pnpm check` and `pnpm test` (unit) pass.
- [ ] 9. Manual verification (`/run`, with QStash through `ngrok http 5173 --host-header=rewrite` as in
      the local cron-testing notes):
      - Publish tables on a Category starting in ~1h05m → no notification now; `TABLE_ASSIGNED`
        email + in-app arrives ~5 min later; republish → nothing new.
      - Publish tables on a Category starting in < 1h → nothing is ever sent.
      - Category with no tables → its start time passes with no notification.
      - Move `startTime` of a tabled Category → the reminder arrives one hour before the *new* time,
        once.
- [x] 10. Update `docs/workflows/registration-workflow.md` and `docs/ARCHITECTURE.md`.
- [x] 11. `graphify update .`
- [ ] 12. After merge, run **`/feature-doc`** to write `05-workflow.md` (completion gate).

## Open questions

None. Resolved with the user (2026-10-04):

1. **Already-published categories at deploy time:** no backfill. They get a reminder only if tables
   are republished or `startTime` changes.
2. **Claim succeeds but dispatch fails:** the reminder is lost. No rollback of `tableReminderSentAt`;
   avoiding a double send matters more.
