---
slug: release-notes
stage: problem
feature: Automated "What's new" release notes
issue: null
status: draft
created: 2026-06-12
updated: 2026-06-12
related:
  - docs/features/release-notes/02-ideas.md
  - docs/features/release-notes/04-plan.md
---

# Problem: users never learn about new features

The platform ships user-visible improvements continuously (entry tags, results redesign,
how-it-works guides, …) but there is no channel that tells Participants and Organizers what
changed. Returning users only discover new features by accident.

## What we want

1. **A "What's new" prompt** shown once per user, the first time they visit after a feature
   ships, then never again for that feature. Seen-state tracked client-side (cookie such as
   `lastVersionSeen` or similar — no login required).
2. **Automated content creation.** Writing the notes must not be a separate chore of editing a
   central page per feature. The content should fall out of work the team already does, with at
   most one small, well-defined step per feature, backed by a written convention developers can
   follow consistently.

## Constraints observed in the repo

- No git tags, no GitHub Releases, no `.github/workflows` CI; deploys are continuous via Vercel
  on push. `package.json` version (0.3.0) is not systematically bumped.
- Commit messages are free-form — they cannot feed a changelog generator as-is.
- User-visible copy must exist in `en`, `es`, `ca` ([docs/CONTRIBUTING.md](../../CONTRIBUTING.md)).
- Every non-trivial feature already produces structured markdown with frontmatter under
  `docs/features/<slug>/` ([docs/features/README.md](../README.md)), enforced by skills and a
  Stop hook — this is the strongest existing raw material for automation.
- PostHog (`posthog-js`) is already integrated; Prisma/Postgres is available if persistence were
  ever needed.

## Out of scope

- Marketing/email announcements.
- A public roadmap or feedback collection.
