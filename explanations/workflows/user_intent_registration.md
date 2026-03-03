# User Intent — Registering Non-Platform Users

## Overview

This document describes the "User Intent" feature that allows registered users to inscribe non-platform participants in competitions, and the journey for those participants to later claim their participations when they create an account.

## Problem Statement

In speed puzzling competitions, it is common for one person to register an entire team. However, not all team members may already have accounts on the platform. Previously, the system required all participants to have existing accounts before they could be added to a record (inscription).

This created friction:
- Users had to ask teammates to create accounts before registration.
- Organizers could not see non-registered participants until they created accounts.
- If a team member never signed up, the record would remain incomplete.

## Solution: User Intent

A **UserIntent** is a lightweight record that holds:
- A **name** string — the name typed by the registering user.
- A **createdBy** reference — the user who registered the non-platform participant.
- A **claimedBy** reference (nullable) — set when the actual person creates an account and claims the intent.
- A **records** relation — the inscription records this intent is attached to.

### Key Design Decisions

1. **UserIntent is separate from User**: We do not create a "dummy" User record. This keeps the User table clean and avoids issues with authentication, email uniqueness, etc. Instead, the intent is a placeholder that can be claimed later.

2. **Records store both Users and UserIntents**: A Record (inscription) has a `users` relation (for real accounts) and a `userIntents` relation (for non-registered participants). The party size validation counts both.

3. **Claim is opt-in, not automatic**: When a new user logs in, we match by name similarity (case-insensitive substring matching). We present candidates and let the user choose which intents to claim. We never auto-claim to avoid false matches.

4. **Claiming links the user to existing records**: When a UserIntent is claimed, the claiming user is connected to all records associated with that intent. This means past competition participations are retroactively linked.

5. **Notifications are sent**: When a UserIntent is claimed, the user who originally created the intent receives a notification informing them that the participant has been linked.

## Data Model Changes

### New model: `UserIntent`

```prisma
model UserIntent {
  id          String    @id @default(cuid())
  name        String
  createdAt   DateTime  @default(now())
  createdById String
  createdBy   User      @relation("UserIntentCreator", fields: [createdById], references: [id], onDelete: Cascade)
  claimedById String?
  claimedBy   User?     @relation("UserIntentClaimer", fields: [claimedById], references: [id], onDelete: SetNull)
  records     Record[]  @relation("RecordUserIntents")

  @@map("user_intent")
}
```

### Updated model: `Record`

Added `userIntents` relation:
```prisma
model Record {
  ...
  userIntents  UserIntent[]  @relation("RecordUserIntents")
  ...
}
```

### Updated type: `CategorySignup`

```typescript
interface CategorySignup {
    categoryId: number;
    teammateIds: string[];
    userIntentNames?: string[];  // new non-registered participants to create
    userIntentIds?: string[];    // existing unclaimed UserIntents to reuse
    registeredBySelf?: boolean;  // false when currentUser is not a party member
}
```

### Updated enum: `NotificationType`

Added `USER_INTENT_CLAIMED` value for the notification sent when a user claims an intent.

## User Journey

### Flow 1: Registering a non-platform participant

1. User A goes to the inscription page for a competition.
2. For any category (individual or group), User A can register participants other than themselves.
3. User A searches for a teammate. The search returns:
   - Existing platform users
   - A **"Previously registered"** section at the bottom for User A's own unclaimed UserIntents matching the query
   - An **"Add as non-registered participant"** option at the very bottom when the typed name has at least 2 characters
4. If User A types a name matching a past UserIntent they created, they can select it directly — reusing the same intent and linking the new record to it.
5. If no match, User A clicks "Add as non-registered participant" to create a new UserIntent with that name.
6. For individual categories, User A can remove themselves from the party and add someone else instead.
7. The name(s) appear in the party list with an amber indicator (no label text, just visual differentiation).
8. User A submits the registration. The server creates the Record with connected Users, new UserIntents (created), and existing UserIntents (connected via `userIntentIds`).

### Flow 2: New user claims existing participations (first login)

1. A new user creates an account on the platform with a name that matches one or more existing unclaimed UserIntents.
2. On their first page load after registration, the hooks.server.ts middleware detects the new account (created within the last 5 minutes) and checks for matching unclaimed intents.
3. If matches exist, the user is redirected to `/claim-participations`.
4. The claim page displays all matching UserIntents with details: who registered them and for which competition/category.
5. The user can select individual intents (with checkboxes) and click "Claim selected".
6. The claim endpoint:
   - Sets `claimedById` on each selected UserIntent.
   - Connects the user to all associated Records.
   - **Disconnects the UserIntent from those Records** (the intent is replaced by the real User — only the User remains on each record).
   - Sends a `USER_INTENT_CLAIMED` notification to the original creator.
7. The user is redirected to the home page.

### Flow 3: No matches on first login

1. A new user creates an account.
2. The middleware checks for matching intents — none found.
3. Normal navigation continues (no redirect).

## File Changes Summary

| File | Change |
|------|--------|
| `prisma/schema.prisma` | Added `UserIntent` model, `userIntents` relation on `Record` and `User`, `USER_INTENT_CLAIMED` enum value |
| `src/lib/database/db_inscription_utils.ts` | Updated `CategorySignup` type (`userIntentIds`, `registeredBySelf`), `signUpUsersToCompetition` to handle UserIntent reuse and self-less registration |
| `src/routes/(internal)/competitions/.../inscription/+page.svelte` | Added UI for adding non-registered participants, showing UserIntents in team display without label text; individual category support; "Previously registered" section in dropdown |
| `src/hooks.server.ts` | Added first-login redirect logic for claim page |
| `src/routes/(internal)/claim-participations/+page.server.ts` | New: server load for claim page |
| `src/routes/(internal)/claim-participations/+page.svelte` | New: claim participations UI page |
| `src/routes/(internal)/api/user-intents/unclaimed/+server.ts` | API to fetch unclaimed matching intents (for claim page) |
| `src/routes/(internal)/api/user-intents/+server.ts` | New: API to search current user's unclaimed intents by name (for inscription dropdown reuse) |
| `src/routes/(internal)/api/user-intents/claim/+server.ts` | Claim API: disconnects UserIntent from records after connecting the User |
| `src/lib/components/manage_inscriptions/InscriptionRow.svelte` | Show UserIntents alongside Users in organizer view |
| `src/lib/components/manage_inscriptions/InscriptionList.svelte` | Filter includes UserIntent names |
| `src/routes/(internal)/notifications/+page.svelte` | Added icon/color for `USER_INTENT_CLAIMED` |
| `src/lib/translations/*/common.json` | Added translation keys for claim page, inscription intents, and `previously_registered` |
| `scripts/db_migration/seed_data.json` | Added `userIntents` seed data |
| `scripts/db_migration/action_seed.ts` | Updated to create UserIntents |

## Edge Cases

- **Name collisions**: Two different unclaimed UserIntents could have the same name. Each is a separate entry and can be claimed independently.
- **User claims wrong intent**: The user can skip intents they don't recognize. If a mistaken claim occurs, an admin would need to manually unclaim it (future: add an "unclaim" feature).
- **Multiple records per intent**: An intent can be connected to multiple records if the same person was registered for multiple categories. Claiming links the user to all.
- **Creator deletes account**: If the user who created an intent deletes their account, the intent is cascade-deleted (per `onDelete: Cascade`).
- **Claimed user deletes account**: The `claimedById` is set to null (per `onDelete: SetNull`), preserving the intent record.
