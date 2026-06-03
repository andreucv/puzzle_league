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
A platform user who creates and manages their own competitions. Global role grants the ability to create competitions. Competition management authority comes from being the creator, a global Admin, or having a scoped co-organizer assignment (`CompetitionCoorganizerRoleAssignment`).
_Avoid_: Host, creator, manager

**Judge**:
A platform user assigned to specific categories to help entry finish times. Assigned per-category via `CategoryJudgeAssignment`, not per-competition.
_Avoid_: Referee, timer, official

**Admin**:
A platform user with full system access. Can modify anything across all competitions.

**External Participant**:
A person participating in an entry who does not have a platform account (e.g., a minor). Created by a platform user on their behalf. May later claim their participation by creating an account.
_Avoid_: UserIntent, placeholder, proxy, guest

**Participant Tag**:
A label defined by the organizer at the competition level (e.g. "Local participant") that marks a subset of participants as eligible for a sub-prize within a category. A tag has an eligibility rule (ALL or ANY) that governs how multi-person entries qualify: ALL requires every participant in the entry to hold the tag; ANY requires at least one. Tags are scoped to the whole competition — a participant tagged as "Local" is local for all categories they enter.
_Avoid_: label, badge, group

**Tag Assignment**:
A record linking a Participant Tag to a specific platform user within a competition. Created either by the participant (self-declaration during registration) or directly by the organizer. Has a lifecycle: PENDING → CONFIRMED or REJECTED. Preserved independently of the entry lifecycle — a waitlisted participant's tag declaration carries through if they are later confirmed.
_Avoid_: tag claim, tag request, tag membership

**Tag Category Price**:
An optional flat price override set by the organizer on a per-tag per-category basis. When a participant has a PENDING or CONFIRMED Tag Assignment for a tag that carries a price override in a given category, that price is shown instead of the general category price. If the tag is later rejected, the general price applies and any payment difference is handled off-platform.
_Avoid_: discounted price, local price, tag discount

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
- A **Competition** optionally has one or more **Participant Tags** (competition-scoped)
- A **Participant Tag** has zero or more **Tag Assignments** (one per user per tag)
- A **Participant Tag** optionally has one **Tag Category Price** per **Category** in its competition

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
- **Prize cascade with multiple tags** — when `tagsAreMutuallyExclusive` is false on a competition, a participant with multiple confirmed tags could rank #1 in several sub-prize rankings simultaneously. The resolution (e.g. bump the prize to the next eligible ranked participant) is deferred to a future session.
