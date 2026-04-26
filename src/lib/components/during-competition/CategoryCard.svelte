<script lang="ts">
    import { calculateDuration } from '$lib/utils/category_utils';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import RecordList from './RecordList.svelte';
    import OverflowMenu from './OverflowMenu.svelte';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import SearchInput from '$lib/components/SearchInput.svelte';
    import { useCategoryRecords } from './useCategoryRecords.svelte';
    import { t } from '$lib/translations';
    import { untrack } from 'svelte';

    // Icons
    import PlayIcon from '@iconify-svelte/mdi/play';
    import StopIcon from '@iconify-svelte/mdi/stop';
    import CancelIcon from '@iconify-svelte/mdi/cancel';
    import RestartIcon from '@iconify-svelte/mdi/restart';
    import CheckCircleOutlineIcon from '@iconify-svelte/mdi/check-circle-outline';
    import CheckIcon from '@iconify-svelte/mdi/check';
    import FlagCheckeredIcon from '@iconify-svelte/mdi/flag-checkered';
    import TimerSandIcon from '@iconify-svelte/mdi/timer-sand';
    import TimerCheckIcon from '@iconify-svelte/mdi/timer-check';
    import ClockStartIcon from '@iconify-svelte/mdi/clock-start';
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import AccountGroupIcon from '@iconify-svelte/mdi/account-group';
    import PuzzlePieceIcon from '@iconify-svelte/mdi/puzzle';
    import FormatListBulletedIcon from '@iconify-svelte/mdi/format-list-bulleted';

    import type { CategoryData } from '$lib/types/category';

    let {
        category,
        isOrganizer,
        liveVersion,
        onStartCategory,
        onStopCategory,
        onCompleteCategory,
        onResumeCategory,
        onCancelCategory,
        onRestartCategory
    }: {
        category: CategoryData;
        isOrganizer: boolean;
        liveVersion?: string | null;
        onStartCategory?: (id: number) => void;
        onStopCategory?: (id: number) => void;
        onCompleteCategory?: (id: number) => void;
        onResumeCategory?: (id: number) => void;
        onCancelCategory?: (id: number) => void;
        onRestartCategory?: (id: number) => void;
    } = $props();

    let status = $derived(category.status);
    let isLive = $derived(status === 'LIVE');
    let isStopped = $derived(status === 'STOPPED');
    let isUpcoming = $derived(status === 'NOT_STARTED');
    let isComplete = $derived(status === 'COMPLETE');
    let isCanceled = $derived(status === 'CANCELED');
    let hasRecords = $derived(isLive || isStopped);

    // --- Live elapsed timer (LIVE only) ---
    let currentTime = $state(new Date());
    $effect(() => {
        if (isLive) {
            const interval = setInterval(() => { currentTime = new Date(); }, 1000);
            return () => clearInterval(interval);
        }
    });

    // --- Records (LIVE and STOPPED) ---
    const records = untrack(() => hasRecords)
        ? useCategoryRecords(() => category.id, untrack(() => isLive) ? 'split' : 'unified')
        : null;

    // --- Re-fetch records when live version changes (external update from another judge) ---
    let trackedVersion: string | null | undefined = undefined;
    $effect(() => {
        const v = liveVersion;
        if (v && trackedVersion !== undefined && v !== trackedVersion) {
            records?.refreshAll();
        }
        trackedVersion = v;
    });

    // --- Optimistic finished count (LIVE only) ---
    let localFinishedCount = $state<number | null>(null);

    $effect(() => {
        category.finishedRecords;
        localFinishedCount = null;
    });

    // --- Debug: track record counts reactively ---
    $effect(() => {
        if (records) {
            const pending = records.pendingRecords?.length ?? '?';
            const finished = records.finishedRecords?.length ?? '?';
            // untrack category reads — we only care about count changes, not prop identity
            const id = untrack(() => category.id);
            const type = untrack(() => category.type);
            console.log(`[CategoryCard ${id} ${type}] pending: ${pending}, finished: ${finished}`);
        }
    });

    let effectiveFinishedCount = $derived(localFinishedCount ?? category.finishedRecords);

    let progressPercent = $derived(
        category.totalRecords > 0
            ? Math.round((effectiveFinishedCount / category.totalRecords) * 100)
            : 0
    );

    // --- Total pieces (STOPPED only) ---
    let totalPieces = $derived.by(() => {
        const puzzles = category.puzzles;
        if (!puzzles || puzzles.length === 0) return null;
        return puzzles.reduce((sum, p) => sum + p.pieces, 0);
    });

    // --- Overflow menu actions ---
    let overflowActions = $derived.by(() => {
        const actions: { icon: any; colorClass: string; confirmTitle: string; confirmMessage: string; onConfirm: () => void; testId: string; label: string }[] = [];

        if ((isUpcoming || isLive ) && onCancelCategory) {
            actions.push({
                icon: CancelIcon,
                colorClass: 'preset-filled-warning-500',
                confirmTitle: $t('during_competition.cancel_confirm_title'),
                confirmMessage: $t('during_competition.cancel_confirm_message'),
                onConfirm: () => onCancelCategory!(category.id),
                testId: `cancel-category-${category.id}`,
                label: $t('during_competition.cancel_category')
            });
        }

        if (isStopped) {
            if (onResumeCategory) {
                actions.push({
                    icon: PlayIcon,
                    colorClass: 'preset-filled-primary-500',
                    confirmTitle: $t('during_competition.resume_confirm_title'),
                    confirmMessage: $t('during_competition.resume_confirm_message'),
                    onConfirm: () => onResumeCategory!(category.id),
                    testId: `resume-category-${category.id}`,
                    label: $t('during_competition.resume_category')
                });
            }
            if (onCancelCategory) {
                actions.push({
                    icon: CancelIcon,
                    colorClass: 'preset-filled-warning-500',
                    confirmTitle: $t('during_competition.cancel_confirm_title'),
                    confirmMessage: $t('during_competition.cancel_confirm_message'),
                    onConfirm: () => onCancelCategory!(category.id),
                    testId: `cancel-category-${category.id}`,
                    label: $t('during_competition.cancel_category')
                });
            }
            if (onRestartCategory) {
                actions.push({
                    icon: RestartIcon,
                    colorClass: 'preset-filled-error-500',
                    confirmTitle: $t('during_competition.restart_confirm_title'),
                    confirmMessage: $t('during_competition.restart_confirm_message'),
                    onConfirm: () => onRestartCategory!(category.id),
                    testId: `restart-category-${category.id}`,
                    label: $t('during_competition.restart_category')
                });
            }
        }

        if ((isComplete || isCanceled) && onRestartCategory) {
            actions.push({
                icon: RestartIcon,
                colorClass: 'preset-filled-warning-500',
                confirmTitle: $t('during_competition.restart_confirm_title'),
                confirmMessage: $t('during_competition.restart_confirm_message'),
                onConfirm: () => onRestartCategory!(category.id),
                testId: `restart-category-${category.id}`,
                label: $t('during_competition.restart_category')
            });
        }

        return actions;
    });

    let overflowMenuTestId = $derived(
        isStopped ? `overflow-menu-stopped-${category.id}` : `overflow-menu-${category.id}`
    );

    // --- Record handlers (LIVE) ---
    async function handleRecordFinish(recordId: string) {
        if (!records) return;
        try {
            const response = await fetch(`/api/records/${recordId}/result`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ finishTime: new Date().toISOString() })
            });
            if (response.ok) {
                records.allRecords = records.allRecords.map((r: any) =>
                    r.id === recordId ? { ...r, finishTime: new Date().toISOString() } : r
                );
                localFinishedCount = records.finishedRecords.length;
                records.selectedPendingRecord = null;
                // No refreshAll() here — the Ably event will trigger a version change
                // which the version-tracking effect uses to refresh only this card's records.
            }
        } catch (err) {
            console.error('Failed to record finish:', err);
        }
    }

    async function handleRecordUndoFinish(recordId: string) {
        if (!records) return;
        try {
            const response = await fetch(`/api/records/${recordId}/result`, { method: 'DELETE' });
            if (response.ok) {
                records.allRecords = records.allRecords.map((r: any) =>
                    r.id === recordId ? { ...r, finishTime: null } : r
                );
                localFinishedCount = records.finishedRecords.length;
                records.selectedFinishedRecord = null;
            }
        } catch (err) {
            console.error('Failed to undo record finish:', err);
        }
    }

    // --- Record handlers (STOPPED) ---
    async function handleSubmitPieces(recordId: string, nPiecesCompleted: number) {
        if (!records) return;
        try {
            const res = await fetch(`/api/records/${recordId}/pieces`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nPiecesCompleted })
            });
            if (res.ok) {
                records.allRecords = records.allRecords.map((r: any) =>
                    r.id === recordId ? { ...r, nPiecesCompleted } : r
                );
                records.selectedDnfRecord = null;
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error('Failed to update pieces:', res.status, errorData);
            }
        } catch (err) {
            console.error('Failed to update pieces:', err);
        }
    }

    async function handleUndoPieces(recordId: string) {
        if (!records) return;
        try {
            const res = await fetch(`/api/records/${recordId}/pieces`, { method: 'DELETE' });
            if (res.ok) {
                records.allRecords = records.allRecords.map((r: any) =>
                    r.id === recordId ? { ...r, nPiecesCompleted: null } : r
                );
                records.selectedResolvedRecord = null;
            }
        } catch (err) {
            console.error('Failed to reset pieces:', err);
        }
    }

    // --- Helpers ---
    function formatTime(dateStr: string) {
        return new Date(dateStr).toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit' });
    }

    // Border stripe class
    let borderClass = $derived.by(() => {
        if (isLive) return 'border-t-4 border-success-500 -mx-4 -mt-4 px-4 pt-4 rounded-t-lg';
        if (isStopped) return 'border-t-4 border-warning-500 -mx-4 -mt-4 px-4 pt-4 rounded-t-lg';
        return '';
    });

