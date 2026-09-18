---
slug: per-category-registration-90
stage: design
feature: Split registration open/close per category instead of per competition
issue: "#90"
status: approved
created: 2026-06-17
updated: 2026-06-17
related:
  - docs/features/per-category-registration-90/01-problem.md
  - docs/features/per-category-registration-90/02-ideas.md
  - docs/features/per-category-registration-90/04-plan.md
---

# Design: Split registration open/close per category

Scope: `prisma/schema.prisma` (`Category`), the registration write-side seam
[`src/lib/services/registration-workflow.ts`](../../../src/lib/services/registration-workflow.ts),
a new per-category toggle endpoint under
`src/routes/(internal)/api/categories/[id]/toggle_registration/`, and three read surfaces:
manage-registrations
([`+page.svelte`](<../../../src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte>)),
participant registration
([`registration/+page.svelte`](<../../../src/routes/(internal)/competitions/competition_details/[id=integer]/registration/+page.svelte>)),
and competition details
([`+page.svelte`](<../../../src/routes/(internal)/competitions/competition_details/[id=integer]/+page.svelte>) +
[`RegistrationActionButton.svelte`](../../../src/lib/components/registration/RegistrationActionButton.svelte)).
Refs: [registration-workflow.md](../../workflows/registration-workflow.md). Chosen direction:
[02-ideas.md › Option A](./02-ideas.md). Problem: [01-problem.md](./01-problem.md).

## Problem

Registration open/close is a single competition-wide boolean
(`Competition.registrationOpen`, `prisma/schema.prisma:211`). Organizers can't open a newly
added category without re-exposing the others, and can't hard-close a category that fills early.
Guiding principle: **add a per-category switch that is AND-ed with the existing master switch**,
default-open so today's behavior is unchanged until an organizer deliberately closes a category.
Keep all write-side decisions inside the `registration-workflow` seam.

## Design

### 1. Effective "registration open" rule
A participant may register into a category when **all** hold:

```
competition.registrationOpen   (master, unchanged)
&& category.registrationOpen   (new)
&& category.status === NOT_STARTED   (unchanged)
```

Organizer mode (Competition creator / Admin / scoped Organizer) **bypasses both** the master and
the per-category flag, exactly as it bypasses `registrationOpen` today — still gated by
`NOT_STARTED`. "Closed" stays independent from "full": a full category (`maxParties` reached)
keeps waitlisting unless the organizer also closes it.

### 2. Server gate (`registration-workflow.ts`)
`submitRegistration` already loads each category with `include: { competition: true }`
(`registration-workflow.ts:286-289`), so `category.registrationOpen` is available with no query
change. Inside the per-signup loop, immediately after the existing `NOT_STARTED` check
(`registration-workflow.ts:400-402`), add:

```ts
if (!category.registrationOpen && !actor.isOrganizer) {
    throw new RegistrationWorkflowError(
        'REGISTRATION_CLOSED',
        `Registration is closed for category: ${category.description || category.type}`,
    );
}
```

The existing competition-level gate (`:280-282`) is untouched — together they implement the AND.
Reuses the existing `REGISTRATION_CLOSED` error code (→ HTTP 400).

