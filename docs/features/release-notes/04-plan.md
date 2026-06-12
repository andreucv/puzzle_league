---
slug: release-notes
stage: plan
feature: Automated "What's new" release notes
issue: null
status: draft
created: 2026-06-12
updated: 2026-06-12
related:
  - docs/features/release-notes/01-problem.md
  - docs/features/release-notes/02-ideas.md
---

# Implementation Plan: Automated "What's new" release notes

Show returning visitors a one-time "What's new" modal for features shipped since their last
visit. Content is authored as one small markdown file per feature inside the existing
`docs/features/<slug>/` folders (Option A in [02-ideas.md](02-ideas.md)), aggregated at build
time — no central changelog page, no tags, no version bumps, no CI required.

Developer convention: [docs/RELEASE_NOTES.md](../../RELEASE_NOTES.md).
Relevant docs: [docs/features/README.md](../README.md) (feature lifecycle),
[docs/CONTRIBUTING.md](../../CONTRIBUTING.md) (i18n rule, component/service layout).

## Architecture and design

### 1. Content source — `docs/features/<slug>/06-release-note.md`

A new optional stage-6 file per user-visible feature (full template in
[docs/RELEASE_NOTES.md](../../RELEASE_NOTES.md)):

```markdown
---
slug: entry-tags
feature: Entry tags
audience: all            # all | participant | organizer
released: 2026-06-12     # null while unshipped → excluded from the build
---
## en
### Tag your entries
You can now add personal tags to your entries…
## es
### Etiqueta tus entradas
…
## ca
### Etiqueta les teves entrades
…
```

`released` is **date-based, not semver-based**: deploys are continuous on Vercel and
`package.json` versions are not bumped systematically, so dates are the only ordering that needs
no new discipline. Internal-only changes simply never get a stage-6 file.

### 2. Aggregation — build-time, zero infrastructure

`src/lib/server/release_notes.ts`:

- `import.meta.glob('/docs/features/*/06-release-note.md', { query: '?raw', eager: true })`
  pulls every note into the server bundle at build time (works identically in `vite dev` and on
  Vercel — the files exist in the repo at build time).
- A small parser (~40 lines, unit-tested; no new dependency) extracts the frontmatter
  keys and splits the body on `## <locale>` headings. Malformed files fail loudly in dev.
- Exports `getReleaseNotes(): ReleaseNote[]` — `released != null`, sorted newest first — where
  `ReleaseNote = { slug, audience, released, content: Record<Locale, { title, body }> }`.
  Module-level memoization; the glob is static so there is nothing to invalidate at runtime.

### 3. Seen-tracking — cookie read on the server

In [`src/routes/+layout.server.ts`](../../../src/routes/+layout.server.ts) (which already
resolves the locale and user):

- Cookie `last_seen_release` holds the ISO date of the newest note the visitor has seen.
  `path=/`, `SameSite=Lax`, **not** `httpOnly` (the client updates it on dismiss), 1-year expiry.
- Cookie present → `unseenReleaseNotes` = notes with `released >` cookie value, capped at the 3
  newest, filtered to the visitor's locale content, returned in layout data.
- Cookie absent → **brand-new visitor**: set the cookie to the newest note's date via
  `cookies.set(...)` and return an empty list. First-time users should meet the product, not
  its history.

### 4. UI — `WhatsNewModal.svelte`

- `src/lib/components/common/WhatsNewModal.svelte`, rendered from the root
  [`+layout.svelte`](../../../src/routes/+layout.svelte) when `data.unseenReleaseNotes` is
  non-empty. Skeleton UI modal/dialog, matching existing patterns.
- Chrome strings ("What's new", "Got it") are normal translation keys in `en`/`es`/`ca`; the
  note title/body come from the markdown (already locale-resolved by the server). This is a
  deliberate, documented deviation from "all copy in translation files": notes are *content*,
  not UI chrome, and keeping them next to the feature docs is what makes the pipeline
  automatable.
- On dismiss (button or backdrop): `document.cookie = last_seen_release=<newest released date>`,
  close. No server round-trip needed.
- Multiple unseen notes render as a short stacked list in one modal — never one modal per
  feature.

### 5. Developer consistency — convention + enforcement + drafting

- [docs/RELEASE_NOTES.md](../../RELEASE_NOTES.md) is the written convention; link it from the
  PR checklist paragraph of [docs/CONTRIBUTING.md](../../CONTRIBUTING.md).
- The existing feature-doc Stop hook (`.claude/hooks/feature-doc-gate.py`, lives outside this
  clone) already nags when `04-plan.md` exists without `05-workflow.md`; extend it to also nag
  when `05-workflow.md` exists without `06-release-note.md`, unless the plan is marked
  internal-only.
- Add a `/release-note` skill that **drafts** `06-release-note.md` automatically from the
  feature's `01–05` docs and the diff — three locales, user-facing tone, glossary terms,
  `released: null` — so the human step shrinks to review + flipping the date at merge time.

## Tasks

- [ ] **Phase 1 — pipeline**
  - [ ] `src/lib/server/release_notes.ts`: glob import, frontmatter/locale parser,
        `getReleaseNotes()`; Vitest coverage for parser edge cases (missing locale, null
        `released`, bad frontmatter).
  - [ ] Extend `+layout.server.ts`: cookie read/init, `unseenReleaseNotes` in layout data.
  - [ ] `WhatsNewModal.svelte` + render from root layout; chrome translation keys in
        `en`/`es`/`ca` `common.json`; cookie write on dismiss.
  - [ ] Backfill 1–2 real notes for recently shipped features (e.g. `entry-tags`,
        `how-it-works-guides`) so the system launches with content.
  - [ ] Playwright test: seeded cookie with old date → modal appears, dismiss → cookie updated,
        reload → no modal; no cookie → no modal.
- [ ] **Phase 2 — workflow integration**
  - [ ] Link the convention from `docs/CONTRIBUTING.md`; add `06-release-note.md` to the stage
        table in `docs/features/README.md`.
  - [ ] Extend the feature-doc gate hook; add the `/release-note` drafting skill.
- [ ] **Phase 3 — optional**
  - [ ] `/whats-new` archive page listing all notes (reuses `getReleaseNotes()`).
  - [ ] PostHog event on modal shown/dismissed to measure reach.
  - [ ] `audience` filtering once user roles are exposed in layout data.

## Open questions

1. **Who flips `released`?** Proposal: the author sets it to the expected merge date in the PR
   itself (continuous deploys make merge ≈ release). Alternative: leave `null` at merge and
   flip in a tiny follow-up commit when verified in production.
2. **Caching:** the root layout load now varies on a cookie. The results-page cache strategy
   (commit `a3cad25`) must be checked so CDN-cached responses don't leak one visitor's modal
   decision to another.
3. **Logged-in persistence:** is the cookie enough, or should logged-in users get a
   `lastSeenRelease` column later so the seen-state follows them across devices? (Additive —
   does not change this plan.)
