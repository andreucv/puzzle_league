---
applyTo: "**/*.ts,**/*.svelte"
---

# Prisma Import Rules

This project uses Prisma 7 with a custom output directory at `src/lib/.prisma/generated/prisma/`.
The generated code is split into multiple entry points. **You must import from the correct entry point** depending on what you need and where you need it.

## Why this matters

The main `client.ts` entry point (`$lib/.prisma/generated/prisma/client`) imports `@prisma/client/runtime/client`, which is a **CommonJS module**. When SvelteKit builds for production with `adapter-vercel`, Vite externalizes `@prisma/client` instead of bundling it. At runtime, Node.js ESM cannot resolve named exports from CJS modules, causing the build to crash with errors like:

```
SyntaxError: Named export 'CategoryType' not found. The requested module '@prisma/client' is a CommonJS module
```

or:

```
Error: Cannot find module '@prisma/client/runtime/library.js'
```

This does **not** happen during `vite dev` or `vite preview` because Vite's dev server handles CJS/ESM interop transparently. The error only appears in production builds deployed to Vercel.

## Generated entry points

| File | Purpose | CJS dependency? |
|------|---------|-----------------|
| `enums.ts` | Enum values (`Role`, `CategoryType`, `CompetitionStatus`, etc.) | **No** — pure TypeScript |
| `browser.ts` | Type-only exports for all models and enums (no `PrismaClient`) | **No** — pure TypeScript |
| `client.ts` | Full Prisma Client (`PrismaClient`, models, enums, namespaces) | **Yes** — imports `@prisma/client/runtime/client` |

## Import rules

### 1. Enum values (runtime) → import from `enums`

When you need an enum as a **runtime value** (e.g., for `z.nativeEnum()`, `Object.values()`, comparisons, switch statements):

```ts
// ✅ CORRECT — pure ESM, safe everywhere
import { Role, CategoryType, CompetitionStatus } from '$lib/.prisma/generated/prisma/enums';

// ❌ WRONG — pulls in CJS runtime, breaks production build
import { Role } from '$lib/.prisma/generated/prisma/client';
import { CategoryType } from '@prisma/client';
```

### 2. Types only → use `import type`

When you only need TypeScript types (models, enums as types, `Prisma` namespace for type annotations):

```ts
// ✅ CORRECT — stripped at compile time, never appears in build output
import type { User, Competition, Category } from '$lib/.prisma/generated/prisma/browser';
import type { CategoryType } from '@prisma/client';
import type { Prisma } from '$lib/.prisma/generated/prisma/client';

// ❌ WRONG — imports as runtime value unnecessarily
import { type User, Prisma } from '$lib/.prisma/generated/prisma/client';
// (only wrong if Prisma is used solely for type annotations)
```

### 3. PrismaClient → only in `create_prisma_client.ts`

The `PrismaClient` class must be imported from `client.ts`, but this should **only** happen in `src/lib/database/create_prisma_client.ts`. No other file should import from `client.ts` for runtime values.

```ts
// ✅ CORRECT — isolated to one file
import { PrismaClient } from '$lib/.prisma/generated/prisma/client';
```

### 4. Client-side `.svelte` files

Svelte components should **never** import runtime values from Prisma. Only use `import type`:

```svelte
<script lang="ts">
    // ✅ CORRECT
    import type { Competition, Category } from '@prisma/client';
    import type { CategoryType } from '@prisma/client';

    // ❌ WRONG — would pull Prisma runtime into the browser bundle
    import { CategoryType } from '@prisma/client';
</script>
```

## Quick reference

| What you need | Where to import from |
|---------------|---------------------|
| Enum value (`Role`, `CategoryType`, etc.) | `$lib/.prisma/generated/prisma/enums` |
| Model type (`User`, `Competition`, etc.) | `import type` from `browser` or `@prisma/client` |
| `Prisma` namespace (for type annotations only) | `import type { Prisma }` from `client` |
| `PrismaClient` class | `client` (only in `create_prisma_client.ts`) |

## Testing the production build locally

Always test with `npm run build` before pushing. This runs the same `adapter-vercel` pipeline as Vercel and will catch CJS/ESM interop issues:

```bash
npm run build
```
