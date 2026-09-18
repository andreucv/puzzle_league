---
slug: print-entry-cards
stage: problem
feature: Print individual entry cards for table assignation
issue: null
status: draft
created: 2026-07-04
updated: 2026-07-04
related:
  - docs/features/print-entry-cards/02-ideas.md
  - docs/features/print-entry-cards/03-design.md
  - docs/features/print-entry-cards/04-plan.md
---

# Print individual entry cards for table assignation — Problem

## Context

Organizers assign tables per category from the **manage registrations** page
([src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte](../../../src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte)),
via the "Publish tables" button that calls
[src/routes/(internal)/api/categories/[id]/publish-tables](../../../src/routes/(internal)/api/categories/[id]/publish-tables/+server.ts)
and writes `Entry.tableNumber` ([prisma/schema.prisma](../../../prisma/schema.prisma) L262).

The same page already offers a **full-list PDF export** through
[src/lib/utils/pdf_registrations.ts](../../../src/lib/utils/pdf_registrations.ts)
(jsPDF + jspdf-autotable, lazily imported client-side), which prints one table row per entry —
useful as an organizer's roster, not as physical signage.

During the event, judges operate from the
[during_competition page](../../../src/routes/(internal)/(auth)/competition/[id=integer]/during_competition/+page.svelte)
(access via `getCompetitionAccess`, `isOrganizer`/`isJudge` in
[src/lib/services/competition-access.ts](../../../src/lib/services/competition-access.ts)),
and participants/public consult the
[results page](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte).

## Problem

1. After publishing table assignments, organizers have **no way to produce physical per-table
   cards** to place on each table. The existing PDF export is a flat roster (one row per entry,
   whole category on shared pages) — it cannot be cut/placed per table.
2. Organizers currently hand-write or hand-build these cards outside the app (spreadsheet/word
   processor), re-copying table numbers and participant names that the app already knows —
   duplicated effort and a transcription-error source every competition.
3. There is no printed artifact at the table linking the physical entry to its digital record.
   A judge at a table has to manually find the entry in the during_competition list; a
   participant has no shortcut from their table to their category's results. Nothing in the
   codebase resolves an entry ID to a role-dependent destination (no QR/deep-link route exists;
   `during_competition/+page.svelte` has no entry auto-select mechanism today).

## Who it affects & why it matters

- **Organizers** — bear manual pre-event work per category per competition; errors on hand-made
  cards cause wrong seating and confusion at start time.
- **Judges** — locating the right entry to stop its timer is slower than it needs to be; a
  scannable card would take them straight to the entry.
- **Participants** — finding "where do I sit" and later "where are my results" requires
  navigating the app manually.

## Constraints / prior ideas

- **Prior idea (user):** a second button next to "Publish tables" that generates a PDF of DIN A4
  pages, one card per entry, each card showing competition name, category type/subtype, table
  number, participant names, optionally entry tags (`EntryTag` / `ParticipantTagType`), and a QR
  code. The QR resolves **server-side by session**: organizer/judge of the category →
  during_competition with the entry auto-selected (ready to stop its time); participant or
  anonymous → the category's results page.
- Performance: heavy libs (PDF, QR) must be lazily imported so other pages don't pay the cost —
  the existing `await import('$lib/utils/pdf_registrations')` pattern is the precedent.
- No QR library is currently installed (`package.json` has none); jsPDF is already a dependency.
- Keep domain language and existing service boundaries (competition-access, db_entry, etc.).

## Open questions

1. Which entries get cards — only `CONFIRMED` entries with a `tableNumber`, or all non-waitlisted?
2. How many cards per A4 page ("small pieces" — 3? 4?), and is cut-guide styling needed?
3. What does "auto-select the entry" mean concretely in during_competition (query param → scroll
   + highlight + open stop-time control)? That deep-link doesn't exist yet.
4. Is the results page reachable by unauthenticated users today (it sits outside the `(auth)`
   group but inside `(internal)`) — does the anonymous QR redirect work without a login wall?
5. Should the QR encode a stable entry URL (`/e/<entryId>`-style resolver route) so cards stay
   valid if pages move, and what happens when the entry is deleted after printing?
