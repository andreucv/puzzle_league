<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import RecordList from './RecordList.svelte';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import CheckCircleOutlineIcon from '@iconify-svelte/mdi/check-circle-outline';
    import PlayIcon from '@iconify-svelte/mdi/play';
    import DotsVerticalIcon from '@iconify-svelte/mdi/dots-vertical';
    import CancelIcon from '@iconify-svelte/mdi/cancel';
    import RestartIcon from '@iconify-svelte/mdi/restart';
    import FlagCheckeredIcon from '@iconify-svelte/mdi/flag-checkered';
    import PuzzlePieceIcon from '@iconify-svelte/mdi/puzzle';
    import TimerCheckIcon from '@iconify-svelte/mdi/timer-check';
    import SearchInput from '$lib/components/SearchInput.svelte';
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
        puzzles?: { pieces: number }[];
    }

    let {
        category,
        isOrganizer,
        onCompleteCategory,
        onResumeCategory,
        onCancelCategory,
        onRestartCategory,
        onCategoryUpdate
    }: {
        category: CategoryData;
        isOrganizer: boolean;
        onCompleteCategory: (categoryId: number) => void;
        onResumeCategory: (categoryId: number) => void;
        onCancelCategory: (categoryId: number) => void;
        onRestartCategory: (categoryId: number) => void;
        onCategoryUpdate: (category: CategoryData) => void;
    } = $props();

    // All records state — fetch once, split client-side
    let allRecords = $state<any[]>([]);
    let loadingRecords = $state(false);

    // Overflow menu state
    let showOverflowMenu = $state(false);

    // Search state
    let searchQuery = $state('');

    // Selection state for each list
    let selectedDnfRecord = $state<string | null>(null);
    let selectedFinishedRecord = $state<string | null>(null);

    // Compute total pieces from category puzzles (null if no puzzles defined)
    let totalPieces = $derived.by(() => {
        const puzzles = category.puzzles;
        if (!puzzles || puzzles.length === 0) return null;
        return puzzles.reduce((sum, p) => sum + p.pieces, 0);
    });

    // Split records client-side
    let unresolvedRecords = $derived(
        allRecords.filter(r => r.finishTime == null && r.nPiecesCompleted == null)
    );
    let resolvedRecords = $derived(
        allRecords.filter(r => r.finishTime != null || r.nPiecesCompleted != null)
    );

    // Client-side search filtering
    function matchesSearch(record: any, query: string): boolean {
        const q = query.toLowerCase();
        if (record.tableNumber != null && String(record.tableNumber).includes(q)) return true;
        if (record.users?.some((u: any) => u.name?.toLowerCase().includes(q))) return true;
        if (record.userIntents?.some((ui: any) => ui.name?.toLowerCase().includes(q))) return true;
        return false;
    }

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

    async function fetchAllRecords() {
        loadingRecords = true;
        try {
            const [finishedRes, unfinishedRes] = await Promise.all([
                fetch(`/api/categories/${category.id}/records?finished=true`),
                fetch(`/api/categories/${category.id}/records?finished=false`)
            ]);
            const finished = finishedRes.ok ? (await finishedRes.json()).records ?? [] : [];
            const unfinished = unfinishedRes.ok ? (await unfinishedRes.json()).records ?? [] : [];
            allRecords = [...finished, ...unfinished];
        } catch (err) {
            console.error('Failed to fetch records:', err);
        } finally {
            loadingRecords = false;
        }
    }

    // Load records on mount
    $effect(() => {
        fetchAllRecords();
    });

    async function handleSubmitPieces(recordId: string, nPiecesCompleted: number) {
        try {
            const res = await fetch(`/api/records/${recordId}/pieces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nPiecesCompleted })
            });
            if (res.ok) {
                // Optimistic update: set nPiecesCompleted on the record
                allRecords = allRecords.map(r =>
                    r.id === recordId ? { ...r, nPiecesCompleted } : r
                );
                selectedDnfRecord = null;
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('Failed to update pieces:', res.status, errorData);
            }
        } catch (err) {
            console.error('Failed to update pieces:', err);
        }
    }

    async function handleUndoPieces(recordId: string) {
        try {
            const res = await fetch(`/api/records/${recordId}/pieces`, {
                method: 'DELETE'
            });
            if (res.ok) {
                // Optimistic update: clear nPiecesCompleted
                allRecords = allRecords.map(r =>
                    r.id === recordId ? { ...r, nPiecesCompleted: null } : r
                );
                selectedFinishedRecord = null;
            }
        } catch (err) {
            console.error('Failed to reset pieces:', err);
        }
    }

    function toggleOverflowMenu() {
        showOverflowMenu = !showOverflowMenu;
    }

    function closeOverflowMenu() {
        showOverflowMenu = false;
    }
</script>

<Card>
    <div class="border-t-4 border-warning-500 -mx-4 -mt-4 px-4 pt-4 rounded-t-lg">
    <div class="space-y-3">
        <!-- Header: category name + action buttons -->
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />
            {#if isOrganizer}
                <div class="flex items-center gap-2">
                    <!-- Overflow menu -->
                    <div class="relative">
                        <button
                            type="button"
                            class="btn-icon w-4 h-4 preset-tonal rounded-full"
                            onclick={toggleOverflowMenu}
                            data-testid="overflow-menu-stopped-{category.id}"
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
                                <div class="p-1 space-y-1" onclick={closeOverflowMenu}>
                                    <ConfirmActionButton
                                        icon={PlayIcon}
                                        colorClass="preset-filled-primary-500"
                                        confirmTitle={$t('during_competition.resume_confirm_title')}
                                        confirmMessage={$t('during_competition.resume_confirm_message')}
                                        onConfirm={() => onResumeCategory(category.id)}
                                        testId="resume-category-{category.id}"
                                        label={$t('during_competition.resume_category')}
                                    />
                                    <ConfirmActionButton
                                        icon={CancelIcon}
                                        colorClass="preset-filled-warning-500"
                                        confirmTitle={$t('during_competition.cancel_confirm_title')}
                                        confirmMessage={$t('during_competition.cancel_confirm_message')}
                                        onConfirm={() => onCancelCategory(category.id)}
                                        testId="cancel-category-{category.id}"
                                        label={$t('during_competition.cancel_category')}
                                    />
                                    <ConfirmActionButton
                                        icon={RestartIcon}
                                        colorClass="preset-filled-error-500"
                                        confirmTitle={$t('during_competition.restart_confirm_title')}
                                        confirmMessage={$t('during_competition.restart_confirm_message')}
                                        onConfirm={() => onRestartCategory(category.id)}
                                        testId="restart-category-{category.id}"
                                        label={$t('during_competition.restart_category')}
                                    />
                                </div>
                            </div>
                        {/if}
                    </div>
                    <!-- Complete Category button -->
                    <ConfirmActionButton
                        icon={CheckCircleOutlineIcon}
                        colorClass="preset-filled-success-500"
                        confirmTitle={$t('during_competition.complete_confirm_title')}
                        confirmMessage={$t('during_competition.complete_confirm_message')}
                        onConfirm={() => onCompleteCategory(category.id)}
                        testId="complete-category-{category.id}"
                    />
                </div>
            {/if}
        </div>

        <!-- Timing info -->
        <div class="flex items-center gap-4 text-sm text-surface-600-400">
            {#if category.realStartTime && category.realEndTime}
                <span class="flex items-center gap-1">
                    <TimerCheckIcon width="1rem" height="1rem" />
                    {calculateDuration(new Date(category.realStartTime), new Date(category.realEndTime))}
                </span>
            {/if}
            <span class="flex items-center gap-1">
                <FlagCheckeredIcon width="1rem" height="1rem" />
                {resolvedRecords.length}/{category.totalRecords}
            </span>
        </div>

        <!-- Search input -->
        {#if allRecords.length > 0}
            <SearchInput
                bind:filter={searchQuery}
                placeholder={$t('during_competition.search_placeholder')}
            />
        {/if}

        <!-- DNF Records (unresolved) — open by default -->
        <RecordList
            icon={PuzzlePieceIcon}
            label={$t('during_competition.dnf_records')}
            records={filteredUnresolved}
            loading={loadingRecords}
            categoryRealStartTime={category.realStartTime}
            selectedRecord={selectedDnfRecord}
            onSelectRecord={(id) => { selectedDnfRecord = selectedDnfRecord === id ? null : id; }}
            onSubmitPieces={handleSubmitPieces}
            {totalPieces}
            emptyMessage={$t('during_competition.all_records_reviewed')}
            initialOpen={true}
            alwaysShow={true}
        />

        <!-- Finished Records (resolved) -->
        <RecordList
            icon={FlagCheckeredIcon}
            label={$t('during_competition.finished_records')}
            records={filteredResolved}
            loading={loadingRecords}
            categoryRealStartTime={category.realStartTime}
            selectedRecord={selectedFinishedRecord}
            onSelectRecord={(id) => { selectedFinishedRecord = selectedFinishedRecord === id ? null : id; }}
            onUndoPieces={handleUndoPieces}
            {totalPieces}
            emptyMessage={$t('during_competition.no_finished_records')}
        />
    </div>
    </div>
</Card>
