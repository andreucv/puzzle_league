---
slug: category-live-auto-stop
stage: ideas
feature: Category live auto-stop control
issue: null
status: draft
created: 2026-06-14
updated: 2026-06-14
related:
  - docs/features/category-live-auto-stop/01-problem.md
  - docs/features/category-live-auto-stop/03-design.md
  - docs/features/category-live-auto-stop/04-plan.md
---

# Category live auto-stop control — Ideas

Problem: [docs/features/category-live-auto-stop/01-problem.md](01-problem.md)

The scheduler/webhook plumbing is sound; the work is a **targeted refactor**, not a rewrite. The
candidate directions below differ along three axes that were pressure-tested with the organizer:
**(A) data model, (B) endpoint/UI shape, (C) resume behavior**. Chosen answers are marked ✅.

## Candidate directions

### Option A — Unified toggle, message-id is the source of truth ✅ (recommended)

**What:** Add one organizer-only endpoint `PATCH /api/categories/[id]/auto-stop` ( `{ enabled }` )
that arms/disarms auto-stop in **UPCOMING and LIVE** states by scheduling/canceling the QStash
message against the *current* remaining time. The existing `/start` checkbox stays (organizer's
"arm before pressing Start" flow), and `CategoryCard.svelte` gains a real toggle in the LIVE strip
(replacing the read-only badge) reflecting `autoStopMessageId != null`.

**Data/powered by:** `Category.autoStopMessageId` becomes the single source of truth for
"armed" (`armed = autoStopMessageId != null`). The `autoStop` boolean is demoted/removed
(per chosen data-model direction ✅). Remaining time is derived from existing fields
(`realStartTime`, `startTime`, `endTime`, `extraMinutes`) — no new columns.

**Stop → resume (chosen: re-arm automatically ✅, carrying the paused time):** `stop` **stops
canceling** the QStash message — the webhook is already idempotent for STOPPED/COMPLETE/CANCELED
([`auto-stop-webhook.ts:27-31,67-70`](../../../src/lib/services/auto-stop-webhook.ts)), so a
message that fires during a pause harmlessly no-ops. This keeps `messageId != null` true across the
pause, so "armed" survives without reintroducing an intent flag. `resumeCategory` then **reschedules**
to `now + remaining-at-stop`, where `remaining-at-stop = originalDeadline − realEndTime`. This
satisfies the organizer's note that resume must *add the time the category was stopped* — the
countdown effectively continues from where it froze. `complete`/`cancel` keep canceling the message.

**Req coverage:** Req 1 — new endpoint is `categoryOrganizer`-guarded, and `/start`'s autoStop
portion gets an organizer check (judges can start, but not arm). Req 2 — the unified endpoint +
LIVE toggle. Req 3 — keep current add-time reschedule, retargeted onto `messageId`.

**Effort:** Medium. **Trade-off:** A scheduled message may fire once during a STOPPED pause and
be discarded — one wasted webhook call, accepted for a simpler, intent-free model. Read sites
(badge/card/`events/types.ts`) must switch from `autoStop` to the derived `armed`.

### Option B — Two explicit fields: intent + scheduled-handle

**What:** Same endpoint/UI as A, but keep both columns with clean, separated meaning:
`autoStop` = persisted organizer *intent*; `autoStopMessageId` = current QStash handle. `stop`
cancels the message (id → null) but preserves `autoStop`; `resume` reschedules iff `autoStop`.

**Data/powered by:** Both `Category.autoStop` and `Category.autoStopMessageId`, kept consistent.

**Effort:** Medium. **Trade-off:** Two fields to keep in sync (the exact class of bug we're
fixing), but no QStash message ever lingers during a pause and intent is explicit/queryable.
Not chosen — the organizer preferred deriving from `messageId`.

### Option C — Minimal patch (no model change)

**What:** Just add the LIVE toggle + endpoint and server-side organizer guard; reset `autoStop`
to `false` on disable/stop to fix the stale badge. Leave the field conflation otherwise intact.

**Effort:** Quick. **Trade-off:** Fastest path to satisfy the three requirements, but leaves the
non-atomic reschedule and intent/state conflation as latent debt; resume re-arm would need bespoke
handling. Reasonable fallback if timeline is tight.

## Recommendation

**Option A.** It matches both organizer choices (derive-from-`messageId`, auto re-arm on resume),
removes the conflation that causes the stale-badge bug, and makes the paused-time requirement fall
out of the resume reschedule for free. Alongside it, fold in the cross-cutting fixes from the
problem doc: organizer guard on `/start`'s autoStop flag, dedicated `NotificationType` values,
remove debug logs, and make a `null` scheduler (QStash unconfigured) surface a clear error to the
organizer instead of a silent no-op.

**Left out of scope:** making `rescheduleAutoStop` transactional/atomic across the two QStash
calls (tracked as an open question for design — idempotent retry vs. accepting the small window).

## Open questions for design (Stage 3)

1. **Disable mid-LIVE then resume:** confirmed it must *not* re-arm. Under Option A this needs the
   disable path to actually cancel the message (id → null) so the pause carries "off" correctly —
   verify the interaction with "stop leaves the message scheduled".
2. **Non-atomic reschedule:** accept the small failure window, or add idempotent retry / a
   reconciliation cron? (See [`qstash-cron-scheduling`](../qstash-cron-scheduling/).)
3. **QStash unconfigured:** block the toggle in the UI, or allow the attempt and show an error
   toast? What is the desired behavior in local/dev without QStash env?
4. **Deadline already passed at resume** (paused longer than remaining): stop immediately, or
   schedule with `notBefore` in the past (QStash delivers ASAP)?
5. **Dedicated notification types:** add `AUTO_STOP_SUCCESS` / `AUTO_STOP_FAILED` enums + locale
   keys (en/es/ca), replacing the `COMPETITION_STARTED` reuse.
6. **Realtime:** should arming/disarming while LIVE emit a `category.*` Ably event so judges' cards
   update live, or is the badge organizer-only?
