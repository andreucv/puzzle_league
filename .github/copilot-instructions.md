# Project Overview

This project is a simple web application that allows users to organize speed puzzling
competitions. It is built using Svelte for Front-End, SvelteKit for Back-End,
Prisma for Database Management (with postgresDB), Better-Auth for authentication
and tailwindcss for styling.

## Folder Structure

- `src` - contains the source code for the app
  - `lib` - contains the libraries used in the app
  - `routes` - contains the routes used in the app
  - `shareds` - contains the stores used in the app
- `e2e` - contains the end-to-end tests for the app
- `prisma` - contains the Prisma schema and migrations
- `doc` - contains the LLMs files for Svelte, SvelteKit and Skeleton UI

## Technologies

- [Svelte](https://svelte.dev/) - The framework used for building the app
- [SvelteKit](https://kit.svelte.dev/) - The framework used for building the app
- [Tailwind CSS](https://tailwindcss.com/) - The utility-first CSS framework used for styling the app
- [Skeleton UI](https://www.skeleton.dev) - The UI library used for building the app
- [Prisma](https://www.prisma.io/) - The ORM used for interacting with the database
- [PostgreSQL](https://www.postgresql.org/) - The database used for storing the app data
- [Vercel](https://vercel.com/) - The platform used for deploying the app

<!-- GSD Configuration — managed by get-shit-done installer -->
# Instructions for GSD

- Use the get-shit-done skill when the user asks for GSD or uses a `gsd-*` command.
- Treat `/gsd-...` or `gsd-...` as command invocations and load the matching file from `.github/skills/gsd-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply GSD workflows unless the user explicitly asks for them.
- After completing any `gsd-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
<!-- /GSD Configuration -->
