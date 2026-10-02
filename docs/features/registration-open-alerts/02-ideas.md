---
slug: registration-open-alerts
stage: ideas
feature: Notify participants when a closed category's registration opens
issue: null
status: approved
created: 2026-10-02
updated: 2026-10-02
related:
  - docs/features/registration-open-alerts/04-plan.md
  - docs/features/registration-open-alerts/01-problem.md
  - docs/features/registration-open-alerts/03-design.md
---

# Notify participants when a closed category's registration opens — Ideas

Problem: [01-problem.md](./01-problem.md) (approved, including the answers section).

## Fixed by the problem stage

These hold for every option below:

- **Per-Category follow** of a closed, `NOT_STARTED` Category by any logged-in user. Unlogged
  visitors see the control disabled, with a prompt to log in to be notified.
- **One-shot, fires on open only.** A follow is notified the first time the Category opens.
  Closes, reschedules and later reopenings don't notify. *(This narrows answer 2 of the problem doc,
  "any status change", to "opens", per the follow-up decision.)*
- **Follows are kept, never deleted on notify.** Each follow is marked as notified (a timestamp),
  so the history stays and organizers can see how many people were waiting and how many were
  notified.
- **Notification is a side effect, not part of the open operation.** Opening registration must
  stay fast. Notifying followers runs afterwards, outside the open request or webhook, and a failure
  there never affects the open.
- **Both opening paths trigger it:** the manual `toggleCategoryRegistration` (closed → open) and the
  scheduled QStash webhook (`registration-open-webhook.ts`).
- **Email is required, in-app too.** Both go through `dispatchNotifications`
  (`src/lib/notifications/dispatcher.ts`). Email needs the type in `EMAIL_ENABLED_TYPES` plus a
  `link`. `sendEmail` already takes a list of `userIds`, so one intent covers all followers.
- **Organizers see the follower count** per Category.
- **Placement:** a bell on each closed Category in `CategoriesOverview` / `CategoryCard` (competition
  details, reachable even when everything is closed) and next to the "closed" / "opens on" message
  on the registration page.

## Candidate directions

### Option A — `CategoryFollow` table with a notified marker, notified asynchronously (recommended)

**What:** a new join model
`CategoryFollow { userId, categoryId, createdAt, notifiedAt DateTime?, @@id([userId, categoryId]) }`
with cascade deletes on both sides. Follow/unfollow go through one endpoint
(`POST|DELETE /api/categories/[id]/follow`). Rows are never deleted when notified. A pending follow
is one with `notifiedAt = null`.

Opening a Category (the manual `toggleCategoryRegistration` closed → open, and the scheduled
webhook) does only its own write. After commit, it **triggers** follower notification without
waiting for it. A separate step, for example `notifyCategoryFollowers(categoryId)`, does the
notifying:
1. Loads the pending follows of a Category that is still open and `NOT_STARTED`.
2. Dispatches one intent with a new `NotificationType` (for example `CATEGORY_REGISTRATION_OPENED`).
   The type is email-enabled and links to the registration page.
3. Sets `notifiedAt = now()` on exactly those follows.

Because only pending rows are picked, the step is **idempotent**: a retry or duplicate trigger
can't email anyone twice once their row is marked.

**How the trigger runs:** this follows the existing QStash pattern. The open operation publishes
an immediate QStash message (`{ categoryId }`, no delay) to a new webhook, for example
`POST /api/webhooks/qstash/category-followers`, that runs the step above. Publishing is a single
quick HTTP call, QStash retries on failure, and the step is safe to retry. The open request never
waits for emails. **QStash stays optional** (decided 2026-10-02). When it isn't configured, the
open operation publishes nothing and no follower notifications are sent. There is no in-process
fallback, and follows stay pending (`notifiedAt = null`).
**Data/powered by:** new `CategoryFollow` relation on `User` and `Category` (with `notifiedAt`), a
new `NotificationType` value, one QStash publisher and webhook modelled on
`registration-open-scheduler.ts` / `registration-open-webhook.ts`, and the existing dispatcher and
email templates.
**Effort:** Medium. One migration, a follow endpoint, a trigger in two call sites, a publisher and
webhook, a bell component in two places, an email template variant, and i18n.
**Trade-off:** adds a table and a second webhook, but both are conventional here. You get
uniqueness, cascade on user or category deletion, cheap counts (waiting vs notified), a kept
history, a fast open operation, and retries. The cost is another QStash path to test, which
locally needs ngrok, the same as auto-stop and scheduled opening.

