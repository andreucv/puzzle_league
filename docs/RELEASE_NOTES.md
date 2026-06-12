# Release notes — developer guide

> Status: convention proposed with the `release-notes` feature
> ([docs/features/release-notes/04-plan.md](features/release-notes/04-plan.md)). It becomes
> binding once the "What's new" modal ships.

Every **user-visible** feature ships with one small markdown file. A build-time aggregator
collects these files and shows them to returning visitors in a one-time "What's new" modal —
nobody ever edits a central changelog page.

## When to write one

Write a release note when a Participant or Organizer would *notice* the change: new pages,
new actions, redesigns, changed flows. Skip it for refactors, fixes that restore intended
behavior, performance work, and internal tooling. If in doubt, ask: *would we want a returning
user to be told about this?*

## The file

Create `docs/features/<slug>/06-release-note.md` in the same folder as the feature's other
lifecycle docs, in the same PR that ships the feature (or run `/release-note` to draft it):

```markdown
---
slug: entry-tags                 # same join key as the other stage files
feature: Entry tags              # human title, for developers
audience: all                    # all | participant | organizer
released: null                   # set to the merge date when shipping; null = hidden
---
## en
### Tag your entries
You can now add personal tags to your entries to organize your competitions your way.
## es
### Etiqueta tus entradas
Ahora puedes añadir etiquetas personales a tus entradas para organizar tus competiciones a tu manera.
## ca
### Etiqueta les teves entrades
Ara pots afegir etiquetes personals a les teves entrades per organitzar les teves competicions a la teva manera.
```

Rules:

- **All three locales** (`en`, `es`, `ca`), each as a `## <locale>` section containing one
  `###` title line and a short body. Same rule as UI copy in
  [CONTRIBUTING.md](CONTRIBUTING.md), just authored here instead of the translation JSONs
  because notes are content, not chrome.
- **`released` controls publication.** While `null`, the note is excluded from the build. Set
  it to the date the change reaches production (with continuous Vercel deploys, the merge
  date). Dates order the notes — there are no version numbers to bump and no tags to push.
- **One note per feature**, not per commit or per PR. If a feature ships in stages, write the
  note when the user-facing part lands.

## Writing style

- Address the user ("You can now…"), not the codebase ("Refactored entry model…").
- Use the domain terms from [glossary.md](glossary.md): Competition, Category, Entry,
  Registration — never Record or Inscription.
- Title ≤ ~50 characters; body 1–3 sentences. The modal shows up to the 3 newest notes — be
  scannable.
- Say what the user can *do* now and where, not how it was built.

## How it reaches users (for context)

`src/lib/server/release_notes.ts` globs every `06-release-note.md` at build time. The root
layout compares the newest `released` date against the visitor's `last_seen_release` cookie and
passes any unseen notes to `WhatsNewModal.svelte`; dismissing the modal updates the cookie.
First-time visitors get the cookie set silently and see nothing. Details in
[features/release-notes/04-plan.md](features/release-notes/04-plan.md).

## Definition of done

A user-visible feature is complete when `05-workflow.md` **and** `06-release-note.md` exist —
the release note with `released` set once the feature is live. The feature-doc gate hook
reminds you about both.
