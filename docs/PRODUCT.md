# Product

Puzzle League is a platform for organizing and participating in speed puzzling competitions. Participants register for competition categories, organizers manage events and entries, and judges record results during live categories.

## Users And Roles

- **Participants** are regular platform users. They can browse competitions, register for categories, track their registrations, view results, manage profile visibility, and receive notifications.
- **Organizers** can create competitions, manage their own or scoped competitions, configure categories and puzzles, manage registrations, assign judges, and run competition-day workflows.
- **Judges** are assigned to specific categories. They use the during-competition workflow to view entries and record results for assigned categories.
- **Admins** can review role requests and have broad management access.
- **External participants** represent people without platform accounts, such as minors or teammates registered by another user. They can later be claimed by a platform account.

## Participant Experience

Anonymous users land on a public home page and can explore competitions. Authenticated users get a dashboard with current registration statuses, live competitions, upcoming registered competitions, recent results, and other upcoming competitions they have not joined.

Participants can view competition details, categories, schedules, registration status, and results. Registration creates an `Entry` for each selected category. Depending on capacity and payment configuration, entries become confirmed, pending organizer confirmation, or waitlisted. Participants can unregister, and released reserved slots can promote the oldest waitlisted entry.

Profiles support name, location, phone, locale, email verification, password management for credential accounts, and public profile/results visibility. Onboarding prompts users for optional setup steps and can help claim matching external participations.

## Organizer Experience

Organizers can request permissions, create and edit competitions, add categories, attach puzzles, upload images, set location/date data, configure registration opening, set category prices, and show an off-platform payment warning. Puzzle management includes brand, piece count, barcode, serial number, and image data.

Registration management groups entries by pending, confirmed, and waitlisted status. Organizers can confirm entries, refuse entries, send payment reminders, publish table assignments, and toggle competition registration. Refusing or unregistering an entry may trigger waitlist promotion.

Competition-day management includes category start/stop/resume/restart/cancel/complete flows, table and entry views, finish-time recording, piece-count recording for unfinished entries, and realtime updates. Organizers can assign and remove judges per category, and can copy judge assignments between categories.

## Admin Experience

Users can submit role requests for elevated capabilities. Admins review pending requests, approve or reject them, and trigger role-request notifications.

## Results And Discovery

Results are category-based. Finished entries rank by finish time; unfinished partial entries rank by completed piece count; entries without a finish time or piece count rank last. Public result display respects user result-visibility settings.

Competition discovery includes explore, upcoming, past, calendar, month API, nearby/location-based queries, and the authenticated "other upcoming competitions" feed.

## Notifications, Email, And Localization

The product has an in-app notification center with unread tracking and links back to relevant competition, registration, role-request, table-assignment, and external-participant events. Some registration notifications also send email through Resend.

The UI supports English, Spanish, and Catalan translations. Users can store a locale preference; otherwise the app falls back from browser language to the configured default behavior.

## Current Boundaries

Payments are tracked off-platform: the app stores prices and payment warnings, and organizers manually confirm payment or acceptance. League and league-points models exist, but the current glossary marks league points calculation as undefined.
