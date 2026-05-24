# Puzzle League

A platform for organizing and participating in speed puzzling competitions, where participants race to complete jigsaw puzzles and results are tracked in real time.

## Domain Specific Language

### Core entities

**Competition**:
A scheduled speed puzzling gathering at a physical location, containing one or more categories.

**Category**:
A specific puzzle round within a competition, defined by its format (Individual, Pairs, Team, etc.), scheduled time, and maximum participants. Has its own lifecycle: NOT_STARTED → LIVE → STOPPED → COMPLETE (or CANCELED).

**Entry**:
A participant's slot in a category, tracking their registration status and eventually their finish time. In multi-person formats (Pairs, Team), an entry has multiple participants.
_Avoid_: Record

**Registration**:
The act of signing up for one or more categories in a competition. Creates an entry per category.
_Avoid_: Inscription

**League**:
A competitive series of competitions where results accumulate into overall standings.
_Avoid_: Season, circuit, group

**Puzzle**:
A puzzle product type (brand, piece count, serial number) that organizers assign to categories. The same puzzle type can be used across multiple categories.
_Avoid_: Box, item

### People & roles

**Participant**:
A platform user who registers for and competes in categories. The default role for all users.
_Avoid_: Player, competitor, puzzler

**Organizer**:
A platform user who creates and manages their own competitions. Global role, but scoped to competitions they created.
_Avoid_: Host, creator, manager

**Judge**:
A platform user assigned to specific categories to help record finish times. Assigned per-category, not per-competition.
_Avoid_: Referee, timer, official

**Admin**:
A platform user with full system access. Can modify anything across all competitions.

**External Participant**:
A person participating in an entry who does not have a platform account (e.g., a minor). Created by a platform user on their behalf. May later claim their participation by creating an account.
_Avoid_: UserIntent, placeholder, proxy, guest

### Processes & status

**Role Request**:
A user's request to be granted the Organizer or Judge role. Reviewed and approved or rejected by an Admin.
_Avoid_: Request, permission request, application

**Notification**:
A read-only informational alert delivered to a user's inbox. Covers registration updates, competition lifecycle events, role request outcomes, and more. No user action required.

**Other Upcoming Competitions**:
The authenticated landing page discovery section for competitions where the current Participant has no Registration. Includes future competitions and live competitions, ordered by soonest start date.

**Finish time**:
A wall-clock timestamp recorded when a judge or organizer taps a button as a participant completes their puzzle. Immutable once recorded.

**Piece count**:
The number of pieces completed by an entry when the category time expires without finishing the puzzle. Used for ranking partial completions.

## Relationships

- A **Competition** contains one or more **Categories**
- A **Category** belongs to exactly one **Competition**
- A **Category** has one or more **Entries** (via registration)
- An **Entry** belongs to exactly one **Category**
- An **Entry** has one or more **Participants** (platform users and/or External Participants)
- A **Competition** optionally belongs to a **League**
- A **League** contains one or more **Competitions**
- A **Category** is assigned one or more **Puzzles**
- A **Puzzle** can be assigned to multiple **Categories** (even within the same competition)
- A **Judge** is assigned to specific **Categories** (not to a competition as a whole)
- An **Organizer** manages only **Competitions** they created
- **Competition status** is auto-derived from its **Categories'** statuses
- **Registration** is controlled by an independent organizer toggle, allowing late registration for upcoming categories even mid-competition

## Entry ranking

1. **Finished** entries rank first, ordered by lowest finish time
2. **Partial** entries rank second, ordered by highest piece count
3. **DNF** entries (no time, no pieces) rank last

## Example dialogue

> **Dev:** "When a **Participant** registers for a **Category**, what status does their **Entry** get?"
> **Domain expert:** "It starts as PENDING_CONFIRMATION — the **Organizer** needs to confirm they received payment off-platform. Once confirmed, the entry becomes CONFIRMED."

> **Dev:** "What if the **Category** is already full?"
> **Domain expert:** "The **Entry** gets WAITLISTED automatically. Full means CONFIRMED + PENDING_CONFIRMATION entries equal the category's max participants."

> **Dev:** "Can a **Judge** record finish times for any category?"
> **Domain expert:** "No — a **Judge** is assigned to specific **Categories**, not to the whole **Competition**. They can only record times in their assigned categories."

> **Dev:** "What happens when a **Category** goes LIVE?"
> **Domain expert:** "Real-time updates start streaming via Ably. **Judges** and **Organizers** can record finish times. When time runs out, the category moves to STOPPED — the organizer reviews results and can either restart (back to LIVE) or mark it COMPLETE."

## Flagged ambiguities

- **League points calculation** — strategy for calculating points from category results is not yet defined. Deferred to a future session.
- **Payment processing** — currently off-platform only (organizer confirms receipt manually). In-app payments are planned for the future.
