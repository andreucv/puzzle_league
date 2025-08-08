# [Workflow Title]
Short, action-oriented title (e.g., “Create Competition”, “Start Categories and Record Results”)

## Purpose
- Why this workflow exists and the user problem it solves.

## Role(s) and Permissions
- Primary role(s): e.g., Organizer, Judge
- Secondary role(s) (if any)
- Access control summary (who can do what)
- Audit needs: what must be logged

## Scope
- In scope: key tasks and user actions
- Out of scope: explicitly list to avoid scope creep

## Success Criteria
- Quantifiable outcomes and completion conditions
- UX acceptance criteria (clear, testable statements)

## Assumptions & Dependencies
- Preconditions (e.g., user logged in, competition exists)
- External dependencies (e.g., auth ready, feature flags, device constraints)
- Time constraints (e.g., scheduled vs. real-time actions)

---

# UX Specification

## User Goals (Jobs-to-be-done)
- “As a [Role], I want to [Action], so that [Outcome].”
- …

## Primary Use Cases / User Stories
- UC1: Title
  - Trigger
  - Preconditions
  - Main flow (steps)
  - Alternate flows
  - Postconditions
  - Edge cases

## Page Structure
- Header/title logic (e.g., “Create” vs “Edit” mode)
- Sections/blocks (order and purpose)
- Empty states / loading states / error states

## UI Components
- Composite components needed (e.g., CategoryEditor, CategoryList, CategoryCard)
- Inputs, controls, lists, dialogs
- Reuse of existing components vs. new ones
- Skeleton UI elements to use

## State Management
- Local state shape
- Derived/computed state
- Shared stores (in `src/shareds/`) if applicable
- Persisted state across navigation (if needed)

## User Actions and Interactions
- Actions (create, edit, delete, start, stop, submit, scan, assign, search, filter, sort)
- Validation rules (client + server)
- Confirmation dialogs and irreversible actions
- Keyboard, focus, and mobile interactions

## Performance
- Data fetching strategy (lazy, parallel, streaming)
- Pagination/virtualization
- Debounce/throttle for search
- Optimistic UI and fallbacks

---

# Data and Backend Specification

## Data Model (Prisma)
- New or updated models
- Fields (name, type, constraints, defaults)
- Relations and cascading rules
- Indexes and unique constraints
- Example Prisma schema diff

## Domain Rules and Invariants
- Business constraints (e.g., max parties per category)
- Cross-entity validations

## Authorization
- Role checks (Better-Auth integration)
- Row-level access constraints
- Guard points (load, actions, API endpoints)

## Server API (SvelteKit)
- Endpoints (routes, methods)
- Request/response payloads
- Status codes and error shapes
- Idempotency behavior (if needed)
- Rate limiting (if any)

## Server Actions and Load
- `+page.server.ts` actions (names and purposes)
- `load` function data dependencies
- Error handling and redirection
- Form handling expectations

## Events & Timers (if applicable)
- Start/stop time semantics
- Clock source (server vs client)
- Recording logic and rounding
- Late/early start handling

## Audit Logging
- What to log (who, what, when, before/after values)
- Where to log it (DB table, external log)

---

# Implementation Plan (SvelteKit)

## Files and Directories
- Routes to create/update:
  - `src/routes/.../+page.svelte`
  - `src/routes/.../+page.server.ts`
  - `src/routes/api/.../+server.ts` (if needed)
- Components:
  - `src/lib/components/...`
- Shared stores:
  - `src/shareds/...`
- Utilities:
  - `src/lib/utils/...`

## Client Implementation
- Component composition and props
- Bindings to stores and inputs
- Form submission strategy (progress indicators, disable states)
- Error and success toasts/messages

## Server Implementation
- Input parsing and schema validation (zod or similar)
- DB transactions and rollback strategy
- Conflict detection and retries
- Sanitization and anti-CSRF (built-in SvelteKit form actions)

## Styling
- Tailwind classes and layout
- Skeleton UI components chosen
- Responsive breakpoints

---

# Test Plan

## E2E Tests (Playwright)
- New test files and scenarios
- Critical paths (happy path, validation errors, edge cases)
- Example test data and setup (auth fixtures)

