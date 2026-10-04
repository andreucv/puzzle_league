---
slug: table-reminder-103
stage: design
feature: Send table assignments once, one hour before the Category starts
issue: "#103"
status: approved
created: 2026-10-04
updated: 2026-10-04
related:
  - docs/features/table-reminder-103/04-plan.md
---

# Design: Send table assignments once, one hour before the Category starts

Scope: [`publishTableAssignments`](../../../src/lib/services/category-lifecycle.ts) (publish-tables
action), the competition edit action
([`+page.server.ts`](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.server.ts)),
a new QStash scheduler + webhook modelled on
[`registration-open-scheduler.ts`](../../../src/lib/services/registration-open-scheduler.ts) /
[`registration-open-webhook.ts`](../../../src/lib/services/registration-open-webhook.ts), and
[`notificationsForTableAssignment`](../../../src/lib/notifications/registration_notifications.ts).

Refs: [registration workflow — table assignment](../../workflows/registration-workflow.md) (§ "Publish
tables", notifications line 293), [ARCHITECTURE.md](../../ARCHITECTURE.md) (QStash automation).

## Problem

"Publish tables" renumbers every `CONFIRMED` Entry `1..N` (ordered by `confirmedAt`, `createdAt`) and
sends `TABLE_ASSIGNED` to every Entry whose number changed. Removing one Entry and publishing again
moves every later Entry down one table, so most participants get a new email for what is, to them,
the same information. Republishing should be rare, but organizers expect tables numbered without
gaps (they plan the room by hand as `1..N`), so the compaction stays.

**Guiding principle:** table numbers are the organizer's working data until the event. Participants
hear about their table **once**, close to the start, with the final value.

## Design

### 1. Publishing tables never notifies

`publishTableAssignments` keeps its current assignment logic unchanged (compact `1..N`, ordered by
`confirmedAt ASC, createdAt ASC`) but **no longer dispatches any notification**. It returns
`{ assignedCount }`; `notifiedCount` is dropped from the service and the
`POST /api/categories/[id]/publish-tables` response (the UI does not read it).

The confirmation dialog copy (`manage_registrations.publish_tables_confirm_message`, en/es/ca)
currently says it "will … send an in-app notification to all confirmed participants". It changes to
say that participants are notified of their table one hour before the Category starts.

Publishing also **schedules the reminder** (§3).

### 2. One reminder, one hour before `Category.startTime`

At `startTime − 1h` the system sends `TABLE_ASSIGNED` (email + in-app, the existing channels for this
type) to every user on every `CONFIRMED` Entry that has a `tableNumber`, using the **stored**
numbers at that moment. It reuses `notificationsForTableAssignment(entries, category)` unchanged:
participant / team / creator-of-externals variants and the existing `table_assigned*` copy.

It is sent **at most once per Category**, never again afterwards (no change notifications, even if
tables are republished or `startTime` moves).

Nothing is sent when:

| Situation at reminder time | Result |
|---|---|
| No `CONFIRMED` Entry has a `tableNumber` (tables never published) | No notification |
| Category is not `NOT_STARTED` (live, stopped, complete, canceled) | No notification |
| Reminder already sent for this Category | No notification |
| Tables first published after `startTime − 1h` (late assignment) | Nothing is scheduled → no notification |
| QStash not configured (`QSTASH_TOKEN` / `QSTASH_PUBLIC_APP_URL` missing, e.g. local dev) | Feature disabled; publishing still assigns tables |

### 3. Scheduling: one delayed QStash message per Category

New `table-reminder-scheduler.ts`, a copy of the registration-open pattern:

- `publish(categoryId, startTime)` sends `{ categoryId, startTime }` to
  `/api/webhooks/qstash/table-reminder` with `notBefore = min(startTime − 1h, now + MAX_HOP_MS)`
  (reusing the 6-day hop limit for QStash's max delay).
- Messages are never cancelled. A message whose body `startTime` no longer matches the stored value
  does nothing.

A message is published (`schedule if eligible`) when **all** of these hold: QStash configured,
Category `NOT_STARTED`, reminder not yet sent, `startTime − 1h > now`. The triggers are:

1. **Publish tables** (§1): schedule after assigning. Republishing schedules a duplicate message with
   the same `startTime`; the "sent once" guard (§5) makes it do nothing.
2. **Competition edit save**: for each *updated* Category whose `startTime` changed **and** that has
   at least one Entry with a `tableNumber`, schedule with the new `startTime`. The action reads the
   previous `startTime`s before calling `updateCompetition` to detect the change. New Categories are
   skipped (they have no tables yet), and saves that don't move `startTime` publish nothing.

Categories that already exist at deploy time with published tables get no reminder until tables are
republished or `startTime` changes. That's acceptable (the old flow already notified them).

### 4. Webhook `POST /api/webhooks/qstash/table-reminder`

Pure handler `handleTableReminderWebhook` (injected `receiver`, `db`, `scheduler`,
`dispatchNotifications`, `now`), mirroring `handleRegistrationOpenWebhook`. It always returns 2xx
except for a bad signature, so QStash doesn't retry messages that do nothing:

1. Verify signature → 401 on failure.
2. Load the Category. If it's missing or `startTime ≠ body.startTime` → `Stale schedule`.
3. `status ≠ NOT_STARTED` or reminder already sent → `Not applicable`.
4. `now < startTime − 1h − 1s` → publish the next hop → `Rescheduled next hop`.
5. Load `CONFIRMED` Entries with `tableNumber != null` (same `select` as `publishTableAssignments`).
   None → `No tables` (do not mark as sent).
6. Claim: `updateMany({ where: { id, tableReminderSentAt: null }, data: { tableReminderSentAt: now } })`.
   `count === 0` → `Already sent` (a concurrent duplicate message won).
7. `dispatchNotifications(notificationsForTableAssignment(entries, category))`.

Claiming before dispatching means at most one send: a crash between steps 6 and 7 loses the
reminder rather than sending it twice. That fits the goal of avoiding spam.

### 5. "Sent once" guard

A new nullable field `Category.tableReminderSentAt DateTime?` records when the reminder went out.
This one field covers duplicate messages (republished tables, `startTime` edited A→B→A, QStash
retries) and the "never again after sending" rule. It is only set by the webhook claim (§4.6).

## Data / model impact

- **Schema:** add `tableReminderSentAt DateTime?` to `Category` (edit `schema.prisma` only; migration
  is run by the user). Not exposed to the client.
- **Reused:** `Entry.tableNumber`, `Entry.status`, `Category.startTime`, `Category.status`,
  `notificationsForTableAssignment`, `NotificationType.TABLE_ASSIGNED`, the `table_assigned*`
  translations and email template, the QStash client/receiver env vars and hop constant.
- **New:** `table-reminder-scheduler.ts`, `table-reminder-webhook.ts` (+ route), API whitelist entry
  for the webhook route (as for `registration-open`).
- **Changed:** `publishTableAssignments` (no dispatch, schedules reminder), publish-tables response
  (drop `notifiedCount`), the competition edit action (schedule when `startTime` changes),
  `publish_tables_confirm_message` in en/es/ca.
- **Docs:** `docs/workflows/registration-workflow.md` (table notification rule),
  `docs/ARCHITECTURE.md` (QStash automation list).

## Out of scope

- Changing how tables are assigned (order, compaction, manual per-Entry edits).
- A configurable lead time (fixed 1 hour).
- Change notifications after the reminder, or a reminder for late assignments.
- Cancelling superseded QStash messages (they do nothing when they arrive; storing message ids is
  only worth it if QStash quota becomes a concern).
- Reminder-specific copy (the existing "you have been assigned Table N" wording is reused).

## Open questions

None. Resolved with the user (2026-10-04):

1. **Postponing after the reminder was sent:** no new reminder. One reminder per Category, ever;
   changing `startTime` never resets `tableReminderSentAt`.
2. **Copy:** keep the existing `table_assigned*` wording unchanged.
