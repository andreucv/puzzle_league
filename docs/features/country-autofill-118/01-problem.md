---
slug: country-autofill-118
stage: problem
feature: Browser autofill breaks the Country combobox
issue: "#118"
status: draft
created: 2026-10-04
updated: 2026-10-04
related:
  - docs/features/country-autofill-118/02-ideas.md
  - docs/features/country-autofill-118/03-design.md
  - docs/features/country-autofill-118/04-plan.md
---

# Browser autofill breaks the Country combobox — Problem

## Context

When an organizer creates or edits a competition, the form at
[competition/edit/[[id=integer]]/+page.svelte](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte)
asks for **Location**, **Country** and **Postal code** next to each other (lines 714–800).

- Location and Postal code are plain `<input type="text">` fields bound to the superform.
- Country is a Skeleton `Combobox` (Zag.js `@zag-js/combobox@1.39.1` underneath), lines 734–784.
  The value that actually gets submitted comes from a hidden input,
  `<input type="hidden" name="country" value={countryValue[0] || ''} />` (line 736). `countryValue`
  changes **only** in the combobox's `onValueChange`, which fires when the user picks an item from
  the combobox's own list (lines 742–746).
- The visible text box is `Combobox.Input` (line 757). Zag already renders it with
  `autocomplete="off"` and `role="combobox"`
  ([combobox.connect.mjs:151](../../../node_modules/.pnpm/@zag-js+combobox@1.39.1/node_modules/@zag-js/combobox/dist/combobox.connect.mjs)).
  The page also sets `inputValue={countryInputValue}` from the outside, so the text shown in the box
  is controlled by the component.

The same kind of combobox appears in more places:
[CountryCombobox.svelte](../../../src/lib/components/common/CountryCombobox.svelte), used in
[UserCard.svelte](../../../src/routes/(internal)/(auth)/profile/components/UserCard.svelte) (profile) and
[LocationStep.svelte](../../../src/routes/(internal)/(auth)/onboarding/components/LocationStep.svelte)
(onboarding), and
[PhonePrefixCombobox.svelte](../../../src/lib/components/common/PhonePrefixCombobox.svelte). The
competition form has its own inline copy of the country combobox instead of reusing
`CountryCombobox` (lines 29–53 and 738–777). The copy has no diacritic folding and no
probable-country sorting.

## Problem

Reported in #118 by a collaborator (Win10, Chrome):

1. **Chrome's autofill suggestions do nothing.** Clicking the Country field opens Chrome's own
   address-autofill popup with countries saved earlier. Picking one leaves the field empty. The
   organizer gets no feedback, and the country is not saved.
   - Chrome guesses this is an address field (the label is "Country" and it sits between Location
     and Postal code), and it ignores `autocomplete="off"` for address-like fields.
   - Autofill writes text straight into the input's DOM value. The combobox does not treat that as
     choosing an item, so `onValueChange` never runs, `countryValue` stays `[]`, and the hidden
     `country` input stays empty (line 736). The controlled `inputValue` then probably resets the
     visible text too, which is why the field looks blank. (This explanation comes from reading the
     code and has not been reproduced yet.)
   - Even when autofill text survives, it is Chrome's country name in Chrome's language (for example
     "Spain"). The combobox labels are localized with `getLocalizedCountryName(code, $locale)`
     (line 31), for example "Espanya" in Catalan, so the two would not match anyway.
2. **Two popups compete.** While Chrome's autofill popup is open, clicking the combobox trigger
   arrow (`Combobox.Trigger`, line 758) opens our country list underneath, but Chrome's popup stays
   on top until the user clicks one of its entries (second comment and screenshot on #118). The
   user sees two overlapping dropdowns, and only the browser one responds.
3. **The user is told something that isn't true.** Chrome's popup suggests the field will be
   filled. It isn't, and nothing explains why. The reporter isn't sure it can be fixed at all
   ("Realment no sé si té solució").

## Who it affects & why it matters

- **Organizers** creating or editing a competition, mainly on desktop Chrome or Edge with saved
  addresses. Country is marked "recommended" (line 735) and is checked before publishing
  (line 281: `if (!countryValue[0]) missing.push(...)`). An organizer who thinks they set it is then
  told it's missing, or publishes without a country.
- **Participants** pay indirectly. Country is used for discovery and for display on cards and
  explore filters (`CompetitionCard.svelte`, `explore_competitions/+page.svelte`). A competition
  with no country is harder to find.
- **Users filling in profile or onboarding** probably hit the same thing in `CountryCombobox` and
  `PhonePrefixCombobox`, since the input setup is the same. Not yet confirmed.
- Cost of leaving it: the create form feels broken during a key organizer flow, country data ends
  up incomplete, and a support or bug report comes back whenever someone runs into it.

## Constraints / prior ideas

- The reporter's expected behavior is either: **the field fills with the selected country**, or
  **Chrome offers no country suggestions at all**. Both directions are acceptable to them.
- The saved value must stay an ISO country code (`Competition.country String?`,
  [prisma/schema.prisma:192](../../../prisma/schema.prisma)), so free text can't be stored as it is.
- Labels are localized in `en`, `es` and `ca`. Any matching has to work with localized names.
- Browser autofill is a heuristic we don't control, and `autocomplete="off"` is already set and
  ignored. Whatever we do has to hold up across Chrome and Edge versions.
- Keep the change small (CLAUDE.md). The inline copy of the combobox on the competition form is
  relevant here: if it's fixed in one place only, the other places stay broken.

## Open questions

1. Should autofill **work** (map Chrome's suggestion to an ISO code and select it) or be
   **suppressed** (Chrome never offers country suggestions on this field)?
2. Should the fix cover every country/phone-prefix combobox (competition form, profile,
   onboarding), or only the competition form named in #118?
3. Can we reproduce the exact failure (does the autofilled text get wiped, or does it stay visible
   without being selected)? Does it also happen with Location and Postal code autofill on the same
   form?
4. If autofill is supported, how should it handle a country name in a language different from the
   UI locale, or one that doesn't match any entry?
5. Is fixing the double popup (symptom 2) in scope on its own, or does it go away once symptom 1 is
   handled?
