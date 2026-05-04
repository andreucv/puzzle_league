<script lang="ts">
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import { CldImage } from 'svelte-cloudinary';
    import { t } from '$lib/translations';
    import { formatElapsedTime, formatTimeDelta, getCategoryTypeName, calculateDuration } from '$lib/utils/category_utils';
    import { onMount, untrack } from 'svelte';
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

    let { data } = $props();

    const competition = $derived(data.competition);
    const categories: App.ResultCategory[] = $derived(competition.categories);
    const viewerIsPrivileged = $derived(data.viewerIsPrivileged);

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

    // Three-tier record classification:
    // (a) Finished — has finishTime, sorted by finishTime asc (from DB)
    // (b) Partial — no finishTime, has nPiecesCompleted, sorted by nPiecesCompleted desc
    // (c) DNS — neither finishTime nor nPiecesCompleted
    const finishedRecords = $derived(
        selectedCategory ? selectedCategory.entries.filter((r) => r.finishTime != null) : []
    );
    const partialRecords = $derived(
        selectedCategory
            ? selectedCategory.entries
                .filter((r) => r.finishTime == null && r.nPiecesCompleted != null)
                .sort((a, b) => (b.nPiecesCompleted ?? 0) - (a.nPiecesCompleted ?? 0))
            : []
    );
    const dnsRecords = $derived(
        selectedCategory
            ? selectedCategory.entries.filter((r) => r.finishTime == null && r.nPiecesCompleted == null)
            : []
    );

    // Combined ranked records: finished + partial (for position numbering)
    const rankedRecords = $derived([...finishedRecords, ...partialRecords]);

    const firstFinish = $derived(
        finishedRecords.length > 0 && finishedRecords[0].finishTime
            ? new Date(finishedRecords[0].finishTime)
            : null
    );
    const puzzle: App.ResultPuzzleData | undefined = $derived(selectedCategory?.puzzles[0]);

    // Stats
    const totalEntries = $derived(selectedCategory?._count.entries ?? 0);
    const finishedCount = $derived(finishedRecords.length);
    const categoryDuration = $derived.by(() => {
        if (!selectedCategory?.realStartTime) return null;
        const start = new Date(selectedCategory.realStartTime);
        // For completed: use realEndTime or last finishTime
        if (isComplete) {
            if (selectedCategory.realEndTime) {
                return calculateDuration(start, new Date(selectedCategory.realEndTime));
            }
            const lastFinish = finishedRecords.length > 0
                ? finishedRecords[finishedRecords.length - 1].finishTime
                : null;
            if (lastFinish) return calculateDuration(start, new Date(lastFinish));
        }
        return null;
    });

    function isDNF(record: App.ResultRecord, category: App.ResultCategory): boolean {
        if (!record.finishTime || !category.realEndTime) return false;
        const p = category.puzzles[0];
        if (!p) return false;
        const finishMs = new Date(record.finishTime).getTime();
        const endMs = new Date(category.realEndTime).getTime();
        return Math.abs(finishMs - endMs) < 2000
            && record.nPiecesCompleted != null
            && record.nPiecesCompleted < p.pieces;
    }

    function isPartialRecord(record: App.ResultRecord): boolean {
        return record.finishTime == null && record.nPiecesCompleted != null;
    }

    function getCompletionPercent(record: App.ResultRecord): number | null {
        if (record.nPiecesCompleted == null || !puzzle) return null;
        return Math.round((record.nPiecesCompleted / puzzle.pieces) * 100);
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
        {/snippet}
    </TitleBackButton>

    {#if sortedCategories.length === 0}
        <div class="text-center py-16">
            <TrophyOutlineIcon width="3rem" height="3rem" class="mx-auto mb-3 text-surface-400" />
            <p class="text-surface-500 text-lg">{$t('results.no_categories')}</p>
        </div>
    {:else}
        <!-- Category tabs -->
        <div class="overflow-x-auto -mx-4 px-4 scrollbar-none">
            <nav class="flex gap-1 min-w-max border-b border-surface-300/50 pb-0">
                {#each sortedCategories as cat (cat.id)}
                    {@const typeName = getCategoryTypeName(cat.type)}
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
                <Card>
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
                            {#if categoryDuration}
                                <span class="flex items-center gap-1">
                                    <TimerOutlineIcon width="0.8rem" height="0.8rem" />
                                    {$t('results.duration', { time: categoryDuration })}
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
                                        <CldImage
                                            src={puzzle.image_cld_id}
                                            width="40"
                                            height="40"
                                            alt={puzzle.name || puzzle.brand}
                                            crop="fill"
                                            gravity="auto"
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

                    <!-- Results table -->
                    {#if rankedRecords.length > 0 || (isComplete && dnsRecords.length > 0)}
                        <div class="{puzzle ? 'mt-4' : ''} -mx-4 -mb-2">
                            <!-- Desktop table -->
                            <div class="hidden sm:block">
                                <table class="w-full text-sm">
                                    <thead>
                                        <tr class="text-xs text-surface-500 uppercase tracking-wider">
                                            <th class="w-11 py-2 text-center">{$t('results.position')}</th>
                                            <th class="px-4 py-2 text-left">{$t('results.participants')}</th>
                                            <th class="px-4 py-2 text-right">{$t('results.time')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {#each rankedRecords as record, i (record.id)}
                                            {@const pos = i + 1}
                                            {@const style = getPositionStyle(pos)}
                                            {@const dnf = isDNF(record, selectedCategory)}
                                            {@const partial = isPartialRecord(record)}
                                            {@const pct = getCompletionPercent(record)}
                                            <tr class="{style.bg} {dnf ? 'opacity-70' : ''}">
                                                <td class="w-11 py-3">
                                                    <div class="flex items-center justify-center">
                                                        {#if style.icon}
                                                            {@const PositionIcon = style.icon}
                                                            <PositionIcon width="1.1rem" height="1.1rem" class={style.color} />
                                                        {:else}
                                                            <span class="font-mono text-sm tabular-nums {style.color}">{pos}</span>
                                                        {/if}
                                                    </div>
                                                </td>
                                                <td class="px-4 py-3">
                                                    <div class="space-y-1">
                                                        {#each record.users as user}
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
                                                                    <a href="/public_profile/{user.id}" class="font-medium text-sm hover:text-primary-500 hover:underline transition-colors">{user.name}</a>
                                                                {:else}
                                                                    <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                        <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                                    </div>
                                                                    <span class="font-medium text-sm text-surface-400 italic">{$t('results.anonymous_puzzler')}</span>
                                                                {/if}
                                                            </div>
                                                        {/each}
                                                        {#each record.externalParticipants as ui}
                                                            <div class="flex items-center gap-2">
                                                                <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                    <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                                </div>
                                                                <span class="text-sm italic text-surface-500">{ui.name}</span>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                </td>
                                                <td class="px-4 py-3 text-right">
                                                    {#if partial}
                                                        <!-- Partial record: pieces + progress bar -->
                                                        <div class="flex flex-col items-end gap-1">
                                                            <span class="font-mono text-sm text-surface-600 dark:text-surface-400">
                                                                {record.nPiecesCompleted} {$t('results.pieces')}
                                                                {#if pct != null}
                                                                    <span class="text-xs text-surface-400 ml-1">({pct}%)</span>
                                                                {/if}
                                                            </span>
                                                            {#if pct != null}
                                                                <div class="w-20 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                                    <div
                                                                        class="h-full bg-warning-500 rounded-full transition-all"
                                                                        style="width: {pct}%"
                                                                    ></div>
                                                                </div>
                                                            {/if}
                                                        </div>
                                                    {:else if record.finishTime && selectedCategory.realStartTime}
                                                        <div class="flex flex-wrap items-baseline justify-end gap-1.5">
                                                            <span class="font-mono text-sm {pos === 1 && !dnf ? 'font-bold' : ''}">
                                                                {formatElapsedTime(new Date(selectedCategory.realStartTime), new Date(record.finishTime))}
                                                            </span>
                                                            {#if dnf && puzzle}
                                                                <span class="badge preset-tonal-error text-xs gap-1">
                                                                    <PuzzleRemoveIcon width="0.75rem" height="0.75rem" />
                                                                    {record.nPiecesCompleted}/{puzzle.pieces}
                                                                    {#if pct != null}
                                                                        <span>({pct}%)</span>
                                                                    {/if}
                                                                </span>
                                                            {:else if firstFinish && pos > 1}
                                                                <span class="font-mono text-xs text-surface-400">
                                                                    {formatTimeDelta(firstFinish, new Date(record.finishTime))}
                                                                </span>
                                                            {/if}
                                                        </div>
                                                    {/if}
                                                </td>
                                            </tr>
                                        {/each}
                                        <!-- DNS records (only when category is complete) -->
                                        {#if isComplete}
                                            {#each dnsRecords as record (record.id)}
                                                <tr class="opacity-50">
                                                    <td class="w-11 py-3">
                                                        <div class="flex items-center justify-center">
                                                            <MinusIcon width="1rem" height="1rem" class="text-surface-400" />
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <div class="space-y-1">
                                                            {#each record.users as user}
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
                                                                        <a href="/public_profile/{user.id}" class="font-medium text-sm hover:text-primary-500 hover:underline transition-colors">{user.name}</a>
                                                                    {:else}
                                                                        <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                            <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                                        </div>
                                                                        <span class="font-medium text-sm text-surface-400 italic">{$t('results.anonymous_puzzler')}</span>
                                                                    {/if}
                                                                </div>
                                                            {/each}
                                                            {#each record.externalParticipants as ui}
                                                                <div class="flex items-center gap-2">
                                                                    <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                        <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                                    </div>
                                                                    <span class="text-sm italic text-surface-500">{ui.name}</span>
                                                                </div>
                                                            {/each}
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3 text-right">
                                                        <span class="badge preset-tonal-surface text-xs">{$t('results.dns')}</span>
                                                    </td>
                                                </tr>
                                            {/each}
                                        {/if}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Mobile stacked layout -->
                            <div class="sm:hidden space-y-0">
                                {#each rankedRecords as record, i (record.id)}
                                    {@const pos = i + 1}
                                    {@const style = getPositionStyle(pos)}
                                    {@const dnf = isDNF(record, selectedCategory)}
                                    {@const partial = isPartialRecord(record)}
                                    {@const pct = getCompletionPercent(record)}
                                    <div class="px-4 py-3 border-b border-surface-200/30 last:border-0 {style.bg} {dnf ? 'opacity-70' : ''}">
                                        <div class="flex items-start justify-between gap-3">
                                            <div class="w-6 shrink-0 flex items-center justify-center">
                                                {#if style.icon}
                                                    {@const PositionIcon = style.icon}
                                                    <PositionIcon width="1.1rem" height="1.1rem" class={style.color} />
                                                {:else}
                                                    <span class="font-mono text-sm tabular-nums {style.color}">{pos}</span>
                                                {/if}
                                            </div>
                                            <div class="flex-1 min-w-0 space-y-1">
                                                {#each record.users as user}
                                                    {@const visible = isUserVisible(user)}
                                                    <div class="flex items-center gap-2">
                                                        {#if visible}
                                                            {#if user.image}
                                                                <img src={user.image} alt={user.name} class="w-5 h-5 shrink-0 rounded-full object-cover" loading="lazy" />
                                                            {:else}
                                                                <div class="w-5 h-5 shrink-0 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                                    <span class="text-[9px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            {/if}
                                                            <a href="/public_profile/{user.id}" class="text-sm font-medium truncate hover:text-primary-500 hover:underline transition-colors">{user.name}</a>
                                                        {:else}
                                                            <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                            </div>
                                                            <span class="text-sm font-medium truncate text-surface-400 italic">{$t('results.anonymous_puzzler')}</span>
                                                        {/if}
                                                    </div>
                                                {/each}
                                                {#each record.externalParticipants as ui}
                                                    <div class="flex items-center gap-2">
                                                        <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                            <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                        </div>
                                                        <span class="text-sm italic text-surface-500 truncate">{ui.name}</span>
                                                    </div>
                                                {/each}
                                            </div>
                                            <div class="shrink-0 text-right">
                                                {#if partial}
                                                    <div class="flex flex-col items-end gap-0.5">
                                                        <span class="font-mono text-sm text-surface-600 dark:text-surface-400">
                                                            {record.nPiecesCompleted}
                                                            {#if pct != null}
                                                                <span class="text-[10px] text-surface-400 ml-0.5">({pct}%)</span>
                                                            {/if}
                                                        </span>
                                                        {#if pct != null}
                                                            <div class="w-14 h-1 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                                                                <div
                                                                    class="h-full bg-warning-500 rounded-full"
                                                                    style="width: {pct}%"
                                                                ></div>
                                                            </div>
                                                        {/if}
                                                    </div>
                                                {:else if record.finishTime && selectedCategory.realStartTime}
                                                    <div class="flex flex-wrap items-baseline justify-end gap-1">
                                                        <span class="font-mono text-sm {pos === 1 && !dnf ? 'font-bold' : ''}">
                                                            {formatElapsedTime(new Date(selectedCategory.realStartTime), new Date(record.finishTime))}
                                                        </span>
                                                        {#if dnf && puzzle}
                                                            <span class="badge preset-tonal-error text-[10px] gap-0.5">
                                                                <PuzzleRemoveIcon width="0.65rem" height="0.65rem" />
                                                                {record.nPiecesCompleted}/{puzzle.pieces}
                                                            </span>
                                                        {:else if firstFinish && pos > 1}
                                                            <span class="font-mono text-[11px] text-surface-400">
                                                                {formatTimeDelta(firstFinish, new Date(record.finishTime))}
                                                            </span>
                                                        {/if}
                                                    </div>
                                                {/if}
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                                <!-- DNS records mobile (only when complete) -->
                                {#if isComplete}
                                    {#each dnsRecords as record (record.id)}
                                        <div class="px-4 py-3 border-b border-surface-200/30 last:border-b-0 opacity-50">
                                            <div class="flex items-start justify-between gap-3">
                                                <div class="w-6 shrink-0 flex items-center justify-center">
                                                    <MinusIcon width="1rem" height="1rem" class="text-surface-400" />
                                                </div>
                                                <div class="flex-1 min-w-0 space-y-1">
                                                    {#each record.users as user}
                                                        {@const visible = isUserVisible(user)}
                                                        <div class="flex items-center gap-2">
                                                            {#if visible}
                                                                {#if user.image}
                                                                    <img src={user.image} alt={user.name} class="w-5 h-5 shrink-0 rounded-full object-cover" loading="lazy" />
                                                                {:else}
                                                                    <div class="w-5 h-5 shrink-0 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                                        <span class="text-[9px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                                    </div>
                                                                {/if}
                                                                <a href="/public_profile/{user.id}" class="text-sm font-medium truncate hover:text-primary-500 hover:underline transition-colors">{user.name}</a>
                                                            {:else}
                                                                <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                    <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                                </div>
                                                                <span class="text-sm font-medium truncate text-surface-400 italic">{$t('results.anonymous_puzzler')}</span>
                                                            {/if}
                                                        </div>
                                                    {/each}
                                                    {#each record.externalParticipants as ui}
                                                        <div class="flex items-center gap-2">
                                                            <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                            </div>
                                                            <span class="text-sm italic text-surface-500 truncate">{ui.name}</span>
                                                        </div>
                                                    {/each}
                                                </div>
                                                <div class="shrink-0">
                                                    <span class="badge preset-tonal-surface text-[10px]">{$t('results.dns')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    {/each}
                                {/if}
                            </div>
                        </div>
                    {:else}
                        <div class="text-center py-6 text-surface-400 text-sm">
                            <TrophyOutlineIcon width="1.5rem" height="1.5rem" class="mx-auto mb-1" />
                            <p>{$t('results.no_completed_categories')}</p>
                        </div>
                    {/if}
                </Card>
            {/if}
        {/if}
    {/if}
</div>
