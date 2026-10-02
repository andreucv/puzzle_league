---
slug: registration-open-alerts
stage: problem
feature: Notify participants when a closed category's registration opens
issue: null
status: approved
created: 2026-10-02
updated: 2026-10-02
related:
  - docs/features/registration-open-alerts/02-ideas.md
  - docs/features/registration-open-alerts/03-design.md
  - docs/features/registration-open-alerts/04-plan.md
  - docs/features/per-category-registration-90/04-plan.md
  - docs/workflows/registration-workflow.md
---

# Notify participants when a closed category's registration opens — Problem

## Context

Since #90 ([per-category-registration-90](../per-category-registration-90/04-plan.md)),
registration is open or closed **per Category** (`Category.registrationOpen`, default `false`),
and organizers can schedule an opening (`Category.registrationOpensAt`, fired by the QStash
webhook `src/lib/services/registration-open-webhook.ts`). A Competition counts as open when any
`NOT_STARTED` Category is open (`hasOpenRegistration`, `src/lib/utils/registration_utils.ts`).

Participants meet a closed Category in two places:

- **Competition details** (`src/routes/(internal)/competitions/competition_details/[id=integer]/+page.svelte`):
  the single `RegistrationActionButton` is disabled with "registration closed" when no Category is
  open (`src/lib/components/registration/RegistrationActionButton.svelte:37-53`).
- **Registration page** (`…/[id=integer]/registration/+page.svelte`, login required by its
  `+page.server.ts`): a closed Category shows "Registration opens on …" when scheduled, or
  "Registration closed" otherwise (`+page.svelte:1044-1049`). When nothing is open the page shows
  `registration-closed-warning` (`+page.svelte:566-571`).

## Problem

1. **No way to be told when registration opens.** A participant who finds a Category closed can
   only keep checking back. Nothing in the product records interest in a closed Category.
2. **Openings notify only the organizer.** The scheduled-opening webhook sends `REGISTRATION_OPENED`
   to the Competition creator only (`registration-open-webhook.ts`), and a manual open via
   `toggleCategoryRegistration` (`src/lib/services/registration-workflow.ts`) sends nothing.
3. **Limited spots reward being early.** Categories have `maxParties` and a waitlist. A participant
   who learns late that a Category opened may land on the waitlist or miss it entirely.
4. **The "opens on" date is a passive hint.** Even when a scheduled time is shown, the participant
   must remember it. Nothing reminds them, and the organizer can move or cancel the schedule
   without anyone being told.
5. **The registration page is hard to reach in the common waiting case.** When every Category is
   closed (a Competition that hasn't opened yet), the details-page button is disabled, so
   participants can't reach the registration page through the UI. Anything that lives only on
   the registration page would be invisible exactly when waiting matters most.

## Who it affects & why it matters

- **Participants** (primary): they miss openings, have to poll the page, and lose spots to people
  who happened to check at the right moment. That is frustrating and feels unfair for popular
  Competitions.
- **Organizers**: they get fewer early registrations and more "when does it open?" questions. They
  have no way to see how much demand a closed Category has before opening it.
- **Status quo cost**: registration opening is now explicitly per Category and schedulable, which
  makes "closed for now" a normal, longer-lived state than before. The gap above therefore comes
  up more often.

## Constraints / prior ideas

- **User's idea:** a bell icon on closed Categories (upcoming Competitions) on the registration
  page. Clicking it adds the user to a list, and they are notified when that Category's
  registration status changes (opens).
- **Existing notification infrastructure:** `dispatchNotifications` (`src/lib/notifications/dispatcher.ts`)
  persists in-app `Notification` rows and emails only the types in `EMAIL_ENABLED_TYPES`. There
  is no push channel. Timeliness depends on the channel chosen.
- **Two opening paths must both trigger it:** the manual toggle and the scheduled QStash webhook.
- The registration page requires login, so subscribers are known `User`s.
- Keep it simple. Follow the existing notification and registration-workflow seams (see
  [registration-workflow.md](../../workflows/registration-workflow.md)).

## Open questions

1. **Scope of the subscription:** per Category (as proposed) or per Competition ("any category
   opens")? Where should the bell live, given that the registration page is unreachable when
   everything is closed (Problem 5): details page, registration page, or both?
2. **Which events notify:** only "opened" (manual or scheduled), or also "opening scheduled" or
   "schedule changed"? Is the subscription one-shot (removed after it fires) or persistent
   across re-open cycles?
3. **Channel:** in-app only, or also email (needed for timeliness when the user isn't on the
   site)? How does this fit `EMAIL_ENABLED_TYPES` and user expectations about email volume?
4. **Who can subscribe:** participants already registered in another Category of the same
   Competition? Anonymous visitors (who would have to log in first)?
5. **Organizer visibility:** should organizers see how many people are waiting for a Category?

## Answers (2026-10-02)

1. **Per Category.** Users follow individual Categories. The visible placement must account for
   Problem 5: an unlogged visitor on the competition details page sees the control disabled, with
   a prompt to log in to be notified, so the details page is in scope.
2. **Notify on any registration status change** of the followed Category, whether manual
   (`toggleCategoryRegistration`) or scheduled (QStash webhook).
3. **Email is required**; in-app is welcome as well.
4. **Any logged-in user** can follow. Unlogged visitors see a disabled control asking them to log
   in.
5. **Yes**: organizers should see how many people are waiting (following) per Category.
