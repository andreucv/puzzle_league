# Release notes process

This document defines the end-to-end pipeline that turns developer commits into a
user-facing **"What's New"** entry, and how to implement it. It is intentionally simple:
automation owns the mechanical parts (versioning, changelog), and a single human-reviewed
copywriting gate owns the voice.

## Overview: the four stages

```
1. COMMIT            2. RELEASE                3. COPYWRITE                4. SURFACE
Conventional      release-please Action     "What's New" draft         in-app modal/page
Commits  ───────▶  Release PR ──(merge)──▶  (AI-seeded, human-edited) ──▶ via i18n entries
+ commitlint       CHANGELOG.md + tag        en / es / ca               (en / es / ca)
                   + GitHub Release
```

Two audiences, two documents — never share one:

| | `CHANGELOG.md` | "What's New" |
|---|---|---|
| Audience | developers | end users (players / organizers / admins) |
| Source | automatic, from conventional commits | hand-polished from the changelog |
| Tone | terse, technical | conversational (see `docs/release_notes_guidelines.md`) |
| Localized | no | **yes — en / es / ca** |
| Owner | release-please | copywriting gate (human-reviewed) |

## Assessment of the chosen tools (validated June 2026)

The stack — **Conventional Commits → commitlint → release-please** — is the canonical,
well-supported combination. Notes and caveats:

- **Conventional Commits + commitlint** — correct enforcement layer. `@commitlint/cli` and
  `@commitlint/config-conventional` (v21) and `commitlint.config.js` are already installed,
  but nothing invokes them yet (see Stage 1 to wire a hook + CI).
- **release-please** — sound, with two hard requirements:
  - ⚠️ The hosted **"release-please" GitHub App was shut down (Aug 2025)**. The only
    supported path is the **GitHub Action**, which is what we use here.
  - ⚠️ The org **renamed from `google-github-actions` to `googleapis`**. Use
    `googleapis/release-please-action@v4`. Old references break.
- **Squash-merge gotcha** — if PRs are squash-merged, the **PR title** becomes the commit on
  `main`, so the PR title must itself be a valid conventional commit. Lint PR titles (Stage 1)
  or use the "merge" strategy.

