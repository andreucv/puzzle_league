<script lang="ts">
    import TitleBackButton from '$lib/components/common/buttons/TitleBackButton.svelte';
    import Card from '$lib/components/common/card/Card.svelte';
    import { CldImage } from 'svelte-cloudinary';
    import { t } from '$lib/translations';
    import { formatElapsedTime, formatTimeDelta, getCategoryTypeName } from '$lib/utils/category_utils';
    import { onMount } from 'svelte';

    import TrophyIcon from '@iconify-svelte/mdi/trophy';
    import TrophyOutlineIcon from '@iconify-svelte/mdi/trophy-outline';
    import MedalIcon from '@iconify-svelte/mdi/medal';
    import MedalOutlineIcon from '@iconify-svelte/mdi/medal-outline';
    import PuzzleIcon from '@iconify-svelte/mdi/puzzle';
    import PuzzleOutlineIcon from '@iconify-svelte/mdi/puzzle-outline';
    import PuzzleRemoveIcon from '@iconify-svelte/mdi/puzzle-remove';
    import AccountQuestionIcon from '@iconify-svelte/mdi/account-question';
    import MinusIcon from '@iconify-svelte/mdi/minus';

    let { data } = $props();

    const competition = $derived(data.competition);
    const categories: App.ResultCategory[] = $derived(competition.categories);

    let selectedCategoryId = $state<number | null>(null);

    const selectedCategory = $derived(
        categories.find((c) => c.id === selectedCategoryId) ?? categories[0] ?? null
    );

    const rankedRecords = $derived(
        selectedCategory ? selectedCategory.records.filter((r) => r.finishTime != null) : []
    );
    const dnsRecords = $derived(
        selectedCategory ? selectedCategory.records.filter((r) => r.finishTime == null) : []
    );
    const firstFinish = $derived(
        rankedRecords.length > 0 && rankedRecords[0].finishTime
            ? new Date(rankedRecords[0].finishTime)
            : null
    );
    const puzzle: App.ResultPuzzleData | undefined = $derived(selectedCategory?.puzzles[0]);

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

    function getPositionStyle(position: number) {
        switch (position) {
            case 1: return { icon: TrophyIcon, color: 'text-yellow-500', bg: 'bg-yellow-500/8' };
            case 2: return { icon: MedalIcon, color: 'text-gray-400', bg: 'bg-gray-400/8' };
            case 3: return { icon: MedalOutlineIcon, color: 'text-amber-700', bg: 'bg-amber-700/8' };
            default: return { icon: null, color: 'text-surface-500', bg: '' };
        }
    }

    function selectCategory(id: number) {
        selectedCategoryId = id;
        history.replaceState(null, '', `#category-${id}`);
    }

    onMount(() => {
        const hash = window.location.hash;
        if (hash?.startsWith('#category-')) {
            const id = parseInt(hash.replace('#category-', ''));
            if (!isNaN(id) && categories.some((c) => c.id === id)) {
                selectedCategoryId = id;
                return;
            }
        }
        if (categories.length > 0) {
            selectedCategoryId = categories[0].id;
        }
    });
</script>

<svelte:head>
    <title>{competition.name} — {$t('results.title')}</title>
</svelte:head>

