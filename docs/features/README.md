# Feature lifecycle — `docs/features/`

Every non-trivial feature moves through the same five stages. Each stage produces **one
markdown file** in a per-feature folder keyed by a short **slug**. This is the single source of
truth for the `feature-*` skills; do not duplicate the convention into the skills.

```
docs/features/<slug>/
  01-problem.md     Stage 1 — Problem definition   (skill: /feature-problem)
  02-ideas.md       Stage 2 — Ideation             (skill: /feature-ideas → /brainstorming)
  03-design.md      Stage 3 — Design               (skill: /feature-design → /grill-me)
  04-plan.md        Stage 4 — Implementation plan  (skill: /feature-plan)
  05-workflow.md    Stage 5 — Feature documentation (skill: /feature-doc → /workflow-document-writer)
```

Not every feature needs all five files — a tiny change may jump straight to `04-plan.md`. But
when a stage is produced, it goes **here**, with this name, never in the legacy folders.

## The slug

A short kebab-case identifier for the feature, reused as the folder name and the `slug:`
frontmatter key across all five files. Examples: `results-redesign`, `entry-tags`,
`finish-banner`. Pick it once at stage 1 and keep it for the life of the feature. If an issue
exists, you may suffix it (`entry-tags-58`) — but the slug, not the date, is the join key.

## Required frontmatter (every stage file)

```yaml
---
slug: results-redesign          # the join key — identical across all five files
stage: problem                  # problem | ideas | design | plan | workflow
feature: Competition results page redesign   # human title
issue: "#58"                    # or null
status: draft                   # draft | approved | implemented
created: 2026-06-08
updated: 2026-06-08
related:                        # the other stage files that exist for this slug
  - docs/features/results-redesign/02-ideas.md
---
```

`related:` is what ties a feature's documents together — always backfill it when you add a new
stage file so every doc points at its siblings.

## Stage definitions and exit gates

| # | Stage | File | Answers | Delegates to | Exit gate |
|---|---|---|---|---|---|
| 1 | Problem | `01-problem.md` | *What's wrong / what do we want, and why?* | — | User agrees the problem is framed right |
| 2 | Ideation | `02-ideas.md` | *What are the candidate solutions?* | `/brainstorming` | A direction is chosen |
| 3 | Design | `03-design.md` | *How will the chosen solution behave?* | `/grill-me`, `/grill-with-docs` | Open questions resolved, `status: approved` |
| 4 | Plan | `04-plan.md` | *What are the concrete implementation steps?* | `.github/plan/plan-template.md` | Plan approved; then implement |
| 5 | Workflow | `05-workflow.md` | *How does the shipped feature actually behave?* | `/workflow-document-writer` | Doc reflects merged code |

**The completion rule:** a feature is not "done" until `05-workflow.md` exists and matches the
shipped code. Stage 5 is the most-skipped and most-valuable stage — treat it as the close-out of
every implementation, not an optional extra. A `Stop` hook
(`.claude/hooks/feature-doc-gate.py`) enforces this: whenever a feature folder has `04-plan.md`
but no `05-workflow.md`, it surfaces a non-blocking reminder to run `/feature-doc`.

Each stage skill ends by telling you the **named next skill** to run when you're satisfied, or
inviting comments to correct the current stage's doc before moving on.

## Legacy folders

`docs/analysis/`, `docs/ideas/`, and the `*-design.md` / `*-plan.md` files in `docs/plans/`
predate this convention (two naming systems, no shared key, scattered per feature). Leave them in
place; do not migrate. All **new** feature work uses `docs/features/<slug>/`.

## Rules carried from CLAUDE.md

- Read the relevant `docs/` (`ARCHITECTURE.md`, `PRODUCT.md`, `GLOSSARY.md`) before writing; cite
  exact files/lines and schema fields. Prefer `graphify query` over broad grep.
- Use the domain language in `docs/GLOSSARY.md`.
- Use markdown links for file references.
- **NEVER COMMIT.** Run `graphify update .` after code changes.
