---
slug: notifications-indicator
stage: ideas
feature: Notifications unread indicator (nav red dot)
issue: null
status: draft
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/notifications-indicator/01-problem.md
  - docs/features/notifications-indicator/assessment-roast.md
  - docs/features/notifications-indicator/03-design.md
  - docs/features/notifications-indicator/04-plan.md
---

# Notifications unread indicator — Ideas

Problem: [docs/features/notifications-indicator/01-problem.md](./01-problem.md)
Assessment: [docs/features/notifications-indicator/assessment-roast.md](./assessment-roast.md)

The unread dot in the app-bar bell is hardcoded `false`
([`Header.svelte:16`](../../../src/lib/components/common/layout/Header.svelte)). Three separate
unread mechanisms already exist (pull store + endpoint, Ably realtime resolver, Header-local flag)
and none are connected. The ideation centres on **which freshness mechanism to keep**, because that
decision drives whether the orphaned Ably resolver is wired or deleted.

## Ably free-tier cost analysis (decisive input)

Coarse prediction of what a realtime notifications path would cost, derived from the existing
competition realtime pattern ([`ably-adapter.ts`](../../../src/lib/events/client/ably-adapter.ts),
[`server/ably.ts`](../../../src/lib/events/server/ably.ts)). Ably bills messages on **both** ends
(1 publish + 1 delivery per subscriber) and enforces **peak concurrent** connection/channel caps.

> **Free-tier limits (confirmed against [Ably's pricing limits page](https://ably.com/docs/platform/pricing/limits),
> 2026-06):** 6,000,000 messages/month, 200 concurrent connections, 200 concurrent channels.

The only viable realtime design is **one channel per user** (`notifications:{userId}`) — a shared
channel would fan every notification out to all subscribers (privacy breach + N² messages).

| Metric | Per unit | Free-tier budget | Implied ceiling |
|---|---|---|---|
| Channels | 1 per online user | 200 concurrent | ~200 concurrent users |
| Connections | 1 per online user* | 200 concurrent | ~200 concurrent users |
| Messages / notification | ~2 (publish + deliver) | 6M / month | non-issue (~1.6% at 50k/mo) |
| Messages / N-user broadcast | ~2N | 6M / month | huge headroom |

\* Current code spins up a **new** `Ably.Realtime` client per `useAblyStream`
([`ably-adapter.ts:40`](../../../src/lib/events/client/ably-adapter.ts)), so a user on a competition
page would hold **2** connections unless refactored to multiplex over one shared client.

**Conclusion:** messages are a non-issue, but **concurrency is the ceiling — and realtime
notifications are its worst consumer.** They would make *every logged-in user on every page* hold an
Ably connection just to maybe see a dot, drawing from the **same 200-connection budget** the
competition live-results feature genuinely needs. Pull-on-navigation costs **zero** Ably
channels/connections/messages.

## Candidate directions

### Option A — Pull on navigation (CHOSEN)
**What:** Wire the Header bell (and drawer entry) to the existing shared store. Call
`refreshHasUnread()` on mount and after each navigation; the dot reflects `notificationState.hasUnread`.
Delete the orphaned Ably realtime resolver and `NotificationEventState` type.
**Data/powered by:** existing [`notifications.svelte.ts`](../../../src/lib/stores/notifications.svelte.ts)
store → `GET` [`/api/notifications/unread-count`](../../../src/routes/(internal)/api/notifications/unread-count/+server.ts)
→ [`hasUnreadForUser`](../../../src/lib/notifications/notifications.ts) (`Notification.read`).
**Effort:** Quick.
**Trade-off:** Dot may lag until the next navigation (no live push). Acceptable — notifications are
low-urgency, and the user already navigates to `/notifications` to act on them, which clears it.

### Option B — Pull + realtime (both)
**What:** Pull on mount for initial state, plus subscribe to a per-user Ably channel for live push;
add a publisher inside `createNotification` / `createNotificationForUsers`.
**Data/powered by:** the store/endpoint **plus** the already-built
[`resolveNotificationState`](../../../src/lib/events/channels/notifications.ts) + a new Ably publisher.
**Effort:** High (wire resolver, add publisher, manage a 2nd connection / multiplex refactor).
**Trade-off:** Instant dot, but spends the scarce 200-connection budget on the least time-sensitive
feature (see analysis). Rejected on cost grounds.

### Option C — Realtime only
**What:** Drop the pull path; rely on server-load initial state + Ably push.
**Data/powered by:** `resolveNotificationState` + publisher; no store pull.
**Effort:** Medium–High.
**Trade-off:** Same concurrency cost as B, plus a gap on first paint and coupling to Ably connection
health. Rejected.

## Recommendation

**Option A — Pull on navigation.** It reuses code that already exists, fixes the visible bug with
the least surface area, and consumes none of the contended Ably concurrency budget. It also lets us
**delete dead code** (`resolveNotificationState`, `NotificationEventState`), collapsing the three
disconnected mechanisms down to one honest source of truth: the shared store.

**In scope:**
- Header bell reads the shared `notificationState` store (not its private `hasUnread`).
- `refreshHasUnread()` invoked on mount + after navigation.
- Drawer "Notifications" entry gets the same dot (recommended; confirm in design).
- Delete the orphaned Ably notifications resolver + unused type.

**Out of scope:** realtime push, unread *count* badge (dot only), any schema change, email/notification
*creation* changes.

## Open questions for design

1. **Refresh triggers:** mount + `afterNavigate` only, or also on window focus / a light interval?
   What's the acceptable staleness window?
2. **Scope confirm:** dot on both app-bar **and** drawer (recommended), or app-bar only?
3. **Store wiring:** confirm the Header subscribes to `notificationState` so the page's mark-all-read
   clears the nav dot without a refetch.
4. **Dead-code removal boundary:** confirm nothing else references `resolveNotificationState` /
   `NotificationEventState` before deletion (current grep says no).
5. **Test lock-in:** assert dot renders when `hasUnread` is true and clears after mark-all-read.
