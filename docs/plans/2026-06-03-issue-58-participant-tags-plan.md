---
title: Participant Tags for Sub-Prize Rankings
issue: "#58"
date_created: 2026-06-03
last_updated: 2026-06-06
---

# Implementation Plan: Participant Tags for Sub-Prize Rankings

Organizers need to segment entries into sub-prize groups within a category (e.g. "Local
municipality", "Juvenile") without separating them from the general ranking. A **tag is an
entry-level qualification**: the registrant claims a tag for the entry during registration, the
organizer confirms or rejects it on the registration management page, and confirmed tags appear as
inline badges on the general results ranking with a per-category toggle to filter to tagged entries
only. Tags are competition-scoped, claimable only in the categories the organizer opts into, and may
carry an optional flat price override per category.

This plan supersedes an earlier per-person design. The two concrete tag types that drove the design
are:

- **Local municipality** — the entry is "local". Organizers differ on whether *all* teammates or
  *just one* must be local; this is human judgement captured in the tag description, not computed.
- **Juvenile** — the entry includes a child ≤12 (an adult registering with a young child). Age is not
  stored in the data model and cannot be auto-computed; the organizer confirms by eye.

Because both resolve to a single yes/no the organizer judges at the entry level — and because
children typically have no account and enter as `ExternalParticipant`s — the tag attaches to the
**entry**, not to participants. This removes per-person declaration, the external-participant tagging
problem, and any ALL/ANY aggregation.

## Architecture and design

See `CONTEXT.md` for canonical terms: **Participant Tag**, **Tag Category**, **Entry Tag**.
(Terminology changed from the earlier draft: *Tag Assignment* → **Entry Tag**, *Tag Category Price* →
**Tag Category** with an optional `priceOverride`.)

### New data model

> **Revision 2026-06-06 — enum pivot.** Participant tags are now a **fixed enum**
> (`ParticipantTagType`), not an organizer-created `ParticipantTag` model. There is no per-competition
> tag record and no free-text name. The organizer's entry point is the `TagCategory` table: adding a
> row makes an enum tag claimable in a category. `TagCategory` and `EntryTag` reference the enum
> directly. Tag display names are now translated (`participant_tags.<TAG>`), superseding the earlier
> "no i18n" note.

Two new Prisma models, two new enums, one new `NotificationType` value. No new field on `User`,
`ExternalParticipant`, or `Competition`.

```
enum ParticipantTagType { LOCAL_MUNICIPALITY JUVENILE }
enum EntryTagStatus     { PENDING CONFIRMED REJECTED }

TagCategory                                   // organizer entry point: availability + optional pricing
  id            String  @id @default(cuid())
  tag           ParticipantTagType
  categoryId    Int
  category      Category
  priceOverride Int?                          // null = prize-only label; else overrides Category.price
  @@unique([tag, categoryId])

EntryTag                                       // one mutable claim slot per entry
  id        String  @id @default(cuid())
  entryId   String
  entry     Entry
  tag       ParticipantTagType
  status    EntryTagStatus  @default(PENDING)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([entryId])

NotificationType + TAG_REJECTED
```

Relations and cascades:

- `Category 1—* TagCategory` — `onDelete: Cascade` (deleting/removing a category removes its tag
  availability rows; no orphans).
- `Entry 1—1 EntryTag` (via `@@unique([entryId])`) — `onDelete: Cascade` (entry deletion removes its
  claim).
- There is no FK between `EntryTag` and `TagCategory` (both reference the enum). Removing a category's
  tag availability does **not** delete existing claims; such a claim simply loses its price override.

### Tag availability (per category)

A tag is **claimable in a category iff a `TagCategory` row exists** for that `(tag, categoryId)`.
This keeps "Juvenile" out of adults-only categories and drives what the registration form offers per
category. Availability and pricing live in the same row: `priceOverride` is optional.

### One tag per entry

An entry has **at most one** tag (`@@unique([entryId])`). Tags do not stack and never overlap, so
there is no price-conflict resolution. Allowing overlaps is a deliberate future extension — it
becomes "drop the unique constraint" with no data migration.

### Claim lifecycle (claim → confirm)

1. **Claim.** During registration the registrant may claim one available tag per category entry. This
   creates an `EntryTag` with status `PENDING`.
2. **Review.** On the registration management page the organizer **confirms** (`CONFIRMED`) or
   **rejects** (`REJECTED`) each pending claim. The organizer may also **directly assign** a tag to an
   entry that never claimed one — created straight as `CONFIRMED` (organizer authority).
3. **Edits.** While `PENDING` and registration is open, the participant may change, remove, or
   re-claim (a rejected claim is repointed to a new tag and reset to `PENDING` — still one slot). Once
   `CONFIRMED` the claim is locked to the participant; organizers can override/change/remove at any
   time.

The `EntryTag` row is owned by the participant while `PENDING`, owned by the organizer once
`CONFIRMED`.

### Pricing logic

The price for an entry in a category is:

- If the entry has a `PENDING`-or-`CONFIRMED` `EntryTag` whose `TagCategory` for that category has a
  non-null `priceOverride` → use `priceOverride`.
- Otherwise → `Category.price`.
- `REJECTED` is ignored.

A `PENDING` claim therefore drives the displayed and charged price immediately, before the organizer
confirms. The app never processes money (consistent with `showPaymentWarning`): if the organizer
later **rejects**, the entry reverts to base price and the difference is reconciled **off-platform**.

UI requirement: when a claimed tag carries a `priceOverride`, the `showPaymentWarning` block must
include a note that a rejected claim means reconciling the difference off-platform.

Tag claims are **independent of registration status** — a waitlisted entry keeps its claim and the
override applies if/when it is promoted to a reserved slot (the existing fee breakdown already only
charges reserved slots).

### Results display

The general ranking is unchanged (filter-only, no re-scoring). In addition:

- Each entry with a `CONFIRMED` `EntryTag` shows an inline badge (e.g. "Local", "Juvenile"),
  **always visible to everyone**. `PENDING`/`REJECTED` tags never appear on public results.
- A **per-category** filter toggle, populated from the tags that have a `TagCategory` row for that
  category. Selecting a tag hides non-qualifying entries while preserving the finish-time /
  piece-count order, so the sub-prize winner is simply the top remaining entry.

Note the naming collision: **entry registration status** (`RegistrationStatus.CONFIRMED`) and
**`EntryTag.status` (`CONFIRMED`)** are independent — a public badge requires both.

### Notifications

Reject only. On rejection, notify the entry creator via a new `NotificationType.TAG_REJECTED`
(consistent with `REGISTRATION_REFUSED`). Confirmation is self-evident (badge + price already applied)
and is not notified.

### References

- `docs/ARCHITECTURE.md` — request flow, route guards, service boundaries
- `docs/PRODUCT.md` — participant/organizer workflows, registration lifecycle
- `docs/workflows/registration-workflow.md` — entry status transitions
- `src/lib/services/registration-workflow.ts` — `CategorySignup`, `submitRegistration`
- `src/lib/database/db_competition.ts` — `getCompetitionResults`

---

## Tasks

### 1. Data model

- [x] Add `participantTags ParticipantTag[]` back-relation to `Competition` in `prisma/schema.prisma`
- [x] Add `EntryTagStatus` enum (`PENDING`, `CONFIRMED`, `REJECTED`)
- [x] Add `ParticipantTag` model (`id`, `name`, `competitionId`, relations)
- [x] Add `TagCategory` model (`tagId`, `categoryId`, `priceOverride Int?`, `@@unique([tagId, categoryId])`, `category` relation `onDelete: Cascade`)
- [x] Add `EntryTag` model (`entryId`, `tagId`, `status`, timestamps, `@@unique([entryId])`, `entry` relation `onDelete: Cascade`)
- [x] Add `TAG_REJECTED` to `NotificationType`
- [x] Add back-relations on `Category` (`tagCategories`) and `Entry` (`entryTag`)
- [ ] Generate and apply the Prisma migration  _(pending: run `pnpm exec prisma migrate dev` — left to you)_

### 2. Competition create/edit form — manage tags

**File:** `src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte` and `+page.server.ts`

- [x] Add a "Participant Tags" section: create / edit / delete tags (name only)
- [x] For each tag, choose which categories it is available in, and optionally set a `priceOverride` per selected category (flat integer, same unit as `Category.price`) — this is one `TagCategory` row per selected category
- [x] Persist `ParticipantTag` and `TagCategory` records via server action / API
- [x] On tag delete, warn if any `EntryTag` exists ("N entries have claimed this tag; deleting removes their sub-prize eligibility"), then cascade

### 3. Registration form — claim a tag

**File:** `src/routes/(internal)/competitions/competition_details/[id=integer]/registration/+page.svelte` and `+page.server.ts`

- [x] In the load function, fetch each category's available tags (tags having a `TagCategory` row for that category) including `priceOverride`
- [x] Per category in the signup UI, let the registrant claim **at most one** available tag
- [x] Apply `priceOverride` in `paymentFeeBreakdown` when a tag is claimed for that category
- [x] When a priced tag is claimed, show the off-platform-reconciliation note in the `showPaymentWarning` block
- [x] Extend `CategorySignup` with an optional `claimedTagId`; on submit create an `EntryTag` (`PENDING`) for the entry
- [x] Server-side validation: the claimed tag belongs to the competition and has a `TagCategory` row for that category

### 4. Entry-tag API endpoints

**Dir:** `src/routes/(internal)/api/` (new sub-route, e.g. `entry-tags/`)

- [x] `POST /api/entry-tags` — organizer directly assigns a tag to an entry, created `CONFIRMED`
- [x] `PATCH /api/entry-tags/[id]/confirm` — organizer confirms a `PENDING` claim
- [x] `PATCH /api/entry-tags/[id]/reject` — organizer rejects a `PENDING` claim (sends `TAG_REJECTED` notification)
- [x] `PATCH /api/entry-tags/[id]` — change the tag on the claim slot (participant while `PENDING` + registration open; organizer any time)
- [x] `DELETE /api/entry-tags/[id]` — remove a claim (participant while `PENDING`; organizer any time)
- [x] Guard endpoints: organizers with management authority on the competition for confirm/reject/assign/override; the entry creator only while `PENDING` and registration open

### 5. Registration management — inline claim review

**File:** `src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte` and `+page.server.ts`

- [x] Include each entry's `EntryTag` (with tag name and status) in the load query
- [x] Show the claim badge with its status per entry
- [x] Confirm / reject actions on `PENDING` claims (task 4 endpoints)
- [x] Allow the organizer to directly assign / change / remove a tag on any entry (task 4 endpoints)

### 6. Results page — badges and per-category filter

**File:** `src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte`

- [x] Update `getCompetitionResults` in `src/lib/database/db_competition.ts` to include each entry's `EntryTag` where `status = CONFIRMED` (tag id + name), and each category's available tags
- [x] Render the confirmed-tag badge inline on qualifying entries (order unchanged)
- [x] Add a per-category filter toggle from that category's available tags; filtering hides non-qualifying entries while preserving order (no re-scoring)

### 7. Notifications

**File:** `src/lib/notifications/` (alongside `registration_notifications.ts`)

- [x] Add a `notifyTagRejected(entry)` helper emitting a `TAG_REJECTED` notification to the entry creator
- [x] Call it from the reject endpoint (task 4)

### 8. Database utility functions

**File:** `src/lib/database/db_competition.ts` (or a new `db_participant_tags.ts`)

- [x] `createParticipantTag(data)` — create a tag with its `TagCategory` rows (availability + optional `priceOverride`)
- [x] `updateParticipantTag(id, data)` — update name and `TagCategory` rows
- [x] `deleteParticipantTag(id)` — delete tag, cascading `TagCategory` and `EntryTag`
- [x] `getTagsForCompetition(competitionId)` — tags with their categories/prices and claim counts
- [x] Claim mutations: `claimEntryTag`, `confirmEntryTag`, `rejectEntryTag`, `assignEntryTag`, `removeEntryTag` (respecting the lifecycle/authority rules)

### 9. Documentation

- [x] Update `CONTEXT.md` / `docs/GLOSSARY.md`: add **Participant Tag**, **Tag Category**, **Entry Tag**; remove the old *Tag Assignment* / *Tag Category Price* terms
- [x] Note in the registration workflow doc that tag claims are independent of registration status and ride through waitlist/promotion

---

## Resolved decisions (from the grilling session)

1. **Tag scope** — entry-level qualification, not per-person. Both Local and Juvenile use the same model.
2. **Age** — not stored; Juvenile is an organizer judgement (no auto-computation, no birthdate field).
3. **External participants** — non-issue, since tags attach to the entry, not to people.
4. **ALL/ANY eligibility** — dropped; the organizer judges the entry directly.
5. **Mutual exclusivity** — now a global invariant (one tag per entry); the per-competition flag is dropped. Overlaps are a future extension (drop `@@unique([entryId])`).
6. **Storage** — `EntryTag` join table with `@@unique([entryId])` (not columns on `Entry`), to keep the overlap door open without a migration.
7. **Availability + pricing** — unified `TagCategory(tagId, categoryId, priceOverride?)`; a tag is claimable in a category iff a row exists.
8. **Workflow** — claim (`PENDING`) → organizer confirm/reject; organizer may directly assign as `CONFIRMED`.
9. **Pricing timing** — `PENDING`/`CONFIRMED` `priceOverride` drives the charged price; reject reverts; differences reconciled off-platform; warning shown when a priced tag is claimed.
10. **Results** — badges always visible; per-category, filter-only toggle; sub-prize winner = top general-ranking entry with the confirmed tag.
11. **Notifications** — reject only (`TAG_REJECTED`).
12. **Cascades** — deleting a tag cascades `TagCategory` + `EntryTag` (with UI warning); deleting a category cascades `TagCategory`; entry deletion cascades `EntryTag`. Claims are independent of registration status.
13. **i18n** — superseded by the 2026-06-06 enum pivot: tags are a fixed enum, so their display names **are** translated via `participant_tags.<TAG>` (en/es/ca).
