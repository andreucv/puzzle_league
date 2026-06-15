---
slug: notification-dispatch-seam
stage: design
feature: Notification dispatch seam
issue: null
status: approved
created: 2026-06-15
updated: 2026-06-15
related:
  - docs/features/notification-dispatch-seam/04-plan.md
---

# Design: Notification dispatch seam

Scope: [`src/lib/notifications/notifications.ts`](../../../src/lib/notifications/notifications.ts),
[`registration_notifications.ts`](../../../src/lib/notifications/registration_notifications.ts),
[`tag_notifications.ts`](../../../src/lib/notifications/tag_notifications.ts),
[`src/lib/emails/send_email_utils.ts`](../../../src/lib/emails/send_email_utils.ts), and every
service/route that fires notifications (enumerated in §5).
Refs: [ARCHITECTURE.md → Realtime And Notifications](../../ARCHITECTURE.md),
[GLOSSARY.md → Notification, Notification Intent, Notification Dispatcher](../../GLOSSARY.md).
Origin: architecture-review candidate #3 (the notification/email dispatch seam).

## Problem

Today, sending a notification fuses three concerns in one call. [`createNotification`](../../../src/lib/notifications/notifications.ts)
(and `createNotificationForUsers`) (a) writes the `Notification` row, (b) decides whether the
type also emails via the in-file `EMAIL_ENABLED_TYPES` set, and (c) synchronously calls
`sendEmail`, swallowing failures with `.catch(console.error)`. Failures are then swallowed *again*
in `sendEmail` (its own try/catch) and a *third* time in callers like
`registration-workflow`'s [`runNotificationWork`](../../../src/lib/services/registration-workflow.ts).

Consequences:

- **No seam.** There is no single place that represents "deliver these notifications," so there is
  nowhere to batch, retry, disable, or observe delivery.
- **The domain `notify*` builders are impure.** The 572-line `registration_notifications.ts`
  computes recipients *and* performs I/O, so testing recipient logic requires mocking Prisma and
  Resend through three layers.
- **Email coupling is invisible.** Whether a type emails is buried inside the create call, not a
  property of the dispatch decision.

**Guiding principle:** make the *intent to notify* a value, and put one **Notification Dispatcher**
behind it. Builders become pure functions of their input → `NotificationIntent[]`; the dispatcher
owns persistence, the email decision, failure handling, and observability. **This refactor is
behavior-preserving** — the set of notifications and emails a user receives, and their timing
(post-commit), stay identical. What changes is internal structure and testability.

## Design

### 1. The currency — `NotificationIntent`

A plain, serialisable description of one notification to one *or many* users. No methods, no I/O.
It is the union of what `createNotification` and `createNotificationForUsers` accept today:

```ts
interface NotificationIntent {
  userIds: string[];                 // one entry → many recipients sharing identical content
  type: NotificationType;
  title: string;                     // translation key
  message: string;                   // translation key
  link?: string;
  data?: Record<string, string | number | boolean>;
  actorName?: string;                // used as email "from" display + sender attribution
  translationKey?: string;           // email template variant selector
}
```

Single-recipient calls become a one-element `userIds`. This collapses the two existing create
functions into one shape and lets the dispatcher batch a whole flow's rows in fewer queries.

### 2. The seam — `dispatchNotifications`

One function, the only thing services and routes call:

```ts
function dispatchNotifications(
  intents: NotificationIntent[],
): Promise<DispatchResult>;

interface DispatchResult {
  persisted: number;                 // Notification rows written
  emailed: number;                   // intents routed to the email channel
  emailFailures: number;             // non-fatal; surfaced for telemetry, not thrown
}
```

Behaviour:

1. Persist all `Notification` rows (grouped `createMany` per intent — same writes as today).
2. For each intent whose `type` is email-enabled **and** has a `link`, hand it to the
   **email channel** (§3).
3. Return a `DispatchResult`. **Persistence failure does not roll back any domain mutation** —
   dispatch already runs post-commit (§5). **Email failure is non-fatal** and counted, not thrown.

