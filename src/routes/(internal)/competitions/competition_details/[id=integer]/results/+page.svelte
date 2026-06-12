<script lang="ts">
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import { cldUrl } from '$lib/utils/cld_url';
    import { t } from '$lib/translations';
    import { formatCountdown, formatDeltaCompact, getCategoryTypeName, calculateDuration } from '$lib/utils/category_utils';
    import { onMount, untrack, tick } from 'svelte';
    import { useAblyInvalidation } from '$lib/events/client/use-ably-invalidation.svelte';
    import { page } from '$app/state';

    import TrophyIcon from '@iconify-svelte/mdi/trophy';
    import TrophyOutlineIcon from '@iconify-svelte/mdi/trophy-outline';
    import MedalIcon from '@iconify-svelte/mdi/medal';
    import MedalOutlineIcon from '@iconify-svelte/mdi/medal-outline';
    import PuzzleIcon from '@iconify-svelte/mdi/puzzle';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import PuzzleRemoveIcon from '@iconify-svelte/mdi/puzzle-remove';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import MinusIcon from '@iconify-svelte/mdi/minus';
    import ClockOutlineIcon from '@iconify-svelte/mdi/clock-outline';
    import PauseCircleOutlineIcon from '@iconify-svelte/mdi/pause-circle-outline';
    import TimerOutlineIcon from '@iconify-svelte/mdi/timer-outline';
    import AccountGroupIcon from '@iconify-svelte/mdi/account-group';
    import ArrowLeftIcon from '@iconify-svelte/mdi/arrow-left';
    import TargetAccountIcon from '@iconify-svelte/mdi/target-account';

    let { data } = $props();

    const competition = $derived(data.competition);
    const categories: App.ResultCategory[] = $derived(competition.categories);
    const viewerIsPrivileged = $derived(data.viewerIsPrivileged);
    const currentUser = $derived(data.user);

    // Check if a user's identity should be visible to the current viewer
    function isUserVisible(user: { id: string; publicResultsVisibility?: boolean }) {
        if (viewerIsPrivileged) return true;
        return user.publicResultsVisibility !== false;
    }

    // Sort categories: LIVE first, then STOPPED, then COMPLETE, then NOT_STARTED
    const statusOrder: Record<string, number> = { LIVE: 0, STOPPED: 1, COMPLETE: 2, NOT_STARTED: 3 };
    const sortedCategories = $derived(
        [...categories].sort((a, b) => (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4))
    );

    let selectedCategoryId = $state<number | null>(null);

    const competitionId = untrack(() => data.competition.id);

    // Conditional Ably: only connect when there are LIVE or STOPPED categories
    const hasLiveCategories = $derived(
        categories.some((c) => c.status === 'LIVE' || c.status === 'STOPPED')
    );

    // Evaluate once at init: if any categories are live/stopped, connect to Ably
    const initialHasLive = untrack(() =>
        data.competition.categories.some((c: App.ResultCategory) => c.status === 'LIVE' || c.status === 'STOPPED')
    );
    const ablyConnection = initialHasLive
        ? useAblyInvalidation(
            `competition:${competitionId}`,
            untrack(() => page.data.user)
                ? `/api/ably-token?competitionId=${competitionId}`
                : `/api/ably-token/public?competitionId=${competitionId}`
        )
        : null;

    const selectedCategory = $derived(
        sortedCategories.find((c) => c.id === selectedCategoryId) ?? sortedCategories[0] ?? null
    );

    const isNotStarted = $derived(selectedCategory?.status === 'NOT_STARTED');
    const isLive = $derived(selectedCategory?.status === 'LIVE');
    const isStopped = $derived(selectedCategory?.status === 'STOPPED');
    const isComplete = $derived(selectedCategory?.status === 'COMPLETE');
    const isActiveOrDone = $derived(isLive || isStopped || isComplete);

    // Three-tier entry classification:
    // (a) Finished — has finishTime, sorted by finishTime asc (from DB)
    // (b) Partial — no finishTime, has nPiecesCompleted, sorted by nPiecesCompleted desc
    // (c) DNS — neither finishTime nor nPiecesCompleted
    const finishedEntries = $derived(
        selectedCategory ? selectedCategory.entries.filter((r) => r.finishTime != null) : []
    );
    const partialEntries = $derived(
        selectedCategory
            ? selectedCategory.entries
                .filter((r) => r.finishTime == null && r.nPiecesCompleted != null)
                .sort((a, b) => (b.nPiecesCompleted ?? 0) - (a.nPiecesCompleted ?? 0))
            : []
    );
    const dnsEntriesAll = $derived(
        selectedCategory
            ? selectedCategory.entries.filter((r) => r.finishTime == null && r.nPiecesCompleted == null)
            : []
    );

    // Sub-prize tag filter: confirmed-tag badges show always, but the toggle
    // narrows the ranking to entries carrying the selected tag (order preserved).
    const tagOptions = $derived(selectedCategory?.availableTags ?? []);
    let selectedTag = $state<string | null>(null);
    function entryMatchesTag(r: App.ResultEntry): boolean {
        return !selectedTag || r.confirmedTag === selectedTag;
    }

    // Combined ranked entries: finished + partial (for position numbering),
    // narrowed by the active tag filter.
    const rankedEntries = $derived([...finishedEntries, ...partialEntries].filter(entryMatchesTag));
    const dnsEntries = $derived(dnsEntriesAll.filter(entryMatchesTag));

    // Gap to the entry ranked directly ahead (positions >= 2), aligned to rankedEntries indices.
    // Only computed between two finished entries; partial/DNF rows show no gap.
    const gaps = $derived(
        rankedEntries.map((r, i) => {
            if (i === 0) return null;
            const prev = rankedEntries[i - 1];
            if (r.finishTime && prev.finishTime) {
                return formatDeltaCompact(
                    new Date(r.finishTime).getTime() - new Date(prev.finishTime).getTime()
                );
            }
            return null;
        })
    );

    const puzzle: App.ResultPuzzleData | undefined = $derived(selectedCategory?.puzzles[0]);

    // Viewer's own entries across all categories (tab order) — drives the YOU highlight and the
    // rotating "Go to your result" find-next button. Self-highlight ignores publicResultsVisibility.
    function isViewerEntry(entry: App.ResultEntry): boolean {
        return !!currentUser && entry.users.some((u) => u.id === currentUser.id);
    }
    const viewerEntries = $derived.by(() => {
        const list: { categoryId: number; entryId: string }[] = [];
        if (!currentUser) return list;
        const uid = currentUser.id;
        for (const cat of sortedCategories) {
            for (const entry of cat.entries) {
                if (entry.users.some((u) => u.id === uid)) {
                    list.push({ categoryId: cat.id, entryId: entry.id });
                }
            }
        }
        return list;
    });

    let findIndex = $state(-1);
    let pulsingEntryId = $state<string | null>(null);

    async function goToMyResult() {
        if (viewerEntries.length === 0) return;
        findIndex = (findIndex + 1) % viewerEntries.length;
        const target = viewerEntries[findIndex];
        if (target.categoryId !== selectedCategoryId) {
            selectCategory(target.categoryId);
        }
        await tick();
        const el = document.getElementById(`entry-${target.entryId}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pulsingEntryId = target.entryId;
        setTimeout(() => {
            if (pulsingEntryId === target.entryId) pulsingEntryId = null;
        }, 1200);
    }

    // Stats
    const totalEntries = $derived(selectedCategory?._count.entries ?? 0);
    const finishedCount = $derived(finishedEntries.length);
    const categoryDuration = $derived.by(() => {
        if (!selectedCategory?.realStartTime) return null;
        const start = new Date(selectedCategory.realStartTime);
        // For completed: use realEndTime or last finishTime
        if (isComplete) {
            if (selectedCategory.realEndTime) {
                return calculateDuration(start, new Date(selectedCategory.realEndTime));
            }
            const lastFinish = finishedEntries.length > 0
                ? finishedEntries[finishedEntries.length - 1].finishTime
                : null;
            if (lastFinish) return calculateDuration(start, new Date(lastFinish));
        }
        return null;
    });
    // Drop the noisy trailing "0s" (e.g. "120m 0s" -> "120m").
    const categoryDurationLabel = $derived(
        categoryDuration ? categoryDuration.replace(/\s0s$/, '') : null
    );

    function isDNF(entry: App.ResultEntry, category: App.ResultCategory): boolean {
        if (!entry.finishTime || !category.realEndTime) return false;
        const p = category.puzzles[0];
        if (!p) return false;
        const finishMs = new Date(entry.finishTime).getTime();
        const endMs = new Date(category.realEndTime).getTime();
        return Math.abs(finishMs - endMs) < 2000
            && entry.nPiecesCompleted != null
            && entry.nPiecesCompleted < p.pieces;
    }

    function isPartialEntry(entry: App.ResultEntry): boolean {
        return entry.finishTime == null && entry.nPiecesCompleted != null;
    }

    function getCompletionPercent(entry: App.ResultEntry): number | null {
        if (entry.nPiecesCompleted == null || !puzzle) return null;
        return Math.round((entry.nPiecesCompleted / puzzle.pieces) * 100);
    }

    function getPositionStyle(position: number) {
        switch (position) {
            case 1: return { icon: TrophyIcon, color: 'text-yellow-500', bg: 'bg-yellow-500/10' };
            case 2: return { icon: MedalIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' };
            case 3: return { icon: MedalOutlineIcon, color: 'text-amber-600', bg: 'bg-amber-600/10' };
            default: return { icon: null, color: 'text-surface-600 dark:text-surface-400', bg: '' };
        }
    }

    function selectCategory(id: number) {
        selectedCategoryId = id;
        selectedTag = null;
        history.replaceState(null, '', `#category-${id}`);
    }

    function formatScheduledTime(dateStr: Date): string {
        const d = new Date(dateStr);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    onMount(() => {
        const hash = window.location.hash;
        if (hash?.startsWith('#category-')) {
            const id = parseInt(hash.replace('#category-', ''));
            if (!isNaN(id) && sortedCategories.some((c) => c.id === id)) {
                selectedCategoryId = id;
                return;
            }
        }
        if (sortedCategories.length > 0) {
            selectedCategoryId = sortedCategories[0].id;
        }
    });
</script>

<svelte:head>
    <title>{competition.name} — {$t('results.title')}</title>
</svelte:head>

<div class="container mx-auto space-y-6 max-w-4xl">
    <TitleBackButton
        href="/competitions/competition_details/{competition.id}"
        text={$t('results.title')}
        subtitle={competition.name}
        useHistoryBack={true}
    >
        {#snippet trailing()}
            <div class="flex items-center gap-2">
            {#if ablyConnection}
                {#if ablyConnection.status === 'connected'}
                    <span class="badge preset-tonal-success gap-1 text-xs">
                        <span class="relative flex h-1.5 w-1.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-success-500"></span>
                        </span>
                        {$t('results.live_updates')}
                    </span>
                {:else if ablyConnection.status === 'error'}
                    <span class="badge preset-tonal-error gap-1 text-xs">
                        <span class="inline-flex rounded-full h-1.5 w-1.5 bg-error-500"></span>
                        {$t('results.live_updates_offline')}
                    </span>
                {:else if ablyConnection.status === 'connecting' || ablyConnection.status === 'reconnecting'}
                    <span class="badge preset-tonal-warning gap-1 text-xs">
                        <span class="inline-flex rounded-full h-1.5 w-1.5 bg-warning-500 animate-pulse"></span>
                        {$t('results.live_updates_connecting')}
                    </span>
                {/if}
            {/if}
            <!-- Desktop only: "Go to your result" sits next to the title (mobile uses the FAB) -->
            {#if currentUser && viewerEntries.length > 0}
                <button
                    type="button"
                    onclick={goToMyResult}
                    class="btn btn-sm preset-filled-primary-500 gap-1.5 hidden sm:inline-flex"
                >
                    <TargetAccountIcon width="1rem" height="1rem" />
                    {$t('results.go_to_your_result')}
                    {#if findIndex >= 0 && viewerEntries.length > 1}
                        <span class="text-xs opacity-80">
                            {$t('results.your_result_counter', { i: findIndex + 1, n: viewerEntries.length })}
                        </span>
                    {/if}
                </button>
            {/if}
            </div>
        {/snippet}
    </TitleBackButton>

    {#if sortedCategories.length === 0}
        <div class="text-center py-16">
            <TrophyOutlineIcon width="3rem" height="3rem" class="mx-auto mb-3 text-surface-400" />
            <p class="text-surface-500 text-lg">{$t('results.no_categories')}</p>
        </div>
    {:else}
        <!-- Tabs + results panel grouped so the panel connects flush to the tabs (no gap) -->
        <div>
        <!-- Category tabs -->
        <div class="overflow-x-auto -mx-4 px-4 scrollbar-none">
            <nav class="flex gap-1 min-w-max border-b border-surface-300/50 pb-0">
                {#each sortedCategories as cat (cat.id)}
                    {@const typeName = $t(getCategoryTypeName(cat.type))}
                    {@const tabLabel = cat.subname && cat.subname.toUpperCase() !== typeName.toUpperCase()
                        ? `${typeName} · ${cat.subname}`
                        : typeName}
                    <button
                        type="button"
                        onclick={() => selectCategory(cat.id)}
                        class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5
                            {cat.id === selectedCategoryId
                                ? 'border-b-2 border-primary-500 text-primary-700 dark:text-primary-400'
                                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
                    >
                        {#if cat.status === 'LIVE'}
                            <span class="relative flex h-2 w-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
                            </span>
                        {:else if cat.status === 'STOPPED'}
                            <PauseCircleOutlineIcon width="0.9rem" height="0.9rem" class="text-warning-500" />
                        {:else if cat.status === 'NOT_STARTED'}
                            <ClockOutlineIcon width="0.9rem" height="0.9rem" class="text-surface-400" />
                        {/if}
                        {tabLabel}
                    </button>
                {/each}
            </nav>
        </div>

        <!-- Selected category content -->
        {#if selectedCategory}

            <!-- ===== NOT STARTED ===== -->
            {#if isNotStarted}
                <Card>
                    <div class="text-center py-8 space-y-4">
                        <ClockOutlineIcon width="2.5rem" height="2.5rem" class="mx-auto text-surface-400" />
                        <p class="text-lg font-medium">{$t('results.not_started_message')}</p>

                        <div class="flex flex-wrap items-center justify-center gap-4 text-sm text-surface-600 dark:text-surface-400">
                            <span class="flex items-center gap-1.5">
                                <TimerOutlineIcon width="1rem" height="1rem" />
                                {$t('results.not_started_scheduled')}: {formatScheduledTime(selectedCategory.startTime)}
                            </span>
                            {#if puzzle}
                                <span class="flex items-center gap-1.5">
                                    <PuzzleOutlineIcon width="1rem" height="1rem" />
                                    {$t('results.not_started_pieces', { n: puzzle.pieces })}
                                </span>
                            {/if}
                            <span class="flex items-center gap-1.5">
                                <AccountGroupIcon width="1rem" height="1rem" />
                                {$t('results.not_started_entries', { n: totalEntries })}
                            </span>
                        </div>

                        <a
                            href="/competitions/competition_details/{competition.id}"
                            class="btn preset-tonal-primary inline-flex items-center gap-1.5 mt-2"
                        >
                            <ArrowLeftIcon width="1rem" height="1rem" />
                            {$t('results.back_to_details')}
                        </a>
                    </div>
                </Card>

            <!-- ===== LIVE / STOPPED / COMPLETE ===== -->
            {:else if isActiveOrDone}
                <!-- Square top so the panel connects flush to the category tabs -->
                <div class="card p-4 space-y-2 min-w-0 rounded-t-none">
                    <!-- Category status bar -->
                    <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                        <div class="flex items-center gap-2">
                            {#if isLive}
                                <span class="badge preset-filled-success gap-1 text-xs font-semibold">
                                    <span class="relative flex h-1.5 w-1.5">
                                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                                        <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                    </span>
                                    {$t('results.live_badge')}
                                </span>
                            {:else if isStopped}
                                <span class="badge preset-tonal-warning gap-1 text-xs font-semibold">
                                    <PauseCircleOutlineIcon width="0.75rem" height="0.75rem" />
                                    {$t('results.stopped_badge')}
                                </span>
                            {/if}
                            {#if totalEntries > 0}
                                <span class="text-xs text-surface-500 flex items-center gap-1">
                                    <AccountGroupIcon width="0.85rem" height="0.85rem" />
                                    {$t('results.total_participants', { n: totalEntries })}
                                </span>
                            {/if}
                        </div>
                        <div class="flex items-center gap-3 text-xs text-surface-500">
                            {#if (isLive || isStopped) && finishedCount > 0}
                                <span>{$t('results.entries_finished', { n: finishedCount, total: totalEntries })}</span>
                            {/if}
                            {#if categoryDurationLabel}
                                <span class="flex items-center gap-1">
                                    <TimerOutlineIcon width="0.8rem" height="0.8rem" />
                                    {$t('results.duration', { time: categoryDurationLabel })}
                                </span>
                            {/if}
                        </div>
                    </div>

                    <!-- Puzzle info header -->
                    {#if puzzle}
                        <div class="flex items-center gap-3">
                            <div class="shrink-0">
                                {#if puzzle.image_cld_id}
                                    <div class="w-10 h-10 rounded-md overflow-hidden ring-1 ring-surface-300/50">
                                        <img
                                            src={cldUrl(puzzle.image_cld_id, { width: 40, height: 40, crop: 'fill', gravity: 'auto' })}
                                            width="40"
                                            height="40"
                                            alt={puzzle.name || puzzle.brand}
                                            loading="lazy"
                                            class="w-full h-full object-cover"
                                        />
                                    </div>
                                {:else}
                                    <div class="w-10 h-10 rounded-md bg-surface-200-800 flex items-center justify-center">
                                        <PuzzleIcon width="1.2rem" height="1.2rem" class="text-surface-400" />
                                    </div>
                                {/if}
                            </div>
                            <p class="text-sm text-surface-600 dark:text-surface-400 flex items-center gap-1 min-w-0 truncate">
                                <PuzzleOutlineIcon width="0.85rem" height="0.85rem" class="shrink-0" />
                                {puzzle.brand}{puzzle.name ? ` — ${puzzle.name}` : ''} · {puzzle.pieces} {$t('results.pieces')}
                            </p>
                        </div>
                    {/if}

                    <!-- Sub-prize tag filter -->
                    {#if tagOptions.length > 0}
                        <div class="flex flex-wrap items-center gap-2 mt-3">
                            <span class="text-xs text-surface-500">{$t('results.filter_by_tag')}</span>
                            <button
                                type="button"
                                class="badge {selectedTag === null ? 'preset-filled-primary-500' : 'preset-tonal'}"
                                onclick={() => (selectedTag = null)}
                            >
                                {$t('results.tag_filter_all')}
                            </button>
                            {#each tagOptions as tagOption}
                                <button
                                    type="button"
                                    class="badge {selectedTag === tagOption ? 'preset-filled-primary-500' : 'preset-tonal'}"
                                    onclick={() => (selectedTag = tagOption)}
                                >
                                    {$t('participant_tags.' + tagOption)}
                                </button>
                            {/each}
                        </div>
                    {/if}

                    <!-- Unified responsive entry row (ranked + DNS, all breakpoints) -->
                    {#snippet entryRow(entry: App.ResultEntry, pos: number | null, index: number | null, isDns: boolean)}
                        {@const style = pos ? getPositionStyle(pos) : null}
                        {@const dnf = isDNF(entry, selectedCategory)}
                        {@const partial = isPartialEntry(entry)}
                        {@const pct = getCompletionPercent(entry)}
                        {@const me = isViewerEntry(entry)}
                        {@const gap = index != null ? gaps[index] : null}
                        {@const showTable = (isLive || isStopped) && entry.tableNumber != null}
                        {@const pulsing = pulsingEntryId === entry.id}
                        <div
                            id="entry-{entry.id}"
                            role="listitem"
                            class="grid grid-cols-[1.75rem_1fr_auto] items-start gap-3 px-4 py-3 border-b border-surface-200/30 last:border-0 transition-colors duration-500
                                {pulsing ? 'bg-success-500/30' : (me ? 'bg-primary-500/10' : (style?.bg ?? ''))}
                                {dnf || isDns ? 'opacity-60' : ''}"
                        >
                            <!-- Rank -->
                            <div class="flex items-center justify-center pt-0.5">
                                {#if isDns}
                                    <MinusIcon width="1rem" height="1rem" class="text-surface-400" />
                                {:else if style?.icon}
                                    {@const PositionIcon = style.icon}
                                    <PositionIcon width="1.1rem" height="1.1rem" class={style.color} />
                                {:else}
                                    <span class="font-mono text-sm tabular-nums {style?.color ?? ''}">{pos}</span>
                                {/if}
                            </div>

                            <!-- Identity: one participant per line, never truncated -->
                            <div class="min-w-0 space-y-1">
                                {#each entry.users as user}
                                    {@const visible = isUserVisible(user)}
                                    <div class="flex items-center gap-2">
                                        {#if visible}
                                            {#if user.image}
                                                <img src={user.image} alt={user.name} class="w-5 h-5 shrink-0 rounded-full object-cover ring-1 ring-surface-300/50" loading="lazy" />
                                            {:else}
                                                <div class="w-5 h-5 shrink-0 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                    <span class="text-[9px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                </div>
                                            {/if}
                                            {#if currentUser}
                                                <a href="/public_profile/{user.id}" class="text-sm break-words hover:text-primary-500 hover:underline transition-colors" data-testid="profile-link-{user.id}">{user.name}</a>
                                            {:else}
                                                <span class="text-sm break-words" data-testid="profile-name-{user.id}">{user.name}</span>
                                            {/if}
                                        {:else}
                                            <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                            </div>
                                            <span class="text-sm break-words text-surface-400 italic">{$t('results.anonymous_participant')}</span>
                                        {/if}
                                    </div>
                                {/each}
                                {#each entry.externalParticipants as ui}
                                    <div class="flex items-center gap-2">
                                        <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                            <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                        </div>
                                        <span class="text-sm break-words text-surface-500">{ui.name}</span>
                                    </div>
                                {/each}
                                {#if entry.confirmedTag || showTable}
                                    <div class="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        {#if entry.confirmedTag}
                                            <span class="badge preset-tonal-primary text-xs">{$t('participant_tags.' + entry.confirmedTag)}</span>
                                        {/if}
                                        {#if showTable}
                                            <span class="badge preset-tonal-surface text-xs">{$t('results.table', { n: entry.tableNumber })}</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>

                            <!-- Time / progress -->
                            <div class="shrink-0 text-right">
                                {#if isDns}
                                    <span class="badge preset-tonal-surface text-xs">{$t('results.dns')}</span>
                                {:else if partial}
                                    <div class="flex flex-col items-end gap-1">
                                        <span class="font-mono text-sm text-surface-600 dark:text-surface-400">
                                            {entry.nPiecesCompleted} {$t('results.pieces')}
                                            {#if pct != null}
                                                <span class="text-xs text-surface-400 ml-1">({pct}%)</span>
                                            {/if}
                                        </span>
                                        {#if pct != null}
                                            <div class="w-20 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                <div class="h-full bg-warning-500 rounded-full transition-all" style="width: {pct}%"></div>
                                            </div>
                                        {/if}
                                    </div>
                                {:else if entry.finishTime && selectedCategory.realStartTime}
                                    <div class="flex flex-col items-end gap-0.5">
                                        <span class="font-timer text-base {pos === 1 && !dnf ? 'font-bold' : ''}">
                                            {formatCountdown(new Date(entry.finishTime).getTime() - new Date(selectedCategory.realStartTime).getTime())}
                                        </span>
                                        {#if dnf && puzzle}
                                            <span class="badge preset-tonal-error text-[10px] gap-0.5">
                                                <PuzzleRemoveIcon width="0.65rem" height="0.65rem" />
                                                {entry.nPiecesCompleted}/{puzzle.pieces}
                                                {#if pct != null}
                                                    <span>({pct}%)</span>
                                                {/if}
                                            </span>
                                        {:else if gap}
                                            <span class="font-timer text-xs text-surface-400">{gap}</span>
                                        {/if}
                                    </div>
                                {/if}
                            </div>
                        </div>
                    {/snippet}

                    <!-- Results list -->
                    {#if rankedEntries.length > 0 || (isComplete && dnsEntries.length > 0)}
                        <div class="{puzzle ? 'mt-4' : ''} -mx-4 -mb-2" role="list">
                            {#each rankedEntries as entry, i (entry.id)}
                                {@render entryRow(entry, i + 1, i, false)}
                            {/each}
                            {#if isComplete}
                                {#each dnsEntries as entry (entry.id)}
                                    {@render entryRow(entry, null, null, true)}
                                {/each}
                            {/if}
                        </div>
                    {:else}
                        <div class="text-center py-6 text-surface-400 text-sm">
                            <TrophyOutlineIcon width="1.5rem" height="1.5rem" class="mx-auto mb-1" />
                            <p>{$t('results.no_completed_categories')}</p>
                        </div>
                    {/if}
                </div>
            {/if}
        {/if}
        </div>

        <!-- Floating jump-to-your-result button; rotates across all categories -->
        {#if currentUser && viewerEntries.length > 0}
            <button
                type="button"
                onclick={goToMyResult}
                class="btn preset-filled-primary-500 shadow-xl gap-2 fixed bottom-5 right-5 z-30 sm:hidden"
            >
                <TargetAccountIcon width="1.25rem" height="1.25rem" />
                {$t('results.go_to_your_result')}
                {#if findIndex >= 0 && viewerEntries.length > 1}
                    <span class="text-xs opacity-80">
                        {$t('results.your_result_counter', { i: findIndex + 1, n: viewerEntries.length })}
                    </span>
                {/if}
            </button>
        {/if}
    {/if}
</div>
