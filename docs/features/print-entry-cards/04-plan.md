---
slug: print-entry-cards
stage: plan
feature: Print individual entry cards for table assignation
issue: null
status: draft
created: 2026-07-04
updated: 2026-07-04
related:
  - docs/features/print-entry-cards/01-problem.md
  - docs/features/print-entry-cards/02-ideas.md
  - docs/features/print-entry-cards/03-design.md
---

# Implementation Plan: Print individual entry cards for table assignation

Give organizers a one-click, per-category (and whole-competition) PDF of cut-out A4 entry cards —
table number, participant names, confirmed tag, and a QR that resolves `/e/<entryId>` server-side
by role: organizer/judge of the category → during_competition with the entry auto-selected;
everyone else (incl. anonymous) → the category's results page.

Design: [03-design.md](03-design.md) (approved). Issue: none.
Refs: docs/ARCHITECTURE.md (authorization, services, code layout), docs/CONTRIBUTING.md (testing,
i18n), docs/workflows/registration-workflow.md (table-assignment behavior).

## Architecture and design

**No schema changes; one new dependency (`qrcode`, lazy-loaded).** Four touch points:

1. **PDF generation (client, lazy chunk).** New `src/lib/utils/pdf_entry_cards.ts`, sibling and
   mirror of [pdf_registrations.ts](../../../src/lib/utils/pdf_registrations.ts) (same
   `translate`/`locale` param pattern, same jsPDF). Exposes
   `async downloadEntryCardsPdf({ competitionName, categories, origin, translate, locale })` —
   async because `qrcode`'s `toDataURL` is. Filters entries to `status === 'CONFIRMED' &&
   tableNumber !== null`; draws atomic cards (height = base + line per participant; page-break
   before drawing when the card doesn't fit; dashed cut line between cards); QR encodes
   `${origin}/e/<entryId>`. Tag badge only when `entryTag.status === 'CONFIRMED'`. Both buttons
   call this util (per-category passes one category; global passes all, each category starting a
   new page). Data is already on the page via `getRegistrationsForCompetition`
   ([db_entry.ts L58](../../../src/lib/database/db_entry.ts)) — includes `tableNumber`, `users`,
   `externalParticipants`, `entryTag { tag, status }`.

2. **Buttons (manage_registrations).** In
   [+page.svelte](../../../src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte):
   per-category "Print entry cards" next to "Publish tables" (~L321–350), enabled when that
   category has ≥1 CONFIRMED entry with a `tableNumber`; global "Print all entry cards" next to
   the existing export button (~L211), enabled when any category qualifies. Reuse the
   `generatingPdf`-style busy state and the `await import(...)` pattern (L49–62). New i18n keys
   under `manage_registrations.*` in `src/lib/translations/{en,es,ca}/common.json` (batched grep
   to locate the `publish_tables` anchor in all three at once, per CLAUDE.md).

3. **QR resolver (server).** New `src/routes/(internal)/e/[entryId]/+server.ts` — outside
   `(auth)` so anonymous scans work. GET: small query (added to
   [db_entry.ts](../../../src/lib/database/db_entry.ts)) selecting
   `{ categoryId, category: { competitionId } }`; missing → `error(404)`. If `locals.user` and
   `access.canManageCompetition || access.judgedCategoryIds.includes(categoryId)` (reusing
   [getCompetitionAccess](../../../src/lib/services/competition-access.ts)) →
   `302 /competition/<compId>/during_competition?category=<catId>&entry=<entryId>`; else →
   `302 /competitions/competition_details/<compId>/results?category=<catId>`. `Cache-Control:
   no-store` on responses. The `category` param is included in the judge redirect because
   during_competition fetches entries per category client-side (`useCategoryEntries`) — the page
   needs to know which card to expand before any entries are loaded.

4. **Deep-link consumers.**
   - *during_competition:* read `category`/`entry` params once on mount; `forceOpen` the matching
     CategoryCard (prop already exists on
     [EntryList](../../../src/lib/components/during-competition/EntryList.svelte) L23; thread the
     equivalent through [CategoryCard](../../../src/lib/components/during-competition/CategoryCard.svelte));
     when entries arrive, preselect via a new optional `initialSelectedId` prop on EntryList
     (seeding its existing `selectedRecord` state, L46) and `scrollIntoView` the row. Unknown
     entry → param ignored, normal page.
   - *results:* initialize `selectedCategoryId`
     ([+page.svelte L46](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte))
     from the `category` param when it matches a loaded category.

## Tasks

- [x] **1. Dependency:** `pnpm add qrcode && pnpm add -D @types/qrcode`. Verify no static import
      of `qrcode`/`jspdf` leaks into any eagerly-loaded module (build chunk check).
- [x] **2. Resolver route:** add the entry-lookup helper to `db_entry.ts`; create
      `src/routes/(internal)/e/[entryId]/+server.ts` with the role-based 302s, 404 on missing
      entry, and `Cache-Control: no-store`.
- [x] **3. Card PDF util:** `src/lib/utils/pdf_entry_cards.ts` — filtering, atomic card packing,
      QR data URLs, tag badge, cut lines, per-category page breaks. Unit test (vitest) for the
      packing/filter logic (e.g. card never split: mock N entries with varying party sizes and
      assert page-break decisions), colocated like the existing `*.test.ts` files.
- [x] **4. Buttons + i18n:** per-category and global buttons in manage_registrations with
      enable/disable rules, busy states, `data-testid`s; add the new keys to `en`, `es`, `ca`
      `common.json`.
- [x] **5. during_competition autoselect:** consume `?category=&entry=`, `forceOpen` the category
      card, thread `initialSelectedId` into EntryList, scroll + highlight. Extend the existing
      component tests (`EntryList.svelte.test.ts` / `CategoryCard.svelte.test.ts`) for the new
      prop.
- [x] **6. results preselect:** initialize `selectedCategoryId` from `?category=`.
- [x] **7. e2e:** one spec covering the resolver branches — organizer/judge lands on
      during_competition with the entry selected; participant and anonymous land on results with
      the category selected; deleted entry → 404 (fixtures already exist under `e2e/`).
- [ ] **8. Manual verification:** `pnpm dev` → publish tables → print per-category and global
      PDFs (check A4 layout, cut lines, atomic cards, tag badge, names) → visit `/e/<entryId>` as
      organizer, judge, judge-of-other-category, participant, and logged-out.
- [x] **9. `pnpm test` green; `graphify update .`.** (334 unit tests green; e2e 102/103 — the one
      failure is a pre-existing webkit navigation race in `e2e/auth/anonymous.test.ts`, unrelated
      to this feature.)
- [ ] **10. Close-out (after merge): run `/feature-doc`** to produce `05-workflow.md` — the
      feature is not done until it exists.

## Open questions

1. **Card visual sign-off:** iterate the card layout with you on the first generated PDF (task 3)
   before polishing, or ship the design-doc sketch as-is and adjust later?
2. **e2e depth:** is the single resolver-branches spec (task 7) enough, or do you also want an
   e2e that exercises the PDF download button itself (download assertions in Playwright are
   possible but the PDF content itself would go unverified)?
3. **QR error-correction level:** default M should scan fine at ~35 mm; bump to Q (denser but
   more damage-tolerant) if cards may get stamped/written on?