The email decision (`EMAIL_ENABLED_TYPES`) moves *out* of the create helpers and becomes
configuration the dispatcher owns.

### 3. Email as a downstream channel adapter

The dispatcher does not call `sendEmail` directly; it calls a channel with a narrow interface:

```ts
interface NotificationChannel {
  send(intents: NotificationIntent[]): Promise<{ sent: number; failed: number }>;
}
```

The only adapter in this iteration is `EmailChannel`, a thin wrapper over the existing
[`sendEmail`](../../../src/lib/emails/send_email_utils.ts) (locale resolution, multi-language
templates, Resend — all unchanged). **Synchronous, in-process, best-effort, exactly as today.**

This is the seam that earns the design: a future `OutboxChannel` (durable table + drained worker
with retry/backoff) can be swapped behind `NotificationChannel` **without touching a single
caller** — that is the deferred path, not built now (see Out of scope).

### 4. Domain `notify*` helpers → pure intent builders

Every domain helper stops doing I/O and instead *returns* intents. Naming convention: `notifyX`
(does I/O) → `notificationsForX` (pure value). The `notificationsFor…` prefix keeps the name
unmistakably notification-oriented when read at a call site far from this file, and reads as a value
rather than an action. Concretely, in
[`registration_notifications.ts`](../../../src/lib/notifications/registration_notifications.ts) and
[`tag_notifications.ts`](../../../src/lib/notifications/tag_notifications.ts):

| Today (impure, calls `createNotification*`) | After (pure) |
|---|---|
| `notifyRegistrationCreatedForTeammates` | `notificationsForRegistrationCreated` |
| `notifyRegistrationWaitlisted` | `notificationsForRegistrationWaitlisted` |
| `notifyRegistrationConfirmed` | `notificationsForRegistrationConfirmed` |
| `notifyRegistrationRefused` | `notificationsForRegistrationRefused` |
| `notifyWaitlistPromotion` | `notificationsForWaitlistPromotion` |
| `notifyPaymentReminder` | `notificationsForPaymentReminder` (+ caller derives notified-user count) |
| `notifyTableAssignments` | `notificationsForTableAssignment` |
| `notifyTagRejected` | `notificationsForTagRejected` |

All the recipient logic (creator-is-participant branching, teammate-name assembly, `@:`-prefixed
translation keys, per-entry payment messages) is **preserved verbatim** — it just produces an
array instead of awaiting `createNotification`. `notifyPaymentReminder`'s current return value (the
distinct notified-user count) is recomputed from the built intents' `userIds`.

### 5. Call-site migration (all sites, post-commit)

Per the agreed scope, **every** call site migrates in this pass; there is no compatibility shim.
Each service/route builds intents, then makes one `dispatchNotifications` call, keeping the current
**post-commit** timing (`runNotificationWork` stays as the catch-and-log wrapper around the
dispatch call). Sites:

Domain-builder consumers:
- [`registration-workflow.ts`](../../../src/lib/services/registration-workflow.ts) — 6 call sites
  (`submitRegistration`, `confirm`, `refuse`, waitlist promotion ×2).
- [`category-lifecycle.ts`](../../../src/lib/services/category-lifecycle.ts) — `publishTableAssignments`,
  `remindPendingPayments`, plus its inline `createNotificationForUsers` (category status change).
- [`entry-tags.ts`](../../../src/lib/services/entry-tags.ts) — `rejectEntryTag`.
- [`api/registrations/[id]/remind/+server.ts`](../../../src/routes/(internal)/api/registrations/[id]/remind/+server.ts).

Direct `createNotification*` consumers (inline intents, no domain builder):
- [`auto-cancel.ts`](../../../src/lib/services/auto-cancel.ts) — competition auto-cancel.
- [`auto-stop-webhook.ts`](../../../src/lib/services/auto-stop-webhook.ts) +
  [`api/webhooks/qstash/auto-stop/+server.ts`](../../../src/routes/(internal)/api/webhooks/qstash/auto-stop/+server.ts)
  — these inject `createNotification` as a dependency; the injected dep becomes `dispatchNotifications`.
