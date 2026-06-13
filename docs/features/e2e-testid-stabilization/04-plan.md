---
slug: e2e-testid-stabilization
stage: plan
feature: Stabilize e2e tests against copy changes via data-testid attributes
issue: null
status: approved
created: 2026-06-13
updated: 2026-06-13
related:
  - docs/features/e2e-infra-overhaul/04-plan.md
---

# Implementation Plan: e2e test stabilization with `data-testid`

The Playwright suite still asserts on, and selects by, **translated UI copy** (`getByText`,
`getByRole({ name })`, `getByLabel`, `getByPlaceholder`). Every such string resolves to a key in
[src/lib/translations/en/common.json](../../../src/lib/translations/en/common.json), so any copy edit
in `en` / `es` / `ca` silently breaks a passing test. The suite already uses `getByTestId` heavily
(~330 usages), so this work **extends an existing convention** rather than introducing one.

Goal: add stable `data-testid` attributes to the source components behind the fragile matchers, and
switch the e2e assertions/selectors to those testids. Dynamic data values (competition/participant
names), brand names (`PuzzLigas`), and country names are intentionally left as text matchers.

This plan complements the sibling infra work in
[e2e-infra-overhaul](../e2e-infra-overhaul/04-plan.md). No GitHub issue yet.

## Architecture and design

### Approach

- **Source side:** add `data-testid="…"` to the rendering element in each component. testid naming
  follows the existing kebab-case, behavior-describing convention seen in the suite
  (`submit-all-registrations`, `registration-status-badge`, `toggle-registration`,
  `section-pending`). No logic, markup structure, or styling changes — attributes only.
- **Test side:** replace the matching `getByText` / `getByRole` / `getByLabel` / `getByPlaceholder`
  call with `getByTestId(...)`. Where the test asserts the *content* of a status (e.g. badge says
  "confirmed"), keep an assertion on the testid'd element's text via a status data-attribute (e.g.
  `data-status="confirmed"`) so we assert the **state**, not the translated word.
- **i18n:** no translation keys are added or renamed. testids are not translated and must never
  contain user-facing copy.
- **Reuse:** badge/status text repeats across components — prefer adding the testid (and a
  `data-status` / `data-state` attribute) once in the shared badge component
  (`EntryRegistrationStatusBadge.svelte`, `CategoryRegistrationChip.svelte`) rather than per call
  site.

### Out of scope (leave as text matchers)

- Dynamic data: `competition.name`, `competition.description`, participant names, `name` variable.
- Brand / non-copy literals: `PuzzLigas`, country options (`🇪🇸 Spain`, `/Spain/`), `+34` phone
  prefixes (these are data, not app copy — Bucket C).

### Source components and their fragile matchers (grouped by priority)

**P1 — Registration flow & status badges** (highest test dependency)
- [src/lib/components/registration/EntryRegistrationStatusBadge.svelte](../../../src/lib/components/registration/EntryRegistrationStatusBadge.svelte)
  — add `data-testid` + `data-status` (`confirmed` / `refused` / `waitlisted` /
  `pending_confirmation`). Replaces `getByText('Registration confirmed'|'refused'|'waitlisted')`
  and `getByText('Pending Confirmation')`.
- [src/lib/components/category/CategoryRegistrationChip.svelte](../../../src/lib/components/category/CategoryRegistrationChip.svelte)
  — status chip testid for the same states on category cards.
- [src/routes/(internal)/competitions/competition_details/[id=integer]/registration/+page.svelte](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/registration/+page.svelte)
  — `Sign Up` button, `Build Pair` button, `Add another registration` button, `Add as
  non-registered participant` action, `Team` label, `2 new registration(s)` summary
  (`new_registrations_summary`), `Registration is currently closed`.
- manage_registrations page — `closed` status text, `No registrations for this category`
  (`no_registrations`). (Confirm exact file during impl: `competition/[id]/manage_registrations`.)
- Test/helper updates: [e2e/registration/helpers.ts](../../../e2e/registration/helpers.ts),
  [e2e/registration/organizer.test.ts](../../../e2e/registration/organizer.test.ts),
  [e2e/registration/participant.test.ts](../../../e2e/registration/participant.test.ts).

**P1 — Competition create/edit form** (largest single cluster)
- [src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte)
  — `Create new competition` / `Edit competition` heading, `Add Category` button,
  `Multi-day competition` switch, `Dates auto-computed from categories` notice
  (`auto_computed_dates`), `Please select a start date for this category` validation message.
- Address / date sub-components used by the form — `Toggle suggestions` label,
  `Select a country...` placeholder, `e.g. 08001` postal-code textbox, the date-picker spinbuttons
  (`month`/`day`/`year`) and calendar day labels. (Identify exact component files during impl;
  likely under `src/lib/components/` address & date pickers.)
- Test updates: [e2e/competition/organizer.test.ts](../../../e2e/competition/organizer.test.ts),
  [e2e/competition/not_creator_organizer.test.ts](../../../e2e/competition/not_creator_organizer.test.ts),
  [e2e/responsive/mobile_navigation.test.ts](../../../e2e/responsive/mobile_navigation.test.ts) (`Create new competition`).

**P2 — Navigation & app chrome**
- [src/lib/components/common/layout/DrawerNav.svelte](../../../src/lib/components/common/layout/DrawerNav.svelte)
  — `Review Permissions Requests` link (`review_requests`), `Create Competition` link
  (`create_competition`), `Sign out`, `Sign in`, `Organizer` role badge.
