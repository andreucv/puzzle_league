/**
 * Composable for managing category records — search, filtering, fetching, and selection.
 * Used by CategoryCard for LIVE and STOPPED variants.
 */

export function matchesSearch(record: any, query: string): boolean {
    const q = query.toLowerCase();
    if (record.tableNumber != null && String(record.tableNumber).includes(q)) return true;
    if (record.users?.some((u: any) => u.name?.toLowerCase().includes(q))) return true;
    if (record.userIntents?.some((ui: any) => ui.name?.toLowerCase().includes(q))) return true;
    return false;
}

/**
 * Mode 'split': fetches finished and unfinished separately (for LIVE — pending vs finished).
 * Mode 'unified': fetches all records once, splits client-side (for STOPPED — unresolved vs resolved).
 */
export function useCategoryRecords(getCategoryId: () => number, mode: 'split' | 'unified') {
    let searchQuery = $state('');

    // --- Split mode state (LIVE) ---
    let pendingRecords = $state<any[]>([]);
    let finishedRecords = $state<any[]>([]);
    let loadingPending = $state(false);
    let loadingFinished = $state(false);
    let selectedPendingRecord = $state<string | null>(null);
    let selectedFinishedRecord = $state<string | null>(null);

    // --- Unified mode state (STOPPED) ---
    let allRecords = $state<any[]>([]);
    let loadingAll = $state(false);
    let selectedDnfRecord = $state<string | null>(null);
    let selectedResolvedRecord = $state<string | null>(null);

    // Derived: unified mode splits
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

    // --- Fetchers ---
    async function fetchFinishedRecords() {
        loadingFinished = true;
        try {
            const res = await fetch(`/api/categories/${getCategoryId()}/records?finished=true`);
            if (res.ok) {
                const data = await res.json();
                finishedRecords = data.records ?? [];
            }
        } catch (err) {
            console.error('Failed to fetch finished records:', err);
        } finally {
            loadingFinished = false;
        }
    }

    async function fetchPendingRecords() {
        loadingPending = true;
        try {
            const res = await fetch(`/api/categories/${getCategoryId()}/records?finished=false`);
            if (res.ok) {
                const data = await res.json();
                pendingRecords = data.records ?? [];
            }
        } catch (err) {
            console.error('Failed to fetch pending records:', err);
        } finally {
            loadingPending = false;
        }
    }

    async function fetchAllRecords() {
        loadingAll = true;
        try {
            const [finishedRes, unfinishedRes] = await Promise.all([
                fetch(`/api/categories/${getCategoryId()}/records?finished=true`),
                fetch(`/api/categories/${getCategoryId()}/records?finished=false`)
            ]);
            const finished = finishedRes.ok ? (await finishedRes.json()).records ?? [] : [];
            const unfinished = unfinishedRes.ok ? (await unfinishedRes.json()).records ?? [] : [];
            allRecords = [...finished, ...unfinished];
        } catch (err) {
            console.error('Failed to fetch records:', err);
        } finally {
            loadingAll = false;
        }
    }

    function refreshAll() {
        if (mode === 'split') {
            fetchFinishedRecords();
            fetchPendingRecords();
        } else {
            fetchAllRecords();
        }
    }

    // Load on init
    $effect(() => {
        refreshAll();
    });

    return {
        // Search
        get searchQuery() { return searchQuery; },
        set searchQuery(v: string) { searchQuery = v; },

        // Split mode (LIVE)
        get pendingRecords() { return pendingRecords; },
        set pendingRecords(v: any[]) { pendingRecords = v; },
        get finishedRecords() { return finishedRecords; },
        set finishedRecords(v: any[]) { finishedRecords = v; },
        get loadingPending() { return loadingPending; },
        get loadingFinished() { return loadingFinished; },
        get filteredPending() { return filteredPending; },
        get filteredFinished() { return filteredFinished; },
        get selectedPendingRecord() { return selectedPendingRecord; },
        set selectedPendingRecord(v: string | null) { selectedPendingRecord = v; },
        get selectedFinishedRecord() { return selectedFinishedRecord; },
        set selectedFinishedRecord(v: string | null) { selectedFinishedRecord = v; },

        // Unified mode (STOPPED)
        get allRecords() { return allRecords; },
        set allRecords(v: any[]) { allRecords = v; },
        get loadingAll() { return loadingAll; },
        get unresolvedRecords() { return unresolvedRecords; },
        get resolvedRecords() { return resolvedRecords; },
        get filteredUnresolved() { return filteredUnresolved; },
        get filteredResolved() { return filteredResolved; },
        get selectedDnfRecord() { return selectedDnfRecord; },
        set selectedDnfRecord(v: string | null) { selectedDnfRecord = v; },
        get selectedResolvedRecord() { return selectedResolvedRecord; },
        set selectedResolvedRecord(v: string | null) { selectedResolvedRecord = v; },

        refreshAll
    };
}
