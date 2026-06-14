---
slug: notifications-indicator
stage: problem
feature: Notifications unread indicator (nav red dot)
issue: null
status: draft
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/notifications-indicator/assessment-roast.md
  - docs/features/notifications-indicator/02-ideas.md
  - docs/features/notifications-indicator/03-design.md
  - docs/features/notifications-indicator/04-plan.md
---

# Notifications unread indicator — Problem

## Context

Every authenticated user sees a bell icon in the top app bar
([`Header.svelte:47-52`](../../../src/lib/components/common/layout/Header.svelte)) linking to
`/notifications`, and a matching "Notifications" entry in the drawer
([`DrawerNav.svelte:91-96`](../../../src/lib/components/common/layout/DrawerNav.svelte)). The bell is
supposed to show a small red dot when the user has unread notifications, so they know to open the
page. The notifications themselves are created server-side via
[`createNotification` / `createNotificationForUsers`](../../../src/lib/notifications/notifications.ts)
for registration, role-request, table-assignment, competition and payment-reminder events, and are
listed on the [notifications page](../../../src/routes/(internal)/notifications/+page.svelte) with
per-type icons, i18n, and mark-as-read.

A deeper health-check of the whole subsystem (scoring + roast) lives in
[`assessment-roast.md`](./assessment-roast.md); this file frames only the problem.

## Problem

1. **The red dot never appears.** The Header gates the indicator on a local variable that is
   hardcoded to `false` and never reassigned —
   [`Header.svelte:15-16`](../../../src/lib/components/common/layout/Header.svelte):
   `// TODO: Replace with Ably subscription… / let hasUnread = $state(false);`. The
   `{#if hasUnread}` dot at line 49 is therefore unreachable. The feature has never functioned.

2. **The data source the Header needs already exists but is never called.** `refreshHasUnread()` in
   [`stores/notifications.svelte.ts`](../../../src/lib/stores/notifications.svelte.ts) fetches
   `GET /api/notifications/unread-count`
   ([endpoint](../../../src/routes/(internal)/api/notifications/unread-count/+server.ts), backed by
   [`hasUnreadForUser`](../../../src/lib/notifications/notifications.ts)). Grep shows **zero
   callers** of `refreshHasUnread` anywhere in the app — the endpoint is effectively dead.

3. **A realtime path was built and left unplugged on both ends.**
   [`resolveNotificationState`](../../../src/lib/events/channels/notifications.ts) and the
   `NotificationEventState` type ([`events/types.ts:23-28`](../../../src/lib/events/types.ts)) exist,
   but nothing imports them, `createNotification` never publishes to Ably, and no client subscribes.
   Unlike competition events, there is no `applyNotificationEvent` reducer either.

4. **The Header and the page disagree about state.** The notifications page updates the shared
   store (`notificationState.hasUnread = false` on mark-as-read,
   [`+page.svelte:99,110`](../../../src/routes/(internal)/notifications/+page.svelte)), but the
   Header reads its **own** private `hasUnread`, not the store — so even a correct store value would
   not reach the indicator, and clearing notifications would not clear the dot.

5. **The drawer entry has no indicator at all** — only the app-bar bell was ever given a dot, so
   there is no unread cue for users navigating via the drawer.

## Who it affects & why it matters

- **All authenticated users (participants, organizers, admins).** Registrations confirmed/refused,
  waitlist promotions, table assignments, role-request decisions and payment reminders all generate
  notifications, but users get **no passive signal** that something happened — they must remember to
  open `/notifications` and check. Time-sensitive items (payment reminders, promotions with a
  response window) are the most likely to be missed.
- **The product** ships a visible bell that implies live status it never delivers, eroding trust in
  the notification surface generally.
- **The codebase** carries more dead notification-surfacing code than live code (three disconnected
  mechanisms), making the subsystem hard to reason about and risky to change.

## Constraints / prior ideas

- **No schema change needed** to fix the core bug — `Notification.read` and the unread query
  already exist.
- **Existing infrastructure should be reused, not re-invented** — the store, endpoint and (if kept)
  the Ably resolver already implement most of the work; the gap is wiring.
- **Realtime is optional for v1.** A pull-on-mount (and on navigation) would fix the visible bug;
  realtime is an enhancement. The Stage 2 ideation should decide whether to keep, wire, or delete
  the Ably path rather than leave it orphaned.
- Follow existing Svelte 5 runes + shared-store patterns and the project's `$lib` import
  conventions.

## Open questions

1. **Pull, realtime, or both?** Is on-mount/on-navigation fetching of `unread-count` sufficient, or
   do we want live updates via the already-built Ably resolver (which then also needs a publisher in
   `createNotification`)?
2. **Single source of truth:** should the Header consume the shared `notificationState` store so the
   page and nav stay in sync, and should the orphaned mechanism(s) we don't choose be deleted?
3. **Scope of the indicator:** dot only, or unread *count* badge? App-bar bell only, or also the
   drawer entry?
4. **When does the dot refresh?** On every navigation, on an interval, on focus, and/or on realtime
   push — what's the freshness expectation?
5. **Test coverage:** what minimum assertion(s) lock this in (e.g. dot renders when `hasUnread` is
   true, clears after mark-all-read)?