- [src/lib/components/common/ErrorPage.svelte](../../../src/lib/components/common/ErrorPage.svelte)
  — `Access Denied` heading (`access_denied`), rendered via [src/routes/+error.svelte](../../../src/routes/+error.svelte) on a 403 response.
- Profile page — `Profile` heading, `Sign out` button. (Confirm file: `profile/+page.svelte`.)
- Landing — `Sign in` button, `Organizer` badge.
- Test updates: [e2e/auth/anonymous.test.ts](../../../e2e/auth/anonymous.test.ts),
  [e2e/profile/profile.test.ts](../../../e2e/profile/profile.test.ts),
  [e2e/landing/anonymous.test.ts](../../../e2e/landing/anonymous.test.ts),
  [e2e/landing/participant.test.ts](../../../e2e/landing/participant.test.ts),
  [e2e/responsive/mobile_navigation.test.ts](../../../e2e/responsive/mobile_navigation.test.ts).

**P3 — Pickers & search**
- Explore search input — `look for…` placeholder, `clear` button. Used by
  [e2e/explore_competitions/anonymous.test.ts](../../../e2e/explore_competitions/anonymous.test.ts).
- Onboarding country/phone selectors —
  [e2e/onboarding/participant.test.ts](../../../e2e/onboarding/participant.test.ts) (`Toggle
  suggestions`, country option). Country *option text* stays as data (Bucket C); only the
  trigger/input gets a testid.

**P4 — Bucket B (optional, formatting-derived)**
- Price display (`500€`, `${cat.price} €`) and phone display (`+34 …`) — add testids to the
  price/phone elements only if we also want to harden these. Lower value; recommend deferring.

### Verification

The suite is the verification surface. After each priority group, run the affected spec(s) with
Playwright and confirm green. A useful guard: after migrating a group, grep the touched specs to
confirm no `getByText`/`getByRole({name})` referencing translated copy remains for that area.

## Tasks

- [x] **P1a — Status badges.** Added `data-status={status}` to `EntryRegistrationStatusBadge.svelte`
  (testid already existed); migrated badge assertions to `toHaveAttribute('data-status', …)` and the
  `Registration confirmed/refused/waitlisted` checks to the notifications feed
  (`notification-item` + `data-notification-type`) in `organizer.test.ts`, `participant.test.ts`,
  `helpers.ts`. (`CategoryRegistrationChip` did not need a status testid — no test targeted it.)
- [x] **P1b — Registration page actions.** Added `signup-category-{id}` (Sign Up / Build Pair /
  Add another), `team-builder`, `add-external-participant`, `new-registrations-summary`,
  `no-registrations` (RegistrationList), and `data-open` on `registration-status`; migrated
  `helpers.ts`, `organizer.test.ts`, `participant.test.ts`. Removed the redundant
  `Registration is currently closed` text assertion (covered by `registration-closed-warning`).
- [x] **P1c — Competition form.** Added `create-/edit-competition-heading` (via new
  `TitleBackButton` `testId` prop), `multi-day-toggle`, `auto-computed-dates-notice`,
  `add-category`, `postal-code`, `country-input`, `country-trigger`; reused existing
  `category-start-date-create-0` for the validation step and `nav-drawer-review-permissions-requests`.
  Migrated `competition/organizer.test.ts`, `not_creator_organizer.test.ts`,
  `responsive/mobile_navigation.test.ts`.
- [x] **P2 — Navigation & chrome.** Added `error-page-title` (`ErrorPage.svelte`),
  `drawer-organizer-section` (`DrawerNav.svelte`), `profile-heading` (via new `GenericTitle`
  `testId` prop), `sign-out-button`, `sign-in-button` (`Header.svelte`); reused `profile-avatar`
  and `nav-drawer-create-competition`. Migrated `auth`, `profile`, `landing` specs.
- [x] **P3 — Pickers & search.** Added `competition-search-input` (via new `SearchInput` `testId`
  prop) and `clear-filters`; migrated `explore_competitions/anonymous.test.ts`. Onboarding
  country/phone option selections left as data (Bucket C).
- [ ] **P4 — (Deferred) Bucket B.** Price/phone display testids (`500€`, `${cat.price} €`, `+34`)
  not changed — left as data matchers. Revisit only if they break.
- [x] **Type/Svelte check.** `pnpm check` passes with 0 errors after the changes.
- [ ] **Full-suite verification.** Run `pnpm test:e2e` in the configured test environment (needs
  test DB + `TEST_*` env) — could not be run in the implementation environment.
- [x] **`graphify update .`** — graph refreshed (3038 nodes / 4100 edges).
- [ ] **Close-out:** run **`/feature-doc` (Stage 5)** once merged to produce
  `docs/features/e2e-testid-stabilization/05-workflow.md`.

## Open questions

1. **testid naming for status:** prefer a single `data-testid="registration-status-badge"` +
   `data-status="confirmed"` (assert state via attribute) over per-state testids
   (`registration-status-confirmed`)? Recommendation: the `data-status` attribute approach — one
   selector, assert the state value.
2. **Bucket B (P4) in or out?** Price/phone formatting matchers are only mildly fragile.
   Recommendation: defer unless you've seen them break.
3. **Scope of the date-picker / address-picker testids:** these are shared library-style
   components — do you want testids added there (benefits any future form) or only at the
   competition-form call sites?
