---
applyTo: "**/*.ts,**/*.svelte"
---

# Notification System

This project has an in-app notification system. Whenever a user-facing action happens (e.g. inscription accepted/refused, competition started, role request resolved), **the code that performs the action must also create a notification** for the affected user(s).

## Architecture overview

| Layer | Location | Purpose |
|-------|----------|---------|
| Prisma model | `prisma/schema.prisma` → `Notification` | Stores notifications in the database |
| Helper service | `src/lib/notifications/notifications.ts` | Create, query, and mark-as-read helpers |
| API endpoints | `src/routes/(internal)/api/notifications/` | REST endpoints consumed by the front-end |
| Front-end page | `src/routes/(internal)/notifications/+page.svelte` | User-facing notifications list |
| Header badge | `src/lib/components/Header.svelte` | Bell icon with unread count |

## How to create a notification

Always use the helper functions in `src/lib/notifications/notifications.ts`. **Never** insert directly into `prisma.notification` from API routes or page actions.

### Single user

```ts
import { createNotification } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';

await createNotification({
    userId: targetUser.id,
    type: NotificationType.INSCRIPTION_ACCEPTED,
    title: 'Inscription accepted',
    message: `Your inscription for "${category.description}" has been accepted.`,
    link: `/competitions/competition_details/${competitionId}`,  // optional deep link
});
```

### Multiple users (e.g. all participants on a record)

```ts
import { createNotificationForUsers } from '$lib/notifications/notifications';
import { NotificationType } from '$lib/.prisma/generated/prisma/enums';

const userIds = record.users.map((u) => u.id);
await createNotificationForUsers(
    userIds,
    NotificationType.COMPETITION_STARTED,
    'Competition started',
    `The competition "${competition.name}" has started!`,
    `/competitions/competition_details/${competition.id}`,
);
```

## Notification types

The `NotificationType` enum lives in the Prisma schema. Current values:

| Value | When to use |
|-------|-------------|
| `INSCRIPTION_ACCEPTED` | Organizer accepts a participant's inscription |
| `INSCRIPTION_REFUSED` | Organizer refuses a participant's inscription |
| `INSCRIPTION_WAITLISTED` | Participant signs up for a full category (auto-waitlisted) |
| `COMPETITION_STARTED` | A competition transitions to STARTED |
| `COMPETITION_CANCELLED` | A competition is cancelled |
| `ROLE_REQUEST_APPROVED` | Admin approves a role request |
| `ROLE_REQUEST_REJECTED` | Admin rejects a role request |
| `GENERAL` | Catch-all for other notifications |

## Translatable data values (`@:` convention)

Some notification data values are themselves **translation keys** (e.g. category type names returned by `getCategoryTypeName()`). These values need to be translated into the user's locale before being interpolated into the notification template.

To mark a data value as translatable, prefix it with `@:`:

```ts
import { getCategoryTypeName } from '$lib/utils/category_utils';

const typeLabel = getCategoryTypeName(category.type); // returns e.g. 'category_names.individual'
const categoryName = category.subname
    ? `@:${typeLabel} - ${category.subname}`   // '@:category_names.individual - Elite Round'
    : `@:${typeLabel}`;                         // '@:category_names.individual'

await createNotification({
    // ...
    data: { categoryName, competitionName },
});
```

At render time, both the front-end (`resolveText()` in the notifications page) and the email resolver (`resolveEmailTranslation()`) detect `@:key.path` markers in data values and translate them inline before interpolation. The result above would produce `"Individual - Elite Round"` in English or `"Individual - Ronda Elit"` in Catalan.

**Rules:**
- Only use `@:` for values that come from utility functions returning translation keys (like `getCategoryTypeName()`).
- Plain text values (competition names, user names, etc.) must **not** use the `@:` prefix.
- The `@:` pattern matches dot-separated lowercase keys: `@:some_key.nested_key`.

When adding a **new notification type**:
1. Add the value to the `NotificationType` enum in `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name <descriptive_name>` and `npx prisma generate`.
3. Add the corresponding icon and color mappings in `src/routes/(internal)/notifications/+page.svelte` (`typeIcons` and `typeColors` objects).

## Where to place the notification call

Notifications must be created **in the API route or server action** that performs the triggering action, **after** the main operation succeeds. This ensures:
- No notification is sent if the action fails.
- The notification is always created on the server side.

Example pattern (from the inscription accept endpoint):

```ts
const result = await acceptInscription(recordId);
if (!result.success) {
    return json({ error: result.error }, { status: 400 });
}

// Only notify after success
await createNotificationForUsers(userIds, NotificationType.INSCRIPTION_ACCEPTED, ...);
```

## Mail notifications (future)

The helper service contains placeholder hooks for email delivery:
- `sendMailNotification()` — stub that will contain the actual mail transport.
- `shouldSendMail(type)` — returns `false` for all types; flip to `true` per type when enabling mail.

When implementing mail:
1. Add a mail provider (e.g. Resend, SendGrid) and configure it.
2. Implement the body of `sendMailNotification()` in `src/lib/notifications/notifications.ts`.
3. Update `shouldSendMail()` to return `true` for the desired notification types.

No other files need to change — the helper already calls these hooks automatically.

## API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/notifications` | Fetch all notifications for current user |
| `POST` | `/api/notifications` | Mark all notifications as read |
| `GET` | `/api/notifications/unread-count` | Get unread count (used by header badge) |

All endpoints require authentication via `requireAuth`.

## Front-end conventions

- The notifications page fetches data client-side via `fetch('/api/notifications')`.
- The header bell icon polls `/api/notifications/unread-count` every 30 seconds and shows a small red dot (no count) when there are unread notifications.
- Each notification type has an icon and color defined in the `typeIcons` / `typeColors` maps on the page. Keep these in sync when adding new types.
- The `Notification` type in `.svelte` files must be imported with `import type` from `$lib/.prisma/generated/prisma/browser` (never runtime imports from Prisma in client code).
