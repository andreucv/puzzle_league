---
slug: registration-open-alerts
stage: design
feature: Notify participants when a closed category's registration opens
issue: null
status: approved
created: 2026-10-02
updated: 2026-10-02
related:
  - docs/features/registration-open-alerts/04-plan.md
  - docs/features/registration-open-alerts/01-problem.md
  - docs/features/registration-open-alerts/02-ideas.md
---

# Design: Notify participants when a closed category's registration opens

Scope:
- `CategoryCard` (`src/lib/components/competition/CategoryCard.svelte`, used by
  `CategoriesOverview` on the competition details page).
- The registration page (`src/routes/(internal)/competitions/competition_details/[id=integer]/registration/+page.svelte`,
  closed-category message at `:1044-1049`).
- The manage-registrations category header
  (`src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte`).
- The two opening paths: `toggleCategoryRegistration` in `src/lib/services/registration-workflow.ts`
  and `src/lib/services/registration-open-webhook.ts`.

Refs: [registration-workflow.md](../../workflows/registration-workflow.md) (`registrationOpen`,
scheduled opening), [ARCHITECTURE.md](../../ARCHITECTURE.md) (QStash, notifications).
Problem: [01-problem.md](./01-problem.md). Ideas: [02-ideas.md](./02-ideas.md) (Option A).

## Problem

Participants who find a Category closed have no way to be told when it opens, so they poll and can
lose limited spots. **Guiding principle:** a logged-in user can *follow* a closed Category with one
click and receives one email plus an in-app notification the first time it opens. Opening stays
fast because notifying is a separate, asynchronous side effect. The bell only appears when following
can actually lead to a notification.

## Design

### 1. When the bell is shown ("actionable")

The bell appears on a Category only when **all** of these hold:

- Follower notification is available: QStash is configured, using the same check as scheduled
  opening (`isRegistrationScheduleAvailable()` in `registration-open-scheduler.ts`).
- `category.status === 'NOT_STARTED'` and `category.registrationOpen === false`. This covers both
  plain closed and scheduled ("opens on …") Categories.
- The viewer is not already in an Entry of that Category (as creator or party member). Such users
  can't register again, so a notification would be noise.
- The viewer can't manage the Competition (`access.canManageCompetition` is false). Organizers
  bypass the closed flag and see follower counts instead (section 6).

Otherwise the bell is hidden. That includes an open Category: a follow already notified for it has
nothing more to do.

### 2. Bell states

```
CategoryCard footer (details page), closed Category the viewer has no entry in.
The whole footer is swapped: no "N spots left" / "Open" row.
┌──────────────────────────────────────────────┐
│                     [🔒 Registration closed]  │   ← or [🕒 Opens 12 Oct, 18:00] when scheduled
│ [🔔 Notify me when it opens               ]  │   ← not following (outlined); only when actionable
└──────────────────────────────────────────────┘
  following:     [🔔✓ You'll be notified  ·  Stop]   (tonal success; click = unfollow)
  logged out:    [🔔 Log in to be notified]  disabled, with a "Log in" link next to it
```

| Viewer | Follow row | Bell |
|---|---|---|
| Logged out (details page only; the registration page requires login) | n/a | Disabled bell + "Log in to be notified" linking to `/login?redirect=<details page>` |
| Logged in, no follow, or a follow with `notifiedAt` set | none / notified | "Notify me when it opens" → follow |
| Logged in, pending follow (`notifiedAt = null`) | pending | "You'll be notified" → unfollow |

- A follow whose `notifiedAt` is set behaves as **not following**. Following again resets
  `notifiedAt` to `null` (decided in Stage 2). This only matters if the Category closed again
  after opening.
- On the **registration page**, the same bell control appears inline under the
  `category-closed-message` paragraph ("Registration closed" / "Registration opens on …").
- Clicks are optimistic, with a toast on error and a rollback. The bell keeps its following state
  locally, so neither page reloads its data.

### 3. Follow / unfollow API

- `POST /api/categories/[id]/follow` creates or re-arms the follow: an upsert on
  `(userId, categoryId)` that sets `notifiedAt = null`.
- `DELETE /api/categories/[id]/follow` deletes the row. Unfollowing is the only time a follow row is
  deleted.
- Route guard: `authenticated`. The service seam (new `src/lib/services/category-follows.ts`)
  enforces the actionable rules from section 1: QStash is available (otherwise 503), the Category is
  `NOT_STARTED` and closed (otherwise `INVALID_STATUS` → 400, through the existing
  `registrationWorkflowHttpStatus` mapping), and the user has no Entry in it.
  `DELETE` is always allowed and deletes the row (decided).
- PostHog: `category_followed`, `category_unfollowed`.

### 4. Triggering on open (asynchronous side effect)

Both opening paths do their own write first, then **publish** an immediate QStash message
`{ categoryId }` (no delay) to `POST /api/webhooks/qstash/category-followers`:

