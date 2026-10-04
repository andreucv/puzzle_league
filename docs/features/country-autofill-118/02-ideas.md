---
slug: country-autofill-118
stage: ideas
feature: Browser autofill breaks the Country combobox
issue: "#118"
status: draft
created: 2026-10-04
updated: 2026-10-04
related:
  - docs/features/country-autofill-118/01-problem.md
  - docs/features/country-autofill-118/03-design.md
  - docs/features/country-autofill-118/04-plan.md
---

# Browser autofill breaks the Country combobox — Ideas

Problem: [docs/features/country-autofill-118/01-problem.md](01-problem.md)

## Decisions taken while brainstorming

1. **Suppress, don't support.** Chrome should stop offering country suggestions on these fields.
   Only our own list should be used to pick a country. We considered mapping Chrome's autofilled
   name to an ISO code and rejected it: it means more code, it depends on browser heuristics, and
   names have to be matched across en/es/ca and the browser's own language.
2. **Scope: every combobox that has a text input and is affected.** That means the inline country
   combobox in
   [competition/edit/[[id=integer]]/+page.svelte](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte),
   [CountryCombobox.svelte](../../../src/lib/components/common/CountryCombobox.svelte) (profile and
   onboarding), and
   [PhonePrefixCombobox.svelte](../../../src/lib/components/common/PhonePrefixCombobox.svelte).
   Making the competition form reuse `CountryCombobox` instead of its inline copy is out of scope.

## Candidate directions

### A — Override the `autocomplete` token on `Combobox.Input` (chosen)

**What:** Pass an explicit `autocomplete` value on each `Combobox.Input` to replace Zag's
`autocomplete="off"`, which Chrome ignores. The value should be one Chrome doesn't treat as an
address or phone field. Nothing else changes: no change to behavior, data or markup structure.

**Data/powered by:** No schema change. Skeleton's input
(`@skeletonlabs/skeleton-svelte/dist/components/combobox/anatomy/input.svelte`) runs
`mergeProps(combobox().getInputProps(), rest)`, which applies our props *after* Zag's, so a prop we
pass replaces the built-in `off`.

**Effort:** Quick. About one attribute in each of the 3 files.

**Trade-off:** It depends on how Chrome and Edge treat `autocomplete` values today, and that has
changed over the years. It has to be checked by hand in real Chrome and Edge with saved addresses,
and automated tests can't confirm it. If no token works, use B as the fallback. Fixing the main
symptom should also fix the double popup (symptom 2 in the problem doc), because there will be no
Chrome popup left to compete with ours.

### B — Remove what makes Chrome think it's an address field

**What:** Make sure nothing about the visible input tells Chrome it is a "country" or "phone" field
(name, id, aria label, nearby label text). Only the hidden `name="country"` input would keep the
semantic name.

**Data/powered by:** Markup only.

**Effort:** Quick to Medium.

**Trade-off:** It's an indirect workaround. A future copy change could undo it without anyone
noticing, and it's harder to explain in code. Keep it as the fallback if A doesn't hold up in
testing.

### C — Replace the text combobox with a native `<select>`

**What:** Use a `<select>` of ISO codes with localized labels.

**Data/powered by:** The same `countries` list in `$lib/utils/country_utils`.

**Effort:** High, because 4 places get redesigned.

**Trade-off:** It fixes both symptoms, and Chrome would even fill a select correctly. But we would
lose type-to-filter search (including the diacritic folding in `CountryCombobox`), the flag-and-label
styling, and the probable-country sorting. Rejected because it costs too much for a bug fix.

## Recommendation

**Direction A.** It's the smallest change and needs no data or schema work. The fix is the same in
all three components and easy to review. B is the documented fallback if testing shows Chrome still
autofills. Out of scope:
- supporting autofill (mapping names to ISO codes)
- making the competition form reuse `CountryCombobox`
- pre-filling the probable country on the competition form
- the Location and Postal code inputs, which autofill correctly as plain text fields

## Open questions for design

1. Which `autocomplete` token, tested in current Chrome and Edge on Windows? Candidates: a
   non-standard token, or a valid one with no address meaning. Is the same token right for the
   phone-prefix input?
2. Once the main symptom is fixed, is the double popup actually gone? It should be, but needs
   checking.
3. Does Zag's `getInputProps()` output `autoComplete` (camelCase) in a way that causes a duplicate or
   conflicting attribute next to our `autocomplete`? Check the rendered DOM.
4. How do we stop this regressing? Options: a short code comment at each place, an e2e check that
   the `autocomplete` attribute is present, or both. Real autofill behavior can't be tested in
   Playwright.
5. Do Firefox and Safari still behave as before? Their autofill is less aggressive, but the change
   must not break typing or selection there.