<div class="container mx-auto space-y-6 max-w-4xl">
    <TitleBackButton
        href="/competitions/competition_details/{competition.id}"
        text="{competition.name} — {$t('results.title')}"
    />

    {#if categories.length === 0}
        <div class="text-center py-16">
            <TrophyOutlineIcon width="3rem" height="3rem" class="mx-auto mb-3 text-surface-400" />
            <p class="text-surface-500 text-lg">{$t('results.no_completed_categories')}</p>
        </div>
    {:else}
        <!-- Category tabs – always visible, horizontally scrollable on mobile -->
        <div class="overflow-x-auto -mx-4 px-4 scrollbar-none">
            <nav class="flex gap-1 min-w-max border-b border-surface-300/50 pb-0">
                {#each categories as cat (cat.id)}
                    {@const typeName = getCategoryTypeName(cat.type)}
                    {@const tabLabel = cat.subname && cat.subname.toUpperCase() !== typeName.toUpperCase()
                        ? `${typeName} · ${cat.subname}`
                        : typeName}
                    <button
                        type="button"
                        onclick={() => selectCategory(cat.id)}
                        class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors
                            {cat.id === selectedCategoryId
                                ? 'border-b-2 border-primary-500 text-primary-700 dark:text-primary-400'
                                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}"
                    >
                        {tabLabel}
                    </button>
                {/each}
            </nav>
        </div>

        <!-- Selected category results -->
        {#if selectedCategory}
            <Card>
                <!-- Puzzle info header (compact) -->
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
                {#if rankedRecords.length > 0 || dnsRecords.length > 0}
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
                                        <tr class="{style.bg} {dnf ? 'opacity-60' : ''}">
                                            <td class="w-11 py-3">
                                                <div class="flex items-center justify-center">
                                                    {#if style.icon}
                                                        {@const PositionIcon = style.icon}
                                                        <PositionIcon width="1.1rem" height="1.1rem" class={style.color} />
                                                    {:else}
                                                        <span class="text-surface-500 font-mono text-sm tabular-nums">{pos}</span>
                                                    {/if}
                                                </div>
                                            </td>
                                            <!-- Participants: one per line, each with avatar -->
                                            <td class="px-4 py-3">
                                                <div class="space-y-1">
                                                    {#each record.users as user}
                                                        <div class="flex items-center gap-2">
                                                            {#if user.image}
                                                                <img src={user.image} alt={user.name} class="w-5 h-5 shrink-0 rounded-full object-cover ring-1 ring-surface-300/50" loading="lazy" />
                                                            {:else}
                                                                <div class="w-5 h-5 shrink-0 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                                    <span class="text-[9px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            {/if}
                                                            <span class="font-medium text-sm">{user.name}</span>
                                                        </div>
                                                    {/each}
                                                    {#each record.userIntents as ui}
                                                        <div class="flex items-center gap-2">
                                                            <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                                <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                            </div>
                                                            <span class="text-sm italic text-surface-500">{ui.name}</span>
                                                        </div>
                                                    {/each}
                                                </div>
                                            </td>
                                            <!-- Time + delta inline; delta wraps only when too long -->
                                            <td class="px-4 py-3 text-right">
                                                {#if record.finishTime && selectedCategory.realStartTime}
                                                    <div class="flex flex-wrap items-baseline justify-end gap-1.5">
                                                        <span class="font-mono text-sm {pos === 1 && !dnf ? 'font-bold' : ''}">
                                                            {formatElapsedTime(new Date(selectedCategory.realStartTime), new Date(record.finishTime))}
                                                        </span>
                                                        {#if dnf && puzzle}
                                                            <span class="badge preset-tonal-error text-xs gap-1">
                                                                <PuzzleRemoveIcon width="0.75rem" height="0.75rem" />
                                                                {record.nPiecesCompleted}/{puzzle.pieces}
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
                                    <!-- DNS records -->
                                    {#each dnsRecords as record (record.id)}
                                        <tr class="opacity-40">
                                            <td class="w-11 py-3">
                                                <div class="flex items-center justify-center">
                                                    <MinusIcon width="1rem" height="1rem" class="text-surface-400" />
                                                </div>
                                            </td>
                                            <td class="px-4 py-3">
                                                <div class="space-y-1">
                                                    {#each record.users as user}
                                                        <div class="flex items-center gap-2">
                                                            {#if user.image}
                                                                <img src={user.image} alt={user.name} class="w-5 h-5 shrink-0 rounded-full object-cover ring-1 ring-surface-300/50" loading="lazy" />
                                                            {:else}
                                                                <div class="w-5 h-5 shrink-0 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                                    <span class="text-[9px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            {/if}
                                                            <span class="font-medium text-sm">{user.name}</span>
                                                        </div>
                                                    {/each}
                                                    {#each record.userIntents as ui}
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
                                </tbody>
                            </table>
                        </div>

                        <!-- Mobile stacked layout -->
                        <div class="sm:hidden space-y-0">
                            {#each rankedRecords as record, i (record.id)}
                                {@const pos = i + 1}
                                {@const style = getPositionStyle(pos)}
                                {@const dnf = isDNF(record, selectedCategory)}
                                <div class="px-4 py-3 border-b border-surface-200/30 last:border-0 {style.bg} {dnf ? 'opacity-60' : ''}">
                                    <div class="flex items-start justify-between gap-3">
                                        <!-- Position -->
                                        <div class="w-6 shrink-0 flex items-center justify-center">
                                            {#if style.icon}
                                                {@const PositionIcon = style.icon}
                                                <PositionIcon width="1.1rem" height="1.1rem" class={style.color} />
                                            {:else}
                                                <span class="text-surface-500 font-mono text-sm tabular-nums">{pos}</span>
                                            {/if}
                                        </div>
                                        <!-- Participants: one per line -->
                                        <div class="flex-1 min-w-0 space-y-1">
                                            {#each record.users as user}
                                                <div class="flex items-center gap-2">
                                                    {#if user.image}
                                                        <img src={user.image} alt={user.name} class="w-5 h-5 shrink-0 rounded-full object-cover" loading="lazy" />
                                                    {:else}
                                                        <div class="w-5 h-5 shrink-0 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                            <span class="text-[9px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                    {/if}
                                                    <span class="text-sm font-medium truncate">{user.name}</span>
                                                </div>
                                            {/each}
                                            {#each record.userIntents as ui}
                                                <div class="flex items-center gap-2">
                                                    <div class="w-5 h-5 shrink-0 rounded-full bg-surface-300/50 flex items-center justify-center">
                                                        <AccountQuestionIcon width="0.7rem" height="0.7rem" class="text-surface-500" />
                                                    </div>
                                                    <span class="text-sm italic text-surface-500 truncate">{ui.name}</span>
                                                </div>
                                            {/each}
                                        </div>
                                        <!-- Time + delta inline -->
                                        <div class="shrink-0 text-right">
                                            {#if record.finishTime && selectedCategory.realStartTime}
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
                            <!-- DNS records mobile -->
                            {#each dnsRecords as record (record.id)}
                                <div class="px-4 py-3 border-b border-surface-200/30 last:border-b-0 opacity-40">
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="w-6 shrink-0 flex items-center justify-center">
                                            <MinusIcon width="1rem" height="1rem" class="text-surface-400" />
                                        </div>
                                        <div class="flex-1 min-w-0 space-y-1">
                                            {#each record.users as user}
                                                <div class="flex items-center gap-2">
                                                    {#if user.image}
                                                        <img src={user.image} alt={user.name} class="w-5 h-5 shrink-0 rounded-full object-cover" loading="lazy" />
                                                    {:else}
                                                        <div class="w-5 h-5 shrink-0 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                            <span class="text-[9px] font-bold text-primary-700">{user.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                    {/if}
                                                    <span class="text-sm font-medium truncate">{user.name}</span>
                                                </div>
                                            {/each}
                                            {#each record.userIntents as ui}
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
</div>
