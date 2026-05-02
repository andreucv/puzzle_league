<script lang="ts">
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import CategoryCard from '$lib/components/during-competition/CategoryCard.svelte';
    import CollapsibleSection from '$lib/components/manage_inscriptions/CollapsibleSection.svelte';
    import { useAblyStream } from '$lib/events/client/use-ably-stream.svelte';
    import PlayCircleOutlineIcon from '@iconify-svelte/mdi/play-circle-outline';
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import AlertCircleOutlineIcon from '@iconify-svelte/mdi/alert-circle-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import WifiOffIcon from '@iconify-svelte/mdi/wifi-off';
    import InformationOutlineIcon from '@iconify-svelte/mdi/information-outline';
    import { t } from '$lib/translations';
    import { untrack } from 'svelte';
    import type { CategoryData } from '$lib/types/category';
    import type { CategoryStatusChangedEvent } from '$lib/events/types';
    import type { CategoryAction, CategoryActionResult } from '$lib/api/category-actions';

    let { data } = $props();

    // Extract competition ID once (stable for the page lifetime, comes from route param)
    const competitionId = untrack(() => data.props.competition.id);

    const competition = $derived(data.props.competition);
    const isOrganizer = $derived(data.props.userRole === 'organizer');
    const judgedCategoryIds = $derived(data.props.judgedCategoryIds as number[]);

    // Static category data from server (description, type, puzzles, etc.)
    // Cast: SvelteKit serializes Prisma Date fields to strings at the wire boundary
    let staticCategories = $derived(data.props.categories as unknown as CategoryData[]);

    // Ably stream: single source of truth for dynamic fields (status, counts, times)
    const ablyStream = useAblyStream(
        `competition:${competitionId}`,
        untrack(() => data.props.initialEventState),
        `/api/ably-token?competitionId=${competitionId}`
    );

    // When load() re-runs (after invalidation), sync the stream state
    $effect(() => {
        const newState = data.props.initialEventState;
        if (newState) {
            ablyStream.updateState(newState);
        }
    });

    // Merge static server data with dynamic Ably state, then filter by role
    let visibleCategories: CategoryData[] = $derived.by(() => {
        const liveState = ablyStream.state;
        const base = isOrganizer
            ? staticCategories
            : staticCategories.filter((c) => judgedCategoryIds.includes(c.id));

        if (!liveState) return base;

        return base.map((cat) => {
            const liveCat = liveState.categories.find((c) => c.id === cat.id);
            if (!liveCat) return cat;

            return {
                ...cat,
                status: liveCat.status,
                totalRecords: liveCat.totalRecords,
                finishedRecords: liveCat.finishedRecords,
                realStartTime: liveCat.realStartTime ?? cat.realStartTime,
                realEndTime: liveCat.realEndTime ?? cat.realEndTime
            };
        });
    });

    let activeCategories = $derived(visibleCategories.filter((c) => c.status === 'LIVE'));
    let stoppedCategories = $derived(visibleCategories.filter((c) => c.status === 'STOPPED'));
    let upcomingCategories = $derived(visibleCategories.filter((c) => c.status === 'NOT_STARTED'));
    let completedCategories = $derived(visibleCategories.filter((c) => c.status === 'COMPLETE'));
    let finishedCategories = $derived(visibleCategories.filter((c) => c.status === 'COMPLETE' || c.status === 'CANCELED'));
    let hasLiveOrStopped = $derived(activeCategories.length > 0 || stoppedCategories.length > 0);

    // Map category actions to the status they produce, for optimistic Ably updates
    const actionToStatus: Record<CategoryAction, string> = {
        start: 'LIVE',
        stop: 'STOPPED',
        cancel: 'CANCELED',
        complete: 'COMPLETE',
        resume: 'LIVE',
        restart: 'LIVE'
    };

    // Called by CategoryCard after a successful category action to apply optimistic Ably update
    function handleCategoryActionComplete(categoryId: number, action: CategoryAction, result: CategoryActionResult & { ok: true }) {
        ablyStream.applyLocalEvent({
            type: 'category.status_changed',
            categoryId,
            competitionId,
            status: actionToStatus[action],
            realStartTime: result.category.realStartTime,
            realEndTime: result.category.realEndTime
        } satisfies CategoryStatusChangedEvent);
    }

    // Per-category version: only changes when a specific category's data changes.
    // This prevents unrelated cards from re-fetching records on every Ably event.
    let categoryVersions = $derived.by(() => {
        const state = ablyStream.state;
        if (!state) return new Map<number, string>();
        return new Map(state.categories.map(c =>
            [c.id, `${c.status}:${c.finishedRecords}:${c.totalRecords}`]
        ));
    });

    type StreamMode = 'connected' | 'connecting' | 'error' | 'disconnected';
    let streamMode: StreamMode = $derived.by(() => {
        if (ablyStream.status === 'error') return 'error';
        if (ablyStream.status === 'disconnected') return 'disconnected';
        if (ablyStream.status === 'connecting' || ablyStream.status === 'reconnecting') return 'connecting';
        return 'connected';
    });
