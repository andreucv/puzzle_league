---
slug: registration-open-alerts
stage: plan
feature: Notify participants when a closed category's registration opens
issue: null
status: approved
created: 2026-10-02
updated: 2026-10-02
related:
  - docs/features/registration-open-alerts/01-problem.md
  - docs/features/registration-open-alerts/02-ideas.md
  - docs/features/registration-open-alerts/03-design.md
---

# Implementation Plan: Notify participants when a closed category's registration opens

A logged-in user can follow a closed, not-started Category with a bell. When the Category opens,
by hand or on schedule, every pending follower gets one email plus an in-app notification. The
follow is then marked notified and kept. Notifying is an asynchronous side effect sent through
QStash, so opening stays fast. Without QStash the bell is hidden and nothing is sent. Organizers
see a "N waiting" count.

Design: [03-design.md](./03-design.md) (approved). No GitHub issue yet.
Depends on the uncommitted per-category registration work (#90): `Category.registrationOpen`,
`toggleCategoryRegistration`, `registration-open-scheduler.ts` and `registration-open-webhook.ts`.
Refs: [registration-workflow.md](../../workflows/registration-workflow.md) (scheduled opening),
[ARCHITECTURE.md](../../ARCHITECTURE.md) (notifications, QStash),
[CONTRIBUTING.md](../../CONTRIBUTING.md) (testing).

## Architecture and design

**Data (additive migration):** a new `CategoryFollow { userId, categoryId, createdAt, notifiedAt? }`
with PK `(userId, categoryId)`, index `(categoryId, notifiedAt)`, cascade deletes, back-relations
`User.categoryFollows` / `Category.follows`, and the enum value
`NotificationType.CATEGORY_REGISTRATION_OPENED`.

**New files** (each modelled on an existing sibling):

| File | Modelled on | Role |
|---|---|---|
| `src/lib/services/category-follows.ts` | `registration-workflow.ts` seam style | `followCategory`, `unfollowCategory`, `isCategoryFollowable` (the "actionable" rules, shared by the API and the UI flag) |
| `src/lib/services/category-followers-notifier.ts` | `registration-open-scheduler.ts` | `CategoryFollowersNotifier.publish(categoryId)` (immediate QStash message) + `getCategoryFollowersNotifier()` → `null` without QStash |
| `src/lib/services/category-followers-webhook.ts` | `registration-open-webhook.ts` | `handleCategoryFollowersWebhook({ signature, body, receiver, db, dispatchNotifications })` with injected deps for tests |
| `src/routes/(internal)/api/webhooks/qstash/category-followers/+server.ts` | `…/qstash/registration-open/+server.ts` | thin route |
| `src/routes/(internal)/api/categories/[id]/follow/+server.ts` | `…/categories/[id]/toggle_registration/+server.ts` | `POST` follow / `DELETE` unfollow |
| `src/lib/components/registration/CategoryFollowButton.svelte` | — | bell control: logged-out / not-following / following |

**Availability flag:** reuse `isRegistrationScheduleAvailable()` (QStash token + public URL), so
there is one "QStash configured" check. Loaders expose it as `followAvailable`.

**Trigger points** (await the publish and catch any error; it never fails the open):
- `api/categories/[id]/toggle_registration/+server.ts`: after the seam returns
  `registrationOpen: true`.
- `registration-open-webhook.ts`: after the conditional open (`count > 0`). Inject the notifier
  as an optional dependency, so the existing tests keep passing and gain a case.

**Webhook algorithm (at-least-once):**
1. Verify the signature.
2. Load the Category. Return a no-op if it isn't `NOT_STARTED` + open.
3. Read the pending follows, then drop the users holding an Entry in the Category (reuse the
   `entry.users` relation).
4. Dispatch one intent.
5. `updateMany` set `notifiedAt` for the user ids read in step 3, `notifiedAt: null`.

`categoryName` uses the existing `@:<typeLabel> - subname` pattern
(`registration_notifications.ts:48-51`). The link is
`/competitions/competition_details/{id}/registration`.

**Email:** add `CATEGORY_REGISTRATION_OPENED` to `EMAIL_ENABLED_TYPES` (`dispatcher.ts`) and to
`NOTIFICATION_TYPE_KEY` (`email_translations.ts`) as `category_registration_opened`. The email
resolves `notifications.titles.*` / `notifications.messages.*`, so the same keys serve in-app and
email.

**Route guards** (`api_route_guards.ts`): `/api/categories/[^/]+/follow` → `authenticated`.
Webhooks are already `public` (signature-verified).

**Loaders:**
- Competition details `+page.server.ts`: add a streamed `follows` promise (the viewer's follows
  for the Competition, or `[]` when logged out) and `followAvailable`.
- Registration `+page.server.ts`: add `follows` and `followAvailable` the same way.
- `getRegistrationsForCompetition` (`db_entry.ts`): add
  `_count: { select: { follows: { where: { notifiedAt: null } } } }`.

**UI:**
- `CategoryCard` footer, for `NOT_STARTED` categories: render `CategoryFollowButton` when it's
  actionable. The props come through `CategoriesOverview`: `follows`, `followAvailable`,
  `loggedIn`, `canManage`, `loginHref`.
- Registration page: render the same component under `category-closed-message`.
- Manage page: a "🔔 N waiting" chip next to the category status badge when N > 0.
- A small pure helper `canFollowCategory({ category, followAvailable, canManage, hasEntry })` in
  `registration_utils.ts` decides visibility on both pages and is unit-tested.

**i18n** (`en`/`es`/`ca` `common.json`):
- `category_follow.notify_me`, `.following`, `.stop`, `.login_to_notify`, `.follow_error`
- `manage_registrations.followers_waiting` (+ tooltip `followers_waiting_hint`)
- `notifications.titles.category_registration_opened`
- `notifications.messages.category_registration_opened`

**Telemetry (PostHog):** `category_followed`, `category_unfollowed`,
`category_followers_notified { category_id, notified_count }`.

## Tasks

- [x] **Schema.** Added `CategoryFollow` and `NotificationType.CATEGORY_REGISTRATION_OPENED` to
  `prisma/schema.prisma`; Prisma client regenerated.
- [x] **Migration.** Generated and applied with `pnpm prisma migrate dev --name category_follow`
  (`20261002164014_category_follow`).
- [x] **Visibility helper.** Add `canFollowCategory` to `src/lib/utils/registration_utils.ts`, with
  unit tests for every hidden case (QStash off, started, open, already entered, organizer).
- [x] **Follow seam.** `src/lib/services/category-follows.ts`:
  - `followCategory({ categoryId, userId })` upserts and sets `notifiedAt = null`. It validates
    `NOT_STARTED` + closed and no Entry (`INVALID_STATUS` → 400); the endpoint checks QStash
    availability (503).
  - `unfollowCategory` deletes the row and is idempotent.
  - Also `userIdsWithEntryInCategory` (shared with the webhook) and `getPendingFollowedCategoryIds`.

  Unit tests in `category-follows.test.ts`.
- [x] **Follow endpoint.** `POST|DELETE /api/categories/[id]/follow` with PostHog events, plus the
  `authenticated` route guard entry.
- [x] **Notifier (publisher).** `category-followers-notifier.ts`: an immediate `publishJSON` to
  `${QSTASH_PUBLIC_APP_URL}/api/webhooks/qstash/category-followers` with the same
  `ngrok-skip-browser-warning` header. The getter returns `null` without QStash.
- [x] **Webhook.** `category-followers-webhook.ts` + route. Unit tests modelled on
  `registration-open-webhook.test.ts`:
  - bad signature → 401
  - category closed or started → no-op, follows stay pending
  - happy path: dispatch to pending followers only, then mark notified
  - users with an Entry are skipped but marked
  - follows re-armed after the read stay pending
  - no pending follows → no dispatch
- [x] **Notification wiring.** Add `CATEGORY_REGISTRATION_OPENED` to `EMAIL_ENABLED_TYPES` and
  `NOTIFICATION_TYPE_KEY`. Add the `notifications.titles/messages.category_registration_opened`
  keys in `en`/`es`/`ca`.
- [x] **Trigger on manual open.** Publish from `toggle_registration/+server.ts` when it returns
  `registrationOpen: true`. Catch and log errors.
- [x] **Trigger on scheduled open.** Inject an optional `followersNotifier` into
  `handleRegistrationOpenWebhook`, publish after a successful open, and pass it from the route.
  Extend `registration-open-webhook.test.ts`: it publishes on open, does not publish on
  stale/no-op, and a publish failure still returns 200 "Registration opened".
- [x] **Loaders.**
  - Details page: `followedCategoryIds` (streamed) + `followAvailable`.
  - Registration page: `followedCategoryIds` + `followAvailable`.
  - `getRegistrationsForCompetition`: pending-follow `_count`.
- [x] **`CategoryFollowButton.svelte`.** Logged-out (disabled + login link), not-following and
  following states, plus `data-testid`s (`follow-category-{id}`, `data-following`). On click it
  calls the API and updates its own state optimistically (no page reload), rolling back with an
  error toast on failure.
- [x] **Details page.** Pass the props through `CategoriesOverview` → `CategoryCard` and render
  the button in the footer for actionable categories.
- [x] **Registration page.** Render the button under the closed / "opens on" message.
- [x] **Manage page.** Add the "🔔 N waiting" chip next to the category status badge.
- [x] **i18n.** Add the `category_follow.*` and `manage_registrations.followers_waiting*` keys in
  `en`/`es`/`ca`.
- [x] **E2E.**
  `GivenClosedCategory_WhenParticipantFollowsIt_ThenOrganizerSeesOneWaiting` in
  `e2e/registration/organizer.test.ts` covers the following:
  - a logged-out visitor sees the disabled bell with a login link;
  - an organizer sees no bell;
  - a participant follows, and the state persists on the registration page;
  - the organizer sees "1 waiting";
  - the participant unfollows, and the waiting count disappears.

  The test skips itself when QStash isn't configured.
- [x] **Checks.** `pnpm check` (0 errors), `pnpm vitest run` (381 passing) and the registration
  e2e suite (15 passing).
- [ ] **Manual QStash check** via ngrok (memory `local-qstash-cron-testing`):
  1. Follow as a participant.
  2. Open the category as the organizer, and confirm the open is instant.
  3. Confirm the participant gets an in-app notification and an email, and the waiting count
     drops to 0.
  4. Repeat the check with a scheduled opening.
- [x] **Docs.**
  - `docs/workflows/registration-workflow.md`: a "Category follows" subsection and the new
    notification in the notifications table.
  - `docs/PRODUCT.md`: the participant follow and the organizer count.
  - `docs/ARCHITECTURE.md`: the QStash bullet now covers follower notifications.
- [x] **`graphify update .`**
- [ ] **Close-out:** after merge, run **`/feature-doc` (Stage 5)** to write `05-workflow.md`.

## Open questions

None. Resolved 2026-10-02: the work ships on the same branch as #90
(`feat/per-category-registration-90`), and the e2e test runs against the real QStash env.
