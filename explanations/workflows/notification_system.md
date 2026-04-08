# Notifications system

## Notification strings
Notification strings must be defined in translations files under `src/lib/translations/` with the `notifications.` prefix.
Requisites:
1. They must be defined for all supported languages (currently 'en', 'es', 'ca').
2. They must include any necessary interpolation variables (e.g., `{{competitionName}}`, `{{categoryName}}`) that are passed when creating the notification.
3. They should be descriptive and user-friendly, as they will be displayed directly to users in the UI.

## Notification creation
Notifications are created by calling the `createNotification` function from `src/lib/notifications/notifications.ts`.
Mandatory parameters for createNotification function are:
	userId: string; (the recipient of the notification)
	type: NotificationType; (the enum from schema.prisma for notification types)
	title: string; (this is the translation key for the notification title, e.g., 'notifications.titles.inscription_confirmed')
	message: string; (this is the translation key for the notification message, e.g., 'notifications.messages.inscription_confirmed')
	link?: string; (optional URL that the notification can link to, e.g., `/competitions/competition_details/${competitionId}`)
	data?: Record<string, unknown>; (interpolation variables for the translation keys, e.g., `{ categoryName, competitionName }`)

### Example
```ts
await createNotification({
    userId: targetUser.id,
    type: NotificationType.INSCRIPTION_CONFIRMED,
    title: 'notifications.titles.inscription_confirmed',
    message: 'notifications.messages.inscription_confirmed',
    link: `/competitions/competition_details/${competitionId}`,
    data: { categoryName: 'Individual', competitionName: 'Puzzle Cup' },
});
```

## Notification display
Notifications are displayed in the UI via the notifications page (`/notifications`) and the notification badge in the navigation bar.
- The notifications page fetches the user's notifications from the database and displays them in a list, showing the title, message, and time of each notification. It also handles marking notifications as read when the user clicks on them.
- The notifications use the translation keys passed during creation to display the appropriate text in the user's language, with `$t(key, data)` interpolation.
- **Backward compatibility**: notifications with plain-text title/message (created before the i18n migration) are displayed as-is. Only strings starting with `notifications.` are resolved as translation keys.

## Testing notifications
To test the notifications system, you can write unit tests for the `createNotification` function to ensure that it correctly creates notifications in the database with the expected parameters, including the `data` JSON field for interpolation variables.
