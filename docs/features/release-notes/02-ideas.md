---
slug: release-notes
stage: ideas
feature: Automated "What's new" release notes
issue: null
status: draft
created: 2026-06-12
updated: 2026-06-12
related:
  - docs/features/release-notes/01-problem.md
  - docs/features/release-notes/04-plan.md
---

# Ideas: where does release-notes content come from?

The frontend part (cookie + modal) is the same in every option; what differs is **how the
content is produced**. Five candidate sources, evaluated against this repo.

## Option A — Per-feature release-note file in `docs/features/` (recommended)

Each user-visible feature gets one extra, tiny stage file:
`docs/features/<slug>/06-release-note.md` — frontmatter (`slug`, `audience`, `released` date)
plus a short user-facing title/body in `en`/`es`/`ca`. A build-time aggregator
(`import.meta.glob` over the folder, no CI needed) turns all of them into the data the
"What's new" modal renders. Publishing = setting the `released` date; no central file is ever
edited.

- **Pros:** rides the existing feature-lifecycle convention and its enforcement hook (the same
  mechanism that already nags for `05-workflow.md` can nag for `06-release-note.md`); the
  drafting itself is automatable by a skill that reads `01–05` and the diff; content is written
  *in the PR that ships the feature*, by the person with the most context; native `en/es/ca`
  support; no merge conflicts on a shared changelog page; no new infrastructure, tags, or
  version-bump discipline (date-based, not semver-based).
- **Cons:** one small file per feature is still a (low, enforceable) human step; content lives
  in the repo, so fixing a typo needs a deploy.

## Option B — GitHub Releases generated from PR titles

Adopt tags + GitHub Releases, let GitHub auto-generate notes from merged PR titles, and have the
app fetch the latest release (at build time or runtime) to feed the modal.

- **Pros:** zero new files; standard GitHub workflow; release notes also visible on GitHub.
- **Cons:** requires disciplines the repo doesn't have today (tagging, release cadence,
  user-readable PR titles — current history is developer-speak like "Fix svelte checks");
  English-only unless someone translates each release; runtime fetch adds an external dependency
  and an API token; the output is a changelog for developers, not an announcement for
  Participants/Organizers.

## Option C — Conventional commits + changelog tooling (changesets / semantic-release)

Enforce `feat:`/`fix:` commit prefixes or changesets, generate `CHANGELOG.md` and version bumps
automatically, parse it for the modal.

- **Pros:** mature tooling, fully automatic versioning.
- **Cons:** retrains every commit ever written; granularity is wrong (a feature = many commits,
  but the user should see one note); tone is technical; no i18n; needs CI that doesn't exist
  yet. The one good idea in changesets — "a small markdown snippet per change, merged with the
  PR" — is exactly what Option A does, integrated with the conventions this repo already has.

## Option D — PostHog in-app announcements

Use the already-integrated PostHog (surveys / feature flags with payloads) to publish
announcements from the PostHog UI, targeting users who haven't seen them.

- **Pros:** publish and fix copy without deploying; per-person seen-tracking and analytics for
  free; no repo changes at all.
- **Cons:** content lives outside the repo and outside the feature workflow, so nothing about
  its creation is automatable from the feature docs; styling/UX constrained by PostHog
  components; per-locale targeting is manual; couples a product feature to a third-party
  service. Worth keeping as a *complement* (measuring whether notes are read), not as the
  source of truth.

## Option E — Database-backed notes with an admin page

A Prisma `ReleaseNote` model plus an internal admin form; modal reads from the DB; seen-state
could live on the user record.

- **Pros:** non-developers could write notes; publish without deploy; per-user seen-state
  survives devices for logged-in users.
- **Cons:** by far the most code (model, migration, admin UI, API guards); still 100% manual
  writing — it automates nothing; overkill while the team is developer-only.

## Orthogonal choice — tracking "seen" state

- **Cookie (recommended):** readable in `+layout.server.ts`, so the server decides whether to
  render the modal — no client-side flash; works for anonymous visitors. Store the **date of
  the newest seen note** (e.g. `last_seen_release=2026-06-12`), which avoids any semver/bump
  discipline entirely.
- **localStorage:** client-only, causes a flash-of-modal decision after hydration; no SSR.
- **Per-user DB field:** syncs across devices but excludes anonymous users; can be added later
  on top of the cookie without changing the content pipeline.

## Direction

**Option A + cookie tracking**, with Option D's analytics as an optional later complement.
Detailed in [04-plan.md](04-plan.md); the developer convention is written up in
[docs/RELEASE_NOTES.md](../../RELEASE_NOTES.md).