- [`api/competitions/[id]/cancel/+server.ts`](../../../src/routes/(internal)/api/competitions/[id]/cancel/+server.ts).
- [`admin/review_requests/+page.server.ts`](../../../src/routes/(internal)/admin/review_requests/+page.server.ts) — role request outcomes (×2).
- [`api/external-participants/claim/+server.ts`](../../../src/routes/(internal)/api/external-participants/claim/+server.ts).
- [`(auth)/onboarding/+page.server.ts`](../../../src/routes/(internal)/(auth)/onboarding/+page.server.ts) — dynamic-imported create call.

`createNotification` / `createNotificationForUsers` are then **removed** (their email branch folds
into the dispatcher; their persistence folds into it too). The query/read helpers in
`notifications.ts` (`getNotificationsForUser`, `hasUnreadForUser`, `markNotificationAsRead`,
`markAllNotificationsAsRead`) are unrelated and stay put.

### 6. Failure handling & observability

- DB persistence error → returned in `DispatchResult` and logged; **never** rolls back the domain
  mutation (dispatch is post-commit by construction).
- Email error → counted in `emailFailures`, logged, never thrown (matches today).
- The dispatcher emits a PostHog `notification_dispatch` capture (`persisted` / `emailed` /
  `emailFailures`, plus the distinct notification `type`s in the batch) — replacing today's three
  scattered swallow points with one observable seam. Uses the server PostHog singleton
  ([`src/lib/server/posthog.ts`](../../../src/lib/server/posthog.ts)) with `distinctId` =
  `'server'` (dispatch runs post-commit in service/cron context, not tied to one request user).
  **In scope for this change.**

### 7. What stays identical (behavior-preservation contract)

- Same notifications to the same users with the same translation keys and data.
- Same email types (`REGISTRATION_CONFIRMED/REFUSED/PROMOTED`, `PAYMENT_REMINDER`), same
  locale/multi-language rendering, same Resend path.
- Same **post-commit** timing; same best-effort, never-blocking failure semantics.
- No realtime/Ably change (that is candidate #9, separate).

## Data / model impact

**No schema change.** No new tables, columns, or migrations. The `Notification` model, the `data`
JSON column, and `sendEmail`'s `User.locale`/`email` reads are all reused as-is. `NotificationIntent`,
`DispatchResult`, and `NotificationChannel` are TypeScript types only. The durable-outbox option
that *would* need a table was explicitly deferred.

## Out of scope

- **Durable outbox / retry queue.** Deliberately deferred; the `NotificationChannel` seam exists so
  it can be added later behind the same interface with no caller changes.
- **Writing `Notification` rows inside the domain transaction.** Stays post-commit; the
  crash-between-commit-and-dispatch gap is documented, not fixed here.
- **Changing which types email**, email templates, or localisation logic.
- **Realtime/Ably publishing** (architecture candidate #9).

## Resolved decisions

1. **Module home for the dispatcher.** Keep it in the existing `src/lib/notifications/`. Add
   `dispatcher.ts` (`dispatchNotifications`, `NotificationIntent`, `DispatchResult`,
   `NotificationChannel`) and `email_channel.ts` (`EmailChannel` over `sendEmail`). No new
   subfolder — the seam lives beside the builders and the `Notification` read helpers it replaces,
   and a future `outbox_channel.ts` drops in next to `email_channel.ts`.
2. **Telemetry.** The `notification_dispatch` PostHog capture is **in scope** for this change (see
   §6).
3. **Builder file organisation.** Rename the functions in place; keep the files
   `registration_notifications.ts` and `tag_notifications.ts`. The `notificationsForX` names
   already signal purity, and keeping the files bounds the diff and preserves their import paths
   for the call sites that don't move.
