<script lang="ts">
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import { t } from '$lib/translations';
    import CategoryCard from '$lib/components/competition/CategoryCard.svelte';
    import type { Category, Puzzle } from '$lib/.prisma/generated/prisma/browser';

    type CategoryWithPuzzles = Category & { puzzles?: Puzzle[] };
    type CategoryWithCounts = Category & { totalEntries: number; finishedEntries: number; reservedSlots?: number };
    type UserEntry = { categoryId: number; status?: string; users?: { id: string; name: string; email: string; image: string | null }[]; externalParticipants?: { id: string; name: string; claimedById: string | null }[] };

    let {
        categories,
        isCreator = false,
        isMultiDay = false,
        categoriesWithCounts = undefined,
        userRecords = []
    }: {
        categories: CategoryWithPuzzles[],
        isCreator: boolean,
        isMultiDay?: boolean,
        categoriesWithCounts?: CategoryWithCounts[],
        userRecords?: UserEntry[]
    } = $props();

    function getSeatsAvailable(category: CategoryWithPuzzles): number | undefined {
        if (category.maxParties == null) return undefined;
        const counts = categoriesWithCounts?.find(c => c.id === category.id);
        const registered = counts?.reservedSlots ?? counts?.totalEntries ?? 0;
        return category.maxParties - registered;
    }

    function getTotalEntries(category: CategoryWithPuzzles): number | undefined {
        const counts = categoriesWithCounts?.find(c => c.id === category.id);
        return counts?.totalEntries;
    }

    function getUserRecords(categoryId: number) {
        return userRecords.filter(r => r.categoryId === categoryId);
    }
</script>

{#if categories.length > 0}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each categories as category}
            {@const records = getUserRecords(category.id)}
            <CategoryCard
                {category}
                {isCreator}
                {isMultiDay}
                showRegistration={true}
                {records}
                seatsAvailable={getSeatsAvailable(category)}
                totalEntries={getTotalEntries(category)}
            />
        {/each}
    </div>
{:else}
    <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800/50 p-8 text-center">
        <PuzzleOutlineIcon width="2.5rem" height="2.5rem" class="text-surface-400 dark:text-surface-500" />
        <p class="text-surface-500 dark:text-surface-400 text-sm font-medium">{$t('competition_details.no_categories')}</p>
    </div>
{/if}
