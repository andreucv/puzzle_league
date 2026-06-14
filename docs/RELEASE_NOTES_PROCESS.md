# Release notes process

This document defines the end-to-end pipeline that turns developer commits into a
user-facing **"What's New"** entry, and how to implement it. It is intentionally simple:
automation owns the mechanical parts (versioning, changelog), and a single human-reviewed
copywriting gate owns the voice.

## Overview: the four stages

```
1. COMMIT            2. RELEASE                    3. COPYWRITE                4. SURFACE
Conventional      commit-and-tag-version        "What's New" draft         in-app modal/page
Commits  ──────▶  (bump on `test`;            ─▶ (AI-seeded, human-edited) ─▶ via i18n entries
+ commitlint       tag + Release on merge)       en / es / ca               (en / es / ca)
                   CHANGELOG.md + tag + Release
```

Two audiences, two documents — never share one:

| | `CHANGELOG.md` | "What's New" |
|---|---|---|
| Audience | developers | end users (players / organizers / admins) |
| Source | automatic, from conventional commits | hand-polished from the changelog |
| Tone | terse, technical | conversational (see `docs/release_notes_guidelines.md`) |
| Localized | no | **yes — en / es / ca** |
| Owner | `commit-and-tag-version` | copywriting gate (human-reviewed) |

## The tooling (chosen June 2026)

The stack is **Conventional Commits → commitlint → [commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version)**.

- **Conventional Commits + commitlint** — the enforcement layer. `@commitlint/cli` and
  `@commitlint/config-conventional` (v21) and `commitlint.config.js` are installed, with a
  CI PR-title check (Stage 1).
- **commit-and-tag-version** — a maintained fork of `standard-version`. It is a **local CLI**,
  not a GitHub App or Action: one command bumps `package.json`, regenerates `CHANGELOG.md`, and
  commits `chore(release): X.Y.Z`. We run it with `--skip.tag`, because it is a CLI and not tied
  to a branch push, **on `test` while the `test → main` PR is open** — so the version bump is
  part of the release *before* it merges, not a second round-trip after. The **tag itself is
  created at merge time on `main`** (see Stage 2c), so it lands on the commit that actually ships
  to production.
- **Why we moved off release-please** — release-please runs *on `main`*, so it can only version
  *after* the `test → main` merge. That forced a second Release PR and a second production
  deploy per release. Running `commit-and-tag-version` on `test` collapses the whole thing to a
  **single merge and a single production build**.
- **Squash-merge gotcha** — `commit-and-tag-version` builds the changelog from the conventional
  commits on **`test`**. So the **feature → `test`** PR title (the future squash commit) must be
  a valid conventional commit. Lint PR titles (Stage 1).

