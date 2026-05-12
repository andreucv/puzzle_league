# Project Overview

This project is a simple web application that allows users to organize speed puzzling
competitions. It is built using Svelte for Front-End, SvelteKit for Back-End,
Prisma for Database Management (with postgresDB), Better-Auth for authentication
and tailwindcss for styling.

## Folder Structure

- `src` - contains the source code for the app
  - `lib` - contains the libraries used in the app
  - `routes` - contains the routes used in the app
- `e2e` - contains the end-to-end tests for the app
- `prisma` - contains the Prisma schema and migrations
- `docs` - contains the documentation of the project

## Technologies

- **Frontend**: [Svelte](https://svelte.dev/) with [SvelteKit](https://kit.svelte.dev/)
- **Backend**: SvelteKit API routes (+server.ts)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma](https://www.prisma.io/) ORM
- **Auth**: Better Auth (with email/password + Google OAuth)
- **Real-time**: Ably Pub/Sub (competition channels)
- **Email**: Resend
- **UI**: [Skeleton UI v4](https://www.skeleton.dev) + [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Vercel](https://vercel.com/)
- **Multi-language**: ca/es/en

## IMPORTANT Principles
- **Simplicity**: We look to not overcomplicate things. We want to keep the codebase simple and easy to understand.
- **Maintainability**: We want to keep the codebase maintainable and easy to work with. We want to avoid technical debt and keep the codebase clean.
- **Performance**: We want to keep the app performant and responsive. We want to avoid unnecessary re-renders and keep the app fast.
- **Accessibility**: We want to make sure the app is accessible to everyone. We want to follow best practices for accessibility and make sure the app is usable by everyone.
- **User Experience**: We want to make sure the app is easy to use and provides a good user experience. We want to make sure the app is intuitive and easy to navigate.
- **Decisions as comments**: Code that is decided to be implemented in a certain way that is not obvious in the code itself should be commented with the rational behind the decision.

## Codebase Organization
- **Component-Based**: We organize our codebase around components. Each component is responsible for a specific piece of functionality and must be reused throughout the app.
- **Utils**: We have a utils folder where we put all the utility functions that are used throughout the app. This helps us keep our codebase organized and makes it easy to find and reuse code.
- **Tests**: We have e2e tests to test workflows, with seeding the needed information in the database before running the tests. We also have unit tests for our utility functions and components.

## Skill usage
Always check if a skill exists for the task at hand.
When writing new code, always check the refactor-to-new-folder-structure skill to create the new files with the correct structure. When working on an existing file, check if there is a skill to refactor it to the new folder structure, and if so, use it to move the file to the correct location and update the imports accordingly.
