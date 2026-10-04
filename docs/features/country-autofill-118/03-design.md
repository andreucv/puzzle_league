---
slug: country-autofill-118
stage: design
feature: Browser autofill breaks the Country combobox
issue: "#118"
status: approved
created: 2026-10-04
updated: 2026-10-04
related:
  - docs/features/country-autofill-118/01-problem.md
  - docs/features/country-autofill-118/02-ideas.md
  - docs/features/country-autofill-118/04-plan.md
---

# Design: Browser autofill breaks the Country combobox

Scope:
- the inline country `Combobox.Input` in
  [competition/edit/[[id=integer]]/+page.svelte](../../../src/routes/(internal)/(auth)/(organizer)/competition/edit/[[id=integer]]/+page.svelte)
  (line 757)
- [CountryCombobox.svelte](../../../src/lib/components/common/CountryCombobox.svelte) (line 74),
  used by profile `UserCard` and onboarding `LocationStep`
- [PhonePrefixCombobox.svelte](../../../src/lib/components/common/PhonePrefixCombobox.svelte)
  (line 104)
- [country_utils.ts](../../../src/lib/utils/country_utils.ts)
- the organizer e2e helper `fillCompetitionDetails` in
  [e2e/competition/organizer.test.ts](../../../e2e/competition/organizer.test.ts) (line 148)

Refs: `docs/CONTRIBUTING.md` (testing expectations).
Problem: [01-problem.md](01-problem.md). Ideas: [02-ideas.md](02-ideas.md).

## Problem

Chrome treats our Country and phone-prefix comboboxes as address or phone fields and shows its own
autofill popup. It ignores the `autocomplete="off"` that Zag sets. When the user picks one of its
suggestions, text is written into the input but no combobox item gets selected, so nothing is saved
and the field looks blank. Chrome's popup also stays on top of our own list. **Guiding principle:**
values in these fields come only from our list. The browser should never offer to fill them.

## Design

### 1. One shared "no autofill" token

Add an exported constant to `src/lib/utils/country_utils.ts`. All three components already import
from this file:

```ts
/**
 * `autocomplete` value for text-input comboboxes (country, phone prefix).
 * Chrome ignores Zag's default `autocomplete="off"` on address-like fields and shows its own
 * autofill popup, whose choice the combobox never selects (#118). A non-`off` token suppresses it.
 */
export const COMBOBOX_NO_AUTOFILL = '<token>' as FullAutoFill; // type from 'svelte/elements'
```

The cast is needed because Svelte types `autocomplete` as the standard `FullAutoFill` union, and a
non-standard token fails `svelte-check`.

`<token>` is the first value from the list below that the reporter confirms works (see §4).

| Order | Candidate | Note |
|---|---|---|
| 1 | a non-standard token, e.g. `"no-autofill"` | Means nothing to any browser. Chrome shouldn't classify the field as address or phone from it. |
| 2 | `"one-time-code"` | A valid token with no address meaning. Downside: iOS/Android keyboards may offer SMS codes, which looks odd on mobile. |
| — | none works | Switch to fallback B from [02-ideas.md](02-ideas.md): remove the "country"/"phone" hints from the visible input. |

### 2. Apply it to every text-input combobox

Pass `autocomplete={COMBOBOX_NO_AUTOFILL}` on `Combobox.Input` in the three places listed under
Scope. Nothing else in the markup or behavior changes:
- The competition form keeps its hidden `name="country"` input (line 736).
- Filtering, diacritic folding, probable-country sorting and `onValueChange` handling stay as they
  are.

**Why this works:** Skeleton's `Combobox.Input` builds its attributes with
`mergeProps(combobox().getInputProps(), rest)`. Zag's `normalizeProps` lowercases `autoComplete` to
`autocomplete`, and `mergeProps` lets the later value win. The rendered `<input>` therefore has a
single `autocomplete="<token>"` attribute, with no duplicate and no conflict.

### 3. Resulting behavior

| Situation | Before | After |
|---|---|---|
| Focus Country on the competition form (Chrome with saved addresses) | Chrome's popup appears. Picking a suggestion leaves the field blank. | No Chrome popup. Typing filters our list. |
| Click the combobox trigger arrow | Our list opens under Chrome's popup, which stays on top. | Only our list opens. |
| Profile / onboarding country, phone prefix | Same failure as above (likely) | Same fix |
| Location, Postal code (plain inputs) | Chrome autofill works | Unchanged. Still autofill normally. |
| Firefox / Safari | Only our list | Unchanged. The token doesn't affect typing or selection. |

### 4. Verification

- **Manual (the only real proof):** the #118 reporter checks on the test environment (Win10,
  Chrome, with saved addresses) that the country and phone-prefix inputs no longer show Chrome's
  popup and that picking from our list still saves. If the popup is still there, ship the next
  candidate from §1, then fallback B. Close #118 only after the reporter confirms.
- **Automated regression guard:** in `fillCompetitionDetails`, assert
  `await expect(page.getByTestId('country-input')).toHaveAttribute('autocomplete', COMBOBOX_NO_AUTOFILL)`.
  This catches a Skeleton or Zag upgrade that stops our prop from winning the merge. It can't prove
  that Chrome actually suppresses the popup.
- The existing e2e flows (`country-input`, `phone-prefix-input`, `onboarding-phone-prefix`) must
  stay green, which shows typing and selection still work.

## Data / model impact

**None.**
- No schema, query, loader, action or API change. `Competition.country` and `User.country` stay
  ISO codes and are written through the same hidden input or bound value as today.
- No translation keys are added.
- The only non-markup change is one exported constant.

## Out of scope

- Supporting Chrome autofill (mapping autofilled names to ISO codes).
- Making the competition form reuse `CountryCombobox` instead of its inline copy (which has no
  folding and no probable-country sorting).
- Pre-filling a probable country on the competition form.
- Changing Location or Postal code autofill.

## Open questions

All resolved during grilling:

| # | Question | Decision |
|---|---|---|
| 1 | Which token? | Ordered candidates (§1). The first one the reporter confirms is kept. Fallback B if none work. |
| 2 | Same token for phone prefix? | Yes, one token for all three. |
| 3 | Literal or constant? | Shared constant `COMBOBOX_NO_AUTOFILL` in `country_utils.ts`. |
| 4 | Duplicate/conflicting attribute with Zag's `autoComplete`? | No. It is lowercased by `normalizeProps`, and ours wins in `mergeProps` (§2). |
| 5 | Regression guard? | JSDoc on the constant plus one e2e attribute assertion (§4). |
| 6 | Who verifies? | Only the reporter, on the test environment (§4). |
| 7 | Double popup? | Expected to go away with the main fix. The reporter confirms it in the same check. |
