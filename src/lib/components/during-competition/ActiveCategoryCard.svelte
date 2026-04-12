<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import RecordList from './RecordList.svelte';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import StopIcon from '@iconify-svelte/mdi/stop';
    import DotsVerticalIcon from '@iconify-svelte/mdi/dots-vertical';
    import CancelIcon from '@iconify-svelte/mdi/cancel';
    import MagnifyIcon from '@iconify-svelte/mdi/magnify';
    import TimerSandIcon from '@iconify-svelte/mdi/timer-sand';
    import FlagCheckeredIcon from '@iconify-svelte/mdi/flag-checkered';
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
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
        onCategoryUpdate,
        onCancelCategory
    }: {
        category: CategoryData;
        competitionName: string;
        isOrganizer: boolean;
        onRecordFinish: (recordId: string) => void;
        onCategoryUpdate: (category: CategoryData) => void;
        onCancelCategory: (categoryId: number) => void;
    } = $props();

    // Live elapsed timer
    let currentTime = $state(new Date());
    $effect(() => {
        if (category.status === 'LIVE') {
            const interval = setInterval(() => {
                currentTime = new Date();
            }, 1000);
            return () => clearInterval(interval);
        }
    });

    // Search state (client-side filtering)
    let searchQuery = $state('');

    // Records state
    let finishedRecords = $state<any[]>([]);
    let loadingFinishedRecords = $state(false);

    let pendingRecords = $state<any[]>([]);
    let loadingPendingRecords = $state(false);

    // Local count overrides for optimistic updates (null = use category prop)
    let localFinishedCount = $state<number | null>(null);

    // Overflow menu state
    let showOverflowMenu = $state(false);

    // Selected record for tap-to-finish/undo in lists
    let selectedPendingRecord = $state<string | null>(null);
    let selectedFinishedRecord = $state<string | null>(null);

    // Client-side search filtering
    function matchesSearch(record: any, query: string): boolean {
        const q = query.toLowerCase();
        if (record.tableNumber != null && String(record.tableNumber).includes(q)) return true;
        if (record.users?.some((u: any) => u.name?.toLowerCase().includes(q))) return true;
        if (record.userIntents?.some((ui: any) => ui.name?.toLowerCase().includes(q))) return true;
        return false;
    }

    let filteredPendingRecords = $derived(
        searchQuery.trim()
            ? pendingRecords.filter(r => matchesSearch(r, searchQuery.trim()))
            : pendingRecords
    );

    let filteredFinishedRecords = $derived(
        searchQuery.trim()
            ? finishedRecords.filter(r => matchesSearch(r, searchQuery.trim()))
            : finishedRecords
    );

    async function handleRecordFinish(recordId: string) {
        try {
            const response = await fetch(`/api/records/${recordId}/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finishTime: new Date().toISOString() })
            });
            if (response.ok) {
                // Optimistic update: move record from pending to finished
                const finishedRecord = pendingRecords.find(r => r.id === recordId);
                if (finishedRecord) {
                    pendingRecords = pendingRecords.filter(r => r.id !== recordId);
                    finishedRecords = [...finishedRecords, { ...finishedRecord, finishTime: new Date().toISOString() }];
                    localFinishedCount = finishedRecords.length;
                }
                selectedPendingRecord = null;
                onRecordFinish(recordId);
                // Confirm from server in background
                refreshAllLists();
            }
        } catch (err) {
            console.error('Failed to record finish:', err);
        }
    }

    async function handleRecordUndoFinish(recordId: string) {
        try {
            const response = await fetch(`/api/records/${recordId}/result`, {
                method: 'DELETE'
            });
            if (response.ok) {
                // Optimistic update: move record from finished to pending
                const record = finishedRecords.find(r => r.id === recordId);
                if (record) {
                    finishedRecords = finishedRecords.filter(r => r.id !== recordId);
                    pendingRecords = [...pendingRecords, { ...record, finishTime: null }];
                    localFinishedCount = finishedRecords.length;
                }
                selectedFinishedRecord = null;
                onRecordFinish(recordId);
                refreshAllLists();
            }
        } catch (err) {
            console.error('Failed to undo record finish:', err);
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

    function refreshAllLists() {
        fetchFinishedRecords();
        fetchPendingRecords();
    }

    // Load records on mount
    $effect(() => {
        refreshAllLists();
    });

    // Stop category handler (called by ConfirmActionButton)
    async function handleStopCategory() {
        try {
            const res = await fetch(`/api/categories/${category.id}/stop`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                onCategoryUpdate(data.category);
            }
        } catch (err) {
            console.error('Failed to stop category:', err);
        }
    }

    // Reset local counts when category props change (event stream delivered fresh data)
    $effect(() => {
        // Access category.finishedRecords to track it
        category.finishedRecords;
        localFinishedCount = null;
    });

    // Effective counts: use local overrides if available, else category props
    let effectiveFinishedCount = $derived(localFinishedCount ?? category.finishedRecords);
    let effectivePendingCount = $derived(category.totalRecords - effectiveFinishedCount);

    let progressPercent = $derived(
        category.totalRecords > 0
            ? Math.round((effectiveFinishedCount / category.totalRecords) * 100)
            : 0
    );

    function toggleOverflowMenu() {
        showOverflowMenu = !showOverflowMenu;
    }

    function closeOverflowMenu() {
        showOverflowMenu = false;
    }
</script>

<Card>
    <div class="border-t-4 border-success-500 -mx-4 -mt-4 px-4 pt-4 rounded-t-lg">
    <div class="space-y-3">
        <!-- Header: category name + action buttons -->
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
            {#if isOrganizer}
                <div class="flex items-center gap-2">
                    <!-- Overflow menu with Cancel option -->
                    <div class="relative">
                        <button
                            type="button"
                            class="btn-icon w-4 h-4 preset-tonal rounded-full"
                            onclick={toggleOverflowMenu}
                            data-testid="overflow-menu-{category.id}"
                        >
                            <DotsVerticalIcon width="1rem" height="1rem" />
                        </button>
                        {#if showOverflowMenu}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="fixed inset-0 z-40" onclick={closeOverflowMenu}></div>
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="absolute right-0 top-full mt-1 z-50 bg-surface-50-950 border border-surface-300-700 rounded-lg shadow-lg min-w-40">
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div class="p-1" onclick={closeOverflowMenu}>
                                    <ConfirmActionButton
                                        icon={CancelIcon}
                                        colorClass="preset-filled-warning-500"
                                        confirmTitle={$t('during_competition.cancel_confirm_title')}
                                        confirmMessage={$t('during_competition.cancel_confirm_message')}
                                        onConfirm={() => onCancelCategory(category.id)}
                                        testId="cancel-category-{category.id}"
                                        label={$t('during_competition.cancel_category')}
                                    />
                                </div>
                            </div>
                        {/if}
                    </div>
                    <ConfirmActionButton
                        icon={StopIcon}
                        colorClass="preset-filled-error-500"
                        confirmTitle={$t('during_competition.stop_confirm_title')}
                        confirmMessage={$t('during_competition.stop_confirm_message')}
                        onConfirm={handleStopCategory}
                        testId="stop-category-{category.id}"
                    />
                </div>
            {/if}
        </div>

        <!-- Search bar (client-side filter) -->
        <div class="relative">
            <MagnifyIcon class="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500" width="1.2rem" height="1.2rem" />
            <input
                type="text"
                class="input bg-white/90 text-surface-900 placeholder:text-surface-500 pl-10 w-full"
                placeholder={$t('during_competition.search_placeholder')}
                bind:value={searchQuery}
            />
        </div>

        <!-- Compact status strip: timer + progress count -->
        <div class="flex justify-between flex-wrap items-center gap-4 text-sm">
            {#if category.realStartTime}
                <span class="flex items-center gap-1">
                    <TimerSandIcon width="1rem" height="1rem" />
                    {calculateDuration(new Date(category.realStartTime), currentTime)}
                </span>
            {/if}
            <span class="flex items-center gap-1">
                <FlagCheckeredIcon width="1rem" height="1rem" />
                {effectiveFinishedCount}/{category.totalRecords}
            </span>
        </div>

        <!-- Thin progress bar -->
        <div class="w-full bg-white/20 rounded-full h-1.5">
            <div
                class="bg-white h-1.5 rounded-full transition-all duration-300"
                style="width: {progressPercent}%"
            ></div>
        </div>

        <RecordList
            icon={ClockOutlineIcon}
            label={$t('during_competition.pending_records')}
            records={filteredPendingRecords}
            loading={loadingPendingRecords}
            categoryRealStartTime={category.realStartTime}
            selectedRecord={selectedPendingRecord}
            onSelectRecord={(id) => selectedPendingRecord = selectedPendingRecord === id ? null : id}
            onFinish={handleRecordFinish}
            emptyMessage={$t('during_competition.no_pending_records')}
        />

        <RecordList
            icon={CheckCircleIcon}
            label={$t('during_competition.finished_records')}
            records={filteredFinishedRecords}
            loading={loadingFinishedRecords}
            categoryRealStartTime={category.realStartTime}
            selectedRecord={selectedFinishedRecord}
            onSelectRecord={(id) => selectedFinishedRecord = selectedFinishedRecord === id ? null : id}
            onUndoFinish={handleRecordUndoFinish}
            emptyMessage={$t('during_competition.no_finished_records')}
        />
    </div>
    </div>
</Card>
