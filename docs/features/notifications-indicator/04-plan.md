---
slug: notifications-indicator
stage: plan
feature: Notifications unread indicator (nav red dot)
issue: null
status: draft
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/notifications-indicator/01-problem.md
  - docs/features/notifications-indicator/assessment-roast.md
  - docs/features/notifications-indicator/02-ideas.md
  - docs/features/notifications-indicator/03-design.md
---

# Implementation Plan: Notifications unread indicator (nav red dot)

Make the app-bar bell (and drawer entry) show a red dot when the user has unread notifications, by
wiring the nav to the existing shared store and refreshing it via a client pull. No backend or
schema change; the net code delta is subtractive (two orphaned realtime symbols deleted).

Design: [03-design.md](./03-design.md) (status: approved) · Problem: [01-problem.md](./01-problem.md)
· Ideas + Ably cost analysis: [02-ideas.md](./02-ideas.md). Issue: none.
Docs: ARCHITECTURE.md (realtime events, notifications).

## Architecture and design

**Approach:** single source of truth = the module-level Svelte 5 `$state` store
[`notificationState`](../../../src/lib/stores/notifications.svelte.ts). Both nav components *read*
it; the root layout *refreshes* it via the existing `refreshHasUnread()` →
`GET /api/notifications/unread-count`. The orphaned Ably resolver is deleted.

**Files changed (4 edits, 1 deletion) + 3 test files:**

| File | Change | Reuses |
|---|---|---|
| [`Header.svelte`](../../../src/lib/components/common/layout/Header.svelte) | Drop `let hasUnread = $state(false)` + TODO; import store; gate dot on `notificationState.hasUnread`; add `data-testid` to dot | existing bell markup (L47-52) |
| [`DrawerNav.svelte`](../../../src/lib/components/common/layout/DrawerNav.svelte) | Import store; add trailing dot to the `nav-drawer-notifications` row | existing nav-item row |
| [`+layout.svelte`](../../../src/routes/+layout.svelte) | `afterNavigate(() => data.user && refreshHasUnread())` + `visibilitychange`→visible `$effect`, both gated on `data.user` | `data.user` already in scope; `afterNavigate` already used in repo |
| [`events/types.ts`](../../../src/lib/events/types.ts) | Delete `NotificationEventState` interface (L23-28) | — |
| [`events/channels/notifications.ts`](../../../src/lib/events/channels/notifications.ts) | **Delete file** (`resolveNotificationState`) | — |

**Reuse, not new:** `notificationState`, `refreshHasUnread()`, the `unread-count` endpoint,
`hasUnreadForUser`, and `Notification.read` all exist and are unchanged.

**Backend impact:** none. **Schema/migration:** none. **i18n (`en`/`es`/`ca`):** none — the dot has
no text; the bell's `aria-label="Notifications"` and the drawer's `$t('notifications.title')` already
exist.

**Dead-code boundary:** grep confirms `resolveNotificationState` / `NotificationEventState` are
referenced only by their own two files — no other imports, no test references. Safe to delete.

**SSR safety:** store initial value is `false`, so the server renders no dot; the dot appears only
after the post-hydration `afterNavigate` fetch resolves — no hydration mismatch.

## Tasks

- [x] **Header:** remove `hasUnread` local + TODO comment; `import { notificationState } from '$lib/stores/notifications.svelte'`; change `{#if hasUnread}` to `{#if notificationState.hasUnread}`; add `data-testid="notifications-unread-dot"` to the dot `<span>`.
- [x] **DrawerNav:** `import { notificationState }`; in the `nav-drawer-notifications` `<a>`, add a trailing right-aligned dot (`ml-auto`, `#DD2200`, `w-2 h-2 rounded-full`) shown when `notificationState.hasUnread`, with `data-testid="nav-drawer-notifications-dot"`.
- [x] **Layout refresh wiring:** in [`+layout.svelte`](../../../src/routes/+layout.svelte) import `afterNavigate` from `$app/navigation` and `refreshHasUnread` from the store; add `afterNavigate(() => { if (data.user) refreshHasUnread(); })` (covers initial mount + every navigation) and a `$effect` registering a `visibilitychange` listener that calls `refreshHasUnread()` when `document.visibilityState === 'visible' && data.user`, cleaned up on teardown and guarded by `browser`.
- [x] **Delete orphaned realtime code:** remove [`events/channels/notifications.ts`](../../../src/lib/events/channels/notifications.ts) and the `NotificationEventState` interface from [`events/types.ts`](../../../src/lib/events/types.ts).
- [x] **Test — store:** new `src/lib/stores/notifications.svelte.test.ts`: `refreshHasUnread()` sets `hasUnread` from a mocked `unread-count` response (`{ hasUnread: true }`); a rejected/failed fetch leaves the prior value unchanged.
- [x] **Test — Header:** new `src/lib/components/common/layout/Header.test.ts`: dot present when `notificationState.hasUnread = true`, absent when `false` (set the imported store value before render; mock translations/app state as siblings do).
- [x] **Test — DrawerNav:** extend [`DrawerNav.test.ts`](../../../src/lib/components/common/layout/DrawerNav.test.ts): `nav-drawer-notifications-dot` present when store `hasUnread` true (participant user), absent when false.
- [x] **Run unit tests** (`pnpm test` / vitest) — all green, including the new specs (23 pass; `pnpm check` 0 errors). Pre-existing failures in `CategoryCapacityRow`/`send_password_reset_email`/`login` are unrelated (confirmed against baseline).
- [ ] **Manual verification** via `/run` or `/verify`: seed an unread notification → dot shows on bell + drawer; open `/notifications` and "mark all read" → dot clears in nav without reload; navigate away and back → dot reflects current state; switch tabs and back → dot refreshes. Confirm signed-out users hit no `unread-count` request.
- [ ] **`graphify update .`** to refresh the knowledge graph after code changes.
- [ ] **Close-out:** once merged, run **`/feature-doc`** (Stage 5) to write `05-workflow.md`.

## Open questions

1. **Manual-verification seam:** is there an easy way to create an unread notification locally (a dev
   seed/route), or should verification register for a competition to trigger `createNotification`?
2. **Header test scaffolding:** `Header.svelte` reads `page.data` via `$app/state` (not the
   `$app/stores` mock `DrawerNav.test.ts` uses) — confirm the existing `app_state`/`app_stores` test
   mocks cover `$app/state`, or the Header test may need a small mock addition.
