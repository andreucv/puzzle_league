---
applyTo: "**/*.ts,**/*.svelte"
---

# Performance Rules

These rules prevent common performance anti-patterns that degrade First Contentful Paint (FCP) and server response time.

## 1. Never call `auth.api.getSession()` in page loaders or form actions

The `hooks.server.ts` handle function already resolves the session and stores it in `event.locals.user` and `event.locals.session`. Calling `auth.api.getSession()` again in `+page.server.ts` files duplicates the auth roundtrip and adds ~100-200ms to every request.

```ts
// ❌ WRONG — duplicates the session call from hooks
import { auth } from "$lib/auth";
export const load: PageServerLoad = async (event) => {
    const session = await auth.api.getSession(event.request);
};

// ✅ CORRECT — use the session already resolved by hooks
export const load: PageServerLoad = async (event) => {
    const user = event.locals.user;
    const session = event.locals.session;
};
```

This also applies to form actions:

```ts
// ❌ WRONG
save: async ({ request }) => {
    const session = await auth.api.getSession(request);
};

// ✅ CORRECT
save: async ({ locals }) => {
    const user = locals.user;
};
```

### Two layers of user data — know which one you need

There are three distinct ways to access the current user, each with a different cost and scope:

| | `event.locals.user` | `await parent()` in page loaders | `data.user` / `$page.data.user` |
|---|---|---|---|
| Set by | `hooks.server.ts` | Inherited from `+layout.server.ts` (`getUserWithRoles`) | Same as above, reactive in components |
| Contains | Basic Better Auth fields (`id`, `name`, `email`, `image`, `createdAt`, …) | Everything above **plus** `country`, `postalCode`, `roleAssignments` | Same enriched user |
| Available in | All server code: loaders, actions, API routes | `+page.server.ts` and `+layout.server.ts` load functions | Svelte components |
| DB call cost | None | None — reuses layout data already computed | None |

**In `+page.server.ts` loaders that need the enriched user, always use `await parent()`** — it reuses the user already fetched by the layout at zero extra cost:

```ts
// ✅ CORRECT — reuses enriched user from layout, zero extra DB queries
export const load: PageServerLoad = async ({ parent }) => {
    const { user } = await parent();
    if (!user) return { props: {} };

    // user.country, user.postalCode, user.roleAssignments are all available
    const results = await getNearCompetitions(6, user.country, user.postalCode);
    return { props: { results } };
};

// ❌ WRONG — calls getUserWithRoles() a second time, duplicating the layout query
export const load: PageServerLoad = async (event) => {
    const user = await getUserWithRoles(event.locals.user);
};
```

**`event.locals.user` is correct when you only need basic identity** (e.g. `user.id` for permission checks), and in API route handlers where `parent()` is not available:

```ts
// ✅ CORRECT — only needs user.id, no enriched data required
export const load: PageServerLoad = async (event) => {
    const access = await getCompetitionAccess(competitionId, event.locals.user.id);
};
```

**Do NOT move `getUserWithRoles()` into `hooks.server.ts`.** Hooks run on every request including all `/api/*` routes. The enriched user data is a UI concern; adding it to hooks would make every API call pay for an unnecessary DB query.

## 2. Parallelize independent database queries

When a page loader makes multiple database calls that don't depend on each other, run them in parallel with `Promise.all` instead of sequentially.

```ts
// ❌ WRONG — sequential, each waits for the previous
const records = await getRecords(id, userId);
const categories = await getCategories(id);
const access = await getAccess(id, userId);

// ✅ CORRECT — parallel, all run at the same time
const [entries, categories, access] = await Promise.all([
    getEntries(id, userId),
    getCategories(id),
    getAccess(id, userId),
]);
```

## 3. Avoid N+1 query patterns in database utilities

Never fetch a list of entries and then run individual queries per item. Use `groupBy`, `aggregate`, or batch queries instead.

```ts
// ❌ WRONG — 4 queries per category (N+1 pattern)
const categories = await prisma.category.findMany({ where: { competitionId } });
const enriched = await Promise.all(
    categories.map(async (cat) => {
        const total = await prisma.entry.count({ where: { categoryId: cat.id } });
        const finished = await prisma.entry.count({ where: { categoryId: cat.id, finishTime: { not: null } } });
        return { ...cat, total, finished };
    })
);

// ✅ CORRECT — 1 groupBy query replaces N individual counts
const counts = await prisma.entry.groupBy({
    by: ['categoryId', 'status'],
    _count: true,
    where: { category: { competitionId } }
});
```

## 4. Use compile-time icon imports, not runtime `@iconify/svelte`

The runtime `Icon` component from `@iconify/svelte` fetches icons from the Iconify CDN at render time, blocking paint. Always use the compile-time `@iconify-svelte/mdi/*` packages instead.

```svelte
<!-- ❌ WRONG — fetches from CDN at runtime -->
<script>
    import Icon from '@iconify/svelte';
</script>
<Icon icon="mdi:cancel" />

<!-- ✅ CORRECT — icon is bundled at build time -->
<script>
    import CancelIcon from '@iconify-svelte/mdi/cancel';
</script>
<CancelIcon width="1.2rem" height="1.2rem" />
```

Components that accept icons as props must accept Svelte components, not icon name strings:

```svelte
<!-- ❌ WRONG — forces runtime Icon lookup -->
<MyButton icon="mdi:pencil" />

<!-- ✅ CORRECT — icon is a compile-time component -->
<script>
    import PencilIcon from '@iconify-svelte/mdi/pencil';
</script>
<MyButton icon={PencilIcon} />
```

## 5. Lazy-load images below the fold

Images that are not visible in the initial viewport should use `loading="lazy"` to prevent them from blocking first paint.

```svelte
<!-- ✅ CORRECT -->
<CldImage src={imageId} loading="lazy" ... />
<img src={url} loading="lazy" alt="..." />
```
