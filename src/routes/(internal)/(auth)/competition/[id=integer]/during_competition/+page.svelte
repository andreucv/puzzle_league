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

    let { data } = $props();

    // Extract competition ID once (stable for the page lifetime, comes from route param)
    const competitionId = untrack(() => data.props.competition.id);

    const competition = $derived(data.props.competition);
    const isOrganizer = $derived(data.props.userRole === 'organizer');
    const judgedCategoryIds = $derived(data.props.judgedCategoryIds as number[]);

    // Local overrides for categories (from user actions like start/stop)
    let categoryOverrides: Record<number, any> = $state({});

    // Server categories merged with local overrides
    let serverCategories = $derived(
        data.props.categories.map((c: any) => categoryOverrides[c.id] ? { ...c, ...categoryOverrides[c.id] } : c)
    );

    // Ably stream for live updates — initialized with server-computed state
    const ablyStream = useAblyStream(
        `competition:${competitionId}`,
        untrack(() => data.props.initialEventState),
        `/api/ably-token?competitionId=${competitionId}`
    );

    // When load() re-runs (after invalidation), update the stream's state
    $effect(() => {
        if (data.props.initialEventState) {
            ablyStream.updateState(data.props.initialEventState);
            categoryOverrides = {};
        }
    });

    // Merge server categories with live Ably state
    let categories = $derived.by(() => {
        const liveState = ablyStream.state;
        if (!liveState) return serverCategories;

        return serverCategories.map((cat: any) => {
            const liveCat = liveState.categories.find((c: any) => c.id === cat.id);
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

    // Filter by role: judges only see assigned categories
    let visibleCategories = $derived(
        isOrganizer
            ? categories
            : categories.filter((c: any) => judgedCategoryIds.includes(c.id))
    );

    let activeCategories = $derived(visibleCategories.filter((c: any) => c.status === 'LIVE'));
    let stoppedCategories = $derived(visibleCategories.filter((c: any) => c.status === 'STOPPED'));
    let upcomingCategories = $derived(visibleCategories.filter((c: any) => c.status === 'NOT_STARTED'));
    let finishedCategories = $derived(visibleCategories.filter((c: any) => c.status === 'COMPLETE' || c.status === 'CANCELED'));
    let hasLiveOrStopped = $derived(activeCategories.length > 0 || stoppedCategories.length > 0);

    /** After a successful server action, clear overrides (Ably push will bring the update) */
    function onActionSuccess() {
        // No-op: Ably will push the update to all clients.
        // Optimistic overrides are cleared when the Ably event arrives via state update.
    }

    async function handleStartCategory(categoryId: number) {
        try {
            const res = await fetch(`/api/categories/${categoryId}/start`, { method: 'POST' });
            if (res.ok) {
                const result = await res.json();
                categoryOverrides = { ...categoryOverrides, [categoryId]: { ...result.category, totalRecords: result.category.totalRecords, finishedRecords: result.category.finishedRecords } };
                onActionSuccess();
            }
        } catch (err) {
            console.error('Failed to start category:', err);
        }
    }

    async function handleCancelCategory(categoryId: number) {
        try {
            const res = await fetch(`/api/categories/${categoryId}/cancel`, { method: 'POST' });
            if (res.ok) {
                const result = await res.json();
                categoryOverrides = { ...categoryOverrides, [categoryId]: result.category };
                onActionSuccess();
            }
        } catch (err) {
            console.error('Failed to cancel category:', err);
        }
    }

    async function handleRestartCategory(categoryId: number) {
        try {
            const res = await fetch(`/api/categories/${categoryId}/restart`, { method: 'POST' });
            if (res.ok) {
                const result = await res.json();
                categoryOverrides = { ...categoryOverrides, [categoryId]: { ...result.category, totalRecords: result.category.totalRecords, finishedRecords: result.category.finishedRecords } };
                onActionSuccess();
            }
        } catch (err) {
            console.error('Failed to restart category:', err);
        }
    }

    async function handleCompleteCategory(categoryId: number) {
        try {
            const res = await fetch(`/api/categories/${categoryId}/complete`, { method: 'POST' });
            if (res.ok) {
                const result = await res.json();
                categoryOverrides = { ...categoryOverrides, [categoryId]: result.category };
                onActionSuccess();
            }
        } catch (err) {
            console.error('Failed to complete category:', err);
        }
    }

    async function handleResumeCategory(categoryId: number) {
        try {
            const res = await fetch(`/api/categories/${categoryId}/resume`, { method: 'POST' });
            if (res.ok) {
                const result = await res.json();
                categoryOverrides = { ...categoryOverrides, [categoryId]: { ...result.category, totalRecords: result.category.totalRecords, finishedRecords: result.category.finishedRecords } };
                onActionSuccess();
            }
        } catch (err) {
            console.error('Failed to resume category:', err);
        }
    }

    async function handleStopCategory(categoryId: number) {
        try {
            const res = await fetch(`/api/categories/${categoryId}/stop`, { method: 'POST' });
            if (res.ok) {
                const result = await res.json();
                categoryOverrides = { ...categoryOverrides, [categoryId]: result.category };
                onActionSuccess();
            }
        } catch (err) {
            console.error('Failed to stop category:', err);
        }
    }

    function handleRecordFinish(_recordId: string) {
        onActionSuccess();
    }

    function handleCategoryUpdate(updated: any) {
        categoryOverrides = { ...categoryOverrides, [updated.id]: updated };
        onActionSuccess();
    }

    let liveVersion = $derived(ablyStream.state?.version ?? null);

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
        text={competition.name}
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
                        {liveVersion}
                        onCompleteCategory={handleCompleteCategory}
                        onResumeCategory={handleResumeCategory}
                        onCancelCategory={handleCancelCategory}
                        onRestartCategory={handleRestartCategory}
                        onCategoryUpdate={handleCategoryUpdate}
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
                        {liveVersion}
                        onStopCategory={handleStopCategory}
                        onRecordFinish={handleRecordFinish}
                        onCategoryUpdate={handleCategoryUpdate}
                        onCancelCategory={handleCancelCategory}
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
                        {liveVersion}
                        onStartCategory={handleStartCategory}
                        onCancelCategory={handleCancelCategory}
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
                        {liveVersion}
                        onRestartCategory={handleRestartCategory}
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
