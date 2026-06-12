# Architecture

Puzzle League is a SvelteKit application for speed puzzling competitions. It runs on Vercel with the Node 20 runtime, uses PostgreSQL through Prisma, and keeps most domain rules in server-side services rather than in page components.

## Runtime And Stack

- **Frontend and routing:** SvelteKit 2, Svelte 5, TypeScript, Tailwind CSS 4, Skeleton UI, Bits UI, and Iconify.
- **Backend:** SvelteKit `+page.server.ts`, form actions, and `+server.ts` API routes.
- **Database:** PostgreSQL with Prisma. The Prisma client and Zod types are generated into `src/lib/.prisma/generated`.
- **Auth:** Better Auth with email/password, Google OAuth, session storage in Prisma, email verification, password reset, and JWT support.
- **Deployment:** Vercel adapter for Node 20. `vercel.json` schedules the daily `/api/cron/auto-cancel` job.
- **External services:** Cloudinary for competition/puzzle images, Ably for realtime competition events, Resend for emails, PostHog and Vercel Analytics/Speed Insights for telemetry, and optional Upstash QStash for category auto-stop webhooks.

## Code Layout

- `src/routes/` contains SvelteKit pages, layouts, form actions, and API endpoints. Route groups separate public/internal, authenticated, organizer, and admin areas.
- `src/lib/database/` contains Prisma query helpers.
- `src/lib/services/` contains domain workflows such as registration, competition access, category lifecycle, auto-cancel, and auto-stop.
- `src/lib/api_utils/` contains API auth, CSRF, rate limiting, route guard, and whitelist logic.
- `src/lib/events/` contains Ably server publishing, JWT token creation, client subscriptions, and competition event state reducers.
- `src/lib/notifications/` and `src/lib/emails/` handle in-app notifications and selected email side effects.
- `src/lib/components/`, `src/lib/stores/`, `src/lib/utils/`, and `src/lib/translations/` hold shared UI, client state, validation/date/contact helpers, and `en`/`es`/`ca` translations.
- `prisma/` holds the data model and migrations.
- `e2e/` and `src/**/*.test.ts` hold Playwright and Vitest coverage.

## Request Flow

`hooks.server.ts` is the main request boundary. It loads the Better Auth session into `event.locals`, redirects authenticated page traffic to onboarding when needed, proxies PostHog ingest traffic, and applies the API security pipeline to non-public `/api/*` routes:

1. reject cross-origin mutating requests with CSRF origin validation;
2. require an authenticated session unless the API route is whitelisted;
3. apply rate limiting (Upstash Redis-backed when `UPSTASH_REDIS_REST_*` or `KV_REST_API_*` is configured, per-instance in-memory otherwise), with stricter limits for search endpoints;
4. enforce route-specific authorization through `api_route_guards.ts`;
5. delegate auth routes to Better Auth's SvelteKit handler.

The root layout loads user role/profile fields and translations. Authenticated layouts require a user; organizer and admin layouts check global role assignments. Competition management pages share a layout that resolves the current user's competition access once.

## Data Model

The core entities are `User`, `Competition`, `Category`, `Puzzle`, `Entry`, `ExternalParticipant`, `RoleAssignment`, `CompetitionCoorganizerRoleAssignment`, `CategoryJudgeAssignment`, `Request`, `League`, `LeaguePoints`, and `Notification`.

A `Competition` has ordered `Category` records. A `Category` has assigned `Puzzle` records, judge assignments, and `Entry` records. An `Entry` is the registration/result record for one category and can contain platform users plus external participants. Entry status is `PENDING_CONFIRMATION`, `CONFIRMED`, or `WAITLISTED`; result fields are `finishTime`, `tableNumber`, and `nPiecesCompleted`.

## Authorization

Global roles are stored in `RoleAssignment`. Organizer-level competition access is computed by `getCompetitionAccess`: the competition creator, an admin, or a scoped co-organizer can manage the competition. Judges are assigned per category through `CategoryJudgeAssignment`.

API route guards distinguish organizer, judge-or-organizer, category, entry, registration, authenticated, and public endpoints. Judges can access assigned competition operations such as reading category entries and recording entry results. Organizer-guarded routes handle registration management, judge assignment, and most category lifecycle operations.

## Domain Workflows

The registration workflow service owns entry creation, unregistering, organizer confirmation/refusal, reserved-slot counting, waitlist promotion, payment-reminder cooldowns, and notification side effects. Route actions and API handlers should call the workflow rather than duplicating registration state decisions.

Category lifecycle services start, stop, resume, restart, cancel, and complete categories, update competition status when appropriate, and publish realtime Ably events. Finish-time and piece-count mutations are validated in `db_entry.ts`: finish actions require a `LIVE` category, and piece counts require a `STOPPED` category with no finish time.

Automation includes daily auto-cancel of expired not-started competitions and optional QStash-based auto-stop for live categories.

## Realtime And Notifications

Competition mutations publish Ably events to `competition:{id}`. During-competition pages load an initial state from Prisma, subscribe through an Ably JWT endpoint, apply incremental client-side state updates, and invalidate SvelteKit data after reconnects.

Notifications are persisted in Prisma, rendered from translation keys, and can link users back into relevant pages. Selected registration notification types also send Resend emails; email failures are logged without rolling back successful domain mutations.
