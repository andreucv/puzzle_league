---
slug: print-entry-cards
stage: design
feature: Print individual entry cards for table assignation
issue: null
status: approved
created: 2026-07-04
updated: 2026-07-04
related:
  - docs/features/print-entry-cards/01-problem.md
  - docs/features/print-entry-cards/02-ideas.md
  - docs/features/print-entry-cards/04-plan.md
---

# Design: Print individual entry cards for table assignation

Scope: [manage_registrations/+page.svelte](../../../src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte)
(buttons), new `src/lib/utils/pdf_entry_cards.ts` (lazy chunk), new resolver route
`src/routes/(internal)/e/[entryId]/+server.ts`, small additions to
[during_competition](../../../src/routes/(internal)/(auth)/competition/[id=integer]/during_competition/+page.svelte)
and [results](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte).
Data comes from the existing `getRegistrationsForCompetition` query
([db_entry.ts L58](../../../src/lib/database/db_entry.ts)) — already includes `tableNumber`,
`users`, `externalParticipants`, and `entryTag { tag, status }`.
Refs: docs/ARCHITECTURE.md (authorization, services), docs/PRODUCT.md (organizer workflow),
docs/GLOSSARY.md. Problem: [01-problem.md](01-problem.md); direction: Option A in
[02-ideas.md](02-ideas.md).

## Problem

Organizers publish table assignments but must hand-build the physical per-table cards, and no
printed artifact links a table to its digital entry for judges (stop the time) or participants
(see results). Guiding principle: reuse the page's existing data and the existing lazy-PDF-export
pattern; all heavy libraries stay in a dynamically imported chunk.

## Design

### 1. Print buttons (manage_registrations)

- **Per category:** a "Print entry cards" button next to each category's "Publish tables" button.
  Enabled only when the category has ≥ 1 entry with `status === 'CONFIRMED'` and
  `tableNumber !== null`; disabled with a tooltip hint ("Publish tables first") otherwise.
  Click → dynamic `await import('$lib/utils/pdf_entry_cards')` → downloads
  `<competition>-<category>-cards.pdf` for that category.
- **Whole competition:** a "Print all entry cards" button next to the existing registrations-PDF
  export button. Includes every category that has qualifying entries, skips the rest; disabled
  when no category qualifies. Downloads `<competition>-cards.pdf`, categories in `startTime`
  order, each category starting on a fresh page.
- Both buttons show the same spinner/disabled pattern used by the existing export and publish
  buttons. New i18n keys under `manage_registrations.*` in `en`/`es`/`ca`.

### 2. Card layout (A4 portrait, jsPDF)

One card per qualifying entry, matching the sketched row design:

```
┌──────────────────────────────────────────────────────┐
│ <Competition name> — <Category type> <· subname?>    │
│ ┌──────┐  Participant 1                       ▓▓▓▓▓  │
│ │  12  │  Participant 2                       ▓▓▓▓▓  │
│ └──────┘  [TAG badge]                          QR    │
└──────────────────────────────────────────────────────┘
✂ - - - - - - - - - - - - - - - - - - - - - - - - - - -
```

- **Table number:** large boxed number (the card's dominant element, readable from standing
  height).
- **Participants:** all `users[].name` then `externalParticipants[].name`, one per line.
- **Tag:** printed as a small badge only when `entryTag.status === 'CONFIRMED'`
  (`EntryTagStatus` enum: PENDING | CONFIRMED | REJECTED); pending/rejected tags are omitted.
- **QR:** ~35 mm square on the right, generated client-side (see §3).
- **Packing:** cards are **atomic** — card height = base + one line per participant; before
  drawing, if the card does not fit in the remaining page space, start a new page. As many cards
  as fit per page, dashed cut line between consecutive cards. Party sizes are bounded by
  `Category.maxPartySize`, so a card taller than a full page is not a real case.
- Labels localized through the same `translate`/`locale` params as
  [pdf_registrations.ts](../../../src/lib/utils/pdf_registrations.ts).

### 3. QR code and resolver route

