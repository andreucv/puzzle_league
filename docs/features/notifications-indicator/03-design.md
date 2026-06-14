---
slug: notifications-indicator
stage: design
feature: Notifications unread indicator (nav red dot)
issue: null
status: approved
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/notifications-indicator/01-problem.md
  - docs/features/notifications-indicator/assessment-roast.md
  - docs/features/notifications-indicator/02-ideas.md
  - docs/features/notifications-indicator/04-plan.md
---

# Design: Notifications unread indicator (nav red dot)

Scope: [`Header.svelte`](../../../src/lib/components/common/layout/Header.svelte),
[`DrawerNav.svelte`](../../../src/lib/components/common/layout/DrawerNav.svelte),
[`+layout.svelte`](../../../src/routes/+layout.svelte),
[`stores/notifications.svelte.ts`](../../../src/lib/stores/notifications.svelte.ts),
[`/api/notifications/unread-count`](../../../src/routes/(internal)/api/notifications/unread-count/+server.ts).
Deletions: [`events/channels/notifications.ts`](../../../src/lib/events/channels/notifications.ts),
`NotificationEventState` in [`events/types.ts`](../../../src/lib/events/types.ts).
Refs: ARCHITECTURE.md (realtime events, notifications). Problem:
[01-problem.md](./01-problem.md) · Decision: [02-ideas.md](./02-ideas.md) (Option A).

## Problem

The app-bar bell's unread dot is gated on a local `let hasUnread = $state(false)` that is never
reassigned ([`Header.svelte:16`](../../../src/lib/components/common/layout/Header.svelte)), so it
never appears. The store, endpoint and query to compute unread state already exist but have zero
callers; an Ably realtime resolver exists but is unwired on both ends. **Guiding principle:**
collapse the three disconnected mechanisms into **one source of truth** — the shared
`notificationState` store, refreshed by a client pull — and delete the realtime code that the Ably
free-tier concurrency budget can't justify ([02-ideas.md](./02-ideas.md) cost analysis).

## Design

### 1. One source of truth: the shared store

Both nav components read `notificationState.hasUnread` from
[`stores/notifications.svelte.ts`](../../../src/lib/stores/notifications.svelte.ts) (a module-level
Svelte 5 `$state` object — universally reactive across components). No component keeps its own
unread flag.

- **Header:** delete `let hasUnread = $state(false)` and the TODO; `import { notificationState }`
  and gate the dot on `notificationState.hasUnread`.
- **DrawerNav:** import the same store; add a matching dot to the "Notifications" entry.
- **Notifications page** already writes the store on mark-as-read
  ([`+page.svelte:99,110`](../../../src/routes/(internal)/notifications/+page.svelte)) — so marking
  all/one read now **clears the nav dot instantly**, with no refetch. This is the payoff of a single
  source of truth: the page and nav can no longer disagree (problem symptom #4).

### 2. Refresh trigger: `afterNavigate` in the root layout

The dot is populated by a client pull, driven once from the always-mounted root
[`+layout.svelte`](../../../src/routes/+layout.svelte):

```ts
import { afterNavigate } from '$app/navigation';
import { refreshHasUnread } from '$lib/stores/notifications.svelte';

afterNavigate(() => {
    if (data.user) refreshHasUnread();
});
```

`afterNavigate` runs **once when the layout first mounts (initial load)** and **after every
client-side navigation** — so a single handler covers "on mount + on navigation" with no separate
`onMount`. `refreshHasUnread()` calls `GET /api/notifications/unread-count` and writes
`notificationState.hasUnread`; failures are swallowed in the store's existing `catch` (dot keeps its
prior value). Gated on `data.user` because the endpoint is auth-guarded
([`api_route_guards.ts:46`](../../../src/lib/api_utils/api_route_guards.ts)) and the bell only renders
for signed-in users.

### 3. Refresh trigger: window focus (idle-tab gap-filler)

Pull-on-navigation's one weakness is a user who sits on a single page while a new notification is
created — the dot would stay stale until they navigate. A `visibilitychange`→visible listener in the
layout closes that gap at zero Ably cost and negligible request volume (fires only on real tab
switches, naturally user-throttled):

