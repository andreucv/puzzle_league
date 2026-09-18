---
slug: print-entry-cards
stage: ideas
feature: Print individual entry cards for table assignation
issue: null
status: draft
created: 2026-07-04
updated: 2026-07-04
related:
  - docs/features/print-entry-cards/01-problem.md
  - docs/features/print-entry-cards/03-design.md
  - docs/features/print-entry-cards/04-plan.md
---

# Print individual entry cards for table assignation — Ideas

Problem: [docs/features/print-entry-cards/01-problem.md](01-problem.md)

The feature splits into two independent halves: **(1) generating the printable A4 card sheets**
and **(2) the QR link that resolves per-role**. The QR half has essentially one viable shape
(a single QR cannot encode different destinations per scanner, so a server-side resolver route is
required — as the problem statement already specified); the candidate directions below differ
mainly in how the PDF is produced.

## Candidate directions

### Option A — Client-side jsPDF card generator + server QR resolver (recommended)

**What:** A second button next to "Publish tables" per category in
[manage_registrations/+page.svelte](../../../src/routes/(internal)/(auth)/competition/[id=integer]/manage_registrations/+page.svelte)
("Print entry cards"). It lazily imports a new `src/lib/utils/pdf_entry_cards.ts` that draws one
card per entry — competition name, category type/subtype header, big table number, participant
names, entry tag, QR image — N cards per DIN A4 page with cut lines, and downloads the PDF.
QRs are generated in the same lazy chunk with the small `qrcode` package (canvas → data URL →
`doc.addImage`). Each QR encodes a stable resolver URL, e.g. `/e/<entryId>`, handled by a new
server route that loads the entry, checks the session against
[competition-access.ts](../../../src/lib/services/competition-access.ts), and 302-redirects:
organizer/judge of the category → `during_competition?entry=<id>` (new autoselect param);
everyone else (participant or anonymous) → the category's results page.

**Data/powered by:** everything is already fetched on the page — `Entry.tableNumber`, `users`,
`externalParticipants`, `entryTag`, `Category.type/subname`, competition name. No schema change.

**Effort:** Medium (card drawing ~100 lines; resolver route small; during_competition autoselect
and results category-preselect are the fiddly bits).

**Trade-off:** jsPDF layout is manual coordinate math — iterating on the card design is slower
than CSS. In exchange: one-click file download exactly as requested, same pattern and same
already-installed library as [pdf_registrations.ts](../../../src/lib/utils/pdf_registrations.ts),
zero server cost, and the heavy code stays in a lazily-imported chunk (the stated performance
constraint).

### Option B — Print-styled HTML route + browser print-to-PDF

**What:** A new organizer-guarded route (e.g. `/competition/[id]/print_cards?category=X`) that
server-loads the entries and renders the cards as plain HTML with `@media print` CSS (A4 page
size, `break-inside: avoid`, cut borders). The organizer prints / "Save as PDF" from the browser.
QRs rendered as inline SVGs. Same `/e/<entryId>` resolver as Option A.

**Data/powered by:** same data, loaded server-side in the route's `load`.

**Effort:** Medium (new route + guard + print CSS; layout iteration is much faster than jsPDF).

**Trade-off:** CSS is the native tool for page layout — easier to get the card design right and
maintain. But the deliverable becomes "a page you print" rather than "a PDF file that downloads",
diverging from the explicit ask and from the existing export precedent; print output can vary
slightly across browsers (margins, scaling).

### Option C — Server-side PDF endpoint

**What:** An API route that generates the PDF on the server (pdfkit or headless Chromium) and
streams it back.

**Data/powered by:** same data, one Prisma query.

**Effort:** High.

**Trade-off:** Rejected — adds a new server dependency and cold-start weight on Vercel serverless
for zero user-visible benefit over Option A; the browser already has everything needed.

## Recommendation

**Option A.** It follows the proven pattern in this codebase (lazy-imported jsPDF export button on
the same page), honors the explicit "downloadable PDF collection of A4 pages" requirement, needs
only one tiny new dependency (`qrcode`) confined to a lazy chunk, and no schema changes. The
QR resolver route `/e/<entryId>` is shared with Option B anyway, so nothing is lost if the card
rendering is later swapped for a print route.

Out of scope for this feature: reprinting single cards, card customization/branding, QR
short-links or analytics, and any change to how tables are assigned.

## Open questions for design

1. **Entry filter:** cards only for `CONFIRMED` entries with a `tableNumber`, or all published
   entries? What if the organizer clicks print before publishing tables?
2. **Cards per A4 page:** 3 or 4 rows per page? Cut-guide lines?
3. **Autoselect UX in during_competition:** `?entry=<id>` — scroll + highlight the EntryRow and
   expand its category card? The page currently has no such mechanism
   ([during_competition/+page.svelte](../../../src/routes/(internal)/(auth)/competition/[id=integer]/during_competition/+page.svelte)).
4. **Results deep-link:** results page keeps `selectedCategoryId` in client state only
   ([results/+page.svelte](../../../src/routes/(internal)/competitions/competition_details/[id=integer]/results/+page.svelte) L46)
   — the redirect needs a `?category=<id>` param wired to it.
5. **Anonymous access:** verify the results route is truly reachable without a session (it is
   outside `(auth)` but inside `(internal)`); otherwise the anonymous QR path hits a login wall.
6. **Resolver edge cases:** entry deleted after printing → 404 vs redirect to competition results;
   judge assigned to a *different* category of the same competition — organizer/judge check per
   category or per competition?
7. **Entry tag on card:** show `EntryTag.tag` always, or only when status is accepted/confirmed?