</script>

<div class="container mx-auto max-w-4xl space-y-4">
    <!-- Header -->
    <TitleBackButton
        href="/competitions/competition_details/{competitionId}"
        text={$t('during_competition.title')}
        subtitle={competition.name}
    >
        {#snippet trailing()}
            {#if streamMode === 'connected'}
                <span class="badge preset-tonal-success gap-1 text-xs" data-testid="stream-indicator-connected">
                    <span class="relative flex h-1.5 w-1.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-success-500"></span>
                    </span>
                    {$t('during_competition.polling_live')}
                </span>
            {:else if streamMode === 'error'}
                <span class="badge preset-tonal-error gap-1 text-xs" data-testid="stream-indicator-error">
                    <span class="inline-flex rounded-full h-1.5 w-1.5 bg-error-500"></span>
                    {$t('during_competition.polling_offline')}
                </span>
            {:else if streamMode === 'connecting'}
                <span class="badge preset-tonal-warning gap-1 text-xs" data-testid="stream-indicator-connecting">
                    <span class="inline-flex rounded-full h-1.5 w-1.5 bg-warning-500 animate-pulse"></span>
                    {$t('during_competition.polling_live')}
                </span>
            {/if}
        {/snippet}
    </TitleBackButton>

    <!-- Connection status banner -->
    {#if ablyStream.status === 'error'}
        <div class="p-2 rounded-lg bg-error-500/10 border border-error-500/30 text-sm text-error-600 flex items-center gap-2">
            <WifiOffIcon width="1rem" height="1rem" />
            {$t('during_competition.connection_error')}
        </div>
    {/if}

    <!-- Category Workflow Overview -->
    {#if visibleCategories.length > 0}
        <div class="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            <span class="inline-flex items-center gap-1">
                <span class="text-surface-500">{$t('during_competition.status_not_started')}</span>
                <span class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[0.65rem] font-bold {upcomingCategories.length > 0 ? 'bg-surface-300 dark:bg-surface-600 text-surface-800 dark:text-surface-100' : 'bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500'}">{upcomingCategories.length}</span>
            </span>
            <span class="text-surface-300">→</span>
            <span class="inline-flex items-center gap-1">
                <span class="text-surface-500">{$t('during_competition.status_live')}</span>
                <span class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[0.65rem] font-bold {activeCategories.length > 0 ? 'bg-warning-200 dark:bg-warning-800 text-warning-800 dark:text-warning-100' : 'bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500'}">{activeCategories.length}</span>
            </span>
            <span class="text-surface-300">→</span>
            <span class="inline-flex items-center gap-1">
                <span class="text-surface-500">{$t('during_competition.status_stopped')}</span>
                <span class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[0.65rem] font-bold {stoppedCategories.length > 0 ? 'bg-warning-200 dark:bg-warning-800 text-warning-800 dark:text-warning-100' : 'bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500'}">{stoppedCategories.length}</span>
            </span>
            <span class="text-surface-300">→</span>
            <span class="inline-flex items-center gap-1">
                <span class="text-surface-500">{$t('during_competition.status_complete')}</span>
                <span class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[0.65rem] font-bold {completedCategories.length > 0 ? 'bg-success-200 dark:bg-success-800 text-success-800 dark:text-success-100' : 'bg-surface-200 dark:bg-surface-700 text-surface-400 dark:text-surface-500'}">{completedCategories.length}</span>
            </span>
        </div>
    {/if}

    <!-- Stopped Categories Section (first, highest visibility) -->
    {#if stoppedCategories.length > 0}
        <div>
            <div class="flex items-center gap-2 mb-2">
                <AlertCircleOutlineIcon width="1rem" height="1rem" class="text-warning-500" />
                <span class="text-sm font-semibold">{$t('during_competition.stopped_section')}</span>
                <span class="badge preset-tonal-warning text-xs">{stoppedCategories.length}</span>
            </div>
            <div class="space-y-3">
                {#each stoppedCategories as cat (cat.id)}
                    <CategoryCard
                        category={cat}
                        {isOrganizer}
                        liveVersion={categoryVersions.get(cat.id) ?? null}
                        onCategoryActionComplete={handleCategoryActionComplete}
                    />
                {/each}
            </div>
        </div>
    {/if}

    <!-- Active Categories Section (always expanded, not collapsible) -->
    {#if activeCategories.length > 0}
        <div>
            <div class="flex items-center gap-2 mb-2">
                <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-warning-500"></span>
                </span>
                <PlayCircleOutlineIcon width="1rem" height="1rem" />
                <span class="text-sm font-semibold">{$t('during_competition.currently_running')}</span>
                <span class="badge preset-tonal-warning text-xs">{activeCategories.length}</span>
            </div>
            <div class="space-y-3">
                {#each activeCategories as cat (cat.id)}
                    <CategoryCard
                        category={cat}
                        {isOrganizer}
                        liveVersion={categoryVersions.get(cat.id) ?? null}
                        onCategoryActionComplete={handleCategoryActionComplete}
                    />
                {/each}
            </div>
        </div>
    {/if}

    <!-- Upcoming Categories Section (collapsible) -->
    {#if upcomingCategories.length > 0}
        <CollapsibleSection
            icon={ClockOutlineIcon}
            label={$t('during_competition.upcoming')}
            count={upcomingCategories.length}
            badgeClass="preset-tonal"
            testId="toggle-section-upcoming"
            open={!hasLiveOrStopped}
        >
            <div class="space-y-3">
                {#each upcomingCategories as cat (cat.id)}
                    <CategoryCard
                        category={cat}
                        {isOrganizer}
                        liveVersion={categoryVersions.get(cat.id) ?? null}
                        onCategoryActionComplete={handleCategoryActionComplete}
                    />
                {/each}
            </div>
        </CollapsibleSection>
    {/if}

    <!-- Completed + Canceled Categories Section (collapsible) -->
    {#if finishedCategories.length > 0}
        <CollapsibleSection
            icon={CheckCircleIcon}
            label={$t('during_competition.completed_section')}
            count={finishedCategories.length}
            badgeClass="preset-tonal-success"
            testId="toggle-section-completed"
            open={!hasLiveOrStopped}
        >
            <div class="space-y-3">
                {#each finishedCategories as cat (cat.id)}
                    <CategoryCard
                        category={cat}
                        {isOrganizer}
                        liveVersion={categoryVersions.get(cat.id) ?? null}
                        onCategoryActionComplete={handleCategoryActionComplete}
                    />
                {/each}
            </div>
        </CollapsibleSection>
    {/if}

    <!-- Empty state when no categories visible -->
    {#if visibleCategories.length === 0}
        <div class="text-center py-8 text-surface-500">
            <InformationOutlineIcon width="2rem" height="2rem" class="mx-auto mb-2" />
            <p>{$t('during_competition.no_categories')}</p>
        </div>
    {/if}
</div>