### 3. Toggle action (new endpoint + seam function)
Add `toggleCategoryRegistration({ categoryId, actor })` to `registration-workflow.ts`: it calls
the existing `ensureCanManageCompetition(tx, category.competitionId, actor)` (`:202-228`) then
flips `category.registrationOpen`. New route
`src/routes/(internal)/api/categories/[id]/toggle_registration/+server.ts` (POST) builds the
actor from `event.locals.user`, calls the seam, captures a PostHog `category_registration_toggled`
event (mirroring the competition endpoint's `registration_toggled`), and returns
`{ id, registrationOpen }`.

> Note: unlike the existing competition toggle endpoint (which performs **no** authorization
> check — `api/competitions/[id]/toggle_registration/+server.ts`), the new endpoint authorizes
> through the seam. See open question Q3 about retrofitting the competition endpoint.

### 4. Manage-registrations UI (per-category toggle)
On each **active (`NOT_STARTED`)** category card in
`manage_registrations/+page.svelte` (the `categoryCard` snippet, `:253`), add a compact
open/closed toggle in the card header next to `CategoryCardTitle` (`:256`), styled like the
competition-wide `ManageRegistrationStatus` control (lock-open/lock icon, success/error color,
status text). It calls the new endpoint via `fetch`, then `invalidate('data:manage-registrations')`.
Started/completed categories (rendered with `showActions = false`, `:377`) do **not** show the
toggle — they can't accept registration regardless. The competition-wide `ManageRegistrationStatus`
card stays as the master switch.

```
┌ Category: Adults ───────────────  [🔓 Open ▸ Close]  🪑 12/20 ┐
│  …entries…                                                    │
└──────────────────────────────────────────────────────────────┘
```

### 5. Participant registration page
`registration/+page.svelte`: tighten `canRegisterForCategory` (`:61-63`) to also require the
flag:

```ts
function canRegisterForCategory(category: Category): boolean {
    return !!canRegister && category.status === 'NOT_STARTED' && category.registrationOpen;
}
```

`category.registrationOpen` arrives automatically (the loader's category query returns full
category rows). When a `NOT_STARTED` category is closed, the card already falls through to the
"registration not available" branch (`:1040-1041`); replace that copy with a category-specific
closed message (new key, see §7). The competition-wide `!canRegister` banner (`:563-568`) is
unchanged.

### 6. Competition details page (single CTA button)
The details page shows one competition-level `RegistrationActionButton`. Fold the per-category
flag into the **capacity** predicate rather than the button's `registrationOpen` prop: extend
`hasRegistrableSpot` (`+page.svelte:69`) and its `CategoryCounts` type (`:68`) so a category
counts as registrable only when `status === 'NOT_STARTED' && registrationOpen && has room`.
`categoriesWithCounts` comes from `getCompetitionCategories`, which already forwards
`registrationOpen` via its `...rest` spread (`db_competition.ts:252-261`) — no loader change.
The button receives an **effective** open state:
`registrationOpen = competition.registrationOpen && hasOpenRegistrationCategory(categories)`,
where `hasOpenRegistrationCategory` is true when at least one `NOT_STARTED` category is still
`registrationOpen` (ignoring capacity). This distinguishes the button's disabled copy: "full"
when open categories exist but none has room, and "closed" when no category is open for
registration — including the case where the competition is open but every category is
individually closed (resolved Q1).

### 7. i18n
Add keys to `en`/`es`/`ca` under `src/lib/translations/`:
- `manage_registrations.category_registration_open` / `…_closed` / `…_toggle` (per-category
  toggle label + status), and any toggle error key reusing existing `…toggle_error`.
- `registration.category_registration_closed` — the per-category closed message on the
  registration card (replacing the generic `registration_not_available` for the closed case).

### 8. Tests
Extend `registration-workflow.test.ts`: (a) participant blocked when
`category.registrationOpen = false` even though `competition.registrationOpen = true`;
(b) organizer bypasses a closed category; (c) participant blocked when competition closed even if
category open (existing master behavior still holds); (d) `toggleCategoryRegistration` authorizes
via `ensureCanManageCompetition`. No change to waitlist/promotion tests.

## Data / model impact

- **New column:** `Category.registrationOpen Boolean @default(true)`. Postgres applies the default
  to existing rows on add, so all current categories backfill to `true` → behavior unchanged.
  Regenerate Prisma client + Zod types.
- **No query changes** for reads: `getRegistrationsForCompetition` (`db_entry.ts:60`) and
  `getCompetitionCategories` (`db_competition.ts:214`) both use `include`/spread and return the
  new scalar automatically; the registration page loader likewise.
- **New write path:** `toggleCategoryRegistration` seam function + one API route.
- **Unchanged:** waitlist promotion, `maxParties` capacity math, notifications (toggling
  open/closed emits none — confirm Q2), `Competition.registrationOpen`.

## Out of scope

- Auto-closing a category when `maxParties` is reached (kept independent per Stage 2).
- A bulk "close/open all categories" control beyond the existing competition master toggle.
- Broader refactor of the registration page loader or `RegistrationActionButton` states.

## Resolved decisions

1. **Details-page button copy** — *Resolved by deriving an effective-open state.* The single
   competition-level button reads "closed" (not "full") when no `NOT_STARTED` category is open for
   registration — including when the competition master switch is open but every category is
   individually closed. It reads "full" only when open categories exist but none has room.
2. **Notifications on toggle** — *No notification* is emitted when a category is opened/closed,
   consistent with the competition toggle today.
3. **Competition endpoint auth gap** — *Fix in the same change.* Retrofit
   `ensureCanManageCompetition` onto the existing
   `api/competitions/[id]/toggle_registration` endpoint while adding the per-category endpoint
   (same seam, small).
