# Create or Edit Competition

## Purpose
Allow Organizers to create a new Competition and update an existing one, including its Categories and limits, so events can be scheduled and later used for registrations and results.

## Roles and Permissions
- Primary role: Organizer
- Access control:
  - Create: any authenticated user with Organizer role
  - Edit: Organizer who is creator of the competition
- Audit:
  - Log who created/updated competitions and categories (userId, competitionId, before/after snapshot, timestamp)

## Scope
- In scope:
  - Create competition: name, description, location, start/end dates, registrationOpen
  - Manage categories: add/remove, name, type, start/end times, max parties, party size
  - Edit competition and categories
  - Deleting a competition
- Out of scope:
  - Managing judges, registrations, results, or status transitions

## Success Criteria
- Organizer can submit valid form and see success confirmation
- On edit, existing data pre-fills and changes persist
- Client-side and server-side validation prevents invalid data
- E2E happy path runs reliably across desktop and mobile viewports

## Assumptions & Dependencies
- User is authenticated via Better-Auth and has required role
- Prisma/PostgreSQL schema as in current project (Competition, Category)
- SvelteKit form actions used for create/update; Tailwind + Skeleton UI for styling
- Timezone: assume times are selected in local time and stored as UTC on server

---

# UX Specification

## User Goals (Jobs-to-be-done)
- As an Organizer, I want to create a competition with categories so participants can register.
- As an Organizer, I want to edit competition details and categories so I can correct or update schedules.

## Primary Use Cases / User Stories
- UC1: Create Competition
  - Trigger: Organizer clicks “Create Competition”
  - Preconditions: Organizer role
  - Main flow:
    1) Fill name, description, location
    2) Pick start date/time and end date/time
    3) Add one or more categories
    4) For each category: choose type, set name, start/end time, max parties, party size
    5) Submit
  - Alternate flows: Cancel; Save with no categories (not allowed if business rule requires at least one)
  - Postconditions: Competition created with categories; redirected to details or success toast
  - Edge cases: Overlapping categories allowed vs. warned; times outside competition window blocked
- UC2: Edit Competition
  - Trigger: Organizer opens an existing competition in edit mode
  - Preconditions: Organizer for that competition or Admin
  - Main flow: Same fields; can add/remove/update categories
  - Alternate flows: Remove a category that has registrations (should be blocked or require separate workflow)
  - Postconditions: Changes persisted; success toast; return to details

## Page Structure
- Header: “Create Competition” vs “Edit Competition” based on presence of id/data
- Sections:
  - Competition Details: name, description, location
  - Schedule: start date/time, end date/time, registrationOpen toggle
  - Categories: Add Category button, CategoryList
  - Actions: Submit, Cancel
- States: loading (skeleton), empty (no categories yet), error summaries per section

## UI Components
- Composite components:
  - CategoryEditor (per category): name, type, start/end, maxParties, maxPartySize, remove
  - CategoryList: renders list with reorder/remove/add
- Inputs/controls: standard inputs, datetime pickers, selects, toggles; use Skeleton UI
- Reuse: Prefer existing `CategoryCreatorUpdator.svelte` and `CategoryCard.svelte` if compatible

## State Management
- Local state shape:
  - competition: { id?, name, description?, location?, startDate, endDate, registrationOpen }
  - categories: Array<{ id?, name, type, startTime, endTime, maxParties?, maxPartySize? }>
  - derived: totalCapacity = sum(maxParties*maxPartySize || maxParties)
- Persist across navigation: not required; rely on form submission

## User Actions and Interactions
- Actions: add/remove category; submit create/update; cancel
- Validation (client + server):
  - name: required, 3–80 chars
  - description: 0–1000 chars
  - location: 0–120 chars
  - startDate <= endDate
  - Each category: name required (3–60), type required, start < end
  - Category times must be within competition start/end
  - maxParties: integer ≥ 1 when provided
  - maxPartySize: integer ≥ 1 when provided (required for PAIRS/TEAM types; defaults to 1 for INDIVIDUAL)
  - Category names unique within a competition
- Confirm irreversible: removing a category prompts confirmation
- Accessibility: keyboard navigable, visible focus, proper labeling

## Performance
- Data fetching: in parallel for edit mode (competition + categories)
- No pagination; small lists; debounce validations that are async (if any)
- Optimistic UI for local list operations (add/remove) prior to submit

---

# Data and Backend Specification

## Data Model (Prisma)
- Models used: Competition, Category, enums CategoryType and CompetitionStatus
- Key fields:
  - Competition: id Int, name String, description?, location?, startDate DateTime, endDate DateTime, registrationOpen Boolean, creatorId String
  - Category: id Int, competitionId Int, name String, type CategoryType, startTime DateTime, endTime DateTime, maxParties Int?, maxPartySize Int?
- Relations: Competition 1—N Category (onDelete: Cascade)
- No schema changes needed

## Domain Rules and Invariants
- Competition startDate <= endDate
- Category window lies within competition window
- Category startTime < endTime
- Category names unique per competition
- When type = INDIVIDUAL, partySize defaults to 1 if omitted

## Authorization
- Better-Auth session required
- Role checks in load/action: only creator, assigned Organizer, or Admin may edit
- Row-level: queries filter by competitions user can manage
- Guard points: load function and form actions

## Server API (SvelteKit)
- Prefer SvelteKit form actions over separate API
- Endpoints: `+page.server.ts` actions
  - createCompetition
  - updateCompetition
- Request payload: formData containing competition fields and JSON string for categories array
- Response: redirect to details on success; return fail(400) with errors on validation failure

## Server Actions and Load
- load(params):
  - If id present, fetch competition by id with categories for prefill; check authorization, else 403/redirect
- Actions:
  - Transaction: create/update competition then upsert categories
  - For update: diff categories by id; create new, update existing, delete removed (if allowed by business rules)
  - Handle conflicts and unique name rule
- Error handling: use typed error objects; show message summary at top

## Events & Timers
- All times stored as UTC; server is source of truth

## Audit Logging
- On create/update, store audit record with userId, competitionId, before/after JSON, timestamp
- If DB table not available yet, log to server logs as interim

---

# Implementation Plan (SvelteKit)

## Files and Directories
- Routes to (create/update or confirm existing):
  - src/routes/(auth)/(organizer)/competition/edit/[[id]]/+page.svelte
  - src/routes/(auth)/(organizer)/competition/edit/[[id]]/+page.server.ts
- Components:
  - `src/lib/components/CategoryCreatorUpdator.svelte`

## Client Implementation
- Bind inputs to local state; CategoryList receives categories via bind and emits add/remove/update
- Disable Submit while pending; show success/error toasts
- Serialize categories to JSON for form action

## Server Implementation
- Use Prisma transaction for competition + categories
- Anti-CSRF via SvelteKit form actions

## Styling
- Tailwind for layout; Skeleton UI inputs, buttons, cards, alerts
- Responsive: forms stack on small screens; two-column layout on md+

---

# Test Plan

## E2E Tests (Playwright)
- New tests:
  - create competition happy path
  - edit competition change name and category time
  - validation errors (start after end; category outside range)
  - authorization (non-organizer cannot edit)
- Reuse/extend existing tests in e2e/ (e.g., `4-createcompetitionpage.test.ts`)
- Fixtures: organizer auth setup files already present


