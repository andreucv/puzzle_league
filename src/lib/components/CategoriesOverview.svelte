<script lang="ts">
    import Icon from '@iconify/svelte';
    import { Avatar } from '@skeletonlabs/skeleton-svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import { t } from '$lib/translations';
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
            <div class="card p-4 flex flex-col gap-3 transition-all {isRegistered
                ? 'preset-outlined-primary-500 ring-1 ring-primary-300 dark:ring-primary-700'
                : 'preset-outlined-surface-200-800 hover:preset-tonal-primary'}">

                <!-- Header: Category type + icon -->
                <div class="flex justify-between items-start">
                    <h3 class="h4 font-semibold">
                        {getCategoryTypeName(category.type)}
                    </h3>
                    <Icon
                        icon={category.type.includes('TEAM') ? 'mdi:account-group' :
                            category.type.includes('PAIRS') ? 'mdi:account-multiple' :
                            category.type.includes('CHESS') ? 'mdi:chess-pawn' :
                            'mdi:account'}
                        width="1.5rem"
                        height="1.5rem"
                        class="text-primary-800"
                    />
                </div>

                {#if category.description !== getCategoryTypeName(category.type).toUpperCase()}
                    <p class="text-surface-600-400 text-sm">{category.description}</p>
                {/if}

                <!-- Time block: prominent and clear -->
                <div class="flex items-center gap-2 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-2">
                    <Icon icon="mdi:clock-outline" width="1rem" height="1rem" class="text-primary-500 shrink-0" />
                    <span class="text-sm font-semibold">
                        {formatTime(new Date(category.startTime))} – {formatTime(new Date(category.endTime))}
                    </span>
                </div>

                <!-- Puzzles: public info for everyone, private details for creator -->
                {#if category.puzzles && category.puzzles.length > 0}
                    <div class="flex flex-wrap gap-2">
                        {#each category.puzzles as puzzle}
                            <div class="flex flex-col gap-1 rounded-lg bg-surface-100 dark:bg-surface-800 px-3 py-2">
                                <div class="flex items-center gap-2">
                                    <Icon icon="mdi:puzzle-outline" width="1rem" height="1rem" class="text-primary-500 shrink-0" />
                                    <span class="text-sm font-semibold">{puzzle.pieces} pcs – {puzzle.brand}</span>
                                </div>
                                {#if isCreator}
                                    <div class="text-xs text-surface-500 dark:text-surface-400 pl-6">
                                        {#if puzzle.name}
                                            <span class="mr-2">Name: {puzzle.name}</span>
                                        {/if}
                                        <span>Barcode: {puzzle.barcode}</span>
                                    </div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}

                <!-- Footer: Registration status -->
                <div class="flex items-center justify-between mt-auto pt-3 border-t border-surface-200 dark:border-surface-700 -mb-0.5">
                    {#if isRegistered && party}
                        <!-- Show party members -->
                        <div class="flex items-center gap-2">
                            <div class="flex -space-x-1.5">
                                {#each party as user}
                                    <Avatar
                                        name={user.name}
                                        src={user?.image ?? undefined}
                                        classes="w-7 h-7 ring-2 ring-white dark:ring-surface-900 shadow-sm"
                                    />
                                {/each}
                            </div>
                            <span class="text-xs text-surface-600 dark:text-surface-400">
                                {party.map(u => u.name).join(', ')}
                            </span>
                        </div>
                        <span class="badge preset-filled-success-500 text-xs flex items-center gap-1 shrink-0">
                            <Icon icon="mdi:check-circle" width="0.8rem" height="0.8rem" />
                            {$t('inscription.registered')}
                        </span>
                    {:else}
                        <!-- Show seats available for non-registered users -->
                        {#if getSeatsAvailable(category) !== undefined}
                            <div class="flex items-center gap-1 text-sm text-surface-500">
                                <Icon icon="mdi:account-box-plus-outline" width="1rem" height="1rem" />
                                <span>{getSeatsAvailable(category)} {$t('competition_details.seats_available')}</span>
                            </div>
                        {:else}
                            <div></div>
                        {/if}
                        <span class="badge preset-tonal-surface text-xs flex items-center gap-1">
                            <Icon icon="mdi:account-plus-outline" width="0.8rem" height="0.8rem" />
                            Open
                        </span>
                    {/if}
                </div>
            </div>
        {/each}
    </div>
{:else}
    <div class="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800/50 p-8 text-center">
        <Icon icon="mdi:puzzle-outline" width="2.5rem" height="2.5rem" class="text-surface-400 dark:text-surface-500" />
        <p class="text-surface-500 dark:text-surface-400 text-sm font-medium">{$t('competition_details.no_categories')}</p>
    </div>
{/if}