```ts
$effect(() => {
    if (!browser) return;
    const onVisible = () => { if (document.visibilityState === 'visible' && data.user) refreshHasUnread(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
});
```

No polling interval — a timer would burn requests for a low-urgency cue. Navigation + focus is the
right freshness envelope. *(This is the one genuine judgment call — see Open questions.)*

### 4. Visual: the dot

Unchanged from today's intent — a small solid dot, no count. App-bar bell keeps its existing markup
([`Header.svelte:47-52`](../../../src/lib/components/common/layout/Header.svelte)):

```
app-bar:   (🔔•)   ← absolute dot, top-1 right-1, #DD2200, w-2 h-2 rounded-full
drawer:    🔔  Notifications  •   ← same dot, trailing the label row
```

The drawer dot reuses the same colour/size for consistency. SSR renders the store's initial `false`,
so **no dot paints on the server**; the dot appears (if warranted) right after hydration's first
`afterNavigate` fetch resolves — no hydration mismatch, no SSR flash of a stale dot.

### 5. Delete the orphaned realtime path

Remove [`events/channels/notifications.ts`](../../../src/lib/events/channels/notifications.ts)
(`resolveNotificationState`) and the `NotificationEventState` interface from
[`events/types.ts:23-28`](../../../src/lib/events/types.ts). Grep confirms these symbols are
referenced **only by themselves** — no imports elsewhere in `src/`, no test references. This is safe
and is the point of Option A: stop carrying realtime code that the 200-connection free-tier ceiling
makes unaffordable for a low-urgency cue.

## Data / model impact

**No backend or schema change.** Everything reuses what exists:

| Concern | Reused as-is |
|---|---|
| Unread query | `hasUnreadForUser` → `count({ where: { read:false }, take:1 })` ([`notifications.ts:100`](../../../src/lib/notifications/notifications.ts)) |
| Endpoint | `GET /api/notifications/unread-count` → `{ hasUnread }` |
| Store + fetch | `notificationState`, `refreshHasUnread()` (existing, finally given callers) |
| Field | `Notification.read` (existing) |

Net code change is **subtractive** (two symbols deleted) plus small wiring edits in three Svelte
files. No new endpoint, query, or migration.

## Out of scope

- **Realtime push / Ably** — rejected on free-tier concurrency grounds ([02-ideas.md](./02-ideas.md)).
- **Unread count badge** — dot only; would require the endpoint to return a number.
- **SSR-seeding the dot** from a root `+layout.server.ts` query — considered, rejected to keep every
  layout load lean; the post-hydration fetch makes the dot correct within one round-trip and the
  pre-fetch state (no dot) is the safe default.
- **Auto-marking notifications read on page visit** — unchanged; clearing stays explicit
  (per-item click or "mark all read").
- **Polling interval** — rejected (wasteful for a low-urgency cue).
- Notification **creation**, email side-effects, the notifications **page** layout.

## Resolved decisions

1. **Window-focus refresh (§3): YES.** The `visibilitychange`→visible listener is included — it's
   the only thing that updates the dot for a user idling on one page, at near-zero cost. No polling
   interval.
2. **Drawer dot placement: trailing the label** — the dot sits at the end of the Notifications row,
   right-aligned after the text (not on the bell icon).

## Test lock-in (planned for Stage 4)

- **Header**: dot renders when `notificationState.hasUnread === true`; absent when `false`.
- **DrawerNav**: same assertion on the Notifications entry (extends existing `DrawerNav.test.ts`).
- **Store**: `refreshHasUnread()` sets `hasUnread` from a mocked `unread-count` response; a failed
  fetch leaves the prior value untouched.
- **Layout**: `afterNavigate` callback calls `refreshHasUnread` when `data.user` is set, and not when
  it is null (`afterNavigate` already mocked in [`tests/mocks/app_navigation.ts`](../../../src/tests/mocks/app_navigation.ts)).
- **Regression guard**: grep/CI check (or a comment) that `resolveNotificationState` /
  `NotificationEventState` are gone.
