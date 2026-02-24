<script lang="ts">
    import Icon from '@iconify/svelte';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { CldImage } from 'svelte-cloudinary';
    import GenericTitle from '$lib/components/common/titles/GenericTitle.svelte';
    import { t } from '$lib/translations';

    let { data } = $props();
    let filter = $state('');

    const puzzles = data.props.puzzles;

    const filteredPuzzles = $derived(
        puzzles.filter((p: any) => {
            const q = filter.toLowerCase();
            return (
                (p.name?.toLowerCase().includes(q) ?? false) ||
                p.brand.toLowerCase().includes(q) ||
                p.barcode.toLowerCase().includes(q) ||
                String(p.pieces).includes(q)
            );
        })
    );
</script>

<GenericTitle text={$t('puzzles.catalog_title')} />

<div class="container mx-auto space-y-4">
    <div class="flex items-center justify-between gap-4">
        <SearchInput placeholder="Search puzzles by name, brand, barcode..." bind:filter />
        <a href="/puzzles/edit" class="btn preset-filled-primary-500 rounded-lg whitespace-nowrap">
            <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
            Add Puzzle
        </a>
    </div>

    <p class="text-sm text-surface-600 dark:text-surface-400">
        {filteredPuzzles.length} puzzle{filteredPuzzles.length !== 1 ? 's' : ''}
    </p>

    {#if filteredPuzzles.length > 0}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {#each filteredPuzzles as puzzle}
                <a href="/puzzles/edit/{puzzle.id}" class="card preset-outlined-surface-200-800 p-4 hover:preset-tonal-primary transition-all">
                    <div class="flex gap-3">
                        <div class="w-20 h-20 rounded-lg overflow-hidden bg-surface-200 dark:bg-surface-800 flex-shrink-0 flex items-center justify-center">
                            {#if puzzle.image_cld_id}
                                <CldImage src={puzzle.image_cld_id} width="80" height="80" alt={puzzle.name || puzzle.brand} crop="fill" gravity="auto" class="w-full h-full object-cover" />
                            {:else}
                                <Icon icon="mdi:puzzle" class="w-8 h-8 text-surface-400" />
                            {/if}
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-semibold text-sm truncate">{puzzle.name || puzzle.brand}</h3>
                            <div class="flex items-center gap-1 mt-1">
                                <Icon icon="mdi:puzzle-outline" class="w-4 h-4 text-primary-500" />
                                <span class="text-sm font-bold text-primary-600 dark:text-primary-400">{puzzle.pieces} pcs</span>
                            </div>
                            <p class="text-xs text-surface-600 dark:text-surface-400 mt-1">{puzzle.brand}</p>
                            <p class="text-xs text-surface-500 dark:text-surface-500 mt-0.5 font-mono truncate">{puzzle.barcode}</p>
                        </div>
                    </div>
                    {#if puzzle._count?.categories > 0}
                        <div class="mt-2 flex items-center gap-1 text-xs text-surface-500">
                            <Icon icon="mdi:link-variant" class="w-3 h-3" />
                            Used in {puzzle._count.categories} {puzzle._count.categories === 1 ? 'category' : 'categories'}
                        </div>
                    {/if}
                </a>
            {/each}
        </div>
    {:else}
        <div class="text-center py-12 border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg">
            <Icon icon="mdi:puzzle-outline" class="w-12 h-12 mx-auto text-surface-400 mb-4" />
            <h3 class="h4 mb-2 text-surface-600 dark:text-surface-300">No puzzles found</h3>
            <p class="text-surface-500 mb-4">Add your first puzzle to the catalog</p>
            <a href="/puzzles/edit" class="btn preset-filled-primary-500 rounded-lg">
                <Icon icon="mdi:plus" width="1.2rem" height="1.2rem" />
                Add Puzzle
            </a>
        </div>
    {/if}
</div>
