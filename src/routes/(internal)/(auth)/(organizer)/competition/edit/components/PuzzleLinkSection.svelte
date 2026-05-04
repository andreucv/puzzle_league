<script lang="ts">
    import Icon from '@iconify/svelte';

    let {
        puzzleIds = $bindable([]),
        onUpdate,
        initialPuzzles = []
    }: {
        puzzleIds: string[];
        onUpdate: (ids: string[]) => void;
        initialPuzzles?: any[];
    } = $props();

    let searchQuery = $state('');
    let searchResults = $state<any[]>([]);
    let linkedPuzzles = $state<any[]>(initialPuzzles);
    let showSearch = $state(false);
    let searching = $state(false);
    let searchTimeout: ReturnType<typeof setTimeout>;

    async function loadLinkedPuzzles() {
        if (puzzleIds.length === 0) return;
        // Fetch each puzzle's details via search by their IDs
        // We'll search for each and match by ID
        try {
            const response = await fetch(`/api/puzzles/search?q=`);
            if (response.ok) {
                const allPuzzles = await response.json();
                linkedPuzzles = allPuzzles.filter((p: any) => puzzleIds.includes(p.id));
            }
        } catch {
            console.error('Failed to load linked puzzles');
        }
    }

    async function handleSearch(query: string) {
        searchQuery = query;
        if (query.length < 1) {
            searchResults = [];
            return;
        }

        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            searching = true;
            try {
                const response = await fetch(`/api/puzzles/search?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const results = await response.json();
                    // Filter out already-linked puzzles
                    searchResults = results.filter((p: any) => !puzzleIds.includes(p.id));
                }
            } catch {
                searchResults = [];
            } finally {
                searching = false;
            }
        }, 300);
    }

    function addPuzzle(puzzle: any) {
        const newIds = [...puzzleIds, puzzle.id];
        puzzleIds = newIds;
        linkedPuzzles = [...linkedPuzzles, puzzle];
        onUpdate(newIds);
        searchQuery = '';
        searchResults = [];
        showSearch = false;
    }

    function removePuzzle(puzzleId: string) {
        const newIds = puzzleIds.filter(id => id !== puzzleId);
        puzzleIds = newIds;
        linkedPuzzles = linkedPuzzles.filter(p => p.id !== puzzleId);
        onUpdate(newIds);
    }
</script>

<div class="mt-3">
    <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium flex items-center gap-1">
            <Icon icon="mdi:puzzle-outline" class="w-4 h-4 text-primary-500" />
            Puzzles
        </span>
        <button
            type="button"
            class="btn btn-sm preset-tonal rounded-lg"
            onclick={() => showSearch = !showSearch}
        >
            <Icon icon="mdi:plus" width="1rem" height="1rem" />
            Add Puzzle
        </button>
    </div>

    <!-- Linked Puzzles -->
    {#if linkedPuzzles.length > 0}
        <div class="flex flex-wrap gap-2 mb-2">
            {#each linkedPuzzles as puzzle}
                <div class="flex items-center gap-1.5 px-2 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 rounded-full text-xs border border-primary-200 dark:border-primary-700">
                    <Icon icon="mdi:puzzle-outline" class="w-3 h-3" />
                    <span class="font-medium">{puzzle.name || puzzle.brand}</span>
                    <span class="text-primary-600 dark:text-primary-400">{puzzle.pieces} pcs</span>
                    <button
                        type="button"
                        class="ml-0.5 hover:text-error-500 transition-colors"
                        onclick={() => removePuzzle(puzzle.id)}
                        title="Remove puzzle"
                    >
                        <Icon icon="mdi:close-circle" class="w-3.5 h-3.5" />
                    </button>
                </div>
            {/each}
        </div>
    {/if}

    <!-- Search Box -->
    {#if showSearch}
        <div class="relative">
            <input
                type="text"
                class="input bg-primary-50-950 text-sm"
                placeholder="Search by name, brand or barcode..."
                value={searchQuery}
                oninput={(e) => handleSearch((e.target as HTMLInputElement).value)}
            />
            {#if searching}
                <div class="absolute right-2 top-1/2 -translate-y-1/2">
                    <Icon icon="mdi:loading" class="w-4 h-4 animate-spin text-surface-500" />
                </div>
            {/if}

            {#if searchResults.length > 0}
                <div class="absolute z-10 w-full mt-1 card bg-surface-50 dark:bg-surface-900 shadow-xl rounded-lg max-h-48 overflow-y-auto border border-surface-200 dark:border-surface-700">
                    {#each searchResults as puzzle}
                        <button
                            type="button"
                            class="w-full flex items-center gap-2 p-2 hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors text-left"
                            onclick={() => addPuzzle(puzzle)}
                        >
                            <Icon icon="mdi:puzzle-outline" class="w-4 h-4 text-primary-500 flex-shrink-0" />
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium truncate">{puzzle.name || puzzle.brand}</p>
                                <p class="text-xs text-surface-500">{puzzle.pieces} pcs · {puzzle.brand} · {puzzle.barcode}</p>
                            </div>
                        </button>
                    {/each}
                </div>
            {:else if searchQuery.length > 0 && !searching}
                <div class="absolute z-10 w-full mt-1 card bg-surface-50 dark:bg-surface-900 shadow-xl rounded-lg p-3 border border-surface-200 dark:border-surface-700">
                    <p class="text-sm text-surface-500 text-center">No puzzles found</p>
                    <a href="/puzzles/edit" target="_blank" class="btn btn-sm preset-tonal-primary rounded-lg w-full mt-2">
                        <Icon icon="mdi:plus" width="1rem" height="1rem" />
                        Create new puzzle
                    </a>
                </div>
            {/if}
        </div>
    {/if}
</div>
