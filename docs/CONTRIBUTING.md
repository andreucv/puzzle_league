# Contributing

## Setup

Use Node 20 and pnpm. Install dependencies with `pnpm install`; the repo rejects other package managers through `preinstall`.

Start from `.env.example`, then add any feature-specific keys required by the code you are running. Common local keys include database connection values, `BETTER_AUTH_SECRET`, OAuth keys, Cloudinary keys, Ably, Resend, PostHog, QStash, and `CRON_SECRET`. Playwright requires `LOCAL_DATABASE_TEST_DATABASE_URL` pointing to a local PostgreSQL database.

Useful commands:

- `pnpm dev` starts the Vite dev server.
- `pnpm check` runs SvelteKit sync and `svelte-check`.
- `pnpm test:unit` runs Vitest tests under `src/**/*.test.ts`.
- `pnpm test:e2e` runs Playwright tests under `e2e/`.
- `pnpm test` runs unit tests and E2E tests.
- `pnpm build` creates the production build.

## Code Guidelines

Use the domain terms in `docs/glossary.md`: Competition, Category, Entry, Registration, Participant, Organizer, Judge, External Participant, and Notification. Avoid reintroducing older names such as Record or Inscription.

Keep business rules server-side. Page actions and API handlers should validate request shape, call shared services or database helpers, and return responses. Put cross-route workflows in `src/lib/services/`, read/write helpers in `src/lib/database/`, and reusable UI in `src/lib/components/`.

Do not duplicate authorization logic. Use the existing layouts, `getCompetitionAccess`, and API route guards. When adding an API route, register its guard in `src/lib/api_utils/api_route_guards.ts` unless it is intentionally public and belongs in `api_whitelist.ts`.

For user-visible UI, follow the existing Svelte 5, Tailwind, Skeleton UI, and translation patterns. Add translation keys for `en`, `es`, and `ca` when adding new copy. Prefer existing form helpers, Superforms/Zod validation, and contact/date utilities before adding new validation code.

When changing competition-day state, keep Prisma state, Ably events, notifications, and tests in sync. When changing notifications, use `src/lib/notifications/` and only add email side effects deliberately.

## Data And Tests

Edit `prisma/schema.prisma` and add migrations for data model changes. Do not edit generated Prisma files directly.

Add focused Vitest coverage for services, utilities, API guards, and reusable components. Add Playwright coverage for participant, organizer, admin, onboarding, registration, or competition-day workflows. E2E tests should use the existing seed helpers and local test database reset flow.

Before opening a PR, run the smallest relevant tests plus `pnpm check`; run `pnpm test` for broad workflow or schema changes. Keep PRs scoped, mention migrations/env changes, and include the commands you ran.