Sources:
[release-please-action](https://github.com/googleapis/release-please-action) ·
[manifest/config docs](https://github.com/googleapis/release-please/blob/main/docs/manifest-releaser.md) ·
[App turndown #2569](https://github.com/googleapis/release-please/issues/2569) ·
[org-rename breakage #2288](https://github.com/googleapis/release-please/issues/2288)

---

## Branching model

Vercel deploys `test` → **preview** and `main` → **production**. release-please fits this with
one principle: **a "release" means *what's in production*, so release-please runs on `main` only.**
`test` stays a plain preview branch with no release-please — versions, tags, `CHANGELOG.md`, and
"What's New" all describe production.

```
feat/xyz ──PR(conventional title)──▶ test ──▶ Vercel preview  (QA here)
                                       │
                                       └──PR──▶ main ──▶ release-please opens/updates Release PR
                                                          │
                                                merge Release PR ──▶ tag + GitHub Release + What's New draft
                                                          │
                                                          └──▶ Vercel production
```

1. Short-lived branches → PR into `test`. Preview deploy. QA.
2. When a batch is ready, PR `test` → `main`.
3. release-please sees the new conventional commits on `main` and maintains the **Release PR**.
4. Merge the Release PR when you want to cut the release → tag, GitHub Release, and the Stage 3
   "What's New" draft fire.

### The rule that makes or breaks it: merge strategy

release-please can only build a changelog from **conventional commits visible on `main`**.

| Merge | Strategy | Why |
|---|---|---|
| `feat/xyz` → `test` | **Squash is fine** — but the **PR title must be a conventional commit** (it becomes the commit). Merge commit also works. | Collapses messy WIP into one clean `feat:`/`fix:` commit. |
| `test` → `main` | **Merge commit or rebase — NEVER squash.** | Squashing `test`→`main` collapses *every* feature into one commit, so the changelog gets one line instead of one per feature. A merge/rebase carries each conventional commit onto `main` so release-please categorizes them individually. |

Enforce the second row in repo settings/habits — it is the single most important constraint.

### Nuance: features reach production before the release is cut

Because `main` = production in Vercel, features go **live the moment `test`→`main` merges** —
*before* you merge the Release PR. Sequence: features deploy to prod → merge Release PR (adds
version + changelog, triggers a second tiny prod deploy) → "What's New" published. This small lag
is acceptable for this app. If you ever need *nothing in production until formally released*, you
would decouple Vercel production from `main`-push and tie it to tags/releases instead — more moving
parts, deliberately out of scope for now.

### Versioning across environments

The app version shown in the header comes from `package.json`, baked at **build time** by
`vite.config.ts` (`__APP_VERSION__ = JSON.stringify(pkg.version)`) and surfaced in
`src/routes/+layout.server.ts` as `appVersion`, alongside `commitSha`
(`VERCEL_GIT_COMMIT_SHA`) and `isPreview` (`VERCEL_ENV === 'preview'`).

The same versioning story is shown at two resolutions:

- **Production (`main`)** shows the official semver from `package.json`, owned by release-please.
  One bump **per release**, aggregating all the `feat:`/`fix:` commits since the previous
  release — the *kind* of change decides the bump, not the count (`feat:` → minor, only
  `fix:`/`perf:` → patch, `!`/`BREAKING CHANGE` → major). Example: `v0.5.0`.
- **Preview (`test`)** shows the **last shipped** semver plus a per-commit build counter:
  **`v0.5.0-b7`**. `b7` = the 7th commit on `test` since the `v0.5.0` release tag; it increments
  on every commit you push to `test`, giving QA an orderable "which build is this" number. Each
  `bN` maps to exactly one commit, so it pinpoints the build on its own (no SHA needed). After the
  next release ships (e.g. `0.6.0`) and is back-merged, the base rolls forward and the counter
  resets (`v0.6.0-b1`).

The semver in `package.json` is **never** rewritten per commit — release-please is its only
writer. `bN` is **derived at build time** (from git, in `vite.config.ts`) and shown only when
`isPreview`.

| Environment | Header shows | Means |
|---|---|---|
| Production (`main`) | `v0.5.0` | the shipped release (the aggregation of its commits) |
| Preview (`test`) | `v0.5.0-b7` | 7th build since shipping 0.5.0; bumps every commit |

Implementation notes / caveats:

- **Counter source:** commits since the last release tag, e.g. `git rev-list --count <lastTag>..HEAD`.
  Vercel shallow-clones by default, so the build may lack tags/history — verify and, if needed,
  fetch tags / unshallow in the build (or fall back to a tag-independent count). Resolve when
  implementing checklist item 4c.
- **Ordering footnote:** `-bN` is a single alphanumeric semver prerelease identifier, so strict
  semver tools sort `b10` *before* `b9` (lexical). Irrelevant for the human-read header; if you
  ever sort these programmatically, use `-b.N` (the dot makes `N` numeric) instead.

**File divergence between `main` and `test` is narrow and safe.** Only two files drift:
`package.json` (version line) and `CHANGELOG.md`. A `test`→`main` merge **cannot** regress
`main`'s version, because git 3-way-merges the line only one side changed:

```
ancestor 0.4.0 | main 0.5.0 (release-please bumped) | test 0.4.0 (untouched)
merge test → main  →  0.5.0   (no conflict, no downgrade)
```

**Back-merge after each release — now part of the version story, not just tidiness.** After
merging the Release PR into `main`, merge `main → test` (standard git-flow "merge release back
into develop"). This does two jobs: it pulls the bump + new `CHANGELOG.md` back into `test`, and
it makes the new release tag reachable from `test` so the preview counter's **base advances and
resets** (`v0.5.0-b12` → `v0.6.0-b1`). Skip it and the base stays on the old release while
`bN` just keeps climbing. Automatable on `release_created`.

### Practical notes

- Run the commitlint PR-title check (Stage 1) on PRs targeting **both** `test` and `main`.
- release-please creates a `release-please--branches--main` branch for its Release PR; Vercel spins
  a harmless preview for it — ignore it.
- To preview the upcoming changelog from `test`, release-please has a `target-branch` input — skip
  it for now.

---

## Stage 1 — Commit: Conventional Commits + commitlint

Commit messages follow the [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/#specification),
enforced by [commitlint](https://commitlint.js.org). The config already exists
(`commitlint.config.js` → `@commitlint/config-conventional`). Two things still need wiring:

1. **Local `commit-msg` hook** (fast feedback before push). Either add husky, or a plain hook
   that runs `pnpm exec commitlint --edit "$1"`.
2. **CI guard on PRs** — lint the PR title (the future squash commit) on every pull request:

   `.github/workflows/commitlint.yml`
   ```yaml
   name: commitlint
   on:
     pull_request:
       types: [opened, edited, synchronize, reopened]
   permissions:
     contents: read
   jobs:
     lint-pr-title:
       runs-on: ubuntu-latest
       steps:
         - run: echo "${{ github.event.pull_request.title }}" | npx --yes commitlint
   ```

Commit type → changelog mapping is controlled in Stage 2 (`changelog-sections`). Use
`feat:` / `fix:` for anything users should see; `chore:` / `docs:` / `refactor:` / `test:`
stay hidden from the public changelog.

---

## Stage 2 — Release: release-please GitHub Action

release-please watches `main`. As `feat:`/`fix:` commits land, it maintains a standing
**Release PR** that accumulates the version bump + `CHANGELOG.md`. Merge that PR when you want
to ship — it then tags the commit, bumps `package.json`, and publishes a **GitHub Release**.
This is how "release sometime after features are committed" works: you control timing by
choosing when to merge.

### Step 2a — Seed config files at repo root

Current version is `0.4.0`; seed the manifest so versioning continues from there.

`release-please-config.json`
```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-sections": [
        { "type": "feat", "section": "✨ Features" },
        { "type": "fix", "section": "🐛 Bug Fixes" },
        { "type": "perf", "section": "⚡ Performance" },
        { "type": "revert", "section": "Reverts" },
        { "type": "docs", "section": "Documentation", "hidden": true },
        { "type": "chore", "section": "Misc", "hidden": true },
        { "type": "refactor", "section": "Refactors", "hidden": true },
        { "type": "test", "section": "Tests", "hidden": true }
      ]
    }
  }
}
```

`.release-please-manifest.json`
```json
{ ".": "0.4.0" }
```

### Step 2b — The workflow

`.github/workflows/release-please.yml`
```yaml
name: release-please
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  issues: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - id: release
        uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json

      # Stage 3 trigger — runs ONLY when a release was actually cut.
      # Kept in this same job on purpose: events from GITHUB_TOKEN do not
      # trigger separate workflows, so chaining here avoids needing a PAT.
      - if: ${{ steps.release.outputs.release_created }}
        run: echo "Released ${{ steps.release.outputs.tag_name }} — open What's New draft"
```

The default `GITHUB_TOKEN` is sufficient. Only switch to a PAT if you ever need the release to
trigger a *separate* workflow (it won't cascade with `GITHUB_TOKEN`).

Useful outputs: `release_created` (bool), `tag_name`, `version`, `major`/`minor`/`patch`,
`body` (the release notes).

---

## Stage 3 — Copywrite: the "What's New" gate

This is the only non-automated stage, and deliberately so — tone and judgment can't be
generated mechanically. It is **AI-seeded, human-reviewed**.

**The "What's New" content is ordinary app content, not a main-only artifact.** The
`whats-new.json` entries live in `src/lib/translations/` (Stage 4) and ride `test → main` like
any code, so they build into the **Vercel preview**. That means you author and **QA the exact
WhatsNewModal your users will see on `test`/preview, before it ever reaches `main`** — which is
the whole point. release-please does *not* gate it.

**When to author:** during development, keyed to the upcoming release. Maintain a single
`unreleased` entry that preview shows (gate on `isPreview`, or an entry `status: "draft"`), so
QA and preview users see the granular, in-progress "What's New" paired with the matching
`v0.5.0-bN` build. On release it is finalized and its version key set.

**Optional auto-seed (convenience, not a gate):** the `release_created` step in the
release-please workflow can open a draft PR seeded with `steps.release.outputs.body` to jump-start
the copy. This only *speeds up* drafting; it never blocks testing on preview.

**Drafting:** from the accumulating changelog / release body + `docs/release_notes_guidelines.md`
(summary-first, conversational tone, watch the word count), draft the user-facing copy in
**en / es / ca**. A Claude prompt/skill is a good fit for the first draft; a maintainer edits and
merges.

**Output format** — one entry per version, localized (see Stage 4 for the schema). Keep it
short: a `title` and a few bullet-free sentences, optionally a "highlights" list. Only include
changes users feel — skip internal refactors even if they appear in `CHANGELOG.md`.

---

## Stage 4 — Surface: in-app "What's New" via i18n

Decision: user-facing notes live as **localized translation entries** and render in a
`<WhatsNewModal/>` (or `/whats-new` page). This reuses the existing sveltekit-i18n setup
(`src/lib/translations/`, locales en/es/ca) and ships through the normal Vercel deploy — no new
infrastructure.

### Storage

Add a `whats-new.json` per locale, loaded under its own namespace key. Mirror the existing
loader pattern in `src/lib/translations/index.js` (each `common.json` is loaded with `key: ''`):

```js
// in config.loaders, add three more entries:
{ locale: 'en', key: 'whatsNew', loader: async () => (await import('./en/whats-new.json')).default },
{ locale: 'es', key: 'whatsNew', loader: async () => (await import('./es/whats-new.json')).default },
{ locale: 'ca', key: 'whatsNew', loader: async () => (await import('./ca/whats-new.json')).default },
```

> ⚠️ **sveltekit-i18n splits keys on `.`** — so a raw version string like `"0.5.0"` as a JSON
> key would be parsed as nested `0 → 5 → 0`. Sanitize version keys (e.g. `v0_5_0`) **or** store
> entries as an array and look up by a `version` field. The array form is recommended because it
> also preserves order for "show me everything since my last visit".

`src/lib/translations/en/whats-new.json` (array form)
```json
{
  "releases": [
    {
      "version": "0.5.0",
      "date": "2026-06-20",
      "title": "Faster results and clearer waitlists",
      "summary": "Results now load instantly, and the waitlist shows your exact position.",
      "highlights": [
        "Live results refresh without reloading the page",
        "Your waitlist position is now visible at a glance"
      ]
    }
  ]
}
```
`es/whats-new.json` and `ca/whats-new.json` mirror the same `version`/`date` with translated copy.

### Rendering

- Read `$t('whatsNew.releases')`, find entries newer than the version the user last saw
  (persist "last seen version" per user — localStorage or a user setting), and show them in a
  modal/page. Mark as seen on dismiss.
- **Preview shows the upcoming entry:** when `isPreview` (or for a draft/`unreleased` entry),
  render the in-progress "What's New" so QA/preview users see what's coming, paired with the
  `v0.5.0-bN` build. Production renders only released entries.
- Keep it scoped to what users feel; the technical detail stays in `CHANGELOG.md`.

---

## End-to-end checklist (implementation order)

1. [ ] Wire commitlint: local `commit-msg` hook + `.github/workflows/commitlint.yml` (PR-title lint).
2. [ ] Add `release-please-config.json` + `.release-please-manifest.json` (seed `0.4.0`).
3. [ ] Add `.github/workflows/release-please.yml` (Stage 2b).
4. [ ] Confirm GitHub repo setting: allow Actions to create and approve pull requests.
4b. [ ] Enforce merge strategy (Branching model): `test`→`main` is merge/rebase, **never squash**.
4c. [ ] Render version in the header: `v{appVersion}` in prod, `v{appVersion}-b{N}` in preview (N = commits since last release tag; resolve the Vercel git-depth caveat) — see Versioning across environments.
4d. [ ] Back-merge `main`→`test` after each release: syncs `package.json` + `CHANGELOG.md` **and** resets the preview counter base (`v0.6.0-b1`).
5. [ ] Add the `release_created` step that opens the "What's New" draft (Stage 3).
6. [ ] Add `whats-new.json` (en/es/ca) + loaders in `index.js`; build `<WhatsNewModal/>` (Stage 4).
7. [ ] Document the shipped behavior under `docs/features/<slug>/` once built (feature lifecycle).