Sources:
[commit-and-tag-version](https://github.com/absolute-version/commit-and-tag-version) ·
[config-spec (`.versionrc`)](https://github.com/conventional-changelog/conventional-changelog-config-spec) ·
[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

---

## Branching model

Vercel deploys `test` → **preview** and `main` → **production**. The principle: **a release is
prepared on `test` and shipped by merging it to `main`.** Every release artifact — the version
bump, `CHANGELOG.md`, the tag, and the finalized "What's New" copy — is created **on `test`,
before the merge**. `main` never produces release commits of its own; it only ever fast-advances
to a point on `test`.

```
feat/xyz ──PR(conventional title)──▶ test ──▶ Vercel preview (QA features)
                                       │
                                       │  pnpm release   (bump + CHANGELOG, on test; no tag)
                                       │  promote What's New draft → released
                                       │  git push origin test ──▶ preview (QA the release)
                                       │
                                       └──PR(test → main, merge)──▶ main ──▶ Vercel production
                                                                    │         (single prod build)
                                                                    └──▶ CI tags the merge commit
                                                                         + publishes GitHub Release
```

1. Short-lived branches → PR into `test`. Preview deploy. QA.
2. When a batch is ready, open the `test → main` PR.
3. **Cut the release on `test`:** `pnpm release` bumps the version, regenerates `CHANGELOG.md`,
   and commits (no tag). Promote the draft `whats-new.json` entry to released. Push `test`
   normally. The preview now shows the **exact** release (version, changelog, What's New modal)
   for a final QA pass.
4. **Merge the `test → main` PR.** Features and the version land in production together, in one
   deploy. The push to `main` triggers CI, which tags the merge commit and publishes the GitHub
   Release (Stage 2c).

### Why this is simpler than the old `main`-based model

Because all release commits live on `test` and `main` only advances *to* `test`:

- **No `main`/`test` divergence, no back-merge.** `main` never gets a version bump or changelog
  commit of its own, so there is nothing to merge back into `test`. The next release's bump is
  still computed correctly without a back-merge: the merge commit on `main` (where the tag lands)
  *contains* `test`'s history up to the release point, so `commit-and-tag-version` on `test` sees
  exactly the new commits since the last release.
- **The `test → main` merge strategy no longer affects the changelog.** The changelog is built
  on `test` *before* the merge, so `main` does not need to see the individual conventional
  commits. A merge commit is the default and is fine. (The old "never squash `test → main`" rule
  existed only because release-please read commits on `main`; it no longer applies.)

### The tag lands on the production commit

Because the tag is created by CI **on the `test → main` merge**, it points at the exact commit
that ships to production, and the GitHub Release appears right as the code goes live — no lag and
no manual `git push --follow-tags`. Tag creation adds no commit, so it does **not** trigger a
second Vercel production build.

### Versioning shown in the app

The version comes from `package.json`, baked at **build time** by `vite.config.ts`
(`__APP_VERSION__ = JSON.stringify(pkg.version)`) and surfaced in
`src/routes/+layout.server.ts` as `appVersion`, alongside `commitSha`
(`VERCEL_GIT_COMMIT_SHA`) and `isPreview` (`VERCEL_ENV === 'preview'`).

- **Preview (`test`)** shows the clean release semver from `package.json`. After `pnpm release`
  runs on `test`, that is the **about-to-ship** version (e.g. `0.7.0`), so QA sees the real
  release number paired with the real changelog and What's New modal.
- **Production (`main`)** runs the same `package.json` version; the version badge is rendered
  **only when `isPreview`**, so production shows no badge.

`commit-and-tag-version` is the **only** writer of the semver in `package.json` and the only
creator of tags. The bump *kind* is decided by the commits since the last tag (`feat:` → minor,
only `fix:`/`perf:` → patch, `!`/`BREAKING CHANGE` → major), aggregated into one bump per release.

> There is **no per-commit build counter** (`-bN`). It was removed ("remove build number
> convention"); the header shows the plain semver.

### Practical notes

- Run the commitlint PR-title check (Stage 1) on PRs targeting **both** `test` and `main`.
- `pnpm release` prints a `Run git push --follow-tags … && pnpm publish` hint — ignore it. There
  is no local tag to push (we skip tagging) and this is not a published package; a plain
  `git push origin test` is all you do.
- Preview the upcoming changelog any time without touching anything: `pnpm release:dry`.

---

## Stage 1 — Commit: Conventional Commits + commitlint

Commit messages follow the [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/#specification),
enforced by [commitlint](https://commitlint.js.org) (`commitlint.config.js` →
`@commitlint/config-conventional`):

1. **Local `commit-msg` hook** (optional, fast feedback) — `pnpm exec commitlint --edit "$1"`.
2. **CI guard on PRs** — `.github/workflows/commitlint.yaml` lints the PR title (the future
   squash commit) on every pull request.

Commit type → changelog mapping is controlled in Stage 2 (`.versionrc.json`). Use
`feat:` / `fix:` for anything users should see; `chore:` / `docs:` / `refactor:` / `test:`
stay hidden from the public changelog.

---

## Stage 2 — Release: commit-and-tag-version (local) + tag/Release on merge (Action)

### Step 2a — Config (repo root)

`.versionrc.json` maps commit types to changelog sections (hidden types stay out of the public
changelog):

```json
{
  "types": [
    { "type": "feat", "section": "✨ Features" },
    { "type": "fix", "section": "🐛 Bug Fixes" },
    { "type": "perf", "section": "⚡ Performance" },
    { "type": "revert", "section": "Reverts" },
    { "type": "docs", "section": "Documentation", "hidden": true },
    { "type": "chore", "section": "Misc", "hidden": true },
    { "type": "refactor", "section": "Refactors", "hidden": true },
    { "type": "test", "section": "Tests", "hidden": true },
    { "type": "style", "hidden": true },
    { "type": "build", "hidden": true },
    { "type": "ci", "hidden": true }
  ]
}
```

`package.json` scripts (`--skip.tag`, because the tag is created on merge in Stage 2c):

```json
"release": "commit-and-tag-version --skip.tag",
"release:dry": "commit-and-tag-version --skip.tag --dry-run"
```

Defaults otherwise fit this repo: it bumps `package.json`, regenerates `CHANGELOG.md`, and
commits `chore(release): X.Y.Z`. The bump is computed from the commits since the last release
tag (which follows the existing `v0.6.0` convention).

### Step 2b — The release ritual (on `test`, with the `test → main` PR open)

```bash
pnpm release:dry                      # preview the bump + changelog, no changes
pnpm release                          # bump package.json + CHANGELOG.md, commit (no tag)
# promote the draft whats-new.json entry (en/es/ca) → released, then commit it
git push origin test                  # release commit + What's New
# → preview build = final QA of the exact release
# then merge the test → main PR  → single prod build; CI tags + releases (Stage 2c)
```

### Step 2c — Tag the merge commit + publish the GitHub Release (on merge to `main`)

`.github/workflows/github-release.yaml` runs on every push to `main`. It reads the version from
`package.json`; if that version has **no tag yet**, it tags the merge commit and publishes a
GitHub Release whose body is the matching `CHANGELOG.md` section. If the version is already
tagged (an ordinary merge that did not cut a release), it is a no-op — so it is safe on every
merge.

```yaml
name: github-release
on:
  push:
    branches: [main]
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Resolve version and whether it is already tagged
        id: v
        run: |
          version=$(node -p "require('./package.json').version")
          echo "version=$version" >> "$GITHUB_OUTPUT"
          if git rev-parse "v$version" >/dev/null 2>&1; then
            echo "exists=true" >> "$GITHUB_OUTPUT"
          else
            echo "exists=false" >> "$GITHUB_OUTPUT"
          fi
      - name: Extract changelog section for this version
        if: steps.v.outputs.exists == 'false'
        run: |
          version="${{ steps.v.outputs.version }}"
          awk -v ver="$version" '
            $0 ~ "^## \\[" ver "\\]" {flag=1; next}
            /^## \[/ && flag {flag=0}
            flag {print}
          ' CHANGELOG.md > release-notes.md
      - name: Tag the merge commit and publish the GitHub Release
        if: steps.v.outputs.exists == 'false'
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ steps.v.outputs.version }}
          target_commitish: ${{ github.sha }}
          body_path: release-notes.md
```

The default `GITHUB_TOKEN` is sufficient. Tagging via the API/Action adds no commit to `main`, so
Vercel does not produce a second production build.

---

## Stage 3 — Copywrite: the "What's New" gate

This is the only non-automated stage, and deliberately so — tone and judgment can't be
generated mechanically. It is **AI-seeded, human-reviewed**.

**The "What's New" content is ordinary app content.** The `whats-new.json` entries live in
`src/lib/translations/` (Stage 4) and ride `test → main` like any code, so they build into the
**Vercel preview**. You author and **QA the exact WhatsNewModal your users will see on
`test`/preview before it ever reaches `main`** — which is the whole point.

**When to author:** during development, keyed to the upcoming release. Maintain a single draft
entry (`"status": "draft"`) that preview shows, so QA and preview users see the in-progress
"What's New" paired with the matching preview build. As part of the Stage 2b ritual you promote
that entry to released (set its real semver `version` and `status: "released"`) in the same push,
so it ships with the version bump.

**Drafting:** from the accumulating changelog / release body + `docs/release_notes_guidelines.md`
(summary-first, conversational tone, watch the word count), draft the user-facing copy in
**en / es / ca**. A Claude prompt/skill is a good fit for the first draft; a maintainer edits and
merges.

**Output format** — one entry per version, localized (see Stage 4 for the schema). Keep it
short: a `title` and a few sentences, optionally a `highlights` list. Only include changes users
feel — skip internal refactors even if they appear in `CHANGELOG.md`.

---

## Stage 4 — Surface: in-app "What's New" via i18n

User-facing notes live as **localized translation entries** and render in a
`<WhatsNewModal/>` (or `/whats-new` page). This reuses the existing sveltekit-i18n setup
(`src/lib/translations/`, locales en/es/ca) and ships through the normal Vercel deploy — no new
infrastructure.

### Storage  *(as implemented)*

The localized content lives in `src/lib/translations/<locale>/whats-new.json` (en/es/ca) and is
**imported directly** by the modal — **not** loaded through the sveltekit-i18n loader.

> ⚠️ **Why not the i18n loader:** sveltekit-i18n flattens translations into dot-keyed *strings*
> (`whatsNew.releases.0.title` …), so `$t('whatsNew.releases')` can't return a usable **array**.
> Direct import keeps the structured array intact and is still fully localized. The modal's own
> UI strings (`heading`, `draftBadge`, `dismiss`) live in the same per-locale file, so it's
> self-contained.

Each file is one object: a few UI strings plus a `releases` array, newest first. Entries with
`"status": "draft"` are shown **only on preview** (see Rendering); released entries carry a real
semver `version`.

`src/lib/translations/en/whats-new.json`
```json
{
  "heading": "What's new",
  "draftBadge": "Coming soon",
  "dismiss": "Got it",
  "releases": [
    {
      "version": "0.5.0",
      "status": "released",
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
`es/whats-new.json` and `ca/whats-new.json` mirror the same `version`/`status`/`date` with
translated copy. A single `"status": "draft"` entry seeds the upcoming release and is visible
only on preview until promoted.

### Rendering  *(`WhatsNewModal.svelte`, mounted in `+layout.svelte`)*

- The modal selects the current locale's file via `$locale`, decides **once on mount**
  (client-side) what to surface, and uses Skeleton's `Dialog` + `Portal`.
- **Seen tracking:** `localStorage["whatsNewLastSeen"]` holds the newest released version the user
  has seen. On first-ever visit it baselines silently to the latest release (so history isn't
  replayed); afterwards, released entries newer than the baseline auto-open the modal, and dismiss
  advances the baseline.
- **Preview shows drafts:** when `page.data.isPreview`, `status: "draft"` entries are included so
  QA/preview users see what's coming. Production renders only released entries, and drafts never
  advance the seen-baseline.
- Keep it scoped to what users feel; the technical detail stays in `CHANGELOG.md`.

---

## End-to-end checklist (implementation order)

1. [x] Wire commitlint: `.github/workflows/commitlint.yaml` (PR-title lint); optional local `commit-msg` hook.
2. [x] Add `.versionrc.json` + `release` / `release:dry` scripts (`--skip.tag`); add `commit-and-tag-version` dev dep.
3. [x] Add `.github/workflows/github-release.yaml` (push to `main` → tag merge commit + GitHub Release).
4. [x] Remove release-please (`release-please.yaml`, `release-please-config.json`, `.release-please-manifest.json`).
5. [x] Render the version in the header from `package.json` (preview-only badge); no `-bN` counter.
6. [x] Add `whats-new.json` (en/es/ca) + `<WhatsNewModal/>` (Stage 4).
7. [ ] Document the shipped behavior under `docs/features/<slug>/` once the change settles (feature lifecycle).

### The release ritual, in one place

```bash
# on `test`, with the test → main PR open
pnpm release:dry                      # preview
pnpm release                          # bump + CHANGELOG, commit (no tag)
# promote draft whats-new.json (en/es/ca) → released, commit
git push origin test                  # release commit + What's New
# merge the test → main PR            # single prod build; CI tags + releases
```
