# During Competition Worflow
During the competition, organizers need to manage the active categories and organizers and judges need to record results in real-time.

## Purpose
- There is the need of organizers and judges to record results in real-time during the competition, when a party finishes their attempt in the active category.

## Role(s) and Permissions
- Primary role(s): Organizer, Judge
- Secondary role(s) (if any): Participant
- Access control summary:
    - Organizers can start/stop categories, assign judges, and record results for any party.
    - Judges can only record results for parties of the category they are assigned to.
    - Participants can view their own results but cannot edit them.

## Scope
- In scope: key tasks and user actions
    - Starting and stopping categories
    - Assigning judges to categories
    - Recording results for parties in active categories
- Out of scope: explicitly list to avoid scope creep

## Success Criteria
- UX acceptance criteria (clear, testable statements)
    - Organizers can successfully start and stop categories with appropriate confirmations.
    - Judges can only see and record results for their assigned categories.
    - Participants can view their results in real-time without errors.

---

# UX Specification

## User Goals (Jobs-to-be-done)
- "As an Organizer, I want to start a category, so that participants can begin their attempts."
- "As a Judge, I want to record results for a party in a category in real-time."
- "As a Participant, I want to view my results as soon as they are recorded."

## Primary Use Cases / User Stories
- UC1: Organizer starts a category
  - Trigger: Organizer clicks "Start Category" button
  - Preconditions: Category is in "NOT_STARTED" status
  - Main flow (steps)
    - Organizer navigates to competition details page
    - Organizer navigates to the "During Competition" page
    - Organizer clicks "Start Category" button for a specific category
    - System updates category status to "ACTIVE" and records start time
  - Alternate flows
    - If the category is already active, show an error message
  - Postconditions
    - Category status is updated to "ACTIVE"
    - Start time is recorded

- UC2: Judge records results for a party
  - Trigger: A party finishes their attempt.
  - Preconditions: Category is "ACTIVE" and Judge is assigned to it
  - Main flow (steps)
    - Judge navigates to the "During Competition" page
    - Judge selects the active category they are assigned to
    - Judge searches for the party (by name of any participant in the party, table number or party ID)
    - Judge selects the party from the search results
    - Judge selects the finish button for the party
  - Alternate flows
    - If the party is not found, show an error message
    - If the category is not active, show an error message
  - Postconditions
    - Party's attempt is marked as finished with the current timestamp
    - Results are updated and visible to participants
  - Edge cases
    - If the party does not finish in time, the judge can mark how many pieces left and the system will record the attempt as finished with the max time (end time of the category - start time of the category) and the pieces left.

## Page Structure
- Header of the page is a TitleBackButton with the title being Compeition name and the back button going back to the competition details page.
- Sections/blocks (order and purpose)
  - Active Categories List
    - List of active categories with their details (type, subname, start time, elapsed time)
    - Actions: Stop category, Search records, Stop found record, Mark pieces left
  - Next upcoming categories (if any) (minimum information shown)
    - List of upcoming categories with their details (type, subname, scheduled start time)
    - Actions: Start category, button to go to manage judges page.
  - Complete categories (if any)
    - List of completed categories with their details (type, subname, start time, end time)
    - Actions: Button to go to results page for that category.

## Category Statuses and Transitions
Statuses of categories must be an enum in schema.prisma with the following values:
- NOT_STARTED: The category has not started yet. It can be started by an organizer.
- LIVE: The category is currently active. Participants can attempt the category and judges can record results. It can be stopped by an organizer.
- COMPLETE: The category has been completed. No further attempts or recordings can be made. Results can be viewed by participants and organizers.
- CANCELED: The category has been canceled. No attempts or recordings can be made. It can be set to this status by an organizer if needed.

### Transitions:
- NOT_STARTED -> LIVE: Triggered when an organizer starts the category.
- LIVE -> COMPLETE: Triggered when an organizer stops the category.
- NOT_STARTED -> CANCELED: Triggered when an organizer cancels the category.
- LIVE -> CANCELED: Triggered when an organizer cancels the category while it's active
- COMPLETE -> LIVE: a category can be restarted if it was completed by mistake, so it can transition back to LIVE or NOT_STARTED depending on the previous status.
- CANCELLED -> LIVE: a category can be restarted if it was cancelled by mistake, so it can transition back to LIVE or NOT_STARTED depending on the previous status.

## UX elements requirements for category statuses and transitions
1. When clicking a button that modifies status of a category, a confirmation dialog should appear to confirm the action. The dialog should clearly state the action being taken and its consequences (e.g., "Are you sure you want to start this category? Participants will be able to attempt it and judges will be able to record results.")