</script>

<Card>
    <div class={borderClass}>
    <div class="space-y-3">
        <!-- Header: category name + action buttons -->
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname ?? category.description} />

            {#if isOrganizer}
                <div class="flex items-center gap-2">
                    <!-- Status badge (Completed/Canceled) -->
                    {#if isCanceled}
                        <div class="badge preset-tonal-error gap-1 text-xs">
                            <CancelIcon width="0.8rem" height="0.8rem" />
                            {$t('during_competition.canceled')}
                        </div>
                    {:else if isComplete}
                        <div class="badge preset-tonal-success gap-1 text-xs">
                            <CheckIcon width="0.8rem" height="0.8rem" />
                            {$t('during_competition.completed')}
                        </div>
                    {/if}

                    <!-- Overflow menu (when there are actions) -->
                    {#if overflowActions.length > 0 && !(isComplete || isCanceled)}
                        <OverflowMenu actions={overflowActions} testId={overflowMenuTestId} />
                    {/if}

                    <!-- Primary action button -->
                    {#if isUpcoming && onStartCategory}
                        <ConfirmActionButton
                            icon={PlayIcon}
                            colorClass="preset-filled-success-500"
                            confirmTitle={$t('during_competition.start_confirm_title')}
                            confirmMessage={$t('during_competition.start_confirm_message')}
                            onConfirm={() => onStartCategory!(category.id)}
                            testId="start-category-{category.id}"
                        />
                    {:else if isLive && onStopCategory}
                        <ConfirmActionButton
                            icon={StopIcon}
                            colorClass="preset-filled-error-500"
                            confirmTitle={$t('during_competition.stop_confirm_title')}
                            confirmMessage={$t('during_competition.stop_confirm_message')}
                            onConfirm={() => onStopCategory!(category.id)}
                            testId="stop-category-{category.id}"
                        />
                    {:else if isStopped && onCompleteCategory}
                        <ConfirmActionButton
                            icon={CheckCircleOutlineIcon}
                            colorClass="preset-filled-success-500"
                            confirmTitle={$t('during_competition.complete_confirm_title')}
                            confirmMessage={$t('during_competition.complete_confirm_message')}
                            onConfirm={() => onCompleteCategory!(category.id)}
                            testId="complete-category-{category.id}"
                        />
                    {:else if (isComplete || isCanceled) && onRestartCategory}
                        <ConfirmActionButton
                            icon={RestartIcon}
                            colorClass="preset-filled-warning-500"
                            confirmTitle={$t('during_competition.restart_confirm_title')}
                            confirmMessage={$t('during_competition.restart_confirm_message')}
                            onConfirm={() => onRestartCategory!(category.id)}
                            testId="restart-category-{category.id}"
                        />
                    {/if}
                </div>
            {:else if isComplete || isCanceled}
                <!-- Non-organizer: still show the status badge -->
                <div class="flex items-center gap-2">
                    {#if isCanceled}
                        <div class="badge preset-tonal-error gap-1 text-xs">
                            <CancelIcon width="0.8rem" height="0.8rem" />
                            {$t('during_competition.canceled')}
                        </div>
                    {:else}
                        <div class="badge preset-tonal-success gap-1 text-xs">
                            <CheckIcon width="0.8rem" height="0.8rem" />
                            {$t('during_competition.completed')}
                        </div>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Search bar (LIVE + STOPPED) -->
        {#if records}
            {#if isLive || (isStopped && records.allRecords.length > 0)}
                <SearchInput
                    bind:filter={records.searchQuery}
                    placeholder={$t('during_competition.search_placeholder')}
                />
            {/if}
        {/if}

        <!-- Status strip -->
        {#if isUpcoming && category.startTime}
            <div class="flex items-center gap-4 text-sm text-surface-600-400">
                <span class="flex items-center gap-1">
                    <ClockStartIcon width="1rem" height="1rem" />
                    {formatTime(category.startTime)}
                </span>
                <span class="flex items-center gap-1">
                    <AccountGroupIcon width="1rem" height="1rem" />
                    {category.totalRecords} {$t('during_competition.entries')}
                </span>
            </div>
        {:else if isLive}
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
        {:else if isStopped}
            <div class="flex items-center gap-4 text-sm text-surface-600-400">
                {#if category.realStartTime && category.realEndTime}
                    <span class="flex items-center gap-1">
                        <TimerCheckIcon width="1rem" height="1rem" />
                        {calculateDuration(new Date(category.realStartTime), new Date(category.realEndTime))}
                    </span>
                {/if}
                <span class="flex items-center gap-1">
                    <FlagCheckeredIcon width="1rem" height="1rem" />
                    {records?.resolvedRecords.length ?? 0}/{category.totalRecords}
                </span>
            </div>
        {:else if isComplete || isCanceled}
            <div class="flex items-center gap-4 text-sm text-surface-600-400">
                {#if category.realStartTime && category.realEndTime}
                    <span class="flex items-center gap-1">
                        <TimerCheckIcon width="1rem" height="1rem" />
                        {calculateDuration(new Date(category.realStartTime), new Date(category.realEndTime))}
                    </span>
                {/if}
                <span class="flex items-center gap-1">
                    <FlagCheckeredIcon width="1rem" height="1rem" />
                    {category.finishedRecords}/{category.totalRecords}
                </span>
            </div>
        {/if}

        <!-- Progress bar (LIVE only) -->
        {#if isLive}
            <div class="w-full bg-white/20 rounded-full h-1.5">
                <div
                    class="bg-white h-1.5 rounded-full transition-all duration-300"
                    style="width: {progressPercent}%"
                ></div>
            </div>
        {/if}

        <!-- Record lists (LIVE) -->
        {#if isLive && records}
            <RecordList
                icon={ClockOutlineIcon}
                label={$t('during_competition.pending_records')}
                records={records.filteredPending}
                loading={records.loadingPending}
                categoryRealStartTime={category.realStartTime}
                selectedRecord={records.selectedPendingRecord}
                onSelectRecord={(id) => records.selectedPendingRecord = records.selectedPendingRecord === id ? null : id}
                onFinish={handleRecordFinish}
                emptyMessage={$t('during_competition.no_pending_records')}
                initialOpen={true}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredPending.length > 0}
            />

            <RecordList
                icon={CheckCircleIcon}
                label={$t('during_competition.finished_records')}
                records={records.filteredFinished}
                loading={records.loadingFinished}
                categoryRealStartTime={category.realStartTime}
                selectedRecord={records.selectedFinishedRecord}
                onSelectRecord={(id) => records.selectedFinishedRecord = records.selectedFinishedRecord === id ? null : id}
                onUndoFinish={handleRecordUndoFinish}
                emptyMessage={$t('during_competition.no_finished_records')}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredFinished.length > 0}
            />
        {/if}

        <!-- Record lists (STOPPED) -->
        {#if isStopped && records}
            <RecordList
                icon={PuzzlePieceIcon}
                label={$t('during_competition.dnf_records')}
                records={records.filteredUnresolved}
                loading={records.loadingAll}
                categoryRealStartTime={category.realStartTime}
                selectedRecord={records.selectedDnfRecord}
                onSelectRecord={(id) => { records.selectedDnfRecord = records.selectedDnfRecord === id ? null : id; }}
                onSubmitPieces={handleSubmitPieces}
                {totalPieces}
                emptyMessage={$t('during_competition.all_records_reviewed')}
                initialOpen={true}
                alwaysShow={true}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredUnresolved.length > 0}
            />

            <RecordList
                icon={FlagCheckeredIcon}
                label={$t('during_competition.finished_records')}
                records={records.filteredResolved}
                loading={records.loadingAll}
                categoryRealStartTime={category.realStartTime}
                selectedRecord={records.selectedResolvedRecord}
                onSelectRecord={(id) => { records.selectedResolvedRecord = records.selectedResolvedRecord === id ? null : id; }}
                onUndoPieces={handleUndoPieces}
                {totalPieces}
                emptyMessage={$t('during_competition.no_finished_records')}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredResolved.length > 0}
            />
        {/if}

        <!-- Bottom links -->
        {#if isUpcoming && isOrganizer}
            <a
                href="/competition/{category.competitionId}/manage_judges"
                class="text-xs text-primary-500 hover:underline"
            >
                {$t('during_competition.manage_judges')}
            </a>
        {/if}

        {#if isComplete && !isCanceled}
            <a
                href="/competitions/competition_details/{category.competitionId}/results#category-{category.id}"
                class="btn btn-sm preset-tonal-primary gap-1 w-fit"
            >
                <FormatListBulletedIcon width="1rem" height="1rem" />
                {$t('during_competition.view_results')}
            </a>
        {/if}
    </div>
    </div>
</Card>