### Option B — Same table, in-process background work only (no QStash)

**What:** like A, but the open operation always starts the notify step in-process without
awaiting it. On Vercel that would need `waitUntil` from `@vercel/functions`, which is a new
dependency the repo doesn't use today.
**Effort:** Medium-Low.
**Trade-off:** simpler, with no new webhook, and it works without QStash. But nothing retries it:
a crash or timeout after the response leaves follows pending until something else triggers the
step. It also ties the behavior to the hosting platform. Rejected: without QStash, follower
notifications are skipped instead of sent in-process.

### Option C — Follower ids stored on the Category (`followerIds String[]`)

**What:** no new table. Push or pull user ids in an array column on `Category`, then read and clear
it when the category opens.
**Data/powered by:** one `String[]` column.
**Effort:** Quick.
**Trade-off:** no referential integrity (deleted users linger). Concurrent follows race on
read-modify-write unless you use raw `array_append`. And "which categories do I follow?" (to show
the bell's state for the current user) needs an array-contains query. Cheaper today, but brittle
and against the repo's Prisma relation conventions.

### Option D — Generic subscription model (`Subscription { userId, targetType, targetId, event }`)

**What:** a polymorphic "watch anything" table, so later features (follow a competition, results
published, …) reuse it.
**Effort:** High.
**Trade-off:** no foreign keys on `targetId`, a more complex query surface, and no second use case
exists yet. YAGNI.

## Recommendation

**Option A** (chosen). It matches the repo's existing Prisma join-model style and keeps opening
registration fast, with notification as a separate side effect. The `notifiedAt` marker keeps the
data and makes delivery safe to retry. Using QStash reuses infrastructure and patterns the repo
already has for auto-stop and scheduled opening. QStash stays optional, as it is for those
features: without it, follower notifications are skipped.

**Out of scope:** following a whole Competition, notifying on close or reschedule, push
notifications, follower names for organizers (count only), and any digest grouping.

## Open questions for design

1. **Bell states and copy:** what do the following, not following and unlogged (disabled + login
   prompt) states look like on `CategoryCard` and on the registration page? Should the bell also
   show for a Category that is already open but full (waitlist), or only when it's closed?
   *(Recommendation: closed only.)*
2. **Multiple Categories opening at once** (for example "schedule all" firing): a user following
   several Categories of the same Competition gets one email per Category. Accept that, or group
   them? *(Recommendation: accept; each webhook fires separately anyway.)*
3. **Auto-unfollow on registration:** if a follower registers some other way before the opening
   (for example added by an organizer), should their follow be dropped? *(Recommendation: yes,
   skip users who already hold an entry in that Category at notify time.)*
4. **Email content and link:** subject and body variants in `en`/`es`/`ca`, linking to the
   registration page. Should the email mention capacity ("limited spots")?
5. **Organizer count placement:** next to the category status badge on manage-registrations, and
   on the organizer's view of the details page? Show "waiting" (pending) only, or also "notified"?
6. **After notification** — *resolved:* following again clears the notified mark (`notifiedAt` is
   reset to `null`), so a user can follow again if the Category closes and reopens. Design still
   has to define what the bell shows for a notified follow while the Category is open.
7. **Without QStash** — *decided:* QStash stays optional, and when it isn't configured, follower
   notifications are not sent (no fallback). The bell is **hidden** whenever it isn't actionable,
   including when QStash isn't configured (gated by a check such as
   `isRegistrationScheduleAvailable()`), so users are never offered a follow that can't notify.
