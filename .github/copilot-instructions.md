# Copilot Instructions

Use this file as an index, not as a duplicate project manual.

## Required Context

Before making or suggesting changes, read the relevant project docs:

- `docs/ARCHITECTURE.md` for stack, code layout, request flow, authorization, data model, services, realtime events, notifications, and deployment.
- `docs/PRODUCT.md` for product behavior, user roles, participant/organizer/admin workflows, discovery, results, notifications, localization, and current product boundaries.
- `docs/CONTRIBUTING.md` for local setup, commands, coding conventions, testing expectations, data-model guidance, and PR hygiene.

Use these deeper references when the task touches their area:

- `docs/GLOSSARY.md` for domain terminology.
- `docs/workflows/registration-workflow.md` for registration status, waitlist, payment-reminder, table-assignment, and notification behavior.
- `docs/adr/` for accepted architectural decisions.
- `docs/external/` for framework or UI-library notes that are already captured for this repo.

## Working Rules

- Do not reintroduce architecture, product, or setup details here; update the source doc instead. Suggest to update these documents if you find any incomplete or conflicting information during your work.
- Prefer implemented source code over stale documentation when they disagree, and update the affected doc when a change alters documented behavior.
- Keep changes aligned with the existing domain language, service boundaries, route guards, Svelte/SvelteKit patterns, Prisma usage, and test strategy described in the docs above.

## Planning mode

- When using plan mode agent, use the .github/plan/plan-template.md for formatting the plan, and include references to the relevant docs sections in the plan.
- Store the resulting plan file in docs/plans/ with a descriptive name. Also include the name and number of the issue(s) to resolve with the plan.
