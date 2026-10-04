---
slug: country-autofill-118
stage: plan
feature: Browser autofill breaks the Country combobox
issue: "#118"
status: approved
created: 2026-10-04
updated: 2026-10-04
related:
  - docs/features/country-autofill-118/01-problem.md
  - docs/features/country-autofill-118/02-ideas.md
  - docs/features/country-autofill-118/03-design.md
---

# Implementation Plan: Suppress browser autofill on text-input comboboxes (#118)

Resolves **#118** "[create competition] while creating a competition, in Country, google offers
some countries … but when selecting them, it remains blank".

Chrome shows its own address or phone autofill popup on our country and phone-prefix comboboxes and
ignores Zag's `autocomplete="off"`. Its choice is never selected by the combobox, so nothing is
saved. The popup also covers our list. **Goal:** these fields take values only from our list, so the
browser never offers to fill them.

- Design: [03-design.md](03-design.md) (approved)
- Problem: [01-problem.md](01-problem.md). Ideas: [02-ideas.md](02-ideas.md)
- Refs: `docs/CONTRIBUTING.md` (testing expectations: e2e via Playwright, unit via Vitest)

## Architecture and design

**Approach:** one shared `autocomplete` token, passed on every text-input `Combobox.Input`. This is a
frontend-only, markup-level change (design §1–§2).

| File | Change |
|---|---|
| [src/lib/utils/country_utils.ts](../../../src/lib/utils/country_utils.ts) | **Add** `export const COMBOBOX_NO_AUTOFILL = 'no-autofill';` with a JSDoc that references #118 (text in design §1). The file has no imports, so it is safe to import from e2e. |
| [competition/edit/[[id=integer]]/+page.svelte](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte) | Add `COMBOBOX_NO_AUTOFILL` to the existing `country_utils` import (line 15). Pass `autocomplete={COMBOBOX_NO_AUTOFILL}` on `Combobox.Input` (line 757). |
| [CountryCombobox.svelte](../../../src/lib/components/common/CountryCombobox.svelte) | Same: import on line 3, attribute on `Combobox.Input` (line 74). This covers profile `UserCard` and onboarding `LocationStep`. |
| [PhonePrefixCombobox.svelte](../../../src/lib/components/common/PhonePrefixCombobox.svelte) | Same: import on line 3, attribute on `Combobox.Input` (line 104). This covers profile and onboarding. |
| [e2e/competition/organizer.test.ts](../../../e2e/competition/organizer.test.ts) | In `fillCompetitionDetails` (around line 152), assert `toHaveAttribute('autocomplete', COMBOBOX_NO_AUTOFILL)` on `country-input`. Import the constant through the relative path `../../src/lib/utils/country_utils`, the same way `e2e/seed_utils` already imports from `src/lib`. |

**Reused, not added:**
- Skeleton's `Combobox.Input` already applies our props after Zag's
  (`mergeProps(getInputProps(), rest)`).
- Zag's `normalizeProps` lowercases `autoComplete`, so the result is a single attribute (design §2).

**No other impact:**
- No backend, schema, loader or action change.
- No i18n keys.
- No refactor needed first.
- The competition form's inline combobox stays an inline copy, since reusing `CountryCombobox` is out
  of scope.

**Token iteration:** we start with candidate 1, `'no-autofill'`. If the reporter still sees Chrome's
popup, we change only the constant to `'one-time-code'`. If that also fails, we apply fallback B
from [02-ideas.md](02-ideas.md), which needs a plan amendment.

## Tasks

- [x] 1. Add `COMBOBOX_NO_AUTOFILL` (with JSDoc) to `src/lib/utils/country_utils.ts`.
      *Implementation note:* Svelte types `autocomplete` as the standard `FullAutoFill` union, so
      the constant is cast `'no-autofill' as FullAutoFill`, with a type-only import from
      `svelte/elements` that is erased at runtime and still safe for e2e.
- [x] 2. Pass `autocomplete={COMBOBOX_NO_AUTOFILL}` on `Combobox.Input` in the competition edit page
      (inline country combobox).
- [x] 3. Same in `CountryCombobox.svelte`.
- [x] 4. Same in `PhonePrefixCombobox.svelte`.
- [x] 5. Add the `toHaveAttribute('autocomplete', COMBOBOX_NO_AUTOFILL)` assertion on `country-input`
      in `fillCompetitionDetails` (`e2e/competition/organizer.test.ts`).
- [x] 6. Run `pnpm check` and `pnpm test:unit`. Run the affected e2e specs
      (`e2e/competition/organizer.test.ts`, `e2e/profile/profile.test.ts`,
      `e2e/onboarding/participant.test.ts`) to confirm that typing and selection still work and the
      new assertion passes.
- [ ] 7. Quick local sanity check (`/run`): in the DOM, the country and phone-prefix inputs on the
      competition form, profile and onboarding each have exactly one `autocomplete="no-autofill"`
      attribute, and selecting from our list still saves.
      *Partly covered:* the e2e assertion checks the competition-form country input, and the
      selection flows pass on all three pages. Profile and onboarding were not checked in the DOM by
      hand.
- [x] 8. Run `graphify update .`.
- [ ] 9. Deploy to the test environment and ask the #118 reporter to confirm on Win10 Chrome with
      saved addresses:
      - no Chrome popup on Country or phone prefix
      - no double popup when clicking the trigger arrow
      - selection saves
      - Location and Postal code still autofill

      If the popup is still there, switch the constant to `'one-time-code'` and repeat. If that
      fails too, amend the plan for fallback B. Close #118 only after the reporter confirms.
- [ ] 10. After merge, run **`/feature-doc`** to write `05-workflow.md` (lifecycle close-out).

## Open questions

1. If candidate 2 (`'one-time-code'`) ends up being used, is the possible SMS-code suggestion on
   mobile keyboards acceptable? Or should we skip it and go straight to fallback B?
2. The design names only the reporter for verification. Should we also add a comment on #118 that
   explains what to test? This plan assumes yes, written by you.
