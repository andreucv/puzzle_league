<script module lang="ts">
    export interface UserResult {
        id: string;
        finishTime: Date | string | null;
        nPiecesCompleted: number | null;
        position: number | null;
        totalFinished: number;
        totalEntries: number;
        users: { id: string; name: string; image: string | null }[];
        externalParticipants: { id: string; name: string }[];
        category: {
            id: number;
            description: string;
            type: string;
            realStartTime: Date | string | null;
            puzzles: { pieces: number; brand: string; name: string | null }[];
        };
        competition: {
            id: number;
            name: string;
            startDate: Date | string;
            image_cld_id: string | null;
        };
    }
</script>

<script lang="ts">
    import { Avatar, Progress } from '@skeletonlabs/skeleton-svelte';
    import type { CategoryType } from '$prisma/browser';
    import { t, locale } from '$lib/translations';
    import { formatElapsedTime, getCategoryTypeIcon, getCategoryTypeName } from '$lib/utils/category_utils';
    import TrophyIcon from '@iconify-svelte/mdi/trophy';
    import MedalIcon from '@iconify-svelte/mdi/medal';
    import MedalOutlineIcon from '@iconify-svelte/mdi/medal-outline';
    import TrendingUpIcon from '@iconify-svelte/mdi/trending-up';

    // All results belong to the same competition (grouped by LastResultsList).
    let { results, currentUserId }: { results: UserResult[]; currentUserId: string } = $props();

    const competition = $derived(results[0].competition);
    const date = $derived(
        new Date(competition.startDate).toLocaleDateString(locale.get(), { day: 'numeric', month: 'short', year: 'numeric' })
    );

    // Podium icons/colors mirror the results page so the two views read alike.
    const PODIUM: Record<number, { icon: typeof TrophyIcon; classes: string }> = {
        1: { icon: TrophyIcon, classes: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400' },
        2: { icon: MedalIcon, classes: 'bg-blue-400/15 text-blue-500 dark:text-blue-300' },
        3: { icon: MedalOutlineIcon, classes: 'bg-amber-600/15 text-amber-700 dark:text-amber-500' }
    };

    // "9th" / "9º" / "9è": Intl picks the plural category, translations supply the suffix.
    const ordinalRules = $derived(new Intl.PluralRules($locale, { type: 'ordinal' }));
    const ordinal = (n: number) => `${n}${$t(`results.ordinal.${ordinalRules.select(n)}`)}`;

    // ponytail: rounded up to the next 10% ("9 of 25" → top 40%), hidden when it would read "top 100%".
    const topPercent = (position: number, total: number) => Math.ceil((position / total) * 10) * 10;

    function entryView(result: UserResult) {
        const total = result.category.puzzles[0]?.pieces ?? null;
        const placed = result.nPiecesCompleted;
        return {
            dnf: !result.finishTime,
            podium: result.position ? PODIUM[result.position] : undefined,
            puzzle: result.category.puzzles[0],
            total,
            placed,
            pct: placed != null && total ? Math.round((placed / total) * 100) : null,
            elapsed:
                result.finishTime && result.category.realStartTime
                    ? formatElapsedTime(new Date(result.category.realStartTime), new Date(result.finishTime))
                    : null,
            TypeIcon: getCategoryTypeIcon(result.category.type as CategoryType),
            teammates: [
                ...result.users.filter((u) => u.id !== currentUserId),
                ...result.externalParticipants.map((ep) => ({ ...ep, name: ep.name + ' *', image: null }))
            ]
        };
    }
</script>

<a href="/competitions/competition_details/{competition.id}/results" class="block group" data-testid="last-result-card-{competition.id}">
    <div class="card card-hover overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 p-3">
        <!-- Competition header -->
        <div class="flex items-baseline justify-between gap-2">
            <h3 class="font-bold text-surface-900 dark:text-surface-50 break-words group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-base sm:text-lg leading-tight">
                {competition.name}
            </h3>
            <span class="shrink-0 text-xs text-surface-500 dark:text-surface-400 whitespace-nowrap">{date}</span>
        </div>

        <!-- One compact row per category entry -->
        <ul class="mt-2 divide-y divide-surface-200 dark:divide-surface-700">
            {#each results as result (result.id)}
                {@const v = entryView(result)}
                <li class="flex items-center gap-3 py-2 first:pt-1 last:pb-0">
                    {#if v.dnf}
                        <div class="shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center leading-none bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-300">
                            <TrendingUpIcon width="1rem" height="1rem" />
                            <span class="text-[10px] font-bold tabular-nums">{v.pct != null ? `${v.pct}%` : $t('results.dnf')}</span>
                        </div>
                    {:else if v.podium}
                        <div class="shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center leading-none {v.podium.classes}">
                            <v.podium.icon width="1.1rem" height="1.1rem" />
                            <span class="text-[10px] font-bold tabular-nums">{result.position}</span>
                        </div>
                    {:else}
                        <div class="shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center leading-none bg-surface-200 text-surface-700 dark:bg-surface-700 dark:text-surface-200">
                            <span class="text-base font-bold tabular-nums">{result.position}</span>
                            <span class="text-[9px] font-semibold text-surface-500 dark:text-surface-400">/{result.totalFinished}</span>
                        </div>
                    {/if}

                    <div class="flex-1 min-w-0 space-y-1">
                        <!-- Hero line: time + rank, or pieces placed for unfinished runs -->
                        <div class="flex items-baseline gap-2 min-w-0">
                            {#if v.dnf && v.placed != null && v.total}
                                <span class="text-lg font-bold leading-none tabular-nums text-primary-700 dark:text-primary-300">{v.placed.toLocaleString()}</span>
                                <span class="text-xs text-surface-500 dark:text-surface-400 truncate">/ {v.total.toLocaleString()} {$t('results.pieces')}</span>
                            {:else if v.dnf}
                                <!-- No pieces count: encouragement sits beside the DNF hero and wraps -->
                                <span class="shrink-0 text-lg font-bold leading-none text-primary-700 dark:text-primary-300">{$t('results.dnf')}</span>
                                <span class="min-w-0 text-xs leading-snug font-medium text-warning-700 dark:text-warning-300">{$t('results.landing_dnf_generic')}</span>
                            {:else}
                                <span class="text-lg font-bold leading-none tabular-nums text-primary-700 dark:text-primary-300">{v.elapsed}</span>
                                {#if result.position}
                                    {@const top = topPercent(result.position, result.totalFinished)}
                                    <span class="text-xs text-surface-500 dark:text-surface-400 truncate">
                                        <strong class="font-bold text-surface-900 dark:text-surface-50">{ordinal(result.position)}</strong>
                                        {$t('results.landing_rank_of', { total: result.totalFinished })}{#if top < 100}{' · '}{$t('results.landing_top', { percent: top })}{/if}
                                    </span>
                                {/if}
                            {/if}
                        </div>

                        {#if v.dnf && v.placed != null && v.total}
                            <!-- DNF label + encouragement copy, wrapping beside the label -->
                            <div class="flex items-start gap-1.5 min-w-0 text-xs">
                                <span class="shrink-0 px-1.5 py-px rounded-full font-semibold bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300">{$t('results.dnf')}</span>
                                <span class="min-w-0 leading-snug font-medium text-warning-700 dark:text-warning-300">
                                    {$t('results.landing_dnf_encourage', { count: Math.max(v.total - v.placed, 0) })}
                                </span>
                            </div>
                        {/if}

                        <!-- Meta line: category · puzzle · teammates -->
                        <div class="flex items-center gap-1.5 min-w-0 text-xs text-surface-600 dark:text-surface-400">
                            <v.TypeIcon width="0.85rem" height="0.85rem" class="shrink-0 text-primary-700 dark:text-primary-300" />
                            <span class="font-medium text-surface-900 dark:text-surface-50 shrink-0">{$t(getCategoryTypeName(result.category.type as CategoryType))}</span>
                            {#if v.puzzle}
                                <span class="truncate">· {v.puzzle.pieces} {$t('results.pieces')} {v.puzzle.brand}</span>
                            {/if}
                            {#if v.teammates.length > 0}
                                <span class="flex shrink-0 ml-auto">
                                    {#each v.teammates as mate, i (mate.id)}
                                        <Avatar class="w-5 h-5 ring-2 ring-surface-50 dark:ring-surface-800 {i > 0 ? '-ml-1.5' : ''}">
                                            {#if mate.image}<Avatar.Image src={mate.image} alt={mate.name} />{/if}
                                            <Avatar.Fallback class="text-[0.5rem]" title={mate.name}>{mate.name.substring(0, 2)}</Avatar.Fallback>
                                        </Avatar>
                                    {/each}
                                </span>
                            {/if}
                        </div>

                        {#if v.dnf && v.pct != null}
                            <Progress value={v.placed} max={v.total}>
                                <Progress.Track class="h-1 bg-surface-200 dark:bg-surface-700">
                                    <Progress.Range class="bg-warning-500" />
                                </Progress.Track>
                            </Progress>
                        {/if}
                    </div>
                </li>
            {/each}
        </ul>
    </div>
</a>
