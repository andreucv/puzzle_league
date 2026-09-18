<script lang="ts">
    import { calculateDuration, formatCountdown, formatTimeDelta } from '$lib/utils/category_utils';
    import CategoryCardTitle from '$lib/components/common/titles/CategoryCardTitle.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import EntryList from './EntryList.svelte';
    import LastFinishedBanner from './LastFinishedBanner.svelte';
    import OverflowMenu from './OverflowMenu.svelte';
    import ConfirmActionButton from '$lib/components/common/buttons/ConfirmActionButton.svelte';
    import SearchInput from '$lib/components/common/SearchInput.svelte';
    import { useCategoryEntries } from './useCategoryEntries.svelte';
    import { executeCategoryAction, type CategoryAction, type CategoryActionResult } from './category-actions';
    import type { OverflowAction } from './types';
    import { showSuccessToast, showErrorToast } from '$lib/utils/toast';
    import { t } from '$lib/translations';
    import { untrack } from 'svelte';
    import { Switch } from '@skeletonlabs/skeleton-svelte';

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
    import PlusCircleOutlineIcon from '@iconify-svelte/mdi/plus-circle-outline';
    import FormatListBulletedIcon from '@iconify-svelte/mdi/format-list-bulleted';
    import TimerOffOutlineIcon from '@iconify-svelte/mdi/timer-off-outline';

    import type { CategoryData } from '$lib/types/category';

    let {
        category,
        isOrganizer,
        autoStopAvailable = true,
        liveVersion,
        initialSelectedEntryId = null,
        onCategoryActionComplete,
        onAutoStopToggled
    }: {
        category: CategoryData;
        isOrganizer: boolean;
        autoStopAvailable?: boolean;
        liveVersion?: string | null;
        /** Deep-link (QR scan): entry to preselect once this card's records load. */
        initialSelectedEntryId?: string | null;
        onCategoryActionComplete?: (categoryId: number, action: CategoryAction, result: CategoryActionResult & { ok: true }) => void;
        onAutoStopToggled?: (categoryId: number, armed: boolean) => void;
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

    // --- Countdown timer (LIVE only) ---
    let theoreticalDurationMs = $derived(
        category.startTime && category.endTime
            ? new Date(category.endTime).getTime() - new Date(category.startTime).getTime()
            : 0
    );

    let totalDurationMs = $derived(
        theoreticalDurationMs + (category.extraMinutes * 60_000)
    );

    let elapsedMs = $derived(
        isLive && category.realStartTime
            ? currentTime.getTime() - new Date(category.realStartTime).getTime()
            : 0
    );

    let remainingMs = $derived(Math.max(0, totalDurationMs - elapsedMs));

    // --- Entries (LIVE and STOPPED) ---
    const records = untrack(() => hasRecords)
        ? useCategoryEntries(() => category.id, untrack(() => isLive) ? 'split' : 'unified')
        : null;

    // --- Re-fetch entries when live version changes (external update from another judge) ---
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
        category.finishedEntries;
        localFinishedCount = null;
    });

    // --- Debug: track record counts reactively ---
    $effect(() => {
        if (records) {
            const pending = records.pendingEntries?.length ?? '?';
            const finished = records.finishedEntries?.length ?? '?';
            // untrack category reads — we only care about count changes, not prop identity
            const id = untrack(() => category.id);
            const type = untrack(() => category.type);
            console.log(`[CategoryCard ${id} ${type}] pending: ${pending}, finished: ${finished}`);
        }
    });

    let effectiveFinishedCount = $derived(localFinishedCount ?? category.finishedEntries);

    let progressPercent = $derived(
        category.totalEntries > 0
            ? Math.round((effectiveFinishedCount / category.totalEntries) * 100)
            : 0
    );

    // --- Total pieces (STOPPED only) ---
    let totalPieces = $derived.by(() => {
        const puzzles = category.puzzles;
        if (!puzzles || puzzles.length === 0) return null;
        return puzzles.reduce((sum, p) => sum + p.pieces, 0);
    });

    // --- Category action handler ---
    async function handleCategoryAction(action: CategoryAction) {
        const result = await executeCategoryAction(category.id, action);
        if (result.ok) {
            onCategoryActionComplete?.(category.id, action, result);
            showSuccessToast($t(`during_competition.${action}_success`));
        } else {
            showErrorToast($t(`during_competition.${action}_error`), result.error);
        }
    }

    // --- Auto-stop toggle handler (organizer, LIVE only) ---
    let togglingAutoStop = $state(false);

    async function handleToggleAutoStop(enabled: boolean) {
        togglingAutoStop = true;
        try {
            const res = await fetch(`/api/categories/${category.id}/auto-stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            if (res.ok) {
                // Optimistic Ably update flows back into category.autoStop, which the
                // Switch is bound to — no manual revert needed on the control itself.
                onAutoStopToggled?.(category.id, enabled);
                showSuccessToast($t(enabled ? 'during_competition.auto_stop_enabled' : 'during_competition.auto_stop_disabled'));
            } else {
                const data = await res.json().catch(() => ({}));
                showErrorToast($t('during_competition.auto_stop_error'), data.error);
            }
        } catch {
            showErrorToast($t('during_competition.auto_stop_error'));
        } finally {
            togglingAutoStop = false;
        }
    }

    // --- Add time handler (organizer, LIVE only) ---
    let addingTime = $state(false);
    let showAddTimePopover = $state(false);

    async function handleAddTime(minutes: number) {
        addingTime = true;
        showAddTimePopover = false;
        try {
            const res = await fetch(`/api/categories/${category.id}/add-time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ minutes })
            });
            if (res.ok) {
                showSuccessToast($t('during_competition.add_time_success', { minutes }));
            } else {
                const data = await res.json().catch(() => ({}));
                showErrorToast($t('during_competition.add_time_error'), data.error);
            }
        } catch {
            showErrorToast($t('during_competition.add_time_error'));
        } finally {
            addingTime = false;
        }
    }

    // --- Overflow menu actions ---
    let overflowActions = $derived.by(() => {
        if (!isOrganizer) return [];
        const actions: OverflowAction[] = [];

        // Manage judges link for all states except COMPLETE and CANCELED
        if (!isComplete && !isCanceled) {
            actions.push({
                kind: 'link',
                icon: AccountGroupIcon,
                label: $t('during_competition.manage_judges'),
                href: `/competition/${category.competitionId}/manage_judges`,
                testId: `manage-judges-${category.id}`
            });
        }

        if (isUpcoming || isLive) {
            actions.push({
                kind: 'confirm',
                icon: CancelIcon,
                colorClass: 'preset-filled-warning-500',
                confirmTitle: $t('during_competition.cancel_confirm_title'),
                confirmMessage: $t('during_competition.cancel_confirm_message'),
                onConfirm: () => handleCategoryAction('cancel'),
                testId: `cancel-category-${category.id}`,
                label: $t('during_competition.cancel_category')
            });
        }

        if (isStopped) {
            actions.push({
                kind: 'confirm',
                icon: PlayIcon,
                colorClass: 'preset-filled-primary-500',
                confirmTitle: $t('during_competition.resume_confirm_title'),
                confirmMessage: $t('during_competition.resume_confirm_message'),
                onConfirm: () => handleCategoryAction('resume'),
                testId: `resume-category-${category.id}`,
                label: $t('during_competition.resume_category')
            });
            actions.push({
                kind: 'confirm',
                icon: CancelIcon,
                colorClass: 'preset-filled-warning-500',
                confirmTitle: $t('during_competition.cancel_confirm_title'),
                confirmMessage: $t('during_competition.cancel_confirm_message'),
                onConfirm: () => handleCategoryAction('cancel'),
                testId: `cancel-category-${category.id}`,
                label: $t('during_competition.cancel_category')
            });
            actions.push({
                kind: 'confirm',
                icon: RestartIcon,
                colorClass: 'preset-filled-error-500',
                confirmTitle: $t('during_competition.restart_confirm_title'),
                confirmMessage: $t('during_competition.restart_confirm_message'),
                onConfirm: () => handleCategoryAction('restart'),
                testId: `restart-category-${category.id}`,
                label: $t('during_competition.restart_category')
            });
        }

        if (isComplete || isCanceled) {
            actions.push({
                kind: 'confirm',
                icon: RestartIcon,
                colorClass: 'preset-filled-warning-500',
                confirmTitle: $t('during_competition.restart_confirm_title'),
                confirmMessage: $t('during_competition.restart_confirm_message'),
                onConfirm: () => handleCategoryAction('restart'),
                testId: `restart-category-${category.id}`,
                label: $t('during_competition.restart_category')
            });
        }

        return actions;
    });

    let overflowMenuTestId = $derived(
        isStopped ? `overflow-menu-stopped-${category.id}` : `overflow-menu-${category.id}`
    );

    // --- Finish confirmation banner (LIVE finish only) ---
    // Holds the id of the judge's most recent finish so they get feedback on WHAT they
    // marked. Position, gap and names are derived live from the finished entries list so
    // they stay in sync with finishes coming from other judges via Ably.
    // Auto-dismisses after 10s; a new finish replaces it and resets the timer.
    const BANNER_DURATION_MS = 10000;
    let lastFinishedId = $state<string | null>(null);
    let bannerTimer: ReturnType<typeof setTimeout> | null = null;

    function clearBanner() {
        if (bannerTimer) {
            clearTimeout(bannerTimer);
            bannerTimer = null;
        }
        lastFinishedId = null;
    }

    function showFinishedBanner(recordId: string) {
        if (bannerTimer) clearTimeout(bannerTimer);
        lastFinishedId = recordId;
        bannerTimer = setTimeout(() => { lastFinishedId = null; bannerTimer = null; }, BANNER_DURATION_MS);
    }

    // Derive the banner content from the live finished list (ranked by finish time),
    // so the position and gap-to-previous reflect every judge's marks, not a snapshot.
    let bannerInfo = $derived.by(() => {
        if (!lastFinishedId || !records) return null;
        const finished = records.finishedEntries
            .filter((r: any) => r.finishTime)
            .slice()
            .sort((a: any, b: any) => new Date(a.finishTime).getTime() - new Date(b.finishTime).getTime());
        const idx = finished.findIndex((r: any) => r.id === lastFinishedId);
        if (idx === -1) return null;

        const record = finished[idx];
        const finishDate = new Date(record.finishTime);
        const names = [
            ...(record.users ?? []).map((u: any) => u.name),
            ...(record.externalParticipants ?? []).map((p: any) => p.name)
        ];
        return {
            recordId: record.id as string,
            position: idx + 1,
            tableNumber: (record.tableNumber ?? null) as number | null,
            names,
            duration: category.realStartTime
                ? calculateDuration(new Date(category.realStartTime), finishDate)
                : null,
            gap: idx > 0 ? formatTimeDelta(new Date(finished[idx - 1].finishTime), finishDate) : null
        };
    });

    // Clean up the timer when the card unmounts
    $effect(() => () => {
        if (bannerTimer) clearTimeout(bannerTimer);
    });

    async function handleBannerUndo() {
        if (!bannerInfo) return;
        const recordId = bannerInfo.recordId;
        clearBanner();
        await handleRecordUndoFinish(recordId);
    }

    // --- Record action handlers ---
    // Each handler performs an optimistic local update after a successful API call.
    // Selection clearing is handled by EntryList internally.

    async function handleRecordFinish(recordId: string) {
        if (!records) return;
        const finishTime = new Date();
        const response = await fetch(`/api/entries/${recordId}/result`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ finishTime: finishTime.toISOString() })
        });
        if (response.ok) {
            records.allEntries = records.allEntries.map((r: any) =>
                r.id === recordId ? { ...r, finishTime: finishTime.toISOString() } : r
            );
            showFinishedBanner(recordId);
            localFinishedCount = records.finishedEntries.length;
            // No refreshAll() here — the Ably event will trigger a version change
            // which the version-tracking effect uses to refresh only this card's records.
        }
    }

    async function handleRecordUndoFinish(recordId: string) {
        if (!records) return;
        const response = await fetch(`/api/entries/${recordId}/result`, { method: 'DELETE' });
        if (response.ok) {
            records.allEntries = records.allEntries.map((r: any) =>
                r.id === recordId ? { ...r, finishTime: null } : r
            );
            localFinishedCount = records.finishedEntries.length;
        }
    }

    async function handleSubmitPieces(recordId: string, data?: { nPiecesCompleted: number }) {
        if (!records || !data) return;
        const res = await fetch(`/api/entries/${recordId}/pieces`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nPiecesCompleted: data.nPiecesCompleted })
        });
        if (res.ok) {
            records.allEntries = records.allEntries.map((r: any) =>
                r.id === recordId ? { ...r, nPiecesCompleted: data.nPiecesCompleted } : r
            );
        } else {
            const errorData = await res.json().catch(() => ({}));
            console.error('Failed to update pieces:', res.status, errorData);
        }
    }

    async function handleUndoPieces(recordId: string) {
        if (!records) return;
        const res = await fetch(`/api/entries/${recordId}/pieces`, { method: 'DELETE' });
        if (res.ok) {
            records.allEntries = records.allEntries.map((r: any) =>
                r.id === recordId ? { ...r, nPiecesCompleted: null } : r
            );
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

    // Used to disable EntryList transitions during search to prevent viewport jitter
    let isSearching = $derived(!!records?.searchQuery.trim());

</script>

<Card>
    <div class={borderClass}>
    <div class="space-y-3">
        <!-- Header: category name + action buttons -->
        <div class="flex items-center justify-between gap-2">
            <CategoryCardTitle type={category.type} subname={category.subname} />

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
                    {#if overflowActions.length > 0}
                        <OverflowMenu actions={overflowActions} testId={overflowMenuTestId} />
                    {/if}

                    <!-- Primary action button -->
                    {#if isUpcoming}
                        <ConfirmActionButton
                            icon={PlayIcon}
                            colorClass="preset-filled-success-500"
                            confirmTitle={$t('during_competition.start_confirm_title')}
                            confirmMessage={$t('during_competition.start_confirm_message')}
                            onConfirm={() => handleCategoryAction('start')}
                            testId="start-category-{category.id}"
                        />
                    {:else if isLive}
                        <ConfirmActionButton
                            icon={StopIcon}
                            colorClass="preset-filled-error-500"
                            confirmTitle={$t('during_competition.stop_confirm_title')}
                            confirmMessage={$t('during_competition.stop_confirm_message')}
                            onConfirm={() => handleCategoryAction('stop')}
                            testId="stop-category-{category.id}"
                        />
                    {:else if isStopped}
                        <ConfirmActionButton
                            icon={CheckCircleOutlineIcon}
                            colorClass="preset-filled-success-500"
                            confirmTitle={$t('during_competition.complete_confirm_title')}
                            confirmMessage={$t('during_competition.complete_confirm_message')}
                            onConfirm={() => handleCategoryAction('complete')}
                            testId="complete-category-{category.id}"
                        />
                    {:else if isComplete || isCanceled}
                        <ConfirmActionButton
                            icon={RestartIcon}
                            colorClass="preset-filled-warning-500"
                            confirmTitle={$t('during_competition.restart_confirm_title')}
                            confirmMessage={$t('during_competition.restart_confirm_message')}
                            onConfirm={() => handleCategoryAction('restart')}
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
            {#if isLive || (isStopped && records.allEntries.length > 0)}
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
                    {category.totalEntries} {$t('during_competition.entries')}
                </span>
            </div>
        {:else if isLive}
            <div class="flex justify-between flex-wrap items-center gap-4 text-sm">
                {#if category.realStartTime && theoreticalDurationMs > 0}
                    <div class="relative">
                        {#if isOrganizer}
                            <button
                                type="button"
                                class="flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors
                                    {remainingMs < 60_000 && remainingMs > 0
                                        ? 'text-error-500 border-error-500/40 bg-error-500/10 animate-pulse'
                                        : remainingMs === 0
                                            ? 'text-error-500 border-error-500/40 bg-error-500/10'
                                            : remainingMs < 900_000
                                                ? 'border-warning-500/40 bg-warning-500/10 text-warning-700 dark:text-warning-300 hover:bg-warning-500/20'
                                                : 'border-success-500/40 bg-success-500/10 text-success-700 dark:text-success-300 hover:bg-success-500/20'}"
                                onclick={() => showAddTimePopover = !showAddTimePopover}
                            >
                                <TimerSandIcon width="1rem" height="1rem" />
                                {formatCountdown(remainingMs)}
                                <PlusCircleOutlineIcon width="0.85rem" height="0.85rem" class="opacity-60" />
                            </button>
                        {:else}
                            <span class="flex items-center gap-1 {remainingMs < 60_000 && remainingMs > 0 ? 'text-error-500 animate-pulse' : remainingMs === 0 ? 'text-error-500' : remainingMs < 900_000 ? 'text-warning-500' : 'text-success-500'}">
                                <TimerSandIcon width="1rem" height="1rem" />
                                {formatCountdown(remainingMs)}
                            </span>
                        {/if}
                        {#if showAddTimePopover && isOrganizer}
                            <!-- svelte-ignore a11y_click_events_have_key_events -->
                            <!-- svelte-ignore a11y_no_static_element_interactions -->
                            <div class="fixed inset-0 z-40" onclick={() => showAddTimePopover = false}></div>
                            <div class="absolute left-0 top-full mt-1 z-50 bg-surface-50-950 border border-surface-300-700 rounded-lg shadow-lg p-2">
                                <p class="text-xs text-surface-500 mb-1.5 whitespace-nowrap">{$t('during_competition.add_time_label')}</p>
                                <div class="flex items-center gap-1">
                                    {#each [5, 10, 15] as minutes}
                                        <button
                                            type="button"
                                            class="btn btn-sm preset-tonal-warning text-xs"
                                            disabled={addingTime}
                                            onclick={() => handleAddTime(minutes)}
                                        >
                                            +{minutes}m
                                        </button>
                                    {/each}
                                </div>
                            </div>
                        {/if}
                    </div>
                {:else if category.realStartTime}
                    <span class="flex items-center gap-1">
                        <TimerSandIcon width="1rem" height="1rem" />
                        {calculateDuration(new Date(category.realStartTime), currentTime)}
                    </span>
                {/if}
                <span class="flex items-center gap-1">
                    <FlagCheckeredIcon width="1rem" height="1rem" />
                    {effectiveFinishedCount}/{category.totalEntries}
                </span>
                {#if isOrganizer}
                    <Switch
                        checked={category.autoStop}
                        onCheckedChange={(e) => handleToggleAutoStop(e.checked)}
                        disabled={!autoStopAvailable || togglingAutoStop}
                        title={!autoStopAvailable ? $t('during_competition.auto_stop_unavailable') : ''}
                        data-testid="auto-stop-toggle-live-{category.id}"
                        class="flex items-center gap-1.5 {!autoStopAvailable ? 'opacity-50 cursor-not-allowed' : ''}"
                    >
                        <Switch.Label class="flex items-center gap-1 text-xs cursor-pointer">
                            <TimerOffOutlineIcon width="0.8rem" height="0.8rem" />
                            <span>{$t('during_competition.auto_stop')}</span>
                        </Switch.Label>
                        <Switch.Control class="preset-filled-surface-300-700 data-[state=checked]:preset-filled-warning-500">
                            <Switch.Thumb />
                        </Switch.Control>
                        <Switch.HiddenInput />
                    </Switch>
                {:else if category.autoStop}
                    <span class="badge preset-tonal-warning gap-1 text-xs" data-testid="auto-stop-badge-{category.id}">
                        <TimerOffOutlineIcon width="0.8rem" height="0.8rem" />
                        {$t('during_competition.auto_stop')}
                    </span>
                {/if}
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
                    {records?.resolvedEntries.length ?? 0}/{category.totalEntries}
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
                    {category.finishedEntries}/{category.totalEntries}
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
            {#if bannerInfo}
                <LastFinishedBanner
                    recordId={bannerInfo.recordId}
                    position={bannerInfo.position}
                    tableNumber={bannerInfo.tableNumber}
                    names={bannerInfo.names}
                    duration={bannerInfo.duration}
                    gap={bannerInfo.gap}
                    onUndo={handleBannerUndo}
                />
            {/if}

            <EntryList
                icon={ClockOutlineIcon}
                label={$t('during_competition.pending_records')}
                records={records.filteredPending}
                loading={records.loadingPending}
                categoryRealStartTime={category.realStartTime}
                mode="finish"
                onAction={handleRecordFinish}
                emptyMessage={$t('during_competition.no_pending_records')}
                initialOpen={true}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredPending.length > 0}
                {isSearching}
                initialSelectedId={initialSelectedEntryId}
            />

            <EntryList
                icon={CheckCircleIcon}
                label={$t('during_competition.finished_records')}
                records={records.filteredFinished}
                loading={records.loadingFinished}
                categoryRealStartTime={category.realStartTime}
                mode="undo-finish"
                onAction={handleRecordUndoFinish}
                emptyMessage={$t('during_competition.no_finished_records')}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredFinished.length > 0}
                {isSearching}
                initialSelectedId={initialSelectedEntryId}
            />
        {/if}

        <!-- Record lists (STOPPED) -->
        {#if isStopped && records}
            <EntryList
                icon={PuzzlePieceIcon}
                label={$t('during_competition.dnf_records')}
                records={records.filteredUnresolved}
                loading={records.loadingAll}
                categoryRealStartTime={category.realStartTime}
                mode="pieces"
                onAction={handleSubmitPieces}
                {totalPieces}
                emptyMessage={$t('during_competition.all_records_reviewed')}
                initialOpen={true}
                alwaysShow={true}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredUnresolved.length > 0}
                {isSearching}
                initialSelectedId={initialSelectedEntryId}
            />

            <EntryList
                icon={FlagCheckeredIcon}
                label={$t('during_competition.finished_records')}
                records={records.filteredResolved}
                loading={records.loadingAll}
                categoryRealStartTime={category.realStartTime}
                mode="undo-pieces"
                onAction={handleUndoPieces}
                {totalPieces}
                emptyMessage={$t('during_competition.no_finished_records')}
                forceOpen={records.searchQuery.trim() !== '' && records.filteredResolved.length > 0}
                {isSearching}
                initialSelectedId={initialSelectedEntryId}
            />
        {/if}

        <!-- Bottom links -->
        {#if isUpcoming && isOrganizer}
            <a
                href="/competition/{category.competitionId}/manage_judges"
                class="btn btn-sm preset-tonal-primary gap-1 w-fit"
            >
                <AccountGroupIcon width="0.9rem" height="0.9rem" />
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
