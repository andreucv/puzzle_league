/**
 * Composable for managing category records — search, filtering, and fetching.
 * Used by CategoryCard for LIVE and STOPPED variants.
 * Selection state is managed by each EntryList instance internally.
 */

export function matchesSearch(record: any, query: string): boolean {
    const q = query.toLowerCase();
    if (record.tableNumber != null && String(record.tableNumber).includes(q)) return true;
    if (record.users?.some((u: any) => u.name?.toLowerCase().includes(q))) return true;
    if (record.externalParticipants?.some((ui: any) => ui.name?.toLowerCase().includes(q))) return true;
    return false;
}

/**
 * Mode 'split': fetches finished and unfinished separately (for LIVE — pending vs finished).
 * Mode 'unified': fetches all records once, splits client-side (for STOPPED — unresolved vs resolved).
 */
export function useCategoryRecords(getCategoryId: () => number, mode: 'split' | 'unified') {
    // Capture category ID once to avoid reactive reads inside $effect.
    // getCategoryId() is a closure over a reactive prop; calling it inside
    // an effect would make the effect re-run on every parent re-render.
    const categoryId = getCategoryId();

    let searchQuery = $state('');

    // --- Core state: single source of truth ---
    let allRecords = $state<any[]>([]);
    let loading = $state(false);

    // --- Derived splits ---
    // Split mode (LIVE): pending vs finished
    let pendingRecords = $derived(allRecords.filter(r => r.finishTime == null));
    let finishedRecords = $derived(allRecords.filter(r => r.finishTime != null));

    // Unified mode (STOPPED): unresolved vs resolved
    let unresolvedRecords = $derived(
        allRecords.filter(r => r.finishTime == null && r.nPiecesCompleted == null)
    );
    let resolvedRecords = $derived(
        allRecords.filter(r => r.finishTime != null || r.nPiecesCompleted != null)
    );

    // Filtered records (search applied)
    let filteredPending = $derived(
        searchQuery.trim()
            ? pendingRecords.filter(r => matchesSearch(r, searchQuery.trim()))
            : pendingRecords
    );
    let filteredFinished = $derived(
        searchQuery.trim()
            ? finishedRecords.filter(r => matchesSearch(r, searchQuery.trim()))
            : finishedRecords
    );
    let filteredUnresolved = $derived(
        searchQuery.trim()
            ? unresolvedRecords.filter(r => matchesSearch(r, searchQuery.trim()))
            : unresolvedRecords
    );
    let filteredResolved = $derived(
        searchQuery.trim()
            ? resolvedRecords.filter(r => matchesSearch(r, searchQuery.trim()))
            : resolvedRecords
    );

    // --- Initial load tracking (only show loading spinner on first fetch, not background refreshes) ---
    let initialLoad = false;

    // --- Generation counter: discard stale fetch responses when a newer refresh has started ---
    let fetchGeneration = 0;

    // --- Debounce timer: coalesce rapid refreshAll() calls into a single fetch ---
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    // --- Fetcher: single request for all confirmed records ---
    async function fetchRecords(generation: number) {
        if (!initialLoad) loading = true;
        try {
            const res = await fetch(`/api/categories/${categoryId}/records`);
            if (generation !== fetchGeneration) return;
            if (res.ok) {
                const data = await res.json();
                if (generation !== fetchGeneration) return;
                allRecords = data.records ?? [];
            }
        } catch (err) {
            console.error('Failed to fetch records:', err);
        } finally {
            if (generation === fetchGeneration) {
                loading = false;
            }
            initialLoad = true;
        }
    }

    function doFetch() {
        const generation = ++fetchGeneration;
        fetchRecords(generation);
    }

    function refreshAll() {
        if (refreshTimer) clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => {
            refreshTimer = null;
            doFetch();
        }, 150);
    }

    // Load on init — immediate, no debounce
    $effect(() => {
        doFetch();
    });

    return {
        // Search
        get searchQuery() { return searchQuery; },
        set searchQuery(v: string) { searchQuery = v; },

        // Core state
        get allRecords() { return allRecords; },
        set allRecords(v: any[]) { allRecords = v; },
        get loading() { return loading; },

        // Split mode (LIVE) — derived from allRecords
        get pendingRecords() { return pendingRecords; },
        get finishedRecords() { return finishedRecords; },
        get loadingPending() { return loading; },
        get loadingFinished() { return loading; },
        get filteredPending() { return filteredPending; },
        get filteredFinished() { return filteredFinished; },

        // Unified mode (STOPPED) — derived from allRecords
        get loadingAll() { return loading; },
        get unresolvedRecords() { return unresolvedRecords; },
        get resolvedRecords() { return resolvedRecords; },
        get filteredUnresolved() { return filteredUnresolved; },
        get filteredResolved() { return filteredResolved; },

        refreshAll
    };
}