- **Manual:** the `toggle_registration` endpoint, after `toggleCategoryRegistration` returns
  `registrationOpen: true`.
- **Scheduled:** `handleRegistrationOpenWebhook`, after its conditional open succeeds (`count > 0`).

Publishing is one short HTTP call. It is **awaited but never fails the open**: errors are logged,
and the follows stay pending. If QStash isn't configured, nothing is published, and the bell was
never shown anyway. No email is sent during the open request. The publisher is a small
`category-followers-notifier.ts`, modelled on `registration-open-scheduler.ts` with an injectable
interface for tests.

### 5. The notify webhook

`POST /api/webhooks/qstash/category-followers` verifies the QStash signature and answers 2xx for
everything except a bad signature, so QStash doesn't retry no-ops:

1. Load the Category. If it is gone, no longer `NOT_STARTED`, or closed again, return a no-op and
   leave the follows pending.
2. **Read** the pending follows (`notifiedAt = null`) of the Category.
3. Split out the users who now hold an Entry in the Category. They aren't notified, but they are
   marked in step 5.
4. Dispatch **one** `NotificationIntent` to the remaining users through `dispatchNotifications`:
   type `CATEGORY_REGISTRATION_OPENED` (new), `title`/`message` translation keys, `link` to the
   registration page, and `data: { competitionName, categoryName }`.
5. **Then mark** exactly the follows read in step 2:
   `updateMany({ where: { categoryId, userId: { in: readIds }, notifiedAt: null }, data: { notifiedAt: now } })`.
   A follow created or re-armed after step 2 stays pending.
6. PostHog: `category_followers_notified` with `{ category_id, notified_count }`.

**Delivery is at-least-once** (decided). If the process dies or times out after sending but before
marking, QStash retries and those users can get a second email. Nobody is lost. Two near-simultaneous
triggers can also overlap, with the same duplicate-only effect. In practice, retries come only from
crashes and timeouts: `dispatchNotifications` / `sendEmail` swallow per-recipient email failures
and never throw, so a failed email is not retried. That matches every other notification today.

### 6. Organizer view

Manage-registrations category header: next to the open/closed/scheduled badge, a small
`🔔 N waiting` chip shows the count of **pending** follows when it is above 0, with a tooltip
"N people will be notified when registration opens". After opening, the count drops to 0 once the
follows are marked notified. Organizers don't see follower names.

### 7. Notification and email content

- New `NotificationType.CATEGORY_REGISTRATION_OPENED`, added to `EMAIL_ENABLED_TYPES`
  (`dispatcher.ts`) and to `NOTIFICATION_TYPE_KEY` (`email_translations.ts`) as
  `category_registration_opened`.
- en: title "Registration is open: {{categoryName}}". Message "Registration for {{categoryName}} in
  {{competitionName}} is now open. Spots may be limited — register now." Button: the registration
  page. Same keys in `es` / `ca`.
- In-app uses the same title and message keys (`notifications.titles.*` /
  `notifications.messages.*`).

## Data / model impact

- **New model** (additive migration):

  ```prisma
  model CategoryFollow {
    userId     String
    categoryId Int
    createdAt  DateTime  @default(now())
    notifiedAt DateTime?
    user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    category   Category  @relation(fields: [categoryId], references: [id], onDelete: Cascade)
    @@id([userId, categoryId])
    @@index([categoryId, notifiedAt])
    @@map("category_follow")
  }
  ```

  It adds back-relations `User.categoryFollows` and `Category.follows`.
- **New enum value** `NotificationType.CATEGORY_REGISTRATION_OPENED`.
- **Loaders:**
  - The details page (when logged in) and the registration loader get the viewer's follows for
    the Competition (`categoryFollow.findMany({ where: { userId, category: { competitionId } } })`)
    plus a `followAvailable` flag.
  - `getRegistrationsForCompetition` (manage page) gets a pending-follow count per Category
    (`_count: { follows: { where: { notifiedAt: null } } }`).
- **Reused as they are:** `dispatchNotifications`, `sendEmail` (multi-recipient), the QStash
  `Client`/`Receiver`, the `/api/webhooks/` public guard, and `ensureCanManageCompetition` (not
  needed for follow).

## Out of scope

- Following a whole Competition.
- Notifying on close, reschedule or schedule creation.
- Push notifications or digests.
- Follower names for organizers.
- A "my follows" page.
- Notifying when a waitlist spot frees up.
- Any behavior when QStash isn't configured (the bell is hidden and nothing is sent).

## Resolved decisions

1. **Unfollow deletes the row.** "Never delete" applies to notified follows only.
2. **At-least-once delivery**: send, then mark notified (section 5).
3. **Organizer count:** pending ("waiting") only, hidden at 0.
4. **Details-page placement:** full-width button in the `CategoryCard` footer.
5. **Organizers don't follow:** the bell is hidden for anyone who can manage the Competition.

## Open questions

None.
