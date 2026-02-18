<script lang="ts">
    import Icon from '@iconify/svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import { t } from '$lib/translations';
    import CategoryCard from '$lib/components/CategoryCard.svelte';
    import type { Category, Puzzle } from '@prisma/client';

    type CategoryWithPuzzles = Category & { puzzles?: Puzzle[] };
    type CategoryWithCounts = Category & { totalRecords: number; finishedRecords: number };
    type UserRecord = { categoryId: number; users?: { id: string; name: string; email: string; image: string | null }[] };

    let {
        categories,
        isCreator = false,
        categoriesWithCounts = undefined,
        userRegisteredCategoryIds = new Set<number>(),
        userRecords = []
    }: {
        categories: CategoryWithPuzzles[],
        isCreator: boolean,
        categoriesWithCounts?: CategoryWithCounts[],
        userRegisteredCategoryIds?: Set<number>,
        userRecords?: UserRecord[]
    } = $props();

    function getSeatsAvailable(category: CategoryWithPuzzles): number | undefined {
        if (category.maxParties == null) return undefined;
        const registered = categoriesWithCounts?.find(c => c.id === category.id)?.totalRecords ?? 0;
        return category.maxParties - registered;
    }

    function getUserParty(categoryId: number) {
        const record = userRecords.find(r => r.categoryId === categoryId);
        return record?.users || null;
    }
</script>

{#if categories.length > 0}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each categories as category}
            {@const isRegistered = userRegisteredCategoryIds.has(category.id)}
            {@const party = getUserParty(category.id)}
            <CategoryCard
                {category}
                {isCreator}
                showRegistration={true}
                {isRegistered}
                {party}
                seatsAvailable={getSeatsAvailable(category)}
            />
        {/each}
    </div>
{:else}
    <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800/50 p-8 text-center">
        <Icon icon="mdi:puzzle-outline" width="2.5rem" height="2.5rem" class="text-surface-400 dark:text-surface-500" />
        <p class="text-surface-500 dark:text-surface-400 text-sm font-medium">{$t('competition_details.no_categories')}</p>
    </div>
{/if}
