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
A fixed, predefined tag type (the `ParticipantTagType` enum in `schema.prisma`: `LOCAL_MUNICIPALITY`, `JUVENILE`) that marks an **entry** as eligible for a sub-prize within a category. Organizers do **not** create tags; the tag set is the enum. A tag is an **entry-level qualification**: it is claimed for the whole entry, not for individual participants, and the organizer judges whether the entry qualifies (age, locality, etc. are not computed). A tag becomes claimable in a category only when the organizer adds a Tag Category for it. An entry may hold at most one tag.
_Avoid_: label, badge, group

**Entry Tag**:
A record linking a Participant Tag to a specific entry. Created either by the registrant (claimed during registration) or directly by the organizer (assigned as CONFIRMED). Has a lifecycle: PENDING → CONFIRMED or REJECTED. There is at most one Entry Tag per entry (one mutable claim slot), preserved independently of the registration lifecycle — a waitlisted entry's claim carries through if it is later confirmed/promoted.
_Avoid_: tag assignment, tag claim, tag membership

**Tag Category**:
The link that makes a Participant Tag claimable in a given Category, carrying an optional flat `priceOverride`. This is the **organizer's entry point** for tags: adding a Tag Category row (in the competition edit form) is what makes a tag claimable at registration. A tag is available in a category **if and only if** a Tag Category row exists. When an entry has a PENDING or CONFIRMED Entry Tag whose Tag Category carries a price override, that price is shown instead of the general category price. If the tag is later rejected, the general price applies and any payment difference is handled off-platform.
_Avoid_: tag category price, discounted price, local price, tag discount

### Processes & status

**Role Request**:
A user's request to be granted the Organizer or Judge role. Reviewed and approved or rejected by an Admin.
_Avoid_: Request, permission request, application

**Notification**:
A read-only informational alert delivered to a user's inbox. Covers registration updates, competition lifecycle events, role request outcomes, and more. No user action required.

**Notification Intent**:
A plain, side-effect-free description of one Notification to be delivered to one or more users — recipients, type, translation keys, link, and data. Builders produce intents; they do not write to the database or send email. The unit of currency handed to the Notification Dispatcher.
_Avoid_: notification payload, notification request, notify call

**Notification Dispatcher**:
The single seam that takes Notification Intents and realises them: persists the `Notification` rows and routes email through a downstream channel adapter. The one place that owns notification side-effect orchestration, failure handling, and which types also email.
_Avoid_: notification service, notification manager, notifier

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
- **Participant Tags** are a fixed enum (`ParticipantTagType`), not per-competition records
- A **Tag Category** makes a Participant Tag claimable in a **Category** (with an optional price override); availability = the row exists
- An **Entry** has at most one **Entry Tag** (the claimed tag enum value, with PENDING/CONFIRMED/REJECTED status)

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
- **Prize cascade / multiple tags** — an entry currently holds at most one tag, so sub-prize rankings never overlap. Allowing an entry to hold multiple tags (and the resulting cascade when one entry tops several sub-prize rankings) is a deferred future extension.
