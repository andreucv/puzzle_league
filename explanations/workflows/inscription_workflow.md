# Inscription Workflow

> This document describes the complete inscription (registration) workflow: how users sign up for competition categories, the design decisions behind it, and the full catalogue of user interactions on the inscription page. It also serves as the **test discovery entrypoint** for this feature.

---

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
- [Architecture](#architecture)
- [Design Decisions](#design-decisions)
- [Data Model](#data-model)
- [Inscription Page Workflows](#inscription-page-workflows)
  - [Viewing a category](#1-viewing-a-category)
  - [Individual category — sign up yourself](#2-individual-category--sign-up-yourself)
  - [Individual category — sign up someone else](#3-individual-category--sign-up-someone-else)
  - [Group category — build a team](#4-group-category--build-a-team)
  - [Adding a non-platform participant (UserIntent)](#5-adding-a-non-platform-participant-userintent)
  - [Reusing a previously registered UserIntent](#6-reusing-a-previously-registered-userintent)
  - [Removing a queued signup before submission](#7-removing-a-queued-signup-before-submission)
  - [Removing a teammate from an in-progress team](#8-removing-a-teammate-from-an-in-progress-team)
  - [Submitting all queued signups](#9-submitting-all-queued-signups)
  - [Unregistering from an existing record](#10-unregistering-from-an-existing-record)
  - [Viewing existing registrations and their statuses](#11-viewing-existing-registrations-and-their-statuses)
  - [Registration limit reached](#12-registration-limit-reached)
  - [Registration closed or competition not open](#13-registration-closed-or-competition-not-open)
  - [Waitlisting](#14-waitlisting)
  - [Duplicate prevention](#15-duplicate-prevention)
- [User Intent: Registering Non-Platform Users](#user-intent-registering-non-platform-users)
  - [Why UserIntent exists](#why-userintent-exists)
  - [The UserIntent model](#the-userintent-model)
  - [Claiming participations on first login](#claiming-participations-on-first-login)
- [File Reference](#file-reference)
- [Edge Cases](#edge-cases)

---

## Overview

The inscription workflow allows authenticated users to register themselves and others for categories within a competition. A competition is divided into **categories** (e.g. Individual, Pairs, Team, Junior), each with its own party size, time window, and capacity. Users can register for multiple categories in a single session, building up a batch of "queued signups" before submitting them all at once.

The workflow supports three kinds of participants in a single record (registration entry):

1. **The current user** — the person performing the registration.
2. **Other platform users** — found via real-time search.
3. **Non-platform participants** — people who don't have an account yet, represented by a `UserIntent` placeholder.

---

## Key Concepts

| Term | Definition |
|------|-----------|
| **Category** | A competition subdivision with its own type (Individual, Pairs, Team, etc.), time window, max party size, and max number of confirmed entries. |
| **Record** | A single registration entry linking participants to a category. Has a status (PENDING_CONFIRMATION, CONFIRMED, WAITLISTED) and tracks who created it. |
| **UserIntent** | A placeholder for a non-platform participant. Stores a name and can later be claimed by a real user when they create an account. |
| **Slot** | A client-side concept representing an in-progress signup being assembled before submission. Each slot tracks its users, new UserIntent names, and existing UserIntent references. |
| **Party** | The group of participants in a single Record. For Individual categories the party size is 1; for Pairs it's 2; for Team it varies. |
| **Creator** | The user who initiated a Record. The creator may or may not be a participant in the party itself. |

---

## Architecture

The inscription feature spans the following layers:

| Layer | File | Purpose |
|-------|------|---------|
| Page UI | [src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.svelte](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.svelte) | User-facing inscription interface |
| Page server | [src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.server.ts](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.server.ts) | Loads competition data and handles `signup` / `unregister` form actions |
| Business logic | [src/lib/database/db_inscription_utils.ts](../../../src/lib/database/db_inscription_utils.ts) | Core functions: `signUpUsersToCompetition`, `removeRecordById`, waitlisting logic, validations |
| Category helpers | [src/lib/utils/category_utils.ts](../../../src/lib/utils/category_utils.ts) | `getMaxRecordsPerCategory(type)`, `getCategoryTypeName()`, `getCategoryTypeIcon()` |
| User search API | [src/routes/(internal)/api/users/search/+server.ts](../../../src/routes/(internal)/api/users/search/+server.ts) | `GET /api/users/search?q=` — searches platform users by name/email |
| UserIntent search API | [src/routes/(internal)/api/user-intents/+server.ts](../../../src/routes/(internal)/api/user-intents/+server.ts) | `GET /api/user-intents?q=` — searches current user's own unclaimed UserIntents |
| UserIntent claim API | [src/routes/(internal)/api/user-intents/claim/+server.ts](../../../src/routes/(internal)/api/user-intents/claim/+server.ts) | `POST /api/user-intents/claim` — claims intents and replaces them with real users on records |
| Claim page | [src/routes/(internal)/claim-participations/+page.svelte](../../../src/routes/(internal)/claim-participations/+page.svelte) | First-login flow for new users to claim existing participations |
| Claim page server | [src/routes/(internal)/claim-participations/+page.server.ts](../../../src/routes/(internal)/claim-participations/+page.server.ts) | Loads fuzzy-matched unclaimed intents for the new user |
| First-login redirect | [src/hooks.server.ts](../../../src/hooks.server.ts) | Middleware that redirects new accounts to the claim page if matching intents exist |
| Organizer inscription row | [src/lib/components/manage_inscriptions/InscriptionRow.svelte](../../../src/lib/components/manage_inscriptions/InscriptionRow.svelte) | Displays a single record with user avatars and UserIntent icons |
| Organizer inscription list | [src/lib/components/manage_inscriptions/InscriptionList.svelte](../../../src/lib/components/manage_inscriptions/InscriptionList.svelte) | Groups records by status with search/filter; used in organizer views |
| Competition card | [src/lib/components/competition/CompetitionCard.svelte](../../../src/lib/components/competition/CompetitionCard.svelte) | Shows per-category registration status chips (including UserIntent indicators) on competition listings |

---

## Design Decisions

### 1. Batch submission over immediate save

Signups are **queued client-side** and submitted together in a single form POST, rather than saving each signup individually. This was chosen because:

- Users often register for multiple categories at once.
- A single atomic transaction on the server ensures all-or-nothing consistency.
- It reduces API calls and allows the user to review everything before confirming.

### 2. Slot-based team builder

Each in-progress registration is represented as a **slot** (`PendingSignup`) with its own `slotId`. Slots are keyed per category in a `Map<categoryId, PendingSignup[]>`. This allows:

- Multiple concurrent team-building processes within the same category.
- Independent search state per slot (so searching for a teammate in one slot doesn't interfere with another).
- Easy add/remove of individual slots before submission.

### 3. The current user is auto-added to group slots

When starting a group signup, the current user is automatically added to the party unless they are already registered in that category (via an existing Record or another queued slot). This decision optimises for the most common case — the user registering a team they belong to — while still supporting the less common case of registering a team you're not part of.

### 4. Per-category registration limits

Each category type has a maximum number of records a single user can **create** (not just participate in). The limits are defined in [`getMaxRecordsPerCategory()`](../../../src/lib/utils/category_utils.ts).

The count includes both existing Records (created by the user) and queued slots. Once the limit is reached, the "Sign up" button is replaced with an informational message.

### 5. Creator vs participant distinction

A Record has a **creator** (`creatorId`) and a set of **participants** (`users` relation). The creator is the person who initiated the registration. In most cases the creator is also a participant, but this is not required — a user can register a team they are not part of (by setting `registeredBySelf: false` in the payload). This distinction matters for:

- Determining who can **unregister** a Record (both creator and participants can).
- Counting per-category limits (only Records where the user is the creator count toward their limit).
- Displaying "Created by you" labels when the current user is the creator but not a participant.

### 6. UserIntent as a separate model (not a dummy User)

Non-platform participants are tracked via the `UserIntent` model rather than creating stub User records. See [User Intent: Registering Non-Platform Users](#user-intent-registering-non-platform-users) below for the full rationale.

### 7. Search as a dropdown, not a separate page

The teammate search is embedded directly in the slot's team builder as an inline input with a dropdown overlay. The dropdown shows:

1. **Platform users** matching the query (with an "already inscribed" indicator if applicable).
2. A **"Previously registered"** section showing the current user's own unclaimed UserIntents matching the query.
3. An **"Add as non-registered participant"** option at the bottom when the query is at least 2 characters.

This layered dropdown was chosen to keep the flow fast and contextual — the user never leaves the inscription page.

### 8. Waitlisting is automatic and server-side

When a category has reached its `maxParties` of ACCEPTED records, new signups are created with status `WAITLISTED` instead of `PENDING_CONFIRMATION`. The user is notified via the in-app notification system. This decision was made because waitlisting should be deterministic and not depend on client-side state.

---

## Data Model

### CategorySignup (client → server payload)

Defined in [src/lib/database/db_inscription_utils.ts](../../../src/lib/database/db_inscription_utils.ts):

```typescript
interface CategorySignup {
    categoryId: number;
    teammateIds: string[];         // IDs of existing platform users
    userIntentNames?: string[];    // names for new UserIntents to create
    userIntentIds?: string[];      // IDs of existing unclaimed UserIntents to reuse
    registeredBySelf?: boolean;    // default true; false when the current user is not in the party
}
```

### Record (database)

Defined in [prisma/schema.prisma](../../../prisma/schema.prisma):

- `status`: `PENDING` | `ACCEPTED` | `WAITLISTED`
- `users`: many-to-many with `User` (actual platform participants)
- `userIntents`: many-to-many with `UserIntent` (non-platform participant placeholders)
- `creatorId`: the user who created this Record

### UserIntent (database)

Defined in [prisma/schema.prisma](../../../prisma/schema.prisma):

- `name`: the participant's display name as typed by the registering user
- `createdById`: who registered this placeholder
- `claimedById`: set when a real user claims this intent (nullable)
- `records`: the Records this intent is connected to

---

## Inscription Page Workflows

> All workflows below take place on the [inscription page](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.svelte). Each section describes a distinct user interaction path and can be used as a **test scenario**.

### 1. Viewing a category

**Precondition:** User navigates to `/competitions/competition_details/{id}/inscription`.

**What the user sees for each category:**
- Category type name and icon (via `CategoryCardTitle`).
- Party size badge (e.g. "1 participant" or "2 participants").
- Start and end time.
- Puzzle details (pieces count and brand) if the category has puzzles.
- A registration count badge showing `{created + queued}/{max}` when there are existing or queued registrations.
- A list of existing Records with status badges (ACCEPTED, PENDING, WAITLISTED).
- Queued slots (dashed border) and in-progress team builders (amber border).
- An action button ("Sign up", "Add another", "Build team", etc.) — or a "limit reached" message, or "registration not available" if registration is closed.

### 2. Individual category — sign up yourself

**Precondition:** Category has `maxPartySize = 1`. Current user is **not** already inscribed in this category. Registration is open. Limit not reached.

**Steps:**
1. User clicks the **"Sign up"** button.
2. A completed slot is immediately created with the current user as the sole participant. No team builder is shown because the party is already full.
3. The slot appears with a dashed primary border, showing the user's avatar and name with "(You)".
4. The submit bar appears at the bottom of the page showing the total count of new signups.
5. User can remove the slot by clicking the ✕ button on the queued slot before submitting.

### 3. Individual category — sign up someone else

**Precondition:** Category has `maxPartySize = 1`. Current user **is already inscribed** in this category (or has a queued slot). Registration is open. Limit not reached.

**Steps:**
1. User clicks the **"Add another"** button.
2. An empty team builder slot opens (amber border) with a search input. The current user is **not** auto-added because they are already in the category.
3. User types a name in the search field (minimum 2 characters). After a 300ms debounce:
   - The dropdown appears **above** the input, showing matching platform users, previously registered UserIntents, and an "Add as non-registered participant" option.
4. User selects a platform user → the slot is immediately complete (party size = 1).
5. Alternatively, user clicks "Add as non-registered participant" → a new UserIntent name is added, and the slot is complete.
6. The completed slot transitions from the amber team builder to the dashed primary queued display.

### 4. Group category — build a team

**Precondition:** Category has `maxPartySize > 1` (e.g. Pairs = 2, Team = 3+). Registration is open. Limit not reached.

**Steps:**
1. User clicks the **"Build team"** (or **"Build another team"**) button.
2. A team builder slot opens (amber border). If the current user is not already in the category, they are automatically added as the first participant.
3. The slot shows:
   - A progress indicator: `"Team progress: {current}/{max}"`.
   - Each participant with their avatar and a remove button (the current user cannot be removed from the slot if they were auto-added).
   - A search input to find teammates (only visible when the party is not yet full).
4. User searches for teammates and adds them one by one (see [search dropdown behaviour](#7-search-as-a-dropdown-not-a-separate-page)).
5. Once the party reaches the `maxPartySize`, the slot transitions from the amber team builder to the dashed primary queued display.
6. User may add a mix of platform users, new UserIntent names, and existing UserIntents to fill the party.

### 5. Adding a non-platform participant (UserIntent)

**Precondition:** A team builder slot is open and the party is not full.

**Steps:**
1. User types a name in the search field (at least 2 characters).
2. At the bottom of the search dropdown, the option **"Add as non-registered participant"** appears, showing the typed name.
3. User clicks this option.
4. The name is added to the slot's `intentNames` list and displayed with an amber `mdi:account-question` icon (visually distinct from platform users who show an avatar).
5. The search field is cleared.
6. If this fills the party, the slot transitions to the queued state.

### 6. Reusing a previously registered UserIntent

**Precondition:** A team builder slot is open. The current user has previously created unclaimed UserIntents whose name matches the search query.

**Steps:**
1. User types a name in the search field.
2. Below the platform user results, a **"Previously registered"** section header appears.
3. The section lists matching unclaimed UserIntents the current user previously created (most recent first, max 5), each with the amber question-mark icon.
4. User clicks one of these entries.
5. The existing UserIntent is added to the slot's `existingIntents` list (the intent will be **connected** to the new Record on submission, not duplicated).
6. The search field is cleared.

### 7. Removing a queued signup before submission

**Precondition:** At least one completed slot exists for a category.

**Steps:**
1. User clicks the ✕ button on the queued slot (dashed border).
2. The slot is removed with a slide-out animation.
3. The registration count badge updates. If no queued slots remain across any category, the submit bar disappears.

### 8. Removing a teammate from an in-progress team

**Precondition:** A team builder slot is open with at least one added teammate (other than the current user).

**Steps:**
1. User clicks the red remove button next to a teammate.
2. The teammate is removed from the slot. The progress counter updates.
3. The search input reappears (if the party was previously full).
4. Removing a UserIntent name or an existing UserIntent works the same way.
5. The current user **cannot** be removed from the slot (no remove button is shown for them).

### 9. Submitting all queued signups

**Precondition:** At least one queued slot exists and all slots are complete (party sizes are met).

**Steps:**
1. The sticky submit bar at the bottom of the page shows:
   - Total count of new registrations.
   - A breakdown by category type (e.g. "2× Individual, 1× Pairs").
   - The **"Submit all registrations"** button, enabled only when all parties are complete.
2. User clicks the submit button.
3. A loading overlay appears with a spinner message.
4. The client sends a `POST` to the `?/signup` form action with a JSON payload containing all `CategorySignup` objects.
5. The server processes all signups in a single database transaction via `signUpUsersToCompetition()`.
6. **On success:**
   - A green success message banner appears with a 5-second auto-dismiss timer and progress bar.
   - All client-side signup state is cleared.
   - The page data is revalidated (`invalidateAll`) so existing Records reflect the new registrations.
   - If any signup was auto-waitlisted, the participants receive an `INSCRIPTION_WAITLISTED` notification.
7. **On failure:**
   - A red error message banner appears with the server error message.
   - The queued slots are preserved so the user can fix the issue and retry.

### 10. Unregistering from an existing record

**Precondition:** The user has at least one existing Record (PENDING, ACCEPTED, or WAITLISTED) and registration is still open.

**Steps:**
1. Each existing Record row shows a red ✕ button on the right.
2. User clicks the ✕ button.
3. A `POST` to the `?/unregister` form action is sent with the `record_id`.
4. The server calls `removeRecordById()`, which verifies the user is the creator or a participant.
5. On success, the page revalidates and the Record disappears from the list.

### 11. Viewing existing registrations and their statuses

**Precondition:** The user has previously registered for categories in this competition.

**What the user sees for each existing Record:**
- A **status icon and badge**: green check for ACCEPTED, amber clock for PENDING, purple clock-alert for WAITLISTED.
- **Participant badges**: each platform user is shown with their avatar; each UserIntent is shown with an amber question-mark icon and the name.
- A **"Created by you"** label if the current user is the creator but not a participant.
- The Record row's border and background colour match the status (green/amber/purple tints).

### 12. Registration limit reached

**Precondition:** The user has created the maximum number of Records for a category type (e.g. 4 for Individual).

**What happens:**
- The "Sign up" / "Add another" / "Build team" button is replaced by an italic message: *"Limit reached"* with an info icon.
- The registration count badge shows `{max}/{max}` with a neutral filled style.

### 13. Registration closed or competition not open

**Precondition:** Either `competition.registrationOpen` is `false` or `competition.status` is not `NOT_STARTED`.

**What happens:**
- A warning banner appears at the top of the page below the title, showing either "Registration is closed" or "Competition is not open for registration".
- No action buttons are shown for any category.
- Existing Records are still displayed (read-only) but the unregister buttons are hidden.
- If the user has no registrations at all, each category shows "Registration not available".

### 14. Waitlisting

**Precondition:** A category has reached its `maxParties` of ACCEPTED records.

**What happens:**
- New signups for this category are created with status `WAITLISTED` instead of `PENDING`.
- The server determines this automatically by counting ACCEPTED records in the category.
- All participants in a waitlisted record receive an `INSCRIPTION_WAITLISTED` notification.
- The Record appears in the existing records list with a purple waitlisted badge.

### 15. Duplicate prevention

The inscription page prevents duplicate registrations at multiple levels:

- **Client-side:** `isUserAlreadyInCategory()` checks both existing Records (via `inscribedUserIds` loaded from the server) and queued slots. Users already inscribed appear greyed out in the search dropdown with an "already inscribed" label.
- **Server-side:** `signUpUsersToCompetition()` validates that no teammate is already inscribed in the target category before creating the Record.
- **Cross-slot:** When building multiple teams for the same category, a user in one slot is shown as unavailable in other slots' search results.

---

## User Intent: Registering Non-Platform Users

### Why UserIntent exists

In speed puzzling competitions, one person often registers an entire team. Not all team members may have platform accounts. Without UserIntent, this created friction:

- Team members had to create accounts before registration.
- Organisers couldn't see non-registered participants.
- Records remained incomplete until everyone signed up.

### The UserIntent model

Rather than creating dummy User records (which would pollute the User table and conflict with authentication/email-uniqueness constraints), a separate `UserIntent` model was introduced as a lightweight placeholder:

- **`name`**: The display name typed by the registering user.
- **`createdById`**: The user who created this intent.
- **`claimedById`**: Set when the actual person creates an account and claims it (nullable).
- **`records`**: The Records this intent is attached to (many-to-many).

A Record's party size validation counts **both** `users` and `userIntents`. This means a Pairs category (party size = 2) can have 1 User + 1 UserIntent, or 2 Users, etc.

### Key design decisions for UserIntent

1. **Separate model, not a dummy User** — keeps the User table clean and avoids authentication issues.
2. **Records store both Users and UserIntents** — the `Record` model has both `users` and `userIntents` relations. Party size counts both.
3. **Claim is opt-in, not automatic** — when a new user logs in, matching is done by case-insensitive substring similarity on name. The user is presented with candidates and chooses which to claim. Auto-claim was rejected to avoid false matches.
4. **Claiming replaces the intent with the real user** — when a UserIntent is claimed, the claiming user is connected to all associated Records and the UserIntent is **disconnected** from those Records. Only the real User remains on each record.
5. **Reuse across competitions** — when searching for teammates, the dropdown shows the current user's own unclaimed UserIntents under a "Previously registered" section. Selecting one **connects** the existing intent to the new Record rather than creating a duplicate.
6. **Visual differentiation** — UserIntents are displayed with an amber `mdi:account-question` icon throughout the UI (inscription page, organiser views, CompetitionCard category chips) to clearly distinguish them from real users.

### Claiming participations on first login

Implemented in [src/hooks.server.ts](../../../src/hooks.server.ts) and the [claim-participations page](../../../src/routes/(internal)/claim-participations/+page.svelte):

1. The middleware detects accounts created within the last 5 minutes.
2. It performs a fuzzy name match against unclaimed UserIntents (intent name contains user name, or vice versa, case-insensitive).
3. If matches exist, the user is redirected to `/claim-participations`.
4. The claim page shows all matching intents with details (who registered them, for which competition/category).
5. The user selects intents via checkboxes and clicks "Claim selected".
6. The [claim API](../../../src/routes/(internal)/api/user-intents/claim/+server.ts) atomically: sets `claimedById`, connects the user to the Records, disconnects the UserIntent from the Records, and sends a `USER_INTENT_CLAIMED` notification to the original creator.
7. If no matches exist, navigation continues normally.

### UserIntent in the CompetitionCard

The [CompetitionCard](../../../src/lib/components/competition/CompetitionCard.svelte) component shows per-category registration status chips. When a user has registrations that include UserIntents, these are reflected in the chip styling so the user can see at a glance which categories have pending placeholder participants.

---

## File Reference

| File | Role |
|------|------|
| [prisma/schema.prisma](../../../prisma/schema.prisma) | `Record`, `UserIntent`, `Category`, `InscriptionStatus` definitions |
| [src/lib/database/db_inscription_utils.ts](../../../src/lib/database/db_inscription_utils.ts) | `signUpUsersToCompetition()`, `removeRecordById()`, `getInscribedUserIdsByCategory()`, waitlisting logic |
| [src/lib/utils/category_utils.ts](../../../src/lib/utils/category_utils.ts) | `getMaxRecordsPerCategory()`, `getCategoryTypeName()`, `getCategoryTypeIcon()` |
| [src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.svelte](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.svelte) | Inscription UI — all interactions described in this document |
| [src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.server.ts](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/inscription/+page.server.ts) | `signup` and `unregister` form actions |
| [src/routes/(internal)/api/users/search/+server.ts](../../../src/routes/(internal)/api/users/search/+server.ts) | `GET /api/users/search?q=` — user search endpoint |
| [src/routes/(internal)/api/user-intents/+server.ts](../../../src/routes/(internal)/api/user-intents/+server.ts) | `GET /api/user-intents?q=` — unclaimed UserIntent search |
| [src/routes/(internal)/api/user-intents/claim/+server.ts](../../../src/routes/(internal)/api/user-intents/claim/+server.ts) | `POST /api/user-intents/claim` — claim endpoint |
| [src/routes/(internal)/claim-participations/+page.svelte](../../../src/routes/(internal)/claim-participations/+page.svelte) | Claim participations UI |
| [src/routes/(internal)/claim-participations/+page.server.ts](../../../src/routes/(internal)/claim-participations/+page.server.ts) | Claim page server load |
| [src/hooks.server.ts](../../../src/hooks.server.ts) | First-login redirect to claim page |
| [src/lib/components/manage_inscriptions/InscriptionRow.svelte](../../../src/lib/components/manage_inscriptions/InscriptionRow.svelte) | Organiser view: single record row with UserIntent display |
| [src/lib/components/manage_inscriptions/InscriptionList.svelte](../../../src/lib/components/manage_inscriptions/InscriptionList.svelte) | Organiser view: grouped records list with search filter |
| [src/lib/components/competition/CompetitionCard.svelte](../../../src/lib/components/competition/CompetitionCard.svelte) | Competition card with per-category registration status |

---

## Edge Cases

- **Name collisions on UserIntents**: Two different people may be registered with the same name. Each UserIntent is a separate entry and can be claimed independently.
- **User claims the wrong intent**: The claim page is opt-in via checkboxes — users can skip intents they don't recognise. There is no auto-claim.
- **Multiple records per intent**: A single UserIntent can be connected to multiple Records (same person registered for multiple categories). Claiming links the user to all of them.
- **Creator deletes their account**: UserIntents created by that user are cascade-deleted (`onDelete: Cascade`).
- **Claimed user deletes their account**: The `claimedById` is set to null (`onDelete: SetNull`), preserving the intent record.
- **All-or-nothing submission**: If any signup in the batch fails validation, the entire transaction is rolled back. No partial registrations are created.
- **Concurrent registration race**: The waitlisting check happens inside the database transaction, so two users registering simultaneously for the last slot will not both get ACCEPTED status.
- **Search returns already-inscribed users**: These appear greyed out with an "already inscribed" label and are not clickable.
- **Removing the only queued slot**: The submit bar disappears and the category returns to its initial state with the action button visible.
