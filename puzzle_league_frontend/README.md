# Puzzle League

This is the repository for the Puzzle League platform app.

## Getting Started

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Run `npm run dev` to start the development server
4. Open your browser and navigate to `http://localhost:5173`

## Development

Two main branches are used for development:
- `main` - the main branch
- `develop` - the development branch

When working on a new feature, create a new branch from `develop` and name it according to the feature you are working on.
When the feature is complete, create a pull request to merge the feature branch into `develop`.
Once the feature has been tested and is ready for production, create a pull request to merge `develop` into `main`.

## Deployment

The app is deployed in Vercel.
When a pull request is merged into `main`, the app is automatically deployed to the production environment.
When a pull request is merged into `develop`, the app is automatically deployed to the staging environment.

## Technologies

- [Svelte](https://svelte.dev/) - The framework used for building the app
- [SvelteKit](https://kit.svelte.dev/) - The framework used for building the app
- [Tailwind CSS](https://tailwindcss.com/) - The utility-first CSS framework used for styling the app
- [Skeleton UI](https://www.skeleton.dev) - The UI library used for building the app
- [Prisma](https://www.prisma.io/) - The ORM used for interacting with the database
- [PostgreSQL](https://www.postgresql.org/) - The database used for storing the app data
- [Vercel](https://vercel.com/) - The platform used for deploying the app