- Each QR encodes `${location.origin}/e/<entryId>` — a stable resolver URL, generated in the same
  lazy chunk with the `qrcode` package (`toDataURL` → `doc.addImage`). New runtime dependency:
  `qrcode` (+ `@types/qrcode` dev). Nothing QR/PDF-related is imported statically anywhere.
- **New route** `src/routes/(internal)/e/[entryId]/+server.ts` (outside `(auth)` so anonymous
  scans work — precedent: the results page loads with a null user). `GET`:
  1. Load the entry: `select { categoryId, category: { select: { competitionId } } }`.
     Missing entry → `error(404)` (stale card; standard error page).
  2. If `locals.user` exists, call
     [getCompetitionAccess](../../../src/lib/services/competition-access.ts); if
     `access.canManageCompetition || access.judgedCategoryIds.includes(entry.categoryId)` →
     `redirect(302, '/competition/<competitionId>/during_competition?entry=<entryId>')`.
     A judge of a *different* category of the same competition does **not** match — they fall
     through to the participant path, per spec ("judge for the category running").
  3. Otherwise (participant, unrelated user, or anonymous) →
     `redirect(302, '/competitions/competition_details/<competitionId>/results?category=<categoryId>')`.
  - Response is a role-dependent 302: send `Cache-Control: no-store` so no intermediary caches
    one user's redirect for another.

### 4. during_competition — `?entry=<id>` autoselect

- On page load, read the `entry` search param once. If one of the loaded categories contains that
  entry: expand/reveal that category's card, scroll the entry's row into view, and select it
  through the existing `EntryList` selection state
  ([EntryList.svelte L45–56](../../../src/lib/components/during-competition/EntryList.svelte),
  via an initial-selection prop threaded from the page) so the row is highlighted and its
  stop-time action is immediately actionable — same UI as a manual row tap.
- If the entry is not found (wrong competition, deleted mid-event) the param is ignored — normal
  page, no error. The param is consumed once; later Ably updates or manual selection behave as
  today. If the entry already has a `finishTime`, it is still highlighted — the judge sees the
  recorded time (and the existing edit/delete affordances) instead of a stop button.

### 5. results — `?category=<id>` preselect

- Initialize `selectedCategoryId`
  ([results/+page.svelte L46](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte))
  from the `category` search param when it matches a loaded category; otherwise keep the current
  default (first category). The page already renders NOT_STARTED / LIVE / STOPPED / COMPLETE
  states, so a scan before the category starts shows a sensible "not started" view.

### 6. Roles & edge cases summary

| Scanner | Destination |
|---|---|
| Organizer / admin / coorganizer | during_competition, entry selected |
| Judge assigned to the entry's category | during_competition, entry selected |
| Judge of another category only | results (participant path) |
| Participant / any other user | results, category preselected |
| Anonymous | results, category preselected (no login wall) |
| Entry deleted | 404 error page |

A user who is both participant and judge of the category gets the judge branch (checked first).

## Data / model impact

- **No schema changes.** `Entry.tableNumber`, `EntryTag.status/tag`, `Category.type/subname`,
  participant names are all already modeled and already fetched by `getRegistrationsForCompetition`
  for the manage_registrations page — the PDF half needs **no backend change at all**.
- New backend surface: the `/e/[entryId]` GET handler — one small Prisma `entry.findUnique` plus
  the existing `getCompetitionAccess` service. No new service, no new table.
- New dependency: `qrcode` (runtime, lazy-loaded), `@types/qrcode` (dev).

## Out of scope

- Reprinting a single card, card branding/customization, QR short-links or scan analytics.
- Any change to how tables are assigned/published.
- Autoselect deep-linking from anywhere other than the QR resolver (the param is generic, but no
  other UI emits it in this feature).

## Open questions

None — all resolved with the user on 2026-07-04:

1. **Entry filter** → CONFIRMED entries with `tableNumber`; buttons disabled until tables published.
2. **Cards per page** → as many as fit on portrait A4, cards atomic (never split across pages).
3. **Judge UX** → scroll + highlight + select via existing EntryList selection.
4. **Tag on card** → only `EntryTagStatus.CONFIRMED` tags.
5. **Print scope** → both per-category buttons and a whole-competition button.
6. **Dead QR** → 404 error page.
