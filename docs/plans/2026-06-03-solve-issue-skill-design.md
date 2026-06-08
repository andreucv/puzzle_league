---
title: solve-issue — Global Cowork Skill Design
date_created: 2026-06-03
last_updated: 2026-06-03
---

# Design: `solve-issue` Skill

A global Cowork skill that takes a GitHub issue number and orchestrates a full end-to-end workflow: fetch → understand → graphify → grill → plan → implement.

## Context

- Issue tracker: GitHub Issues (puzzle_league repo)
- GitHub access: GitHub MCP connector (fallback: ask user to paste issue body)
- Project-local sub-skills used: `.agents/skills/graphify/SKILL.md`, `.agents/skills/grill-with-docs/SKILL.md`, `.agents/skills/tdd/SKILL.md`
- Skill location: Global Cowork skill (single `SKILL.md`)
- Structure: Option A — single self-contained SKILL.md

## Workflow

### Phase 1 — Fetch & Understand

1. User invokes the skill with an issue number (e.g. "solve issue #42")
2. Use GitHub MCP connector to fetch the issue: title, body, labels, comments
3. Summarize the issue in the project's domain language (cross-check against `CONTEXT.md`)
4. Present understanding to user and confirm before proceeding
5. Fallback: if GitHub MCP unavailable, ask user to paste the issue body

### Phase 2 — Graphify Analysis

1. Detect project root by checking for `.agents/skills/graphify/SKILL.md`
2. Read the graphify skill
3. Run `graphify query "<issue summary>"` against existing `graphify-out/graph.json`
4. Run `graphify path` between relevant concepts if a root cause file is identifiable
5. Present related classes/files with brief relevance explanation
6. Confirm with user before proceeding

### Phase 3 — Grilling Session

1. Read `.agents/skills/grill-with-docs/SKILL.md`
2. Conduct full grilling session scoped to the issue
3. Challenge assumptions against `CONTEXT.md`, stress-test edge cases with concrete scenarios
4. Cross-check user statements against the code
5. Update `CONTEXT.md` inline as terms are resolved
6. Offer ADRs only for hard-to-reverse, surprising trade-off decisions

### Phase 4 — Implementation Plan

1. Generate a plan using `.github/plan/plan-template.md` format
2. Reference the issue number in the plan
3. Save to `docs/plans/YYYY-MM-DD-issue-<N>-<slug>-plan.md`
4. Present plan to user and wait for explicit approval

### Phase 5 — Implementation (user choice)

After approval, ask the user how to proceed:
- **Auto**: Write all code, run tests, present completed changes
- **Guided**: Implement one step at a time, pause for confirmation at each major step
- **TDD**: Read and invoke `.agents/skills/tdd/SKILL.md` for test-first discipline

## Key Design Decisions

- **Project root detection**: Check for `.agents/skills/graphify/SKILL.md` relative to cwd
- **Sub-skills are read lazily**: Only when entering the relevant phase
- **User checkpoint after every phase**: No phase starts without explicit user confirmation
- **GitHub MCP graceful degradation**: Falls back to manual paste if connector unavailable
- **Domain language enforcement**: Every phase uses CONTEXT.md vocabulary

## Skill File Structure

```
solve-issue/
└── SKILL.md   (single file, all phases inline)
```

## Open Questions

1. Should the skill also update the GitHub issue's label (e.g. set `ready-for-agent` → `in-progress`) via MCP when work begins?
2. Should the plan file be committed to git automatically, or left uncommitted for user review?
3. What happens if `graphify-out/graph.json` doesn't exist — prompt the user to run graphify first, or skip Phase 2?
