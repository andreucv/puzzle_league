<script lang="ts">
    import Icon from '@iconify/svelte';
    import { formatTime } from '$lib/utils/datetime_utils';
    import { getCategoryTypeName } from '$lib/utils/category_utils';
    import type { Category, Puzzle } from '@prisma/client';

    type CategoryWithPuzzles = Category & { puzzles?: Puzzle[] };

    let { categories, isCreator = false }: { categories: CategoryWithPuzzles[], isCreator: boolean } = $props();
</script>

{#if categories.length > 0}
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {#each categories as category}
            <div class="card preset-outlined-surface-200-800 p-4 hover:preset-tonal-primary transition-all">
                <div class="flex justify-between items-start mb-3">
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
                    <p class="text-surface-600-400 mb-2">{category.description}</p>
                {/if}

                {#if category.puzzles && category.puzzles.length > 0}
                    <div class="flex flex-wrap gap-2 mb-4">
                        {#each category.puzzles as puzzle}
                            <span class="badge preset-tonal-primary text-xs flex flex-col items-start gap-2 p-2">
                                <div id="public" class="flex items-center gap-2">
                                    <Icon icon="mdi:puzzle-outline" width="0.8rem" height="0.8rem" />
                                    <span>{puzzle.pieces} pcs - {puzzle.brand}</span>
                                </div>
                                {#if isCreator}
                                    <div id="private" class="w-full text-xs text-surface-500">
                                        {#if puzzle.name}
                                            <span class="mr-2">Name: {puzzle.name}</span>
                                        {/if}
                                        <span>Barcode: {puzzle.barcode}</span>
                                    </div>
                                {/if}
                            </span>
                        {/each}
                    </div>
                {/if}

                <div class="space-y-2 text-sm grid grid-cols-2 gap-2">
                    <div class="flex items-center gap-2">
                        <Icon icon="mdi:clock-start" width="1.2rem" height="1.2rem" />
                        <span>Start: {formatTime(new Date(category.startTime))}</span>
                    </div>
                    <div class="justify-end flex items-center gap-2">
                        <Icon icon="mdi:clock-end" width="1.2rem" height="1.2rem" />
                        <span>End: {formatTime(new Date(category.endTime))}</span>
                    </div>
                </div>
            </div>
        {/each}
    </div>
{/if}
