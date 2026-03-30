<script lang="ts">
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import ActiveCategoryCard from '$lib/components/during-competition/ActiveCategoryCard.svelte';
    import UpcomingCategoryCard from '$lib/components/during-competition/UpcomingCategoryCard.svelte';
    import CompletedCategoryCard from '$lib/components/during-competition/CompletedCategoryCard.svelte';
    import { useEventStream } from '$lib/events/client/use-event-stream.svelte';
    import Icon from '@iconify/svelte';
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

    // Event stream for live updates
    const eventStream = useEventStream('competition', { id: competitionId }, {
        activeInterval: 3_000,
        idleInterval: 15_000,
        backgroundInterval: 30_000,
        isActive: (s: any) => s?.categories?.some((c: any) => c.status === 'in_progress') ?? false
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

    let activeCategories = $derived(visibleCategories.filter((c: any) => c.status === 'in_progress'));
    let upcomingCategories = $derived(visibleCategories.filter((c: any) => c.status === 'not_started'));
    let completedCategories = $derived(visibleCategories.filter((c: any) => c.status === 'completed'));

    async function handleStartCategory(categoryId: number) {
        try {
            const res = await fetch(`/api/categories/${categoryId}/start`, { method: 'POST' });
            if (res.ok) {
                const result = await res.json();
                categoryOverrides = { ...categoryOverrides, [categoryId]: { ...result.category, totalRecords: result.category.totalRecords, finishedRecords: result.category.finishedRecords } };
                eventStream.refresh();
            }
        } catch (err) {
            console.error('Failed to start category:', err);
        }
    }

    function handleRecordFinish(_recordId: string) {
        // Trigger a refresh to get updated counts
        eventStream.refresh();
    }

    function handleCategoryUpdate(updated: any) {
        categoryOverrides = { ...categoryOverrides, [updated.id]: updated };
        eventStream.refresh();
    }
</script>

<div class="container mx-auto space-y-6">
    <!-- Header -->
    <TitleBackButton
        href="/competitions/competition_details/{competitionId}"
        text={competition?.name ?? $t('during_competition.title')}
    />

    <!-- Connection status banner -->
    {#if eventStream.status === 'error'}
        <div class="p-2 rounded-lg bg-error-500/10 border border-error-500/30 text-sm text-error-600 flex items-center gap-2">
            <Icon icon="mdi:wifi-off" width="1rem" />
            {$t('during_competition.connection_error')}
        </div>
    {/if}

    <!-- Active Categories Section -->
    {#if activeCategories.length > 0}
        <section class="space-y-3">
            <h3 class="text-sm font-semibold text-surface-600-400 uppercase tracking-wider flex items-center gap-2">
                {$t('during_competition.currently_running')}
                <span class="badge preset-filled-warning-500 text-xs">{activeCategories.length}</span>
            </h3>
            {#each activeCategories as cat (cat.id)}
                <ActiveCategoryCard
                    category={cat}
                    competitionName={competition?.name ?? ''}
                    {isOrganizer}
                    onRecordFinish={handleRecordFinish}
                    onCategoryUpdate={handleCategoryUpdate}
                />
            {/each}
        </section>
    {/if}

    <!-- Upcoming Categories Section -->
    {#if upcomingCategories.length > 0}
        <section class="space-y-3">
            <h3 class="text-sm font-semibold text-surface-600-400 uppercase tracking-wider flex items-center gap-2">
                {$t('during_competition.upcoming')}
                <span class="badge preset-tonal text-xs">{upcomingCategories.length}</span>
            </h3>
            {#each upcomingCategories as cat (cat.id)}
                <UpcomingCategoryCard
                    category={cat}
                    {isOrganizer}
                    onStartCategory={handleStartCategory}
                />
            {/each}
        </section>
    {/if}

    <!-- Completed Categories Section -->
    {#if completedCategories.length > 0}
        <section class="space-y-3">
            <h3 class="text-sm font-semibold text-surface-600-400 uppercase tracking-wider flex items-center gap-2">
                {$t('during_competition.completed_section')}
                <span class="badge preset-filled-success-500 text-xs">{completedCategories.length}</span>
            </h3>
            {#each completedCategories as cat (cat.id)}
                <CompletedCategoryCard category={cat} />
            {/each}
        </section>
    {/if}

    <!-- Empty state when no categories visible -->
    {#if visibleCategories.length === 0}
        <div class="text-center py-8 text-surface-500">
            <Icon icon="mdi:information-outline" width="2rem" class="mx-auto mb-2" />
            <p>{$t('during_competition.no_categories')}</p>
        </div>
    {/if}
</div>
