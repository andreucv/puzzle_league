<script lang="ts">
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import CategoryCard from '$lib/components/during-competition/CategoryCard.svelte';
    import CollapsibleSection from '$lib/components/manage_inscriptions/CollapsibleSection.svelte';
    import { useEventStream } from '$lib/events/client/use-event-stream.svelte';
    import PlayCircleOutlineIcon from '@iconify-svelte/mdi/play-circle-outline';
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import AlertCircleOutlineIcon from '@iconify-svelte/mdi/alert-circle-outline';
    import CheckCircleIcon from '@iconify-svelte/mdi/check-circle';
    import WifiOffIcon from '@iconify-svelte/mdi/wifi-off';
    import InformationOutlineIcon from '@iconify-svelte/mdi/information-outline';
    import { t } from '$lib/translations';
    import { untrack } from 'svelte';
    import { authClient } from '$lib/auth_client';

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

    // Event stream for live updates
    const eventStream = useEventStream('competition', { id: competitionId }, {
        activeInterval: 1_000,
        idleInterval: 30_000,
        backgroundInterval: 60_000,
        isActive: (s: any) => s?.categories?.some((c: any) =>
            (c.status === 'LIVE' || c.status === 'STOPPED') && c.finishedRecords > 0
        ) ?? false
    });

    // Clear optimistic overrides when server catches up (version advances)
    let lastSeenVersion = $state<string | null>(null);
    $effect(() => {
        const version = eventStream.state?.version;
        if (version && version !== lastSeenVersion) {
            lastSeenVersion = version;
            categoryOverrides = {};
        }
    });

    // Merge server categories with live event state
    let categories = $derived.by(() => {
        const liveState = eventStream.state;
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

    /** After a successful server action, clear error state and trigger immediate refresh */
    function onActionSuccess() {
        eventStream.resetErrors();
        eventStream.refresh();
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

    let liveVersion = $derived(eventStream.state?.version ?? null);

    type PollingMode = 'live' | 'idle' | 'error';
    let pollingMode: PollingMode = $derived.by(() => {
        if (eventStream.status === 'error') return 'error';
        const s = eventStream.state;
        if (s?.categories?.some((c: any) =>
            (c.status === 'LIVE' || c.status === 'STOPPED') && c.finishedRecords > 0
        )) return 'live';
        return 'idle';
    });
</script>

<div class="container mx-auto max-w-4xl space-y-4">
    <!-- Header -->
    <TitleBackButton
        href="/competitions/competition_details/{competitionId}"
        text={competition?.name ?? $t('during_competition.title')}
    >
        {#snippet trailing()}
            {#if pollingMode === 'live'}
                <span class="badge preset-tonal-success gap-1 text-xs" data-testid="polling-indicator-live">
                    <span class="relative flex h-1.5 w-1.5">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-success-500"></span>
                    </span>
                    {$t('during_competition.polling_live')}
                </span>
            {:else if pollingMode === 'error'}
                <span class="badge preset-tonal-error gap-1 text-xs" data-testid="polling-indicator-error">
                    <span class="inline-flex rounded-full h-1.5 w-1.5 bg-error-500"></span>
                    {$t('during_competition.polling_offline')}
                </span>
            {:else}
                {#key eventStream.pollCount}
                <span class="badge preset-tonal-success gap-1 text-xs" data-testid="polling-indicator-idle">
                    <span class="relative flex items-center justify-center" style="width: 12px; height: 12px;">
                        <svg class="absolute poll-progress" viewBox="0 0 12 12" width="12" height="12">
                            <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--color-success-400)" stroke-width="1.5"
                                stroke-dasharray="28.27"
                                stroke-dashoffset="28.27"
                                stroke-linecap="round"
                                transform="rotate(-90 6 6)" />
                        </svg>
                        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-success-500"></span>
                    </span>
                    {$t('during_competition.polling_live')}
                </span>
                {/key}
            {/if}
        {/snippet}
    </TitleBackButton>

    <!-- Connection status banner -->
    {#if eventStream.status === 'error'}
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

<style>
    .poll-progress circle {
        animation: poll-fill 30s linear forwards;
    }

    @keyframes poll-fill {
        from {
            stroke-dashoffset: 28.27;
        }
        to {
            stroke-dashoffset: 0;
        }
    }
</style>
