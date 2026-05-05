/**
 * Composable for managing category entries — search, filtering, and fetching.
 * Used by CategoryCard for LIVE and STOPPED variants.
 * Selection state is managed by each EntryList instance internally.
 */

export function matchesSearch(entry: any, query: string): boolean {
    const q = query.toLowerCase();
    if (entry.tableNumber != null && String(entry.tableNumber).includes(q)) return true;
    if (entry.users?.some((u: any) => u.name?.toLowerCase().includes(q))) return true;
    if (entry.externalParticipants?.some((ui: any) => ui.name?.toLowerCase().includes(q))) return true;
    return false;
}

/**
 * Mode 'split': fetches finished and unfinished separately (for LIVE — pending vs finished).
 * Mode 'unified': fetches all entries once, splits client-side (for STOPPED — unresolved vs resolved).
 */
export function useCategoryRecords(getCategoryId: () => number, mode: 'split' | 'unified') {
    // Capture category ID once to avoid reactive reads inside $effect.
    // getCategoryId() is a closure over a reactive prop; calling it inside
    // an effect would make the effect re-run on every parent re-render.
    const categoryId = getCategoryId();

    let searchQuery = $state('');

    // --- Core state: single source of truth ---
    let allEntries = $state<any[]>([]);
    let loading = $state(false);

    // --- Derived splits ---
    // Split mode (LIVE): pending vs finished
    let pendingEntries = $derived(allEntries.filter(r => r.finishTime == null));
    let finishedEntries = $derived(allEntries.filter(r => r.finishTime != null));

    // Unified mode (STOPPED): unresolved vs resolved
    let unresolvedEntries = $derived(
        allEntries.filter(r => r.finishTime == null && r.nPiecesCompleted == null)
    );
    let resolvedEntries = $derived(
        allEntries.filter(r => r.finishTime != null || r.nPiecesCompleted != null)
    );

    // Filtered entries (search applied)
    let filteredPending = $derived(
        searchQuery.trim()
            ? pendingEntries.filter(r => matchesSearch(r, searchQuery.trim()))
            : pendingEntries
    );
    let filteredFinished = $derived(
        searchQuery.trim()
            ? finishedEntries.filter(r => matchesSearch(r, searchQuery.trim()))
            : finishedEntries
    );
    let filteredUnresolved = $derived(
        searchQuery.trim()
            ? unresolvedEntries.filter(r => matchesSearch(r, searchQuery.trim()))
            : unresolvedEntries
    );
    let filteredResolved = $derived(
        searchQuery.trim()
            ? resolvedEntries.filter(r => matchesSearch(r, searchQuery.trim()))
            : resolvedEntries
    );

    // --- Initial load tracking (only show loading spinner on first fetch, not background refreshes) ---
    let initialLoad = false;

    // --- Generation counter: discard stale fetch responses when a newer refresh has started ---
    let fetchGeneration = 0;

    // --- Debounce timer: coalesce rapid refreshAll() calls into a single fetch ---
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;

    // --- Fetcher: single request for all confirmed entries ---
    async function fetchEntries(generation: number) {
        if (!initialLoad) loading = true;
        try {
            const res = await fetch(`/api/categories/${categoryId}/entries`);
            if (generation !== fetchGeneration) return;
            if (res.ok) {
                const data = await res.json();
                if (generation !== fetchGeneration) return;
                allEntries = data.records ?? [];
            }
        } catch (err) {
            console.error('Failed to fetch entries:', err);
        } finally {
            if (generation === fetchGeneration) {
                loading = false;
            }
            initialLoad = true;
        }
    }

    function doFetch() {
        const generation = ++fetchGeneration;
        fetchEntries(generation);
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
        get allEntries() { return allEntries; },
        set allEntries(v: any[]) { allEntries = v; },
        get loading() { return loading; },

        // Split mode (LIVE) — derived from allEntries
        get pendingEntries() { return pendingEntries; },
        get finishedEntries() { return finishedEntries; },
        get loadingPending() { return loading; },
        get loadingFinished() { return loading; },
        get filteredPending() { return filteredPending; },
        get filteredFinished() { return filteredFinished; },

        // Unified mode (STOPPED) — derived from allEntries
        get loadingAll() { return loading; },
        get unresolvedEntries() { return unresolvedEntries; },
        get resolvedEntries() { return resolvedEntries; },
        get filteredUnresolved() { return filteredUnresolved; },
        get filteredResolved() { return filteredResolved; },

        refreshAll
    };
}
