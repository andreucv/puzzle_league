# Finish Category Workflow

## Goal
When an organizer stops a live category, the category should move to a real intermediate status named `STOPPED`.

`STOPPED` means the solving time is over and `realEndTime` has been recorded, but the category is still waiting for final DNF result cleanup. During this state, judges and organizers can enter the number of pieces left for records that did not finish in time.

Once the organizer decides the category review is finished, the category moves from `STOPPED` to `COMPLETE`.

This model is explicit, avoids any time-based behavior, and fits Vercel Hobby constraints naturally because no timer logic is needed.

## Status Model
- `NOT_STARTED`: the category has not started yet.
- `LIVE`: the category is actively running. Judges can mark finishes.
- `STOPPED`: the category has ended, no more finish actions are allowed, and DNF cleanup is still pending.
- `COMPLETE`: the category is finalized and considered fully reviewed.
- `CANCELED`: the category is canceled.

Primary forward flow:
- `NOT_STARTED -> LIVE`
- `LIVE -> STOPPED`
- `STOPPED -> COMPLETE`

Recovery flows:
- `STOPPED -> LIVE` when the organizer stopped the category by mistake and needs to resume it
- `COMPLETE -> LIVE` only through an explicit restart/reset workflow, because that is destructive
- `NOT_STARTED -> CANCELED`
- `LIVE -> CANCELED`

## Core UX
When finishing a category, the organizer clicks the "Stop Category" button on a `LIVE` category card.

A confirmation dialog is shown. If the organizer confirms:
- the category becomes `STOPPED`
- `realEndTime` is recorded immediately
- the category leaves the "Active Categories" section
- the category appears in a new first section on the during competition page, such as "Stopped Categories" or "Waiting for Results"

While a category is `STOPPED`:
- judges and organizers can edit only unfinished records
- the input shown to the user is "pieces left"
- the value stored in the database remains `nPiecesCompleted = totalPieces - piecesLeft`
- finish and undo-finish actions are no longer available

When the organizer considers the review done, they click a new action such as "Complete Category". That moves the category to `COMPLETE`, removes it from the stopped section, and shows it in the normal completed section.

## Confirmed Product Decisions
- When a category is stopped, unfinished records must **NOT** get `finishTime` set. Leave `finishTime = null` so they remain identifiable as DNFs.
- `STOPPED` is a persisted database status, not a derived UI bucket.
- `realEndTime` is recorded on `LIVE -> STOPPED`, not on `STOPPED -> COMPLETE`.
- Competition status transitions to `FINISHED` only when all categories are `COMPLETE`.
- Pieces input is only shown for unfinished records where `finishTime = null`.
- Pieces editing is available while the category is `STOPPED`.
- The organizer inputs **pieces left** because that is easier to count at the table. The system stores `nPiecesCompleted`.
- `nPiecesCompleted = 0` is valid.
- `COMPLETE` is treated as the locked, final state for the category.

## Missing Edge Cases and Clarifications

### Data / Backend

1. **Add `STOPPED` to the category status enum**
	The workflow now requires a real intermediate state in Prisma and in every backend/frontend status switch.

2. **Stop API must reject non-LIVE categories**
	The stop route should only accept `LIVE -> STOPPED`. Duplicate clicks or stale requests should return a safe 400/409.

3. **Stop API must stop auto-finishing unfinished records**
	The current implementation sets `finishTime = now` on unfinished records. That must be removed.

4. **A new complete API is required**
	There must be a dedicated organizer-only action for `STOPPED -> COMPLETE`. Stop and complete are no longer the same thing.

5. **Stop and complete flows should be transactional**
	Category status updates, summary updates, and competition status updates should be done transactionally so the system cannot land in a half-updated state.

6. **Organizer-only category actions must be enforced server-side**
	Start, stop, complete, cancel, resume, and restart should all be organizer-only backend actions, not just organizer-only buttons in the UI.

7. **Competition status must remain STARTED while categories are STOPPED**
	A competition with no `LIVE` categories but at least one `STOPPED` category is still operational and not yet finished.

8. **Record result API must enforce category state**
	Finishing and undoing a record should only be allowed while the category is `LIVE`. Once the category is `STOPPED`, finish-related actions must be rejected.

9. **Pieces update API must enforce category and record state**
	Pieces updates should be allowed only when the category is `STOPPED` and the record is still a DNF (`finishTime = null`). The endpoint should reject updates for `LIVE`, `COMPLETE`, or `CANCELED` categories.

10. **Pieces authorization is already protected indirectly and should be covered by tests**
	`/api/records/[id]/pieces` is already protected by the global route guard (`recordJudge`) in hooks. This should be preserved and made explicit in tests.

