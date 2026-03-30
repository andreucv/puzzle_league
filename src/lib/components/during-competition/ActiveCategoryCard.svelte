<script lang="ts">
    import { calculateDuration, getCategoryTypeName } from '$lib/utils/category_utils';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import RecordSearchResults from './RecordSearchResults.svelte';
    import StopCategoryConfirmDialog from './StopCategoryConfirmDialog.svelte';
    import Icon from '@iconify/svelte';
    import { t } from '$lib/translations';

    import type { CategoryType } from '$lib/.prisma/generated/prisma/browser';

    interface CategoryData {
        id: number;
        type: CategoryType;
        description: string;
        subname?: string | null;
        status: string;
        realStartTime: string | null;
        realEndTime: string | null;
        totalRecords: number;
        finishedRecords: number;
        competitionId: number;
    }

    let {
        category,
        competitionName,
        isOrganizer,
        onRecordFinish,
        onCategoryUpdate
    }: {
        category: CategoryData;
        competitionName: string;
        isOrganizer: boolean;
        onRecordFinish: (recordId: string) => void;
        onCategoryUpdate: (category: CategoryData) => void;
    } = $props();

    // Live elapsed timer
    let currentTime = $state(new Date());
    $effect(() => {
        if (category.status === 'in_progress') {
            const interval = setInterval(() => {
                currentTime = new Date();
            }, 1000);
            return () => clearInterval(interval);
        }
    });

    // Search state
    let searchQuery = $state('');
    let searchResults = $state<any[]>([]);
    let isSearching = $state(false);
    let searchTimeout: ReturnType<typeof setTimeout> | null = null;
    let selectedRecord = $state<any | null>(null);

    // Records state
    let finishedRecords = $state<any[]>([]);
    let showFinishedRecords = $state(false);
    let loadingFinishedRecords = $state(false);

    let pendingRecords = $state<any[]>([]);
    let showPendingRecords = $state(false);
    let loadingPendingRecords = $state(false);

    let allRecords = $state<any[]>([]);
    let showAllRecords = $state(false);
    let loadingAllRecords = $state(false);

    function handleSearchInput() {
        if (searchTimeout) clearTimeout(searchTimeout);
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            searchResults = [];
            return;
        }
        searchTimeout = setTimeout(handleSearch, 300);
    }

    async function handleSearch() {
        if (!searchQuery.trim()) {
            searchResults = [];
            return;
        }
        isSearching = true;
        try {
            const res = await fetch(`/api/categories/${category.id}/records?search=${encodeURIComponent(searchQuery.trim())}`);
            if (res.ok) {
                const data = await res.json();
                searchResults = data.records ?? [];
            }
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            isSearching = false;
        }
    }

    function selectRecord(record: any) {
        selectedRecord = record;
        searchQuery = '';
        searchResults = [];
    }

    function clearSelectedRecord() {
        selectedRecord = null;
    }

    async function handleRecordFinish(recordId: string) {
        try {
            const response = await fetch(`/api/records/${recordId}/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finishTime: new Date().toISOString() })
            });
            if (response.ok) {
                selectedRecord = null;
                onRecordFinish(recordId);
                // Refresh all records lists
                refreshAllLists();
            }
        } catch (err) {
            console.error('Failed to record finish:', err);
        }
    }

    async function fetchFinishedRecords() {
        loadingFinishedRecords = true;
        try {
            const res = await fetch(`/api/categories/${category.id}/records?finished=true`);
            if (res.ok) {
                const data = await res.json();
                finishedRecords = data.records ?? [];
            }
        } catch (err) {
            console.error('Failed to fetch finished records:', err);
        } finally {
            loadingFinishedRecords = false;
        }
    }

    async function fetchPendingRecords() {
        loadingPendingRecords = true;
        try {
            const res = await fetch(`/api/categories/${category.id}/records?finished=false`);
            if (res.ok) {
                const data = await res.json();
                pendingRecords = data.records ?? [];
            }
        } catch (err) {
            console.error('Failed to fetch pending records:', err);
        } finally {
            loadingPendingRecords = false;
        }
    }

    async function fetchAllRecords() {
        loadingAllRecords = true;
        try {
            const res = await fetch(`/api/categories/${category.id}/records`);
            if (res.ok) {
                const data = await res.json();
                allRecords = data.records ?? [];
            }
        } catch (err) {
            console.error('Failed to fetch all records:', err);
        } finally {
            loadingAllRecords = false;
        }
    }

    function refreshAllLists() {
        fetchFinishedRecords();
        fetchPendingRecords();
        fetchAllRecords();
    }

    // Load records on mount
    $effect(() => {
        refreshAllLists();
    });

    // Stop category dialog
    let showStopDialog = $state(false);
    // Use locally-fetched pending records (more up-to-date than event stream counts)
    let unfinishedCount = $derived(
        pendingRecords.filter((r: any) => r.status === 'ACCEPTED').length
    );

    async function handleStopCategory() {
        try {
            const res = await fetch(`/api/categories/${category.id}/stop`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                showStopDialog = false;
                onCategoryUpdate(data.category);
            }
        } catch (err) {
            console.error('Failed to stop category:', err);
        }
    }

    let progressPercent = $derived(
        category.totalRecords > 0
            ? Math.round((category.finishedRecords / category.totalRecords) * 100)
            : 0
    );
</script>

<Card>
    <div class="border-t-4 border-success-500 -mx-4 -mt-4 px-4 pt-4 rounded-t-lg">
    <div class="space-y-3">
        <!-- Header: category name + stop button -->
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
            {#if isOrganizer}
                <button
                    class="btn-icon btn-icon-sm preset-filled-error-500"
                    onclick={() => showStopDialog = true}
                    title={$t('during_competition.stop')}
                >
                    <Icon icon="mdi:stop" width="1rem" />
                </button>
            {/if}
        </div>

        <!-- Search bar (top priority action) -->
        <div class="relative">
            <div class="relative">
                <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" width="1.2rem" />
                <input
                    type="text"
                    class="input bg-white/90 text-surface-900 placeholder:text-surface-500 pl-10 w-full"
                    placeholder={$t('during_competition.search_placeholder')}
                    bind:value={searchQuery}
                    oninput={handleSearchInput}
                />
                {#if isSearching}
                    <div class="absolute inset-y-0 right-3 flex items-center">
                        <Icon icon="mdi:loading" class="animate-spin text-surface-500" width="1rem" />
                    </div>
                {/if}
            </div>

            <!-- Dropdown results -->
            {#if searchResults.length > 0}
                <div class="absolute z-50 w-full mt-1 bg-surface-50-950 border border-surface-300-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {#each searchResults as record (record.id)}
                        <button
                            type="button"
                            class="w-full p-2 text-left hover:bg-surface-200-800 flex items-center gap-2 border-b border-surface-200-800 last:border-b-0"
                            onclick={() => selectRecord(record)}
                        >
                            {#if record.tableNumber != null}
                                <span class="badge preset-outlined-primary-500 font-mono text-xs">
                                    #{record.tableNumber}
                                </span>
                            {/if}
                            <div class="flex flex-wrap items-center gap-1 text-sm">
                                {#each record.users as user (user.id)}
                                    <span>{user.name}</span>
                                    {#if record.users.indexOf(user) < record.users.length - 1}
                                        <span class="text-surface-400">&</span>
                                    {/if}
                                {/each}
                                {#if record.userIntents && record.userIntents.length > 0}
                                    {#if record.users.length > 0}
                                        <span class="text-surface-400">&</span>
                                    {/if}
                                    {#each record.userIntents as userIntent (userIntent.id)}
                                        <span class="italic text-surface-500">{userIntent.name}</span>
                                        {#if record.userIntents.indexOf(userIntent) < record.userIntents.length - 1}
                                            <span class="text-surface-400">&</span>
                                        {/if}
                                    {/each}
                                {/if}
                            </div>
                        </button>
                    {/each}
                </div>
            {:else if searchQuery.trim().length >= 2 && !isSearching}
                <div class="absolute z-50 w-full mt-1 bg-surface-50-950 border border-surface-300-700 rounded-lg shadow-lg p-3">
                    <p class="text-sm text-surface-500">{$t('during_competition.no_results')}</p>
                </div>
            {/if}
        </div>

        <!-- Selected record actions -->
        {#if selectedRecord}
            <div class="rounded-lg bg-surface-50-950 p-3 space-y-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs text-surface-500 uppercase font-semibold">{$t('during_competition.selected_record')}</span>
                    <button class="btn btn-sm preset-tonal text-xs gap-1" onclick={clearSelectedRecord}>
                        <Icon icon="mdi:close" width="0.8rem" />
                    </button>
                </div>
                <RecordSearchResults
                    records={[selectedRecord]}
                    categoryRealStartTime={category.realStartTime}
                    {handleRecordFinish}
                />
            </div>
        {/if}

        <!-- Compact status strip: timer + progress count -->
        <div class="flex justify-between flex-wrap items-center gap-4 text-sm">
            {#if category.realStartTime}
                <span class="flex items-center gap-1">
                    <Icon icon="mdi:timer-sand" width="1rem" />
                    {calculateDuration(new Date(category.realStartTime), currentTime)}
                </span>
            {/if}
            <span class="flex items-center gap-1">
                <Icon icon="mdi:flag-checkered" width="1rem" />
                {category.finishedRecords}/{category.totalRecords}
            </span>
        </div>

        <!-- Thin progress bar -->
        <div class="w-full bg-white/20 rounded-full h-1.5">
            <div
                class="bg-white h-1.5 rounded-full transition-all duration-300"
                style="width: {progressPercent}%"
            ></div>
        </div>

        <!-- Collapsible pending records list -->
        {#if category.totalRecords - category.finishedRecords > 0}
            <div class="space-y-2">
                <button
                    class="btn btn-sm preset-tonal w-full justify-between"
                    onclick={() => showPendingRecords = !showPendingRecords}
                >
                    <span class="flex items-center gap-1">
                        <Icon icon="mdi:clock-outline" width="1rem" />
                        {$t('during_competition.pending_records')} ({category.totalRecords - category.finishedRecords})
                    </span>
                    <Icon
                        icon={showPendingRecords ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                        width="1rem"
                    />
                </button>

                {#if showPendingRecords}
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        {#if loadingPendingRecords}
                            <div class="flex items-center justify-center p-4">
                                <Icon icon="mdi:loading" class="animate-spin" width="1.5rem" />
                            </div>
                        {:else if pendingRecords.length > 0}
                            <RecordSearchResults
                                records={pendingRecords}
                                categoryRealStartTime={category.realStartTime}
                                {handleRecordFinish}
                            />
                        {:else}
                            <p class="text-sm text-surface-500 text-center p-4">
                                {$t('during_competition.no_pending_records')}
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}

        <!-- Collapsible finished records list -->
        {#if category.finishedRecords > 0}
            <div class="space-y-2">
                <button
                    class="btn btn-sm preset-tonal w-full justify-between"
                    onclick={() => showFinishedRecords = !showFinishedRecords}
                >
                    <span class="flex items-center gap-1">
                        <Icon icon="mdi:check-circle" width="1rem" />
                        {$t('during_competition.finished_records')} ({category.finishedRecords})
                    </span>
                    <Icon
                        icon={showFinishedRecords ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                        width="1rem"
                    />
                </button>

                {#if showFinishedRecords}
                    <div class="space-y-2 max-h-96 overflow-y-auto">
                        {#if loadingFinishedRecords}
                            <div class="flex items-center justify-center p-4">
                                <Icon icon="mdi:loading" class="animate-spin" width="1.5rem" />
                            </div>
                        {:else if finishedRecords.length > 0}
                            <RecordSearchResults
                                records={finishedRecords}
                                categoryRealStartTime={category.realStartTime}
                                {handleRecordFinish}
                            />
                        {:else}
                            <p class="text-sm text-surface-500 text-center p-4">
                                {$t('during_competition.no_finished_records')}
                            </p>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    </div>
</Card>

{#if showStopDialog}
    <StopCategoryConfirmDialog
        categoryName={getCategoryTypeName(category.type)}
        {competitionName}
        {unfinishedCount}
        onConfirm={handleStopCategory}
        onCancel={() => showStopDialog = false}
    />
{/if}
