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

## Principles
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