11. **Multiple puzzles are still ambiguous**
	A category can contain multiple puzzles, but a record is not linked to a specific puzzle. Per-record piece validation remains undefined if a category mixes puzzle sizes. We need one of these rules:
	- short-term: only support the feature for categories with a single effective piece count
	- medium-term: require all puzzles in the category to share the same `pieces` value
	- long-term: add `record.puzzleId`

12. **Concurrent stop + finish race still needs defensive writes**
	Not overwriting `finishTime` on stop makes the race safer, but the stop flow should still derive counts from the final committed state, ideally inside one transaction.

13. **Resume from STOPPED should not clear existing results**
	`STOPPED -> LIVE` should be a resume action, not a destructive restart. Existing finish times and DNF piece values should remain unless the organizer explicitly chooses a reset workflow.

14. **Restart from COMPLETE remains destructive and must warn clearly**
	A full restart can still clear `finishTime` and `nPiecesCompleted`, but that is a different workflow from resuming a stopped category.

### Results and Downstream Surfaces

15. **STOPPED categories should not appear as finalized results**
	Public or final-results views should continue to include only `COMPLETE` categories. `STOPPED` means review is still in progress.

16. **Results pages need a DNF ordering rule once categories are COMPLETE**
	Recommended rule:
	- finished records first, ordered by `finishTime ASC`
	- DNF records next, ordered by `nPiecesCompleted DESC`
	- remaining ties by `tableNumber ASC`, then record id

17. **Results UI must display DNF data without implying a finish time**
	DNFs should still show as DNF even when they have `nPiecesCompleted`.

18. **Landing-page and summary widgets should ignore STOPPED as final state**
	Anything that currently treats completed competitions/categories as settled output must continue to look only at `COMPLETE`.

### UI / UX

19. **Stopped section should be the first section on the during competition page**
	These categories need to stay highly visible until the organizer finalizes them.

20. **All-records-finished categories still enter STOPPED**
	Even if every record already finished on time, the category should still move through `STOPPED` so the state machine stays explicit. In that case, the stopped card can show no pending DNF rows and a prominent "Complete Category" action.

21. **Pieces input UX needs a dedicated edit state**
	The current record row only supports finish and undo. DNF editing requires a second interaction state: tap/click row -> input for pieces left -> submit or cancel.

22. **Re-editing must preload the current value**
	If a DNF already has `nPiecesCompleted`, the UI should reopen with the derived `piecesLeft` prefilled.

23. **CompletedCategoryCard should become read-only**
	Once a category is `COMPLETE`, the card should show final summary information and a results link, but no pieces-editing affordances.

24. **Canceled categories must never expose pieces editing**
	DNF editing is meaningful only for `STOPPED` categories.

25. **Legacy malformed categories need a safe fallback**
	If legacy data exists with inconsistent combinations such as `STOPPED` and null `realEndTime`, the UI should still render safely and the API should reject invalid transitions.

### Event Stream and Page Data

26. **The event stream must expose `STOPPED`**
	The during competition page and client differ logic currently reason mostly about `LIVE` and `COMPLETE`. They must be updated to include the intermediate state.

27. **Page loaders and derived sections must classify real statuses, not timers**
	The page should explicitly split categories into `STOPPED`, `LIVE`, `NOT_STARTED`, and `COMPLETE`/`CANCELED` sections.

## Proposed Implementation Plan

1. **Update the data model**
	- add `STOPPED` to `CategoryStatus`
	- update every backend and frontend status comparison to understand the new enum value

2. **Split category-ending behavior into explicit actions**
	- `POST /stop`: `LIVE -> STOPPED`
	- `POST /complete`: `STOPPED -> COMPLETE`
	- `POST /resume`: `STOPPED -> LIVE`
	- keep restart/reset as a separate destructive path for `COMPLETE -> LIVE`

3. **Lock state invariants**
	- stop auto-setting `finishTime` on unfinished records
	- allow finish/undo only in `LIVE`
	- allow pieces editing only in `STOPPED`
	- move competition to `FINISHED` only when all categories are `COMPLETE`

4. **Define the effective puzzle-size rule**
	- if the category has one puzzle, use that puzzle's piece count
	- if the category has multiple puzzles with the same `pieces` value, use that shared value
	- if the category has multiple different puzzle sizes, block the feature for that category until record-to-puzzle mapping exists

5. **Update the during competition UI**
	- add a first section for stopped categories
	- remove any time-based classification logic
	- show "Complete Category" and, if needed, "Resume Category" actions on stopped cards
	- keep completed cards read-only

6. **Keep final results tied to COMPLETE only**
	- results pages, summary widgets, and ranking logic should use only fully completed categories
	- apply the explicit DNF ordering rule there

7. **Add regression coverage**
	- API tests for stop, complete, resume, restart, result, and pieces invariants
	- Playwright coverage for: stop category -> category appears in stopped section -> enter DNF pieces -> complete category -> category appears in completed section
	- permission coverage for organizer vs judge actions

