---
title: Participant Tags for Sub-Prize Rankings
issue: "#58"
date_created: 2026-06-03
last_updated: 2026-06-03
---

# Implementation Plan: Participant Tags for Sub-Prize Rankings

Organizers need to segment participants into sub-prize groups within a category (e.g. "Local participant") without separating them from the general ranking. Participants declare tag eligibility during registration; the organizer confirms or rejects declarations inline on the registration management page. Confirmed tags appear as inline badges on the general results ranking, with a toggle to filter to tagged entries only. Tags are competition-scoped and optionally carry a flat price override per category.

## Architecture and design

See `CONTEXT.md` for canonical terms: **Participant Tag**, **Tag Assignment**, **Tag Category Price**.

### New data model

Three new Prisma models and one new Competition field:

```
Competition
  + tagsAreMutuallyExclusive  Boolean @default(false)
  + participantTags            ParticipantTag[]

ParticipantTag
  id              String  (cuid)
  name            String
  eligibilityRule TagEligibilityRule  (ALL | ANY)
  competitionId   Int
  competition     Competition
  assignments     TagAssignment[]
  categoryPrices  TagCategoryPrice[]

TagAssignment
  id          String  (cuid)
  tagId       String
  tag         ParticipantTag
  userId      String
  user        User
  status      TagAssignmentStatus  (PENDING | CONFIRMED | REJECTED)
  createdAt   DateTime
  updatedAt   DateTime
  @@unique([tagId, userId])

TagCategoryPrice
  id         String  (cuid)
  tagId      String
  tag        ParticipantTag
  categoryId Int
  category   Category
  price      Int
  @@unique([tagId, categoryId])
```

### Pricing logic

When displaying the registration price for a category, check whether the participant has a PENDING or CONFIRMED `TagAssignment` for a tag that has a `TagCategoryPrice` for that category. If so, show that price instead of `Category.price`. Rejection reverts to general price; any payment difference is resolved off-platform.

### Tag eligibility on entries (multi-person formats)

An entry qualifies for a tag's sub-prize based on the tag's `eligibilityRule`:
- `ALL`: every `User` on the entry has a CONFIRMED `TagAssignment` for that tag
- `ANY`: at least one `User` on the entry has a CONFIRMED `TagAssignment` for that tag

This is computed at results display time, not stored.

### Results display

The general ranking is unchanged. In addition:
- Each entry that qualifies for one or more tags shows inline tag badges
- A toggle above the ranking filters to entries that qualify for a selected tag (preserving the same finish-time / piece-count order)

### References

- `docs/ARCHITECTURE.md` — request flow, route guards, service boundaries
- `docs/PRODUCT.md` — participant/organizer workflows, registration lifecycle
- `docs/workflows/registration-workflow.md` — entry status transitions

---

## Tasks

### 1. Data model

- [ ] Add `tagsAreMutuallyExclusive Boolean @default(false)` to `Competition` in `prisma/schema.prisma`
- [ ] Add `TagEligibilityRule` enum (`ALL`, `ANY`) to schema
- [ ] Add `TagAssignmentStatus` enum (`PENDING`, `CONFIRMED`, `REJECTED`) to schema
- [ ] Add `ParticipantTag` model to schema
- [ ] Add `TagAssignment` model to schema
- [ ] Add `TagCategoryPrice` model to schema
- [ ] Add back-relations on `Competition`, `Category`, `User`
- [ ] Generate and apply Prisma migration

### 2. Competition create/edit form

**File:** `src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte` and `+page.server.ts`

- [ ] Add `tagsAreMutuallyExclusive` toggle to the competition form (load and save)
- [ ] Add a "Participant Tags" section: create/edit/delete tags (name, eligibility rule)
- [ ] For each tag, allow setting an optional price override per category (flat integer, same unit as `Category.price`)
- [ ] Wire up server actions / API calls to persist `ParticipantTag` and `TagCategoryPrice` records
- [ ] Validate: if `tagsAreMutuallyExclusive` is true and a participant already has one confirmed tag, block a second declaration at the UI level

### 3. Registration form — participant tag declaration

**File:** `src/routes/(internal)/competitions/competition_details/[id=integer]/registration/+page.svelte` and `+page.server.ts`

- [ ] In `getCompetitionForRegistration` (or equivalent load function), fetch `participantTags` for the competition including `categoryPrices`
- [ ] Display available tags in the registration form with a description and (if applicable) the discounted price per category
- [ ] Allow participant to select tags they claim eligibility for
- [ ] On registration submit, create `TagAssignment` records with status `PENDING` for each selected tag
- [ ] When rendering category price, apply `TagCategoryPrice` override if participant has a PENDING or CONFIRMED assignment for a matching tag
- [ ] Enforce `tagsAreMutuallyExclusive`: if true, limit selection to one tag

### 4. Tag assignment API endpoints

**Dir:** `src/routes/(internal)/api/` (new sub-route, e.g. `tag-assignments/[id]/`)

- [ ] `POST /api/tag-assignments` — create a tag assignment (organizer-initiated, directly CONFIRMED)
- [ ] `PATCH /api/tag-assignments/[id]/confirm` — organizer confirms a PENDING declaration
- [ ] `PATCH /api/tag-assignments/[id]/reject` — organizer rejects a PENDING declaration
- [ ] `DELETE /api/tag-assignments/[id]` — organizer removes a CONFIRMED assignment
- [ ] Guard all endpoints: only organizers with management authority on the competition may call them

### 5. Registration management — inline tag review

**File:** `src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte` and `+page.server.ts`

- [ ] In the registration load query, include `TagAssignment` records for each entry's users (joined through user → assignments)
- [ ] Display a PENDING tag badge per participant where applicable
- [ ] Add confirm / reject actions on each PENDING badge (calls endpoints from task 4)
- [ ] Allow organizer to directly assign a tag to a participant (calls `POST /api/tag-assignments`)

### 6. Results page — badges and tag filter

**File:** `src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte` and `+page.server.ts`

- [ ] Update `getCompetitionResults` in `src/lib/database/db_competition.ts` to include `participantTags` and CONFIRMED `TagAssignment` records for each entry's users
- [ ] Compute per-entry tag qualification client-side (applying ALL / ANY rule per tag)
- [ ] Render inline tag badges on qualifying entries in the general ranking
- [ ] Add a tag filter toggle above the ranking — when a tag is selected, only show qualifying entries (order preserved)

### 7. Database utility functions

**File:** `src/lib/database/db_competition.ts` (or a new `db_participant_tags.ts`)

- [ ] `createParticipantTag(data)` — create tag with optional category price overrides
- [ ] `updateParticipantTag(id, data)` — update name, eligibility rule, price overrides
- [ ] `deleteParticipantTag(id)` — delete tag and cascade assignments/prices
- [ ] `getTagsForCompetition(competitionId)` — fetch tags with prices and assignments count

---

## Open questions

1. **Translations** — Tag names are free-text strings entered by the organizer. How should the `sveltekit-i18n` setup handle organizer-defined strings that are not part of the static translation catalogue? (Likely: no i18n for tag names — they are user-generated content.)

2. **Notifications** — Should a participant receive a `Notification` when their tag declaration is confirmed or rejected? The existing `NotificationType` enum would need a new value (e.g. `TAG_CONFIRMED`, `TAG_REJECTED`). Defer to a follow-up or include now?

3. **External Participants** — The current `TagAssignment` links to a `User`. Can an `ExternalParticipant` (no platform account) receive a tag assignment? If so, the model needs an optional `externalParticipantId` field and the organizer must be the sole assignor (since external participants can't self-declare).
